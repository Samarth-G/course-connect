import {
  addReplyToCourseThreadById,
  deleteCourseThreadReplyById,
  deleteCourseThreadById,
  getCourseThreadById,
  getCourseThreadReplyById,
  listCoursesFromDb,
  listCourseThreadRepliesById,
  saveCourseThread,
  updateCourseThreadReplyById,
  updateCourseThreadById,
  searchCourseThreadsFromDb,
} from "../services/courseThreadService.js";
import { getIO } from "../socket.js";

const TITLE_MAX_LENGTH = 200;
const BODY_MAX_LENGTH = 5000;
const REPLY_BODY_MAX_LENGTH = 2000;
const TAG_MAX_LENGTH = 30;
const TAGS_MAX_COUNT = 10;

function normalizeTags(tags) {
  return (Array.isArray(tags) ? tags : [])
    .map((tag) => String(tag).trim())
    .filter(Boolean)
    .slice(0, TAGS_MAX_COUNT)
    .map((tag) => tag.slice(0, TAG_MAX_LENGTH));
}

function buildThreadUpdatePayload(body) {
  const payload = {};

  if (body.title !== undefined) {
    if (typeof body.title !== "string") {
      return { error: "title must be a string" };
    }

    const normalTitle = body.title.trim();
    if (!normalTitle) {
      return { error: "title cannot be empty" };
    }
    if (normalTitle.length > TITLE_MAX_LENGTH) {
      return { error: `title must be ${TITLE_MAX_LENGTH} characters or fewer` };
    }

    payload.title = normalTitle;
  }

  if (body.body !== undefined) {
    if (typeof body.body !== "string") {
      return { error: "body must be a string" };
    }

    const normalBody = body.body.trim();
    if (!normalBody) {
      return { error: "body cannot be empty" };
    }
    if (normalBody.length > BODY_MAX_LENGTH) {
      return { error: `body must be ${BODY_MAX_LENGTH} characters or fewer` };
    }

    payload.body = normalBody;
  }

  if (body.tags !== undefined) {
    if (!Array.isArray(body.tags)) {
      return { error: "tags must be an array when provided" };
    }

    payload.tags = normalizeTags(body.tags);
  }

  if (Object.keys(payload).length === 0) {
    return { error: "Provide at least one field to update" };
  }
  return { updatePayload: payload };
}

function buildReplyPayload(body) {
  if (typeof body.body !== "string") {
    return { error: "body must be a string" };
  }

  const normalizedBody = body.body.trim();
  const normalizedAuthorId = String(body.authorId ?? "").trim();
  const normalizedAuthorName = String(body.authorName ?? "Anonymous").trim() || "Anonymous";
  const normalizedAuthorProfileImage = String(body.authorProfileImage ?? "");

  if (!normalizedBody) {
    return { error: "body cannot be empty" };
  }

  if (normalizedBody.length > REPLY_BODY_MAX_LENGTH) {
    return { error: `body must be ${REPLY_BODY_MAX_LENGTH} characters or fewer` };
  }

  if (!normalizedAuthorId) {
    return { error: "Missing authenticated user" };
  }

  return {
    replyPayload: {
      body: normalizedBody,
      authorId: normalizedAuthorId,
      authorName: normalizedAuthorName,
      authorProfileImage: normalizedAuthorProfileImage,
    },
  };
}

function buildReplyUpdatePayload(body) {
  if (typeof body.body !== "string") {
    return { error: "body must be a string" };
  }

  const normalizedBody = body.body.trim();
  if (!normalizedBody) {
    return { error: "body cannot be empty" };
  }

  if (normalizedBody.length > REPLY_BODY_MAX_LENGTH) {
    return { error: `body must be ${REPLY_BODY_MAX_LENGTH} characters or fewer` };
  }

  return {
    updatePayload: {
      body: normalizedBody,
    },
  };
}

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

  const normalizedTags = normalizeTags(tags);

  try {
    const newThread = await saveCourseThread({
      courseId: String(courseId).trim(),
      title: normalizedTitle,
      body: normalizedBody,
      authorId: normalizedAuthorId,
      authorName: String(req.user?.name ?? "Anonymous").trim() || "Anonymous",
      authorProfileImage: String(req.user?.profileImage ?? ""),
      tags: normalizedTags,
    });

    const io = getIO();
    if (io) io.emit("thread:created", newThread);

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

export async function getCourseThread(req, res) {
  const { courseId, threadId } = req.params;

  try {
    const thread = await getCourseThreadById(courseId, threadId);

    if (!thread) {
      return res.status(404).json({
        error: "Thread not found",
      });
    }

    return res.status(200).json({ thread });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to fetch thread",
    });
  }
}

