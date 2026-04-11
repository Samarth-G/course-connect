import {
  STUDY_ROOMS,
  createStudySession,
  deleteStudySession,
  getConflictingStudySession,
  getStudySessionById,
  listSessionsByRoomForWeek,
  normalizeWeekStart,
  updateStudySession,
} from "../services/sessionService.js";
import { getIO } from "../socket.js";

const TITLE_MAX_LENGTH = 140;
const MIN_SESSION_MINUTES = 15;
const MAX_SESSION_MINUTES = 8 * 60;
const CALENDAR_START_HOUR = 7;
const CALENDAR_END_HOUR = 22;
const MIN_TIMEZONE_OFFSET_MINUTES = -14 * 60;
const MAX_TIMEZONE_OFFSET_MINUTES = 14 * 60;

function normalizeMinutesOfDay(minutes) {
  const minutesPerDay = 24 * 60;
  return ((minutes % minutesPerDay) + minutesPerDay) % minutesPerDay;
}

function getMinutesOfDayInOffset(dateValue, timezoneOffsetMinutes) {
  const utcMinutes = dateValue.getUTCHours() * 60 + dateValue.getUTCMinutes();
  return normalizeMinutesOfDay(utcMinutes - timezoneOffsetMinutes);
}

function getLocalDateKeyInOffset(dateValue, timezoneOffsetMinutes) {
  const localTime = new Date(dateValue.getTime() - timezoneOffsetMinutes * 60 * 1000);
  return `${localTime.getUTCFullYear()}-${localTime.getUTCMonth()}-${localTime.getUTCDate()}`;
}

function areSessionTimesWithinCalendarRange(startAt, endAt, timezoneOffsetMinutes) {
  const startMinutes = getMinutesOfDayInOffset(startAt, timezoneOffsetMinutes);
  const endMinutes = getMinutesOfDayInOffset(endAt, timezoneOffsetMinutes);
  const startLocalDate = getLocalDateKeyInOffset(startAt, timezoneOffsetMinutes);
  const endLocalDate = getLocalDateKeyInOffset(endAt, timezoneOffsetMinutes);
  const rangeStartMinutes = CALENDAR_START_HOUR * 60;
  const rangeEndMinutes = CALENDAR_END_HOUR * 60;

  if (startLocalDate !== endLocalDate) {
    return false;
  }

  return (
    startMinutes >= rangeStartMinutes &&
    startMinutes <= rangeEndMinutes &&
    endMinutes >= rangeStartMinutes &&
    endMinutes <= rangeEndMinutes
  );
}

function parseTimezoneOffsetMinutes(value) {
  if (value === undefined || value === null || value === "") {
    return { value: 0 };
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return { error: "timeZoneOffsetMinutes must be a valid number" };
  }

  const rounded = Math.round(parsed);
  if (rounded < MIN_TIMEZONE_OFFSET_MINUTES || rounded > MAX_TIMEZONE_OFFSET_MINUTES) {
    return {
      error: `timeZoneOffsetMinutes must be between ${MIN_TIMEZONE_OFFSET_MINUTES} and ${MAX_TIMEZONE_OFFSET_MINUTES}`,
    };
  }

  return { value: rounded };
}

function isValidRoom(room) {
  return STUDY_ROOMS.some((candidateRoom) => candidateRoom.toLowerCase() === String(room).trim().toLowerCase());
}

