import {
  findAllUsers,
  searchUsers,
  toggleUserEnabled,
} from "../repositories/adminRepository.js";

export async function listUsers({ page = 1, limit = 20 } = {}) {
  const { results, total } = await findAllUsers({ page, limit });
  return {
    results: results.map((u) => u.toJSON()),
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export async function searchUsersService(query, { page = 1, limit = 20 } = {}) {
  const { results, total } = await searchUsers(query, { page, limit });
  return {
    results: results.map((u) => u.toJSON()),
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export async function toggleUser(userId) {
  const user = await toggleUserEnabled(userId);
  return user ? user.toJSON() : null;
}
