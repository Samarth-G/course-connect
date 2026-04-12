import bcrypt from "bcryptjs";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import Course from "../models/courseModel.js";
import Thread from "../models/threadModel.js";
import Resource from "../models/resourceModel.js";
import Session from "../models/sessionModel.js";
import { findUserByEmail, createUser } from "../repositories/authRepository.js";
import { findThreadsByCourseAndTitlePairs, insertManyThreads } from "../repositories/courseThreadRepository.js";

const DEMO_USER_EMAIL = "demo@courseconnect.local";
const DEMO_USER_PASSWORD = "Password123!";
const ADMIN_USER_EMAIL = "admin@courseconnect.local";
const ADMIN_USER_PASSWORD = "Admin123!";
const COURSES_FILE_URL = new URL("../data/courses.json", import.meta.url);
const THREADS_FILE_URL = new URL("../data/threads.json", import.meta.url);
const RESOURCES_FILE_URL = new URL("../data/resources.json", import.meta.url);
const SEEDED_AUTHOR_EMAIL_DOMAIN = "courseconnect.seed.local";

function slugifyName(name) {
  return String(name ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "")
    .slice(0, 48) || "seed.user";
}

function toSeedAuthorEmail(name) {
  return `${slugifyName(name)}@${SEEDED_AUTHOR_EMAIL_DOMAIN}`;
}

async function ensureSeedUserByName(name, cache) {
  const normalizedName = String(name ?? "").trim();
  if (!normalizedName) {
    return null;
  }

  if (cache.has(normalizedName)) {
    return cache.get(normalizedName);
  }

  const email = toSeedAuthorEmail(normalizedName);
  let user = await findUserByEmail(email);
  if (!user) {
    user = await createUser({
      name: normalizedName,
      email,
      passwordHash: await bcrypt.hash(DEMO_USER_PASSWORD, 10),
    });
  }

  cache.set(normalizedName, user);
  return user;
}

async function loadSeedCourses() {
  const filePath = fileURLToPath(COURSES_FILE_URL);
  const rawCourses = await readFile(filePath, "utf8");
  return JSON.parse(rawCourses);
}

async function loadSeedThreads() {
  const filePath = fileURLToPath(THREADS_FILE_URL);
  const rawThreads = await readFile(filePath, "utf8");
  return JSON.parse(rawThreads);
}

async function loadSeedResources() {
  const filePath = fileURLToPath(RESOURCES_FILE_URL);
  const rawResources = await readFile(filePath, "utf8");
  return JSON.parse(rawResources);
}