function parseDateTime(value) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function buildSessionPayload(body) {
  const normalizedRoom = String(body.room ?? "").trim();
  const normalizedTitle = String(body.title ?? "").trim();
  const parsedStartAt = parseDateTime(body.startAt);
  const parsedEndAt = parseDateTime(body.endAt);
  const timezoneOffsetResult = parseTimezoneOffsetMinutes(body.timeZoneOffsetMinutes);

  if (!normalizedRoom || !normalizedTitle || !parsedStartAt || !parsedEndAt) {
    return { error: "room, title, startAt, and endAt are required" };
  }

  if (timezoneOffsetResult.error) {
    return { error: timezoneOffsetResult.error };
  }

  if (!isValidRoom(normalizedRoom)) {
    return { error: "Invalid study room selected" };
  }

  if (normalizedTitle.length > TITLE_MAX_LENGTH) {
    return { error: `title must be ${TITLE_MAX_LENGTH} characters or fewer` };
  }

  if (parsedEndAt <= parsedStartAt) {
    return { error: "endAt must be after startAt" };
  }

  if (!areSessionTimesWithinCalendarRange(parsedStartAt, parsedEndAt, timezoneOffsetResult.value)) {
    return { error: "Session startAt and endAt must be between 7:00 AM and 10:00 PM" };
  }

  const sessionMinutes = Math.round((parsedEndAt.getTime() - parsedStartAt.getTime()) / (1000 * 60));
  if (sessionMinutes < MIN_SESSION_MINUTES || sessionMinutes > MAX_SESSION_MINUTES) {
    return { error: `Session length must be between ${MIN_SESSION_MINUTES} and ${MAX_SESSION_MINUTES} minutes` };
  }

  return {
    payload: {
      room: normalizedRoom,
      title: normalizedTitle,
      startAt: parsedStartAt,
      endAt: parsedEndAt,
    },
    timezoneOffsetMinutes: timezoneOffsetResult.value,
  };
}

function buildUpdatePayload(body) {
  const payload = {};
  const timezoneOffsetResult = parseTimezoneOffsetMinutes(body.timeZoneOffsetMinutes);

  if (timezoneOffsetResult.error) {
    return { error: timezoneOffsetResult.error };
  }

  if (body.room !== undefined) {
    const normalizedRoom = String(body.room).trim();
    if (!normalizedRoom) {
      return { error: "room cannot be empty" };
    }
    if (!isValidRoom(normalizedRoom)) {
      return { error: "Invalid study room selected" };
    }
    payload.room = normalizedRoom;
  }

  if (body.title !== undefined) {
    const normalizedTitle = String(body.title).trim();
    if (!normalizedTitle) {
      return { error: "title cannot be empty" };
    }
    if (normalizedTitle.length > TITLE_MAX_LENGTH) {
      return { error: `title must be ${TITLE_MAX_LENGTH} characters or fewer` };
    }
    payload.title = normalizedTitle;
  }

  if (body.startAt !== undefined) {
    const parsedStart = parseDateTime(body.startAt);
    if (!parsedStart) {
      return { error: "startAt must be a valid date-time" };
    }
    payload.startAt = parsedStart;
  }

  if (body.endAt !== undefined) {
    const parsedEnd = parseDateTime(body.endAt);
    if (!parsedEnd) {
      return { error: "endAt must be a valid date-time" };
    }
    payload.endAt = parsedEnd;
  }

  if (Object.keys(payload).length === 0) {
    return { error: "Provide at least one field to update" };
  }

  return { payload, timezoneOffsetMinutes: timezoneOffsetResult.value };
}

function canManageSession(session, user) {
  if (!session || !user) {
    return false;
  }
  return user.role === "admin" || String(user.id) === String(session.authorId);
}

export async function listStudySessions(req, res) {
  const requestedRoom = String(req.query.room ?? STUDY_ROOMS[0]).trim();
  const normalizedRoom = isValidRoom(requestedRoom) ? requestedRoom : STUDY_ROOMS[0];
  const normalizedWeekStart = normalizeWeekStart(String(req.query.weekStart ?? ""));

  if (!normalizedWeekStart) {
    return res.status(400).json({
      error: "weekStart must be a valid date",
    });
  }

  try {
    const results = await listSessionsByRoomForWeek(normalizedRoom, normalizedWeekStart);
    return res.status(200).json({
      room: normalizedRoom,
      rooms: STUDY_ROOMS,
      weekStart: normalizedWeekStart.toISOString(),
      count: results.length,
      results,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to list study sessions",
    });
  }
}

