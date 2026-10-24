"use client";

import React from "react";
import { 
  FileCode, 
  CheckCircle, 
  Check, 
  Download, 
  Copy, 
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
      <div className="rounded-xl border border-navy-800 bg-navy-900/50 p-12 text-center space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-navy-800 text-slate-500">
          <FileCode className="h-7 w-7" />
        </div>
        <h3 className="text-base font-bold text-slate-200">No Remediation Patch Generated</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
          Remediation patches are generated deterministically when GPU RunGuard identifies actionable configuration flaws (such as missing <code>/dev/shm</code> shared memory volume mounts, missing NVIDIA runtime environment flags, or missing build compilers).
        </p>
        <button
          onClick={() => setActiveTab("runguard")}
          className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-cyan-500 px-4 py-2 text-xs font-bold text-navy-950 hover:bg-cyan-400 transition"
        >
          <span>Run GPU RunGuard Preflight</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  const statusColors = {
    GENERATED: "bg-amber-950/40 text-amber-300 border-amber-500/40",
    APPROVED: "bg-blue-950/40 text-blue-300 border-blue-500/40",
    APPLIED: "bg-emerald-950/40 text-emerald-300 border-emerald-500/40",
    RE_VERIFIED: "bg-emerald-950/60 text-emerald-400 border-emerald-500/60",
  };

  return (
    <div className="space-y-6">
      {/* Top Status & Approval Banner */}
      <div className="rounded-xl border border-navy-800 bg-navy-900/80 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-navy-800 pb-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-base font-bold text-slate-100">{proposedPatch.title}</h2>
              <span
                className={`rounded border px-2.5 py-0.5 text-xs font-mono font-bold tracking-wider ${statusColors[proposedPatch.status]}`}
              >
                {proposedPatch.status}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Target configuration file: <strong className="text-slate-200 font-mono">{proposedPatch.targetFile}</strong>
            </p>
          </div>

          {/* Interactive Approval Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {proposedPatch.status === "GENERATED" && (
              <button
                onClick={onApprovePatch}
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500 transition shadow-lg shadow-blue-600/20"
              >
                <Check className="h-4 w-4" />
                <span>Approve Patch</span>
              </button>
            )}

            {proposedPatch.status === "APPROVED" && (
              <button
                onClick={onApplyPatch}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition shadow-lg shadow-emerald-600/20"
              >
                <CheckCircle className="h-4 w-4" />
                <span>Apply to Working Inputs</span>
              </button>
            )}

            {(proposedPatch.status === "APPLIED" || proposedPatch.status === "RE_VERIFIED") && (
              <button
                onClick={onReverifyPatch}
                disabled={isReverifying}
                className="flex items-center gap-1.5 rounded-lg bg-cyan-600 px-4 py-2 text-xs font-bold text-white hover:bg-cyan-500 disabled:opacity-50 transition shadow-lg shadow-cyan-600/20"
              >
                {isReverifying ? <RefreshCw className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                <span>{isReverifying ? "Re-verifying..." : "Run Independent Re-Verification"}</span>
              </button>
            )}
          </div>
        </div>

        {/* Safety & Protocol Banner */}
        <div className="rounded-lg border border-navy-750 bg-navy-950 p-3 text-xs text-slate-400 flex items-start gap-2.5">
          <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <strong className="text-slate-200">Execution Safety Protocol:</strong>
            <p className="text-[11px] leading-relaxed">
              VARANASI adheres to strict zero-silent-mutation standards. Patches require explicit human approval and are never executed directly on production systems. You may inspect the diff, download the patched asset, or apply it to re-test deterministic checks.
            </p>
          </div>
        </div>

        {/* Audit Lifecycle Progress */}
        <div className="grid grid-cols-4 gap-2 text-center text-xs font-mono">
          <div className={`p-2 rounded border ${proposedPatch.status ? "border-cyan-500/40 bg-navy-850 text-cyan-300" : "border-navy-800 text-slate-500"}`}>
            1. Generated
          </div>
          <div className={`p-2 rounded border ${proposedPatch.status === "APPROVED" || proposedPatch.status === "APPLIED" || proposedPatch.status === "RE_VERIFIED" ? "border-cyan-500/40 bg-navy-850 text-cyan-300" : "border-navy-800 text-slate-500"}`}>
            2. Approved
          </div>
          <div className={`p-2 rounded border ${proposedPatch.status === "APPLIED" || proposedPatch.status === "RE_VERIFIED" ? "border-cyan-500/40 bg-navy-850 text-cyan-300" : "border-navy-800 text-slate-500"}`}>
            3. Applied
          </div>
          <div className={`p-2 rounded border ${proposedPatch.status === "RE_VERIFIED" ? "border-emerald-500/60 bg-emerald-950/40 text-emerald-400 font-bold" : "border-navy-800 text-slate-500"}`}>
            4. Re-Verified
          </div>
        </div>
      </div>

      {/* Rationale & Explanation */}
      <div className="rounded-xl border border-navy-800 bg-navy-900/80 p-5 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
          Engineering Rationale for Proposed Modification
        </h3>
        <ul className="space-y-2 text-xs text-slate-300 leading-relaxed">
          {proposedPatch.explanation.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="text-cyan-400 font-bold">•</span>
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
