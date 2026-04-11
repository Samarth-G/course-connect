import {
  searchResourcesByCourseId as searchResourcesByCourseIdFromService,
  getResourceById as getResourceByIdFromService,
  saveResource,
  updateResourceById,
  deleteResourceById,
} from "../services/resourceService.js";
import { unlink } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getIO } from "../socket.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const TITLE_MAX_LENGTH = 200;
const SUMMARY_MAX_LENGTH = 500;
const TYPE_MAX_LENGTH = 50;

function getUploadedFileData(file) {
  if (!file) {
    return null;
  }

  return {
    filePath: file.filename || "",
    fileName: file.originalname || "",
    fileSize: Number(file.size) || 0,
    mimeType: file.mimetype || "",
  };
}

async function removeUploadedFile(filePathValue) {
  if (!filePathValue) {
    return;
  }

  const absolutePath = path.join(__dirname, "../uploads", filePathValue);
  try {
    await unlink(absolutePath);
  } catch {
    //ignore
  }
}

function buildResourceUpdatePayload(body) {
  const payload = {};

  if (body.title !== undefined) {
    if (typeof body.title !== "string") {
      return { error: "title must be a string" };
    }

    const normalizedTitle = body.title.trim();
    if (!normalizedTitle) {
      return { error: "title cannot be empty" };
    }
    if (normalizedTitle.length > TITLE_MAX_LENGTH) {
      return { error: `title must be ${TITLE_MAX_LENGTH} characters or fewer` };
    }

    payload.title = normalizedTitle;
  }

  if (body.type !== undefined) {
    if (typeof body.type !== "string") {
      return { error: "type must be a string" };
    }

    const normalizedType = body.type.trim();
    if (!normalizedType) {
      return { error: "type cannot be empty" };
    }
    if (normalizedType.length > TYPE_MAX_LENGTH) {
      return { error: `type must be ${TYPE_MAX_LENGTH} characters or fewer` };
    }

    payload.type = normalizedType;
  }

  if (body.summary !== undefined) {
    if (typeof body.summary !== "string") {
      return { error: "summary must be a string" };
    }

    const normalizedSummary = body.summary.trim();
    if (!normalizedSummary) {
      return { error: "summary cannot be empty" };
    }
    if (normalizedSummary.length > SUMMARY_MAX_LENGTH) {
      return { error: `summary must be ${SUMMARY_MAX_LENGTH} characters or fewer` };
    }

    payload.summary = normalizedSummary;
  }

  return { updatePayload: payload };
}

export async function searchResourcesByCourseId(req, res) {
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
    const searchPayload = await searchResourcesByCourseIdFromService(courseId, q, {
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
      error: "Failed to search resources",
    });
  }
}

export async function getResourceById(req, res) {
  const { resourceId } = req.params;

  try {
    const resource = await getResourceByIdFromService(resourceId);

    if (!resource) {
      return res.status(404).json({
        error: "Resource not found",
      });
    }

    return res.status(200).json(resource);
  } catch (error) {
    return res.status(500).json({
      error: "Failed to get resource",
    });
  }
}

