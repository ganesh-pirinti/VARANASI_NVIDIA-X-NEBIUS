"use client";

import React, { useState } from "react";
import { 
  DollarSign, 
  TrendingDown, 
  TrendingUp, 
  AlertTriangle, 
  ExternalLink, 
  RefreshCw, 
  Layers, 
  Info,
  HelpCircle,
  ShieldCheck
} from "lucide-react";
import { 
  GpuWorkloadInput, 
  ModelInferenceInput, 
  FinOpsComparisonResult, 
  FinOpsCalculationResult 
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

  return (
    <div className="space-y-6">
      {/* FinOps Header */}
      <div className="rounded-xl border border-navy-800 bg-navy-900/80 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-navy-800 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-emerald-400" />
              <span>FinOps Margin Engine — Transparent Cloud Compute & Inference Sizing</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Deterministic workload cost calculations (C_GPU &amp; C_API) comparing baseline vs proposed alternatives with verified source attribution.
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

        {/* Pricing Transparency Banner */}
        <div className="flex items-center gap-2 text-xs text-slate-400 bg-navy-950 p-3 rounded-lg border border-navy-750">
          <ShieldCheck className="h-4 w-4 text-cyan-400 shrink-0" />
          <span>
            <strong>Pricing Transparency Commitment:</strong> All reference rates link to verified published pricing pages with documented verification timestamps. Rates are editable to model custom enterprise contracts.
          </span>
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
            <span className="text-[11px] font-mono text-slate-500">Benchmark Reference</span>
          </div>

          <div className="space-y-3 text-xs">
            {/* GPU Model Selection */}
            <div>
              <label className="block text-slate-400 mb-1 font-medium">GPU Hardware Instance</label>
              <select
                value={baselineGpu.gpuId}
                onChange={(e) => {
                  const selected = VERIFIED_GPU_CATALOG.find((g) => g.id === e.target.value);
                  setBaselineGpu({
                    ...baselineGpu,
                    gpuId: e.target.value,
                    customHourlyRateUsd: selected?.standardHourlyRateUsd,
                  });
                }}
                className="w-full rounded border border-navy-750 bg-navy-950 px-3 py-1.5 text-slate-200 focus:border-cyan-500 focus:outline-none"
              >
                {VERIFIED_GPU_CATALOG.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} — ${g.standardHourlyRateUsd.toFixed(2)}/hr ({g.provider})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">GPU Count</label>
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

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-slate-400 font-medium">Price per GPU-hour (USD)</label>
                <span className="text-[10px] text-slate-500 font-mono">Editable rate</span>
              </div>
              <input
                type="number"
                step="0.01"
                min="0"
                value={baselineGpu.customHourlyRateUsd ?? 2.85}
                onChange={(e) =>
                  setBaselineGpu({ ...baselineGpu, customHourlyRateUsd: parseFloat(e.target.value) || 0 })
                }
                className="w-full rounded border border-navy-750 bg-navy-950 px-3 py-1.5 text-slate-200 focus:border-cyan-500 focus:outline-none"
              />
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

        {/* Proposed Alternative (Nebius / Optimized) */}
        <div className="rounded-xl border border-cyan-500/30 bg-navy-900/80 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-navy-850 pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-300">
              Proposed Alternative (Nebius Cloud Optimized)
            </span>
            <span className="text-[11px] font-mono text-cyan-400 font-semibold">Optimized Candidate</span>
          </div>

          <div className="space-y-3 text-xs">
            {/* GPU Model Selection */}
            <div>
              <label className="block text-slate-400 mb-1 font-medium">GPU Hardware Instance</label>
              <select
                value={proposedGpu.gpuId}
                onChange={(e) => {
                  const selected = VERIFIED_GPU_CATALOG.find((g) => g.id === e.target.value);
                  setProposedGpu({
                    ...proposedGpu,
                    gpuId: e.target.value,
                    customHourlyRateUsd: selected?.standardHourlyRateUsd,
                  });
                }}
                className="w-full rounded border border-cyan-500/40 bg-navy-950 px-3 py-1.5 text-slate-200 focus:border-cyan-400 focus:outline-none"
              >
                {VERIFIED_GPU_CATALOG.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name} — ${g.standardHourlyRateUsd.toFixed(2)}/hr ({g.provider})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">GPU Count</label>
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

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-slate-400 font-medium">Price per GPU-hour (USD)</label>
                <span className="text-[10px] text-slate-500 font-mono">Editable rate</span>
              </div>
              <input
                type="number"
                step="0.01"
                min="0"
                value={proposedGpu.customHourlyRateUsd ?? 2.85}
                onChange={(e) =>
                  setProposedGpu({ ...proposedGpu, customHourlyRateUsd: parseFloat(e.target.value) || 0 })
                }
                className="w-full rounded border border-cyan-500/40 bg-navy-950 px-3 py-1.5 text-slate-200 focus:border-cyan-400 focus:outline-none"
              />
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
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
                  Cost Sizing Comparison & Calculated Margin Delta
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Formula: &Delta;C = Baseline Cost &minus; Alternative Cost
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-[10px] uppercase font-mono text-slate-400">Estimated Delta</div>
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
                    ? `-${comparisonResult.percentageDifference.toFixed(1)}% Cost`
                    : `+${Math.abs(comparisonResult.percentageDifference).toFixed(1)}% Cost`}
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
                  GPU: ${comparisonResult.baseline.gpuCostUsd.toFixed(2)} | Tokens: ${comparisonResult.baseline.inferenceCostUsd.toFixed(2)}
                </div>
              </div>

              <div className="rounded border border-navy-800 bg-navy-950/80 p-3">
                <div className="text-[10px] text-slate-500">Proposed Total Cost</div>
                <div className="text-base font-bold text-cyan-300 mt-1">
                  ${comparisonResult.proposed.totalCostUsd.toFixed(2)}
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  GPU: ${comparisonResult.proposed.gpuCostUsd.toFixed(2)} | Tokens: ${comparisonResult.proposed.inferenceCostUsd.toFixed(2)}
                </div>
              </div>

              <div className="rounded border border-navy-800 bg-navy-950/80 p-3">
                <div className="text-[10px] text-slate-500">Savings Classification</div>
                <div className="text-xs font-bold text-amber-300 mt-1 font-sans">
                  Estimated Theoretical
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  Pending benchmark verification
                </div>
              </div>

              <div className="rounded border border-navy-800 bg-navy-950/80 p-3">
                <div className="text-[10px] text-slate-500">Price Sources Audited</div>
                <div className="text-xs font-bold text-slate-200 mt-1 font-sans">
                  {comparisonResult.baseline.priceSources.length} Published Source(s)
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  Verified Feb 2026
                </div>
              </div>
            </div>
          </div>

          {/* Waste Detections */}
          {comparisonResult.wasteDetections.length > 0 && (
            <div className="rounded-xl border border-rose-500/30 bg-navy-900/80 p-5 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-300 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-400" />
                <span>Detected Compute Inefficiencies & Waste Patterns</span>
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
                <span>Feasibility & Hardware Trade-Offs</span>
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
                <span>Missing Evidence & Pricing Disclaimers</span>
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
