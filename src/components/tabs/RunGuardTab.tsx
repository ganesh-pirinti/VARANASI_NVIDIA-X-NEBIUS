"use client";

import React, { useState } from "react";
import { 
  ShieldAlert, 
  Play, 
  FileCode, 
  Upload, 
  AlertTriangle, 
  Cpu, 
  CheckCircle, 
  HelpCircle,
  HardDrive,
  ArrowRight,
  Info
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

  return (
    <div className="space-y-6">
      {/* Top Configuration Bar */}
      <div className="rounded-xl border border-navy-800 bg-navy-900/80 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-navy-800 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-cyan-400" />
              <span>GPU RunGuard — Preflight & Runtime Diagnostic Inspection</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Deterministic static checks and runtime log inspection. Eliminates configuration-induced cloud GPU crashes.
            </p>
          </div>
          <button
            onClick={onRunPreflight}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 rounded-lg bg-cyan-500 px-5 py-2.5 text-xs font-bold text-navy-950 hover:bg-cyan-400 disabled:opacity-50 transition shadow-lg shadow-cyan-500/20 shrink-0"
          >
            <Play className="h-4 w-4 fill-navy-950" />
            <span>{isLoading ? "Running Checks..." : "Run Preflight Checks"}</span>
          </button>
        </div>

        {/* Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div>
            <label className="block text-slate-400 mb-1 font-medium">Workload Name</label>
            <input
              type="text"
              value={inputs.projectName}
              onChange={(e) => setInputs({ ...inputs, projectName: e.target.value })}
              className="w-full rounded border border-navy-750 bg-navy-950 px-3 py-1.5 text-slate-200 focus:border-cyan-500 focus:outline-none"
              placeholder="e.g. Nemotron-FineTuning-Job"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">Target GPU Architecture</label>
            <select
              value={inputs.targetGpu}
              onChange={(e) => setInputs({ ...inputs, targetGpu: e.target.value })}
              className="w-full rounded border border-navy-750 bg-navy-950 px-3 py-1.5 text-slate-200 focus:border-cyan-500 focus:outline-none"
            >
              {VERIFIED_GPU_CATALOG.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} ({g.vramGb}GB VRAM - {g.provider})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">Allocated GPU Count</label>
            <input
              type="number"
              min="1"
              max="1024"
              value={inputs.gpuCount}
              onChange={(e) => setInputs({ ...inputs, gpuCount: parseInt(e.target.value, 10) || 1 })}
              className="w-full rounded border border-navy-750 bg-navy-950 px-3 py-1.5 text-slate-200 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">Model Parameters (Billions)</label>
            <input
              type="number"
              step="0.5"
              min="0"
              value={inputs.estimatedModelParamsBillion || ""}
              onChange={(e) =>
                setInputs({ ...inputs, estimatedModelParamsBillion: parseFloat(e.target.value) || undefined })
              }
              className="w-full rounded border border-navy-750 bg-navy-950 px-3 py-1.5 text-slate-200 focus:border-cyan-500 focus:outline-none"
              placeholder="e.g. 70 for Nemotron 70B"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">Execution Precision</label>
            <select
              value={inputs.precision || "FP16"}
              onChange={(e) =>
                setInputs({ ...inputs, precision: e.target.value as "FP32" | "FP16" | "BF16" | "FP8" | "INT4" })
              }
              className="w-full rounded border border-navy-750 bg-navy-950 px-3 py-1.5 text-slate-200 focus:border-cyan-500 focus:outline-none"
            >
              <option value="FP32">FP32 (Single Precision - 4 bytes)</option>
              <option value="FP16">FP16 (Half Precision - 2 bytes)</option>
              <option value="BF16">BF16 (Bfloat16 - 2 bytes)</option>
              <option value="FP8">FP8 (Hopper / Ada Native - 1 byte)</option>
              <option value="INT4">INT4 (Quantized - 0.5 bytes)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">Context Length (Tokens)</label>
            <input
              type="number"
              min="512"
              step="512"
              value={inputs.contextLengthTokens || 4096}
              onChange={(e) => setInputs({ ...inputs, contextLengthTokens: parseInt(e.target.value, 10) || 4096 })}
              className="w-full rounded border border-navy-750 bg-navy-950 px-3 py-1.5 text-slate-200 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">Max Concurrency / Batch Size</label>
            <input
              type="number"
              min="1"
              value={inputs.batchSize || 1}
              onChange={(e) => setInputs({ ...inputs, batchSize: parseInt(e.target.value, 10) || 1 })}
              className="w-full rounded border border-navy-750 bg-navy-950 px-3 py-1.5 text-slate-200 focus:border-cyan-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Configuration & Log Files Editor */}
      <div className="rounded-xl border border-navy-800 bg-navy-900/80 overflow-hidden">
        {/* Editor Tabs */}
        <div className="flex items-center justify-between border-b border-navy-800 bg-navy-950/60 px-4 py-2">
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setActiveFileTab("config")}
              className={`rounded px-3 py-1.5 text-xs font-semibold transition ${
                activeFileTab === "config"
                  ? "bg-navy-800 text-cyan-300 border border-navy-700"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Workload Config (K8s/Slurm/Compose)
            </button>
            <button
              onClick={() => setActiveFileTab("log")}
              className={`rounded px-3 py-1.5 text-xs font-semibold transition ${
                activeFileTab === "log"
                  ? "bg-navy-800 text-cyan-300 border border-navy-700"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Diagnostic / Crash Log
            </button>
            <button
              onClick={() => setActiveFileTab("deps")}
              className={`rounded px-3 py-1.5 text-xs font-semibold transition ${
                activeFileTab === "deps"
                  ? "bg-navy-800 text-cyan-300 border border-navy-700"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Python Dependencies (requirements.txt)
            </button>
            <button
              onClick={() => setActiveFileTab("docker")}
              className={`rounded px-3 py-1.5 text-xs font-semibold transition ${
                activeFileTab === "docker"
                  ? "bg-navy-800 text-cyan-300 border border-navy-700"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Dockerfile
            </button>
          </div>

          <label className="flex items-center gap-1.5 cursor-pointer rounded bg-navy-800 px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:bg-navy-750 transition">
            <Upload className="h-3 w-3 text-cyan-400" />
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
        <div className="p-4 bg-navy-950 font-mono text-xs">
          {activeFileTab === "config" && (
            <textarea
              rows={9}
              value={inputs.workloadConfigContent || ""}
              onChange={(e) => setInputs({ ...inputs, workloadConfigContent: e.target.value })}
              placeholder="# Paste Kubernetes Pod spec, Slurm batch script, docker-compose.yml, or vLLM config..."
              className="w-full bg-transparent text-slate-300 focus:outline-none resize-y leading-relaxed"
            />
          )}
          {activeFileTab === "log" && (
            <textarea
              rows={9}
              value={inputs.diagnosticLogContent || ""}
              onChange={(e) => setInputs({ ...inputs, diagnosticLogContent: e.target.value })}
              placeholder="# Paste stack trace or runtime crash log (e.g. CUDA out of memory, NCCL collective timeout, SIGBUS)..."
              className="w-full bg-transparent text-slate-300 focus:outline-none resize-y leading-relaxed"
            />
          )}
          {activeFileTab === "deps" && (
            <textarea
              rows={9}
              value={inputs.requirementsContent || ""}
              onChange={(e) => setInputs({ ...inputs, requirementsContent: e.target.value })}
              placeholder="# Paste requirements.txt (e.g. torch==2.4.0, flash-attn, vllm, deepspeed)..."
              className="w-full bg-transparent text-slate-300 focus:outline-none resize-y leading-relaxed"
            />
          )}
          {activeFileTab === "docker" && (
            <textarea
              rows={9}
              value={inputs.dockerfileContent || ""}
              onChange={(e) => setInputs({ ...inputs, dockerfileContent: e.target.value })}
              placeholder="# Paste Dockerfile (FROM nvidia/cuda:12.4.1-devel...)..."
              className="w-full bg-transparent text-slate-300 focus:outline-none resize-y leading-relaxed"
            />
          )}
        </div>
      </div>

      {/* Preflight Report Results */}
      {preflightReport && (
        <div className="space-y-6">
          {/* Header & Status Card */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-navy-800 bg-navy-900/80 p-5">
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-bold text-slate-100">Deterministic Preflight Results</h3>
                <StatusBadge status={preflightReport.overallStatus} size="lg" />
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Evaluated {preflightReport.checks.length} inspection modules at {preflightReport.timestamp}
              </p>
            </div>

            {preflightReport.suggestedPatch && (
              <button
                onClick={() => setActiveTab("patch")}
                className="flex items-center gap-2 rounded-lg bg-emerald-500/20 border border-emerald-500/40 px-4 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-500/30 transition shrink-0"
              >
                <span>Review Generated Remediation Patch</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* VRAM Sizing Panel */}
          {preflightReport.vramEstimate && (
            <div className="rounded-xl border border-navy-800 bg-navy-900/80 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-cyan-400" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Deterministic VRAM & Memory Headroom Calculation
                  </h4>
                </div>
                <span
                  className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
                    preflightReport.vramEstimate.isFeasible
                      ? "border-emerald-500/40 bg-emerald-950/40 text-emerald-400"
                      : "border-rose-500/40 bg-rose-950/40 text-rose-400"
                  }`}
                >
                  {preflightReport.vramEstimate.isFeasible ? "FEASIBLE" : "EXCEEDS CAPACITY"}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div className="rounded border border-navy-750 bg-navy-950 p-3">
                  <div className="text-[10px] text-slate-500">Weight Memory (per GPU)</div>
                  <div className="text-sm font-bold text-slate-200 mt-1">
                    {preflightReport.vramEstimate.weightMemoryGb} GiB
                  </div>
                </div>
                <div className="rounded border border-navy-750 bg-navy-950 p-3">
                  <div className="text-[10px] text-slate-500">KV Cache Memory (per GPU)</div>
                  <div className="text-sm font-bold text-slate-200 mt-1">
                    {preflightReport.vramEstimate.kvCacheMemoryGb} GiB
                  </div>
                </div>
                <div className="rounded border border-navy-750 bg-navy-950 p-3">
                  <div className="text-[10px] text-slate-500">CUDA & Runtime Overhead</div>
                  <div className="text-sm font-bold text-slate-200 mt-1">
                    {preflightReport.vramEstimate.runtimeOverheadGb} GiB
                  </div>
                </div>
                <div className="rounded border border-navy-750 bg-navy-950 p-3">
                  <div className="text-[10px] text-slate-500">Total Estimated vs Physical</div>
                  <div className="text-sm font-bold text-cyan-300 mt-1">
                    {preflightReport.vramEstimate.totalEstimatedVramGb} / {preflightReport.vramEstimate.gpuMemoryAvailableGb} GiB
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 space-y-1">
                {preflightReport.vramEstimate.notes.map((note, idx) => (
                  <div key={idx} className="flex items-start gap-1.5">
                    <Info className="h-3 w-3 text-cyan-400 shrink-0 mt-0.5" />
                    <span>{note}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Checks Table */}
          <div className="rounded-xl border border-navy-800 bg-navy-900/80 overflow-hidden">
            <div className="px-5 py-3 border-b border-navy-800 flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Evaluation Suite Status Table
              </h4>
              <span className="text-[11px] text-slate-400">
                Static checks distinguished from runtime test logs
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-navy-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-navy-800">
                  <tr>
                    <th className="py-2.5 px-4">Inspection Module</th>
                    <th className="py-2.5 px-4">Evaluation Type</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4">Summary</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-800/60 font-sans">
                  {preflightReport.checks.map((check) => (
                    <tr key={check.id} className="hover:bg-navy-850/40 transition">
                      <td className="py-3 px-4 font-semibold text-slate-200">
                        {check.name}
                      </td>
                      <td className="py-3 px-4">
                        {check.isRuntimeTest ? (
                          <span className="inline-flex items-center gap-1 font-mono text-[11px] text-cyan-400 font-semibold bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-500/30">
                            Runtime Test
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-mono text-[11px] text-slate-400 font-semibold bg-navy-800/60 px-2 py-0.5 rounded border border-navy-700">
                            Static Check
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={check.status} />
                      </td>
                      <td className="py-3 px-4 text-slate-300 leading-relaxed max-w-md">
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
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Identified Findings & Diagnostic Evidence ({preflightReport.findings.length})
              </h4>
              <div className="space-y-3">
                {preflightReport.findings.map((finding) => (
                  <div
                    key={finding.id}
                    className="rounded-lg border border-navy-750 bg-navy-900/80 p-4 space-y-2 hover:border-navy-700 transition"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <SeverityBadge severity={finding.severity} />
                        <span className="text-xs font-bold text-slate-100">{finding.title}</span>
                      </div>
                      {finding.ruleReference && (
                        <span className="text-[10px] font-mono text-slate-500">
                          Ref: {finding.ruleReference}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {finding.description}
                    </p>

                    <div className="rounded bg-navy-950 p-2.5 font-mono text-[11px] text-cyan-300/90 border border-navy-800">
                      <div className="text-[10px] text-slate-500 mb-1 uppercase font-semibold">Evidence:</div>
                      {finding.evidence}
                    </div>

                    <div className="rounded bg-emerald-950/30 p-2.5 font-sans text-xs text-emerald-300/90 border border-emerald-900/50">
                      <strong className="text-emerald-400">Deterministic Recommendation:</strong> {finding.recommendedFix}
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
