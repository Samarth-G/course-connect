import bcrypt from "bcryptjs";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import Thread from "../models/threadModel.js";
import User from "../models/userModel.js";

const DEMO_USER_EMAIL = "demo@course-connect.local";
const DEMO_USER_PASSWORD = "Password123!";
const THREADS_FILE_URL = new URL("../data/threads.json", import.meta.url);

async function loadSeedThreads() {
  const filePath = fileURLToPath(THREADS_FILE_URL);
  const rawThreads = await readFile(filePath, "utf8");
  return JSON.parse(rawThreads);
}

export async function seedDatabase() {
  let demoUser = await User.findOne({ email: DEMO_USER_EMAIL });
  if (!demoUser) {
    demoUser = await User.create({
      name: "CourseConnect Demo",
      email: DEMO_USER_EMAIL,
      passwordHash: await bcrypt.hash(DEMO_USER_PASSWORD, 10),
    });
  }

  const seedThreads = await loadSeedThreads();
  const existingThreads = await Thread.find(
    {
      $or: seedThreads.map((thread) => ({
        courseId: thread.courseId,
        title: thread.title,
      })),
    },
    { courseId: 1, title: 1 },
  ).lean();

  const existingKeys = new Set(
    existingThreads.map((thread) => `${String(thread.courseId).toLowerCase()}::${String(thread.title).toLowerCase()}`),
  );

  const threadDocuments = seedThreads
    .filter((thread) => {
      const key = `${String(thread.courseId).toLowerCase()}::${String(thread.title).toLowerCase()}`;
      return !existingKeys.has(key);
    })
    .map((thread, index) => ({
      courseId: thread.courseId,
      title: thread.title,
      body: thread.body,
      authorId: demoUser.id,
      authorName: thread.author || demoUser.name,
      tags: index % 3 === 0 ? ["exam"] : index % 3 === 1 ? ["assignment"] : ["discussion"],
      createdAt: thread.createdAt ? new Date(thread.createdAt) : new Date(),
    }));

  if (threadDocuments.length > 0) {
    await Thread.insertMany(threadDocuments);
    console.log(`Seeded ${threadDocuments.length} thread(s)`);
    return;
  }
    console.log("No new threads to seed");
}