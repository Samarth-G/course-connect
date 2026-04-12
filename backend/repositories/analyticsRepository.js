import Thread from "../models/threadModel.js";
import User from "../models/userModel.js";
import Resource from "../models/resourceModel.js";
import Session from "../models/sessionModel.js";

export function getThreadCountsByDate(startDate, endDate) {
  return Thread.aggregate([
    { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);
}

export function getReplyCountsByDate(startDate, endDate) {
  return Thread.aggregate([
    { $unwind: "$replies" },
    { $match: { "replies.createdAt": { $gte: startDate, $lte: endDate } } },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$replies.createdAt" },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);
}

export function getResourceCountsByDate(startDate, endDate) {
  return Resource.aggregate([
    { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);
}

export function getUserSignupsByDate(startDate, endDate) {
  return User.aggregate([
    { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);
}

export function getSessionCountsByDate(startDate, endDate) {
  return Session.aggregate([
    { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);
}

export function getHotThreads(limit = 10, days = 7) {
  const since = new Date();
  since.setDate(since.getDate() - days);

  return Thread.aggregate([
    {
      $addFields: {
        recentReplies: {
          $filter: {
            input: "$replies",
            as: "r",
            cond: { $gte: ["$$r.createdAt", since] },
          },
        },
      },
    },
    {
      $addFields: {
        recentReplyCount: { $size: { $ifNull: ["$recentReplies", []] } },
        totalReplyCount: { $size: { $ifNull: ["$replies", []] } },
        lastActivity: {
          $max: {
            $concatArrays: [
              ["$createdAt"],
              { $ifNull: ["$recentReplies.createdAt", []] },
            ],
          },
        },
      },
    },
    { $match: { recentReplyCount: { $gt: 0 } } },
    { $sort: { recentReplyCount: -1, lastActivity: -1 } },
    { $limit: limit },
    {
      $project: {
        _id: 1,
        courseId: 1,
        title: 1,
        authorName: 1,
        createdAt: 1,
        recentReplyCount: 1,
        totalReplyCount: 1,
        lastActivity: 1,
      },
    },
  ]);
}

export function getUserActivity(userId, page = 1, limit = 20) {
  const skip = (page - 1) * limit;

  return Thread.aggregate([
    {
      $facet: {
        threads: [
          { $match: { authorId: userId } },
          {
            $project: {
              type: { $literal: "thread" },
              content: "$title",
              body: "$body",
              courseId: 1,
              createdAt: 1,
              threadId: "$_id",
            },
          },
        ],
        replies: [
          { $unwind: "$replies" },
          { $match: { "replies.authorId": userId } },
          {
            $project: {
              type: { $literal: "reply" },
              content: "$replies.body",
              body: "$replies.body",
              courseId: 1,
              createdAt: "$replies.createdAt",
              threadId: "$_id",
              threadTitle: "$title",
            },
          },
        ],
      },
    },
    {
      $project: {
        items: { $concatArrays: ["$threads", "$replies"] },
      },
    },
    { $unwind: "$items" },
    { $replaceRoot: { newRoot: "$items" } },
    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: limit },
  ]);
}

export async function getSiteSummary(startDate, endDate) {
  const match = { createdAt: { $gte: startDate, $lte: endDate } };

  const [users, threads, replyData, resources, sessions] = await Promise.all([
    User.countDocuments(match),
    Thread.countDocuments(match),
    Thread.aggregate([
      { $match: match },
      { $unwind: "$replies" },
      { $match: { "replies.createdAt": { $gte: startDate, $lte: endDate } } },
      { $count: "count" },
    ]),
    Resource.countDocuments(match),
    Session.countDocuments(match),
  ]);

  return {
    users,
    threads,
    replies: replyData[0]?.count || 0,
    resources,
    sessions,
  };
}
