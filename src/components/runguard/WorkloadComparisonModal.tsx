"use client";

import React, { useState } from "react";
import { X, ArrowRight, DollarSign, Cpu, Check, AlertTriangle, Layers, Info } from "lucide-react";
import { PreflightInputs } from "@/types/runguard";
import { VERIFIED_GPU_CATALOG } from "@/lib/constants";
import { calculateFinOpsCost, compareFinOpsConfigurations } from "@/lib/finops/calculator";
import { GpuWorkloadInput, ModelInferenceInput } from "@/types/finops";

interface WorkloadComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentInputs: PreflightInputs;
}

export const WorkloadComparisonModal: React.FC<WorkloadComparisonModalProps> = ({
  isOpen,
  onClose,
  currentInputs,
}) => {
  // Proposed Alternative State
  const [altGpuId, setAltGpuId] = useState<string>("nebius-h100-sxm");
  const [altGpuCount, setAltGpuCount] = useState<number>(currentInputs.gpuCount > 1 ? Math.max(1, Math.floor(currentInputs.gpuCount / 2)) : 1);
  const [altPrecision, setAltPrecision] = useState<"FP32" | "FP16" | "BF16" | "FP8" | "INT4">("FP8");
  const [billedHours, setBilledHours] = useState<number>(720);
  const [altHours, setAltHours] = useState<number>(720);
  const [pricingModel, setPricingModel] = useState<"on-demand" | "preemptible">("on-demand");

  if (!isOpen) return null;

  // Baseline Calculation using current inputs
  const baselineInput: GpuWorkloadInput = {
    gpuId: currentInputs.targetGpu || "aws-p5-h100",
    gpuCount: currentInputs.gpuCount || 1,
    billedHours,
    pricingModel: "on-demand",
    billingUnit: "GPU-hour",
  };

  const baselineCost = calculateFinOpsCost(baselineInput);

  // Proposed Calculation
  const proposedInput: GpuWorkloadInput = {
    gpuId: altGpuId,
    gpuCount: altGpuCount,
    billedHours: altHours,
    pricingModel,
    billingUnit: "GPU-hour",
  };

  const proposedCost = calculateFinOpsCost(proposedInput);

  const comparison = compareFinOpsConfigurations(baselineCost, proposedCost, {
    baselineGpuId: baselineInput.gpuId,
    proposedGpuId: proposedInput.gpuId,
    modelParamBillion: currentInputs.estimatedModelParamsBillion,
  });

  const baseGpuObj = VERIFIED_GPU_CATALOG.find((g) => g.id === baselineInput.gpuId) || VERIFIED_GPU_CATALOG[0];
  const propGpuObj = VERIFIED_GPU_CATALOG.find((g) => g.id === proposedInput.gpuId) || VERIFIED_GPU_CATALOG[1];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-[14px] border border-border-standard bg-surface-card shadow-elevated overflow-hidden animate-scale-in"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-subtle bg-surface-secondary px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-[8px] bg-nvidia-surface p-2 text-nvidia-dark border border-nvidia-green/30">
              <DollarSign className="h-5 w-5 text-nvidia-green" />
            </div>
            <div>
              <h3 className="text-[18px] font-bold text-text-primary">
                Custom GPU &amp; Workload Alternative Comparison
              </h3>
              <p className="text-[12px] text-text-secondary">
                Deterministic cost &amp; feasibility comparison powered by audited Nebius and cloud pricing rates
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

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-[13px]">
          {/* Comparison Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Left: Current Baseline */}
            <div className="rounded-[12px] border border-border-standard bg-white p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                <div className="font-bold text-[15px] text-text-primary flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-text-muted"></span>
                  <span>Current Baseline Setup</span>
                </div>
                <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-surface-secondary text-text-secondary border border-border-subtle">
                  Reference Workload
                </span>
              </div>

              <div className="space-y-2.5">
                <div>
                  <span className="text-[11px] text-text-muted uppercase font-semibold">GPU Instance</span>
                  <div className="font-semibold text-text-primary mt-0.5">{baseGpuObj.name}</div>
                  <div className="text-[11px] font-mono text-text-muted">
                    {baseGpuObj.vramGb} GB VRAM ({baseGpuObj.provider}) — {baseGpuObj.onDemandHourlyRateUsd !== null ? `$${baseGpuObj.onDemandHourlyRateUsd.toFixed(2)}/GPU-hr` : "Quote Required"}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="bg-surface-secondary p-2.5 rounded-[6px]">
                    <span className="text-text-muted text-[10px] uppercase">GPU Count</span>
                    <div className="font-bold text-text-primary text-[14px] mt-0.5">{baselineInput.gpuCount}x GPUs</div>
                  </div>
                  <div className="bg-surface-secondary p-2.5 rounded-[6px]">
                    <span className="text-text-muted text-[10px] uppercase">Precision</span>
                    <div className="font-bold text-text-primary text-[14px] mt-0.5">{currentInputs.precision || "FP16"}</div>
                  </div>
                  <div className="bg-surface-secondary p-2.5 rounded-[6px]">
                    <span className="text-text-muted text-[10px] uppercase">Expected Hours</span>
                    <div className="font-bold text-text-primary text-[14px] mt-0.5">{billedHours} hrs</div>
                  </div>
                  <div className="bg-surface-secondary p-2.5 rounded-[6px]">
                    <span className="text-text-muted text-[10px] uppercase">Total VRAM</span>
                    <div className="font-bold text-text-primary text-[14px] mt-0.5">{baseGpuObj.vramGb * baselineInput.gpuCount} GiB</div>
                  </div>
                </div>

                <div className="pt-2 border-t border-border-subtle flex justify-between items-baseline">
                  <span className="text-[12px] font-semibold text-text-secondary">Estimated Compute Cost:</span>
                  <span className="font-mono text-[20px] font-bold text-text-primary">
                    ${baselineCost.totalCostUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Proposed Alternative */}
            <div className="rounded-[12px] border border-nvidia-green/40 bg-nvidia-surface/20 p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-border-subtle pb-3">
                <div className="font-bold text-[15px] text-nvidia-dark flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-nvidia-green"></span>
                  <span>Proposed Alternative Architecture</span>
                </div>
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-nvidia-surface text-nvidia-dark border border-nvidia-green/30">
                  Target Proposal
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-text-secondary uppercase mb-1">
                    Select Target GPU
                  </label>
                  <select
                    value={altGpuId}
                    onChange={(e) => setAltGpuId(e.target.value)}
                    className="w-full h-9 rounded-[6px] border border-border-standard bg-white px-2.5 text-[13px] text-text-primary focus:border-nvidia-green focus:outline-none"
                  >
                    {VERIFIED_GPU_CATALOG.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name} — {g.onDemandHourlyRateUsd !== null ? `$${g.onDemandHourlyRateUsd.toFixed(2)}/hr` : "Quote Required"} ({g.provider})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-text-secondary uppercase mb-1">
                      GPU Count
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="128"
                      value={altGpuCount}
                      onChange={(e) => setAltGpuCount(parseInt(e.target.value, 10) || 1)}
                      className="w-full h-9 rounded-[6px] border border-border-standard bg-white px-2.5 text-[13px] text-text-primary focus:border-nvidia-green focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-text-secondary uppercase mb-1">
                      Pricing Tier
                    </label>
                    <select
                      value={pricingModel}
                      onChange={(e) => setPricingModel(e.target.value as "on-demand" | "preemptible")}
                      className="w-full h-9 rounded-[6px] border border-border-standard bg-white px-2.5 text-[13px] text-text-primary focus:border-nvidia-green focus:outline-none"
                    >
                      <option value="on-demand">On-Demand</option>
                      <option value="preemptible">Preemptible / Spot</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2 border-t border-border-subtle flex justify-between items-baseline">
                  <span className="text-[12px] font-semibold text-text-secondary">Proposed Compute Cost:</span>
                  <span className="font-mono text-[20px] font-bold text-nvidia-dark">
                    ${proposedCost.totalCostUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Delta Savings & Feasibility Callout */}
          <div className="rounded-[10px] border border-border-standard bg-white p-4 space-y-2 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-[14px] font-bold text-text-primary">
                Net Delta Projection (&Delta;C):
              </span>
              <span className={`font-mono text-[18px] font-bold ${comparison.deltaCostUsd >= 0 ? "text-nvidia-dark" : "text-status-error"}`}>
                {comparison.deltaCostUsd >= 0 ? "+" : ""}${comparison.deltaCostUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                {" "}({comparison.percentageDifference >= 0 ? `-${comparison.percentageDifference.toFixed(1)}%` : `+${Math.abs(comparison.percentageDifference).toFixed(1)}%`})
              </span>
            </div>
            <div className="text-[12px] text-text-secondary flex items-start gap-2 pt-1 border-t border-border-subtle">
              <Info className="h-4 w-4 text-nvidia-green shrink-0 mt-0.5" />
              <span>
                <strong>Methodology Disclaimer:</strong> Delta projections apply official published GPU rates verified from <a href="https://nebius.com/prices" target="_blank" rel="noreferrer" className="text-nvidia-dark underline">nebius.com/prices</a>. Estimated compute savings assume workload throughput parity. Does not promise or guarantee realized operational savings.
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-border-subtle bg-surface-secondary px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-[6px] bg-nvidia-green px-4 py-2 text-[13px] font-semibold text-white hover:bg-nvidia-hover transition shadow-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
