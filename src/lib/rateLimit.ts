import { NextRequest, NextResponse } from "next/server";

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyPrefix?: string;
}

export const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  windowMs: 60 * 1000,
  maxRequests: 60,
  keyPrefix: "api",
};

export function rateLimit(
  config: RateLimitConfig = DEFAULT_RATE_LIMIT
): (request: NextRequest) => NextResponse | null {
  return (request: NextRequest) => {
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    const key = `${config.keyPrefix}:${ip}`;
    const now = Date.now();

    const entry = rateLimitStore.get(key);

    if (!entry || now > entry.resetTime) {
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + config.windowMs,
      });
      return null;
    }

    if (entry.count >= config.maxRequests) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
      return NextResponse.json(
        { error: "Too many requests", retryAfter },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfter),
            "X-RateLimit-Limit": String(config.maxRequests),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(Math.ceil(entry.resetTime / 1000)),
          },
        }
      );
    }

    entry.count++;
    return null;
  };
}

export function getRateLimitHeaders(config: RateLimitConfig, request: NextRequest): HeadersInit {
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
  const key = `${config.keyPrefix}:${ip}`;
  const entry = rateLimitStore.get(key);

  if (!entry) {
    return {
      "X-RateLimit-Limit": String(config.maxRequests),
      "X-RateLimit-Remaining": String(config.maxRequests - 1),
      "X-RateLimit-Reset": String(Math.ceil((Date.now() + config.windowMs) / 1000)),
    };
  }

  const remaining = Math.max(0, config.maxRequests - entry.count);
  return {
    "X-RateLimit-Limit": String(config.maxRequests),
    "X-RateLimit-Remaining": String(remaining),
    "X-RateLimit-Reset": String(Math.ceil(entry.resetTime / 1000)),
  };
}

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);