import { jest } from "@jest/globals";

const createSessionMock = jest.fn();
const deleteSessionByIdMock = jest.fn();
const findConflictingSessionMock = jest.fn();
const findSessionByIdMock = jest.fn();
const findSessionsByRoomAndRangeMock = jest.fn();
const updateSessionByIdMock = jest.fn();

jest.unstable_mockModule("../../repositories/sessionRepository.js", () => ({
  createSession: createSessionMock,
  deleteSessionById: deleteSessionByIdMock,
  findConflictingSession: findConflictingSessionMock,
  findSessionById: findSessionByIdMock,
  findSessionsByRoomAndRange: findSessionsByRoomAndRangeMock,
  updateSessionById: updateSessionByIdMock,
}));

const {
  normalizeWeekStart,
  buildWeekRange,
  listSessionsByRoomForWeek,
  createStudySession,
  getStudySessionById,
  getConflictingStudySession,
  updateStudySession,
  deleteStudySession,
} = await import("../../services/sessionService.js");

describe("sessionService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("normalizeWeekStart returns monday and null for invalid", () => {
    const monday = normalizeWeekStart("2026-04-09");

    expect(monday).toBeInstanceOf(Date);
    expect(monday.getDay()).toBe(1);
    expect(monday.getHours()).toBe(0);
    expect(monday.getMinutes()).toBe(0);
    expect(monday.getSeconds()).toBe(0);
    expect(monday.getMilliseconds()).toBe(0);
    expect(normalizeWeekStart("not-a-date")).toBeNull();
  });

  test("buildWeekRange spans exactly 7 days", () => {
    const start = new Date("2026-04-06T00:00:00.000Z");
    const range = buildWeekRange(start);

    expect(range.rangeStart.toISOString()).toBe("2026-04-06T00:00:00.000Z");
    expect(range.rangeEnd.toISOString()).toBe("2026-04-13T00:00:00.000Z");
  });

  test("repository wrappers serialize models", async () => {
    findSessionsByRoomAndRangeMock.mockResolvedValue([
      { toJSON: () => ({ id: "s1" }) },
      { toJSON: () => ({ id: "s2" }) },
    ]);
    createSessionMock.mockResolvedValue({ toJSON: () => ({ id: "s3" }) });
    findSessionByIdMock.mockResolvedValue(null);
    findConflictingSessionMock.mockResolvedValue({ toJSON: () => ({ id: "conflict-1" }) });
    updateSessionByIdMock.mockResolvedValue({ toJSON: () => ({ id: "s3", title: "Updated" }) });
    deleteSessionByIdMock.mockResolvedValue(1);

    const sessions = await listSessionsByRoomForWeek("Room 117", new Date("2026-04-06T00:00:00.000Z"));

    expect(sessions).toEqual([{ id: "s1" }, { id: "s2" }]);
    await expect(createStudySession({ title: "Review" })).resolves.toEqual({ id: "s3" });
    await expect(getStudySessionById("missing")).resolves.toBeNull();
    await expect(getConflictingStudySession("Room 117", new Date(), new Date())).resolves.toEqual({ id: "conflict-1" });
    await expect(updateStudySession("s3", { title: "Updated" })).resolves.toEqual({ id: "s3", title: "Updated" });
    await expect(deleteStudySession("s3")).resolves.toBe(true);
  });
});
