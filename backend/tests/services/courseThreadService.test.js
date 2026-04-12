import { jest } from "@jest/globals";

const addReplyToThreadByCourseAndIdMock = jest.fn();
const aggregateCoursesMock = jest.fn();
const createThreadMock = jest.fn();
const deleteReplyByCourseThreadAndIdMock = jest.fn();
const deleteThreadByCourseAndIdMock = jest.fn();
const findReplyByCourseThreadAndIdMock = jest.fn();
const findThreadByCourseAndIdMock = jest.fn();
const searchThreadsByCourseMock = jest.fn();
const updateReplyByCourseThreadAndIdMock = jest.fn();
const updateThreadByCourseAndIdMock = jest.fn();

jest.unstable_mockModule("../../repositories/courseThreadRepository.js", () => ({
  addReplyToThreadByCourseAndId: addReplyToThreadByCourseAndIdMock,
  aggregateCourses: aggregateCoursesMock,
  createThread: createThreadMock,
  deleteReplyByCourseThreadAndId: deleteReplyByCourseThreadAndIdMock,
  deleteThreadByCourseAndId: deleteThreadByCourseAndIdMock,
  findReplyByCourseThreadAndId: findReplyByCourseThreadAndIdMock,
  findThreadByCourseAndId: findThreadByCourseAndIdMock,
  searchThreadsByCourse: searchThreadsByCourseMock,
  updateReplyByCourseThreadAndId: updateReplyByCourseThreadAndIdMock,
  updateThreadByCourseAndId: updateThreadByCourseAndIdMock,
}));

const {
  saveCourseThread,
  listCoursesFromDb,
  searchCourseThreadsFromDb,
  getCourseThreadById,
  updateCourseThreadById,
  deleteCourseThreadById,
  addReplyToCourseThreadById,
  listCourseThreadRepliesById,
  getCourseThreadReplyById,
  updateCourseThreadReplyById,
  deleteCourseThreadReplyById,
} = await import("../../services/courseThreadService.js");

describe("courseThreadService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("saveCourseThread returns serialized thread", async () => {
    createThreadMock.mockResolvedValue({
      toJSON: () => ({ id: "thread-1", title: "Welcome" }),
    });

    const result = await saveCourseThread({ title: "Welcome" });

    expect(createThreadMock).toHaveBeenCalledWith({ title: "Welcome" });
    expect(result).toEqual({ id: "thread-1", title: "Welcome" });
  });

  test("listCoursesFromDb maps and filters grouped course data", async () => {
    aggregateCoursesMock.mockResolvedValue([
      {
        _id: "cisc275",
        latestBody: "   " + "A".repeat(140),
        threadCount: 4,
        latestCreatedAt: "2024-10-01T00:00:00.000Z",
      },
      {
        _id: "math241",
        latestBody: "Integrals practice set",
        threadCount: 2,
        latestCreatedAt: null,
      },
    ]);

    const filtered = await listCoursesFromDb("CISC");

    expect(filtered).toHaveLength(1);
    expect(filtered[0]).toMatchObject({
      id: "cisc275",
      label: "CISC275",
      threadCount: 4,
    });
    expect(filtered[0].description.endsWith("...")).toBe(true);
  });

  test("searchCourseThreadsFromDb maps results and computes totalPages", async () => {
    searchThreadsByCourseMock.mockResolvedValue({
      results: [{ toJSON: () => ({ id: "thread-1" }) }],
      total: 21,
    });

    const result = await searchCourseThreadsFromDb("CISC275", "exam", { page: 2, limit: 10 });

    expect(searchThreadsByCourseMock).toHaveBeenCalledWith("CISC275", "exam", {
      page: 2,
      limit: 10,
    });
    expect(result).toEqual({
      results: [{ id: "thread-1" }],
      total: 21,
      page: 2,
      limit: 10,
      totalPages: 3,
    });
  });

  test("thread and reply accessors normalize nulls and booleans", async () => {
    findThreadByCourseAndIdMock.mockResolvedValue({
      toJSON: () => ({ id: "thread-2", replies: [{ id: "reply-1" }] }),
    });
    updateThreadByCourseAndIdMock.mockResolvedValue(null);
    deleteThreadByCourseAndIdMock.mockResolvedValue(1);

    addReplyToThreadByCourseAndIdMock.mockResolvedValue({ toJSON: () => ({ id: "thread-2" }) });
    findReplyByCourseThreadAndIdMock.mockResolvedValue(null);
    updateReplyByCourseThreadAndIdMock.mockResolvedValue({ toJSON: () => ({ id: "reply-1" }) });
    deleteReplyByCourseThreadAndIdMock.mockResolvedValue(undefined);

    await expect(getCourseThreadById("CISC275", "thread-2")).resolves.toEqual({
      id: "thread-2",
      replies: [{ id: "reply-1" }],
    });
    await expect(listCourseThreadRepliesById("CISC275", "thread-2")).resolves.toEqual([{ id: "reply-1" }]);
    await expect(updateCourseThreadById("CISC275", "thread-2", { title: "Updated" })).resolves.toBeNull();
    await expect(deleteCourseThreadById("CISC275", "thread-2")).resolves.toBe(true);

    await expect(addReplyToCourseThreadById("CISC275", "thread-2", { body: "Nice" })).resolves.toEqual({
      id: "thread-2",
    });
    await expect(getCourseThreadReplyById("CISC275", "thread-2", "reply-1")).resolves.toBeNull();
    await expect(updateCourseThreadReplyById("CISC275", "thread-2", "reply-1", { body: "Edit" })).resolves.toEqual({
      id: "reply-1",
    });
    await expect(deleteCourseThreadReplyById("CISC275", "thread-2", "reply-1")).resolves.toBe(false);
  });
});
