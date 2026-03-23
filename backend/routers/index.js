import express from "express";
import courseThreadsRouter from "./courseThreadsRouter.js";
import authRouter from "./authRouter.js";

const router = express.Router();

router.use("/auth", authRouter);
router.use("/courses/:courseId/threads", courseThreadsRouter);

export default router;
