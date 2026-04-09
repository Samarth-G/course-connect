import Thread from "../models/threadModel.js";

export async function saveCourseThread(threadData) {
  const createdThread = await Thread.create(threadData);
  return createdThread.toJSON();
}

function toCourseLabel(courseId) {
  return String(courseId || "")
    .trim()
    .toUpperCase()
    .replace(/-/g, " ");
}

function toCourseDescription(latestBody = "") {
  const normalized = String(latestBody).replace(/\s+/g, " ").trim();
  if (!normalized) {
    return "Latest discussion activity is available in this course.";
  }
  if (normalized.length <= 110) {
    return normalized;
  }
  return `${normalized.slice(0, 107)}...`;
}

export async function listCoursesFromDb(searchTerm = "") {
  const normalizedSearchTerm = String(searchTerm).trim().toUpperCase();

  const groupedCourses = await Thread.aggregate([
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

  const mappedCourses = groupedCourses
    .map((course) => {
      const id = String(course._id || "").trim();
      if (!id) {
        return null;
      }

      return {
        id,
        label: toCourseLabel(id),
        title: toCourseLabel(id),
        description: toCourseDescription(course.latestBody),
        threadCount: Number(course.threadCount) || 0,
        latestCreatedAt: course.latestCreatedAt || null,
      };
    })
    .filter(Boolean);

  if (!normalizedSearchTerm) {
    return mappedCourses;
  }

  return mappedCourses.filter((course) => {
    return (
      course.id.includes(normalizedSearchTerm)
      || course.label.includes(normalizedSearchTerm)
      || course.description.toUpperCase().includes(normalizedSearchTerm)
    );
  });
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function searchCourseThreadsFromDb(courseId, searchTerm = "", options = {}) {
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

  return {
    results: results.map((thread) => thread.toJSON()),
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export async function getCourseThreadById(courseId, threadId) {
  const thread = await Thread.findOne({
    _id: threadId,
    courseId: { $regex: `^${escapeRegex(String(courseId).trim())}$`, $options: "i" },
  });

  return thread ? thread.toJSON() : null;
}

export async function updateCourseThreadById(courseId, threadId, updateData) {
  const updated = await Thread.findOneAndUpdate(
    {
      _id: threadId,
      courseId: { $regex: `^${escapeRegex(String(courseId).trim())}$`, $options: "i" },
    },
    updateData,
    { returnDocument: "after", runValidators: true },
  );

  return updated ? updated.toJSON() : null;
}

export async function deleteCourseThreadById(courseId, threadId) {
  const deleted = await Thread.findOneAndDelete({
    _id: threadId,
    courseId: { $regex: `^${escapeRegex(String(courseId).trim())}$`, $options: "i" },
  });

  return Boolean(deleted);
}
