import express from "express";
import {
	createCourseThread,
	searchCourseThreads,
} from "../controllers/courseThreadController.js";

const router = express.Router({ mergeParams: true });

router.get("/", searchCourseThreads);
router.post("/", createCourseThread);

export default router;
