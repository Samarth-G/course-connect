import { readFile, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const threadsFilePath = path.join(dirname, "threads.json");

async function readThreads() {
  try {
    const data = await readFile(threadsFilePath, "utf-8");
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if (error.code === "ENOENT") {
      await writeFile(threadsFilePath, "[]\n", "utf-8");
      return [];
    }
    throw error;
  }
}

async function writeThreads(threads) {
  await writeFile(threadsFilePath, `${JSON.stringify(threads, null, 2)}\n`, "utf-8");
}

export async function saveCourseThread(threadData) {
  const threads = await readThreads();

  const newThread = {
    id: String(threads.length + 1),
    ...threadData,
    createdAt: new Date().toISOString(),
  };

  threads.push(newThread);
  await writeThreads(threads);

  return newThread;
}
