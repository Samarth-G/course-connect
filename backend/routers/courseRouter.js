import express from "express";
import {
	createCourse,
	deleteCourseHandler,
	getCourse,
	listCourses,
	updateCourseHandler,
} from "../controllers/courseController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { requireAdmin } from "../middleware/adminMiddleware.js";

const router = express.Router();

router.get("/", listCourses);
router.get("/:courseId", getCourse);
router.post("/", requireAuth, requireAdmin, createCourse);
router.patch("/:courseId", requireAuth, requireAdmin, updateCourseHandler);
router.delete("/:courseId", requireAuth, requireAdmin, deleteCourseHandler);

export default router;