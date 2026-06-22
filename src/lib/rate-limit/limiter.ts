import { AppError } from "@/lib/errors/app-error";

type RateLimitOptions = {
  key: string;
  limit: number;
  windowMs: number;
};

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, RateLimitEntry>();

export function getClientIpFromHeaders(headers: Headers) {
  const forwardedFor = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = headers.get("x-real-ip")?.trim();

  return forwardedFor || realIp || "unknown";
}

export function buildRateLimitKey(parts: Array<string | null | undefined>) {
  return parts.map((part) => part || "unknown").join(":");
}

export function assertRateLimit({ key, limit, windowMs }: RateLimitOptions) {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, {
      count: 1,
      resetAt: now + windowMs
    });
    return;
  }

  if (existing.count >= limit) {
    const retryAfterSeconds = Math.ceil((existing.resetAt - now) / 1000);

    throw new AppError("RATE_LIMITED", "Too many requests. Please try again later.", 429, {
      retryAfterSeconds
    });
  }

  existing.count += 1;
}

export const authRateLimits = {
  login: {
    limit: 5,
    windowMs: 15 * 60 * 1000
  },
  signup: {
    limit: 5,
    windowMs: 60 * 60 * 1000
  },
  forgotPassword: {
    limit: 3,
    windowMs: 60 * 60 * 1000
  },
  passwordReset: {
    limit: 10,
    windowMs: 60 * 60 * 1000
  }
} as const;
