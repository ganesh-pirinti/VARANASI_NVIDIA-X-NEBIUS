import React from "react";
import { CheckStatus, Severity } from "@/types/runguard";

interface StatusBadgeProps {
  status: CheckStatus;
  size?: "sm" | "md" | "lg";
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = "md" }) => {
  const sizeClasses = {
    sm: "px-2 py-0.5 text-[10px] font-bold tracking-wider",
    md: "px-2.5 py-1 text-xs font-bold tracking-wider",
    lg: "px-3.5 py-1.5 text-xs sm:text-sm font-bold tracking-wider",
  };

  if (status === "PASS") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-md border border-nvidia-border bg-nvidia-surface text-nvidia-green font-mono ${sizeClasses[size]}`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-nvidia-green"></span>
        PASS
      </span>
    );
  }

  if (status === "FAIL") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-md border border-status-error/40 bg-status-error/15 text-status-error font-mono ${sizeClasses[size]}`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-status-error"></span>
        FAIL
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border border-status-warning/40 bg-status-warning/15 text-status-warning font-mono ${sizeClasses[size]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-status-warning"></span>
      UNKNOWN
    </span>
  );
};

export const SeverityBadge: React.FC<{ severity: Severity }> = ({ severity }) => {
  const styles: Record<Severity, string> = {
    CRITICAL: "border-status-error/50 bg-status-error/15 text-status-error",
    HIGH: "border-status-warning/50 bg-status-warning/15 text-status-warning",
    MEDIUM: "border-amber-500/40 bg-amber-500/10 text-amber-300",
    LOW: "border-border-standard bg-surface-elevated text-text-secondary",
    INFO: "border-border-standard bg-surface-elevated text-text-muted",
  };

  return (
    <span
      className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-mono font-bold tracking-wider border ${styles[severity] || styles.INFO}`}
    >
      {severity}
    </span>
  );
};
