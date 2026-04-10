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
  const normalizedSearchTerm = String(searchTerm).trim().toUpperCase();

  const courses = await Course.find({}).sort({ createdAt: -1 });
  const mappedCourses = courses.map((course) => mapCourse(course.toJSON()));

  if (!normalizedSearchTerm) {
    return mappedCourses;
  }

  return mappedCourses.filter((course) => {
    return (
      course.id.toUpperCase().includes(normalizedSearchTerm)
      || course.label.toUpperCase().includes(normalizedSearchTerm)
      || course.title.toUpperCase().includes(normalizedSearchTerm)
      || course.description.toUpperCase().includes(normalizedSearchTerm)
    );
  });
}