/**
 * src/lib/auth/rate-limit.ts
 *
 * In-memory sliding-window rate limiter for sensitive authentication & invite endpoints.
 * Resists credential stuffing and brute-force attacks on invite codes and magic links.
 */

interface RateLimitRecord {
  timestamps: number[];
}

const rateLimitStore = new Map<string, RateLimitRecord>();

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: number; // Unix timestamp in ms
}

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const windowStart = now - windowMs;

  let record = rateLimitStore.get(key);
  if (!record) {
    record = { timestamps: [] };
    rateLimitStore.set(key, record);
  }

  // Filter timestamps within current window
  record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

  if (record.timestamps.length >= limit) {
    const oldestTimestamp = record.timestamps[0];
    const resetAt = oldestTimestamp + windowMs;
    return {
      success: false,
      limit,
      remaining: 0,
      resetAt,
    };
  }

  record.timestamps.push(now);

  return {
    success: true,
    limit,
    remaining: limit - record.timestamps.length,
    resetAt: now + windowMs,
  };
}

export function resetRateLimits(): void {
  rateLimitStore.clear();
}

/**
 * Helper to extract client identifier (IP or forwarded IP) from Request headers.
 */
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  return "127.0.0.1";
}

// Preset policies per endpoint:
export const RATE_LIMIT_POLICIES = {
  login: { limit: 5, windowMs: 15 * 60 * 1000 }, // 5 attempts per 15 min
  magicLinkRequest: { limit: 3, windowMs: 15 * 60 * 1000 }, // 3 requests per 15 min
  magicLinkVerify: { limit: 5, windowMs: 15 * 60 * 1000 }, // 5 verify attempts per 15 min
  inviteVerify: { limit: 10, windowMs: 10 * 60 * 1000 }, // 10 verifications per 10 min
  register: { limit: 5, windowMs: 60 * 60 * 1000 }, // 5 registrations per hour
} as const;
