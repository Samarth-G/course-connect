export const PROFILE_IMAGE_MAX_BYTES = 5 * 1024 * 1024; // 5 MB
export const RESOURCE_MAX_BYTES = 25 * 1024 * 1024; // 25 MB

export function bytesToMB(bytes) {
	return `${Math.round(bytes / (1024 * 1024))} MB`;
}
