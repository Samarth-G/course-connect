import express from "express";
import courseThreadsRouter from "./courseThreadsRouter.js";
import authRouter from "./authRouter.js";
import { listCourses } from "../controllers/courseThreadController.js";

const router = express.Router();

router.use("/auth", authRouter);
router.get("/courses", listCourses);
router.use("/courses/:courseId/threads", courseThreadsRouter);

export default router;
