import { saveCourseThread } from "../services/courseThreadService.js";

export async function createCourseThread(req, res) {
  const { courseId } = req.params;
  const { title, body, authorId, tags } = req.body;

  // Validate that title and body are actual strings before normalization
  if (typeof title !== "string" || typeof body !== "string") {
    return res.status(400).json({
      error: "title and body must be non-empty strings",
    });
  }

  const normalizedTitle = title.trim();
  const normalizedBody = body.trim();
  if (normalizedTitle.length === 0 || normalizedBody.length === 0 || !authorId) {
    return res.status(400).json({
      error: "title, body, and authorId are required",
    });
  }
  
  try {
    const newThread = await saveCourseThread({
      courseId,
      title: normalizedTitle,
      body: normalizedBody,
      authorId: String(authorId),
      tags: Array.isArray(tags) ? tags : [],
    });

    return res
      .status(201)
      .location(`/api/courses/${courseId}/threads/${newThread.id}`)
      .json({
        message: "Thread created successfully",
        thread: newThread,
      });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to save thread",
    });
  }
}
