import {
  addReplyToThreadByCourseAndId,
  aggregateCourses,
  createThread,
  deleteThreadByCourseAndId,
  findThreadByCourseAndId,
  searchThreadsByCourse,
  updateThreadByCourseAndId,
} from "../repositories/courseThreadRepository.js";

export async function saveCourseThread(threadData) {
  const createdThread = await createThread(threadData);
  return createdThread.toJSON();
}

export async function addReplyToCourseThreadById(courseId, threadId, replyData) {
  const updated = await addReplyToThreadByCourseAndId(courseId, threadId, replyData);

  return updated ? updated.toJSON() : null;
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

  const groupedCourses = await aggregateCourses();

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

export async function searchCourseThreadsFromDb(courseId, searchTerm = "", options = {}) {
  const { page = 1, limit = 20 } = options;

  const { results, total } = await searchThreadsByCourse(courseId, searchTerm, {
    page,
    limit,
  });

  return {
    results: results.map((thread) => thread.toJSON()),
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export async function getCourseThreadById(courseId, threadId) {
  const thread = await findThreadByCourseAndId(courseId, threadId);

  return thread ? thread.toJSON() : null;
}

export async function updateCourseThreadById(courseId, threadId, updateData) {
  const updated = await updateThreadByCourseAndId(courseId, threadId, updateData);

  return updated ? updated.toJSON() : null;
}

export async function deleteCourseThreadById(courseId, threadId) {
  const deleted = await deleteThreadByCourseAndId(courseId, threadId);

  return Boolean(deleted);
}
