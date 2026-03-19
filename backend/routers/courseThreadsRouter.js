import express from "express";
import { createCourseThread } from "../controllers/courseThreadController.js";

const router = express.Router({ mergeParams: true });

router.post("/", createCourseThread);

export default router;
