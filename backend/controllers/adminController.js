import {
  listUsers,
  searchUsersService,
  toggleUser,
} from "../services/adminService.js";
import { getIO } from "../socket.js";

export async function getUsers(req, res) {
  const { q = "", page = "1", limit = "20" } = req.query;
  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

  try {
    const trimmedQ = String(q).trim();
    const result = trimmedQ
      ? await searchUsersService(trimmedQ, { page: parsedPage, limit: parsedLimit })
      : await listUsers({ page: parsedPage, limit: parsedLimit });

    return res.status(200).json({
      query: trimmedQ,
      count: result.results.length,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
      results: result.results,
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch users" });
  }
}

export async function toggleUserStatus(req, res) {
  const { userId } = req.params;

  try {
    const user = await toggleUser(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const io = getIO();
    if (io) {
      io.emit("user:toggled", user);
      if (!user.enabled) {
        io.to(`user:${user.id}`).emit("account:disabled");
      }
    }

    return res.status(200).json({ message: `User ${user.enabled ? "enabled" : "disabled"}`, user });
  } catch (error) {
    return res.status(500).json({ error: "Failed to toggle user status" });
  }
}
