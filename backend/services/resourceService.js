import {
  createResource,
  findResourceById,
  findResourcesByCourseId,
  searchResourcesByCourseId as searchResourcesByCourseIdInRepository,
  updateResourceById as updateResourceByIdInRepository,
  deleteResourceById as deleteResourceByIdInRepository,
} from "../repositories/resourceRepository.js";

export async function saveResource(resourceData) {
  const createdResource = await createResource(resourceData);
  return createdResource.toJSON();
}

export async function getResourcesByCourseId(courseId) {
  const resources = await findResourcesByCourseId(courseId);

  return resources.map((resource) => resource.toJSON());
}

export async function searchResourcesByCourseId(courseId, searchTerm = "", options = {}) {
  const { results, total, page, limit, totalPages } = await searchResourcesByCourseIdInRepository(
    courseId,
    searchTerm,
    options,
  );

  return {
    results: results.map((resource) => resource.toJSON()),
    total,
    page,
    limit,
    totalPages,
  };
}

export async function getResourceById(resourceId) {
  const resource = await findResourceById(resourceId);
  return resource ? resource.toJSON() : null;
}

export async function updateResourceById(resourceId, updateData) {
  const updated = await updateResourceByIdInRepository(resourceId, updateData);

  return updated ? updated.toJSON() : null;
}

export async function deleteResourceById(resourceId) {
  const deleted = await deleteResourceByIdInRepository(resourceId);
  return Boolean(deleted);
}
