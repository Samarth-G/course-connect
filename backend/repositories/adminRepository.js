import User from "../models/userModel.js";
import Thread from "../models/threadModel.js";

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function findAllUsers({ page = 1, limit = 20 } = {}) {
  const skip = (page - 1) * limit;
  const [results, total] = await Promise.all([
    User.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(),
  ]);
  return { results, total, page, limit };
}

export async function searchUsers(query, { page = 1, limit = 20 } = {}) {
  const skip = (page - 1) * limit;
  const escaped = escapeRegex(String(query).trim());
  const searchFilter = {
    $or: [
      { name: { $regex: escaped, $options: "i" } },
      { email: { $regex: escaped, $options: "i" } },
    ],
  };

  // Also search users who authored threads matching the query
  const matchingThreads = await Thread.find(
    {
      $or: [
        { title: { $regex: escaped, $options: "i" } },
        { body: { $regex: escaped, $options: "i" } },
      ],
    },
    { authorId: 1 },
  ).lean();

  const authorIds = [...new Set(matchingThreads.map((t) => t.authorId))];

  if (authorIds.length > 0) {
    searchFilter.$or.push({ _id: { $in: authorIds } });
  }

  const [results, total] = await Promise.all([
    User.find(searchFilter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(searchFilter),
  ]);
  return { results, total, page, limit };
}

export async function toggleUserEnabled(userId) {
  const user = await User.findById(userId);
  if (!user) return null;
  user.enabled = !user.enabled;
  await user.save();
  return user;
}
