import express from "express";
import { createCourse, listCourses } from "../controllers/courseController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", listCourses);
router.post("/", requireAuth, createCourse);

export default router;