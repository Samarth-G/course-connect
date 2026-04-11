import Course from "../models/courseModel.js";

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function createCourse(courseData) {
  return Course.create(courseData);
}

export async function findCourseByCourseId(courseId) {
  return Course.findOne({
    courseId: { $regex: `^${escapeRegex(String(courseId).trim())}$`, $options: "i" },
  });
}

export async function findCoursesBySearch(searchTerm = "") {
  const normalizedSearchTerm = String(searchTerm).trim();
  const query = {};

  if (normalizedSearchTerm) {
    const escapedSearchTerm = escapeRegex(normalizedSearchTerm);

    query.$or = [
      { courseId: { $regex: escapedSearchTerm, $options: "i" } },
      { title: { $regex: escapedSearchTerm, $options: "i" } },
      { description: { $regex: escapedSearchTerm, $options: "i" } },
    ];
  }

  return Course.find(query).sort({ createdAt: -1 });
}

export async function updateCourseByCourseId(courseId, updateData) {
  return Course.findOneAndUpdate(
    { courseId: { $regex: `^${escapeRegex(String(courseId).trim())}$`, $options: "i" } },
    updateData,
    { new: true, runValidators: true },
  );
}

export async function deleteCourseByCourseId(courseId) {
  return Course.findOneAndDelete({
    courseId: { $regex: `^${escapeRegex(String(courseId).trim())}$`, $options: "i" },
  });
}