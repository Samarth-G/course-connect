import * as analyticsRepo from "../repositories/analyticsRepository.js";

function parseDateRange(startDate, endDate) {
  const now = new Date();
  const end = endDate ? new Date(endDate) : now;
  const start = startDate
    ? new Date(startDate)
    : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

  end.setHours(23, 59, 59, 999);
  start.setHours(0, 0, 0, 0);

  return { start, end };
}

export async function getActivity(startDate, endDate) {
  const { start, end } = parseDateRange(startDate, endDate);

  const [threads, replies, resources, users, sessions] = await Promise.all([
    analyticsRepo.getThreadCountsByDate(start, end),
    analyticsRepo.getReplyCountsByDate(start, end),
    analyticsRepo.getResourceCountsByDate(start, end),
    analyticsRepo.getUserSignupsByDate(start, end),
    analyticsRepo.getSessionCountsByDate(start, end),
  ]);

  return { threads, replies, resources, users, sessions };
}

export async function getHotThreads(limit, days) {
  return analyticsRepo.getHotThreads(limit, days);
}

export async function getSummary(startDate, endDate) {
  const { start, end } = parseDateRange(startDate, endDate);
  return analyticsRepo.getSiteSummary(start, end);
}

export async function getUserHistory(userId, page, limit) {
  return analyticsRepo.getUserActivity(userId, page, limit);
}