async function seedReplies(demoUser) {
  function daysAgoDate(n, hour = 10) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    d.setHours(hour, 0, 0, 0);
    return d;
  }

  const replySeedData = [
    {
      courseId: "COSC-222",
      threadTitle: "Complete guide to tree traversal for the midterm",
      replies: [
        {
          body: "Really helpful overview! One thing I'd add: when converting recursive DFS to iterative using an explicit stack, remember to push the right child before the left so the left gets processed first.",
          authorName: "Priya",
          daysAgo: 14,
          hour: 11,
        },
        {
          body: "One trick that really helped me: for in-order traversal on a BST, just think of reading the tree from left to right, the values come out in ascending sorted order every time. For post-order, think leaves-first, which makes it perfect for freeing memory or evaluating expression trees where you need both children's values before the parent. When converting recursive DFS to iterative, the key insight is that the call stack is literally replaced by an explicit stack data structure, push root, then on each iteration pop a node, process it, and push its children in reverse order so the left child is processed first. This pattern works for all three DFS variants with minor tweaks.",
          authorName: "Maya",
          daysAgo: 13,
          hour: 14,
        },
      ],
    },
    {
      courseId: "COSC-222",
      threadTitle: "Midterm 2 study group, anyone else finding it tough?",
      replies: [
        {
          body: "Same here, the graph section alone covers Dijkstra, Bellman-Ford, and Floyd-Warshall, each with different time complexities and use cases. Dijkstra runs in O((V+E) log V) with a min-heap and only works on non-negative edge weights; Bellman-Ford handles negative weights in O(VE) and can detect negative cycles; Floyd-Warshall computes all-pairs shortest paths in O(V³). For dynamic programming, the real trick is identifying the subproblem structure before writing any code, draw the table first, fill in your base cases, then reason about the recurrence relation. Happy to share my comparison notes if anyone wants them.",
          authorName: "Alex",
          daysAgo: 4,
          hour: 9,
        },
        {
          body: "DP clicked for me once I started drawing the memoization table by hand for every problem. Define your base cases in the first row and column, then fill row by row. Once you nail coin change and longest common subsequence, most other DP problems follow the same structure.",
          authorName: "Priya",
          daysAgo: 4,
          hour: 13,
        },
        {
          body: "Office hours the day before the midterm are really useful, the prof walks through a past exam question in detail. I would strongly recommend going if you can make it.",
          authorName: "Jordan",
          daysAgo: 4,
          hour: 10,
        },
        {
          body: "For Dijkstra I draw out the priority queue state after each relaxation step. Seeing which node gets settled and when makes the algorithm click way faster than just reading pseudocode. The worked example in the lecture slides is also cleaner than the textbook one.",
          authorName: "Maya",
          daysAgo: 3,
          hour: 16,
        },
        {
          body: "Study group this weekend? We could split the material (graphs, DP, and sorting algorithms) and each teach one section to the rest. Reply here if you're interested and we can sort out a time.",
          authorName: "Casey",
          daysAgo: 2,
          hour: 18,
        },
      ],
    },
    {
      courseId: "COSC-222",
      threadTitle: "Need help studying for MT1",
      replies: [
        {
          body: "Focus on chapters 3-5, stacks, queues, and linked lists. The prof mentioned those will be the biggest sections on MT1.",
          authorName: "Jordan",
          daysAgo: 21,
          hour: 11,
        },
        {
          body: "Also review time complexity analysis. Make sure you can derive Big O for nested loops without just memorising, the midterm usually has at least one derivation question.",
          authorName: "Maya",
          daysAgo: 20,
          hour: 15,
        },
      ],
    },
    {
      courseId: "PHYS-215",
      threadTitle: "Entropy intuition help",
      replies: [
        {
          body: "Think of entropy as counting the number of ways energy can be distributed across a system. More disorder means more possible microstates, which means higher entropy. The Second Law just says that in an isolated system, the total number of accessible microstates can only stay the same or increase, never decrease. That framing helped me far more than the formula alone.",
          authorName: "Casey",
          daysAgo: 10,
          hour: 12,
        },
      ],
    },
    {
      courseId: "BIOL-117",
      threadTitle: "Natural selection practice",
      replies: [
        {
          body: "Khan Academy has a solid set of natural selection practice problems with worked solutions. Also check your textbook's end-of-chapter questions, there are usually 3-4 good ones on adaptation and fitness trade-offs.",
          authorName: "Taylor",
          daysAgo: 10,
          hour: 14,
        },
      ],
    },
  ];

  const authorUserCache = new Map();
  authorUserCache.set(demoUser.name, demoUser);
  let totalAdded = 0;

  for (const seed of replySeedData) {
    const thread = await Thread.findOne({ courseId: seed.courseId, title: seed.threadTitle });
    if (!thread) continue;

    const existingPrefixes = new Set(
      thread.replies.map((r) => r.body.slice(0, 40).toLowerCase())
    );

    const newReplies = [];
    for (const reply of seed.replies) {
      if (existingPrefixes.has(reply.body.slice(0, 40).toLowerCase())) {
        continue;
      }
      const authorUser = await ensureSeedUserByName(reply.authorName, authorUserCache);
      newReplies.push({
        body: reply.body,
        authorId: String(authorUser?.id ?? demoUser.id),
        authorName: reply.authorName,
        authorProfileImage: String(authorUser?.profileImage ?? ""),
        createdAt: daysAgoDate(reply.daysAgo, reply.hour),
      });
    }

    if (newReplies.length === 0) continue;

    await Thread.updateOne(
      { _id: thread._id },
      { $push: { replies: { $each: newReplies } } }
    );
    totalAdded += newReplies.length;
  }

  if (totalAdded > 0) {
    console.log(`Seeded ${totalAdded} thread repl${totalAdded === 1 ? "y" : "ies"}`);
  } else {
    console.log("No new thread replies to seed");
  }
}

