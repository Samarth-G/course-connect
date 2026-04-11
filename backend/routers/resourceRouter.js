import express from "express";
import {
  searchResourcesByCourseId,
  getResourceById,
  createResource,
  updateResource,
  deleteResource,
} from "../controllers/resourceController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { resourceUpload } from "../middleware/resourceUpload.js";

const router = express.Router({ mergeParams: true });

router.get("/", searchResourcesByCourseId);
router.get("/:resourceId", getResourceById);
router.post("/", requireAuth, resourceUpload.single("resourceFile"), createResource);
router.patch("/:resourceId", requireAuth, resourceUpload.single("resourceFile"), updateResource);
router.delete("/:resourceId", requireAuth, deleteResource);

export default router;
