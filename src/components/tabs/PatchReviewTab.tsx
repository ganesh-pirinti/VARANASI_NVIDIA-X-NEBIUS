"use client";

import React from "react";
import { 
  FileCode, 
  CheckCircle, 
  Check, 
  AlertTriangle, 
  RefreshCw, 
  ShieldCheck,
  ArrowRight
} from "lucide-react";
import { ProposedPatch } from "@/types/runguard";
import { DiffViewer } from "../ui/DiffViewer";

interface PatchReviewTabProps {
  proposedPatch: ProposedPatch | null;
  onApprovePatch: () => void;
  onApplyPatch: () => void;
  onReverifyPatch: () => Promise<void>;
  isReverifying: boolean;
  setActiveTab: (tab: string) => void;
}

export const PatchReviewTab: React.FC<PatchReviewTabProps> = ({
  proposedPatch,
  onApprovePatch,
  onApplyPatch,
  onReverifyPatch,
  isReverifying,
  setActiveTab,
}) => {
  if (!proposedPatch) {
    return (
      <div className="enterprise-card p-12 text-center space-y-4 animate-fade-in">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[8px] bg-nvidia-surface text-nvidia-green border border-nvidia-green/30 shadow-sm">
          <FileCode className="h-7 w-7 text-nvidia-green" />
        </div>
        <h3 className="text-[17px] font-semibold leading-[1.4] text-text-primary">No Remediation Patch Generated</h3>
        <p className="text-[13px] text-text-secondary max-w-md mx-auto leading-[1.5]">
          Remediation patches are generated deterministically when GPU RunGuard identifies actionable configuration flaws (such as missing <code>/dev/shm</code> shared memory mounts, missing NVIDIA runtime flags, or missing build compilers).
        </p>
        <button
          onClick={() => setActiveTab("runguard")}
          className="mt-2 inline-flex items-center gap-2 h-10 px-4 rounded-[6px] bg-nvidia-green text-white text-[14px] font-semibold hover:bg-nvidia-hover active:scale-[0.98] transition-all shadow-card"
        >
          <span>Run GPU RunGuard Preflight</span>
          <ArrowRight className="h-4 w-4 text-white" />
        </button>
      </div>
    );
  }

  const statusColors = {
    GENERATED: "bg-[#FEF3C7] text-status-warning border-status-warning/30",
    APPROVED: "bg-surface-secondary text-text-primary border-border-standard font-semibold",
    APPLIED: "bg-nvidia-surface text-nvidia-dark border-nvidia-green/40",
    RE_VERIFIED: "bg-nvidia-surface text-nvidia-dark border-nvidia-green/40 font-bold",
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Status & Approval Banner */}
      <div className="enterprise-card space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-subtle pb-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-[24px] font-[650] leading-[1.3] text-text-primary">{proposedPatch.title}</h2>
              <span
                className={`rounded-[4px] border px-2.5 py-0.5 text-[12px] font-mono font-bold tracking-wider ${statusColors[proposedPatch.status]}`}
              >
                {proposedPatch.status}
              </span>
            </div>
            <p className="text-[13px] text-text-secondary mt-1">
              Target configuration file: <strong className="text-text-primary font-mono">{proposedPatch.targetFile}</strong>
            </p>
          </div>

          {/* Interactive Approval Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {proposedPatch.status === "GENERATED" && (
              <button
                onClick={onApprovePatch}
                className="flex items-center gap-2 h-10 px-4 rounded-[6px] bg-white border border-border-standard text-text-primary text-[14px] font-semibold hover:bg-surface-secondary hover:border-border-hover transition shadow-sm"
              >
                <Check className="h-4 w-4 text-nvidia-green" />
                <span>Approve Patch</span>
              </button>
            )}

            {proposedPatch.status === "APPROVED" && (
              <button
                onClick={onApplyPatch}
                className="flex items-center gap-2 h-10 px-4 rounded-[6px] bg-nvidia-green text-white text-[14px] font-semibold hover:bg-nvidia-hover transition shadow-sm"
              >
                <CheckCircle className="h-4 w-4" />
                <span>Apply to Working Inputs</span>
              </button>
            )}

            {(proposedPatch.status === "APPLIED" || proposedPatch.status === "RE_VERIFIED") && (
              <button
                onClick={onReverifyPatch}
                disabled={isReverifying}
                className="flex items-center gap-2 h-10 px-4 rounded-[6px] bg-nvidia-green text-white text-[14px] font-semibold hover:bg-nvidia-hover disabled:opacity-50 transition shadow-sm"
              >
                {isReverifying ? <RefreshCw className="h-4 w-4 animate-spin text-white" /> : <ShieldCheck className="h-4 w-4 text-white" />}
                <span>{isReverifying ? "Re-verifying..." : "Run Independent Re-Verification"}</span>
              </button>
            )}
          </div>
        </div>

        {/* Safety & Protocol Banner */}
        <div className="rounded-[8px] border border-status-warning/30 bg-[#FEF3C7] p-4 text-[13px] text-text-primary flex items-start gap-3">
          <AlertTriangle className="h-4 w-4 text-status-warning shrink-0 mt-0.5" />
          <div className="space-y-1">
            <strong className="text-text-primary">Execution Safety Protocol:</strong>
            <p className="text-[12px] leading-[1.5] text-text-secondary">
              VARANASI adheres to strict zero-silent-mutation standards. Patches are applied strictly to the in-memory configuration buffer and are never executed directly on production systems. Zero arbitrary code execution on host. You may inspect the diff, download the unified .patch, or run independent closed-loop verification.
            </p>
          </div>
        </div>

        {/* Closed-Loop Verification Result Banner */}
        {proposedPatch.status === "RE_VERIFIED" && (
          <div
            className={`rounded-[8px] border p-4 text-[13px] flex items-start gap-3 animate-fade-in ${
              proposedPatch.isRemediated
                ? "border-nvidia-green/40 bg-nvidia-surface text-nvidia-dark"
                : "border-status-warning/40 bg-[#FEF3C7] text-status-warning"
            }`}
          >
            {proposedPatch.isRemediated ? (
              <ShieldCheck className="h-5 w-5 text-nvidia-green shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-status-warning shrink-0 mt-0.5" />
            )}
            <div>
              <strong className="block font-semibold">
                {proposedPatch.isRemediated
                  ? "Closed-Loop Verification Passed (Target Issue Remediated)"
                  : "Closed-Loop Verification Incomplete"}
              </strong>
              <div className="text-[12px] mt-0.5 leading-relaxed">
                {proposedPatch.reverificationNotes || "Re-evaluated against deterministic static and runtime rules."}
              </div>
            </div>
          </div>
        )}

        {/* Audit Lifecycle Progress */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[12px] font-mono">
          <div className={`p-2.5 rounded-[6px] border ${proposedPatch.status ? "border-nvidia-green/40 bg-nvidia-surface text-nvidia-dark font-semibold" : "border-border-subtle bg-surface-secondary text-text-muted"}`}>
            1. Generated
          </div>
          <div className={`p-2.5 rounded-[6px] border ${proposedPatch.status === "APPROVED" || proposedPatch.status === "APPLIED" || proposedPatch.status === "RE_VERIFIED" ? "border-nvidia-green/40 bg-nvidia-surface text-nvidia-dark font-semibold" : "border-border-subtle bg-surface-secondary text-text-muted"}`}>
            2. Approved
          </div>
          <div className={`p-2.5 rounded-[6px] border ${proposedPatch.status === "APPLIED" || proposedPatch.status === "RE_VERIFIED" ? "border-nvidia-green/40 bg-nvidia-surface text-nvidia-dark font-semibold" : "border-border-subtle bg-surface-secondary text-text-muted"}`}>
            3. Applied
          </div>
          <div className={`p-2.5 rounded-[6px] border ${proposedPatch.status === "RE_VERIFIED" ? "border-nvidia-green/40 bg-nvidia-surface text-nvidia-dark font-bold" : "border-border-subtle bg-surface-secondary text-text-muted"}`}>
            4. Re-Verified
          </div>
        </div>
      </div>

      {/* Rationale & Explanation */}
      <div className="rounded-[12px] border border-border-standard bg-white p-5 space-y-3.5 shadow-card hover:border-border-hover transition">
        <h3 className="text-[17px] font-semibold leading-[1.4] text-text-primary">
          Engineering Rationale for Proposed Modification
        </h3>
        <ul className="space-y-2 text-[13px] text-text-secondary leading-[1.5]">
          {proposedPatch.explanation.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2.5">
              <span className="text-nvidia-dark font-bold">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Unified Diff Viewer */}
      <DiffViewer
        fileName={proposedPatch.targetFile}
        diff={proposedPatch.diff}
        patchedContent={proposedPatch.patchedContent}
      />
    </div>
  );
};