async function normalizeExistingContentOwnership(demoUser) {
  const authorUserCache = new Map();
  authorUserCache.set(String(demoUser.name), demoUser);

  let normalizedThreadCount = 0;
  let normalizedReplyCount = 0;
  let normalizedResourceCount = 0;
  let normalizedSessionCount = 0;

  const threads = await Thread.find({});
  for (const thread of threads) {
    let hasChanges = false;
    const threadAuthor = await ensureSeedUserByName(thread.authorName, authorUserCache);
    const threadAuthorId = String(threadAuthor?.id ?? demoUser.id);

    if (String(thread.authorId ?? "") !== threadAuthorId) {
      thread.authorId = threadAuthorId;
      hasChanges = true;
      normalizedThreadCount += 1;
    }

    if (Array.isArray(thread.replies) && thread.replies.length > 0) {
      for (const reply of thread.replies) {
        const replyAuthor = await ensureSeedUserByName(reply.authorName, authorUserCache);
        const replyAuthorId = String(replyAuthor?.id ?? demoUser.id);
        if (String(reply.authorId ?? "") !== replyAuthorId) {
          reply.authorId = replyAuthorId;
          reply.authorProfileImage = String(replyAuthor?.profileImage ?? "");
          hasChanges = true;
          normalizedReplyCount += 1;
        }
      }
    }

    if (hasChanges) {
      await thread.save();
    }
  }

  const resources = await Resource.find({});
  for (const resource of resources) {
    const uploaderUser = await ensureSeedUserByName(resource.uploader, authorUserCache);
    const uploaderId = String(uploaderUser?.id ?? demoUser.id);
    if (String(resource.uploaderId ?? "") !== uploaderId) {
      resource.uploaderId = uploaderId;
      await resource.save();
      normalizedResourceCount += 1;
    }
  }

  const sessions = await Session.find({});
  for (const session of sessions) {
    const authorUser = await ensureSeedUserByName(session.authorName, authorUserCache);
    const authorId = String(authorUser?.id ?? demoUser.id);
    if (String(session.authorId ?? "") !== authorId) {
      session.authorId = authorId;
      session.authorProfileImage = String(authorUser?.profileImage ?? "");
      await session.save();
      normalizedSessionCount += 1;
    }
  }

  if (normalizedThreadCount || normalizedReplyCount || normalizedResourceCount || normalizedSessionCount) {
    console.log(
      `Normalized ownership: ${normalizedThreadCount} thread(s), ${normalizedReplyCount} repl${normalizedReplyCount === 1 ? "y" : "ies"}, ${normalizedResourceCount} resource(s), ${normalizedSessionCount} session(s)`
    );
  }
}

