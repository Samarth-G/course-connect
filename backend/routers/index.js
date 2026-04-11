import express from "express";
import courseThreadsRouter from "./courseThreadsRouter.js";
import resourceRouter from "./resourceRouter.js";
import courseRouter from "./courseRouter.js";
import authRouter from "./authRouter.js";
import adminRouter from "./adminRouter.js";

const router = express.Router();

router.use("/auth", authRouter);
router.use("/admin", adminRouter);
router.use("/courses", courseRouter);
router.use("/courses/:courseId/threads", courseThreadsRouter);
router.use("/courses/:courseId/resources", resourceRouter);

export default router;
