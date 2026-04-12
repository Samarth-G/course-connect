import request from "supertest";
import { jest } from "@jest/globals";

const searchResourcesByCourseIdMock = jest.fn();

jest.unstable_mockModule("../../services/resourceService.js", () => ({
  searchResourcesByCourseId: searchResourcesByCourseIdMock,
  getResourceById: jest.fn(),
  saveResource: jest.fn(),
  updateResourceById: jest.fn(),
  deleteResourceById: jest.fn(),
}));

const { default: app } = await import("../../app.js");

describe("GET /api/courses/:courseId/resources", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("returns paginated resources from service", async () => {
    searchResourcesByCourseIdMock.mockResolvedValue({
      results: [{ id: "res-1", title: "Week 1 Slides" }],
      total: 1,
      page: 2,
      limit: 10,
      totalPages: 1,
    });

    const response = await request(app)
      .get("/api/courses/CISC275/resources")
      .query({ q: "slides", page: "2", limit: "10" });

    expect(response.status).toBe(200);
    expect(searchResourcesByCourseIdMock).toHaveBeenCalledWith("CISC275", "slides", {
      page: 2,
      limit: 10,
    });
    expect(response.body).toEqual({
      query: "slides",
      count: 1,
      total: 1,
      page: 2,
      limit: 10,
      totalPages: 1,
      results: [{ id: "res-1", title: "Week 1 Slides" }],
    });
  });

  test("returns 500 when service throws", async () => {
    searchResourcesByCourseIdMock.mockRejectedValue(new Error("db down"));

    const response = await request(app).get("/api/courses/CISC275/resources");

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: "Failed to search resources" });
  });
});