export async function updateCourseThread(req, res) {
  const { courseId, threadId } = req.params;

  try {
    const existingThread = await getCourseThreadById(courseId, threadId);

    if (!existingThread) {
      return res.status(404).json({
        error: "Thread not found",
      });
    }

    if (existingThread.authorId !== String(req.user?.id ?? "") && req.user?.role !== "admin") {
      return res.status(403).json({
        error: "You can only edit your own threads",
      });
    }

    const updateResult = buildThreadUpdatePayload(req.body ?? {});
    if (updateResult.error) {
      return res.status(400).json({
        error: updateResult.error,
      });
    }

    const updatedThread = await updateCourseThreadById(courseId, threadId, updateResult.updatePayload);

    if (!updatedThread) {
      return res.status(404).json({
        error: "Thread not found",
      });
    }

    const io = getIO();
    if (io) io.emit("thread:updated", updatedThread);

    return res.status(200).json({
      message: "Thread updated successfully",
      thread: updatedThread,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to update thread",
    });
  }
}

export async function deleteCourseThread(req, res) {
  const { courseId, threadId } = req.params;

  try {
    const existingThread = await getCourseThreadById(courseId, threadId);

    if (!existingThread) {
      return res.status(404).json({
        error: "Thread not found",
      });
    }

    if (existingThread.authorId !== String(req.user?.id ?? "") && req.user?.role !== "admin") {
      return res.status(403).json({
        error: "You can only delete your own threads",
      });
    }

    const deleted = await deleteCourseThreadById(courseId, threadId);

    if (!deleted) {
      return res.status(404).json({
        error: "Thread not found",
      });
    }

    const io = getIO();
    if (io) io.emit("thread:deleted", { courseId, threadId });

    return res.status(200).json({
      message: "Thread deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to delete thread",
    });
  }
}

export async function addCourseThreadReply(req, res) {
  const { courseId, threadId } = req.params;
  const replyPayloadResult = buildReplyPayload({
    body: req.body?.body,
    authorId: req.user?.id,
    authorName: req.user?.name,
    authorProfileImage: req.user?.profileImage,
  });

  if (replyPayloadResult.error) {
    return res.status(400).json({
      error: replyPayloadResult.error,
    });
  }

  try {
    const updatedThread = await addReplyToCourseThreadById(courseId, threadId, replyPayloadResult.replyPayload);

    if (!updatedThread) {
      return res.status(404).json({
        error: "Thread not found",
      });
    }

    const io = getIO();
    if (io) io.emit("reply:added", { thread: updatedThread });

    return res.status(201).json({
      message: "Reply added successfully",
      thread: updatedThread,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to add reply",
    });
  }
}

export async function listCourseThreadReplies(req, res) {
  const { courseId, threadId } = req.params;

  try {
    const replies = await listCourseThreadRepliesById(courseId, threadId);

    if (!replies) {
      return res.status(404).json({
        error: "Thread not found",
      });
    }

    return res.status(200).json({
      count: replies.length,
      replies,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to fetch replies",
    });
  }
}

export async function getCourseThreadReply(req, res) {
  const { courseId, threadId, replyId } = req.params;

  try {
    const reply = await getCourseThreadReplyById(courseId, threadId, replyId);

    if (!reply) {
      return res.status(404).json({
        error: "Reply not found",
      });
    }

    return res.status(200).json({ reply });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to fetch reply",
    });
  }
}

export async function updateCourseThreadReply(req, res) {
  const { courseId, threadId, replyId } = req.params;

  try {
    const existingReply = await getCourseThreadReplyById(courseId, threadId, replyId);

    if (!existingReply) {
      return res.status(404).json({
        error: "Reply not found",
      });
    }

    if (existingReply.authorId !== String(req.user?.id ?? "") && req.user?.role !== "admin") {
      return res.status(403).json({
        error: "You can only edit your own replies",
      });
    }

    const updateResult = buildReplyUpdatePayload(req.body ?? {});
    if (updateResult.error) {
      return res.status(400).json({
        error: updateResult.error,
      });
    }

    const updatedThread = await updateCourseThreadReplyById(
      courseId,
      threadId,
      replyId,
      updateResult.updatePayload,
    );

    if (!updatedThread) {
      return res.status(404).json({
        error: "Reply not found",
      });
    }

    const updatedReply = updatedThread.replies?.find(
      (reply) => String(reply.id ?? reply._id ?? "") === String(replyId),
    );

    if (!updatedReply) {
      return res.status(404).json({
        error: "Reply not found",
      });
    }

    const io = getIO();
    if (io) io.emit("reply:updated", { thread: updatedThread, reply: updatedReply });

    return res.status(200).json({
      message: "Reply updated successfully",
      reply: updatedReply,
      thread: updatedThread,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to update reply",
    });
  }
}

export async function deleteCourseThreadReply(req, res) {
  const { courseId, threadId, replyId } = req.params;

  try {
    const existingReply = await getCourseThreadReplyById(courseId, threadId, replyId);

    if (!existingReply) {
      return res.status(404).json({
        error: "Reply not found",
      });
    }

    if (existingReply.authorId !== String(req.user?.id ?? "") && req.user?.role !== "admin") {
      return res.status(403).json({
        error: "You can only delete your own replies",
      });
    }

    const deleted = await deleteCourseThreadReplyById(courseId, threadId, replyId);

    if (!deleted) {
      return res.status(404).json({
        error: "Reply not found",
      });
    }

    const io = getIO();
    if (io) io.emit("reply:deleted", { courseId, threadId, replyId });

    return res.status(200).json({
      message: "Reply deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to delete reply",
    });
  }
}
