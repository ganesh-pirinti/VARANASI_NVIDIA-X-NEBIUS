"use client";

import React from "react";
import { 
  ShieldAlert, 
  DollarSign, 
  FileText, 
  Cpu, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  ArrowRight,
  TrendingDown,
  Layers,
  Search
} from "lucide-react";
import { PreflightReport } from "@/types/runguard";
import { FinOpsComparisonResult, FinOpsCalculationResult } from "@/types/finops";
import { RunCostPassport } from "@/types/passport";
import { SystemStatusResponse } from "@/types/api";
import { StatusBadge } from "../ui/StatusBadge";
import { DEMO_FIXTURES, DemoFixture } from "@/lib/fixtures/demo-workloads";

interface DashboardTabProps {
  preflightReport: PreflightReport | null;
  finopsComparison: FinOpsComparisonResult | null;
  finopsSingle: FinOpsCalculationResult | null;
  latestPassport: RunCostPassport | null;
  systemStatus: SystemStatusResponse | null;
  setActiveTab: (tab: string) => void;
  onSelectFixture: (fixture: DemoFixture) => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  preflightReport,
  finopsComparison,
  finopsSingle,
  latestPassport,
  systemStatus,
  setActiveTab,
  onSelectFixture,
}) => {
  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-xl border border-navy-750 bg-gradient-to-r from-navy-900 via-navy-850 to-navy-950 p-6 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-950/40 px-3 py-1 text-xs font-semibold text-cyan-300">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
              Nebius × NVIDIA Global AI Hackathon 2026
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              VARANASI RunGuard & FinOps Margin Engine
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Catch preventable AI workload failures before cluster deployment and analyze GPU & inference margins with deterministic rigor. Powered by Nebius Token Factory and NVIDIA open-source models.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => setActiveTab("runguard")}
              className="flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2.5 text-xs font-bold text-navy-950 hover:bg-cyan-400 transition shadow-lg shadow-cyan-500/20"
            >
              <ShieldAlert className="h-4 w-4" />
              <span>Inspect Workload</span>
            </button>
            <button
              onClick={() => setActiveTab("finops")}
              className="flex items-center gap-2 rounded-lg border border-navy-700 bg-navy-800 px-4 py-2.5 text-xs font-bold text-slate-200 hover:bg-navy-750 transition"
            >
              <DollarSign className="h-4 w-4 text-emerald-400" />
              <span>Calculate FinOps</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics & Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Module 1: GPU RunGuard Status */}
        <div className="rounded-xl border border-navy-800 bg-navy-900/80 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="rounded-lg bg-blue-500/10 p-2 text-cyan-400 border border-blue-500/20">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-200">GPU RunGuard</h3>
                <p className="text-[11px] text-slate-400">Preflight & Runtime Integrity</p>
              </div>
            </div>
            {preflightReport ? (
              <StatusBadge status={preflightReport.overallStatus} />
            ) : (
              <span className="text-[11px] font-mono text-slate-500">AWAITING INPUT</span>
            )}
          </div>

          {preflightReport ? (
            <div className="space-y-2 border-t border-navy-800 pt-3">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Total Checks Evaluated:</span>
                <span className="font-semibold text-slate-200">{preflightReport.checks.length}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Identified Findings:</span>
                <span className={`font-semibold ${preflightReport.findings.length > 0 ? "text-rose-400" : "text-emerald-400"}`}>
                  {preflightReport.findings.length}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">VRAM Capacity:</span>
                <span className="font-semibold text-slate-200">
                  {preflightReport.vramEstimate ? `${preflightReport.vramEstimate.totalEstimatedVramGb} GiB/GPU` : "Unspecified"}
                </span>
              </div>
              <button
                onClick={() => setActiveTab("runguard")}
                className="mt-2 flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
              >
                <span>View Full Inspection Table</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="border-t border-navy-850 pt-3 text-xs text-slate-500">
              No configuration files analyzed yet. Run a preflight check or load a simulated test fixture.
            </div>
          )}
        </div>

        {/* Module 2: FinOps Margin Engine */}
        <div className="rounded-xl border border-navy-800 bg-navy-900/80 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400 border border-emerald-500/20">
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-200">FinOps Engine</h3>
                <p className="text-[11px] text-slate-400">Compute & Token Margin Analysis</p>
              </div>
            </div>
            {finopsComparison && (
              <span className="rounded bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-xs font-bold text-emerald-400">
                {finopsComparison.percentageDifference >= 0 ? `-${finopsComparison.percentageDifference.toFixed(0)}%` : `+${Math.abs(finopsComparison.percentageDifference).toFixed(0)}%`}
              </span>
            )}
          </div>

          {finopsComparison ? (
            <div className="space-y-2 border-t border-navy-800 pt-3">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Baseline Cost:</span>
                <span className="font-semibold text-slate-200">${finopsComparison.baseline.totalCostUsd.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Proposed Cost:</span>
                <span className="font-semibold text-slate-200">${finopsComparison.proposed.totalCostUsd.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Estimated Delta:</span>
                <span className={`font-semibold ${finopsComparison.deltaCostUsd >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  ${finopsComparison.deltaCostUsd.toFixed(2)} USD
                </span>
              </div>
              <button
                onClick={() => setActiveTab("finops")}
                className="mt-2 flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
              >
                <span>Explore Cost Scenarios</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : finopsSingle ? (
            <div className="space-y-2 border-t border-navy-800 pt-3">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Workload Total Spend:</span>
                <span className="font-bold text-slate-200">${finopsSingle.totalCostUsd.toFixed(2)} USD</span>
              </div>
              <button
                onClick={() => setActiveTab("finops")}
                className="mt-2 flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
              >
                <span>Compare Against Alternative</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="border-t border-navy-850 pt-3 text-xs text-slate-500">
              No cost models computed. Configure GPU hours or token volume to estimate compute budget.
            </div>
          )}
        </div>

        {/* Module 3: Active Integrations */}
        <div className="rounded-xl border border-navy-800 bg-navy-900/80 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="rounded-lg bg-amber-500/10 p-2 text-amber-400 border border-amber-500/20">
                <Cpu className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-200">AI Integrations</h3>
                <p className="text-[11px] text-slate-400">NVIDIA Model & Search State</p>
              </div>
            </div>
          </div>

          <div className="space-y-3 border-t border-navy-800 pt-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Nebius Token Factory:</span>
              <span className={`font-mono font-semibold ${systemStatus?.nebiusConfigured ? "text-emerald-400" : "text-amber-400"}`}>
                {systemStatus?.nebiusConfigured ? "ACTIVE" : "UNCONFIGURED"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">NVIDIA Model:</span>
              <span className="text-slate-300 font-mono text-[11px] truncate max-w-[160px]" title={systemStatus?.nebiusModel}>
                {systemStatus?.nebiusModel?.split("/")[1] || "Nemotron-70B"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Tavily Search:</span>
              <span className={`font-mono font-semibold ${systemStatus?.tavilyConfigured ? "text-emerald-400" : "text-amber-400"}`}>
                {systemStatus?.tavilyConfigured ? "ACTIVE" : "UNCONFIGURED"}
              </span>
            </div>

            <button
              onClick={() => setActiveTab("diagnose")}
              className="mt-2 flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-semibold"
            >
              <span>Launch Live Investigation</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Demonstration Fixture Quick Launcher */}
      <div className="rounded-xl border border-navy-750 bg-navy-900/50 p-6 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-cyan-400" />
            <span>Built-in Demonstration Scenarios (Judges Evaluation Suite)</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Test VARANASI without supplying custom cluster files. All fixtures use authentic failure signatures and realistic cloud GPU pricing.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {DEMO_FIXTURES.map((fixture) => (
            <button
              key={fixture.id}
              onClick={() => onSelectFixture(fixture)}
              className="flex flex-col text-left rounded-lg border border-navy-750 bg-navy-850/60 p-3.5 hover:border-cyan-500/50 hover:bg-navy-800 transition group"
            >
              <div className="text-xs font-bold text-slate-200 group-hover:text-cyan-300">
                {fixture.name}
              </div>
              <div className="text-[11px] text-slate-400 mt-1.5 line-clamp-2">
                {fixture.tagline}
              </div>
              <div className="mt-3 text-[10px] font-mono text-cyan-400 group-hover:underline flex items-center gap-1">
                <span>Load Simulated Fixture</span>
                <ArrowRight className="h-3 w-3" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Latest Run & Cost Passport Preview */}
      {latestPassport && (
        <div className="rounded-xl border border-navy-750 bg-navy-900/70 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-cyan-400" />
              <h3 className="text-sm font-bold text-slate-200">
                Latest Generated Passport: {latestPassport.title}
              </h3>
            </div>
            <button
              onClick={() => setActiveTab("passport")}
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
            >
              <span>Open Passport</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 font-mono">
            <span>ID: {latestPassport.id}</span>
            <span>Target: {latestPassport.targetEnvironment.targetGpu}</span>
            <span>Status: <strong className="text-slate-200">{latestPassport.overallRunGuardStatus}</strong></span>
            <span>Savings Delta: <strong className="text-emerald-400">${latestPassport.finopsSummary.deltaSavingsUsd.toFixed(2)}</strong></span>
          </div>
        </div>
      )}
    </div>
  );
};
