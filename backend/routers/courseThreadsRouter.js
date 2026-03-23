import express from "express";
import {
	createCourseThread,
	searchCourseThreads,
} from "../controllers/courseThreadController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router({ mergeParams: true });

router.get("/", searchCourseThreads);
router.post("/", requireAuth, createCourseThread);

export default router;
