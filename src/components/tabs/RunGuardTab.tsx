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
  CheckCircle2,
  Plus,
  Sliders,
  Sparkles,
  Search,
  Eye,
  RotateCw,
  Scale,
  Check,
  X
} from "lucide-react";
import { PreflightInputs, PreflightReport, Finding, CheckResult, CustomValidationRule, ProposedPatch } from "@/types/runguard";
import { VERIFIED_GPU_CATALOG } from "@/lib/constants";
import { DemoFixture } from "@/lib/fixtures/demo-workloads";
import { StatusBadge, SeverityBadge } from "../ui/StatusBadge";
import { CustomWorkloadModal } from "../runguard/CustomWorkloadModal";
import { CustomCheckModal } from "../runguard/CustomCheckModal";
import { AiFixModal } from "../runguard/AiFixModal";
import { WorkloadComparisonModal } from "../runguard/WorkloadComparisonModal";
import { estimateVram } from "@/lib/preflight/vram-estimator";

interface RunGuardTabProps {
  inputs: PreflightInputs;
  setInputs: React.Dispatch<React.SetStateAction<PreflightInputs>>;
  preflightReport: PreflightReport | null;
  onRunPreflight: () => Promise<void>;
  isLoading: boolean;
  setActiveTab: (tab: string) => void;
  loadedFixture?: DemoFixture | null;
  onApplyPatch?: (patch?: ProposedPatch) => void;
  onReverifyPatch?: () => Promise<void>;
  isReverifying?: boolean;
}

