"use client";

import React, { useState } from "react";
import { 
  DollarSign, 
  ExternalLink, 
  RefreshCw, 
  ShieldCheck, 
  AlertCircle, 
  RotateCcw,
  Info
} from "lucide-react";
import { 
  GpuWorkloadInput, 
  ModelInferenceInput, 
  FinOpsComparisonResult
} from "@/types/finops";
import { VERIFIED_GPU_CATALOG } from "@/lib/constants";

interface FinOpsTabProps {
  baselineGpu: GpuWorkloadInput;
  setBaselineGpu: React.Dispatch<React.SetStateAction<GpuWorkloadInput>>;
  baselineModel: ModelInferenceInput;
  setBaselineModel: React.Dispatch<React.SetStateAction<ModelInferenceInput>>;
  proposedGpu: GpuWorkloadInput;
  setProposedGpu: React.Dispatch<React.SetStateAction<GpuWorkloadInput>>;
  proposedModel: ModelInferenceInput;
  setProposedModel: React.Dispatch<React.SetStateAction<ModelInferenceInput>>;
  comparisonResult: FinOpsComparisonResult | null;
  onCalculate: () => Promise<void>;
  isLoading: boolean;
}

export const FinOpsTab: React.FC<FinOpsTabProps> = ({
  baselineGpu,
  setBaselineGpu,
  baselineModel,
  setBaselineModel,
  proposedGpu,
  setProposedGpu,
  proposedModel,
  setProposedModel,
  comparisonResult,
  onCalculate,
  isLoading,
}) => {
  const [includeInferenceTokens, setIncludeInferenceTokens] = useState(true);

  const baselineCatalogGpu = VERIFIED_GPU_CATALOG.find((g) => g.id === baselineGpu.gpuId);
  const proposedCatalogGpu = VERIFIED_GPU_CATALOG.find((g) => g.id === proposedGpu.gpuId);

  // Helper to determine active display rate for a GPU input
  const getActiveRateDisplay = (input: GpuWorkloadInput, catalogGpu?: typeof baselineCatalogGpu) => {
    if (input.customHourlyRateUsd !== undefined && input.customHourlyRateUsd !== null && input.customHourlyRateUsd >= 0) {
      return {
        rate: input.customHourlyRateUsd,
        isCustom: true,
        isUnknown: false,
        label: `$${input.customHourlyRateUsd.toFixed(2)} (User Override)`,
      };
    }
    const model = input.pricingModel || "on-demand";
    const catalogRate = model === "preemptible" ? catalogGpu?.preemptibleHourlyRateUsd : catalogGpu?.onDemandHourlyRateUsd;
    if (catalogRate === null || catalogRate === undefined) {
      return {
        rate: 0,
        isCustom: false,
        isUnknown: true,
        label: "UNKNOWN (Requires Quote)",
      };
    }
    return {
      rate: catalogRate,
      isCustom: false,
      isUnknown: false,
      label: `$${catalogRate.toFixed(2)}/hr (${model.toUpperCase()})`,
    };
  };

  const baselineRateInfo = getActiveRateDisplay(baselineGpu, baselineCatalogGpu);
  const proposedRateInfo = getActiveRateDisplay(proposedGpu, proposedCatalogGpu);

  return (
    <div className="space-y-6">
      {/* FinOps Header */}
      <div className="rounded-2xl border border-border-standard bg-surface-card p-6 space-y-5 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-subtle pb-4">
          <div>
            <h2 className="text-base font-bold text-text-primary flex items-center gap-2.5">
              <DollarSign className="h-5 w-5 text-nvidia-green" />
              <span>FinOps Margin Engine — Audited Official Cloud Pricing</span>
            </h2>
            <p className="text-xs text-text-muted mt-1 leading-relaxed">
              Deterministic workload cost calculations (C_GPU &amp; C_API) audited against official Nebius AI Cloud pricing (
              <a
                href="https://nebius.com/prices"
                target="_blank"
                rel="noreferrer"
                className="text-nebius-cyan underline hover:text-nebius-soft"
              >
                https://nebius.com/prices
              </a>
              ). Supports On-Demand vs Preemptible pricing and GPU-hour vs Instance-hour units.
            </p>
          </div>

          <button
            onClick={onCalculate}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 rounded-xl bg-nvidia-green px-6 py-3 text-xs font-bold text-app hover:bg-nvidia-light disabled:opacity-50 transition shadow-nvidia-glow shrink-0"
          >
            {isLoading ? <RefreshCw className="h-4 w-4 animate-spin text-app" /> : <DollarSign className="h-4 w-4 text-app" />}
            <span>{isLoading ? "Calculating..." : "Calculate Cost Comparison"}</span>
          </button>
        </div>

        {/* Pricing Transparency & Verification Protocol Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-surface-input p-4 rounded-xl border border-border-subtle">
          <div className="flex items-start sm:items-center gap-2.5 text-text-secondary">
            <ShieldCheck className="h-4 w-4 text-nvidia-green shrink-0 mt-0.5 sm:mt-0" />
            <span>
              <strong className="text-text-primary">Official Audit Standards:</strong> Rates are grounded in authoritative published pricing pages with documented verification timestamps. Unconfirmed rates are marked <code>UNKNOWN</code> and require user overrides. Never claim cost savings based on unverified prices or unmeasured performance.
            </span>
          </div>
          <a
            href="https://nebius.com/prices"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-[11px] font-mono text-nebius-cyan hover:text-nebius-soft shrink-0 self-end sm:self-auto font-medium"
          >
            <span>nebius.com/prices</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* Comparison Input Panels: Baseline vs Proposed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Baseline (Current / Competitor) */}
        <div className="rounded-2xl border border-border-standard bg-surface-card p-6 space-y-5 shadow-card">
          <div className="flex items-center justify-between border-b border-border-subtle pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-text-primary">
              Baseline Configuration (Current / Reference)
            </span>
            <span className="text-[11px] font-mono text-text-muted">Reference Benchmark</span>
          </div>

          <div className="space-y-4 text-xs">
            {/* GPU Model Selection */}
            <div>
              <label className="block text-text-muted mb-1.5 font-medium">GPU Hardware Instance</label>
              <select
                value={baselineGpu.gpuId}
                onChange={(e) => {
                  setBaselineGpu({
                    ...baselineGpu,
                    gpuId: e.target.value,
                    customHourlyRateUsd: null,
                  });
                }}
                className="w-full rounded-lg border border-border-standard bg-surface-input px-3.5 py-2 text-text-primary focus:border-nebius-cyan focus:outline-none transition"
              >
                {VERIFIED_GPU_CATALOG.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} ({g.provider}) — {g.onDemandHourlyRateUsd !== null ? `$${g.onDemandHourlyRateUsd.toFixed(2)}/hr on-demand` : "Price UNKNOWN / Quote required"}
                  </option>
                ))}
              </select>
            </div>

            {/* Pricing Model & Unit Toggles */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-text-muted mb-1.5 font-medium">Pricing Tier</label>
                <div className="grid grid-cols-2 gap-1 rounded-lg bg-surface-input p-1 border border-border-subtle">
                  <button
                    type="button"
                    onClick={() => setBaselineGpu({ ...baselineGpu, pricingModel: "on-demand", customHourlyRateUsd: null })}
                    className={`py-1 text-[11px] font-semibold rounded-md transition ${
                      (baselineGpu.pricingModel || "on-demand") === "on-demand"
                        ? "bg-surface-elevated text-nebius-cyan border border-nebius-cyan/35 shadow-sm"
                        : "text-text-muted hover:text-text-primary"
                    }`}
                  >
                    On-Demand
                  </button>
                  <button
                    type="button"
                    onClick={() => setBaselineGpu({ ...baselineGpu, pricingModel: "preemptible", customHourlyRateUsd: null })}
                    className={`py-1 text-[11px] font-semibold rounded-md transition ${
                      baselineGpu.pricingModel === "preemptible"
                        ? "bg-surface-elevated text-status-warning border border-status-warning/40 shadow-sm"
                        : "text-text-muted hover:text-text-primary"
                    }`}
                  >
                    Preemptible
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-text-muted mb-1.5 font-medium">Billing Unit</label>
                <div className="grid grid-cols-2 gap-1 rounded-lg bg-surface-input p-1 border border-border-subtle">
                  <button
                    type="button"
                    onClick={() => setBaselineGpu({ ...baselineGpu, billingUnit: "GPU-hour" })}
                    className={`py-1 text-[11px] font-semibold rounded-md transition ${
                      (baselineGpu.billingUnit || "GPU-hour") === "GPU-hour"
                        ? "bg-surface-elevated text-nebius-cyan border border-nebius-cyan/35 shadow-sm"
                        : "text-text-muted hover:text-text-primary"
                    }`}
                  >
                    GPU-hour
                  </button>
                  <button
                    type="button"
                    onClick={() => setBaselineGpu({ ...baselineGpu, billingUnit: "instance-hour" })}
                    className={`py-1 text-[11px] font-semibold rounded-md transition ${
                      baselineGpu.billingUnit === "instance-hour"
                        ? "bg-surface-elevated text-nebius-cyan border border-nebius-cyan/35 shadow-sm"
                        : "text-text-muted hover:text-text-primary"
                    }`}
                  >
                    Instance-hour
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-text-muted mb-1.5 font-medium">Total GPU Count</label>
                <input
                  type="number"
                  min="1"
                  value={baselineGpu.gpuCount}
                  onChange={(e) =>
                    setBaselineGpu({ ...baselineGpu, gpuCount: parseInt(e.target.value, 10) || 1 })
                  }
                  className="w-full rounded-lg border border-border-standard bg-surface-input px-3.5 py-2 text-text-primary focus:border-nebius-cyan focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-text-muted mb-1.5 font-medium">Billed Runtime (Hours)</label>
                <input
                  type="number"
                  min="1"
                  value={baselineGpu.billedHours}
                  onChange={(e) =>
                    setBaselineGpu({ ...baselineGpu, billedHours: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full rounded-lg border border-border-standard bg-surface-input px-3.5 py-2 text-text-primary focus:border-nebius-cyan focus:outline-none transition"
                />
              </div>
            </div>

            {/* Rate & Override Input */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-text-muted font-medium">
                  Hourly Rate (USD / {baselineGpu.billingUnit || "GPU-hour"})
                </label>
                {baselineRateInfo.isCustom && (
                  <button
                    type="button"
                    onClick={() => setBaselineGpu({ ...baselineGpu, customHourlyRateUsd: null })}
                    className="flex items-center gap-1 text-[10px] text-nebius-cyan hover:text-nebius-soft"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Reset to Verified Default</span>
                  </button>
                )}
              </div>

              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={baselineGpu.customHourlyRateUsd ?? (baselineRateInfo.isUnknown ? "" : baselineRateInfo.rate)}
                  placeholder={baselineRateInfo.isUnknown ? "Enter user rate override (Required)" : "Authoritative rate"}
                  onChange={(e) => {
                    const val = e.target.value === "" ? null : parseFloat(e.target.value);
                    setBaselineGpu({ ...baselineGpu, customHourlyRateUsd: val });
                  }}
                  className={`w-full rounded-lg border px-3.5 py-2 text-text-primary focus:outline-none transition ${
                    baselineRateInfo.isUnknown && !baselineGpu.customHourlyRateUsd
                      ? "border-status-warning/70 bg-status-warning/10 placeholder-status-warning/60"
                      : baselineRateInfo.isCustom
                      ? "border-status-warning/50 bg-surface-input"
                      : "border-border-standard bg-surface-input focus:border-nebius-cyan"
                  }`}
                />
              </div>

              {/* Status Indicator */}
              <div className="mt-2 flex items-center justify-between text-[11px]">
                {baselineRateInfo.isUnknown && !baselineGpu.customHourlyRateUsd ? (
                  <span className="text-status-warning flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    Price UNKNOWN on official page. User override required.
                  </span>
                ) : baselineRateInfo.isCustom ? (
                  <span className="text-status-warning font-mono">
                    User-Supplied Override (Unverified)
                  </span>
                ) : (
                  <span className="text-nvidia-green flex items-center gap-1 font-mono">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Verified Official Rate ({baselineCatalogGpu?.lastVerifiedDate})
                  </span>
                )}
                {baselineCatalogGpu && (
                  <a
                    href={baselineCatalogGpu.priceSourceUrl.split(" ")[0]}
                    target="_blank"
                    rel="noreferrer"
                    className="text-text-muted hover:text-nebius-cyan truncate max-w-[160px]"
                  >
                    Source Link
                  </a>
                )}
              </div>
            </div>

            {includeInferenceTokens && (
              <div className="border-t border-border-subtle pt-3.5 space-y-3">
                <div className="text-[11px] font-bold uppercase text-text-muted">
                  Model Token Inference Volumes (1M Units)
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-text-muted mb-1 text-[11px]">Input Tokens (Millions)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={baselineModel.inputTokensMillion}
                      onChange={(e) =>
                        setBaselineModel({
                          ...baselineModel,
                          inputTokensMillion: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full rounded-lg border border-border-standard bg-surface-input px-3 py-1.5 text-text-primary focus:border-nebius-cyan focus:outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-text-muted mb-1 text-[11px]">Output Tokens (Millions)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={baselineModel.outputTokensMillion}
                      onChange={(e) =>
                        setBaselineModel({
                          ...baselineModel,
                          outputTokensMillion: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full rounded-lg border border-border-standard bg-surface-input px-3 py-1.5 text-text-primary focus:border-nebius-cyan focus:outline-none transition"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Proposed Alternative (Nebius / Candidate) */}
        <div className="rounded-2xl border border-nebius-cyan/40 bg-surface-card p-6 space-y-5 shadow-card hover:border-nebius-cyan transition">
          <div className="flex items-center justify-between border-b border-border-subtle pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-nebius-cyan">
              Proposed Alternative (Nebius AI Cloud Candidate)
            </span>
            <span className="text-[11px] font-mono text-nebius-cyan font-semibold">Optimized Candidate</span>
          </div>

          <div className="space-y-4 text-xs">
            {/* GPU Model Selection */}
            <div>
              <label className="block text-text-muted mb-1.5 font-medium">GPU Hardware Instance</label>
              <select
                value={proposedGpu.gpuId}
                onChange={(e) => {
                  setProposedGpu({
                    ...proposedGpu,
                    gpuId: e.target.value,
                    customHourlyRateUsd: null,
                  });
                }}
                className="w-full rounded-lg border border-nebius-cyan/40 bg-surface-input px-3.5 py-2 text-text-primary focus:border-nebius-cyan focus:outline-none transition"
              >
                {VERIFIED_GPU_CATALOG.filter((g) => g.provider === "Nebius").map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} — {g.onDemandHourlyRateUsd !== null ? `$${g.onDemandHourlyRateUsd.toFixed(2)}/hr on-demand` : "Price UNKNOWN / Quote required"}
                  </option>
                ))}
              </select>
            </div>

            {/* Pricing Model & Unit Toggles */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-text-muted mb-1.5 font-medium">Pricing Tier</label>
                <div className="grid grid-cols-2 gap-1 rounded-lg bg-surface-input p-1 border border-border-subtle">
                  <button
                    type="button"
                    onClick={() => setProposedGpu({ ...proposedGpu, pricingModel: "on-demand", customHourlyRateUsd: null })}
                    className={`py-1 text-[11px] font-semibold rounded-md transition ${
                      (proposedGpu.pricingModel || "on-demand") === "on-demand"
                        ? "bg-surface-elevated text-nebius-cyan border border-nebius-cyan/40 shadow-sm"
                        : "text-text-muted hover:text-text-primary"
                    }`}
                  >
                    On-Demand
                  </button>
                  <button
                    type="button"
                    onClick={() => setProposedGpu({ ...proposedGpu, pricingModel: "preemptible", customHourlyRateUsd: null })}
                    className={`py-1 text-[11px] font-semibold rounded-md transition ${
                      proposedGpu.pricingModel === "preemptible"
                        ? "bg-surface-elevated text-status-warning border border-status-warning/40 shadow-sm"
                        : "text-text-muted hover:text-text-primary"
                    }`}
                  >
                    Preemptible (Spot)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-text-muted mb-1.5 font-medium">Billing Unit</label>
                <div className="grid grid-cols-2 gap-1 rounded-lg bg-surface-input p-1 border border-border-subtle">
                  <button
                    type="button"
                    onClick={() => setProposedGpu({ ...proposedGpu, billingUnit: "GPU-hour" })}
                    className={`py-1 text-[11px] font-semibold rounded-md transition ${
                      (proposedGpu.billingUnit || "GPU-hour") === "GPU-hour"
                        ? "bg-surface-elevated text-nebius-cyan border border-nebius-cyan/40 shadow-sm"
                        : "text-text-muted hover:text-text-primary"
                    }`}
                  >
                    GPU-hour
                  </button>
                  <button
                    type="button"
                    onClick={() => setProposedGpu({ ...proposedGpu, billingUnit: "instance-hour" })}
                    className={`py-1 text-[11px] font-semibold rounded-md transition ${
                      proposedGpu.billingUnit === "instance-hour"
                        ? "bg-surface-elevated text-nebius-cyan border border-nebius-cyan/40 shadow-sm"
                        : "text-text-muted hover:text-text-primary"
                    }`}
                  >
                    Instance-hour
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-text-muted mb-1.5 font-medium">Total GPU Count</label>
                <input
                  type="number"
                  min="1"
                  value={proposedGpu.gpuCount}
                  onChange={(e) =>
                    setProposedGpu({ ...proposedGpu, gpuCount: parseInt(e.target.value, 10) || 1 })
                  }
                  className="w-full rounded-lg border border-nebius-cyan/40 bg-surface-input px-3.5 py-2 text-text-primary focus:border-nebius-cyan focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-text-muted mb-1.5 font-medium">Billed Runtime (Hours)</label>
                <input
                  type="number"
                  min="1"
                  value={proposedGpu.billedHours}
                  onChange={(e) =>
                    setProposedGpu({ ...proposedGpu, billedHours: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full rounded-lg border border-nebius-cyan/40 bg-surface-input px-3.5 py-2 text-text-primary focus:border-nebius-cyan focus:outline-none transition"
                />
              </div>
            </div>

            {/* Rate & Override Input */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-text-muted font-medium">
                  Hourly Rate (USD / {proposedGpu.billingUnit || "GPU-hour"})
                </label>
                {proposedRateInfo.isCustom && (
                  <button
                    type="button"
                    onClick={() => setProposedGpu({ ...proposedGpu, customHourlyRateUsd: null })}
                    className="flex items-center gap-1 text-[10px] text-nebius-cyan hover:text-nebius-soft"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Reset to Verified Default</span>
                  </button>
                )}
              </div>

              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={proposedGpu.customHourlyRateUsd ?? (proposedRateInfo.isUnknown ? "" : proposedRateInfo.rate)}
                  placeholder={proposedRateInfo.isUnknown ? "Enter user rate override (Required)" : "Authoritative rate"}
                  onChange={(e) => {
                    const val = e.target.value === "" ? null : parseFloat(e.target.value);
                    setProposedGpu({ ...proposedGpu, customHourlyRateUsd: val });
                  }}
                  className={`w-full rounded-lg border px-3.5 py-2 text-text-primary focus:outline-none transition ${
                    proposedRateInfo.isUnknown && !proposedGpu.customHourlyRateUsd
                      ? "border-status-warning/70 bg-status-warning/10 placeholder-status-warning/60"
                      : proposedRateInfo.isCustom
                      ? "border-status-warning/50 bg-surface-input"
                      : "border-nebius-cyan/40 bg-surface-input focus:border-nebius-cyan"
                  }`}
                />
              </div>

              {/* Status Indicator */}
              <div className="mt-2 flex items-center justify-between text-[11px]">
                {proposedRateInfo.isUnknown && !proposedGpu.customHourlyRateUsd ? (
                  <span className="text-status-warning flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    Price UNKNOWN on official page. User override required.
                  </span>
                ) : proposedRateInfo.isCustom ? (
                  <span className="text-status-warning font-mono">
                    User-Supplied Override (Unverified)
                  </span>
                ) : (
                  <span className="text-nvidia-green flex items-center gap-1 font-mono">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Verified Nebius Rate ({proposedCatalogGpu?.lastVerifiedDate})
                  </span>
                )}
                {proposedCatalogGpu && (
                  <a
                    href="https://nebius.com/prices"
                    target="_blank"
                    rel="noreferrer"
                    className="text-nebius-cyan hover:underline flex items-center gap-1"
                  >
                    <span>nebius.com/prices</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>

            {includeInferenceTokens && (
              <div className="border-t border-border-subtle pt-3.5 space-y-3">
                <div className="text-[11px] font-bold uppercase text-text-muted">
                  Model Token Inference Volumes (1M Units)
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-text-muted mb-1 text-[11px]">Input Tokens (Millions)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={proposedModel.inputTokensMillion}
                      onChange={(e) =>
                        setProposedModel({
                          ...proposedModel,
                          inputTokensMillion: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full rounded-lg border border-border-standard bg-surface-input px-3 py-1.5 text-text-primary focus:border-nebius-cyan focus:outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-text-muted mb-1 text-[11px]">Output Tokens (Millions)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={proposedModel.outputTokensMillion}
                      onChange={(e) =>
                        setProposedModel({
                          ...proposedModel,
                          outputTokensMillion: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full rounded-lg border border-border-standard bg-surface-input px-3 py-1.5 text-text-primary focus:border-nebius-cyan focus:outline-none transition"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Comparison Calculation Results */}
      {comparisonResult && (
        <div className="space-y-6">
          {/* Main Margin Delta Card */}
          <div className="rounded-2xl border border-border-standard bg-surface-card p-6 sm:p-8 space-y-5 shadow-card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-subtle pb-5">
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-text-primary">
                    Calculated Margin Delta &amp; Compute Spend
                  </h3>
                  {/* Strict Verification Badge */}
                  {comparisonResult.isSavingsVerified ? (
                    <span className="rounded-md bg-nvidia-surface border border-nvidia-border px-2.5 py-0.5 text-[10px] font-bold font-mono tracking-wider text-nvidia-green flex items-center gap-1.5">
                      <ShieldCheck className="h-3 w-3" />
                      VERIFIED PUBLISHED RATES
                    </span>
                  ) : (
                    <span className="rounded-md bg-status-warning/15 border border-status-warning/40 px-2.5 py-0.5 text-[10px] font-bold font-mono tracking-wider text-status-warning flex items-center gap-1.5">
                      <AlertCircle className="h-3 w-3" />
                      UNVERIFIED / USER ESTIMATE
                    </span>
                  )}
                </div>
                <p className="text-xs text-text-muted mt-1">
                  Formula: &Delta;C = Baseline Spend &minus; Alternative Spend
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-[10px] uppercase font-mono text-text-muted">Calculated Difference</div>
                  <div
                    className={`text-2xl font-black font-mono ${
                      comparisonResult.deltaCostUsd >= 0 ? "text-nvidia-green" : "text-status-error"
                    }`}
                  >
                    {comparisonResult.deltaCostUsd >= 0 ? "+" : ""}${comparisonResult.deltaCostUsd.toFixed(2)} USD
                  </div>
                </div>
                <div
                  className={`rounded-xl px-4 py-2.5 text-sm font-bold font-mono ${
                    comparisonResult.percentageDifference >= 0
                      ? "bg-nvidia-surface border border-nvidia-border text-nvidia-green"
                      : "bg-status-error/15 border border-status-error/40 text-status-error"
                  }`}
                >
                  {comparisonResult.percentageDifference >= 0
                    ? `-${comparisonResult.percentageDifference.toFixed(1)}% Spend`
                    : `+${Math.abs(comparisonResult.percentageDifference).toFixed(1)}% Spend`}
                </div>
              </div>
            </div>

            {/* Metrics Breakdown Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
              <div className="rounded-xl border border-border-subtle bg-surface-input p-4">
                <div className="text-[10px] text-text-muted uppercase">Baseline Total Cost</div>
                <div className="text-base font-bold text-text-primary mt-1">
                  ${comparisonResult.baseline.totalCostUsd.toFixed(2)}
                </div>
                <div className="text-[10px] text-text-muted mt-1">
                  Rate: ${comparisonResult.baseline.breakdown.effectiveHourlyRateUsd.toFixed(2)}/{comparisonResult.baseline.billingUnit}
                </div>
              </div>

              <div className="rounded-xl border border-border-subtle bg-surface-input p-4">
                <div className="text-[10px] text-text-muted uppercase">Proposed Total Cost</div>
                <div className="text-base font-bold text-nebius-cyan mt-1">
                  ${comparisonResult.proposed.totalCostUsd.toFixed(2)}
                </div>
                <div className="text-[10px] text-text-muted mt-1">
                  Rate: ${comparisonResult.proposed.breakdown.effectiveHourlyRateUsd.toFixed(2)}/{comparisonResult.proposed.billingUnit}
                </div>
              </div>

              <div className="rounded-xl border border-border-subtle bg-surface-input p-4">
                <div className="text-[10px] text-text-muted uppercase">Savings Classification</div>
                <div
                  className={`text-xs font-bold mt-1 font-sans ${
                    comparisonResult.isSavingsVerified ? "text-nvidia-green" : "text-status-warning"
                  }`}
                >
                  {comparisonResult.savingsClassification.replace("_", " ")}
                </div>
                <div className="text-[10px] text-text-muted mt-1">
                  {comparisonResult.isSavingsVerified ? "Grounded in published pricing" : "Includes unverified inputs"}
                </div>
              </div>

              <div className="rounded-xl border border-border-subtle bg-surface-input p-4">
                <div className="text-[10px] text-text-muted uppercase">Price Sources Audited</div>
                <div className="text-xs font-bold text-text-primary mt-1 font-sans">
                  {comparisonResult.baseline.priceSources.length + comparisonResult.proposed.priceSources.length} Source(s)
                </div>
                <div className="text-[10px] text-text-muted mt-1">
                  Verified Feb 2026
                </div>
              </div>
            </div>
          </div>

          {/* Transparent Source Attribution Table */}
          <div className="rounded-2xl border border-border-standard bg-surface-card overflow-hidden shadow-card">
            <div className="px-6 py-4 border-b border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-surface-elevated/40">
              <h4 className="text-xs font-bold uppercase tracking-wider text-text-primary">
                Authoritative Pricing Sources &amp; Audit Trail
              </h4>
              <span className="text-[11px] text-text-muted">
                Every rate verified against published cloud documentation
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-elevated text-[11px] uppercase tracking-wider text-text-muted border-b border-border-subtle">
                  <tr>
                    <th className="py-3 px-5">Item &amp; Tier</th>
                    <th className="py-3 px-5">Rate &amp; Unit</th>
                    <th className="py-3 px-5">Verification Status</th>
                    <th className="py-3 px-5">Official Source Reference</th>
                    <th className="py-3 px-5">Last Verified</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle font-sans">
                  {[...comparisonResult.baseline.priceSources, ...comparisonResult.proposed.priceSources].map(
                    (ps, idx) => (
                      <tr key={idx} className="hover:bg-surface-elevated/50 transition">
                        <td className="py-3.5 px-5 font-semibold text-text-primary">
                          {ps.label}
                        </td>
                        <td className="py-3.5 px-5 font-mono text-text-secondary">
                          {ps.rate !== null ? `$${ps.rate.toFixed(2)} / ${ps.unit}` : "UNKNOWN / Quote Required"}
                        </td>
                        <td className="py-3.5 px-5">
                          {ps.isVerified ? (
                            <span className="inline-flex items-center gap-1 font-mono text-[10px] text-nvidia-green font-semibold bg-nvidia-surface px-2.5 py-0.5 rounded-md border border-nvidia-border">
                              <ShieldCheck className="h-3 w-3" />
                              VERIFIED
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 font-mono text-[10px] text-status-warning font-semibold bg-status-warning/15 px-2.5 py-0.5 rounded-md border border-status-warning/40">
                              <AlertCircle className="h-3 w-3" />
                              {ps.priceStatus}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-5 text-nebius-cyan font-mono text-[11px] truncate max-w-xs">
                          {ps.sourceUrl.startsWith("http") ? (
                            <a
                              href={ps.sourceUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="hover:underline flex items-center gap-1"
                            >
                              <span className="truncate">{ps.sourceUrl}</span>
                              <ExternalLink className="h-3 w-3 shrink-0" />
                            </a>
                          ) : (
                            <span className="text-text-muted">{ps.sourceUrl}</span>
                          )}
                        </td>
                        <td className="py-3.5 px-5 text-text-muted font-mono text-[11px]">
                          {ps.lastVerifiedDate}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Waste Detections */}
          {comparisonResult.wasteDetections.length > 0 && (
            <div className="rounded-2xl border border-status-error/35 bg-surface-card p-6 space-y-4 shadow-card">
              <h4 className="text-xs font-bold uppercase tracking-wider text-status-error flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-status-error" />
                <span>Detected Compute Inefficiencies &amp; Waste Patterns</span>
              </h4>

              <div className="space-y-3">
                {comparisonResult.wasteDetections.map((w, idx) => (
                  <div key={idx} className="rounded-xl border border-border-subtle bg-surface-input p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-status-error">{w.category}</span>
                      <span className="font-mono text-xs text-status-error font-semibold">
                        Potential Waste: ~${w.potentialWasteUsd.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed">{w.description}</p>
                    <div className="text-xs text-text-primary font-sans bg-nvidia-surface/60 border border-nvidia-border p-2.5 rounded-lg">
                      <strong className="text-nvidia-green mr-1">Optimization:</strong> {w.recommendation}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Feasibility Trade-Offs & Missing Evidence Warnings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            <div className="rounded-2xl border border-border-standard bg-surface-card p-5 space-y-2.5 shadow-card">
              <h4 className="font-bold uppercase tracking-wider text-status-warning text-[11px] flex items-center gap-2">
                <Info className="h-3.5 w-3.5 text-status-warning" />
                <span>Feasibility &amp; Hardware Trade-Offs</span>
              </h4>
              <ul className="space-y-2 text-text-secondary leading-relaxed">
                {comparisonResult.feasibilityTradeoffs.map((t, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-status-warning font-bold">•</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-border-standard bg-surface-card p-5 space-y-2.5 shadow-card">
              <h4 className="font-bold uppercase tracking-wider text-text-muted text-[11px] flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-nebius-cyan" />
                <span>Missing Evidence &amp; Performance Disclaimers</span>
              </h4>
              <ul className="space-y-2 text-text-muted leading-relaxed">
                {comparisonResult.missingEvidenceWarnings.map((m, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-nebius-cyan font-bold">•</span>
                    <span>{m}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
