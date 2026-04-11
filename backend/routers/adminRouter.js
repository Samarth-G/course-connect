import express from "express";
import { requireAuth } from "../middleware/authMiddleware.js";
import { requireAdmin } from "../middleware/adminMiddleware.js";
import { getUsers, toggleUserStatus } from "../controllers/adminController.js";

const router = express.Router();

router.use(requireAuth, requireAdmin);

router.get("/users", getUsers);
router.patch("/users/:userId/toggle", toggleUserStatus);

export default router;
