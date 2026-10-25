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
import { DemoFixture } from "@/lib/fixtures/demo-workloads";

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
  loadedFixture?: DemoFixture | null;
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
  loadedFixture,
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
      {/* Simulation Banner if loaded from fixture */}
      {loadedFixture && (
        <div className="rounded-[12px] border border-status-warning/30 bg-[#FEF3C7] p-4 text-[13px] text-text-primary flex items-center justify-between gap-3 shadow-card">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-status-warning shrink-0" />
            <span>
              FinOps Scenario Configured via Simulated Fixture: <strong className="text-text-primary font-mono">{loadedFixture.name}</strong>.
            </span>
          </div>
          <span className="text-[11px] font-mono uppercase font-bold tracking-wider px-2.5 py-1 rounded-[4px] bg-white text-status-warning border border-status-warning/30 shrink-0">
            Simulated Rates
          </span>
        </div>
      )}

      {/* FinOps Header */}
      <div className="rounded-[12px] border border-border-standard bg-white p-5 space-y-5 shadow-card hover:border-border-hover transition">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-subtle pb-4">
          <div>
            <h2 className="text-[24px] font-[650] leading-[1.3] text-text-primary flex items-center gap-2.5">
              <DollarSign className="h-6 w-6 text-nvidia-green" />
              <span>FinOps Margin Engine — Audited Official Cloud Pricing</span>
            </h2>
            <p className="text-[13px] font-normal leading-[1.5] text-text-secondary mt-1">
              Deterministic workload cost calculations (C_GPU &amp; C_API) audited against official Nebius AI Cloud pricing (
              <a
                href="https://nebius.com/prices"
                target="_blank"
                rel="noreferrer"
                className="text-nvidia-dark underline hover:text-nvidia-hover font-semibold"
              >
                https://nebius.com/prices
              </a>
              ). Supports On-Demand vs Preemptible pricing and GPU-hour vs Instance-hour units.
            </p>
          </div>

          <button
            onClick={onCalculate}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 h-10 px-4 rounded-[6px] bg-nvidia-green text-white text-[14px] font-semibold hover:bg-nvidia-hover disabled:opacity-50 transition shadow-sm focus:outline-none focus:ring-2 focus:ring-nvidia-green focus:ring-offset-2 shrink-0"
          >
            {isLoading ? <RefreshCw className="h-4 w-4 animate-spin text-white" /> : <DollarSign className="h-4 w-4 text-white" />}
            <span>{isLoading ? "Calculating..." : "Calculate Cost Comparison"}</span>
          </button>
        </div>

        {/* Pricing Transparency & Verification Protocol Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[13px] bg-surface-secondary p-4 rounded-[8px] border border-border-subtle">
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
            className="inline-flex items-center gap-1.5 text-[12px] font-mono text-nvidia-dark hover:underline shrink-0 self-end sm:self-auto font-medium"
          >
            <span>nebius.com/prices</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* Comparison Input Panels: Baseline vs Proposed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Baseline (Current / Competitor) */}
        <div className="rounded-[12px] border border-border-standard bg-white p-5 space-y-4 shadow-card hover:border-border-hover transition">
          <div className="flex items-center justify-between border-b border-border-subtle pb-3">
            <span className="text-[14px] font-semibold text-text-primary">
              Baseline Configuration (Current / Reference)
            </span>
            <span className="text-[12px] font-mono text-text-muted">Reference Benchmark</span>
          </div>

          <div className="space-y-4 text-[13px]">
            {/* GPU Model Selection */}
            <div>
              <label className="block text-[12px] font-semibold text-text-secondary mb-1">GPU Hardware Instance</label>
              <select
                value={baselineGpu.gpuId}
                onChange={(e) => {
                  setBaselineGpu({
                    ...baselineGpu,
                    gpuId: e.target.value,
                    customHourlyRateUsd: null,
                  });
                }}
                className="w-full h-10 rounded-[6px] border border-border-standard bg-white px-3 text-[13px] text-text-primary focus:border-nvidia-green focus:ring-1 focus:ring-nvidia-green focus:outline-none transition"
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
                <label className="block text-[12px] font-semibold text-text-secondary mb-1">Pricing Tier</label>
                <div className="grid grid-cols-2 gap-1 rounded-[6px] bg-surface-secondary p-1 border border-border-subtle">
                  <button
                    type="button"
                    onClick={() => setBaselineGpu({ ...baselineGpu, pricingModel: "on-demand", customHourlyRateUsd: null })}
                    className={`py-1 text-[11px] font-semibold rounded-[4px] transition ${
                      (baselineGpu.pricingModel || "on-demand") === "on-demand"
                        ? "bg-white text-nvidia-dark border border-border-standard shadow-sm"
                        : "text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    On-Demand
                  </button>
                  <button
                    type="button"
                    onClick={() => setBaselineGpu({ ...baselineGpu, pricingModel: "preemptible", customHourlyRateUsd: null })}
                    className={`py-1 text-[11px] font-semibold rounded-[4px] transition ${
                      baselineGpu.pricingModel === "preemptible"
                        ? "bg-white text-status-warning border border-border-standard shadow-sm"
                        : "text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    Preemptible
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-text-secondary mb-1">Billing Unit</label>
                <div className="grid grid-cols-2 gap-1 rounded-[6px] bg-surface-secondary p-1 border border-border-subtle">
                  <button
                    type="button"
                    onClick={() => setBaselineGpu({ ...baselineGpu, billingUnit: "GPU-hour" })}
                    className={`py-1 text-[11px] font-semibold rounded-[4px] transition ${
                      (baselineGpu.billingUnit || "GPU-hour") === "GPU-hour"
                        ? "bg-white text-nvidia-dark border border-border-standard shadow-sm"
                        : "text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    GPU-hour
                  </button>
                  <button
                    type="button"
                    onClick={() => setBaselineGpu({ ...baselineGpu, billingUnit: "instance-hour" })}
                    className={`py-1 text-[11px] font-semibold rounded-[4px] transition ${
                      baselineGpu.billingUnit === "instance-hour"
                        ? "bg-white text-nvidia-dark border border-border-standard shadow-sm"
                        : "text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    Instance-hour
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[12px] font-semibold text-text-secondary mb-1">Total GPU Count</label>
                <input
                  type="number"
                  min="1"
                  value={baselineGpu.gpuCount}
                  onChange={(e) =>
                    setBaselineGpu({ ...baselineGpu, gpuCount: parseInt(e.target.value, 10) || 1 })
                  }
                  className="w-full h-10 rounded-[6px] border border-border-standard bg-white px-3 text-[14px] text-text-primary focus:border-nvidia-green focus:ring-1 focus:ring-nvidia-green focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-text-secondary mb-1">Billed Runtime (Hours)</label>
                <input
                  type="number"
                  min="1"
                  value={baselineGpu.billedHours}
                  onChange={(e) =>
                    setBaselineGpu({ ...baselineGpu, billedHours: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full h-10 rounded-[6px] border border-border-standard bg-white px-3 text-[14px] text-text-primary focus:border-nvidia-green focus:ring-1 focus:ring-nvidia-green focus:outline-none transition"
                />
              </div>
            </div>

            {/* Rate & Override Input */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[12px] font-semibold text-text-secondary">
                  Hourly Rate (USD / {baselineGpu.billingUnit || "GPU-hour"})
                </label>
                {baselineRateInfo.isCustom && (
                  <button
                    type="button"
                    onClick={() => setBaselineGpu({ ...baselineGpu, customHourlyRateUsd: null })}
                    className="flex items-center gap-1 text-[11px] text-nvidia-dark hover:underline"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Reset Default</span>
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
                  className={`w-full h-10 rounded-[6px] border px-3 text-[14px] text-text-primary focus:outline-none transition ${
                    baselineRateInfo.isUnknown && !baselineGpu.customHourlyRateUsd
                      ? "border-status-warning bg-[#FEF3C7] placeholder-status-warning"
                      : baselineRateInfo.isCustom
                      ? "border-status-warning/50 bg-white"
                      : "border-border-standard bg-white focus:border-nvidia-green focus:ring-1 focus:ring-nvidia-green"
                  }`}
                />
              </div>

              {/* Status Indicator */}
              <div className="mt-2 flex items-center justify-between text-[11px]">
                {baselineRateInfo.isUnknown && !baselineGpu.customHourlyRateUsd ? (
                  <span className="text-status-warning flex items-center gap-1 font-semibold">
                    <AlertCircle className="h-3.5 w-3.5" />
                    Price UNKNOWN on official page. User override required.
                  </span>
                ) : baselineRateInfo.isCustom ? (
                  <span className="text-status-warning font-mono font-semibold">
                    User-Supplied Override (Unverified)
                  </span>
                ) : (
                  <span className="text-nvidia-dark flex items-center gap-1 font-mono font-semibold">
                    <ShieldCheck className="h-3.5 w-3.5 text-nvidia-green" />
                    Verified Official Rate ({baselineCatalogGpu?.lastVerifiedDate})
                  </span>
                )}
                {baselineCatalogGpu && (
                  <a
                    href={baselineCatalogGpu.priceSourceUrl.split(" ")[0]}
                    target="_blank"
                    rel="noreferrer"
                    className="text-text-secondary hover:text-nvidia-dark truncate max-w-[160px]"
                  >
                    Source Link
                  </a>
                )}
              </div>
            </div>

            {includeInferenceTokens && (
              <div className="border-t border-border-subtle pt-3.5 space-y-3">
                <div className="text-[12px] font-semibold uppercase text-text-secondary">
                  Model Token Inference Volumes (1M Units)
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-text-secondary mb-1 text-[11px] font-semibold">Input Tokens (Millions)</label>
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
                      className="w-full h-9 rounded-[6px] border border-border-standard bg-white px-3 text-[13px] text-text-primary focus:border-nvidia-green focus:ring-1 focus:ring-nvidia-green focus:outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-text-secondary mb-1 text-[11px] font-semibold">Output Tokens (Millions)</label>
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
                      className="w-full h-9 rounded-[6px] border border-border-standard bg-white px-3 text-[13px] text-text-primary focus:border-nvidia-green focus:ring-1 focus:ring-nvidia-green focus:outline-none transition"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Proposed Alternative (Nebius / Candidate) */}
        <div className="rounded-[12px] border border-border-standard bg-white p-5 space-y-4 shadow-card hover:border-border-hover transition">
          <div className="flex items-center justify-between border-b border-border-subtle pb-3">
            <span className="text-[14px] font-semibold text-nvidia-dark">
              Proposed Alternative (Nebius AI Cloud Candidate)
            </span>
            <span className="text-[12px] font-mono text-nvidia-dark font-semibold">Optimized Candidate</span>
          </div>

          <div className="space-y-4 text-[13px]">
            {/* GPU Model Selection */}
            <div>
              <label className="block text-[12px] font-semibold text-text-secondary mb-1">GPU Hardware Instance</label>
              <select
                value={proposedGpu.gpuId}
                onChange={(e) => {
                  setProposedGpu({
                    ...proposedGpu,
                    gpuId: e.target.value,
                    customHourlyRateUsd: null,
                  });
                }}
                className="w-full h-10 rounded-[6px] border border-border-standard bg-white px-3 text-[13px] text-text-primary focus:border-nvidia-green focus:ring-1 focus:ring-nvidia-green focus:outline-none transition"
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
                <label className="block text-[12px] font-semibold text-text-secondary mb-1">Pricing Tier</label>
                <div className="grid grid-cols-2 gap-1 rounded-[6px] bg-surface-secondary p-1 border border-border-subtle">
                  <button
                    type="button"
                    onClick={() => setProposedGpu({ ...proposedGpu, pricingModel: "on-demand", customHourlyRateUsd: null })}
                    className={`py-1 text-[11px] font-semibold rounded-[4px] transition ${
                      (proposedGpu.pricingModel || "on-demand") === "on-demand"
                        ? "bg-white text-nvidia-dark border border-border-standard shadow-sm"
                        : "text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    On-Demand
                  </button>
                  <button
                    type="button"
                    onClick={() => setProposedGpu({ ...proposedGpu, pricingModel: "preemptible", customHourlyRateUsd: null })}
                    className={`py-1 text-[11px] font-semibold rounded-[4px] transition ${
                      proposedGpu.pricingModel === "preemptible"
                        ? "bg-white text-status-warning border border-border-standard shadow-sm"
                        : "text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    Preemptible (Spot)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-text-secondary mb-1">Billing Unit</label>
                <div className="grid grid-cols-2 gap-1 rounded-[6px] bg-surface-secondary p-1 border border-border-subtle">
                  <button
                    type="button"
                    onClick={() => setProposedGpu({ ...proposedGpu, billingUnit: "GPU-hour" })}
                    className={`py-1 text-[11px] font-semibold rounded-[4px] transition ${
                      (proposedGpu.billingUnit || "GPU-hour") === "GPU-hour"
                        ? "bg-white text-nvidia-dark border border-border-standard shadow-sm"
                        : "text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    GPU-hour
                  </button>
                  <button
                    type="button"
                    onClick={() => setProposedGpu({ ...proposedGpu, billingUnit: "instance-hour" })}
                    className={`py-1 text-[11px] font-semibold rounded-[4px] transition ${
                      proposedGpu.billingUnit === "instance-hour"
                        ? "bg-white text-nvidia-dark border border-border-standard shadow-sm"
                        : "text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    Instance-hour
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[12px] font-semibold text-text-secondary mb-1">Total GPU Count</label>
                <input
                  type="number"
                  min="1"
                  value={proposedGpu.gpuCount}
                  onChange={(e) =>
                    setProposedGpu({ ...proposedGpu, gpuCount: parseInt(e.target.value, 10) || 1 })
                  }
                  className="w-full h-10 rounded-[6px] border border-border-standard bg-white px-3 text-[14px] text-text-primary focus:border-nvidia-green focus:ring-1 focus:ring-nvidia-green focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-[12px] font-semibold text-text-secondary mb-1">Billed Runtime (Hours)</label>
                <input
                  type="number"
                  min="1"
                  value={proposedGpu.billedHours}
                  onChange={(e) =>
                    setProposedGpu({ ...proposedGpu, billedHours: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full h-10 rounded-[6px] border border-border-standard bg-white px-3 text-[14px] text-text-primary focus:border-nvidia-green focus:ring-1 focus:ring-nvidia-green focus:outline-none transition"
                />
              </div>
            </div>

            {/* Rate & Override Input */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[12px] font-semibold text-text-secondary">
                  Hourly Rate (USD / {proposedGpu.billingUnit || "GPU-hour"})
                </label>
                {proposedRateInfo.isCustom && (
                  <button
                    type="button"
                    onClick={() => setProposedGpu({ ...proposedGpu, customHourlyRateUsd: null })}
                    className="flex items-center gap-1 text-[11px] text-nvidia-dark hover:underline"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Reset Default</span>
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
                  className={`w-full h-10 rounded-[6px] border px-3 text-[14px] text-text-primary focus:outline-none transition ${
                    proposedRateInfo.isUnknown && !proposedGpu.customHourlyRateUsd
                      ? "border-status-warning bg-[#FEF3C7] placeholder-status-warning"
                      : proposedRateInfo.isCustom
                      ? "border-status-warning/50 bg-white"
                      : "border-border-standard bg-white focus:border-nvidia-green focus:ring-1 focus:ring-nvidia-green"
                  }`}
                />
              </div>

              {/* Status Indicator */}
              <div className="mt-2 flex items-center justify-between text-[11px]">
                {proposedRateInfo.isUnknown && !proposedGpu.customHourlyRateUsd ? (
                  <span className="text-status-warning flex items-center gap-1 font-semibold">
                    <AlertCircle className="h-3.5 w-3.5" />
                    Price UNKNOWN on official page. User override required.
                  </span>
                ) : proposedRateInfo.isCustom ? (
                  <span className="text-status-warning font-mono font-semibold">
                    User-Supplied Override (Unverified)
                  </span>
                ) : (
                  <span className="text-nvidia-dark flex items-center gap-1 font-mono font-semibold">
                    <ShieldCheck className="h-3.5 w-3.5 text-nvidia-green" />
                    Verified Nebius Rate ({proposedCatalogGpu?.lastVerifiedDate})
                  </span>
                )}
                {proposedCatalogGpu && (
                  <a
                    href="https://nebius.com/prices"
                    target="_blank"
                    rel="noreferrer"
                    className="text-text-secondary hover:text-nvidia-dark hover:underline flex items-center gap-1"
                  >
                    <span>nebius.com/prices</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>

            {includeInferenceTokens && (
              <div className="border-t border-border-subtle pt-3.5 space-y-3">
                <div className="text-[12px] font-semibold uppercase text-text-secondary">
                  Model Token Inference Volumes (1M Units)
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-text-secondary mb-1 text-[11px] font-semibold">Input Tokens (Millions)</label>
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
                      className="w-full h-9 rounded-[6px] border border-border-standard bg-white px-3 text-[13px] text-text-primary focus:border-nvidia-green focus:ring-1 focus:ring-nvidia-green focus:outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="block text-text-secondary mb-1 text-[11px] font-semibold">Output Tokens (Millions)</label>
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
                      className="w-full h-9 rounded-[6px] border border-border-standard bg-white px-3 text-[13px] text-text-primary focus:border-nvidia-green focus:ring-1 focus:ring-nvidia-green focus:outline-none transition"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Empty State when no calculation has been run */}
      {!comparisonResult && (
        <div className="rounded-[12px] border border-border-standard bg-white p-10 text-center space-y-3 shadow-card hover:border-border-hover transition">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[8px] bg-nvidia-surface text-nvidia-green border border-nvidia-green/30 shadow-sm">
            <DollarSign className="h-6 w-6 text-nvidia-green" />
          </div>
          <h3 className="text-[17px] font-semibold leading-[1.4] text-text-primary">No Comparison Calculated Yet</h3>
          <p className="text-[13px] text-text-secondary max-w-md mx-auto leading-[1.5]">
            Adjust your baseline and proposed candidate parameters above and click <strong>Calculate Cost Comparison</strong>, or load a demonstration fixture from the top navigation bar.
          </p>
        </div>
      )}

      {/* Comparison Calculation Results */}
      {comparisonResult && (
        <div className="space-y-6">
          {/* Main Margin Delta Card */}
          <div className="rounded-[12px] border border-border-standard bg-white p-6 sm:p-8 space-y-5 shadow-card hover:border-border-hover transition">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-subtle pb-5">
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="text-[17px] font-semibold leading-[1.4] text-text-primary">
                    Projected Margin Delta &amp; Compute Spend
                  </h3>
                  {/* Strict Verification Badge */}
                  {comparisonResult.isSavingsVerified ? (
                    <span className="rounded-[4px] bg-nvidia-surface border border-nvidia-green/40 px-2.5 py-0.5 text-[11px] font-bold font-mono tracking-wider text-nvidia-dark flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5 text-nvidia-green" />
                      VERIFIED PUBLISHED RATES
                    </span>
                  ) : (
                    <span className="rounded-[4px] bg-[#FEF3C7] border border-status-warning/30 px-2.5 py-0.5 text-[11px] font-bold font-mono tracking-wider text-status-warning flex items-center gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5" />
                      UNVERIFIED / USER ESTIMATE
                    </span>
                  )}
                </div>
                <p className="text-[13px] text-text-secondary mt-1 leading-[1.5]">
                  Formula: &Delta;C = Baseline Spend &minus; Alternative Spend | Projected savings assume equivalent completion runtime. Not realized savings.
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-[11px] uppercase font-mono text-text-secondary">
                    {comparisonResult.deltaCostUsd >= 0 ? "Projected Cost Reduction" : "Projected Cost Increase"}
                  </div>
                  <div
                    className={`text-[28px] font-bold font-mono tabular-nums ${
                      comparisonResult.deltaCostUsd >= 0 ? "text-nvidia-dark" : "text-status-error"
                    }`}
                  >
                    {comparisonResult.deltaCostUsd >= 0 ? "+" : ""}${comparisonResult.deltaCostUsd.toFixed(2)} USD
                  </div>
                </div>
                <div
                  className={`rounded-[6px] px-3.5 py-2 text-[14px] font-bold font-mono ${
                    comparisonResult.percentageDifference >= 0
                      ? "bg-nvidia-surface border border-nvidia-green/40 text-nvidia-dark"
                      : "bg-[#FEE2E2] border border-status-error/30 text-status-error"
                  }`}
                >
                  {comparisonResult.percentageDifference >= 0
                    ? `-${comparisonResult.percentageDifference.toFixed(1)}% Spend Reduction`
                    : `+${Math.abs(comparisonResult.percentageDifference).toFixed(1)}% Spend Increase`}
                </div>
              </div>
            </div>

            {/* Metrics Breakdown Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
              <div className="rounded-[8px] border border-border-subtle bg-surface-secondary p-4">
                <div className="text-[11px] text-text-secondary uppercase font-semibold">Baseline Total Cost</div>
                <div className="text-[20px] font-bold text-text-primary mt-1 tabular-nums">
                  ${comparisonResult.baseline.totalCostUsd.toFixed(2)}
                </div>
                <div className="text-[11px] text-text-muted mt-1">
                  Rate: ${comparisonResult.baseline.breakdown.effectiveHourlyRateUsd.toFixed(2)}/{comparisonResult.baseline.billingUnit}
                </div>
              </div>

              <div className="rounded-[8px] border border-border-subtle bg-surface-secondary p-4">
                <div className="text-[11px] text-text-secondary uppercase font-semibold">Proposed Total Cost</div>
                <div className="text-[20px] font-bold text-text-primary mt-1 tabular-nums">
                  ${comparisonResult.proposed.totalCostUsd.toFixed(2)}
                </div>
                <div className="text-[11px] text-text-muted mt-1">
                  Rate: ${comparisonResult.proposed.breakdown.effectiveHourlyRateUsd.toFixed(2)}/{comparisonResult.proposed.billingUnit}
                </div>
              </div>

              <div className="rounded-[8px] border border-border-subtle bg-surface-secondary p-4">
                <div className="text-[11px] text-text-secondary uppercase font-semibold">Savings Classification</div>
                <div
                  className={`text-[13px] font-bold mt-1 font-sans ${
                    comparisonResult.isSavingsVerified ? "text-nvidia-dark" : "text-status-warning"
                  }`}
                >
                  {comparisonResult.savingsClassification.replace("_", " ")}
                </div>
                <div className="text-[11px] text-text-muted mt-1">
                  {comparisonResult.isSavingsVerified ? "Grounded in published pricing" : "Includes unverified inputs"}
                </div>
              </div>

              <div className="rounded-[8px] border border-border-subtle bg-surface-secondary p-4">
                <div className="text-[11px] text-text-secondary uppercase font-semibold">Price Sources Audited</div>
                <div className="text-[13px] font-bold text-text-primary mt-1 font-sans">
                  {comparisonResult.baseline.priceSources.length + comparisonResult.proposed.priceSources.length} Source(s)
                </div>
                <div className="text-[11px] text-text-muted mt-1">
                  Verified Feb 2026
                </div>
              </div>
            </div>
          </div>

          {/* Transparent Source Attribution Table */}
          <div className="rounded-[12px] border border-border-standard bg-white overflow-hidden shadow-card hover:border-border-hover transition">
            <div className="px-5 py-4 border-b border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-surface-secondary">
              <h4 className="text-[14px] font-semibold text-text-primary">
                Authoritative Pricing Sources &amp; Audit Trail
              </h4>
              <span className="text-[12px] text-text-secondary">
                Every rate verified against published cloud documentation
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-surface-secondary text-[12px] font-semibold text-text-secondary border-b border-border-subtle uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-5">Item &amp; Tier</th>
                    <th className="py-3 px-5">Rate &amp; Unit</th>
                    <th className="py-3 px-5">Verification Status</th>
                    <th className="py-3 px-5">Official Source Reference</th>
                    <th className="py-3 px-5">Last Verified</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle font-sans text-[13px]">
                  {[...comparisonResult.baseline.priceSources, ...comparisonResult.proposed.priceSources].map(
                    (ps, idx) => (
                      <tr key={idx} className="hover:bg-surface-secondary/50 transition">
                        <td className="py-3.5 px-5 font-semibold text-text-primary">
                          {ps.label}
                        </td>
                        <td className="py-3.5 px-5 font-mono text-text-secondary tabular-nums">
                          {ps.rate !== null ? `$${ps.rate.toFixed(2)} / ${ps.unit}` : "UNKNOWN / Quote Required"}
                        </td>
                        <td className="py-3.5 px-5">
                          {ps.isVerified ? (
                            <span className="inline-flex items-center gap-1 font-mono text-[11px] text-nvidia-dark font-semibold bg-nvidia-surface px-2.5 py-0.5 rounded-[4px] border border-nvidia-green/30">
                              <ShieldCheck className="h-3 w-3 text-nvidia-green" />
                              VERIFIED
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 font-mono text-[11px] text-status-warning font-semibold bg-[#FEF3C7] px-2.5 py-0.5 rounded-[4px] border border-status-warning/30">
                              <AlertCircle className="h-3 w-3" />
                              {ps.priceStatus}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-5 text-text-primary hover:text-nvidia-dark font-mono text-[12px] truncate max-w-xs">
                          {ps.sourceUrl.startsWith("http") ? (
                            <a
                              href={ps.sourceUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="hover:underline flex items-center gap-1"
                            >
                              <span className="truncate">{ps.sourceUrl}</span>
                              <ExternalLink className="h-3 w-3 shrink-0 text-text-muted" />
                            </a>
                          ) : (
                            <span className="text-text-muted">{ps.sourceUrl}</span>
                          )}
                        </td>
                        <td className="py-3.5 px-5 text-text-secondary font-mono text-[12px]">
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
            <div className="rounded-[12px] border border-status-error/30 bg-white p-5 space-y-4 shadow-card hover:border-border-hover transition">
              <h4 className="text-[14px] font-semibold text-status-error flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-status-error" />
                <span>Detected Compute Inefficiencies &amp; Waste Patterns</span>
              </h4>

              <div className="space-y-3">
                {comparisonResult.wasteDetections.map((w, idx) => (
                  <div key={idx} className="rounded-[8px] border border-border-subtle bg-surface-secondary p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[13px] text-status-error">{w.category}</span>
                      <span className="font-mono text-[13px] text-status-error font-semibold tabular-nums">
                        Potential Waste: ~${w.potentialWasteUsd.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-[13px] text-text-secondary leading-[1.5]">{w.description}</p>
                    <div className="text-[13px] text-text-primary font-sans bg-nvidia-surface border border-nvidia-green/30 p-2.5 rounded-[6px]">
                      <strong className="text-nvidia-dark mr-1 font-semibold">Optimization:</strong> {w.recommendation}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Feasibility Trade-Offs & Missing Evidence Warnings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-[13px]">
            <div className="rounded-[12px] border border-border-standard bg-white p-5 space-y-2.5 shadow-card hover:border-border-hover transition">
              <h4 className="font-semibold text-status-warning text-[12px] uppercase tracking-wider flex items-center gap-2">
                <Info className="h-4 w-4 text-status-warning" />
                <span>Feasibility &amp; Hardware Trade-Offs</span>
              </h4>
              <ul className="space-y-2 text-text-secondary leading-[1.5]">
                {comparisonResult.feasibilityTradeoffs.map((t, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-status-warning font-bold">•</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-[12px] border border-border-standard bg-white p-5 space-y-2.5 shadow-card hover:border-border-hover transition">
              <h4 className="font-semibold text-text-secondary text-[12px] uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-nvidia-green" />
                <span>Missing Evidence &amp; Performance Disclaimers</span>
              </h4>
              <ul className="space-y-2 text-text-secondary leading-[1.5]">
                {comparisonResult.missingEvidenceWarnings.map((m, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-nvidia-green font-bold">•</span>
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
