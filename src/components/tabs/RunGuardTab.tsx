"use client";

import React, { useState } from "react";
import { 
  ShieldAlert, 
  Play, 
  FileCode, 
  Upload, 
  AlertTriangle, 
  Cpu, 
  HardDrive,
  ArrowRight,
  Info,
  CheckCircle2
} from "lucide-react";
import { PreflightInputs, PreflightReport } from "@/types/runguard";
import { VERIFIED_GPU_CATALOG } from "@/lib/constants";
import { StatusBadge, SeverityBadge } from "../ui/StatusBadge";

interface RunGuardTabProps {
  inputs: PreflightInputs;
  setInputs: React.Dispatch<React.SetStateAction<PreflightInputs>>;
  preflightReport: PreflightReport | null;
  onRunPreflight: () => Promise<void>;
  isLoading: boolean;
  setActiveTab: (tab: string) => void;
}

export const RunGuardTab: React.FC<RunGuardTabProps> = ({
  inputs,
  setInputs,
  preflightReport,
  onRunPreflight,
  isLoading,
  setActiveTab,
}) => {
  const [activeFileTab, setActiveFileTab] = useState<"docker" | "deps" | "config" | "log">("config");

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: keyof PreflightInputs) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("File size exceeds 2MB limit.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setInputs((prev) => ({ ...prev, [field]: content }));
    };
    reader.readAsText(file);
  };

  const vramPercent = preflightReport?.vramEstimate
    ? Math.min(
        100,
        Math.round(
          (preflightReport.vramEstimate.totalEstimatedVramGb / preflightReport.vramEstimate.gpuMemoryAvailableGb) * 100
        )
      )
    : 0;

  return (
    <div className="space-y-6">
      {/* Top Configuration Bar */}
      <div className="rounded-2xl border border-border-standard bg-surface-card p-6 space-y-5 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-subtle pb-4">
          <div>
            <h2 className="text-base font-bold text-text-primary flex items-center gap-2.5">
              <ShieldAlert className="h-5 w-5 text-nebius-cyan" />
              <span>GPU RunGuard — Preflight &amp; Runtime Diagnostic Inspection</span>
            </h2>
            <p className="text-xs text-text-muted mt-1 leading-relaxed">
              Deterministic static checks and runtime log inspection. Eliminates configuration-induced cloud GPU crashes before deployment.
            </p>
          </div>
          <button
            onClick={onRunPreflight}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 rounded-xl bg-nebius-cyan px-6 py-3 text-xs font-bold text-app hover:bg-nebius-soft disabled:opacity-50 transition shadow-nebius-glow shrink-0"
          >
            <Play className="h-4 w-4 fill-app text-app" />
            <span>{isLoading ? "Running Checks..." : "Run Preflight Checks"}</span>
          </button>
        </div>

        {/* Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="block text-text-muted mb-1.5 font-medium">Workload Name</label>
            <input
              type="text"
              value={inputs.projectName}
              onChange={(e) => setInputs({ ...inputs, projectName: e.target.value })}
              className="w-full rounded-lg border border-border-standard bg-surface-input px-3.5 py-2 text-text-primary focus:border-nebius-cyan focus:outline-none transition"
              placeholder="e.g. Nemotron-FineTuning-Job"
            />
          </div>

          <div>
            <label className="block text-text-muted mb-1.5 font-medium">Target GPU Architecture</label>
            <select
              value={inputs.targetGpu}
              onChange={(e) => setInputs({ ...inputs, targetGpu: e.target.value })}
              className="w-full rounded-lg border border-border-standard bg-surface-input px-3.5 py-2 text-text-primary focus:border-nebius-cyan focus:outline-none transition"
            >
              {VERIFIED_GPU_CATALOG.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} ({g.vramGb}GB VRAM - {g.provider})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-text-muted mb-1.5 font-medium">Allocated GPU Count</label>
            <input
              type="number"
              min="1"
              max="1024"
              value={inputs.gpuCount}
              onChange={(e) => setInputs({ ...inputs, gpuCount: parseInt(e.target.value, 10) || 1 })}
              className="w-full rounded-lg border border-border-standard bg-surface-input px-3.5 py-2 text-text-primary focus:border-nebius-cyan focus:outline-none transition"
            />
          </div>

          <div>
            <label className="block text-text-muted mb-1.5 font-medium">Model Parameters (Billions)</label>
            <input
              type="number"
              step="0.5"
              min="0"
              value={inputs.estimatedModelParamsBillion || ""}
              onChange={(e) =>
                setInputs({ ...inputs, estimatedModelParamsBillion: parseFloat(e.target.value) || undefined })
              }
              className="w-full rounded-lg border border-border-standard bg-surface-input px-3.5 py-2 text-text-primary focus:border-nebius-cyan focus:outline-none transition"
              placeholder="e.g. 70 for Nemotron 70B"
            />
          </div>

          <div>
            <label className="block text-text-muted mb-1.5 font-medium">Execution Precision</label>
            <select
              value={inputs.precision || "FP16"}
              onChange={(e) =>
                setInputs({ ...inputs, precision: e.target.value as "FP32" | "FP16" | "BF16" | "FP8" | "INT4" })
              }
              className="w-full rounded-lg border border-border-standard bg-surface-input px-3.5 py-2 text-text-primary focus:border-nebius-cyan focus:outline-none transition"
            >
              <option value="FP32">FP32 (Single Precision - 4 bytes)</option>
              <option value="FP16">FP16 (Half Precision - 2 bytes)</option>
              <option value="BF16">BF16 (Bfloat16 - 2 bytes)</option>
              <option value="FP8">FP8 (Hopper / Ada Native - 1 byte)</option>
              <option value="INT4">INT4 (Quantized - 0.5 bytes)</option>
            </select>
          </div>

          <div>
            <label className="block text-text-muted mb-1.5 font-medium">Context Length (Tokens)</label>
            <input
              type="number"
              min="512"
              step="512"
              value={inputs.contextLengthTokens || 4096}
              onChange={(e) => setInputs({ ...inputs, contextLengthTokens: parseInt(e.target.value, 10) || 4096 })}
              className="w-full rounded-lg border border-border-standard bg-surface-input px-3.5 py-2 text-text-primary focus:border-nebius-cyan focus:outline-none transition"
            />
          </div>

          <div>
            <label className="block text-text-muted mb-1.5 font-medium">Max Concurrency / Batch Size</label>
            <input
              type="number"
              min="1"
              value={inputs.batchSize || 1}
              onChange={(e) => setInputs({ ...inputs, batchSize: parseInt(e.target.value, 10) || 1 })}
              className="w-full rounded-lg border border-border-standard bg-surface-input px-3.5 py-2 text-text-primary focus:border-nebius-cyan focus:outline-none transition"
            />
          </div>
        </div>
      </div>

      {/* Configuration & Log Files Editor */}
      <div className="rounded-2xl border border-border-standard bg-surface-card overflow-hidden shadow-card">
        {/* Editor Tabs */}
        <div className="flex flex-wrap items-center justify-between border-b border-border-subtle bg-surface-elevated px-4 py-2.5 gap-2">
          <div className="flex items-center space-x-1 overflow-x-auto">
            <button
              onClick={() => setActiveFileTab("config")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                activeFileTab === "config"
                  ? "bg-surface-card text-nebius-cyan border border-border-standard shadow-sm"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              Workload Config (K8s/Slurm/Compose)
            </button>
            <button
              onClick={() => setActiveFileTab("log")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                activeFileTab === "log"
                  ? "bg-surface-card text-nebius-cyan border border-border-standard shadow-sm"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              Diagnostic / Crash Log
            </button>
            <button
              onClick={() => setActiveFileTab("deps")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                activeFileTab === "deps"
                  ? "bg-surface-card text-nebius-cyan border border-border-standard shadow-sm"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              Python Dependencies (requirements.txt)
            </button>
            <button
              onClick={() => setActiveFileTab("docker")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                activeFileTab === "docker"
                  ? "bg-surface-card text-nebius-cyan border border-border-standard shadow-sm"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              Dockerfile
            </button>
          </div>

          <label className="flex items-center gap-1.5 cursor-pointer rounded-lg border border-border-standard bg-surface-card px-3 py-1.5 text-[11px] font-semibold text-text-secondary hover:border-nebius-cyan/50 hover:text-text-primary transition shadow-sm">
            <Upload className="h-3 w-3 text-nebius-cyan" />
            <span>Upload File</span>
            <input
              type="file"
              className="hidden"
              onChange={(e) => {
                const targetField: keyof PreflightInputs =
                  activeFileTab === "config"
                    ? "workloadConfigContent"
                    : activeFileTab === "log"
                    ? "diagnosticLogContent"
                    : activeFileTab === "deps"
                    ? "requirementsContent"
                    : "dockerfileContent";
                handleFileUpload(e, targetField);
              }}
            />
          </label>
        </div>

        {/* Textarea for Active File */}
        <div className="p-4 bg-surface-input font-mono text-xs">
          {activeFileTab === "config" && (
            <textarea
              rows={9}
              value={inputs.workloadConfigContent || ""}
              onChange={(e) => setInputs({ ...inputs, workloadConfigContent: e.target.value })}
              placeholder="# Paste Kubernetes Pod spec, Slurm batch script, docker-compose.yml, or vLLM config..."
              className="w-full bg-transparent text-text-primary placeholder:text-text-muted/60 focus:outline-none resize-y leading-relaxed"
            />
          )}
          {activeFileTab === "log" && (
            <textarea
              rows={9}
              value={inputs.diagnosticLogContent || ""}
              onChange={(e) => setInputs({ ...inputs, diagnosticLogContent: e.target.value })}
              placeholder="# Paste stack trace or runtime crash log (e.g. CUDA out of memory, NCCL collective timeout, SIGBUS)..."
              className="w-full bg-transparent text-text-primary placeholder:text-text-muted/60 focus:outline-none resize-y leading-relaxed"
            />
          )}
          {activeFileTab === "deps" && (
            <textarea
              rows={9}
              value={inputs.requirementsContent || ""}
              onChange={(e) => setInputs({ ...inputs, requirementsContent: e.target.value })}
              placeholder="# Paste requirements.txt (e.g. torch==2.4.0, flash-attn, vllm, deepspeed)..."
              className="w-full bg-transparent text-text-primary placeholder:text-text-muted/60 focus:outline-none resize-y leading-relaxed"
            />
          )}
          {activeFileTab === "docker" && (
            <textarea
              rows={9}
              value={inputs.dockerfileContent || ""}
              onChange={(e) => setInputs({ ...inputs, dockerfileContent: e.target.value })}
              placeholder="# Paste Dockerfile (FROM nvidia/cuda:12.4.1-devel...)..."
              className="w-full bg-transparent text-text-primary placeholder:text-text-muted/60 focus:outline-none resize-y leading-relaxed"
            />
          )}
        </div>
      </div>

      {/* Preflight Report Results */}
      {preflightReport && (
        <div className="space-y-6">
          {/* Header & Status Card */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-border-standard bg-surface-card p-6 shadow-card">
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-base font-bold text-text-primary">Deterministic Preflight Results</h3>
                <StatusBadge status={preflightReport.overallStatus} size="lg" />
              </div>
              <p className="text-xs text-text-muted mt-1">
                Evaluated {preflightReport.checks.length} inspection modules at {preflightReport.timestamp}
              </p>
            </div>

            {preflightReport.suggestedPatch && (
              <button
                onClick={() => setActiveTab("patch")}
                className="flex items-center gap-2 rounded-xl bg-nvidia-surface border border-nvidia-border px-4 py-2.5 text-xs font-bold text-nvidia-green hover:bg-nvidia-green/20 transition shadow-sm shrink-0"
              >
                <span>Review Generated Remediation Patch</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* VRAM Sizing Panel with Visual Headroom Gauge */}
          {preflightReport.vramEstimate && (
            <div className="rounded-2xl border border-border-standard bg-surface-card p-6 space-y-4 shadow-card">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <HardDrive className="h-4 w-4 text-nebius-cyan" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-text-primary">
                    Deterministic VRAM &amp; Memory Headroom Calculation
                  </h4>
                </div>
                <span
                  className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-md border ${
                    preflightReport.vramEstimate.isFeasible
                      ? "border-nvidia-border bg-nvidia-surface text-nvidia-green"
                      : "border-status-error/40 bg-status-error/15 text-status-error"
                  }`}
                >
                  {preflightReport.vramEstimate.isFeasible ? "FEASIBLE" : "EXCEEDS CAPACITY"}
                </span>
              </div>

              {/* Graphical VRAM Capacity Gauge */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-text-muted">
                    Estimated Consumption: <strong className="text-text-primary">{preflightReport.vramEstimate.totalEstimatedVramGb} GiB</strong>
                  </span>
                  <span className="text-text-muted">
                    Hardware Ceiling: <strong className="text-text-primary">{preflightReport.vramEstimate.gpuMemoryAvailableGb} GiB</strong> ({vramPercent}%)
                  </span>
                </div>
                <div className="w-full h-3 rounded-full bg-surface-input border border-border-subtle overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      preflightReport.vramEstimate.isFeasible
                        ? "bg-nvidia-green shadow-nvidia-glow"
                        : "bg-status-error shadow-sm"
                    }`}
                    style={{ width: `${vramPercent}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div className="rounded-xl border border-border-subtle bg-surface-input p-3.5">
                  <div className="text-[10px] text-text-muted uppercase">Weight Memory (per GPU)</div>
                  <div className="text-sm font-bold text-text-primary mt-1">
                    {preflightReport.vramEstimate.weightMemoryGb} GiB
                  </div>
                </div>
                <div className="rounded-xl border border-border-subtle bg-surface-input p-3.5">
                  <div className="text-[10px] text-text-muted uppercase">KV Cache Memory (per GPU)</div>
                  <div className="text-sm font-bold text-text-primary mt-1">
                    {preflightReport.vramEstimate.kvCacheMemoryGb} GiB
                  </div>
                </div>
                <div className="rounded-xl border border-border-subtle bg-surface-input p-3.5">
                  <div className="text-[10px] text-text-muted uppercase">CUDA &amp; Overhead</div>
                  <div className="text-sm font-bold text-text-primary mt-1">
                    {preflightReport.vramEstimate.runtimeOverheadGb} GiB
                  </div>
                </div>
                <div className="rounded-xl border border-border-subtle bg-surface-input p-3.5">
                  <div className="text-[10px] text-text-muted uppercase">Total Estimated vs Physical</div>
                  <div className={`text-sm font-bold mt-1 font-mono ${preflightReport.vramEstimate.isFeasible ? "text-nebius-cyan" : "text-status-error"}`}>
                    {preflightReport.vramEstimate.totalEstimatedVramGb} / {preflightReport.vramEstimate.gpuMemoryAvailableGb} GiB
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-text-muted space-y-1.5 pt-1">
                {preflightReport.vramEstimate.notes.map((note, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <Info className="h-3.5 w-3.5 text-nebius-cyan shrink-0 mt-0.5" />
                    <span>{note}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Checks Table */}
          <div className="rounded-2xl border border-border-standard bg-surface-card overflow-hidden shadow-card">
            <div className="px-6 py-4 border-b border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-surface-elevated/40">
              <h4 className="text-xs font-bold uppercase tracking-wider text-text-primary">
                Evaluation Suite Status Table
              </h4>
              <span className="text-[11px] text-text-muted">
                Static checks distinguished from runtime test logs
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-elevated text-[11px] uppercase tracking-wider text-text-muted border-b border-border-subtle">
                  <tr>
                    <th className="py-3 px-5">Inspection Module</th>
                    <th className="py-3 px-5">Evaluation Type</th>
                    <th className="py-3 px-5">Status</th>
                    <th className="py-3 px-5">Summary</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle font-sans">
                  {preflightReport.checks.map((check) => (
                    <tr key={check.id} className="hover:bg-surface-elevated/50 transition">
                      <td className="py-3.5 px-5 font-semibold text-text-primary">
                        {check.name}
                      </td>
                      <td className="py-3.5 px-5">
                        {check.isRuntimeTest ? (
                          <span className="inline-flex items-center gap-1 font-mono text-[10px] text-nebius-cyan font-semibold bg-nebius-cyan/15 px-2 py-0.5 rounded-md border border-nebius-cyan/35">
                            Runtime Test
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-mono text-[10px] text-text-muted font-semibold bg-surface-elevated px-2 py-0.5 rounded-md border border-border-standard">
                            Static Check
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-5">
                        <StatusBadge status={check.status} />
                      </td>
                      <td className="py-3.5 px-5 text-text-secondary leading-relaxed max-w-md">
                        {check.summary}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detailed Findings Cards */}
          {preflightReport.findings.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-text-primary">
                Identified Findings &amp; Diagnostic Evidence ({preflightReport.findings.length})
              </h4>
              <div className="space-y-3">
                {preflightReport.findings.map((finding) => (
                  <div
                    key={finding.id}
                    className="rounded-xl border border-border-standard bg-surface-card p-5 space-y-3 hover:border-nebius-cyan/40 transition shadow-card"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <SeverityBadge severity={finding.severity} />
                        <span className="text-xs font-bold text-text-primary">{finding.title}</span>
                      </div>
                      {finding.ruleReference && (
                        <span className="text-[10px] font-mono text-text-muted">
                          Ref: {finding.ruleReference}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-text-secondary leading-relaxed">
                      {finding.description}
                    </p>

                    <div className="rounded-lg bg-surface-input p-3 font-mono text-[11px] text-nebius-cyan border border-border-subtle">
                      <div className="text-[10px] text-text-muted mb-1 uppercase font-semibold">Evidence:</div>
                      {finding.evidence}
                    </div>

                    <div className="rounded-lg bg-nvidia-surface p-3 font-sans text-xs text-text-primary border border-nvidia-border">
                      <strong className="text-nvidia-green mr-1">Deterministic Recommendation:</strong>
                      {finding.recommendedFix}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
