import {
  createSession,
  deleteSessionById,
  findConflictingSession,
  findSessionById,
  findSessionsByRoomAndRange,
  updateSessionById,
} from "../repositories/sessionRepository.js";

export const STUDY_ROOMS = ["Room 117", "Room 204", "Room 312"];

export function normalizeWeekStart(inputWeekStart = "") {
  const normalizedInput = String(inputWeekStart).trim();
  const sourceDate = normalizedInput
    ? /^\d{4}-\d{2}-\d{2}$/.test(normalizedInput)
      ? new Date(`${normalizedInput}T00:00:00`)
      : new Date(normalizedInput)
    : new Date();
  if (Number.isNaN(sourceDate.getTime())) {
    return null;
  }

  const weekDate = new Date(sourceDate);
  weekDate.setHours(0, 0, 0, 0);
  const day = weekDate.getDay();
  const distanceToMonday = day === 0 ? 6 : day - 1;
  weekDate.setDate(weekDate.getDate() - distanceToMonday);
  return weekDate;
}

export function buildWeekRange(weekStart) {
  const rangeStart = new Date(weekStart);
  const rangeEnd = new Date(weekStart);
  rangeEnd.setDate(rangeEnd.getDate() + 7);
  return { rangeStart, rangeEnd };
}

export async function listSessionsByRoomForWeek(room, weekStart) {
  const { rangeStart, rangeEnd } = buildWeekRange(weekStart);
  const sessions = await findSessionsByRoomAndRange(room, rangeStart, rangeEnd);
  return sessions.map((session) => session.toJSON());
}

export async function createStudySession(sessionData) {
  const created = await createSession(sessionData);
  return created.toJSON();
}

export async function getStudySessionById(sessionId) {
  const session = await findSessionById(sessionId);
  return session ? session.toJSON() : null;
}

export async function getConflictingStudySession(room, startAt, endAt, excludeSessionId = "") {
  const conflict = await findConflictingSession(room, startAt, endAt, excludeSessionId);
  return conflict ? conflict.toJSON() : null;
}

export async function updateStudySession(sessionId, updateData) {
  const updated = await updateSessionById(sessionId, updateData);
  return updated ? updated.toJSON() : null;
}

export async function deleteStudySession(sessionId) {
  const deleted = await deleteSessionById(sessionId);
  return Boolean(deleted);
}