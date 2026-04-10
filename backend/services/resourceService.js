import Resource from "../models/resourceModel.js";

export async function saveResource(resourceData) {
  const createdResource = await Resource.create(resourceData);
  return createdResource.toJSON();
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function getResourcesByCourseId(courseId) {
  const normalizedCourseId = String(courseId).trim().toLowerCase();

  const resources = await Resource.find({
    courseId: { $regex: `^${escapeRegex(normalizedCourseId)}$`, $options: "i" },
  }).sort({ createdAt: -1 });

  return resources.map((resource) => resource.toJSON());
}

export async function searchResourcesByCourseId(courseId, searchTerm = "", options = {}) {
  const { page = 1, limit = 20 } = options;

  const normalizedCourseId = String(courseId).trim().toLowerCase();
  const normalizedSearchTerm = String(searchTerm).trim().toLowerCase();
  const skip = (page - 1) * limit;

  const query = {
    courseId: { $regex: `^${escapeRegex(normalizedCourseId)}$`, $options: "i" },
  };

  if (normalizedSearchTerm) {
    const safeSearch = escapeRegex(normalizedSearchTerm);
    query.$or = [
      { title: { $regex: safeSearch, $options: "i" } },
      { summary: { $regex: safeSearch, $options: "i" } },
      { type: { $regex: safeSearch, $options: "i" } },
    ];
  }

  const [results, total] = await Promise.all([
    Resource.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Resource.countDocuments(query),
  ]);

  return {
    results: results.map((resource) => resource.toJSON()),
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export async function getResourceById(resourceId) {
  const resource = await Resource.findById(resourceId);
  return resource ? resource.toJSON() : null;
}

export async function updateResourceById(resourceId, updateData) {
  const updated = await Resource.findByIdAndUpdate(
    resourceId,
    updateData,
    { returnDocument: "after", runValidators: true }
  );

  return updated ? updated.toJSON() : null;
}

export async function deleteResourceById(resourceId) {
  const deleted = await Resource.findByIdAndDelete(resourceId);
  return Boolean(deleted);
}
