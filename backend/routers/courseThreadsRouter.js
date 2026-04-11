import express from "express";
import {
  addCourseThreadReply,
  deleteCourseThread,
  createCourseThread,
  deleteCourseThreadReply,
  getCourseThreadReply,
  getCourseThread,
  listCourseThreadReplies,
  searchCourseThreads,
  updateCourseThreadReply,
  updateCourseThread,
} from "../controllers/courseThreadController.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = express.Router({ mergeParams: true });

router.get("/", searchCourseThreads);
router.get("/:threadId", getCourseThread);
router.get("/:threadId/replies", listCourseThreadReplies);
router.get("/:threadId/replies/:replyId", getCourseThreadReply);
router.post("/", requireAuth, createCourseThread);
router.post("/:threadId/replies", requireAuth, addCourseThreadReply);
router.patch("/:threadId", requireAuth, updateCourseThread);
router.patch("/:threadId/replies/:replyId", requireAuth, updateCourseThreadReply);
router.delete("/:threadId", requireAuth, deleteCourseThread);
router.delete("/:threadId/replies/:replyId", requireAuth, deleteCourseThreadReply);

export default router;
