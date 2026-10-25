import { describe, it, expect, vi } from "vitest";
import { 
  calculateElapsedSeconds, 
  formatElapsedTime, 
  formatTimeOfDay 
} from "@/lib/utils/timer";

describe("High-Precision Live Stale Timer Utilities", () => {
  describe("calculateElapsedSeconds", () => {
    it("calculates exact elapsed seconds from an ISO string", () => {
      const now = 1700000000000;
      const verifiedAt = new Date(now - 42000).toISOString(); // 42s ago

      const result = calculateElapsedSeconds(verifiedAt, now);
      expect(result.isValid).toBe(true);
      expect(result.seconds).toBe(42);
      expect(result.timestampMs).toBe(now - 42000);
    });

    it("calculates exact elapsed seconds from a Date object", () => {
      const now = 1700000000000;
      const date = new Date(now - 125000); // 125s (2m 5s) ago

      const result = calculateElapsedSeconds(date, now);
      expect(result.isValid).toBe(true);
      expect(result.seconds).toBe(125);
    });

    it("calculates exact elapsed seconds from a numeric timestamp", () => {
      const now = 1700000000000;
      const pastMs = now - 3600000; // 1 hour ago

      const result = calculateElapsedSeconds(pastMs, now);
      expect(result.isValid).toBe(true);
      expect(result.seconds).toBe(3600);
    });

    it("clamps negative difference to 0s to guard against slight clock drift", () => {
      const now = 1700000000000;
      const futureMs = now + 5000; // 5s in the future

      const result = calculateElapsedSeconds(futureMs, now);
      expect(result.isValid).toBe(true);
      expect(result.seconds).toBe(0);
    });

    it("gracefully handles invalid, null, undefined, or empty timestamps", () => {
      expect(calculateElapsedSeconds(null).isValid).toBe(false);
      expect(calculateElapsedSeconds(undefined).isValid).toBe(false);
      expect(calculateElapsedSeconds("").isValid).toBe(false);
      expect(calculateElapsedSeconds("not-a-valid-date").isValid).toBe(false);
      expect(calculateElapsedSeconds(NaN).isValid).toBe(false);
      expect(calculateElapsedSeconds(-100).isValid).toBe(false);
    });
  });

  describe("formatElapsedTime", () => {
    it("formats durations under 60 seconds as 'Xs ago'", () => {
      expect(formatElapsedTime(0)).toBe("0s ago");
      expect(formatElapsedTime(1)).toBe("1s ago");
      expect(formatElapsedTime(15)).toBe("15s ago");
      expect(formatElapsedTime(59)).toBe("59s ago");
      expect(formatElapsedTime(-5)).toBe("0s ago");
    });

    it("formats durations between 1 minute and 1 hour as 'Xm Ys ago'", () => {
      expect(formatElapsedTime(60)).toBe("1m 0s ago");
      expect(formatElapsedTime(75)).toBe("1m 15s ago");
      expect(formatElapsedTime(150)).toBe("2m 30s ago");
      expect(formatElapsedTime(3599)).toBe("59m 59s ago");
    });

    it("formats durations between 1 hour and 24 hours as 'Xh Ym ago'", () => {
      expect(formatElapsedTime(3600)).toBe("1h 0m ago");
      expect(formatElapsedTime(3660)).toBe("1h 1m ago");
      expect(formatElapsedTime(7320)).toBe("2h 2m ago");
      expect(formatElapsedTime(86399)).toBe("23h 59m ago");
    });

    it("formats durations greater than or equal to 24 hours as 'Xd Yh ago'", () => {
      expect(formatElapsedTime(86400)).toBe("1d 0h ago");
      expect(formatElapsedTime(90000)).toBe("1d 1h ago");
      expect(formatElapsedTime(172800)).toBe("2d 0h ago");
    });
  });

  describe("formatTimeOfDay", () => {
    it("returns formatted wall clock time string", () => {
      const testTime = new Date("2026-10-25T19:01:40.000Z").getTime();
      const formatted = formatTimeOfDay(testTime);
      expect(formatted).toBeTruthy();
      expect(typeof formatted).toBe("string");
    });

    it("returns empty string for invalid timestamp input", () => {
      expect(formatTimeOfDay(0)).toBe("");
      expect(formatTimeOfDay(NaN)).toBe("");
      expect(formatTimeOfDay(-500)).toBe("");
    });
  });

  describe("Decoupling from Network / API Polling", () => {
    it("ensures timer calculations execute purely in memory without making network calls", () => {
      const fetchSpy = vi.spyOn(global, "fetch");

      const now = Date.now();
      const past = now - 45000;
      const res = calculateElapsedSeconds(past, now);
      const text = formatElapsedTime(res.seconds);

      expect(text).toBe("45s ago");
      expect(fetchSpy).not.toHaveBeenCalled();

      fetchSpy.mockRestore();
    });
  });
});