export async function seedDatabase() {
  let demoUser = await findUserByEmail(DEMO_USER_EMAIL);
  if (!demoUser) {
    demoUser = await createUser({
      name: "CourseConnect Demo",
      email: DEMO_USER_EMAIL,
      passwordHash: await bcrypt.hash(DEMO_USER_PASSWORD, 10),
    });
  }

  let adminUser = await findUserByEmail(ADMIN_USER_EMAIL);
  if (!adminUser) {
    adminUser = await createUser({
      name: "Admin",
      email: ADMIN_USER_EMAIL,
      passwordHash: await bcrypt.hash(ADMIN_USER_PASSWORD, 10),
      role: "admin",
    });
    console.log("Seeded admin user (admin@courseconnect.local / Admin123!)");
  }

  const seedCourses = await loadSeedCourses();
  const existingCourses = await Course.find(
    {
      $or: seedCourses.map((course) => ({
        courseId: course.courseId,
      })),
    },
    { courseId: 1 },
  ).lean();

  const existingCourseKeys = new Set(
    existingCourses.map((course) => String(course.courseId).toLowerCase()),
  );

  const courseDocuments = seedCourses
    .filter((course) => !existingCourseKeys.has(String(course.courseId).toLowerCase()))
    .map((course) => ({
      courseId: course.courseId,
      title: course.title,
      description: course.description || "",
    }));

  await Promise.all(
    seedCourses.map((course) => Course.updateOne(
      {
        courseId: course.courseId,
      },
      {
        $set: {
          title: course.title,
          description: course.description || "",
        },
      },
      { upsert: true },
    )),
  );

  if (courseDocuments.length > 0) {
    console.log(`Seeded ${courseDocuments.length} course(s)`);
  } else {
    console.log("No new courses to seed");
  }

  const seedThreads = await loadSeedThreads();
  const authorUserCache = new Map();
  authorUserCache.set(String(demoUser.name), demoUser);
  const existingThreads = await findThreadsByCourseAndTitlePairs(
    seedThreads.map((thread) => ({
      courseId: thread.courseId,
      title: thread.title,
    })),
  );

  const existingThreadKeys = new Set(
    existingThreads.map((thread) => `${String(thread.courseId).toLowerCase()}::${String(thread.title).toLowerCase()}`),
  );

  const threadDocuments = seedThreads
    .filter((thread) => {
      const key = `${String(thread.courseId).toLowerCase()}::${String(thread.title).toLowerCase()}`;
      return !existingThreadKeys.has(key);
    })
    .map((thread) => ({
      courseId: thread.courseId,
      title: thread.title,
      body: thread.body,
      authorId: demoUser.id,
      authorName: thread.author || demoUser.name,
      tags: Array.isArray(thread.tags) ? thread.tags : [],
      createdAt: thread.createdAt ? new Date(thread.createdAt) : new Date(),
    }));

  for (const threadDocument of threadDocuments) {
    const authorUser = await ensureSeedUserByName(threadDocument.authorName, authorUserCache);
    threadDocument.authorId = String(authorUser?.id ?? demoUser.id);
    threadDocument.authorProfileImage = String(authorUser?.profileImage ?? "");
  }

  if (threadDocuments.length > 0) {
    await insertManyThreads(threadDocuments);
    console.log(`Seeded ${threadDocuments.length} thread(s)`);
  } else {
    console.log("No new threads to seed");
  }

  const seedResources = await loadSeedResources();
  const existingResources = await Resource.find(
    {
      $or: seedResources.map((resource) => ({
        courseId: resource.courseId,
        title: resource.title,
      })),
    },
    { courseId: 1, title: 1 },
  ).lean();

  const existingResourceKeys = new Set(
    existingResources.map((resource) => `${String(resource.courseId).toLowerCase()}::${String(resource.title).toLowerCase()}`),
  );

  const resourceDocuments = seedResources
    .filter((resource) => {
      const key = `${String(resource.courseId).toLowerCase()}::${String(resource.title).toLowerCase()}`;
      return !existingResourceKeys.has(key);
    })
    .map((resource) => ({
      courseId: resource.courseId,
      title: resource.title,
      type: resource.type,
      summary: resource.summary,
      uploader: resource.author || demoUser.name,
      uploaderId: demoUser.id,
      createdAt: resource.createdAt ? new Date(resource.createdAt) : new Date(),
    }));

  for (const resourceDocument of resourceDocuments) {
    const uploaderUser = await ensureSeedUserByName(resourceDocument.uploader, authorUserCache);
    resourceDocument.uploaderId = String(uploaderUser?.id ?? demoUser.id);
  }

  if (resourceDocuments.length > 0) {
    await Resource.insertMany(resourceDocuments);
    console.log(`Seeded ${resourceDocuments.length} resource(s)`);
  } else {
    console.log("No new resources to seed");
  }

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const day = now.getDay();
  const distanceToMonday = day === 0 ? 6 : day - 1;
  const monday = new Date(now);
  monday.setDate(monday.getDate() - distanceToMonday);

  const nextMonday = new Date(monday);
  nextMonday.setDate(nextMonday.getDate() + 7);

  function buildDateTime(dayOffset, hour, minute) {
    const d = new Date(monday);
    d.setDate(d.getDate() + dayOffset);
    d.setHours(hour, minute, 0, 0);
    return d;
  }

  function toSessionKey(session) {
    return `${String(session.room).toLowerCase()}::${String(session.title).toLowerCase()}::${new Date(session.startAt).getTime()}::${new Date(session.endAt).getTime()}`;
  }

  const demoSessions = [
    {
      room: "Room 117",
      title: "COSC 320 Midterm Review",
      startAt: buildDateTime(1, 16, 0),
      endAt: buildDateTime(1, 17, 30),
      authorName: "Jordan",
    },
    {
      room: "Room 117",
      title: "Algorithms Practice",
      startAt: buildDateTime(2, 18, 0),
      endAt: buildDateTime(2, 19, 30),
      authorName: "Maya",
    },
    {
      room: "Room 204",
      title: "Database Project Work",
      startAt: buildDateTime(3, 17, 0),
      endAt: buildDateTime(3, 18, 0),
      authorName: "Alex",
    },
    {
      room: "Room 312",
      title: "Group Assignment Sync",
      startAt: buildDateTime(4, 19, 0),
      endAt: buildDateTime(4, 20, 0),
      authorName: "Priya",
    },
    {
      room: "Room 204",
      title: "Final Exam Q&A",
      startAt: buildDateTime(5, 16, 30),
      endAt: buildDateTime(5, 18, 0),
      authorName: "Casey",
    },
  ];

  for (const session of demoSessions) {
    const sessionAuthorUser = await ensureSeedUserByName(session.authorName, authorUserCache);
    session.authorId = String(sessionAuthorUser?.id ?? demoUser.id);
    session.authorProfileImage = String(sessionAuthorUser?.profileImage ?? "");
  }

  const existingWeekSessions = await Session.find(
    {
      startAt: { $gte: monday, $lt: nextMonday },
      room: { $in: demoSessions.map((session) => session.room) },
      title: { $in: demoSessions.map((session) => session.title) },
    },
    { room: 1, title: 1, startAt: 1, endAt: 1 }
  ).lean();

  const existingSessionKeys = new Set(existingWeekSessions.map(toSessionKey));
  const sessionsToInsert = demoSessions.filter((session) => !existingSessionKeys.has(toSessionKey(session)));

  if (sessionsToInsert.length > 0) {
    await Session.insertMany(sessionsToInsert);
    console.log(`Seeded ${sessionsToInsert.length} study session(s) for current week`);
  } else {
    console.log("No new study sessions to seed for current week");
  }

  await normalizeExistingContentOwnership(demoUser);

  await seedReplies(demoUser);
}
