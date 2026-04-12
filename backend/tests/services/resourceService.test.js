import { jest } from "@jest/globals";

const createResourceMock = jest.fn();
const findResourceByIdMock = jest.fn();
const findResourcesByCourseIdMock = jest.fn();
const searchResourcesByCourseIdInRepositoryMock = jest.fn();
const updateResourceByIdInRepositoryMock = jest.fn();
const deleteResourceByIdInRepositoryMock = jest.fn();

jest.unstable_mockModule("../../repositories/resourceRepository.js", () => ({
  createResource: createResourceMock,
  findResourceById: findResourceByIdMock,
  findResourcesByCourseId: findResourcesByCourseIdMock,
  searchResourcesByCourseId: searchResourcesByCourseIdInRepositoryMock,
  updateResourceById: updateResourceByIdInRepositoryMock,
  deleteResourceById: deleteResourceByIdInRepositoryMock,
}));

const {
  saveResource,
  getResourcesByCourseId,
  searchResourcesByCourseId,
  getResourceById,
  updateResourceById,
  deleteResourceById,
} = await import("../../services/resourceService.js");

describe("resourceService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("saveResource returns serialized resource", async () => {
    createResourceMock.mockResolvedValue({
      toJSON: () => ({ id: "res-1", title: "Syllabus" }),
    });

    const result = await saveResource({ title: "Syllabus" });

    expect(createResourceMock).toHaveBeenCalledWith({ title: "Syllabus" });
    expect(result).toEqual({ id: "res-1", title: "Syllabus" });
  });

  test("getResourcesByCourseId maps all resources to JSON", async () => {
    findResourcesByCourseIdMock.mockResolvedValue([
      { toJSON: () => ({ id: "res-1" }) },
      { toJSON: () => ({ id: "res-2" }) },
    ]);

    const result = await getResourcesByCourseId("CISC275");

    expect(findResourcesByCourseIdMock).toHaveBeenCalledWith("CISC275");
    expect(result).toEqual([{ id: "res-1" }, { id: "res-2" }]);
  });

  test("searchResourcesByCourseId preserves repository pagination payload", async () => {
    searchResourcesByCourseIdInRepositoryMock.mockResolvedValue({
      results: [{ toJSON: () => ({ id: "res-1" }) }],
      total: 1,
      page: 3,
      limit: 5,
      totalPages: 1,
    });

    const result = await searchResourcesByCourseId("CISC275", "week", { page: 3, limit: 5 });

    expect(searchResourcesByCourseIdInRepositoryMock).toHaveBeenCalledWith("CISC275", "week", {
      page: 3,
      limit: 5,
    });
    expect(result).toEqual({
      results: [{ id: "res-1" }],
      total: 1,
      page: 3,
      limit: 5,
      totalPages: 1,
    });
  });

  test("get/update/delete wrappers handle null and boolean conversion", async () => {
    findResourceByIdMock.mockResolvedValue(null);
    updateResourceByIdInRepositoryMock.mockResolvedValue({ toJSON: () => ({ id: "res-3" }) });
    deleteResourceByIdInRepositoryMock.mockResolvedValue(0);

    await expect(getResourceById("missing-id")).resolves.toBeNull();
    await expect(updateResourceById("res-3", { title: "Updated" })).resolves.toEqual({ id: "res-3" });
    await expect(deleteResourceById("res-3")).resolves.toBe(false);
  });
});
