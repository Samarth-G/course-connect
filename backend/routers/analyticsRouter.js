import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { requireAdmin } from "../middleware/adminMiddleware.js";
import * as analyticsController from "../controllers/analyticsController.js";

const router = express.Router();

router.get("/activity", requireAuth, analyticsController.getActivity);
router.get("/hot-threads", analyticsController.getHotThreads);
router.get("/summary", requireAuth, requireAdmin, analyticsController.getSummary);
router.get("/user/:userId/history", requireAuth, analyticsController.getUserHistory);

export default router;
