"use client";

import React from "react";
import { 
  ShieldAlert, 
  DollarSign, 
  FileText, 
  Cpu, 
  Sparkles, 
  ArrowRight,
  TrendingDown,
  Layers,
  HardDrive,
  FlaskConical,
  Info,
  CheckCircle2,
  AlertCircle
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
  loadedFixture?: DemoFixture | null;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  preflightReport,
  finopsComparison,
  finopsSingle,
  latestPassport,
  systemStatus,
  setActiveTab,
  onSelectFixture,
  loadedFixture,
}) => {
  return (
    <div className="space-y-6">
      {/* Active Demonstration Banner if a scenario is loaded */}
      {loadedFixture && (
        <div className="rounded-xl border border-status-warning/40 bg-status-warning/10 p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-start sm:items-center gap-2.5">
            <FlaskConical className="h-5 w-5 text-status-warning shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <div className="text-xs font-bold text-text-primary flex items-center gap-2">
                <span>ACTIVE DEMONSTRATION FIXTURE:</span>
                <span className="text-status-warning font-mono">{loadedFixture.name}</span>
              </div>
              <p className="text-[11px] text-text-secondary mt-0.5 leading-relaxed">
                Workload data and cost figures reflect synthetic failure signatures and verified cloud pricing for evaluation purposes. Not live production telemetry.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-status-warning/20 text-status-warning border border-status-warning/30 shrink-0 self-end sm:self-auto">
            Simulated Benchmark
          </span>
        </div>
      )}

      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-border-standard bg-gradient-to-r from-surface-elevated via-surface-card to-app p-6 sm:p-8 shadow-card">
        {/* Subtle decorative ambient light */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-nvidia-green/5 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-nvidia-border bg-surface-elevated px-3 py-1 text-xs font-semibold text-nvidia-green">
              <span className="h-1.5 w-1.5 rounded-full bg-nvidia-green animate-pulse"></span>
              Nebius × NVIDIA Global AI Hackathon 2026
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
              VARANASI RunGuard &amp; FinOps Margin Engine
            </h1>
            <p className="text-sm text-text-secondary leading-relaxed">
              Catch preventable AI workload failures before cluster deployment and analyze GPU &amp; inference margins with deterministic rigor. Powered by Nebius Token Factory and NVIDIA open-source models.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-text-muted font-medium">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-nvidia-green"></span>
                Deterministic Preflight Core
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-text-secondary"></span>
                Audited Official Pricing
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-nvidia-green"></span>
                NVIDIA Open-Source Models
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => setActiveTab("runguard")}
              className="flex items-center gap-2 rounded-xl bg-nvidia-green px-5 py-3 text-xs font-bold text-app hover:bg-nvidia-light transition shadow-nvidia-glow"
            >
              <ShieldAlert className="h-4 w-4 text-app" />
              <span>Inspect Workload</span>
            </button>
            <button
              onClick={() => setActiveTab("finops")}
              className="flex items-center gap-2 rounded-xl border border-border-standard bg-surface-card px-5 py-3 text-xs font-bold text-text-primary hover:bg-surface-elevated hover:border-nvidia-green hover:text-nvidia-green transition shadow-sm"
            >
              <DollarSign className="h-4 w-4 text-nvidia-green" />
              <span>Calculate FinOps</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics & Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Module 1: GPU RunGuard Status */}
        <div className="rounded-xl border border-border-standard bg-surface-card p-5 space-y-4 shadow-card hover:border-border-standard/80 transition">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-surface-elevated p-2.5 text-nvidia-green border border-border-standard">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-text-primary">GPU RunGuard</h3>
                <p className="text-[11px] text-text-muted">Preflight &amp; Runtime Integrity</p>
              </div>
            </div>
            {preflightReport ? (
              <StatusBadge status={preflightReport.overallStatus} />
            ) : (
              <span className="text-[11px] font-mono text-text-muted">AWAITING INPUT</span>
            )}
          </div>

          {preflightReport ? (
            <div className="space-y-2 border-t border-border-subtle pt-3">
              {loadedFixture && (
                <div className="text-[10px] font-mono text-status-warning uppercase tracking-wider mb-1 flex items-center gap-1 font-semibold">
                  <span>Simulated Fixture Data</span>
                </div>
              )}
              <div className="flex justify-between text-xs">
                <span className="text-text-muted">Total Checks Evaluated:</span>
                <span className="font-semibold text-text-primary font-mono">{preflightReport.checks.length}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-text-muted">Identified Findings:</span>
                <span className={`font-semibold font-mono ${preflightReport.findings.length > 0 ? "text-status-error" : "text-nvidia-green"}`}>
                  {preflightReport.findings.length}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-text-muted">VRAM Allocation:</span>
                <span className="font-semibold text-text-primary font-mono">
                  {preflightReport.vramEstimate ? `${preflightReport.vramEstimate.totalEstimatedVramGb} GiB/GPU` : "Unspecified"}
                </span>
              </div>
              <button
                onClick={() => setActiveTab("runguard")}
                className="mt-2.5 flex items-center gap-1.5 text-xs text-text-primary hover:text-nvidia-green font-semibold transition"
              >
                <span>View Full Inspection Table</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="border-t border-border-subtle pt-3 text-xs text-text-muted leading-relaxed space-y-2">
              <p>No configuration files analyzed yet.</p>
              <button
                onClick={() => setActiveTab("runguard")}
                className="inline-flex items-center gap-1 text-xs text-nvidia-green font-semibold hover:underline"
              >
                <span>Run Preflight Checks</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>

        {/* Module 2: FinOps Margin Engine */}
        <div className="rounded-xl border border-border-standard bg-surface-card p-5 space-y-4 shadow-card hover:border-border-standard/80 transition">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-nvidia-surface p-2.5 text-nvidia-green border border-nvidia-border">
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-text-primary">FinOps Engine</h3>
                <p className="text-[11px] text-text-muted">Compute &amp; Token Margin Analysis</p>
              </div>
            </div>
            {finopsComparison ? (
              <span className={`rounded-md border px-2 py-0.5 text-xs font-bold font-mono ${
                finopsComparison.isSavingsVerified
                  ? "bg-nvidia-surface border-nvidia-border text-nvidia-green"
                  : "bg-status-warning/15 border-status-warning/35 text-status-warning"
              }`}>
                {finopsComparison.percentageDifference >= 0 ? `-${finopsComparison.percentageDifference.toFixed(0)}%` : `+${Math.abs(finopsComparison.percentageDifference).toFixed(0)}%`}
                {!finopsComparison.isSavingsVerified && " (Est)"}
              </span>
            ) : (
              <span className="text-[11px] font-mono text-text-muted">AWAITING CALCULATION</span>
            )}
          </div>

          {finopsComparison ? (
            <div className="space-y-2 border-t border-border-subtle pt-3">
              {loadedFixture && (
                <div className="text-[10px] font-mono text-status-warning uppercase tracking-wider mb-1 flex items-center gap-1 font-semibold">
                  <span>Simulated Scenario Rates</span>
                </div>
              )}
              <div className="flex justify-between text-xs">
                <span className="text-text-muted">Baseline Cost:</span>
                <span className="font-semibold text-text-primary font-mono">${finopsComparison.baseline.totalCostUsd.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-text-muted">Proposed Cost:</span>
                <span className="font-semibold text-text-primary font-mono">${finopsComparison.proposed.totalCostUsd.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-text-muted">Projected Delta (&Delta;C):</span>
                <span className={`font-semibold font-mono ${finopsComparison.deltaCostUsd >= 0 ? "text-nvidia-green" : "text-status-error"}`}>
                  {finopsComparison.deltaCostUsd >= 0 ? "+" : ""}${finopsComparison.deltaCostUsd.toFixed(2)} USD
                </span>
              </div>
              <div className="text-[10px] text-text-muted pt-1">
                Notice: Projected savings assume equivalent throughput. Not realized savings.
              </div>
              <button
                onClick={() => setActiveTab("finops")}
                className="mt-1.5 flex items-center gap-1.5 text-xs text-nvidia-green hover:text-nvidia-light font-semibold transition"
              >
                <span>Explore Cost Scenarios</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : finopsSingle ? (
            <div className="space-y-2 border-t border-border-subtle pt-3">
              <div className="flex justify-between text-xs">
                <span className="text-text-muted">Workload Total Spend:</span>
                <span className="font-bold text-text-primary font-mono">${finopsSingle.totalCostUsd.toFixed(2)} USD</span>
              </div>
              <button
                onClick={() => setActiveTab("finops")}
                className="mt-2.5 flex items-center gap-1.5 text-xs text-nvidia-green hover:text-nvidia-light font-semibold transition"
              >
                <span>Compare Against Alternative</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="border-t border-border-subtle pt-3 text-xs text-text-muted leading-relaxed space-y-2">
              <p>No cost models computed yet. Configure GPU hours or token volume to estimate compute budget.</p>
              <button
                onClick={() => setActiveTab("finops")}
                className="inline-flex items-center gap-1 text-xs text-nvidia-green font-semibold hover:underline"
              >
                <span>Launch FinOps Calculator</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>

        {/* Module 3: Active Integrations */}
        <div className="rounded-xl border border-border-standard bg-surface-card p-5 space-y-4 shadow-card hover:border-border-standard/80 transition">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-surface-elevated p-2.5 text-text-primary border border-border-standard">
                <Cpu className="h-5 w-5 text-nvidia-green" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-text-primary">AI Integrations</h3>
                <p className="text-[11px] text-text-muted">NVIDIA Model &amp; Search State</p>
              </div>
            </div>
          </div>

          <div className="space-y-3 border-t border-border-subtle pt-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-text-muted">Nebius Token Factory:</span>
              <span
                className={`font-mono font-semibold px-1.5 py-0.5 rounded text-[10px] ${
                  systemStatus?.nebiusStatus === "CONNECTED"
                    ? "bg-nvidia-surface text-nvidia-green border border-nvidia-border"
                    : systemStatus?.nebiusStatus === "CONFIGURED"
                    ? "bg-surface-elevated text-text-secondary border border-border-standard"
                    : systemStatus?.nebiusStatus === "FAILED"
                    ? "bg-status-error/15 text-status-error border border-status-error/30"
                    : "bg-surface-elevated text-status-warning border border-border-standard"
                }`}
              >
                {systemStatus?.nebiusStatus || "NOT CONFIGURED"}
              </span>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <span className="text-text-muted">NVIDIA Model:</span>
                {systemStatus?.nebiusModelAvailable && (
                  <span className="text-[10px] text-nvidia-green font-mono font-medium">Catalogue Verified</span>
                )}
              </div>
              <div
                className="text-text-secondary font-mono text-[11px] mt-0.5 truncate bg-surface-input p-1.5 rounded border border-border-subtle"
                title={systemStatus?.nebiusModel}
              >
                {systemStatus?.nebiusModel || "nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B"}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-muted">Tavily Technical Search:</span>
              <span
                className={`font-mono font-semibold px-1.5 py-0.5 rounded text-[10px] ${
                  systemStatus?.tavilyStatus === "CONNECTED"
                    ? "bg-nvidia-surface text-nvidia-green border border-nvidia-border"
                    : systemStatus?.tavilyStatus === "CONFIGURED"
                    ? "bg-surface-elevated text-text-secondary border border-border-standard"
                    : systemStatus?.tavilyStatus === "FAILED"
                    ? "bg-status-error/15 text-status-error border border-status-error/30"
                    : "bg-surface-elevated text-status-warning border border-border-standard"
                }`}
              >
                {systemStatus?.tavilyStatus || "NOT CONFIGURED"}
              </span>
            </div>

            <button
              onClick={() => setActiveTab("diagnose")}
              className="mt-2.5 flex items-center gap-1.5 text-xs text-text-primary hover:text-nvidia-green font-semibold transition"
            >
              <span>Launch Live Investigation</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Demonstration Fixture Quick Launcher */}
      <div className="rounded-2xl border border-border-standard bg-surface-card p-6 space-y-4 shadow-card">
        <div>
          <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-nvidia-green" />
            <span>Built-in Demonstration Scenarios (Judges Evaluation Suite)</span>
          </h3>
          <p className="text-xs text-text-muted mt-1 leading-relaxed">
            Test VARANASI without supplying custom cluster files. All fixtures use authentic failure signatures and verified cloud GPU pricing.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {DEMO_FIXTURES.map((fixture) => (
            <button
              key={fixture.id}
              onClick={() => onSelectFixture(fixture)}
              className={`flex flex-col text-left rounded-xl border p-4 transition group shadow-sm ${
                loadedFixture?.id === fixture.id
                  ? "border-nvidia-green bg-surface-elevated ring-1 ring-nvidia-green"
                  : "border-border-subtle bg-surface-elevated/70 hover:border-nvidia-green/50 hover:bg-surface-elevated"
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-bold text-text-primary group-hover:text-nvidia-green transition-colors">
                  {fixture.name}
                </span>
                {loadedFixture?.id === fixture.id && (
                  <span className="h-2 w-2 rounded-full bg-nvidia-green shrink-0" />
                )}
              </div>
              <div className="text-[11px] text-text-muted mt-1.5 line-clamp-2 leading-relaxed">
                {fixture.tagline}
              </div>
              <div className="mt-3 text-[10px] font-mono text-nvidia-green group-hover:underline flex items-center gap-1 font-semibold">
                <span>{loadedFixture?.id === fixture.id ? "Currently Active Fixture" : "Load Simulated Fixture"}</span>
                <ArrowRight className="h-3 w-3" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Latest Run & Cost Passport Preview */}
      {latestPassport && (
        <div className="rounded-2xl border border-border-standard bg-surface-card p-6 space-y-3 shadow-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <FileText className="h-5 w-5 text-nvidia-green" />
              <h3 className="text-sm font-bold text-text-primary">
                Latest Generated Passport: {latestPassport.title}
              </h3>
            </div>
            <button
              onClick={() => setActiveTab("passport")}
              className="text-xs font-semibold text-text-primary hover:text-nvidia-green flex items-center gap-1 transition"
            >
              <span>Open Passport</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs text-text-muted font-mono bg-surface-input p-3 rounded-xl border border-border-subtle">
            <span>ID: <code className="text-text-primary">{latestPassport.id}</code></span>
            <span>Target: <strong className="text-text-primary">{latestPassport.targetEnvironment.targetGpu}</strong></span>
            <span>Status: <strong className="text-text-primary">{latestPassport.overallRunGuardStatus}</strong></span>
            <span>Savings Delta: <strong className="text-nvidia-green">${latestPassport.finopsSummary.deltaSavingsUsd.toFixed(2)}</strong></span>
          </div>
        </div>
      )}
    </div>
  );
};
