"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { 
  calculateElapsedSeconds, 
  formatElapsedTime, 
  formatTimeOfDay 
} from "@/lib/utils/timer";

export interface LiveElapsedState {
  /** Relative formatted elapsed duration, e.g. "42s ago" or "2m 15s ago" */
  elapsedText: string;
  /** Exact numerical elapsed seconds */
  seconds: number;
  /** Wall clock time string (e.g. "7:01:40 PM") */
  timeString: string;
  /** Combined representation (e.g. "7:01:40 PM (42s ago)") */
  formattedCombined: string;
  /** True when a valid timestamp has been resolved and is actively tracking */
  hasValidTimestamp: boolean;
  /** The effective ISO timestamp string */
  effectiveTimestamp: string | null;
}

export interface UseLiveElapsedTimerOptions {
  /** The primary timestamp (e.g. systemStatus.tavilyStaleTimestamp) */
  timestamp?: string | null;
  /** Optional fallback key in localStorage (e.g. "varanasi_tavily_verified") */
  fallbackStorageKey?: string;
  /** Tick interval in milliseconds. Default: 1000ms */
  tickIntervalMs?: number;
  /** When true, timer stops ticking. Default: false */
  disabled?: boolean;
}

/**
 * React hook that maintains a continuous, real-time 1-second ticking elapsed timer
 * from a verified timestamp.
 * 
 * Guarantees:
 * 1. Immune to browser background throttling: calculates elapsed time dynamically
 *    from Date.now() - timestampMs rather than incrementing a counter.
 * 2. Instant re-sync on tab visibility changes via document visibilitychange.
 * 3. Proper interval and event listener cleanup on unmount or timestamp change.
 * 4. Preserves verification time across page reloads via durable localStorage fallback.
 * 5. 100% decoupled from network/API polling - never triggers network requests.
 */
export function useLiveElapsedTimer({
  timestamp,
  fallbackStorageKey,
  tickIntervalMs = 1000,
  disabled = false,
}: UseLiveElapsedTimerOptions = {}): LiveElapsedState {
  // Resolve the most recent valid timestamp
  const resolveEffectiveTimestamp = useCallback((): { timeMs: number; iso: string | null } => {
    let bestTimeMs = 0;
    let bestIso: string | null = null;

    // 1. Check direct prop timestamp
    if (timestamp) {
      const parsed = calculateElapsedSeconds(timestamp);
      if (parsed.isValid) {
        bestTimeMs = parsed.timestampMs;
        bestIso = new Date(parsed.timestampMs).toISOString();
      }
    }

    // 2. Check localStorage fallback if available on the client
    if (fallbackStorageKey && typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(fallbackStorageKey);
        if (stored) {
          const parsedStored = calculateElapsedSeconds(stored);
          // If no timestamp yet or stored timestamp is newer (e.g., just verified via search query)
          if (parsedStored.isValid && (!bestTimeMs || parsedStored.timestampMs > bestTimeMs)) {
            bestTimeMs = parsedStored.timestampMs;
            bestIso = new Date(parsedStored.timestampMs).toISOString();
          }
        }
      } catch {
        // Ignore storage access errors (private browsing, etc.)
      }
    }

    return { timeMs: bestTimeMs, iso: bestIso };
  }, [timestamp, fallbackStorageKey]);

  // Compute state for a given timestamp
  const computeState = useCallback((timeMs: number, iso: string | null): LiveElapsedState => {
    if (!timeMs || isNaN(timeMs) || timeMs <= 0) {
      return {
        elapsedText: "",
        seconds: 0,
        timeString: "",
        formattedCombined: "",
        hasValidTimestamp: false,
        effectiveTimestamp: null,
      };
    }

    const { seconds } = calculateElapsedSeconds(timeMs);
    const elapsedText = formatElapsedTime(seconds);
    const timeString = formatTimeOfDay(timeMs);
    const formattedCombined = timeString ? `${timeString} (${elapsedText})` : elapsedText;

    return {
      elapsedText,
      seconds,
      timeString,
      formattedCombined,
      hasValidTimestamp: true,
      effectiveTimestamp: iso || new Date(timeMs).toISOString(),
    };
  }, []);

  // Initialize state cleanly
  const [state, setState] = useState<LiveElapsedState>(() => {
    // During SSR or initial mount
    const { timeMs, iso } = resolveEffectiveTimestamp();
    return computeState(timeMs, iso);
  });

  // Keep a ref to the active timestamp to avoid stale closures in interval
  const activeTimeMsRef = useRef<number>(0);
  const activeIsoRef = useRef<string | null>(null);

  useEffect(() => {
    if (disabled) return;

    // Resolve current timestamp on mount/update
    const { timeMs, iso } = resolveEffectiveTimestamp();
    activeTimeMsRef.current = timeMs;
    activeIsoRef.current = iso;

    if (!timeMs) {
      setState({
        elapsedText: "",
        seconds: 0,
        timeString: "",
        formattedCombined: "",
        hasValidTimestamp: false,
        effectiveTimestamp: null,
      });
      return;
    }

    // Immediately sync state to current time
    setState(computeState(timeMs, iso));

    // Tick update function: dynamically computes Date.now() - timeMs
    const tick = () => {
      if (activeTimeMsRef.current > 0) {
        setState(computeState(activeTimeMsRef.current, activeIsoRef.current));
      }
    };

    // Set up 1-second interval
    const intervalId = setInterval(tick, tickIntervalMs);

    // Event listener for tab visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // Re-check localStorage in case a parallel tab or process updated it
        const current = resolveEffectiveTimestamp();
        activeTimeMsRef.current = current.timeMs;
        activeIsoRef.current = current.iso;
        tick();
      }
    };

    // Event listener for window focus
    const handleWindowFocus = () => {
      const current = resolveEffectiveTimestamp();
      activeTimeMsRef.current = current.timeMs;
      activeIsoRef.current = current.iso;
      tick();
    };

    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleVisibilityChange);
    }
    if (typeof window !== "undefined") {
      window.addEventListener("focus", handleWindowFocus);
    }

    // Cleanup interval and event listeners cleanly
    return () => {
      clearInterval(intervalId);
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
      }
      if (typeof window !== "undefined") {
        window.removeEventListener("focus", handleWindowFocus);
      }
    };
  }, [
    timestamp,
    fallbackStorageKey,
    tickIntervalMs,
    disabled,
    resolveEffectiveTimestamp,
    computeState,
  ]);

  return state;
}
