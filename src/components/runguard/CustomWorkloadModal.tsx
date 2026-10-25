"use client";

import React, { useState } from "react";
import { 
  X, 
  Upload, 
  Save, 
  RotateCcw, 
  Trash2, 
  Check, 
  AlertCircle, 
  Cpu, 
  Layers, 
  FileCode,
  HardDrive
} from "lucide-react";
import { PreflightInputs, CustomWorkloadConfig } from "@/types/runguard";
import { VERIFIED_GPU_CATALOG } from "@/lib/constants";

interface CustomWorkloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyWorkload: (workload: PreflightInputs) => void;
  currentInputs: PreflightInputs;
}

const STORAGE_KEY = "varanasi_custom_workloads";

export const CustomWorkloadModal: React.FC<CustomWorkloadModalProps> = ({
  isOpen,
  onClose,
  onApplyWorkload,
  currentInputs,
}) => {
  const [activeTab, setActiveTab] = useState<"general" | "hardware" | "files" | "constraints">("general");
  const [fileError, setFileError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form State initialized from currentInputs
  const [formData, setFormData] = useState<PreflightInputs>({
    ...currentInputs,
  });

  const [modelName, setModelName] = useState<string>("nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B");
  const [pythonVersion, setPythonVersion] = useState<string>("3.11");
  const [frameworks, setFrameworks] = useState<string>("PyTorch 2.4.0, CUDA 12.4, vLLM 0.6.2");
  const [budgetConstraintUsd, setBudgetConstraintUsd] = useState<number>(5000);
  const [slaConstraintHours, setSlaConstraintHours] = useState<number>(48);

  // Saved Workloads state
  const [savedWorkloads, setSavedWorkloads] = useState<CustomWorkloadConfig[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: keyof PreflightInputs) => {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // File limit check (500KB)
    if (file.size > 500 * 1024) {
      setFileError(`File '${file.name}' exceeds maximum allowed size limit of 500 KB.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setFormData((prev) => ({ ...prev, [field]: content }));
      setSuccessMessage(`Uploaded '${file.name}' successfully (${(file.size / 1024).toFixed(1)} KB)`);
      setTimeout(() => setSuccessMessage(null), 3000);
    };
    reader.onerror = () => {
      setFileError(`Failed to read file '${file.name}'.`);
    };
    reader.readAsText(file);
  };

  const handleSaveToLibrary = () => {
    const newConfig: CustomWorkloadConfig = {
      id: `workload-${Date.now()}`,
      name: formData.projectName || "Custom Workload",
      targetGpu: formData.targetGpu,
      gpuCount: formData.gpuCount,
      modelName,
      estimatedModelParamsBillion: formData.estimatedModelParamsBillion,
      precision: formData.precision,
      contextLengthTokens: formData.contextLengthTokens,
      batchSize: formData.batchSize,
      pythonVersion,
      dockerfileContent: formData.dockerfileContent,
      requirementsContent: formData.requirementsContent,
      workloadConfigContent: formData.workloadConfigContent,
      diagnosticLogContent: formData.diagnosticLogContent,
      slaConstraintHours,
      budgetConstraintUsd,
      createdAt: new Date().toISOString(),
    };

    const updated = [newConfig, ...savedWorkloads.filter((w) => w.name !== newConfig.name)];
    setSavedWorkloads(updated);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // ignore storage errors
      }
    }
    setSuccessMessage(`Saved workload '${newConfig.name}' to local presets library.`);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleLoadSaved = (workload: CustomWorkloadConfig) => {
    setFormData({
      projectName: workload.name,
      targetGpu: workload.targetGpu,
      gpuCount: workload.gpuCount,
      estimatedModelParamsBillion: workload.estimatedModelParamsBillion,
      precision: workload.precision,
      contextLengthTokens: workload.contextLengthTokens,
      batchSize: workload.batchSize,
      dockerfileContent: workload.dockerfileContent,
      requirementsContent: workload.requirementsContent,
      workloadConfigContent: workload.workloadConfigContent,
      diagnosticLogContent: workload.diagnosticLogContent,
    });
    if (workload.modelName) setModelName(workload.modelName);
    if (workload.pythonVersion) setPythonVersion(workload.pythonVersion);
    if (workload.budgetConstraintUsd) setBudgetConstraintUsd(workload.budgetConstraintUsd);
    if (workload.slaConstraintHours) setSlaConstraintHours(workload.slaConstraintHours);
    setSuccessMessage(`Loaded custom workload preset '${workload.name}'.`);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleDeleteSaved = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedWorkloads.filter((w) => w.id !== id);
    setSavedWorkloads(updated);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
    }
  };

  const handleReset = () => {
    setFormData({
      projectName: "Custom-AI-Workload",
      targetGpu: "nebius-h100-sxm",
      gpuCount: 1,
      estimatedModelParamsBillion: 70,
      precision: "FP16",
      contextLengthTokens: 8192,
      batchSize: 8,
      dockerfileContent: "",
      requirementsContent: "",
      workloadConfigContent: "",
      diagnosticLogContent: "",
    });
    setSuccessMessage("Reset all custom fields to blank baseline.");
    setTimeout(() => setSuccessMessage(null), 2500);
  };

  const handleApply = () => {
    onApplyWorkload(formData);
    onClose();
  };

  const selectedGpu = VERIFIED_GPU_CATALOG.find((g) => g.id === formData.targetGpu) || VERIFIED_GPU_CATALOG[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-[14px] border border-border-standard bg-surface-card shadow-elevated overflow-hidden animate-scale-in"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border-subtle bg-surface-secondary px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-[8px] bg-nvidia-surface p-2 text-nvidia-dark border border-nvidia-green/30">
              <Cpu className="h-5 w-5 text-nvidia-green" />
            </div>
            <div>
              <h3 className="text-[18px] font-bold text-text-primary">
                Configure Custom AI Workload
              </h3>
              <p className="text-[12px] text-text-secondary">
                Author, upload, and validate custom cluster workloads for deterministic GPU RunGuard inspection
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
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Notifications */}
          {fileError && (
            <div className="rounded-[8px] border border-status-error/30 bg-[#FEE2E2] p-3 text-[13px] text-status-error flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{fileError}</span>
            </div>
          )}
          {successMessage && (
            <div className="rounded-[8px] border border-nvidia-green/40 bg-nvidia-surface p-3 text-[13px] text-nvidia-dark flex items-center gap-2">
              <Check className="h-4 w-4 shrink-0 text-nvidia-green" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Saved Presets Quick Bar (if any) */}
          {savedWorkloads.length > 0 && (
            <div className="rounded-[10px] border border-border-subtle bg-surface-secondary p-3 space-y-2">
              <div className="text-[11px] font-mono uppercase font-bold text-text-secondary flex items-center justify-between">
                <span>Saved Custom Presets ({savedWorkloads.length})</span>
                <span className="text-[10px] text-nvidia-dark font-semibold">Click to Load</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {savedWorkloads.map((w) => (
                  <div
                    key={w.id}
                    onClick={() => handleLoadSaved(w)}
                    className="flex items-center gap-1.5 rounded-[6px] border border-border-standard bg-white px-2.5 py-1 text-[12px] font-medium text-text-primary hover:border-nvidia-green hover:bg-nvidia-surface/30 cursor-pointer transition shadow-sm"
                  >
                    <span>{w.name}</span>
                    <span className="text-[10px] text-text-muted">({w.targetGpu})</span>
                    <button
                      onClick={(e) => handleDeleteSaved(w.id, e)}
                      className="ml-1 text-text-muted hover:text-status-error transition"
                      title="Delete preset"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Form Tabs */}
          <div className="flex border-b border-border-subtle space-x-2">
            <button
              onClick={() => setActiveTab("general")}
              className={`pb-2.5 px-3 text-[13px] font-semibold border-b-2 transition ${
                activeTab === "general"
                  ? "border-nvidia-green text-nvidia-dark"
                  : "border-transparent text-text-secondary hover:text-text-primary"
              }`}
            >
              1. Workload &amp; Model
            </button>
            <button
              onClick={() => setActiveTab("hardware")}
              className={`pb-2.5 px-3 text-[13px] font-semibold border-b-2 transition ${
                activeTab === "hardware"
                  ? "border-nvidia-green text-nvidia-dark"
                  : "border-transparent text-text-secondary hover:text-text-primary"
              }`}
            >
              2. GPU Architecture &amp; VRAM
            </button>
            <button
              onClick={() => setActiveTab("files")}
              className={`pb-2.5 px-3 text-[13px] font-semibold border-b-2 transition ${
                activeTab === "files"
                  ? "border-nvidia-green text-nvidia-dark"
                  : "border-transparent text-text-secondary hover:text-text-primary"
              }`}
            >
              3. Config &amp; Log Files
            </button>
            <button
              onClick={() => setActiveTab("constraints")}
              className={`pb-2.5 px-3 text-[13px] font-semibold border-b-2 transition ${
                activeTab === "constraints"
                  ? "border-nvidia-green text-nvidia-dark"
                  : "border-transparent text-text-secondary hover:text-text-primary"
              }`}
            >
              4. Constraints &amp; SLA
            </button>
          </div>

          {/* Tab 1: General & Model */}
          {activeTab === "general" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[13px]">
              <div>
                <label className="block text-[12px] font-semibold text-text-secondary mb-1">
                  Workload Name *
                </label>
                <input
                  type="text"
                  value={formData.projectName}
                  onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                  placeholder="e.g. Nemotron-FineTuning-Cluster-A"
                  className="w-full h-10 rounded-[6px] border border-border-standard bg-white px-3 text-[14px] text-text-primary focus:border-nvidia-green focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-text-secondary mb-1">
                  Model Identifier / Architecture
                </label>
                <input
                  type="text"
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  placeholder="e.g. nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B"
                  className="w-full h-10 rounded-[6px] border border-border-standard bg-white px-3 text-[14px] text-text-primary focus:border-nvidia-green focus:outline-none font-mono text-[13px]"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-text-secondary mb-1">
                  Model Parameter Count (Billions) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={formData.estimatedModelParamsBillion || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, estimatedModelParamsBillion: parseFloat(e.target.value) || 0 })
                  }
                  placeholder="e.g. 70"
                  className="w-full h-10 rounded-[6px] border border-border-standard bg-white px-3 text-[14px] text-text-primary focus:border-nvidia-green focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-text-secondary mb-1">
                  Inference Precision
                </label>
                <select
                  value={formData.precision || "FP16"}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      precision: e.target.value as "FP32" | "FP16" | "BF16" | "FP8" | "INT4",
                    })
                  }
                  className="w-full h-10 rounded-[6px] border border-border-standard bg-white px-3 text-[14px] text-text-primary focus:border-nvidia-green focus:outline-none"
                >
                  <option value="FP32">FP32 (Single Precision - 4 Bytes/param)</option>
                  <option value="FP16">FP16 (Half Precision - 2 Bytes/param)</option>
                  <option value="BF16">BF16 (Bfloat16 - 2 Bytes/param)</option>
                  <option value="FP8">FP8 (Hopper Native - 1 Byte/param)</option>
                  <option value="INT4">INT4 (Quantized - 0.5 Bytes/param)</option>
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-text-secondary mb-1">
                  Context Window Length (Tokens)
                </label>
                <input
                  type="number"
                  min="512"
                  step="512"
                  value={formData.contextLengthTokens || 8192}
                  onChange={(e) =>
                    setFormData({ ...formData, contextLengthTokens: parseInt(e.target.value, 10) || 8192 })
                  }
                  className="w-full h-10 rounded-[6px] border border-border-standard bg-white px-3 text-[14px] text-text-primary focus:border-nvidia-green focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-text-secondary mb-1">
                  Concurrency / Batch Size
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.batchSize || 8}
                  onChange={(e) =>
                    setFormData({ ...formData, batchSize: parseInt(e.target.value, 10) || 1 })
                  }
                  className="w-full h-10 rounded-[6px] border border-border-standard bg-white px-3 text-[14px] text-text-primary focus:border-nvidia-green focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Tab 2: Hardware & GPU */}
          {activeTab === "hardware" && (
            <div className="space-y-4 text-[13px]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold text-text-secondary mb-1">
                    Select Target GPU Architecture
                  </label>
                  <select
                    value={formData.targetGpu}
                    onChange={(e) => setFormData({ ...formData, targetGpu: e.target.value })}
                    className="w-full h-10 rounded-[6px] border border-border-standard bg-white px-3 text-[14px] text-text-primary focus:border-nvidia-green focus:outline-none"
                  >
                    {VERIFIED_GPU_CATALOG.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name} — {g.vramGb}GB VRAM ({g.provider})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-text-secondary mb-1">
                    Allocated GPU Count (Tensor / Pipeline Parallel)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="1024"
                    value={formData.gpuCount || 1}
                    onChange={(e) =>
                      setFormData({ ...formData, gpuCount: parseInt(e.target.value, 10) || 1 })
                    }
                    className="w-full h-10 rounded-[6px] border border-border-standard bg-white px-3 text-[14px] text-text-primary focus:border-nvidia-green focus:outline-none"
                  />
                </div>
              </div>

              {/* Hardware Summary Card */}
              <div className="rounded-[10px] border border-border-subtle bg-surface-secondary p-4 space-y-2">
                <div className="text-[12px] font-semibold text-text-primary flex items-center justify-between">
                  <span>Selected GPU Specifications:</span>
                  <span className="text-nvidia-dark font-mono font-bold">{selectedGpu.name}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                  <div className="bg-white p-2.5 rounded-[6px] border border-border-subtle">
                    <div className="text-[10px] text-text-muted uppercase">VRAM per GPU</div>
                    <div className="text-[16px] font-bold text-text-primary mt-0.5">{selectedGpu.vramGb} GiB</div>
                  </div>
                  <div className="bg-white p-2.5 rounded-[6px] border border-border-subtle">
                    <div className="text-[10px] text-text-muted uppercase">Total Cluster VRAM</div>
                    <div className="text-[16px] font-bold text-nvidia-dark mt-0.5">
                      {selectedGpu.vramGb * (formData.gpuCount || 1)} GiB
                    </div>
                  </div>
                  <div className="bg-white p-2.5 rounded-[6px] border border-border-subtle">
                    <div className="text-[10px] text-text-muted uppercase">Architecture</div>
                    <div className="text-[16px] font-bold text-text-primary mt-0.5">{selectedGpu.architecture}</div>
                  </div>
                  <div className="bg-white p-2.5 rounded-[6px] border border-border-subtle">
                    <div className="text-[10px] text-text-muted uppercase">Verified Rate</div>
                    <div className="text-[16px] font-bold text-text-primary mt-0.5">
                      {selectedGpu.onDemandHourlyRateUsd !== null ? `$${selectedGpu.onDemandHourlyRateUsd.toFixed(2)}/hr` : "Quote Required"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold text-text-secondary mb-1">
                    Target Python Runtime
                  </label>
                  <input
                    type="text"
                    value={pythonVersion}
                    onChange={(e) => setPythonVersion(e.target.value)}
                    placeholder="e.g. 3.11"
                    className="w-full h-10 rounded-[6px] border border-border-standard bg-white px-3 text-[14px] text-text-primary focus:border-nvidia-green focus:outline-none font-mono text-[13px]"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-text-secondary mb-1">
                    Frameworks &amp; Accelerated Libraries
                  </label>
                  <input
                    type="text"
                    value={frameworks}
                    onChange={(e) => setFrameworks(e.target.value)}
                    placeholder="PyTorch 2.4, CUDA 12.4, FlashAttention-2"
                    className="w-full h-10 rounded-[6px] border border-border-standard bg-white px-3 text-[14px] text-text-primary focus:border-nvidia-green focus:outline-none font-mono text-[13px]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Configuration & Log Files */}
          {activeTab === "files" && (
            <div className="space-y-4 text-[13px]">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[12px] font-semibold text-text-primary">
                    Cluster Workload Config (Kubernetes / Slurm / Docker Compose)
                  </label>
                  <label className="flex items-center gap-1 text-[11px] font-semibold text-nvidia-dark hover:underline cursor-pointer">
                    <Upload className="h-3 w-3" />
                    <span>Upload YAML / Config (&lt;500KB)</span>
                    <input
                      type="file"
                      className="hidden"
                      accept=".yaml,.yml,.json,.sh"
                      onChange={(e) => handleFileUpload(e, "workloadConfigContent")}
                    />
                  </label>
                </div>
                <textarea
                  rows={4}
                  value={formData.workloadConfigContent || ""}
                  onChange={(e) => setFormData({ ...formData, workloadConfigContent: e.target.value })}
                  placeholder="# Paste Kubernetes Pod spec, Slurm batch script, or compose file here..."
                  className="w-full rounded-[6px] border border-border-standard bg-white p-3 font-mono text-[12px] text-text-primary focus:border-nvidia-green focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[12px] font-semibold text-text-primary">
                    Diagnostic Crash Logs or Tracebacks
                  </label>
                  <label className="flex items-center gap-1 text-[11px] font-semibold text-nvidia-dark hover:underline cursor-pointer">
                    <Upload className="h-3 w-3" />
                    <span>Upload Log File (&lt;500KB)</span>
                    <input
                      type="file"
                      className="hidden"
                      accept=".log,.txt"
                      onChange={(e) => handleFileUpload(e, "diagnosticLogContent")}
                    />
                  </label>
                </div>
                <textarea
                  rows={4}
                  value={formData.diagnosticLogContent || ""}
                  onChange={(e) => setFormData({ ...formData, diagnosticLogContent: e.target.value })}
                  placeholder="# Paste runtime stack trace or error log (CUDA OOM, NCCL timeout, SIGBUS)..."
                  className="w-full rounded-[6px] border border-border-standard bg-white p-3 font-mono text-[12px] text-text-primary focus:border-nvidia-green focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[12px] font-semibold text-text-primary">
                      Dockerfile
                    </label>
                    <label className="flex items-center gap-1 text-[11px] font-semibold text-nvidia-dark hover:underline cursor-pointer">
                      <Upload className="h-3 w-3" />
                      <span>Upload Dockerfile</span>
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, "dockerfileContent")}
                      />
                    </label>
                  </div>
                  <textarea
                    rows={3}
                    value={formData.dockerfileContent || ""}
                    onChange={(e) => setFormData({ ...formData, dockerfileContent: e.target.value })}
                    placeholder="FROM nvidia/cuda:12.4.1-devel-ubuntu22.04..."
                    className="w-full rounded-[6px] border border-border-standard bg-white p-3 font-mono text-[12px] text-text-primary focus:border-nvidia-green focus:outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[12px] font-semibold text-text-primary">
                      requirements.txt
                    </label>
                    <label className="flex items-center gap-1 text-[11px] font-semibold text-nvidia-dark hover:underline cursor-pointer">
                      <Upload className="h-3 w-3" />
                      <span>Upload requirements.txt</span>
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, "requirementsContent")}
                      />
                    </label>
                  </div>
                  <textarea
                    rows={3}
                    value={formData.requirementsContent || ""}
                    onChange={(e) => setFormData({ ...formData, requirementsContent: e.target.value })}
                    placeholder="torch==2.4.0\nvllm>=0.6.0\nflash-attn..."
                    className="w-full rounded-[6px] border border-border-standard bg-white p-3 font-mono text-[12px] text-text-primary focus:border-nvidia-green focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Constraints & SLA */}
          {activeTab === "constraints" && (
            <div className="space-y-4 text-[13px]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold text-text-secondary mb-1">
                    Monthly Target Budget Limit ($ USD)
                  </label>
                  <input
                    type="number"
                    min="100"
                    step="100"
                    value={budgetConstraintUsd}
                    onChange={(e) => setBudgetConstraintUsd(parseFloat(e.target.value) || 0)}
                    className="w-full h-10 rounded-[6px] border border-border-standard bg-white px-3 text-[14px] text-text-primary focus:border-nvidia-green focus:outline-none"
                  />
                  <p className="text-[11px] text-text-muted mt-1">
                    FinOps engine will check if baseline and proposed configurations respect this ceiling.
                  </p>
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-text-secondary mb-1">
                    Target Workload SLA / Expected Wall-clock Runtime (Hours)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={slaConstraintHours}
                    onChange={(e) => setSlaConstraintHours(parseFloat(e.target.value) || 0)}
                    className="w-full h-10 rounded-[6px] border border-border-standard bg-white px-3 text-[14px] text-text-primary focus:border-nvidia-green focus:outline-none"
                  />
                  <p className="text-[11px] text-text-muted mt-1">
                    Workload runtime target for compute estimation and scheduling.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex flex-wrap items-center justify-between border-t border-border-subtle bg-surface-secondary px-6 py-4 gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveToLibrary}
              className="flex items-center gap-1.5 rounded-[6px] border border-border-standard bg-white px-3 py-2 text-[13px] font-semibold text-text-primary hover:bg-surface-secondary transition shadow-sm"
              title="Save as custom preset in local storage"
            >
              <Save className="h-4 w-4 text-nvidia-green" />
              <span>Save Preset</span>
            </button>
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 rounded-[6px] border border-border-standard bg-white px-3 py-2 text-[13px] font-semibold text-text-secondary hover:text-text-primary transition shadow-sm"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Reset</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="rounded-[6px] border border-border-standard bg-white px-4 py-2 text-[13px] font-semibold text-text-secondary hover:text-text-primary transition shadow-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="flex items-center gap-1.5 rounded-[6px] bg-nvidia-green px-4 py-2 text-[13px] font-semibold text-white hover:bg-nvidia-hover transition shadow-sm focus:outline-none focus:ring-2 focus:ring-nvidia-green"
            >
              <Check className="h-4 w-4" />
              <span>Apply Workload to RunGuard</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
