/**
 * VARANASI Autonomous GPU RunGuard & FinOps Margin Engine
 * High-precision elapsed time utilities for live connection & stale status timers.
 * 
 * Features:
 * - Deterministic, pure duration calculations
 * - Human-readable relative formatting (<60s, 60s-3600s, 1h-24h, >24h)
 * - Safe handling of clock drift, future timestamps, and invalid date formats
 */

export interface ElapsedCalculationResult {
  seconds: number;
  isValid: boolean;
  timestampMs: number;
}

/**
 * Parses an arbitrary timestamp input into a valid millisecond timestamp
 * and calculates the exact elapsed seconds relative to nowMs.
 */
export function calculateElapsedSeconds(
  timestamp: string | number | Date | null | undefined,
  nowMs: number = Date.now()
): ElapsedCalculationResult {
  if (timestamp === null || timestamp === undefined || timestamp === "") {
    return { seconds: 0, isValid: false, timestampMs: 0 };
  }

  let timeMs: number;
  if (typeof timestamp === "number") {
    timeMs = timestamp;
  } else if (timestamp instanceof Date) {
    timeMs = timestamp.getTime();
  } else {
    // string parsing
    const parsed = Date.parse(timestamp);
    timeMs = parsed;
  }

  if (isNaN(timeMs) || timeMs <= 0) {
    return { seconds: 0, isValid: false, timestampMs: 0 };
  }

  // Guard against slight clock skew where client nowMs < server timeMs
  const elapsedSec = Math.max(0, Math.floor((nowMs - timeMs) / 1000));
  return { seconds: elapsedSec, isValid: true, timestampMs: timeMs };
}

/**
 * Formats elapsed seconds into clean, human-readable relative time:
 * - < 60s: "Xs ago" (e.g. "0s ago", "42s ago")
 * - 1m to 59m: "Xm Ys ago" (e.g. "1m 15s ago")
 * - 1h to 23h: "Xh Ym ago" (e.g. "2h 45m ago")
 * - >= 24h: "Xd Yh ago" (e.g. "1d 3h ago")
 */
export function formatElapsedTime(diffSec: number): string {
  const safeSec = Math.max(0, Math.floor(diffSec));

  if (safeSec < 60) {
    return `${safeSec}s ago`;
  }

  if (safeSec < 3600) {
    const mins = Math.floor(safeSec / 60);
    const secs = safeSec % 60;
    return `${mins}m ${secs}s ago`;
  }

  if (safeSec < 86400) {
    const hours = Math.floor(safeSec / 3600);
    const mins = Math.floor((safeSec % 3600) / 60);
    return `${hours}h ${mins}m ago`;
  }

  const days = Math.floor(safeSec / 86400);
  const hours = Math.floor((safeSec % 86400) / 3600);
  return `${days}d ${hours}h ago`;
}

/**
 * Formats a timestamp into standard localized time (e.g. "7:01:40 PM").
 */
export function formatTimeOfDay(timestampMs: number): string {
  if (!timestampMs || isNaN(timestampMs) || timestampMs <= 0) return "";
  try {
    return new Date(timestampMs).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return new Date(timestampMs).toLocaleTimeString();
  }
}
