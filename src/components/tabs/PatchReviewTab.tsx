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
      <div className="rounded-2xl border border-border-standard bg-surface-card p-12 text-center space-y-4 shadow-card">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-elevated text-nebius-cyan border border-border-standard shadow-sm">
          <FileCode className="h-7 w-7" />
        </div>
        <h3 className="text-base font-bold text-text-primary">No Remediation Patch Generated</h3>
        <p className="text-xs text-text-secondary max-w-md mx-auto leading-relaxed">
          Remediation patches are generated deterministically when GPU RunGuard identifies actionable configuration flaws (such as missing <code>/dev/shm</code> shared memory mounts, missing NVIDIA runtime flags, or missing build compilers).
        </p>
        <button
          onClick={() => setActiveTab("runguard")}
          className="mt-2 inline-flex items-center gap-2 rounded-xl bg-nebius-cyan px-5 py-2.5 text-xs font-bold text-app hover:bg-nebius-soft transition shadow-nebius-glow"
        >
          <span>Run GPU RunGuard Preflight</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  const statusColors = {
    GENERATED: "bg-status-warning/15 text-status-warning border-status-warning/40",
    APPROVED: "bg-nebius-blue/15 text-nebius-blue border-nebius-blue/40",
    APPLIED: "bg-nvidia-surface text-nvidia-green border-nvidia-border",
    RE_VERIFIED: "bg-nvidia-surface text-nvidia-light border-nvidia-border font-bold",
  };

  return (
    <div className="space-y-6">
      {/* Top Status & Approval Banner */}
      <div className="rounded-2xl border border-border-standard bg-surface-card p-6 space-y-5 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-subtle pb-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-base font-bold text-text-primary">{proposedPatch.title}</h2>
              <span
                className={`rounded-md border px-2.5 py-0.5 text-xs font-mono font-bold tracking-wider ${statusColors[proposedPatch.status]}`}
              >
                {proposedPatch.status}
              </span>
            </div>
            <p className="text-xs text-text-muted mt-1">
              Target configuration file: <strong className="text-text-primary font-mono">{proposedPatch.targetFile}</strong>
            </p>
          </div>

          {/* Interactive Approval Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {proposedPatch.status === "GENERATED" && (
              <button
                onClick={onApprovePatch}
                className="flex items-center gap-2 rounded-xl bg-nebius-blue px-5 py-2.5 text-xs font-bold text-white hover:bg-nebius-blue/80 transition shadow-sm"
              >
                <Check className="h-4 w-4" />
                <span>Approve Patch</span>
              </button>
            )}

            {proposedPatch.status === "APPROVED" && (
              <button
                onClick={onApplyPatch}
                className="flex items-center gap-2 rounded-xl bg-nvidia-green px-5 py-2.5 text-xs font-bold text-app hover:bg-nvidia-light transition shadow-nvidia-glow"
              >
                <CheckCircle className="h-4 w-4" />
                <span>Apply to Working Inputs</span>
              </button>
            )}

            {(proposedPatch.status === "APPLIED" || proposedPatch.status === "RE_VERIFIED") && (
              <button
                onClick={onReverifyPatch}
                disabled={isReverifying}
                className="flex items-center gap-2 rounded-xl bg-nebius-cyan px-5 py-2.5 text-xs font-bold text-app hover:bg-nebius-soft disabled:opacity-50 transition shadow-nebius-glow"
              >
                {isReverifying ? <RefreshCw className="h-4 w-4 animate-spin text-app" /> : <ShieldCheck className="h-4 w-4 text-app" />}
                <span>{isReverifying ? "Re-verifying..." : "Run Independent Re-Verification"}</span>
              </button>
            )}
          </div>
        </div>

        {/* Safety & Protocol Banner */}
        <div className="rounded-xl border border-border-subtle bg-surface-input p-4 text-xs text-text-secondary flex items-start gap-3">
          <AlertTriangle className="h-4 w-4 text-status-warning shrink-0 mt-0.5" />
          <div className="space-y-1">
            <strong className="text-text-primary">Execution Safety Protocol:</strong>
            <p className="text-[11px] leading-relaxed text-text-muted">
              VARANASI adheres to strict zero-silent-mutation standards. Patches require explicit human approval and are never executed directly on production systems. You may inspect the diff, download the patched asset, or apply it to re-test deterministic checks.
            </p>
          </div>
        </div>

        {/* Audit Lifecycle Progress */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs font-mono">
          <div className={`p-2.5 rounded-xl border ${proposedPatch.status ? "border-nebius-cyan/40 bg-nebius-cyan/10 text-nebius-cyan" : "border-border-subtle text-text-muted"}`}>
            1. Generated
          </div>
          <div className={`p-2.5 rounded-xl border ${proposedPatch.status === "APPROVED" || proposedPatch.status === "APPLIED" || proposedPatch.status === "RE_VERIFIED" ? "border-nebius-cyan/40 bg-nebius-cyan/10 text-nebius-cyan" : "border-border-subtle text-text-muted"}`}>
            2. Approved
          </div>
          <div className={`p-2.5 rounded-xl border ${proposedPatch.status === "APPLIED" || proposedPatch.status === "RE_VERIFIED" ? "border-nebius-cyan/40 bg-nebius-cyan/10 text-nebius-cyan" : "border-border-subtle text-text-muted"}`}>
            3. Applied
          </div>
          <div className={`p-2.5 rounded-xl border ${proposedPatch.status === "RE_VERIFIED" ? "border-nvidia-border bg-nvidia-surface text-nvidia-green font-bold" : "border-border-subtle text-text-muted"}`}>
            4. Re-Verified
          </div>
        </div>
      </div>

      {/* Rationale & Explanation */}
      <div className="rounded-2xl border border-border-standard bg-surface-card p-6 space-y-3.5 shadow-card">
        <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary">
          Engineering Rationale for Proposed Modification
        </h3>
        <ul className="space-y-2 text-xs text-text-secondary leading-relaxed">
          {proposedPatch.explanation.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2.5">
              <span className="text-nebius-cyan font-bold">•</span>
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
