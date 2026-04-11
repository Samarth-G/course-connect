import Session from "../models/sessionModel.js";

export async function findSessionsByRoomAndRange(room, rangeStart, rangeEnd) {
  return Session.find({
    room: { $regex: `^${escapeRegex(String(room).trim())}$`, $options: "i" },
    startAt: { $lt: rangeEnd },
    endAt: { $gt: rangeStart },
  }).sort({ startAt: 1 });
}

export async function createSession(sessionData) {
  return Session.create(sessionData);
}

export async function findSessionById(sessionId) {
  return Session.findById(sessionId);
}

export async function findConflictingSession(room, startAt, endAt, excludeSessionId = "") {
  const query = {
    room: { $regex: `^${escapeRegex(String(room).trim())}$`, $options: "i" },
    startAt: { $lt: endAt },
    endAt: { $gt: startAt },
  };

  if (excludeSessionId) {
    query._id = { $ne: excludeSessionId };
  }

  return Session.findOne(query);
}

export async function updateSessionById(sessionId, updateData) {
  return Session.findByIdAndUpdate(
    sessionId,
    updateData,
    { returnDocument: "after", runValidators: true }
  );
}

export async function deleteSessionById(sessionId) {
  return Session.findByIdAndDelete(sessionId);
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}