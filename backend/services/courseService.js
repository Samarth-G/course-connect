import {
  createCourse,
  findCourseByCourseId,
  findCoursesBySearch,
} from "../repositories/courseRepository.js";

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
  const createdCourse = await createCourse(courseData);
  return mapCourse(createdCourse.toJSON());
}

export async function getCourseById(courseId) {
  const course = await findCourseByCourseId(courseId);

  return course ? mapCourse(course.toJSON()) : null;
}

export async function listCoursesFromDb(searchTerm = "") {
  const courses = await findCoursesBySearch(searchTerm);
  return courses.map((course) => mapCourse(course.toJSON()));
}