import React from "react";
import { CheckStatus, Severity } from "@/types/runguard";
import { Loader2 } from "lucide-react";

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
        className={`inline-flex items-center gap-1.5 rounded-[6px] border border-nvidia-green/40 bg-nvidia-surface text-nvidia-dark font-mono font-semibold transition-all duration-300 ${sizeClasses[size]}`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-nvidia-green"></span>
        PASS
      </span>
    );
  }

  if (status === "FAIL") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-[6px] border border-status-error/30 bg-[#FEE2E2] text-status-error font-mono font-semibold transition-all duration-300 ${sizeClasses[size]}`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-status-error"></span>
        FAIL
      </span>
    );
  }

  if (status === "RUNNING") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-[6px] border border-status-info/40 bg-[#EFF6FF] text-status-info font-mono font-semibold transition-all duration-300 ${sizeClasses[size]}`}
      >
        <Loader2 className="h-3 w-3 animate-spin text-status-info" />
        RUNNING
      </span>
    );
  }

  if (status === "NOT_TESTED") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-[6px] border border-border-standard bg-surface-secondary text-text-muted font-mono font-semibold transition-all duration-300 ${sizeClasses[size]}`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-text-muted/60"></span>
        NOT TESTED
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-[6px] border border-border-standard bg-surface-secondary text-text-primary font-mono font-semibold transition-all duration-300 ${sizeClasses[size]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-text-muted"></span>
      UNKNOWN
    </span>
  );
};

export const SeverityBadge: React.FC<{ severity: Severity }> = ({ severity }) => {
  const styles: Record<Severity, string> = {
    CRITICAL: "border-status-error/30 bg-[#FEE2E2] text-status-error",
    HIGH: "border-status-warning/30 bg-[#FEF3C7] text-status-warning",
    MEDIUM: "border-border-standard bg-[#FAF5EA] text-status-warning",
    LOW: "border-border-standard bg-surface-secondary text-text-secondary",
    INFO: "border-border-subtle bg-surface-secondary text-text-muted",
  };

  return (
    <span
      className={`inline-block rounded-[6px] px-2 py-0.5 text-[10px] font-mono font-bold tracking-wider border transition-all duration-200 ${styles[severity] || styles.INFO}`}
    >
      {severity}
    </span>
  );
};