export async function createStudySessionEntry(req, res) {
  const payloadResult = buildSessionPayload(req.body ?? {});
  if (payloadResult.error) {
    return res.status(400).json({ error: payloadResult.error });
  }

  const payload = payloadResult.payload;

  try {
    const existingConflict = await getConflictingStudySession(
      payload.room,
      payload.startAt,
      payload.endAt
    );

    if (existingConflict) {
      return res.status(409).json({
        error: "Session conflicts with an existing booking in this room",
      });
    }

    const createdSession = await createStudySession({
      ...payload,
      authorId: String(req.user?.id ?? "").trim(),
      authorName: String(req.user?.name ?? "Anonymous").trim() || "Anonymous",
      authorProfileImage: String(req.user?.profileImage ?? ""),
    });

    const io = getIO();
    if (io) io.emit("session:created", createdSession);

    return res
      .status(201)
      .location(`/api/sessions/${createdSession.id}`)
      .json({
        message: "Study session created successfully",
        session: createdSession,
      });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to create study session",
    });
  }
}

export async function updateStudySessionEntry(req, res) {
  const { sessionId } = req.params;

  try {
    const existingSession = await getStudySessionById(sessionId);

    if (!existingSession) {
      return res.status(404).json({ error: "Study session not found" });
    }

    if (!canManageSession(existingSession, req.user)) {
      return res.status(403).json({ error: "You can only edit your own sessions" });
    }

    const updateResult = buildUpdatePayload(req.body ?? {});
    if (updateResult.error) {
      return res.status(400).json({ error: updateResult.error });
    }

    const nextRoom = updateResult.payload.room ?? existingSession.room;
    const nextStartAt = updateResult.payload.startAt ?? new Date(existingSession.startAt);
    const nextEndAt = updateResult.payload.endAt ?? new Date(existingSession.endAt);

    if (nextEndAt <= nextStartAt) {
      return res.status(400).json({ error: "endAt must be after startAt" });
    }

    if (!areSessionTimesWithinCalendarRange(nextStartAt, nextEndAt, updateResult.timezoneOffsetMinutes)) {
      return res.status(400).json({
        error: "Session startAt and endAt must be between 7:00 AM and 10:00 PM",
      });
    }

    const sessionMinutes = Math.round((nextEndAt.getTime() - nextStartAt.getTime()) / (1000 * 60));
    if (sessionMinutes < MIN_SESSION_MINUTES || sessionMinutes > MAX_SESSION_MINUTES) {
      return res.status(400).json({
        error: `Session length must be between ${MIN_SESSION_MINUTES} and ${MAX_SESSION_MINUTES} minutes`,
      });
    }

    const existingConflict = await getConflictingStudySession(
      nextRoom,
      nextStartAt,
      nextEndAt,
      sessionId
    );

    if (existingConflict) {
      return res.status(409).json({
        error: "Session conflicts with an existing booking in this room",
      });
    }

    const updatedSession = await updateStudySession(sessionId, {
      ...updateResult.payload,
      room: nextRoom,
      startAt: nextStartAt,
      endAt: nextEndAt,
    });

    if (!updatedSession) {
      return res.status(404).json({ error: "Study session not found" });
    }

    const io = getIO();
    if (io) io.emit("session:updated", updatedSession);

    return res.status(200).json({
      message: "Study session updated successfully",
      session: updatedSession,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to update study session",
    });
  }
}

export async function deleteStudySessionEntry(req, res) {
  const { sessionId } = req.params;

  try {
    const existingSession = await getStudySessionById(sessionId);

    if (!existingSession) {
      return res.status(404).json({ error: "Study session not found" });
    }

    if (!canManageSession(existingSession, req.user)) {
      return res.status(403).json({ error: "You can only delete your own sessions" });
    }

    const deleted = await deleteStudySession(sessionId);
    if (!deleted) {
      return res.status(404).json({ error: "Study session not found" });
    }

    const io = getIO();
    if (io) io.emit("session:deleted", { sessionId, room: existingSession.room });

    return res.status(200).json({
      message: "Study session deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to delete study session",
    });
  }
}