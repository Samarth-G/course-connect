import {
  saveCourseThread,
  searchCourseThreadsFromDb,
} from "../services/courseThreadService.js";

const TITLE_MAX_LENGTH = 200;
const BODY_MAX_LENGTH = 5000;
const TAG_MAX_LENGTH = 30;
const TAGS_MAX_COUNT = 10;

export async function searchCourseThreads(req, res) {
  const { courseId } = req.params;
  const { q = "", page = "1", limit = "20" } = req.query;

  if (typeof q !== "string") {
    return res.status(400).json({
      error: "q must be a string",
    });
  }

  const parsedPage = Number.parseInt(String(page), 10);
  const parsedLimit = Number.parseInt(String(limit), 10);
  const safePage = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const safeLimit = Number.isInteger(parsedLimit) && parsedLimit > 0
    ? Math.min(parsedLimit, 100)
    : 20;

  try {
    const searchPayload = await searchCourseThreadsFromDb(courseId, q, {
      page: safePage,
      limit: safeLimit,
    });

    return res.status(200).json({
      query: q,
      count: searchPayload.results.length,
      total: searchPayload.total,
      page: searchPayload.page,
      limit: searchPayload.limit,
      totalPages: searchPayload.totalPages,
      results: searchPayload.results,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to search threads",
    });
  }
}

export async function createCourseThread(req, res) {
  const { courseId } = req.params;
  const { title, body, tags } = req.body;

  // Validate that title and body are actual strings before normalization
  if (typeof title !== "string" || typeof body !== "string") {
    return res.status(400).json({
      error: "title and body must be non-empty strings",
    });
  }

  const normalizedTitle = title.trim();
  const normalizedBody = body.trim();
  const normalizedAuthorId = String(req.user?.id ?? "").trim();

  if (normalizedTitle.length === 0 || normalizedBody.length === 0 || !normalizedAuthorId) {
    return res.status(400).json({
      error: "title and body are required",
    });
  }

  if (normalizedTitle.length > TITLE_MAX_LENGTH) {
    return res.status(400).json({
      error: `title must be ${TITLE_MAX_LENGTH} characters or fewer`,
    });
  }

  if (normalizedBody.length > BODY_MAX_LENGTH) {
    return res.status(400).json({
      error: `body must be ${BODY_MAX_LENGTH} characters or fewer`,
    });
  }

  if (tags !== undefined && !Array.isArray(tags)) {
    return res.status(400).json({
      error: "tags must be an array when provided",
    });
  }

  const normalizedTags = (Array.isArray(tags) ? tags : [])
    .map((tag) => String(tag).trim())
    .filter(Boolean)
    .slice(0, TAGS_MAX_COUNT)
    .map((tag) => tag.slice(0, TAG_MAX_LENGTH));
  
  try {
    const newThread = await saveCourseThread({
      courseId: String(courseId).trim(),
      title: normalizedTitle,
      body: normalizedBody,
      authorId: normalizedAuthorId,
      tags: normalizedTags,
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
