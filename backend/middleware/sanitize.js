import sanitizeHtml from "sanitize-html";

const SANITIZE_OPTIONS = {
  allowedTags: [],
  allowedAttributes: {},
};

function sanitizeValue(value) {
  if (typeof value === "string") {
    return sanitizeHtml(value, SANITIZE_OPTIONS);
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (value && typeof value === "object") {
    return sanitizeObject(value);
  }
  return value;
}

function sanitizeObject(obj) {
  const cleaned = {};
  for (const [key, value] of Object.entries(obj)) {
    cleaned[key] = sanitizeValue(value);
  }
  return cleaned;
}

export function sanitizeBody(req, _res, next) {
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeObject(req.body);
  }
  return next();
}
