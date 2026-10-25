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
import { DemoFixture } from "@/lib/fixtures/demo-workloads";
import { StatusBadge, SeverityBadge } from "../ui/StatusBadge";

interface RunGuardTabProps {
  inputs: PreflightInputs;
  setInputs: React.Dispatch<React.SetStateAction<PreflightInputs>>;
  preflightReport: PreflightReport | null;
  onRunPreflight: () => Promise<void>;
  isLoading: boolean;
  setActiveTab: (tab: string) => void;
  loadedFixture?: DemoFixture | null;
}

export const RunGuardTab: React.FC<RunGuardTabProps> = ({
  inputs,
  setInputs,
  preflightReport,
  onRunPreflight,
  isLoading,
  setActiveTab,
  loadedFixture,
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
      {/* Simulation Banner if loaded from fixture */}
      {loadedFixture && (
        <div className="rounded-[12px] border border-status-warning/30 bg-[#FEF3C7] p-4 text-[13px] text-text-primary flex items-center justify-between gap-3 shadow-card">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-status-warning shrink-0" />
            <span>
              Inspecting Simulated Fixture: <strong className="text-text-primary font-mono">{loadedFixture.name}</strong>. Modifications to input fields will update inspection dynamically.
            </span>
          </div>
          <span className="text-[11px] font-mono uppercase font-bold tracking-wider px-2.5 py-1 rounded-[4px] bg-white text-status-warning border border-status-warning/30 shrink-0">
            Simulated Inputs
          </span>
        </div>
      )}

      {/* Top Configuration Bar */}
      <div className="rounded-[12px] border border-border-standard bg-white p-5 space-y-5 shadow-card hover:border-border-hover transition">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-subtle pb-4">
          <div>
            <h2 className="text-[24px] font-[650] leading-[1.3] text-text-primary flex items-center gap-2.5">
              <ShieldAlert className="h-6 w-6 text-nvidia-green" />
              <span>GPU RunGuard — Preflight &amp; Runtime Diagnostic Inspection</span>
            </h2>
            <p className="text-[13px] font-normal leading-[1.5] text-text-secondary mt-1">
              Deterministic static checks and runtime log inspection. Eliminates configuration-induced cloud GPU crashes before deployment.
            </p>
          </div>
          <button
            onClick={onRunPreflight}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 h-10 px-4 rounded-[6px] bg-nvidia-green text-white text-[14px] font-semibold hover:bg-nvidia-hover disabled:opacity-50 transition shadow-sm focus:outline-none focus:ring-2 focus:ring-nvidia-green focus:ring-offset-2 shrink-0"
          >
            <Play className="h-4 w-4 fill-white text-white" />
            <span>{isLoading ? "Running Checks..." : "Run Preflight Checks"}</span>
          </button>
        </div>

        {/* Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-[13px]">
          <div>
            <label className="block text-[12px] font-semibold text-text-secondary mb-1">Workload Name</label>
            <input
              type="text"
              value={inputs.projectName}
              onChange={(e) => setInputs({ ...inputs, projectName: e.target.value })}
              className="w-full h-10 rounded-[6px] border border-border-standard bg-white px-3.5 text-[14px] text-text-primary focus:border-nvidia-green focus:ring-1 focus:ring-nvidia-green focus:outline-none transition"
              placeholder="e.g. Nemotron-FineTuning-Job"
            />
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-text-secondary mb-1">Target GPU Architecture</label>
            <select
              value={inputs.targetGpu}
              onChange={(e) => setInputs({ ...inputs, targetGpu: e.target.value })}
              className="w-full h-10 rounded-[6px] border border-border-standard bg-white px-3.5 text-[14px] text-text-primary focus:border-nvidia-green focus:ring-1 focus:ring-nvidia-green focus:outline-none transition"
            >
              {VERIFIED_GPU_CATALOG.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} ({g.vramGb}GB VRAM - {g.provider})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-text-secondary mb-1">Allocated GPU Count</label>
            <input
              type="number"
              min="1"
              max="1024"
              value={inputs.gpuCount}
              onChange={(e) => setInputs({ ...inputs, gpuCount: parseInt(e.target.value, 10) || 1 })}
              className="w-full h-10 rounded-[6px] border border-border-standard bg-white px-3.5 text-[14px] text-text-primary focus:border-nvidia-green focus:ring-1 focus:ring-nvidia-green focus:outline-none transition"
            />
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-text-secondary mb-1">Model Parameters (Billions)</label>
            <input
              type="number"
              step="0.5"
              min="0"
              value={inputs.estimatedModelParamsBillion || ""}
              onChange={(e) =>
                setInputs({ ...inputs, estimatedModelParamsBillion: parseFloat(e.target.value) || undefined })
              }
              className="w-full h-10 rounded-[6px] border border-border-standard bg-white px-3.5 text-[14px] text-text-primary focus:border-nvidia-green focus:ring-1 focus:ring-nvidia-green focus:outline-none transition"
              placeholder="e.g. 70 for Nemotron 70B"
            />
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-text-secondary mb-1">Execution Precision</label>
            <select
              value={inputs.precision || "FP16"}
              onChange={(e) =>
                setInputs({ ...inputs, precision: e.target.value as "FP32" | "FP16" | "BF16" | "FP8" | "INT4" })
              }
              className="w-full h-10 rounded-[6px] border border-border-standard bg-white px-3.5 text-[14px] text-text-primary focus:border-nvidia-green focus:ring-1 focus:ring-nvidia-green focus:outline-none transition"
            >
              <option value="FP32">FP32 (Single Precision - 4 bytes)</option>
              <option value="FP16">FP16 (Half Precision - 2 bytes)</option>
              <option value="BF16">BF16 (Bfloat16 - 2 bytes)</option>
              <option value="FP8">FP8 (Hopper / Ada Native - 1 byte)</option>
              <option value="INT4">INT4 (Quantized - 0.5 bytes)</option>
            </select>
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-text-secondary mb-1">Context Length (Tokens)</label>
            <input
              type="number"
              min="512"
              step="512"
              value={inputs.contextLengthTokens || 4096}
              onChange={(e) => setInputs({ ...inputs, contextLengthTokens: parseInt(e.target.value, 10) || 4096 })}
              className="w-full h-10 rounded-[6px] border border-border-standard bg-white px-3.5 text-[14px] text-text-primary focus:border-nvidia-green focus:ring-1 focus:ring-nvidia-green focus:outline-none transition"
            />
          </div>

          <div>
            <label className="block text-[12px] font-semibold text-text-secondary mb-1">Max Concurrency / Batch Size</label>
            <input
              type="number"
              min="1"
              value={inputs.batchSize || 1}
              onChange={(e) => setInputs({ ...inputs, batchSize: parseInt(e.target.value, 10) || 1 })}
              className="w-full h-10 rounded-[6px] border border-border-standard bg-white px-3.5 text-[14px] text-text-primary focus:border-nvidia-green focus:ring-1 focus:ring-nvidia-green focus:outline-none transition"
            />
          </div>
        </div>
      </div>

      {/* Configuration & Log Files Editor */}
      <div className="rounded-[12px] border border-border-standard bg-white overflow-hidden shadow-card hover:border-border-hover transition">
        {/* Editor Tabs */}
        <div className="flex flex-wrap items-center justify-between border-b border-border-subtle bg-surface-secondary px-4 py-2 gap-2">
          <div className="flex items-center space-x-1 overflow-x-auto">
            <button
              onClick={() => setActiveFileTab("config")}
              className={`rounded-[6px] px-3 py-1.5 text-[13px] font-semibold transition ${
                activeFileTab === "config"
                  ? "bg-white text-nvidia-dark border border-border-standard shadow-sm"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              Workload Config (K8s/Slurm/Compose)
            </button>
            <button
              onClick={() => setActiveFileTab("log")}
              className={`rounded-[6px] px-3 py-1.5 text-[13px] font-semibold transition ${
                activeFileTab === "log"
                  ? "bg-white text-nvidia-dark border border-border-standard shadow-sm"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              Diagnostic / Crash Log
            </button>
            <button
              onClick={() => setActiveFileTab("deps")}
              className={`rounded-[6px] px-3 py-1.5 text-[13px] font-semibold transition ${
                activeFileTab === "deps"
                  ? "bg-white text-nvidia-dark border border-border-standard shadow-sm"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              Python Dependencies (requirements.txt)
            </button>
            <button
              onClick={() => setActiveFileTab("docker")}
              className={`rounded-[6px] px-3 py-1.5 text-[13px] font-semibold transition ${
                activeFileTab === "docker"
                  ? "bg-white text-nvidia-dark border border-border-standard shadow-sm"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              Dockerfile
            </button>
          </div>

          <label className="flex items-center gap-1.5 cursor-pointer rounded-[6px] border border-border-standard bg-white px-3 py-1.5 text-[12px] font-semibold text-text-primary hover:bg-surface-secondary hover:border-border-hover transition shadow-sm">
            <Upload className="h-3.5 w-3.5 text-nvidia-green" />
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
        <div className="p-4 bg-white font-mono text-[12px]">
          {activeFileTab === "config" && (
            <textarea
              rows={9}
              value={inputs.workloadConfigContent || ""}
              onChange={(e) => setInputs({ ...inputs, workloadConfigContent: e.target.value })}
              placeholder="# Paste Kubernetes Pod spec, Slurm batch script, docker-compose.yml, or vLLM config..."
              className="w-full bg-transparent text-text-primary placeholder:text-text-muted focus:outline-none resize-y leading-relaxed"
            />
          )}
          {activeFileTab === "log" && (
            <textarea
              rows={9}
              value={inputs.diagnosticLogContent || ""}
              onChange={(e) => setInputs({ ...inputs, diagnosticLogContent: e.target.value })}
              placeholder="# Paste stack trace or runtime crash log (e.g. CUDA out of memory, NCCL collective timeout, SIGBUS)..."
              className="w-full bg-transparent text-text-primary placeholder:text-text-muted focus:outline-none resize-y leading-relaxed"
            />
          )}
          {activeFileTab === "deps" && (
            <textarea
              rows={9}
              value={inputs.requirementsContent || ""}
              onChange={(e) => setInputs({ ...inputs, requirementsContent: e.target.value })}
              placeholder="# Paste requirements.txt (e.g. torch==2.4.0, flash-attn, vllm, deepspeed)..."
              className="w-full bg-transparent text-text-primary placeholder:text-text-muted focus:outline-none resize-y leading-relaxed"
            />
          )}
          {activeFileTab === "docker" && (
            <textarea
              rows={9}
              value={inputs.dockerfileContent || ""}
              onChange={(e) => setInputs({ ...inputs, dockerfileContent: e.target.value })}
              placeholder="# Paste Dockerfile (FROM nvidia/cuda:12.4.1-devel...)..."
              className="w-full bg-transparent text-text-primary placeholder:text-text-muted focus:outline-none resize-y leading-relaxed"
            />
          )}
        </div>
      </div>

      {/* Preflight Report Results */}
      {preflightReport && (
        <div className="space-y-6">
          {/* Header & Status Card */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-[12px] border border-border-standard bg-white p-5 shadow-card hover:border-border-hover transition">
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-[24px] font-[650] leading-[1.3] text-text-primary">Deterministic Preflight Results</h3>
                <StatusBadge status={preflightReport.overallStatus} size="lg" />
              </div>
              <p className="text-[13px] text-text-secondary mt-1">
                Evaluated {preflightReport.checks.length} inspection modules at {preflightReport.timestamp}
              </p>
            </div>

            {preflightReport.suggestedPatch && (
              <button
                onClick={() => setActiveTab("patch")}
                className="flex items-center gap-2 h-10 px-4 rounded-[6px] bg-nvidia-surface border border-nvidia-green/40 text-nvidia-dark text-[14px] font-semibold hover:bg-nvidia-green/20 transition shadow-sm shrink-0"
              >
                <span>Review Generated Remediation Patch</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* VRAM Sizing Panel with Visual Headroom Gauge */}
          {preflightReport.vramEstimate && (
            <div className="rounded-[12px] border border-border-standard bg-white p-5 space-y-4 shadow-card hover:border-border-hover transition">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <HardDrive className="h-4 w-4 text-nvidia-green" />
                  <h4 className="text-[17px] font-semibold leading-[1.4] text-text-primary">
                    Deterministic VRAM &amp; Memory Headroom Calculation
                  </h4>
                </div>
                <span
                  className={`text-[12px] font-mono font-bold px-2.5 py-0.5 rounded-[4px] border ${
                    preflightReport.vramEstimate.isFeasible
                      ? "border-nvidia-green/40 bg-nvidia-surface text-nvidia-dark"
                      : "border-status-error/30 bg-[#FEE2E2] text-status-error"
                  }`}
                >
                  {preflightReport.vramEstimate.isFeasible ? "FEASIBLE" : "EXCEEDS CAPACITY"}
                </span>
              </div>

              {/* Graphical VRAM Capacity Gauge */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[12px] font-mono">
                  <span className="text-text-secondary">
                    Estimated Consumption: <strong className="text-text-primary tabular-nums">{preflightReport.vramEstimate.totalEstimatedVramGb} GiB</strong>
                  </span>
                  <span className="text-text-secondary">
                    Hardware Ceiling: <strong className="text-text-primary tabular-nums">{preflightReport.vramEstimate.gpuMemoryAvailableGb} GiB</strong> ({vramPercent}%)
                  </span>
                </div>
                <div className="w-full h-3 rounded-full bg-surface-secondary border border-border-subtle overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      preflightReport.vramEstimate.isFeasible
                        ? "bg-nvidia-green"
                        : "bg-status-error"
                    }`}
                    style={{ width: `${vramPercent}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div className="rounded-[8px] border border-border-subtle bg-surface-secondary p-3.5">
                  <div className="text-[11px] text-text-secondary uppercase font-semibold">Weight Memory (per GPU)</div>
                  <div className="text-[20px] font-bold text-text-primary mt-1 tabular-nums">
                    {preflightReport.vramEstimate.weightMemoryGb} GiB
                  </div>
                </div>
                <div className="rounded-[8px] border border-border-subtle bg-surface-secondary p-3.5">
                  <div className="text-[11px] text-text-secondary uppercase font-semibold">KV Cache Memory (per GPU)</div>
                  <div className="text-[20px] font-bold text-text-primary mt-1 tabular-nums">
                    {preflightReport.vramEstimate.kvCacheMemoryGb} GiB
                  </div>
                </div>
                <div className="rounded-[8px] border border-border-subtle bg-surface-secondary p-3.5">
                  <div className="text-[11px] text-text-secondary uppercase font-semibold">CUDA &amp; Overhead</div>
                  <div className="text-[20px] font-bold text-text-primary mt-1 tabular-nums">
                    {preflightReport.vramEstimate.runtimeOverheadGb} GiB
                  </div>
                </div>
                <div className="rounded-[8px] border border-border-subtle bg-surface-secondary p-3.5">
                  <div className="text-[11px] text-text-secondary uppercase font-semibold">Total Estimated vs Physical</div>
                  <div className={`text-[20px] font-bold mt-1 font-mono tabular-nums ${preflightReport.vramEstimate.isFeasible ? "text-nvidia-dark" : "text-status-error"}`}>
                    {preflightReport.vramEstimate.totalEstimatedVramGb} / {preflightReport.vramEstimate.gpuMemoryAvailableGb} GiB
                  </div>
                </div>
              </div>

              <div className="text-[12px] text-text-secondary space-y-1.5 pt-1">
                {preflightReport.vramEstimate.notes.map((note, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-nvidia-green shrink-0 mt-0.5" />
                    <span>{note}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Checks Table */}
          <div className="rounded-[12px] border border-border-standard bg-white overflow-hidden shadow-card hover:border-border-hover transition">
            <div className="px-5 py-4 border-b border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-surface-secondary">
              <h4 className="text-[14px] font-semibold text-text-primary">
                Evaluation Suite Status Table
              </h4>
              <span className="text-[12px] text-text-secondary">
                Static checks distinguished from runtime test logs
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-surface-secondary text-[12px] font-semibold text-text-secondary border-b border-border-subtle uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-5">Inspection Module</th>
                    <th className="py-3 px-5">Evaluation Type</th>
                    <th className="py-3 px-5">Status</th>
                    <th className="py-3 px-5">Summary</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle font-sans text-[13px]">
                  {preflightReport.checks.map((check) => (
                    <tr key={check.id} className="hover:bg-surface-secondary/50 transition">
                      <td className="py-3.5 px-5 font-semibold text-text-primary">
                        {check.name}
                      </td>
                      <td className="py-3.5 px-5">
                        {check.isRuntimeTest ? (
                          <span className="inline-flex items-center gap-1 font-mono text-[11px] text-nvidia-dark font-semibold bg-nvidia-surface px-2 py-0.5 rounded-[4px] border border-nvidia-green/30">
                            Runtime Test
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-mono text-[11px] text-text-secondary font-semibold bg-surface-secondary px-2 py-0.5 rounded-[4px] border border-border-standard">
                            Static Check
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-5">
                        <StatusBadge status={check.status} />
                      </td>
                      <td className="py-3.5 px-5 text-text-secondary leading-[1.5] max-w-md">
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
              <h4 className="text-[17px] font-semibold leading-[1.4] text-text-primary">
                Identified Findings &amp; Diagnostic Evidence ({preflightReport.findings.length})
              </h4>
              <div className="space-y-3">
                {preflightReport.findings.map((finding) => (
                  <div
                    key={finding.id}
                    className="rounded-[12px] border border-border-standard bg-white p-5 space-y-3 hover:border-border-hover transition shadow-card"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <SeverityBadge severity={finding.severity} />
                        <span className="text-[14px] font-semibold text-text-primary">{finding.title}</span>
                      </div>
                      {finding.ruleReference && (
                        <span className="text-[11px] font-mono text-text-muted">
                          Ref: {finding.ruleReference}
                        </span>
                      )}
                    </div>

                    <p className="text-[13px] text-text-secondary leading-[1.5]">
                      {finding.description}
                    </p>

                    <div className="rounded-[6px] bg-surface-secondary p-3 font-mono text-[12px] text-text-primary border border-border-subtle">
                      <div className="text-[11px] text-text-secondary mb-1 uppercase font-semibold">Evidence:</div>
                      {finding.evidence}
                    </div>

                    <div className="rounded-[6px] bg-nvidia-surface p-3 font-sans text-[13px] text-text-primary border border-nvidia-green/30">
                      <strong className="text-nvidia-dark mr-1 font-semibold">Deterministic Recommendation:</strong>
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
