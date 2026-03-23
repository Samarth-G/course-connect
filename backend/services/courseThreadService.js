import Thread from "../models/threadModel.js";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const THREAD_DATA_FILE = path.join(__dirname, "..", "data", "threads.json");

export async function saveCourseThread(threadData) {
  const createdThread = await Thread.create(threadData);
  return createdThread.toJSON();
}

export async function searchCourseThreadsFromJson(courseId, searchTerm = "") {
  const fileContent = await fs.readFile(THREAD_DATA_FILE, "utf8");
  const threads = JSON.parse(fileContent);

  const normalizedCourseId = String(courseId).trim().toLowerCase();
  const normalizedSearchTerm = String(searchTerm).trim().toLowerCase();

  const threadsInCourse = threads.filter((thread) =>
    String(thread.courseId).trim().toLowerCase() === normalizedCourseId,
  );

  if (!normalizedSearchTerm) {
    return threadsInCourse;
  }

  return threadsInCourse.filter((thread) => {
    const title = String(thread.title ?? "").toLowerCase();
    const body = String(thread.body ?? "").toLowerCase();
    return title.includes(normalizedSearchTerm) || body.includes(normalizedSearchTerm);
  });
}
