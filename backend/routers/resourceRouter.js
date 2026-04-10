import express from "express";
import {
  searchResourcesByCourseld,
  getResourceByld,
  createResource,
  deleteResource,
} from "../controllers/resourceController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { resourceUpload } from "../middleware/resourceUpload.js";

const router = express.Router({ mergeParams: true });

router.get("/", searchResourcesByCourseld);
router.get("/:resourceId", getResourceByld);
router.post("/", requireAuth, resourceUpload.single("resourceFile"), createResource);
router.delete("/:resourceId", requireAuth, deleteResource);

export default router;
