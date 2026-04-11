import express from "express";
import {
  createStudySessionEntry,
  deleteStudySessionEntry,
  listStudySessions,
  updateStudySessionEntry,
} from "../controllers/sessionController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", listStudySessions);
router.post("/", requireAuth, createStudySessionEntry);
router.patch("/:sessionId", requireAuth, updateStudySessionEntry);
router.delete("/:sessionId", requireAuth, deleteStudySessionEntry);

export default router;