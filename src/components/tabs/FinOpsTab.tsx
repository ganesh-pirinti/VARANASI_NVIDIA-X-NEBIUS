"use client";

import React, { useState } from "react";
import { 
  DollarSign, 
  ExternalLink, 
  RefreshCw, 
  ShieldCheck, 
  AlertCircle, 
  RotateCcw,
  Info,
  Clock,
  Layers,
  HelpCircle,
  TrendingDown
} from "lucide-react";
import { 
  GpuWorkloadInput, 
  ModelInferenceInput, 
  FinOpsComparisonResult, 
  PricingModel,
  BillingUnit
} from "@/types/finops";
import { VERIFIED_GPU_CATALOG, MODEL_TOKEN_RATES } from "@/lib/constants";

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
      <div className="rounded-xl border border-navy-800 bg-navy-900/80 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-navy-800 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-emerald-400" />
              <span>FinOps Margin Engine — Audited Official Cloud Pricing</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Deterministic workload cost calculations (C_GPU &amp; C_API) audited against official Nebius AI Cloud pricing (
              <a
                href="https://nebius.com/prices"
                target="_blank"
                rel="noreferrer"
                className="text-cyan-400 underline hover:text-cyan-300"
              >
                https://nebius.com/prices
              </a>
              ). Supports On-Demand vs Preemptible pricing and GPU-hour vs Instance-hour units.
            </p>
          </div>

          <button
            onClick={onCalculate}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-5 py-2.5 text-xs font-bold text-navy-950 hover:bg-emerald-400 disabled:opacity-50 transition shadow-lg shadow-emerald-500/20 shrink-0"
          >
            {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <DollarSign className="h-4 w-4" />}
            <span>{isLoading ? "Calculating..." : "Calculate Cost Comparison"}</span>
          </button>
        </div>

        {/* Pricing Transparency & Verification Protocol Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-navy-950 p-3.5 rounded-lg border border-navy-750">
          <div className="flex items-start sm:items-center gap-2.5 text-slate-300">
            <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5 sm:mt-0" />
            <span>
              <strong>Official Audit Standards:</strong> Rates are grounded in authoritative published pricing pages with documented verification timestamps. Unconfirmed rates are marked <code>UNKNOWN</code> and require user overrides. Never claim cost savings based on unverified prices or unmeasured performance.
            </span>
          </div>
          <a
            href="https://nebius.com/prices"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-[11px] font-mono text-cyan-400 hover:text-cyan-300 shrink-0 self-end sm:self-auto"
          >
            <span>nebius.com/prices</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* Comparison Input Panels: Baseline vs Proposed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Baseline (Current / Competitor) */}
        <div className="rounded-xl border border-navy-800 bg-navy-900/80 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-navy-850 pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Baseline Configuration (Current / Reference)
            </span>
            <span className="text-[11px] font-mono text-slate-400">Reference Benchmark</span>
          </div>

          <div className="space-y-4 text-xs">
            {/* GPU Model Selection */}
            <div>
              <label className="block text-slate-400 mb-1 font-medium">GPU Hardware Instance</label>
              <select
                value={baselineGpu.gpuId}
                onChange={(e) => {
                  setBaselineGpu({
                    ...baselineGpu,
                    gpuId: e.target.value,
                    customHourlyRateUsd: null, // Clear override to adopt new catalog rate
                  });
                }}
                className="w-full rounded border border-navy-750 bg-navy-950 px-3 py-1.5 text-slate-200 focus:border-cyan-500 focus:outline-none"
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
                <label className="block text-slate-400 mb-1 font-medium">Pricing Tier</label>
                <div className="grid grid-cols-2 gap-1 rounded bg-navy-950 p-1 border border-navy-750">
                  <button
                    type="button"
                    onClick={() => setBaselineGpu({ ...baselineGpu, pricingModel: "on-demand", customHourlyRateUsd: null })}
                    className={`py-1 text-[11px] font-semibold rounded transition ${
                      (baselineGpu.pricingModel || "on-demand") === "on-demand"
                        ? "bg-navy-800 text-cyan-300 border border-navy-700"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    On-Demand
                  </button>
                  <button
                    type="button"
                    onClick={() => setBaselineGpu({ ...baselineGpu, pricingModel: "preemptible", customHourlyRateUsd: null })}
                    className={`py-1 text-[11px] font-semibold rounded transition ${
                      baselineGpu.pricingModel === "preemptible"
                        ? "bg-navy-800 text-amber-300 border border-navy-700"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Preemptible
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Billing Unit</label>
                <div className="grid grid-cols-2 gap-1 rounded bg-navy-950 p-1 border border-navy-750">
                  <button
                    type="button"
                    onClick={() => setBaselineGpu({ ...baselineGpu, billingUnit: "GPU-hour" })}
                    className={`py-1 text-[11px] font-semibold rounded transition ${
                      (baselineGpu.billingUnit || "GPU-hour") === "GPU-hour"
                        ? "bg-navy-800 text-cyan-300 border border-navy-700"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    GPU-hour
                  </button>
                  <button
                    type="button"
                    onClick={() => setBaselineGpu({ ...baselineGpu, billingUnit: "instance-hour" })}
                    className={`py-1 text-[11px] font-semibold rounded transition ${
                      baselineGpu.billingUnit === "instance-hour"
                        ? "bg-navy-800 text-cyan-300 border border-navy-700"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Instance-hour
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Total GPU Count</label>
                <input
                  type="number"
                  min="1"
                  value={baselineGpu.gpuCount}
                  onChange={(e) =>
                    setBaselineGpu({ ...baselineGpu, gpuCount: parseInt(e.target.value, 10) || 1 })
                  }
                  className="w-full rounded border border-navy-750 bg-navy-950 px-3 py-1.5 text-slate-200 focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Billed Runtime (Hours)</label>
                <input
                  type="number"
                  min="1"
                  value={baselineGpu.billedHours}
                  onChange={(e) =>
                    setBaselineGpu({ ...baselineGpu, billedHours: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full rounded border border-navy-750 bg-navy-950 px-3 py-1.5 text-slate-200 focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Rate & Override Input */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-slate-400 font-medium">
                  Hourly Rate (USD / {baselineGpu.billingUnit || "GPU-hour"})
                </label>
                {baselineRateInfo.isCustom && (
                  <button
                    type="button"
                    onClick={() => setBaselineGpu({ ...baselineGpu, customHourlyRateUsd: null })}
                    className="flex items-center gap-1 text-[10px] text-cyan-400 hover:text-cyan-300"
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
                  className={`w-full rounded border px-3 py-1.5 text-slate-200 focus:outline-none ${
                    baselineRateInfo.isUnknown && !baselineGpu.customHourlyRateUsd
                      ? "border-amber-500/70 bg-amber-950/20 placeholder-amber-400/60"
                      : baselineRateInfo.isCustom
                      ? "border-amber-500/50 bg-navy-950"
                      : "border-navy-750 bg-navy-950 focus:border-cyan-500"
                  }`}
                />
              </div>

              {/* Status Indicator */}
              <div className="mt-1.5 flex items-center justify-between text-[11px]">
                {baselineRateInfo.isUnknown && !baselineGpu.customHourlyRateUsd ? (
                  <span className="text-amber-400 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Price UNKNOWN on official page. User override required.
                  </span>
                ) : baselineRateInfo.isCustom ? (
                  <span className="text-amber-300 font-mono">
                    User-Supplied Override (Unverified)
                  </span>
                ) : (
                  <span className="text-emerald-400 flex items-center gap-1 font-mono">
                    <ShieldCheck className="h-3 w-3" />
                    Verified Official Rate ({baselineCatalogGpu?.lastVerifiedDate})
                  </span>
                )}
                {baselineCatalogGpu && (
                  <a
                    href={baselineCatalogGpu.priceSourceUrl.split(" ")[0]}
                    target="_blank"
                    rel="noreferrer"
                    className="text-slate-500 hover:text-cyan-400 truncate max-w-[160px]"
                  >
                    Source Link
                  </a>
                )}
              </div>
            </div>

            {includeInferenceTokens && (
              <div className="border-t border-navy-850 pt-3 space-y-3">
                <div className="text-[11px] font-bold uppercase text-slate-400">
                  Model Token Inference Volumes (1M Units)
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 mb-1 text-[11px]">Input Tokens (Millions)</label>
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
                      className="w-full rounded border border-navy-750 bg-navy-950 px-3 py-1.5 text-slate-200 focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1 text-[11px]">Output Tokens (Millions)</label>
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
                      className="w-full rounded border border-navy-750 bg-navy-950 px-3 py-1.5 text-slate-200 focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Proposed Alternative (Nebius / Candidate) */}
        <div className="rounded-xl border border-cyan-500/30 bg-navy-900/80 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-navy-850 pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-300">
              Proposed Alternative (Nebius AI Cloud Candidate)
            </span>
            <span className="text-[11px] font-mono text-cyan-400 font-semibold">Optimized Candidate</span>
          </div>

          <div className="space-y-4 text-xs">
            {/* GPU Model Selection */}
            <div>
              <label className="block text-slate-400 mb-1 font-medium">GPU Hardware Instance</label>
              <select
                value={proposedGpu.gpuId}
                onChange={(e) => {
                  setProposedGpu({
                    ...proposedGpu,
                    gpuId: e.target.value,
                    customHourlyRateUsd: null, // Clear override
                  });
                }}
                className="w-full rounded border border-cyan-500/40 bg-navy-950 px-3 py-1.5 text-slate-200 focus:border-cyan-400 focus:outline-none"
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
                <label className="block text-slate-400 mb-1 font-medium">Pricing Tier</label>
                <div className="grid grid-cols-2 gap-1 rounded bg-navy-950 p-1 border border-navy-750">
                  <button
                    type="button"
                    onClick={() => setProposedGpu({ ...proposedGpu, pricingModel: "on-demand", customHourlyRateUsd: null })}
                    className={`py-1 text-[11px] font-semibold rounded transition ${
                      (proposedGpu.pricingModel || "on-demand") === "on-demand"
                        ? "bg-navy-800 text-cyan-300 border border-cyan-500/40"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    On-Demand
                  </button>
                  <button
                    type="button"
                    onClick={() => setProposedGpu({ ...proposedGpu, pricingModel: "preemptible", customHourlyRateUsd: null })}
                    className={`py-1 text-[11px] font-semibold rounded transition ${
                      proposedGpu.pricingModel === "preemptible"
                        ? "bg-navy-800 text-amber-300 border border-amber-500/40"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Preemptible (Spot)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Billing Unit</label>
                <div className="grid grid-cols-2 gap-1 rounded bg-navy-950 p-1 border border-navy-750">
                  <button
                    type="button"
                    onClick={() => setProposedGpu({ ...proposedGpu, billingUnit: "GPU-hour" })}
                    className={`py-1 text-[11px] font-semibold rounded transition ${
                      (proposedGpu.billingUnit || "GPU-hour") === "GPU-hour"
                        ? "bg-navy-800 text-cyan-300 border border-cyan-500/40"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    GPU-hour
                  </button>
                  <button
                    type="button"
                    onClick={() => setProposedGpu({ ...proposedGpu, billingUnit: "instance-hour" })}
                    className={`py-1 text-[11px] font-semibold rounded transition ${
                      proposedGpu.billingUnit === "instance-hour"
                        ? "bg-navy-800 text-cyan-300 border border-cyan-500/40"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Instance-hour
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Total GPU Count</label>
                <input
                  type="number"
                  min="1"
                  value={proposedGpu.gpuCount}
                  onChange={(e) =>
                    setProposedGpu({ ...proposedGpu, gpuCount: parseInt(e.target.value, 10) || 1 })
                  }
                  className="w-full rounded border border-cyan-500/40 bg-navy-950 px-3 py-1.5 text-slate-200 focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Billed Runtime (Hours)</label>
                <input
                  type="number"
                  min="1"
                  value={proposedGpu.billedHours}
                  onChange={(e) =>
                    setProposedGpu({ ...proposedGpu, billedHours: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full rounded border border-cyan-500/40 bg-navy-950 px-3 py-1.5 text-slate-200 focus:border-cyan-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Rate & Override Input */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-slate-400 font-medium">
                  Hourly Rate (USD / {proposedGpu.billingUnit || "GPU-hour"})
                </label>
                {proposedRateInfo.isCustom && (
                  <button
                    type="button"
                    onClick={() => setProposedGpu({ ...proposedGpu, customHourlyRateUsd: null })}
                    className="flex items-center gap-1 text-[10px] text-cyan-400 hover:text-cyan-300"
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
                  className={`w-full rounded border px-3 py-1.5 text-slate-200 focus:outline-none ${
                    proposedRateInfo.isUnknown && !proposedGpu.customHourlyRateUsd
                      ? "border-amber-500/70 bg-amber-950/20 placeholder-amber-400/60"
                      : proposedRateInfo.isCustom
                      ? "border-amber-500/50 bg-navy-950"
                      : "border-cyan-500/40 bg-navy-950 focus:border-cyan-400"
                  }`}
                />
              </div>

              {/* Status Indicator */}
              <div className="mt-1.5 flex items-center justify-between text-[11px]">
                {proposedRateInfo.isUnknown && !proposedGpu.customHourlyRateUsd ? (
                  <span className="text-amber-400 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Price UNKNOWN on official page. User override required.
                  </span>
                ) : proposedRateInfo.isCustom ? (
                  <span className="text-amber-300 font-mono">
                    User-Supplied Override (Unverified)
                  </span>
                ) : (
                  <span className="text-emerald-400 flex items-center gap-1 font-mono">
                    <ShieldCheck className="h-3 w-3" />
                    Verified Nebius Rate ({proposedCatalogGpu?.lastVerifiedDate})
                  </span>
                )}
                {proposedCatalogGpu && (
                  <a
                    href="https://nebius.com/prices"
                    target="_blank"
                    rel="noreferrer"
                    className="text-cyan-400 hover:underline flex items-center gap-1"
                  >
                    <span>nebius.com/prices</span>
                    <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                )}
              </div>
            </div>

            {includeInferenceTokens && (
              <div className="border-t border-navy-850 pt-3 space-y-3">
                <div className="text-[11px] font-bold uppercase text-slate-400">
                  Model Token Inference Volumes (1M Units)
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-500 mb-1 text-[11px]">Input Tokens (Millions)</label>
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
                      className="w-full rounded border border-cyan-500/40 bg-navy-950 px-3 py-1.5 text-slate-200 focus:border-cyan-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-1 text-[11px]">Output Tokens (Millions)</label>
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
                      className="w-full rounded border border-cyan-500/40 bg-navy-950 px-3 py-1.5 text-slate-200 focus:border-cyan-400 focus:outline-none"
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
          <div className="rounded-xl border border-navy-750 bg-gradient-to-r from-navy-900 to-navy-950 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-navy-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                    Calculated Margin Delta &amp; Compute Spend
                  </h3>
                  {/* Strict Verification Badge */}
                  {comparisonResult.isSavingsVerified ? (
                    <span className="rounded bg-emerald-500/15 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-bold font-mono tracking-wider text-emerald-400 flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3" />
                      VERIFIED PUBLISHED RATES
                    </span>
                  ) : (
                    <span className="rounded bg-amber-500/15 border border-amber-500/40 px-2 py-0.5 text-[10px] font-bold font-mono tracking-wider text-amber-400 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      UNVERIFIED / USER ESTIMATE
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Formula: &Delta;C = Baseline Cost &minus; Alternative Cost
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-[10px] uppercase font-mono text-slate-400">Calculated Difference</div>
                  <div
                    className={`text-xl font-black ${
                      comparisonResult.deltaCostUsd >= 0 ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {comparisonResult.deltaCostUsd >= 0 ? "+" : ""}${comparisonResult.deltaCostUsd.toFixed(2)} USD
                  </div>
                </div>
                <div
                  className={`rounded-lg px-3 py-2 text-sm font-bold font-mono ${
                    comparisonResult.percentageDifference >= 0
                      ? "bg-emerald-950/60 border border-emerald-500/50 text-emerald-300"
                      : "bg-rose-950/60 border border-rose-500/50 text-rose-300"
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
              <div className="rounded border border-navy-800 bg-navy-950/80 p-3">
                <div className="text-[10px] text-slate-500">Baseline Total Cost</div>
                <div className="text-base font-bold text-slate-200 mt-1">
                  ${comparisonResult.baseline.totalCostUsd.toFixed(2)}
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  Rate: ${comparisonResult.baseline.breakdown.effectiveHourlyRateUsd.toFixed(2)}/{comparisonResult.baseline.billingUnit}
                </div>
              </div>

              <div className="rounded border border-navy-800 bg-navy-950/80 p-3">
                <div className="text-[10px] text-slate-500">Proposed Total Cost</div>
                <div className="text-base font-bold text-cyan-300 mt-1">
                  ${comparisonResult.proposed.totalCostUsd.toFixed(2)}
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  Rate: ${comparisonResult.proposed.breakdown.effectiveHourlyRateUsd.toFixed(2)}/{comparisonResult.proposed.billingUnit}
                </div>
              </div>

              <div className="rounded border border-navy-800 bg-navy-950/80 p-3">
                <div className="text-[10px] text-slate-500">Savings Classification</div>
                <div
                  className={`text-xs font-bold mt-1 font-sans ${
                    comparisonResult.isSavingsVerified ? "text-emerald-400" : "text-amber-400"
                  }`}
                >
                  {comparisonResult.savingsClassification.replace("_", " ")}
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  {comparisonResult.isSavingsVerified ? "Grounded in published pricing" : "Includes unverified inputs"}
                </div>
              </div>

              <div className="rounded border border-navy-800 bg-navy-950/80 p-3">
                <div className="text-[10px] text-slate-500">Price Sources Audited</div>
                <div className="text-xs font-bold text-slate-200 mt-1 font-sans">
                  {comparisonResult.baseline.priceSources.length + comparisonResult.proposed.priceSources.length} Source(s)
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  Verified Feb 2026
                </div>
              </div>
            </div>
          </div>

          {/* Transparent Source Attribution Table */}
          <div className="rounded-xl border border-navy-800 bg-navy-900/80 overflow-hidden">
            <div className="px-5 py-3 border-b border-navy-800 flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Authoritative Pricing Sources &amp; Audit Trail
              </h4>
              <span className="text-[11px] text-slate-400">
                Every rate verified against published cloud documentation
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-navy-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-navy-800">
                  <tr>
                    <th className="py-2.5 px-4">Item &amp; Tier</th>
                    <th className="py-2.5 px-4">Rate &amp; Unit</th>
                    <th className="py-2.5 px-4">Verification Status</th>
                    <th className="py-2.5 px-4">Official Source Reference</th>
                    <th className="py-2.5 px-4">Last Verified</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-800/60 font-sans">
                  {[...comparisonResult.baseline.priceSources, ...comparisonResult.proposed.priceSources].map(
                    (ps, idx) => (
                      <tr key={idx} className="hover:bg-navy-850/40 transition">
                        <td className="py-3 px-4 font-semibold text-slate-200">
                          {ps.label}
                        </td>
                        <td className="py-3 px-4 font-mono">
                          {ps.rate !== null ? `$${ps.rate.toFixed(2)} / ${ps.unit}` : "UNKNOWN / Quote Required"}
                        </td>
                        <td className="py-3 px-4">
                          {ps.isVerified ? (
                            <span className="inline-flex items-center gap-1 font-mono text-[11px] text-emerald-400 font-semibold bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
                              <ShieldCheck className="h-3 w-3" />
                              VERIFIED
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 font-mono text-[11px] text-amber-400 font-semibold bg-amber-950/40 px-2 py-0.5 rounded border border-amber-500/30">
                              <AlertCircle className="h-3 w-3" />
                              {ps.priceStatus}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-cyan-400 font-mono text-[11px] truncate max-w-xs">
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
                            <span className="text-slate-400">{ps.sourceUrl}</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
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
            <div className="rounded-xl border border-rose-500/30 bg-navy-900/80 p-5 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-300 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-rose-400" />
                <span>Detected Compute Inefficiencies &amp; Waste Patterns</span>
              </h4>

              <div className="space-y-3">
                {comparisonResult.wasteDetections.map((w, idx) => (
                  <div key={idx} className="rounded-lg border border-navy-750 bg-navy-950 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-rose-300">{w.category}</span>
                      <span className="font-mono text-xs text-rose-400 font-semibold">
                        Potential Waste: ~${w.potentialWasteUsd.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">{w.description}</p>
                    <div className="text-xs text-emerald-300 font-sans">
                      <strong>Optimization:</strong> {w.recommendation}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Feasibility Trade-Offs & Missing Evidence Warnings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="rounded-xl border border-navy-800 bg-navy-900/80 p-4 space-y-2">
              <h4 className="font-bold uppercase tracking-wider text-amber-300 text-[11px] flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5 text-amber-400" />
                <span>Feasibility &amp; Hardware Trade-Offs</span>
              </h4>
              <ul className="space-y-1.5 text-slate-300 leading-relaxed">
                {comparisonResult.feasibilityTradeoffs.map((t, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-amber-400">•</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-navy-800 bg-navy-900/80 p-4 space-y-2">
              <h4 className="font-bold uppercase tracking-wider text-slate-400 text-[11px] flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-cyan-400" />
                <span>Missing Evidence &amp; Performance Disclaimers</span>
              </h4>
              <ul className="space-y-1.5 text-slate-400 leading-relaxed">
                {comparisonResult.missingEvidenceWarnings.map((m, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-cyan-400">•</span>
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
