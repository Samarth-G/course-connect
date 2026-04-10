import Thread from "../models/threadModel.js";

export async function createThread(threadData) {
  return Thread.create(threadData);
}

export async function findThreadsByCourseAndTitlePairs(courseTitlePairs) {
  if (!Array.isArray(courseTitlePairs) || courseTitlePairs.length === 0) {
    return [];
  }

  return Thread.find(
    {
      $or: courseTitlePairs,
    },
    { courseId: 1, title: 1 },
  ).lean();
}

export async function insertManyThreads(threadDocuments) {
  return Thread.insertMany(threadDocuments);
}

export async function addReplyToThreadByCourseAndId(courseId, threadId, replyData) {
  return Thread.findOneAndUpdate(
    {
      _id: threadId,
      courseId: { $regex: `^${escapeRegex(String(courseId).trim())}$`, $options: "i" },
    },
    {
      $push: {
        replies: replyData,
      },
    },
    { returnDocument: "after", runValidators: true },
  );
}

export async function aggregateCourses() {
  return Thread.aggregate([
    {
      $project: {
        courseIdUpper: { $toUpper: "$courseId" },
        body: 1,
        createdAt: 1,
      },
    },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: "$courseIdUpper",
        threadCount: { $sum: 1 },
        latestBody: { $first: "$body" },
        latestCreatedAt: { $first: "$createdAt" },
      },
    },
    { $sort: { _id: 1 } },
  ]);
}

export async function searchThreadsByCourse(courseId, searchTerm = "", options = {}) {
  const { page = 1, limit = 20 } = options;
  const normalizedCourseId = String(courseId).trim().toLowerCase();
  const normalizedSearchTerm = String(searchTerm).trim().toLowerCase();
  const skip = (page - 1) * limit;

  const query = {
    courseId: { $regex: `^${escapeRegex(normalizedCourseId)}$`, $options: "i" },
  };

  if (normalizedSearchTerm) {
    const safeSearch = escapeRegex(normalizedSearchTerm);
    query.$or = [
      { title: { $regex: safeSearch, $options: "i" } },
      { body: { $regex: safeSearch, $options: "i" } },
    ];
  }

  const [results, total] = await Promise.all([
    Thread.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Thread.countDocuments(query),
  ]);

  return { results, total, page, limit };
}

export async function findThreadByCourseAndId(courseId, threadId) {
  return Thread.findOne({
    _id: threadId,
    courseId: { $regex: `^${escapeRegex(String(courseId).trim())}$`, $options: "i" },
  });
}

export async function updateThreadByCourseAndId(courseId, threadId, updateData) {
  return Thread.findOneAndUpdate(
    {
      _id: threadId,
      courseId: { $regex: `^${escapeRegex(String(courseId).trim())}$`, $options: "i" },
    },
    updateData,
    { returnDocument: "after", runValidators: true },
  );
}

export async function deleteThreadByCourseAndId(courseId, threadId) {
  return Thread.findOneAndDelete({
    _id: threadId,
    courseId: { $regex: `^${escapeRegex(String(courseId).trim())}$`, $options: "i" },
  });
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
