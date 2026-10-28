/**
 * src/lib/utils/url.ts
 *
 * Safe link validation and sanitization utility.
 * Prevents protocol injection and XSS via untrusted proof links (e.g. javascript:, data:, vbscript:).
 */

const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);

/**
 * Validates if a given URL string uses an allowed safe protocol (http or https).
 */
export function isSafeUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== "string") {
    return false;
  }

  const trimmed = url.trim();
  if (!trimmed) {
    return false;
  }

  try {
    const parsed = new URL(trimmed);
    return ALLOWED_PROTOCOLS.has(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Sanitizes a URL for safe rendering in href attributes.
 * Returns the URL if safe, or a fallback URL / '#' if invalid or dangerous.
 */
export function sanitizeUrl(url: string | null | undefined, fallback: string = "#"): string {
  if (isSafeUrl(url)) {
    return (url as string).trim();
  }
  return fallback;
}
