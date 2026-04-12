import request from "supertest";
import { jest } from "@jest/globals";

const listCoursesFromDbMock = jest.fn();
const getCourseByIdMock = jest.fn();

jest.unstable_mockModule("../../services/courseService.js", () => ({
  saveCourse: jest.fn(),
  getCourseById: getCourseByIdMock,
  listCoursesFromDb: listCoursesFromDbMock,
  updateCourse: jest.fn(),
  deleteCourse: jest.fn(),
}));

const { default: app } = await import("../../app.js");

describe("GET /api/courses", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("returns filtered courses from service", async () => {
    listCoursesFromDbMock.mockResolvedValue([
      { id: "CISC275", label: "CISC275", title: "Intro SWE" },
    ]);

    const response = await request(app).get("/api/courses").query({ q: "cisc" });

    expect(response.status).toBe(200);
    expect(listCoursesFromDbMock).toHaveBeenCalledWith("cisc");
    expect(response.body).toEqual({
      count: 1,
      results: [{ id: "CISC275", label: "CISC275", title: "Intro SWE" }],
    });
  });

  test("returns 500 when service throws", async () => {
    listCoursesFromDbMock.mockRejectedValue(new Error("db error"));

    const response = await request(app).get("/api/courses");

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: "Failed to list courses" });
  });
});

describe("GET /api/courses/:courseId", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("returns 404 when course does not exist", async () => {
    getCourseByIdMock.mockResolvedValue(null);

    const response = await request(app).get("/api/courses/NOPE101");

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ error: "Course not found" });
  });

  test("returns course payload when found", async () => {
    getCourseByIdMock.mockResolvedValue({ id: "CISC275", title: "Intro SWE" });

    const response = await request(app).get("/api/courses/CISC275");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ course: { id: "CISC275", title: "Intro SWE" } });
  });
});
