import express from "express";
import { createCourse, listCourses, updateCourseHandler, deleteCourseHandler } from "../controllers/courseController.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { requireAdmin } from "../middleware/adminMiddleware.js";

const router = express.Router();

router.get("/", listCourses);
router.post("/", requireAuth, createCourse);
router.patch("/:courseId", requireAuth, requireAdmin, updateCourseHandler);
router.delete("/:courseId", requireAuth, requireAdmin, deleteCourseHandler);

export default router;