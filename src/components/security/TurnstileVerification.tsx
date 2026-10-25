"use client";

import React, { useRef, useState, useEffect } from "react";
import { Turnstile, TurnstileInstance } from "@marsidev/react-turnstile";
import { ShieldCheck, AlertCircle, RefreshCw, Lock } from "lucide-react";

export interface TurnstileVerificationProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: (error?: string) => void;
  action?: string;
  className?: string;
  resetTrigger?: number; // Increment to programmatically reset the widget
}

export const TurnstileVerification: React.FC<TurnstileVerificationProps> = ({
  onVerify,
  onExpire,
  onError,
  action = "varanasi_protected",
  className = "",
  resetTrigger = 0,
}) => {
  const turnstileRef = useRef<TurnstileInstance | null>(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  const [verificationState, setVerificationState] = useState<"idle" | "verifying" | "verified" | "expired" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Programmatic reset when resetTrigger changes
  useEffect(() => {
    if (resetTrigger > 0 && turnstileRef.current) {
      try {
        turnstileRef.current.reset();
        setVerificationState("idle");
        setErrorMessage(null);
      } catch {
        // Safe fallback if ref is unmounted
      }
    }
  }, [resetTrigger]);

  const handleSuccess = (token: string) => {
    setVerificationState("verified");
    setErrorMessage(null);
    onVerify(token);
  };

  const handleExpire = () => {
    setVerificationState("expired");
    if (onExpire) onExpire();
  };

  const handleError = (err?: string | Error) => {
    setVerificationState("error");
    const msg = typeof err === "string" ? err : err?.message || "Verification challenge could not be completed.";
    setErrorMessage(msg);
    if (onError) onError(msg);
  };

  const handleManualReset = () => {
    if (turnstileRef.current) {
      try {
        turnstileRef.current.reset();
        setVerificationState("idle");
        setErrorMessage(null);
      } catch {
        // Fallback
      }
    }
  };

  // If site key is not configured
  if (!siteKey || siteKey.trim().length === 0) {
    return (
      <div className={`rounded-[8px] border border-status-warning/40 bg-[#FEF3C7] p-3 text-[12px] text-text-primary flex items-start gap-2.5 ${className}`}>
        <Lock className="h-4 w-4 text-status-warning shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-semibold text-text-primary flex items-center gap-1.5">
            <span>Cloudflare Turnstile Guardrail</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white border border-status-warning/30 text-status-warning font-bold">
              Key Missing
            </span>
          </div>
          <p className="text-[11px] text-text-secondary leading-relaxed">
            <code>NEXT_PUBLIC_TURNSTILE_SITE_KEY</code> is not configured. Protected server-side workflows (Nebius inference and Tavily searches) require this key to verify human execution.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-[8px] border border-border-standard bg-white p-3 space-y-2.5 shadow-sm ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[12px] font-semibold text-text-primary">
          <ShieldCheck className="h-4 w-4 text-nvidia-green" />
          <span>Security Verification Challenge</span>
        </div>
        <span
          className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border transition ${
            verificationState === "verified"
              ? "bg-nvidia-surface text-nvidia-dark border-nvidia-green/40"
              : verificationState === "expired"
              ? "bg-[#FEF3C7] text-status-warning border-status-warning/30"
              : verificationState === "error"
              ? "bg-[#FEE2E2] text-status-error border-status-error/30"
              : "bg-surface-secondary text-text-muted border-border-subtle"
          }`}
        >
          {verificationState === "verified"
            ? "VERIFIED"
            : verificationState === "expired"
            ? "EXPIRED"
            : verificationState === "error"
            ? "FAILED"
            : "CHALLENGE REQUIRED"}
        </span>
      </div>

      <div className="flex justify-center items-center py-1">
        <Turnstile
          ref={turnstileRef}
          siteKey={siteKey}
          onSuccess={handleSuccess}
          onExpire={handleExpire}
          onError={handleError}
          options={{
            action,
            theme: "light",
            size: "normal",
          }}
        />
      </div>

      {/* Auxiliary Help / Reset line */}
      <div className="flex items-center justify-between text-[11px] text-text-secondary pt-1 border-t border-border-subtle">
        {verificationState === "verified" ? (
          <span className="text-nvidia-dark font-medium flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-nvidia-green inline-block" />
            Human verification confirmed. Ready to submit request.
          </span>
        ) : verificationState === "expired" ? (
          <span className="text-status-warning font-medium">
            Token expired. Please click below to refresh verification.
          </span>
        ) : verificationState === "error" ? (
          <span className="text-status-error font-medium truncate max-w-xs">
            {errorMessage || "Verification failed."}
          </span>
        ) : (
          <span className="text-text-muted">
            Protected against bot automation and unauthorized inference spend.
          </span>
        )}

        <button
          type="button"
          onClick={handleManualReset}
          className="flex items-center gap-1 text-[11px] text-text-secondary hover:text-nvidia-dark font-semibold transition shrink-0 ml-2"
          title="Reset Turnstile verification widget"
        >
          <RefreshCw className="h-3 w-3" />
          <span>Reset Challenge</span>
        </button>
      </div>
    </div>
  );
};
