import { saveCourseThread } from "../services/courseThreadService.js";

export async function createCourseThread(req, res) {
  const { courseId } = req.params;
  const { title, body, authorId, tags } = req.body;


  const normalizedTitle = String(title).trim();
  const normalizedBody = String(body).trim();
  if (!normalizedTitle || !normalizedBody || !authorId) {
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
