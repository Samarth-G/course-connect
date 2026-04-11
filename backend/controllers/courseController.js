import { getCourseById, listCoursesFromDb, saveCourse, updateCourse, deleteCourse } from "../services/courseService.js";

const COURSE_ID_MAX_LENGTH = 50;
const COURSE_TITLE_MAX_LENGTH = 200;
const COURSE_DESCRIPTION_MAX_LENGTH = 1000;

export async function listCourses(req, res) {
  const { q = "" } = req.query;

  if (typeof q !== "string") {
    return res.status(400).json({
      error: "q must be a string",
    });
  }

  try {
    const results = await listCoursesFromDb(q);
    return res.status(200).json({
      count: results.length,
      results,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to list courses",
    });
  }
}

export async function createCourse(req, res) {
  const { courseId, title, description = "" } = req.body;

  if (typeof courseId !== "string" || typeof title !== "string" || typeof description !== "string") {
    return res.status(400).json({
      error: "courseId, title, and description must be strings",
    });
  }

  const normalizedCourseId = courseId.trim();
  const normalizedTitle = title.trim();
  const normalizedDescription = description.trim();

  if (!normalizedCourseId || !normalizedTitle) {
    return res.status(400).json({
      error: "courseId and title are required",
    });
  }

  if (normalizedCourseId.length > COURSE_ID_MAX_LENGTH) {
    return res.status(400).json({
      error: `courseId must be ${COURSE_ID_MAX_LENGTH} characters or fewer`,
    });
  }

  if (normalizedTitle.length > COURSE_TITLE_MAX_LENGTH) {
    return res.status(400).json({
      error: `title must be ${COURSE_TITLE_MAX_LENGTH} characters or fewer`,
    });
  }

  if (normalizedDescription.length > COURSE_DESCRIPTION_MAX_LENGTH) {
    return res.status(400).json({
      error: `description must be ${COURSE_DESCRIPTION_MAX_LENGTH} characters or fewer`,
    });
  }

  try {
    const existingCourse = await getCourseById(normalizedCourseId);
    if (existingCourse) {
      return res.status(409).json({
        error: "Course already exists",
      });
    }

    const createdCourse = await saveCourse({
      courseId: normalizedCourseId,
      title: normalizedTitle,
      description: normalizedDescription,
    });

    return res.status(201).json(createdCourse);
  } catch (error) {
    return res.status(500).json({
      error: "Failed to create course",
    });
  }
}

export async function updateCourseHandler(req, res) {
  const { courseId } = req.params;
  const { title, description } = req.body;
  const updateData = {};

  if (title !== undefined) {
    const normalizedTitle = String(title).trim();
    if (!normalizedTitle || normalizedTitle.length > COURSE_TITLE_MAX_LENGTH) {
      return res.status(400).json({ error: `title must be 1-${COURSE_TITLE_MAX_LENGTH} characters` });
    }
    updateData.title = normalizedTitle;
  }

  if (description !== undefined) {
    const normalizedDescription = String(description).trim();
    if (normalizedDescription.length > COURSE_DESCRIPTION_MAX_LENGTH) {
      return res.status(400).json({ error: `description must be ${COURSE_DESCRIPTION_MAX_LENGTH} characters or fewer` });
    }
    updateData.description = normalizedDescription;
  }

  if (Object.keys(updateData).length === 0) {
    return res.status(400).json({ error: "Provide at least one field to update" });
  }

  try {
    const updated = await updateCourse(courseId, updateData);
    if (!updated) {
      return res.status(404).json({ error: "Course not found" });
    }
    return res.status(200).json({ message: "Course updated", course: updated });
  } catch (error) {
    return res.status(500).json({ error: "Failed to update course" });
  }
}

export async function deleteCourseHandler(req, res) {
  const { courseId } = req.params;

  try {
    const deleted = await deleteCourse(courseId);
    if (!deleted) {
      return res.status(404).json({ error: "Course not found" });
    }
    return res.status(200).json({ message: "Course deleted" });
  } catch (error) {
    return res.status(500).json({ error: "Failed to delete course" });
  }
}

export async function getCourse(req, res) {
  const { courseId } = req.params;

  try {
    const course = await getCourseById(courseId);

    if (!course) {
      return res.status(404).json({
        error: "Course not found",
      });
    }

    return res.status(200).json({ course });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to get course",
    });
  }
}