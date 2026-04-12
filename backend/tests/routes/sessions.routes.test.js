import request from "supertest";
import { jest } from "@jest/globals";

const listSessionsByRoomForWeekMock = jest.fn();
const normalizeWeekStartMock = jest.fn();

jest.unstable_mockModule("../../services/sessionService.js", () => ({
  STUDY_ROOMS: ["Room 117", "Room 204", "Room 312"],
  createStudySession: jest.fn(),
  deleteStudySession: jest.fn(),
  getConflictingStudySession: jest.fn(),
  getStudySessionById: jest.fn(),
  listSessionsByRoomForWeek: listSessionsByRoomForWeekMock,
  normalizeWeekStart: normalizeWeekStartMock,
  updateStudySession: jest.fn(),
}));

const { default: app } = await import("../../app.js");

describe("GET /api/sessions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    normalizeWeekStartMock.mockReturnValue(new Date("2026-04-06T00:00:00.000Z"));
  });

  test("returns sessions for room and week", async () => {
    listSessionsByRoomForWeekMock.mockResolvedValue([
      { id: "s1", room: "Room 117", title: "Midterm review" },
    ]);

    const response = await request(app)
      .get("/api/sessions")
      .query({ room: "Room 117", weekStart: "2026-04-06" });

    expect(response.status).toBe(200);
    expect(normalizeWeekStartMock).toHaveBeenCalledWith("2026-04-06");
    expect(listSessionsByRoomForWeekMock).toHaveBeenCalledWith(
      "Room 117",
      new Date("2026-04-06T00:00:00.000Z")
    );
    expect(response.body).toMatchObject({
      room: "Room 117",
      count: 1,
      results: [{ id: "s1", room: "Room 117", title: "Midterm review" }],
    });
  });

  test("returns 400 when weekStart is invalid", async () => {
    normalizeWeekStartMock.mockReturnValue(null);

    const response = await request(app).get("/api/sessions").query({ weekStart: "bad-date" });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: "weekStart must be a valid date" });
  });
});
