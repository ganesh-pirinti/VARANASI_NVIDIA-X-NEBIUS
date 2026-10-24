import React from "react";
import { CheckStatus, Severity } from "@/types/runguard";

interface StatusBadgeProps {
  status: CheckStatus;
  size?: "sm" | "md" | "lg";
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = "md" }) => {
  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs font-semibold",
    md: "px-2.5 py-1 text-xs font-bold tracking-wider",
    lg: "px-3.5 py-1.5 text-sm font-bold tracking-wider",
  };

  if (status === "PASS") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 ${sizeClasses[size]}`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
        PASS
      </span>
    );
  }

  if (status === "FAIL") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded border border-rose-500/40 bg-rose-500/10 text-rose-400 ${sizeClasses[size]}`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-rose-400"></span>
        FAIL
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded border border-amber-500/40 bg-amber-500/10 text-amber-400 ${sizeClasses[size]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-amber-400"></span>
      UNKNOWN
    </span>
  );
};

export const SeverityBadge: React.FC<{ severity: Severity }> = ({ severity }) => {
  const styles = {
    CRITICAL: "border-rose-600/50 bg-rose-950/60 text-rose-300",
    HIGH: "border-amber-600/50 bg-amber-950/60 text-amber-300",
    MEDIUM: "border-yellow-600/40 bg-yellow-950/40 text-yellow-300",
    LOW: "border-blue-600/40 bg-blue-950/40 text-blue-300",
    INFO: "border-slate-600/40 bg-slate-900/60 text-slate-300",
  };

  return (
    <span
      className={`inline-block rounded px-2 py-0.5 text-[11px] font-mono font-bold tracking-wide border ${styles[severity] || styles.INFO}`}
    >
      {severity}
    </span>
  );
};
