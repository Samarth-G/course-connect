import request from "supertest";
import { jest } from "@jest/globals";

const searchCourseThreadsFromDbMock = jest.fn();

jest.unstable_mockModule("../../services/courseThreadService.js", () => ({
  addReplyToCourseThreadById: jest.fn(),
  deleteCourseThreadReplyById: jest.fn(),
  deleteCourseThreadById: jest.fn(),
  getCourseThreadById: jest.fn(),
  getCourseThreadReplyById: jest.fn(),
  listCoursesFromDb: jest.fn(),
  listCourseThreadRepliesById: jest.fn(),
  saveCourseThread: jest.fn(),
  updateCourseThreadReplyById: jest.fn(),
  updateCourseThreadById: jest.fn(),
  searchCourseThreadsFromDb: searchCourseThreadsFromDbMock,
}));

const { default: app } = await import("../../app.js");

describe("GET /api/courses/:courseId/threads", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("returns paginated threads from service", async () => {
    searchCourseThreadsFromDbMock.mockResolvedValue({
      results: [{ id: "thread-1", title: "Exam prep" }],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    });

    const response = await request(app)
      .get("/api/courses/CISC275/threads")
      .query({ q: "exam" });

    expect(response.status).toBe(200);
    expect(searchCourseThreadsFromDbMock).toHaveBeenCalledWith("CISC275", "exam", {
      page: 1,
      limit: 20,
    });
    expect(response.body).toEqual({
      query: "exam",
      count: 1,
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
      results: [{ id: "thread-1", title: "Exam prep" }],
    });
  });

  test("returns 500 when service throws", async () => {
    searchCourseThreadsFromDbMock.mockRejectedValue(new Error("repository failure"));

    const response = await request(app).get("/api/courses/CISC275/threads");

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: "Failed to search threads" });
  });
});
