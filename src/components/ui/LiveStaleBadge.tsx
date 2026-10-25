"use client";

import React from "react";
import { Clock } from "lucide-react";
import { useLiveElapsedTimer } from "@/hooks/useLiveElapsedTimer";

export interface LiveStaleBadgeProps {
  /** The ISO timestamp or date string to track */
  timestamp?: string | null;
  /** Storage fallback key in localStorage (e.g. "varanasi_tavily_verified") */
  fallbackStorageKey?: string;
  /** Whether to show wall-clock time alongside the elapsed duration (e.g. "7:01 PM · 42s ago") */
  showTimeOfDay?: boolean;
  /** Optional prefix text, e.g. "Stale" */
  prefix?: string;
  /** Fallback string if timestamp is absent/unparseable. Default: "Cached" */
  fallbackText?: string;
  /** Additional custom classes */
  className?: string;
  /** Show subtle clock icon */
  showIcon?: boolean;
}

/**
 * Enterprise-grade live ticking stale status badge.
 * Updates dynamically every second without freezing or causing API calls.
 */
export const LiveStaleBadge: React.FC<LiveStaleBadgeProps> = ({
  timestamp,
  fallbackStorageKey,
  showTimeOfDay = false,
  prefix,
  fallbackText = "Cached",
  className = "",
  showIcon = false,
}) => {
  const { elapsedText, timeString, hasValidTimestamp } = useLiveElapsedTimer({
    timestamp,
    fallbackStorageKey,
  });

  if (!hasValidTimestamp || !elapsedText) {
    return (
      <span
        className={`text-[9px] font-bold font-mono uppercase tracking-wider bg-white px-1 py-0.5 rounded text-status-warning border border-status-warning/30 shadow-2xs ${className}`}
        title="Historical cached state"
      >
        {fallbackText}
      </span>
    );
  }

  // Build the text display
  let displayText = elapsedText;
  if (showTimeOfDay && timeString) {
    displayText = `${timeString} (${elapsedText})`;
  } else if (prefix) {
    displayText = `${prefix} · ${elapsedText}`;
  }

  const tooltip = timeString 
    ? `Historical verified state at ${timeString} (${elapsedText}).` 
    : `Verified ${elapsedText}.`;

  return (
    <span
      className={`inline-flex items-center gap-1 font-mono font-bold uppercase tracking-wider rounded border transition-colors duration-150 ${className || "text-[9px] bg-white text-status-warning border-status-warning/30 px-1 py-0.5 shadow-2xs"}`}
      title={tooltip}
    >
      {showIcon && <Clock className="h-2.5 w-2.5 shrink-0 opacity-80" />}
      <span>{displayText}</span>
    </span>
  );
};
