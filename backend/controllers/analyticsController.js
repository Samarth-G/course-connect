import * as analyticsService from "../services/analyticsService.js";

export async function getActivity(req, res) {
  try {
    const { startDate, endDate } = req.query;
    const data = await analyticsService.getActivity(startDate, endDate);
    return res.json(data);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch activity data" });
  }
}

export async function getHotThreads(req, res) {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
    const days = Math.min(Math.max(parseInt(req.query.days, 10) || 7, 1), 90);
    const data = await analyticsService.getHotThreads(limit, days);
    return res.json({ results: data });
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch hot threads" });
  }
}

export async function getSummary(req, res) {
  try {
    const { startDate, endDate } = req.query;
    const data = await analyticsService.getSummary(startDate, endDate);
    return res.json(data);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch summary" });
  }
}

export async function getUserHistory(req, res) {
  try {
    const { userId } = req.params;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const data = await analyticsService.getUserHistory(userId, page, limit);
    return res.json({ results: data });
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch user history" });
  }
}
