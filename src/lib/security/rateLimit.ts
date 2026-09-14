import { LRUCache } from 'lru-cache';
import { NextRequest, NextResponse } from 'next/server';

interface RateLimiterOptions {
  limit: number;
  windowMs: number;
  key?: string;
}

// Global cache of limiters by key/prefix
const limiters = new Map<string, LRUCache<string, number>>();

export function getClientIp(req: Request | NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  const cfIp = req.headers.get('cf-connecting-ip');
  if (cfIp) {
    return cfIp.trim();
  }
  return '127.0.0.1';
}

/**
 * Check if the request exceeds rate limits.
 * Returns true if allowed, false if limit exceeded.
 */
export function checkRateLimit(
  req: Request | NextRequest,
  options: RateLimiterOptions
): { allowed: boolean; remaining: number } {
  const { limit, windowMs, key = 'default' } = options;
  const ip = getClientIp(req);
  const identifier = `${key}:${ip}`;

  let cache = limiters.get(key);
  if (!cache) {
    cache = new LRUCache<string, number>({
      max: 1000,
      ttl: windowMs,
    });
    limiters.set(key, cache);
  }

  const currentCount = cache.get(identifier) || 0;
  if (currentCount >= limit) {
    return { allowed: false, remaining: 0 };
  }

  cache.set(identifier, currentCount + 1);
  return { allowed: true, remaining: limit - (currentCount + 1) };
}

export function rateLimitResponse(retryAfter: number = 60): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: 'Too many requests. Please try again later.',
    },
    {
      status: 429,
      headers: {
        'Retry-After': retryAfter.toString(),
        'X-RateLimit-Limit': '10',
        'X-RateLimit-Remaining': '0',
      },
    }
  );
}

export function rateLimit(options?: { interval?: number; uniqueTokenPerInterval?: number }) {
  const windowMs = options?.interval || 60000;
  const max = options?.uniqueTokenPerInterval || 500;
  const cache = new LRUCache<string, number>({
    max,
    ttl: windowMs,
  });

  return {
    check: async (limit: number, token: string): Promise<{ success: boolean; remaining: number }> => {
      const current = cache.get(token) || 0;
      if (current >= limit) {
        return { success: false, remaining: 0 };
      }
      cache.set(token, current + 1);
      return { success: true, remaining: limit - (current + 1) };
    },
  };
}

/**
 * Helper to enforce rate limiting directly in Next.js route handlers.
 * Returns null if allowed, or a 429 NextResponse if rate limit is exceeded.
 */
export function enforceRateLimit(
  req: Request | NextRequest,
  options: RateLimiterOptions
): NextResponse | null {
  const { allowed } = checkRateLimit(req, options);

  if (!allowed) {
    return rateLimitResponse(Math.ceil(options.windowMs / 1000));
  }

  return null;
}
