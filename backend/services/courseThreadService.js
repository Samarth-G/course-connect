import Thread from "../models/threadModel.js";

export async function saveCourseThread(threadData) {
  const createdThread = await Thread.create(threadData);
  return createdThread.toJSON();
}
