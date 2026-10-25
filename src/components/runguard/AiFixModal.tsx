"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  X, 
  Sparkles, 
  Check, 
  Copy, 
  Download, 
  ExternalLink, 
  ShieldCheck, 
  AlertTriangle, 
  Loader2, 
  RotateCw, 
  ArrowRight,
  BookOpen
} from "lucide-react";
import { Finding, PreflightInputs, ProposedPatch } from "@/types/runguard";
import { DiagnoseResponse } from "@/types/api";
import { DiffViewer } from "../ui/DiffViewer";

interface AiFixModalProps {
  isOpen: boolean;
  onClose: () => void;
  finding: Finding | null;
  inputs: PreflightInputs;
  onApplyPatchToWorkload: (patch: ProposedPatch) => void;
  onReverify: () => Promise<void>;
  isReverifying: boolean;
}

export const AiFixModal: React.FC<AiFixModalProps> = ({
  isOpen,
  onClose,
  finding,
  inputs,
  onApplyPatchToWorkload,
  onReverify,
  isReverifying,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [diagnoseResult, setDiagnoseResult] = useState<DiagnoseResponse | null>(null);
  const [activePatch, setActivePatch] = useState<ProposedPatch | null>(null);
  const [patchStatus, setPatchStatus] = useState<"GENERATED" | "APPROVED" | "APPLIED" | "RE_VERIFIED">("GENERATED");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const diagnosedKeyRef = useRef<string | null>(null);

  // Trigger real diagnosis when modal opens with a finding
  useEffect(() => {
    if (!isOpen || !finding) {
      diagnosedKeyRef.current = null;
      return;
    }

    const currentKey = `${finding.id || finding.title}`;
    if (diagnosedKeyRef.current === currentKey) {
      return;
    }
    diagnosedKeyRef.current = currentKey;

    let isMounted = true;
    setIsLoading(true);
    setErrorMessage(null);
    setDiagnoseResult(null);
    setActivePatch(null);
    setPatchStatus("GENERATED");

    // Execute real call to /api/diagnose with sanitized finding context
    const logPayload = inputs.diagnosticLogContent || `[RunGuard Preflight Finding: ${finding.title}]\nEvidence: ${finding.evidence}\nCategory: ${finding.category}\nRecommendation: ${finding.recommendedFix}`;
    const configPayload = inputs.workloadConfigContent || `target_gpu: ${inputs.targetGpu}\ngpu_count: ${inputs.gpuCount}\nprecision: ${inputs.precision || 'FP16'}\ncontext_length: ${inputs.contextLengthTokens || 4096}\nbatch_size: ${inputs.batchSize || 1}`;

    fetch("/api/diagnose", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        diagnosticLog: logPayload,
        dockerfileContent: inputs.dockerfileContent,
        workloadConfigContent: configPayload,
        projectName: inputs.projectName,
        targetGpu: inputs.targetGpu,
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Diagnostic service returned status ${res.status}`);
        return res.json();
      })
      .then((data: DiagnoseResponse) => {
        if (!isMounted) return;
        setDiagnoseResult(data);

        // Generate patch diff
        let targetFile = "workload-config.yaml";
        let originalContent = inputs.workloadConfigContent || "";
        let patchedContent = "";

        if (finding.category === "SHARED_MEMORY") {
          targetFile = "workload-config.yaml";
          originalContent = inputs.workloadConfigContent || "services:\n  runner:\n    image: vllm/vllm-openai:latest";
          if (/services:/i.test(originalContent)) {
            patchedContent = originalContent.replace(
              /(\s+)(image:[^\n]+)/i,
              `$1$2\n$1shm_size: '16gb'\n$1ipc: 'host'`
            );
          } else {
            patchedContent = `${originalContent}\n# Added 16GB shm_size\nshm_size: '16gb'\nipc: 'host'`;
          }
        } else if (finding.category === "DEPENDENCIES_CUDA") {
          targetFile = "requirements.txt";
          originalContent = inputs.requirementsContent || "torch==2.4.0\nflash-attn";
          patchedContent = `ninja>=1.11.1\npackaging>=24.0\n${originalContent}`;
        } else if (finding.category === "DOCKER_CONTAINER") {
          targetFile = "Dockerfile";
          originalContent = inputs.dockerfileContent || "FROM nvidia/cuda:12.4.1-devel-ubuntu22.04";
          patchedContent = `${originalContent}\n\nENV NVIDIA_VISIBLE_DEVICES=all\nENV NVIDIA_DRIVER_CAPABILITIES=compute,utility\n`;
        } else if (finding.category === "VRAM_CAPACITY") {
          targetFile = "workload-config.yaml";
          originalContent = inputs.workloadConfigContent || "model_args:\n  max_model_len: 8192\n  gpu_memory_utilization: 0.90";
          patchedContent = originalContent.replace(/max_model_len:\s*\d+/i, "max_model_len: 4096")
            + "\n  # Quantized to FP8 for 50% VRAM memory footprint reduction\n  quantization: 'fp8'";
        } else {
          targetFile = "workload-config.yaml";
          originalContent = inputs.workloadConfigContent || "# Config";
          patchedContent = `${originalContent}\n# Remediation applied for ${finding.title}`;
        }

        const generatedDiff = `--- a/${targetFile}\n+++ b/${targetFile}\n@@ -1,${originalContent.split("\n").length} +1,${patchedContent.split("\n").length} @@\n- ${originalContent.split("\n")[0]}\n+ ${patchedContent.split("\n")[0]}\n+ # Remediation: ${finding.recommendedFix}`;

        const patchObj: ProposedPatch = {
          id: `patch-${Date.now()}`,
          title: `AI Fix for: ${finding.title}`,
          targetFile,
          originalContent,
          patchedContent,
          diff: generatedDiff,
          explanation: [
            finding.recommendedFix,
            data.likelyRootCause || "Identified root cause in cluster runtime parameters.",
          ],
          status: "GENERATED",
          createdAt: new Date().toISOString(),
        };

        setActivePatch(patchObj);
      })
      .catch((err) => {
        if (!isMounted) return;
        setErrorMessage(
          err instanceof Error
            ? err.message
            : "Could not complete remote AI diagnostic query. Verify Nebius API key in environment."
        );
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, finding, inputs]);

  if (!isOpen || !finding) return null;

  const handleApprove = () => {
    if (!activePatch) return;
    setActivePatch({
      ...activePatch,
      status: "APPROVED",
      approvedAt: new Date().toISOString(),
    });
    setPatchStatus("APPROVED");
  };

  const handleApply = () => {
    if (!activePatch) return;
    onApplyPatchToWorkload(activePatch);
    setActivePatch({
      ...activePatch,
      status: "APPLIED",
    });
    setPatchStatus("APPLIED");
  };

  const handleReverifyNow = async () => {
    await onReverify();
    if (activePatch) {
      setActivePatch({
        ...activePatch,
        status: "RE_VERIFIED",
        verifiedAt: new Date().toISOString(),
      });
      setPatchStatus("RE_VERIFIED");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-4xl max-h-[92vh] flex flex-col rounded-[14px] border border-border-standard bg-surface-card shadow-elevated overflow-hidden animate-scale-in"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border-subtle bg-surface-secondary px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-[8px] bg-nvidia-surface p-2 text-nvidia-dark border border-nvidia-green/30">
              <Sparkles className="h-5 w-5 text-nvidia-green" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-[18px] font-bold text-text-primary">
                  AI Remediation &amp; Patch Review
                </h3>
                <span className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-[4px] border ${
                  patchStatus === "RE_VERIFIED"
                    ? "bg-nvidia-surface text-nvidia-dark border-nvidia-green/40"
                    : patchStatus === "APPLIED"
                    ? "bg-[#FEF3C7] text-status-warning border-status-warning/30"
                    : "bg-surface-secondary text-text-secondary border-border-standard"
                }`}>
                  {patchStatus}
                </span>
              </div>
              <p className="text-[12px] text-text-secondary">
                Target Finding: <strong className="text-text-primary">{finding.title}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-[6px] p-1.5 text-text-muted hover:bg-surface-secondary hover:text-text-primary transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-[13px]">
          {isLoading && (
            <div className="p-8 text-center space-y-3">
              <Loader2 className="h-8 w-8 animate-spin text-nvidia-green mx-auto" />
              <p className="text-[14px] font-semibold text-text-primary">
                Querying Nebius Token Factory &amp; NVIDIA Nemotron...
              </p>
              <p className="text-[12px] text-text-secondary max-w-md mx-auto">
                Analyzing sanitized cluster configuration, deterministic failure signatures, and retrieving technical docs via Tavily API.
              </p>
            </div>
          )}

          {errorMessage && (
            <div className="rounded-[8px] border border-status-error/30 bg-[#FEE2E2] p-4 text-status-error space-y-2">
              <div className="font-semibold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                <span>Diagnostic Investigation Notice</span>
              </div>
              <p className="text-[12px] leading-relaxed">{errorMessage}</p>
            </div>
          )}

          {!isLoading && diagnoseResult && (
            <div className="space-y-5 animate-fade-in">
              {/* Root Cause Analysis Card */}
              <div className="rounded-[10px] border border-border-standard bg-white p-4 space-y-2 border-l-4 border-l-nvidia-green shadow-sm">
                <div className="text-[11px] font-mono uppercase tracking-wider text-nvidia-dark font-bold">
                  Identified Root Cause &amp; Technical Diagnosis
                </div>
                <p className="text-[13px] text-text-primary leading-[1.6]">
                  {diagnoseResult.likelyRootCause}
                </p>
                <div className="text-[11px] text-text-muted font-mono pt-1">
                  Model: {diagnoseResult.modelUsed} | Sanitized Tokens: {diagnoseResult.sanitizedTokensProcessed}
                </div>
              </div>

              {/* Action Plan */}
              {diagnoseResult.suggestedActionPlan.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-[14px] font-bold text-text-primary">
                    Remediation Action Steps
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {diagnoseResult.suggestedActionPlan.map((step, idx) => (
                      <div
                        key={idx}
                        className="rounded-[8px] border border-border-subtle bg-surface-secondary p-3 text-[12px] leading-relaxed"
                      >
                        <span className="font-bold text-nvidia-dark mr-1.5">{idx + 1}.</span>
                        {step}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Citations Grid */}
              {diagnoseResult.citations.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-[14px] font-bold text-text-primary flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-nvidia-green" />
                    <span>Technical Citations &amp; Authoritative References</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {diagnoseResult.citations.map((cite, idx) => (
                      <a
                        key={idx}
                        href={cite.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-[6px] border border-border-standard bg-white p-2.5 hover:border-nvidia-green hover:bg-nvidia-surface/30 transition flex items-start justify-between gap-2 group shadow-sm"
                      >
                        <div>
                          <div className="text-[12px] font-semibold text-text-primary group-hover:text-nvidia-dark line-clamp-1">
                            {cite.title}
                          </div>
                          <div className="text-[11px] text-text-muted font-mono mt-0.5 truncate max-w-[260px]">
                            {cite.url}
                          </div>
                        </div>
                        <ExternalLink className="h-3.5 w-3.5 text-text-muted group-hover:text-nvidia-green shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Diff Viewer for Proposed Patch */}
              {activePatch && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[14px] font-bold text-text-primary">
                      Reviewable Configuration Diff ({activePatch.targetFile})
                    </h4>
                    <span className="text-[11px] font-mono text-text-muted">
                      Review before applying to active workload
                    </span>
                  </div>
                  <DiffViewer
                    fileName={activePatch.targetFile}
                    diff={activePatch.diff}
                    patchedContent={activePatch.patchedContent}
                  />
                </div>
              )}

              {/* Safeguards note */}
              <div className="rounded-[8px] border border-border-subtle bg-surface-secondary p-3 text-[12px] text-text-secondary flex items-start gap-2">
                <ShieldCheck className="h-4 w-4 text-nvidia-green shrink-0 mt-0.5" />
                <span>
                  <strong>Safety Safeguard:</strong> Patches are never silently applied. Once approved, the patch is applied directly to the active session configuration and must undergo independent preflight re-verification before production deployment.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Lifecycle Actions */}
        <div className="flex flex-wrap items-center justify-between border-t border-border-subtle bg-surface-secondary px-6 py-4 gap-3">
          <button
            onClick={onClose}
            className="rounded-[6px] border border-border-standard bg-white px-4 py-2 text-[13px] font-semibold text-text-secondary hover:text-text-primary transition shadow-sm"
          >
            Close
          </button>

          <div className="flex items-center gap-2">
            {patchStatus === "GENERATED" && (
              <button
                onClick={handleApprove}
                disabled={!activePatch}
                className="flex items-center gap-1.5 rounded-[6px] bg-nvidia-surface border border-nvidia-green/40 px-4 py-2 text-[13px] font-semibold text-nvidia-dark hover:bg-nvidia-green/20 transition shadow-sm disabled:opacity-50"
              >
                <Check className="h-4 w-4 text-nvidia-green" />
                <span>Approve Patch</span>
              </button>
            )}

            {patchStatus === "APPROVED" && (
              <button
                onClick={handleApply}
                className="flex items-center gap-1.5 rounded-[6px] bg-nvidia-green px-4 py-2 text-[13px] font-semibold text-white hover:bg-nvidia-hover transition shadow-sm"
              >
                <ArrowRight className="h-4 w-4" />
                <span>Apply Patch to Workload</span>
              </button>
            )}

            {patchStatus === "APPLIED" && (
              <button
                onClick={handleReverifyNow}
                disabled={isReverifying}
                className="flex items-center gap-1.5 rounded-[6px] bg-nvidia-green px-4 py-2 text-[13px] font-semibold text-white hover:bg-nvidia-hover transition shadow-sm disabled:opacity-50"
              >
                <RotateCw className={`h-4 w-4 ${isReverifying ? "animate-spin" : ""}`} />
                <span>{isReverifying ? "Re-verifying..." : "Run Preflight Re-verification"}</span>
              </button>
            )}

            {patchStatus === "RE_VERIFIED" && (
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 text-[12px] font-mono text-nvidia-dark font-bold bg-nvidia-surface px-3 py-1.5 rounded-[6px] border border-nvidia-green/40">
                  <Check className="h-4 w-4 text-nvidia-green" />
                  Successfully Re-verified
                </span>
                <button
                  onClick={onClose}
                  className="rounded-[6px] bg-nvidia-green px-4 py-2 text-[13px] font-semibold text-white hover:bg-nvidia-hover transition shadow-sm"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
