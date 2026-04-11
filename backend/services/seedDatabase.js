import bcrypt from "bcryptjs";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import Course from "../models/courseModel.js";
import Thread from "../models/threadModel.js";
import User from "../models/userModel.js";
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
    },
    {
      room: "Room 117",
      title: "Algorithms Practice",
      startAt: buildDateTime(2, 18, 0),
      endAt: buildDateTime(2, 19, 30),
    },
    {
      room: "Room 204",
      title: "Database Project Work",
      startAt: buildDateTime(3, 17, 0),
      endAt: buildDateTime(3, 18, 0),
    },
    {
      room: "Room 312",
      title: "Group Assignment Sync",
      startAt: buildDateTime(4, 19, 0),
      endAt: buildDateTime(4, 20, 0),
    },
    {
      room: "Room 204",
      title: "Final Exam Q&A",
      startAt: buildDateTime(5, 16, 30),
      endAt: buildDateTime(5, 18, 0),
    },
  ].map((session) => ({
    ...session,
    authorId: demoUser.id,
    authorName: demoUser.name,
    authorProfileImage: demoUser.profileImage || "",
  }));

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
}
