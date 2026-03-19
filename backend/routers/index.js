import express from "express";
import courseThreadsRouter from "./courseThreadsRouter.js";

const router = express.Router();

router.use("/courses/:courseId/threads", courseThreadsRouter);

export default router;
