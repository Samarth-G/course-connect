import Resource from "../models/resourceModel.js";

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function createResource(resourceData) {
  return Resource.create(resourceData);
}

export async function findResourcesByCourseId(courseId) {
  const normalizedCourseId = String(courseId).trim().toLowerCase();

  return Resource.find({
    courseId: { $regex: `^${escapeRegex(normalizedCourseId)}$`, $options: "i" },
  }).sort({ createdAt: -1 });
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
    results,
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export async function findResourceById(resourceId) {
  return Resource.findById(resourceId);
}

export async function updateResourceById(resourceId, updateData) {
  return Resource.findByIdAndUpdate(
    resourceId,
    updateData,
    { returnDocument: "after", runValidators: true }
  );
}

export async function deleteResourceById(resourceId) {
  return Resource.findByIdAndDelete(resourceId);
}