export async function createResource(req, res) {
  const { courseId } = req.params;
  const { title, type, summary, uploader } = req.body;
  const uploadedFile = getUploadedFileData(req.file);

  //validate
  if (typeof title !== "string" || typeof type !== "string" || typeof summary !== "string") {
    await removeUploadedFile(uploadedFile?.filePath);
    return res.status(400).json({
      error: "title, type, and summary must be non-empty strings",
    });
  }

  const normalizedTitle = title.trim();
  const normalizedType = type.trim();
  const normalizedSummary = summary.trim();
  const normalizedUploader = String(uploader ?? req.user?.name ?? "Anonymous").trim() || "Anonymous";
  const normalizedUploaderId = String(req.user?.id ?? "").trim();

  if (normalizedTitle.length === 0 || normalizedType.length === 0 || normalizedSummary.length === 0) {
    await removeUploadedFile(uploadedFile?.filePath);
    return res.status(400).json({
      error: "title, type, and summary are required",
    });
  }

  if (normalizedTitle.length > TITLE_MAX_LENGTH) {
    await removeUploadedFile(uploadedFile?.filePath);
    return res.status(400).json({
      error: `title must be ${TITLE_MAX_LENGTH} characters or fewer`,
    });
  }

  if (normalizedType.length > TYPE_MAX_LENGTH) {
    await removeUploadedFile(uploadedFile?.filePath);
    return res.status(400).json({
      error: `type must be ${TYPE_MAX_LENGTH} characters or fewer`,
    });
  }

  if (normalizedSummary.length > SUMMARY_MAX_LENGTH) {
    await removeUploadedFile(uploadedFile?.filePath);
    return res.status(400).json({
      error: `summary must be ${SUMMARY_MAX_LENGTH} characters or fewer`,
    });
  }

  if (!uploadedFile) {
    return res.status(400).json({
      error: "resourceFile is required",
    });
  }

  try {
    const createdResource = await saveResource({
      courseId,
      title: normalizedTitle,
      type: normalizedType,
      summary: normalizedSummary,
      uploader: normalizedUploader,
      uploaderId: normalizedUploaderId,
      ...uploadedFile,
    });

    const io = getIO();
    if (io) io.emit("resource:created", createdResource);

    return res.status(201).json(createdResource);
  } catch (error) {
    await removeUploadedFile(uploadedFile?.filePath);
    return res.status(500).json({
      error: "Failed to create resource",
    });
  }
}

export async function deleteResource(req, res) {
  const { resourceId } = req.params;

  try {
    const existingResource = await getResourceByIdFromService(resourceId);

    if (!existingResource) {
      return res.status(404).json({
        error: "Resource not found",
      });
    }

    if (existingResource.uploaderId !== String(req.user?.id ?? "") && req.user?.role !== "admin") {
      return res.status(403).json({
        error: "You can only delete your own resources",
      });
    }

    const deleted = await deleteResourceById(resourceId);

    if (!deleted) {
      return res.status(404).json({
        error: "Resource not found",
      });
    }

    await removeUploadedFile(existingResource.filePath);

    const io = getIO();
    if (io) {
      io.emit("resource:deleted", {
        resourceId,
        courseId: existingResource.courseId,
      });
    }

    return res.status(200).json({
      message: "Resource deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to delete resource",
    });
  }
}

export async function updateResource(req, res) {
  const { resourceId } = req.params;
  const uploadedFile = getUploadedFileData(req.file);

  try {
    const existingResource = await getResourceByIdFromService(resourceId);

    if (!existingResource) {
      await removeUploadedFile(uploadedFile?.filePath);
      return res.status(404).json({
        error: "Resource not found",
      });
    }

    if (existingResource.uploaderId !== String(req.user?.id ?? "") && req.user?.role !== "admin") {
      await removeUploadedFile(uploadedFile?.filePath);
      return res.status(403).json({
        error: "You can only edit your own resources",
      });
    }

    const updateResult = buildResourceUpdatePayload(req.body ?? {});
    if (updateResult.error) {
      await removeUploadedFile(uploadedFile?.filePath);
      return res.status(400).json({
        error: updateResult.error,
      });
    }

    if (Object.keys(updateResult.updatePayload).length === 0 && !uploadedFile) {
      return res.status(400).json({
        error: "Provide at least one field to update",
      });
    }

    if (uploadedFile) {
      updateResult.updatePayload.filePath = uploadedFile.filePath;
      updateResult.updatePayload.fileName = uploadedFile.fileName;
      updateResult.updatePayload.fileSize = uploadedFile.fileSize;
      updateResult.updatePayload.mimeType = uploadedFile.mimeType;
    }

    const updated = await updateResourceById(resourceId, updateResult.updatePayload);

    if (!updated) {
      await removeUploadedFile(uploadedFile?.filePath);
      return res.status(404).json({
        error: "Resource not found",
      });
    }

    if (uploadedFile) {
      await removeUploadedFile(existingResource.filePath);
    }

    const io = getIO();
    if (io) io.emit("resource:updated", updated);

    return res.status(200).json({
      message: "Resource updated successfully",
      resource: updated,
    });
  } catch (error) {
    await removeUploadedFile(uploadedFile?.filePath);
    return res.status(500).json({
      error: "Failed to update resource",
    });
  }
}
