import bcrypt from "bcryptjs";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import Course from "../models/courseModel.js";
import Thread from "../models/threadModel.js";
import User from "../models/userModel.js";
import Resource from "../models/resourceModel.js";

const DEMO_USER_EMAIL = "demo@course-connect.local";
const DEMO_USER_PASSWORD = "Password123!";
const COURSES_FILE_URL = new URL("../data/courses.json", import.meta.url);
const THREADS_FILE_URL = new URL("../data/threads.json", import.meta.url);
const RESOURCES_FILE_URL = new URL("../data/resources.json", import.meta.url);

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

export async function seedDatabase() {
  let demoUser = await User.findOne({ email: DEMO_USER_EMAIL });
  if (!demoUser) {
    demoUser = await User.create({
      name: "CourseConnect Demo",
      email: DEMO_USER_EMAIL,
      passwordHash: await bcrypt.hash(DEMO_USER_PASSWORD, 10),
    });
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
  const existingThreads = await Thread.find(
    {
      $or: seedThreads.map((thread) => ({
        courseId: thread.courseId,
        title: thread.title,
      })),
    },
    { courseId: 1, title: 1 },
  ).lean();

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

  if (threadDocuments.length > 0) {
    await Thread.insertMany(threadDocuments);
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

  if (resourceDocuments.length > 0) {
    await Resource.insertMany(resourceDocuments);
    console.log(`Seeded ${resourceDocuments.length} resource(s)`);
  } else {
    console.log("No new resources to seed");
  }
}
