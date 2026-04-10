import Course from "../models/courseModel.js";

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function mapCourse(course) {
  const normalizedCourseId = String(course.courseId || "").trim();

  return {
    id: normalizedCourseId,
    courseId: normalizedCourseId,
    label: normalizedCourseId,
    title: course.title,
    description: course.description || "",
    createdAt: course.createdAt,
    updatedAt: course.updatedAt,
  };
}

export async function saveCourse(courseData) {
  const createdCourse = await Course.create(courseData);
  return mapCourse(createdCourse.toJSON());
}

export async function getCourseById(courseId) {
  const course = await Course.findOne({
    courseId: { $regex: `^${escapeRegex(String(courseId).trim())}$`, $options: "i" },
  });

  return course ? mapCourse(course.toJSON()) : null;
}

export async function listCoursesFromDb(searchTerm = "") {
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

  const courses = await Course.find(query).sort({ createdAt: -1 });
  return courses.map((course) => mapCourse(course.toJSON()));
}