export const RunGuardTab: React.FC<RunGuardTabProps> = ({
  inputs,
  setInputs,
  preflightReport,
  onRunPreflight,
  isLoading,
  setActiveTab,
  loadedFixture,
  onApplyPatch,
  onReverifyPatch,
  isReverifying = false,
}) => {
  const [activeFileTab, setActiveFileTab] = useState<"docker" | "deps" | "config" | "log">("config");

  // Modal dialog states
  const [showCustomWorkloadModal, setShowCustomWorkloadModal] = useState(false);
  const [showCustomCheckModal, setShowCustomCheckModal] = useState(false);
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [activeFindingForFix, setActiveFindingForFix] = useState<Finding | null>(null);
  const [inspectedCheck, setInspectedCheck] = useState<CheckResult | null>(null);
  const [detailsCheck, setDetailsCheck] = useState<CheckResult | null>(null);

  // Custom rules collection stored with inputs
  const customRules = inputs.customRules || [];

  const handleAddCustomRule = (newRule: CustomValidationRule) => {
    const updated = [...customRules, newRule];
    setInputs((prev) => ({ ...prev, customRules: updated }));
  };

  const handleDeleteCustomRule = (id: string) => {
    const updated = customRules.filter((r) => r.id !== id);
    setInputs((prev) => ({ ...prev, customRules: updated }));
  };

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

  // Dynamic live VRAM calculation based on active inputs
  const liveVram = inputs.estimatedModelParamsBillion && inputs.estimatedModelParamsBillion > 0
    ? estimateVram({
        modelParamsBillion: inputs.estimatedModelParamsBillion,
        precision: inputs.precision || "FP16",
        contextLengthTokens: inputs.contextLengthTokens || 4096,
        batchSize: inputs.batchSize || 1,
        targetGpuId: inputs.targetGpu || "nebius-h100-sxm",
        gpuCount: inputs.gpuCount || 1,
      })
    : preflightReport?.vramEstimate;

  const vramPercent = liveVram
    ? Math.min(100, Math.round((liveVram.totalEstimatedVramGb / liveVram.gpuMemoryAvailableGb) * 100))
    : 0;

  // Actions trigger handlers
  const handleTriggerAiFix = (finding: Finding) => {
    setActiveFindingForFix(finding);
  };

  const handleApplyPatchToWorkload = (patch: ProposedPatch) => {
    if (patch.targetFile.includes("Dockerfile")) {
      setInputs((prev) => ({ ...prev, dockerfileContent: patch.patchedContent }));
    } else if (patch.targetFile.includes("requirements")) {
      setInputs((prev) => ({ ...prev, requirementsContent: patch.patchedContent }));
    } else {
      setInputs((prev) => ({ ...prev, workloadConfigContent: patch.patchedContent }));
    }
    if (onApplyPatch) onApplyPatch(patch);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Simulation Banner if loaded from fixture */}
      {loadedFixture && (
        <div className="rounded-[12px] border border-status-warning/40 bg-[#FEF3C7] p-4 text-[13px] text-text-primary flex items-center justify-between gap-3 shadow-card animate-fade-in">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-status-warning shrink-0" />
            <span>
              Inspecting Simulated Fixture: <strong className="text-text-primary font-mono">{loadedFixture.name}</strong>. Modifications to input fields update inspection dynamically.
            </span>
          </div>
          <span className="text-[11px] font-mono uppercase font-bold tracking-wider px-2.5 py-1 rounded-[4px] bg-white text-status-warning border border-status-warning/30 shrink-0 shadow-sm">
            Simulated Inputs
          </span>
        </div>
      )}

      {/* Top Configuration Bar & Action Controls */}
      <div className="enterprise-card space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border-subtle pb-4">
          <div>
            <h2 className="text-[24px] font-[650] leading-[1.3] text-text-primary flex items-center gap-2.5">
              <ShieldAlert className="h-6 w-6 text-nvidia-green" />
              <span>GPU RunGuard — Preflight &amp; Runtime Diagnostic Inspection</span>
            </h2>
            <p className="text-[13px] font-normal leading-[1.5] text-text-secondary mt-1">
              Deterministic static checks, runtime log inspection, and custom guardrails. Eliminates cloud GPU crashes before deployment.
            </p>
          </div>

          {/* Action Button Row */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => setShowCustomWorkloadModal(true)}
              className="flex items-center gap-1.5 h-10 px-3.5 rounded-[6px] border border-border-standard bg-white text-text-primary text-[13px] font-semibold hover:border-nvidia-green hover:bg-nvidia-surface/30 active:scale-[0.98] transition-all duration-150 shadow-sm"
              title="Configure project, SLA, and custom workload specs"
            >
              <Plus className="h-4 w-4 text-nvidia-green" />
              <span>Add Custom Workload</span>
            </button>

            <button
              onClick={() => setShowCustomCheckModal(true)}
              className="flex items-center gap-1.5 h-10 px-3.5 rounded-[6px] border border-border-standard bg-white text-text-primary text-[13px] font-semibold hover:border-nvidia-green hover:bg-nvidia-surface/30 active:scale-[0.98] transition-all duration-150 shadow-sm"
              title="Add a custom deterministic validation policy"
            >
              <Sliders className="h-4 w-4 text-nvidia-green" />
              <span>Add Custom Check</span>
              {customRules.length > 0 && (
                <span className="rounded-full bg-nvidia-surface text-nvidia-dark text-[11px] font-bold px-1.5">
                  {customRules.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setShowComparisonModal(true)}
              className="flex items-center gap-1.5 h-10 px-3.5 rounded-[6px] border border-border-standard bg-white text-text-primary text-[13px] font-semibold hover:border-nvidia-green hover:bg-nvidia-surface/30 active:scale-[0.98] transition-all duration-150 shadow-sm"
              title="Compare current workload against alternative GPU / precision setup"
            >
              <Scale className="h-4 w-4 text-nvidia-green" />
              <span>Compare Alternatives</span>
            </button>

            <button
              onClick={onRunPreflight}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 h-10 px-4 rounded-[6px] bg-nvidia-green text-white text-[14px] font-semibold hover:bg-nvidia-hover active:scale-[0.98] disabled:opacity-50 transition-all duration-150 shadow-card focus:outline-none focus:ring-2 focus:ring-nvidia-green focus:ring-offset-2 shrink-0"
            >
              <Play className="h-4 w-4 fill-white text-white" />
              <span>{isLoading ? "Running Checks..." : "Run Preflight Checks"}</span>
            </button>
          </div>
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

      {/* Interactive VRAM & Memory Headroom Panel */}
      {liveVram && (
        <div className="enterprise-card space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-subtle pb-3">
            <div className="flex items-center gap-2.5">
              <div className="rounded-[6px] bg-nvidia-surface p-1.5 text-nvidia-dark border border-nvidia-green/30">
                <HardDrive className="h-4 w-4 text-nvidia-green" />
              </div>
              <div>
                <h4 className="text-[17px] font-semibold leading-[1.4] text-text-primary">
                  Interactive VRAM &amp; Memory Headroom Panel
                </h4>
                <p className="text-[12px] text-text-secondary">
                  Instant recalculated GPU memory consumption based on model parameters, context length, and concurrency
                </p>
              </div>
            </div>
            <span
              className={`text-[12px] font-mono font-bold px-2.5 py-1 rounded-[6px] border transition-all duration-300 ${
                liveVram.isFeasible
                  ? "border-nvidia-green/40 bg-nvidia-surface text-nvidia-dark"
                  : "border-status-error/30 bg-[#FEE2E2] text-status-error"
              }`}
            >
              {liveVram.isFeasible ? "CAPACITY FEASIBLE" : "EXCEEDS GPU CAPACITY"}
            </span>
          </div>

          {/* Animated Graphical VRAM Capacity Gauge */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[12px] font-mono">
              <span className="text-text-secondary">
                Calculated VRAM per GPU: <strong className="text-text-primary tabular-nums">{liveVram.totalEstimatedVramGb} GiB</strong>
              </span>
              <span className="text-text-secondary">
                Hardware Ceiling: <strong className="text-text-primary tabular-nums">{liveVram.gpuMemoryAvailableGb} GiB</strong> ({vramPercent}%)
              </span>
            </div>
            <div className="w-full h-3 rounded-full bg-surface-secondary border border-border-subtle overflow-hidden">
              <div
                className={`h-full transition-all duration-700 ease-out ${
                  liveVram.isFeasible ? "bg-nvidia-green" : "bg-status-error"
                }`}
                style={{ width: `${vramPercent}%` }}
              />
            </div>
          </div>

          {/* Breakdown cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="rounded-[8px] border border-border-subtle bg-surface-secondary p-3">
              <div className="text-[11px] text-text-secondary uppercase font-semibold">Weight Memory</div>
              <div className="text-[19px] font-bold text-text-primary mt-1 tabular-nums">
                {liveVram.weightMemoryGb} GiB
              </div>
            </div>
            <div className="rounded-[8px] border border-border-subtle bg-surface-secondary p-3">
              <div className="text-[11px] text-text-secondary uppercase font-semibold">KV Cache Memory</div>
              <div className="text-[19px] font-bold text-text-primary mt-1 tabular-nums">
                {liveVram.kvCacheMemoryGb} GiB
              </div>
            </div>
            <div className="rounded-[8px] border border-border-subtle bg-surface-secondary p-3">
              <div className="text-[11px] text-text-secondary uppercase font-semibold">CUDA &amp; Overhead</div>
              <div className="text-[19px] font-bold text-text-primary mt-1 tabular-nums">
                {liveVram.runtimeOverheadGb} GiB
              </div>
            </div>
            <div className="rounded-[8px] border border-border-subtle bg-surface-secondary p-3">
              <div className="text-[11px] text-text-secondary uppercase font-semibold">Available Headroom</div>
              <div
                className={`text-[19px] font-bold mt-1 tabular-nums ${
                  liveVram.isFeasible ? "text-nvidia-dark" : "text-status-error"
                }`}
              >
                {liveVram.isFeasible
                  ? `+${(liveVram.gpuMemoryAvailableGb - liveVram.totalEstimatedVramGb).toFixed(2)} GiB`
                  : `-${(liveVram.totalEstimatedVramGb - liveVram.gpuMemoryAvailableGb).toFixed(2)} GiB OOM`}
              </div>
            </div>
          </div>

          {/* Actionable Alternatives if Capacity Exceeded */}
          {!liveVram.isFeasible && (
            <div className="rounded-[10px] border border-status-error/30 bg-[#FEF2F2] p-4 space-y-3 animate-fade-in">
              <div className="flex items-center gap-2 text-status-error font-bold text-[13px]">
                <AlertTriangle className="h-4 w-4" />
                <span>Actionable Optimization Alternatives to Resolve Memory Overflow:</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[12px]">
                <button
                  onClick={() => setInputs((prev) => ({ ...prev, precision: "FP8" }))}
                  className="rounded-[6px] border border-border-standard bg-white p-2.5 text-left hover:border-nvidia-green hover:bg-nvidia-surface/30 transition shadow-sm"
                >
                  <div className="font-semibold text-text-primary">1. Quantize to FP8</div>
                  <div className="text-text-secondary text-[11px] mt-0.5">Cuts model weight VRAM by ~50% with Hopper support.</div>
                </button>
                <button
                  onClick={() =>
                    setInputs((prev) => ({
                      ...prev,
                      contextLengthTokens: Math.max(2048, Math.floor((prev.contextLengthTokens || 8192) / 2)),
                    }))
                  }
                  className="rounded-[6px] border border-border-standard bg-white p-2.5 text-left hover:border-nvidia-green hover:bg-nvidia-surface/30 transition shadow-sm"
                >
                  <div className="font-semibold text-text-primary">2. Reduce Context Length</div>
                  <div className="text-text-secondary text-[11px] mt-0.5">Halves KV-cache memory allocation.</div>
                </button>
                <button
                  onClick={() =>
                    setInputs((prev) => ({
                      ...prev,
                      gpuCount: Math.min(8, (prev.gpuCount || 1) * 2),
                    }))
                  }
                  className="rounded-[6px] border border-border-standard bg-white p-2.5 text-left hover:border-nvidia-green hover:bg-nvidia-surface/30 transition shadow-sm"
                >
                  <div className="font-semibold text-text-primary">3. Scale GPU Count</div>
                  <div className="text-text-secondary text-[11px] mt-0.5">Distributes weights across GPUs via Tensor Parallelism.</div>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Configuration & Log Files Editor */}
      <div className="enterprise-card p-0 overflow-hidden">
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 enterprise-card">
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

          {/* Upgraded Checks Table with Actions Column */}
          <div className="enterprise-card p-0 overflow-hidden">
            <div className="px-5 py-4 border-b border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-surface-secondary">
              <div>
                <h4 className="text-[14px] font-semibold text-text-primary">
                  Evaluation Suite Status Table
                </h4>
                <p className="text-[12px] text-text-secondary mt-0.5">
                  Static checks distinguished from runtime test logs with interactive action triggers
                </p>
              </div>
              <span className="text-[12px] font-mono font-semibold text-text-muted bg-white px-2.5 py-1 rounded border border-border-subtle">
                {preflightReport.checks.length} Checked Modules
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
                    <th className="py-3 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle font-sans text-[13px]">
                  {preflightReport.checks.map((check) => {
                    const failFinding = check.findings.find((f) => f.severity === "CRITICAL" || f.severity === "HIGH") || check.findings[0];
                    return (
                      <tr key={check.id} className="hover:bg-surface-secondary/40 transition">
                        <td className="py-3.5 px-5 font-semibold text-text-primary">
                          <div className="flex items-center gap-2">
                            <span>{check.name}</span>
                            {check.category === "CUSTOM_RULE" && (
                              <span className="text-[10px] font-mono text-gold font-bold bg-gold-surface px-1.5 py-0.5 rounded border border-gold/30">
                                CUSTOM
                              </span>
                            )}
                          </div>
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
                        <td className="py-3.5 px-5 text-text-secondary leading-[1.5] max-w-sm">
                          {check.summary}
                        </td>
                        <td className="py-3.5 px-5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Inspect Action */}
                            <button
                              onClick={() => setInspectedCheck(check)}
                              className="p-1.5 rounded-[4px] border border-border-standard bg-white text-text-secondary hover:text-text-primary hover:border-nvidia-green transition shadow-sm"
                              title="Inspect complete evidence & telemetry"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>

                            {/* Details Action */}
                            <button
                              onClick={() => setDetailsCheck(check)}
                              className="p-1.5 rounded-[4px] border border-border-standard bg-white text-text-secondary hover:text-text-primary hover:border-nvidia-green transition shadow-sm"
                              title="View deterministic rule logic & parameters"
                            >
                              <Info className="h-3.5 w-3.5" />
                            </button>

                            {/* Re-test Action */}
                            <button
                              onClick={onRunPreflight}
                              className="p-1.5 rounded-[4px] border border-border-standard bg-white text-text-secondary hover:text-text-primary hover:border-nvidia-green transition shadow-sm"
                              title="Re-run check evaluation"
                            >
                              <RotateCw className="h-3.5 w-3.5" />
                            </button>

                            {/* Actionable AI Fix or Investigate Action */}
                            {check.status === "FAIL" && failFinding && (
                              <button
                                onClick={() => handleTriggerAiFix(failFinding)}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-[4px] bg-nvidia-surface border border-nvidia-green/40 text-nvidia-dark text-[11px] font-bold hover:bg-nvidia-green/20 transition shadow-sm"
                                title="Propose AI-assisted fix for this failure"
                              >
                                <Sparkles className="h-3 w-3 text-nvidia-green" />
                                <span>AI Fix</span>
                              </button>
                            )}

                            {check.status === "UNKNOWN" && (
                              <button
                                onClick={() => setActiveTab("diagnose")}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-[4px] border border-border-standard bg-white text-text-secondary text-[11px] font-semibold hover:border-nvidia-green hover:text-text-primary transition shadow-sm"
                                title="Investigate unknown condition"
                              >
                                <Search className="h-3 w-3 text-text-muted" />
                                <span>Investigate</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detailed Findings Cards with Prominent AI Fix Buttons */}
          {preflightReport.findings.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-[17px] font-semibold leading-[1.4] text-text-primary flex items-center justify-between">
                <span>Identified Findings &amp; Diagnostic Evidence ({preflightReport.findings.length})</span>
                <span className="text-[12px] text-text-muted font-normal">
                  Click AI Fix to formulate verified remediation patches
                </span>
              </h4>
              <div className="space-y-3">
                {preflightReport.findings.map((finding) => (
                  <div
                    key={finding.id}
                    className="enterprise-card space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <SeverityBadge severity={finding.severity} />
                        <span className="text-[14px] font-semibold text-text-primary">{finding.title}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {finding.ruleReference && (
                          <span className="text-[11px] font-mono text-text-muted">
                            Ref: {finding.ruleReference}
                          </span>
                        )}
                        <button
                          onClick={() => handleTriggerAiFix(finding)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-nvidia-surface border border-nvidia-green/40 text-nvidia-dark text-[12px] font-bold hover:bg-nvidia-green/20 active:scale-[0.98] transition-all shadow-sm"
                        >
                          <Sparkles className="h-3.5 w-3.5 text-nvidia-green" />
                          <span>AI Fix</span>
                        </button>
                      </div>
                    </div>

                    <p className="text-[13px] text-text-secondary leading-[1.5]">
                      {finding.description}
                    </p>

                    <div className="rounded-[6px] bg-surface-secondary p-3 font-mono text-[12px] text-text-primary border border-border-subtle">
                      <div className="text-[11px] text-text-secondary mb-1 uppercase font-semibold">Evidence:</div>
                      {finding.evidence}
                    </div>

                    <div className="rounded-[6px] bg-nvidia-surface p-3 font-sans text-[13px] text-text-primary border border-nvidia-green/30 flex items-start justify-between gap-3">
                      <div>
                        <strong className="text-nvidia-dark mr-1 font-semibold">Deterministic Recommendation:</strong>
                        {finding.recommendedFix}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Inspect Modal Dialog */}
      {inspectedCheck && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xl rounded-[12px] border border-border-standard bg-white shadow-elevated p-6 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <h3 className="text-[16px] font-bold text-text-primary flex items-center gap-2">
                <Eye className="h-4 w-4 text-nvidia-green" />
                <span>Inspection Evidence: {inspectedCheck.name}</span>
              </h3>
              <button
                onClick={() => setInspectedCheck(null)}
                className="text-text-muted hover:text-text-primary p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3 text-[13px]">
              <div>
                <span className="text-[11px] text-text-muted uppercase font-semibold">Summary</span>
                <p className="text-text-primary mt-0.5">{inspectedCheck.summary}</p>
              </div>
              <div>
                <span className="text-[11px] text-text-muted uppercase font-semibold">Category &amp; Evaluation</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-mono text-[11px] bg-surface-secondary px-2 py-0.5 rounded border border-border-subtle">
                    {inspectedCheck.category}
                  </span>
                  <StatusBadge status={inspectedCheck.status} size="sm" />
                </div>
              </div>
              {inspectedCheck.findings.length > 0 && (
                <div>
                  <span className="text-[11px] text-text-muted uppercase font-semibold">Findings &amp; Trace Evidence</span>
                  <div className="mt-1 space-y-2">
                    {inspectedCheck.findings.map((f, idx) => (
                      <div key={idx} className="rounded bg-surface-secondary p-3 text-[12px] font-mono border border-border-subtle">
                        <div className="font-semibold text-text-primary">{f.title}</div>
                        <div className="text-text-secondary mt-1">{f.evidence}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end pt-2 border-t border-border-subtle">
              <button
                onClick={() => setInspectedCheck(null)}
                className="btn-primary-green text-[13px] h-9 px-4"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal Dialog */}
      {detailsCheck && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xl rounded-[12px] border border-border-standard bg-white shadow-elevated p-6 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <h3 className="text-[16px] font-bold text-text-primary flex items-center gap-2">
                <Info className="h-4 w-4 text-nvidia-green" />
                <span>Deterministic Rule Parameters: {detailsCheck.name}</span>
              </h3>
              <button
                onClick={() => setDetailsCheck(null)}
                className="text-text-muted hover:text-text-primary p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3 text-[13px]">
              <div>
                <span className="text-[11px] text-text-muted uppercase font-semibold">Inspection Policy Specification</span>
                <p className="text-text-primary mt-1 leading-relaxed">
                  {detailsCheck.ruleDetails || "Standard deterministic static and runtime preflight rule."}
                </p>
              </div>
              <div className="rounded bg-surface-secondary p-3 text-[12px] space-y-1 font-mono border border-border-subtle">
                <div>Check ID: <span className="text-text-primary font-bold">{detailsCheck.id}</span></div>
                <div>Runtime Check: <span className="text-text-primary">{detailsCheck.isRuntimeTest ? "True (Log Analysis)" : "False (Static Config)"}</span></div>
                <div>Evaluated At: <span className="text-text-primary">{detailsCheck.checkedAt}</span></div>
              </div>
            </div>
            <div className="flex justify-end pt-2 border-t border-border-subtle">
              <button
                onClick={() => setDetailsCheck(null)}
                className="btn-primary-green text-[13px] h-9 px-4"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals for Custom Workloads, Custom Checks, AI Fix, & Comparisons */}
      <CustomWorkloadModal
        isOpen={showCustomWorkloadModal}
        onClose={() => setShowCustomWorkloadModal(false)}
        onApplyWorkload={(workload) => {
          setInputs(workload);
          // Auto run preflight on applied workload
          setTimeout(() => onRunPreflight(), 100);
        }}
        currentInputs={inputs}
      />

      <CustomCheckModal
        isOpen={showCustomCheckModal}
        onClose={() => setShowCustomCheckModal(false)}
        onSaveRule={handleAddCustomRule}
        existingRules={customRules}
        onDeleteRule={handleDeleteCustomRule}
      />

      <WorkloadComparisonModal
        isOpen={showComparisonModal}
        onClose={() => setShowComparisonModal(false)}
        currentInputs={inputs}
      />

      <AiFixModal
        isOpen={!!activeFindingForFix}
        onClose={() => setActiveFindingForFix(null)}
        finding={activeFindingForFix}
        inputs={inputs}
        onApplyPatchToWorkload={handleApplyPatchToWorkload}
        onReverify={onReverifyPatch || onRunPreflight}
        isReverifying={isReverifying}
      />
    </div>
  );
};
