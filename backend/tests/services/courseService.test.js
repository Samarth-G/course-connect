import { jest } from "@jest/globals";

const createCourseMock = jest.fn();
const findCourseByCourseIdMock = jest.fn();
const findCoursesBySearchMock = jest.fn();
const updateCourseByCourseIdMock = jest.fn();
const deleteCourseByCourseIdMock = jest.fn();

jest.unstable_mockModule("../../repositories/courseRepository.js", () => ({
  createCourse: createCourseMock,
  findCourseByCourseId: findCourseByCourseIdMock,
  findCoursesBySearch: findCoursesBySearchMock,
  updateCourseByCourseId: updateCourseByCourseIdMock,
  deleteCourseByCourseId: deleteCourseByCourseIdMock,
}));

const {
  saveCourse,
  getCourseById,
  listCoursesFromDb,
  updateCourse,
  deleteCourse,
} = await import("../../services/courseService.js");

describe("courseService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("saveCourse normalizes course shape", async () => {
    createCourseMock.mockResolvedValue({
      toJSON: () => ({
        courseId: " CISC275 ",
        title: "Intro SWE",
        description: "Foundations",
        createdAt: "2026-01-01",
        updatedAt: "2026-01-02",
      }),
    });

    const result = await saveCourse({ courseId: "CISC275", title: "Intro SWE" });

    expect(result).toEqual({
      id: "CISC275",
      courseId: "CISC275",
      label: "CISC275",
      title: "Intro SWE",
      description: "Foundations",
      createdAt: "2026-01-01",
      updatedAt: "2026-01-02",
    });
  });

  test("get/list/update/delete wrappers map null and booleans", async () => {
    findCourseByCourseIdMock.mockResolvedValue(null);
    findCoursesBySearchMock.mockResolvedValue([
      { toJSON: () => ({ courseId: "MATH241", title: "Calculus", description: "Derivatives" }) },
    ]);
    updateCourseByCourseIdMock.mockResolvedValue({
      toJSON: () => ({ courseId: "MATH241", title: "Calc II", description: "Integrals" }),
    });
    deleteCourseByCourseIdMock.mockResolvedValue(undefined);

    await expect(getCourseById("CISC275")).resolves.toBeNull();
    await expect(listCoursesFromDb("math")).resolves.toEqual([
      {
        id: "MATH241",
        courseId: "MATH241",
        label: "MATH241",
        title: "Calculus",
        description: "Derivatives",
        createdAt: undefined,
        updatedAt: undefined,
      },
    ]);
    await expect(updateCourse("MATH241", { title: "Calc II" })).resolves.toMatchObject({
      id: "MATH241",
      title: "Calc II",
    });
    await expect(deleteCourse("MATH241")).resolves.toBe(false);
  });
});
