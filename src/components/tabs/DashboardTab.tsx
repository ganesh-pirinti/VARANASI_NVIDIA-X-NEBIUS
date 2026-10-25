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
import { LiveStaleBadge } from "../ui/LiveStaleBadge";
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
    <div className="space-y-6 animate-fade-in">
      {/* Active Demonstration Banner if a scenario is loaded */}
      {loadedFixture && (
        <div className="rounded-[12px] border border-status-warning/40 bg-[#FEF3C7] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-card animate-fade-in">
          <div className="flex items-start sm:items-center gap-2.5">
            <FlaskConical className="h-5 w-5 text-status-warning shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <div className="text-[13px] font-bold text-text-primary flex items-center gap-2">
                <span>ACTIVE DEMONSTRATION FIXTURE:</span>
                <span className="text-status-warning font-mono">{loadedFixture.name}</span>
              </div>
              <p className="text-[12px] text-text-secondary mt-0.5 leading-[1.5]">
                Workload data and cost figures reflect synthetic failure signatures and verified cloud pricing for evaluation purposes. Not live production telemetry.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono uppercase font-bold tracking-wider px-2.5 py-1 rounded-[4px] bg-white text-status-warning border border-status-warning/30 shrink-0 self-end sm:self-auto shadow-sm">
            Simulated Benchmark
          </span>
        </div>
      )}

      {/* Hero Banner with refined warm cream gradient and NVIDIA accent line */}
      <div className="relative overflow-hidden rounded-[14px] border border-border-standard bg-gradient-to-br from-surface-card via-[#F9F7F1] to-nvidia-surface/30 p-6 sm:p-8 shadow-card hover:shadow-card-hover hover:border-border-hover transition-all duration-300">
        {/* Subtle decorative circuit pattern / accent bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-nvidia-green via-nvidia-muted to-gold"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-nvidia-green/30 bg-nvidia-surface px-3 py-1 text-[12px] font-semibold text-nvidia-dark shadow-sm">
              <span className="h-2 w-2 rounded-full bg-nvidia-green animate-pulse-gently"></span>
              <span>Nebius × NVIDIA Global AI Hackathon 2026</span>
              <span className="text-[10px] text-gold font-bold uppercase tracking-wider ml-1 bg-gold-surface px-1.5 py-0.5 rounded border border-gold/30">Official</span>
            </div>
            <h1 className="text-[30px] sm:text-[34px] font-bold leading-[1.2] tracking-[-0.8px] text-text-primary">
              VARANASI RunGuard &amp; FinOps Margin Engine
            </h1>
            <p className="text-[14px] font-normal leading-[1.6] text-text-secondary">
              Catch preventable AI workload failures before cluster deployment and analyze GPU &amp; inference margins with deterministic rigor. Powered by Nebius Token Factory and NVIDIA open-source models.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1 text-[12px] text-text-muted font-medium">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-nvidia-green"></span>
                Deterministic Preflight Core
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-gold"></span>
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
              className="flex items-center gap-2 h-10 px-4 rounded-[6px] bg-nvidia-green text-white text-[14px] font-semibold hover:bg-nvidia-hover active:scale-[0.98] transition-all duration-150 shadow-card focus:outline-none focus:ring-2 focus:ring-nvidia-green focus:ring-offset-2"
            >
              <ShieldAlert className="h-4 w-4 text-white" />
              <span>Inspect Workload</span>
            </button>
            <button
              onClick={() => setActiveTab("finops")}
              className="flex items-center gap-2 h-10 px-4 rounded-[6px] bg-surface-card border border-border-standard text-text-primary text-[14px] font-semibold hover:bg-surface-secondary hover:border-border-hover active:scale-[0.98] transition-all duration-150 shadow-card"
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
        <div className="enterprise-card space-y-4 animate-fade-in-up stagger-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-[8px] bg-nvidia-surface p-2.5 text-nvidia-dark border border-nvidia-green/30 shadow-sm">
                <ShieldAlert className="h-5 w-5 text-nvidia-green" />
              </div>
              <div>
                <h3 className="text-[17px] font-semibold leading-[1.4] text-text-primary">GPU RunGuard</h3>
                <p className="text-[13px] font-normal leading-[1.5] text-text-secondary">Preflight &amp; Runtime Integrity</p>
              </div>
            </div>
            {preflightReport ? (
              <StatusBadge status={preflightReport.overallStatus} />
            ) : (
              <span className="text-[11px] font-mono text-text-muted bg-surface-secondary px-2 py-0.5 rounded-[4px] border border-border-subtle">AWAITING INPUT</span>
            )}
          </div>

          {preflightReport ? (
            <div className="space-y-2 border-t border-border-subtle pt-3">
              {loadedFixture && (
                <div className="text-[11px] font-mono text-status-warning uppercase tracking-wider mb-1 flex items-center gap-1 font-semibold">
                  <span>Simulated Fixture Data</span>
                </div>
              )}
              <div className="flex justify-between text-[13px]">
                <span className="text-text-secondary">Total Checks Evaluated:</span>
                <span className="font-semibold text-text-primary font-mono tabular-nums">{preflightReport.checks.length}</span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="text-text-secondary">Identified Findings:</span>
                <span className={`font-semibold font-mono tabular-nums ${preflightReport.findings.length > 0 ? "text-status-error" : "text-nvidia-dark"}`}>
                  {preflightReport.findings.length}
                </span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="text-text-secondary">VRAM Allocation:</span>
                <span className="font-semibold text-text-primary font-mono tabular-nums">
                  {preflightReport.vramEstimate ? `${preflightReport.vramEstimate.totalEstimatedVramGb} GiB/GPU` : "Unspecified"}
                </span>
              </div>
              <button
                onClick={() => setActiveTab("runguard")}
                className="mt-2.5 flex items-center gap-1.5 text-[13px] text-nvidia-dark hover:text-nvidia-hover font-semibold transition"
              >
                <span>View Full Inspection Table</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="border-t border-border-subtle pt-3 text-[13px] text-text-secondary leading-[1.5] space-y-2">
              <p>No configuration files analyzed yet.</p>
              <button
                onClick={() => setActiveTab("runguard")}
                className="inline-flex items-center gap-1 text-[13px] text-nvidia-dark font-semibold hover:underline"
              >
                <span>Run Preflight Checks</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>

        {/* Module 2: FinOps Margin Engine */}
        <div className="enterprise-card space-y-4 animate-fade-in-up stagger-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-[8px] bg-nvidia-surface p-2.5 text-nvidia-dark border border-nvidia-green/30 shadow-sm">
                <DollarSign className="h-5 w-5 text-nvidia-green" />
              </div>
              <div>
                <h3 className="text-[17px] font-semibold leading-[1.4] text-text-primary">FinOps Engine</h3>
                <p className="text-[13px] font-normal leading-[1.5] text-text-secondary">Compute &amp; Token Margin</p>
              </div>
            </div>
            {finopsComparison ? (
              <span className={`rounded-[4px] border px-2 py-0.5 text-[12px] font-bold font-mono transition-all duration-300 ${
                finopsComparison.isSavingsVerified
                  ? "bg-nvidia-surface border-nvidia-green/40 text-nvidia-dark"
                  : "bg-[#FEF3C7] border-status-warning/30 text-status-warning"
              }`}>
                {finopsComparison.percentageDifference >= 0 ? `-${finopsComparison.percentageDifference.toFixed(0)}%` : `+${Math.abs(finopsComparison.percentageDifference).toFixed(0)}%`}
                {!finopsComparison.isSavingsVerified && " (Est)"}
              </span>
            ) : (
              <span className="text-[11px] font-mono text-text-muted bg-surface-secondary px-2 py-0.5 rounded-[4px] border border-border-subtle">AWAITING CALCULATION</span>
            )}
          </div>

          {finopsComparison ? (
            <div className="space-y-2 border-t border-border-subtle pt-3">
              {loadedFixture && (
                <div className="text-[11px] font-mono text-status-warning uppercase tracking-wider mb-1 flex items-center gap-1 font-semibold">
                  <span>Simulated Scenario Rates</span>
                </div>
              )}
              <div className="flex justify-between text-[13px]">
                <span className="text-text-secondary">Baseline Cost:</span>
                <span className="font-semibold text-text-primary font-mono tabular-nums">${finopsComparison.baseline.totalCostUsd.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="text-text-secondary">Proposed Cost:</span>
                <span className="font-semibold text-text-primary font-mono tabular-nums">${finopsComparison.proposed.totalCostUsd.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span className="text-text-secondary">Projected Delta (&Delta;C):</span>
                <span className={`font-semibold font-mono tabular-nums ${finopsComparison.deltaCostUsd >= 0 ? "text-nvidia-dark" : "text-status-error"}`}>
                  {finopsComparison.deltaCostUsd >= 0 ? "+" : ""}${finopsComparison.deltaCostUsd.toFixed(2)} USD
                </span>
              </div>
              <div className="text-[11px] text-text-muted pt-1">
                Notice: Projected savings assume equivalent throughput. Not realized savings.
              </div>
              <button
                onClick={() => setActiveTab("finops")}
                className="mt-1.5 flex items-center gap-1.5 text-[13px] text-nvidia-dark hover:text-nvidia-hover font-semibold transition"
              >
                <span>Explore Cost Scenarios</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : finopsSingle ? (
            <div className="space-y-2 border-t border-border-subtle pt-3">
              <div className="flex justify-between text-[13px]">
                <span className="text-text-secondary">Workload Total Spend:</span>
                <span className="font-bold text-text-primary font-mono tabular-nums">${finopsSingle.totalCostUsd.toFixed(2)} USD</span>
              </div>
              <button
                onClick={() => setActiveTab("finops")}
                className="mt-2.5 flex items-center gap-1.5 text-[13px] text-nvidia-dark hover:text-nvidia-hover font-semibold transition"
              >
                <span>Compare Against Alternative</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="border-t border-border-subtle pt-3 text-[13px] text-text-secondary leading-[1.5] space-y-2">
              <p>No cost models computed yet. Configure GPU hours or token volume to estimate compute budget.</p>
              <button
                onClick={() => setActiveTab("finops")}
                className="inline-flex items-center gap-1 text-[13px] text-nvidia-dark font-semibold hover:underline"
              >
                <span>Launch FinOps Calculator</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>

        {/* Module 3: Active Integrations */}
        <div className="enterprise-card space-y-4 animate-fade-in-up stagger-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-[8px] bg-nvidia-surface p-2.5 text-nvidia-dark border border-nvidia-green/30 shadow-sm">
                <Cpu className="h-5 w-5 text-nvidia-green" />
              </div>
              <div>
                <h3 className="text-[17px] font-semibold leading-[1.4] text-text-primary">AI Integrations</h3>
                <p className="text-[13px] font-normal leading-[1.5] text-text-secondary">NVIDIA Model &amp; Search State</p>
              </div>
            </div>
          </div>

          <div className="space-y-3 border-t border-border-subtle pt-3 text-[13px]">
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">Nebius Token Factory:</span>
              <span
                className={`font-mono font-semibold px-2 py-0.5 rounded-[4px] text-[11px] transition-all duration-200 ${
                  systemStatus?.nebiusStatus === "CONNECTED"
                    ? systemStatus.nebiusIsStale
                      ? "bg-[#FEF3C7] text-text-primary border border-status-warning/40"
                      : "bg-nvidia-surface text-nvidia-dark border border-nvidia-green/30"
                    : systemStatus?.nebiusStatus === "CHECKING" || !systemStatus
                    ? "bg-[#FEF3C7] text-status-warning border border-status-warning/30 animate-pulse"
                    : systemStatus?.nebiusStatus === "CONFIGURED"
                    ? "bg-surface-secondary text-text-secondary border border-border-standard"
                    : systemStatus?.nebiusStatus === "STALE" || systemStatus?.nebiusStatus === "RATE_LIMITED" || systemStatus?.nebiusStatus === "DEGRADED"
                    ? "bg-[#FEF3C7] text-text-primary border border-status-warning/40"
                    : systemStatus?.nebiusStatus === "FAILED"
                    ? "bg-[#FEE2E2] text-status-error border border-status-error/30"
                    : "bg-surface-secondary text-text-muted border border-border-standard"
                }`}
              >
                {!systemStatus || systemStatus.nebiusStatus === "CHECKING"
                  ? "CHECKING..."
                  : systemStatus.nebiusStatus === "CONNECTED"
                  ? "CONNECTED"
                  : systemStatus.nebiusStatus === "STALE"
                  ? (
                    <span className="inline-flex items-center gap-1">
                      <span>STALE</span>
                      <LiveStaleBadge
                        timestamp={systemStatus.nebiusStaleTimestamp}
                        fallbackStorageKey="varanasi_nebius_verified"
                        className="bg-transparent border-none p-0 text-[10px] text-text-primary font-normal lowercase tracking-normal"
                      />
                    </span>
                  )
                  : systemStatus.nebiusStatus === "RATE_LIMITED"
                  ? "RATE LIMITED"
                  : systemStatus.nebiusStatus}
              </span>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">NVIDIA Model:</span>
                {systemStatus?.nebiusModelAvailable && (
                  <span className="text-[11px] text-nvidia-dark font-mono font-medium">Catalogue Verified</span>
                )}
              </div>
              <div
                className="text-text-primary font-mono text-[12px] mt-1 truncate bg-surface-secondary p-2 rounded-[6px] border border-border-subtle"
                title={systemStatus?.nebiusModel}
              >
                {systemStatus?.nebiusModel || "nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B"}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">Tavily Technical Search:</span>
              <span
                className={`font-mono font-semibold px-2 py-0.5 rounded-[4px] text-[11px] transition-all duration-200 ${
                  systemStatus?.tavilyStatus === "CONNECTED"
                    ? "bg-nvidia-surface text-nvidia-dark border border-nvidia-green/30"
                    : systemStatus?.tavilyStatus === "CHECKING" || !systemStatus
                    ? "bg-[#FEF3C7] text-status-warning border border-status-warning/30 animate-pulse"
                    : systemStatus?.tavilyStatus === "CONFIGURED"
                    ? "bg-surface-secondary text-text-secondary border border-border-standard"
                    : systemStatus?.tavilyStatus === "STALE" || systemStatus?.tavilyStatus === "RATE_LIMITED" || systemStatus?.tavilyStatus === "DEGRADED"
                    ? "bg-[#FEF3C7] text-text-primary border border-status-warning/40"
                    : systemStatus?.tavilyStatus === "FAILED"
                    ? "bg-[#FEE2E2] text-status-error border border-status-error/30"
                    : "bg-surface-secondary text-text-muted border border-border-standard"
                }`}
              >
                {!systemStatus || systemStatus.tavilyStatus === "CHECKING"
                  ? "CHECKING..."
                  : systemStatus.tavilyStatus === "CONNECTED"
                  ? "CONNECTED"
                  : systemStatus.tavilyStatus === "STALE"
                  ? (
                    <span className="inline-flex items-center gap-1">
                      <span>STALE</span>
                      <LiveStaleBadge
                        timestamp={systemStatus.tavilyStaleTimestamp}
                        fallbackStorageKey="varanasi_tavily_verified"
                        className="bg-transparent border-none p-0 text-[10px] text-text-primary font-normal lowercase tracking-normal"
                      />
                    </span>
                  )
                  : systemStatus.tavilyStatus === "RATE_LIMITED"
                  ? "RATE LIMITED"
                  : systemStatus.tavilyStatus}
              </span>
            </div>

            <button
              onClick={() => setActiveTab("diagnose")}
              className="mt-2.5 flex items-center gap-1.5 text-[13px] text-nvidia-dark hover:text-nvidia-hover font-semibold transition"
            >
              <span>Launch Live Investigation</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Demonstration Fixture Quick Launcher */}
      <div className="enterprise-card space-y-4 animate-fade-in-up stagger-4">
        <div>
          <h3 className="text-[17px] font-semibold leading-[1.4] text-text-primary flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-nvidia-green" />
            <span>Built-in Demonstration Scenarios (Judges Evaluation Suite)</span>
          </h3>
          <p className="text-[13px] font-normal leading-[1.5] text-text-secondary mt-1">
            Test VARANASI without supplying custom cluster files. All fixtures use authentic failure signatures and verified cloud GPU pricing.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {DEMO_FIXTURES.map((fixture) => (
            <button
              key={fixture.id}
              onClick={() => onSelectFixture(fixture)}
              className={`flex flex-col text-left rounded-[8px] border p-4 transition-all duration-200 group shadow-sm active:scale-[0.98] ${
                loadedFixture?.id === fixture.id
                  ? "border-nvidia-green bg-nvidia-surface/40 ring-1 ring-nvidia-green"
                  : "border-border-standard bg-surface-card hover:border-border-hover hover:bg-surface-secondary"
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-[13px] font-bold text-text-primary group-hover:text-nvidia-dark transition-colors">
                  {fixture.name}
                </span>
                {loadedFixture?.id === fixture.id && (
                  <span className="h-2 w-2 rounded-full bg-nvidia-green shrink-0 shadow-sm" />
                )}
              </div>
              <div className="text-[12px] text-text-secondary mt-1.5 line-clamp-2 leading-[1.5]">
                {fixture.tagline}
              </div>
              <div className="mt-3 text-[11px] font-mono text-nvidia-dark group-hover:underline flex items-center gap-1 font-semibold">
                <span>{loadedFixture?.id === fixture.id ? "Currently Active Fixture" : "Load Simulated Fixture"}</span>
                <ArrowRight className="h-3 w-3" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Latest Run & Cost Passport Preview */}
      {latestPassport && (
        <div className="enterprise-card space-y-3 animate-fade-in-up">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <FileText className="h-5 w-5 text-nvidia-green" />
              <h3 className="text-[17px] font-semibold leading-[1.4] text-text-primary">
                Latest Generated Passport: {latestPassport.title}
              </h3>
            </div>
            <button
              onClick={() => setActiveTab("passport")}
              className="text-[13px] font-semibold text-nvidia-dark hover:text-nvidia-hover flex items-center gap-1 transition"
            >
              <span>Open Passport</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-[12px] text-text-secondary font-mono bg-surface-secondary p-3.5 rounded-[8px] border border-border-subtle">
            <span>ID: <code className="text-text-primary font-bold">{latestPassport.id}</code></span>
            <span>Target: <strong className="text-text-primary">{latestPassport.targetEnvironment.targetGpu}</strong></span>
            <span>Status: <strong className="text-text-primary">{latestPassport.overallRunGuardStatus}</strong></span>
            <span>Savings Delta: <strong className="text-nvidia-dark">${latestPassport.finopsSummary.deltaSavingsUsd.toFixed(2)}</strong></span>
          </div>
        </div>
      )}
    </div>
  );
};
