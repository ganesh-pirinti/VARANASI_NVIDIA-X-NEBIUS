/**
 * Server-Side Rate Limiter & Abuse Guardrail
 * 
 * Provides rate limiting for expensive model inference and search APIs.
 * Supports sliding window in-memory protection and defines the durable integration interface
 * for distributed Vercel serverless deployments (e.g., Upstash Redis / Vercel KV).
 */

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetMs: number;
  isDurable: boolean;
  error?: string;
}

interface WindowRecord {
  timestamps: number[];
}

// In-memory sliding window storage (for local dev / single instance)
const inMemoryStore = new Map<string, WindowRecord>();

// Clean up stale entries every 5 minutes
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function purgeStaleRecords(now: number, windowMs: number) {
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  for (const [key, record] of inMemoryStore.entries()) {
    const valid = record.timestamps.filter((ts) => now - ts < windowMs);
    if (valid.length === 0) {
      inMemoryStore.delete(key);
    } else {
      record.timestamps = valid;
    }
  }
}

/**
 * Checks and records a rate limit hit for an identifier.
 *
 * @param identifier Client IP, API key, or hashed session ID
 * @param limit Maximum requests permitted in window
 * @param windowMs Time window in milliseconds (default: 60,000ms / 1 min)
 */
export async function checkRateLimit(
  identifier: string,
  limit: number,
  windowMs = 60000
): Promise<RateLimitResult> {
  const now = Date.now();
  const safeId = identifier.trim() || "anonymous";

  // Check if a durable distributed rate limiter is configured (e.g. Upstash / Vercel KV)
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (upstashUrl && upstashToken) {
    try {
      // Call Upstash REST pipeline: INCR then EXPIRE if 1
      const res = await fetch(`${upstashUrl}/pipeline`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${upstashToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([
          ["INCR", `rl:${safeId}`],
          ["TTL", `rl:${safeId}`],
        ]),
        cache: "no-store",
      });

      if (res.ok) {
        const data = await res.json();
        const currentCount = Number(data[0]?.result || 1);
        let ttlSeconds = Number(data[1]?.result || windowMs / 1000);
        if (ttlSeconds <= 0) {
          ttlSeconds = Math.ceil(windowMs / 1000);
          // Set TTL
          fetch(`${upstashUrl}/expire/rl:${safeId}/${ttlSeconds}`, {
            headers: { Authorization: `Bearer ${upstashToken}` },
          }).catch(() => {});
        }

        const allowed = currentCount <= limit;
        return {
          allowed,
          limit,
          remaining: Math.max(0, limit - currentCount),
          resetMs: ttlSeconds * 1000,
          isDurable: true,
          error: allowed ? undefined : `Rate limit exceeded (${limit} req / ${windowMs / 1000}s). Please wait before retrying.`,
        };
      }
    } catch {
      // Fall through to in-memory fallback if remote KV is temporarily unreachable
    }
  }

  // In-memory sliding window fallback (Single-Instance / Development)
  purgeStaleRecords(now, windowMs);

  let record = inMemoryStore.get(safeId);
  if (!record) {
    record = { timestamps: [] };
    inMemoryStore.set(safeId, record);
  }

  // Filter timestamps within active window
  record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);

  if (record.timestamps.length >= limit) {
    const oldest = record.timestamps[0];
    const resetMs = Math.max(0, windowMs - (now - oldest));
    return {
      allowed: false,
      limit,
      remaining: 0,
      resetMs,
      isDurable: false,
      error: `Rate limit reached (${limit} requests per ${Math.round(windowMs / 1000)}s). Please retry in ${Math.ceil(resetMs / 1000)} seconds.`,
    };
  }

  // Record hit
  record.timestamps.push(now);

  return {
    allowed: true,
    limit,
    remaining: limit - record.timestamps.length,
    resetMs: windowMs,
    isDurable: false,
  };
}

/**
 * Extracts client IP from standard Next.js request headers.
 */
export function getClientIp(req: Request): string {
  const xForwardedFor = req.headers.get("x-forwarded-for");
  if (xForwardedFor) {
    const first = xForwardedFor.split(",")[0].trim();
    if (first) return first;
  }
  const xRealIp = req.headers.get("x-real-ip");
  if (xRealIp) return xRealIp.trim();

  const cfConnectingIp = req.headers.get("cf-connecting-ip");
  if (cfConnectingIp) return cfConnectingIp.trim();

  return "127.0.0.1";
}

/**
 * Resets the in-memory rate limit store for isolated unit tests.
 */
export function _resetRateLimitsForTesting(): void {
  inMemoryStore.clear();
}

