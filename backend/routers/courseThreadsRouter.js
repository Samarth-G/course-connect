import express from "express";
import {
  deleteCourseThread,
  createCourseThread,
  getCourseThread,
  searchCourseThreads,
  updateCourseThread,
} from "../controllers/courseThreadController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router({ mergeParams: true });

router.get("/", searchCourseThreads);
router.get("/:threadId", getCourseThread);
router.post("/", requireAuth, createCourseThread);
router.patch("/:threadId", requireAuth, updateCourseThread);
router.delete("/:threadId", requireAuth, deleteCourseThread);

export default router;
