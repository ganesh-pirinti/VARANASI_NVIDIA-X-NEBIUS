"use client";

import React, { useState } from "react";
import { 
  FileText, 
  Download, 
  Copy, 
  Check, 
  ShieldCheck, 
  ExternalLink,
  Code
} from "lucide-react";
import { RunCostPassport } from "@/types/passport";
import { StatusBadge } from "../ui/StatusBadge";

interface PassportTabProps {
  passport: RunCostPassport | null;
  onGeneratePassport: () => Promise<void>;
  isGenerating: boolean;
}

export const PassportTab: React.FC<PassportTabProps> = ({
  passport,
  onGeneratePassport,
  isGenerating,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeView, setActiveView] = useState<"visual" | "json">("visual");

  const handleDownloadHtml = async () => {
    if (!passport) return;
    try {
      const res = await fetch("/api/passport", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectName: passport.targetEnvironment.projectName,
          targetGpu: passport.targetEnvironment.targetGpu,
          gpuCount: passport.targetEnvironment.gpuCount,
          preflightReport: {
            overallStatus: passport.overallRunGuardStatus,
            checks: passport.preflightChecks,
            findings: [],
            unresolvedRisks: passport.unresolvedRisks,
            suggestedPatch: passport.proposedPatch,
          },
          diagnosticResult: passport.diagnosticInvestigation
            ? {
                success: true,
                modelUsed: passport.diagnosticInvestigation.modelUsed,
                parsedResponse: {
                  likelyRootCause: passport.diagnosticInvestigation.likelyRootCause,
                  alternativeExplanations: passport.diagnosticInvestigation.alternativeExplanations,
                  actionPlan: [],
                },
              }
            : undefined,
          citations: passport.diagnosticInvestigation?.citations,
          fallbackFinops: {
            totalCostUsd: passport.finopsSummary.baselineCostUsd,
            assumptions: passport.finopsSummary.assumptions,
            priceSources: passport.finopsSummary.priceSources,
          },
          proposedPatch: passport.proposedPatch,
          format: "html",
        }),
      });

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `VARANASI-Passport-${passport.id}.html`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Failed to export HTML passport.");
    }
  };

  const handleDownloadJson = () => {
    if (!passport) return;
    const blob = new Blob([JSON.stringify(passport, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `VARANASI-Passport-${passport.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyJson = () => {
    if (!passport) return;
    navigator.clipboard.writeText(JSON.stringify(passport, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!passport) {
    return (
      <div className="rounded-2xl border border-border-standard bg-surface-card p-12 text-center space-y-4 shadow-card">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-elevated text-nvidia-green border border-border-standard shadow-sm">
          <FileText className="h-7 w-7" />
        </div>
        <h3 className="text-base font-bold text-text-primary">Run &amp; Cost Passport Not Assembled</h3>
        <p className="text-xs text-text-secondary max-w-md mx-auto leading-relaxed">
          The Run &amp; Cost Passport unifies preflight findings, runtime test results, live documentation citations, patch approval states, and FinOps cost formulas into a certified audit manifest.
        </p>
        <button
          onClick={onGeneratePassport}
          disabled={isGenerating}
          className="mt-2 inline-flex items-center gap-2 rounded-xl bg-nvidia-green px-6 py-3 text-xs font-bold text-app hover:bg-nvidia-light disabled:opacity-50 transition shadow-nvidia-glow"
        >
          <FileText className="h-4 w-4 text-app" />
          <span>{isGenerating ? "Compiling Passport..." : "Assemble Run & Cost Passport"}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Passport Header & Export Action Bar */}
      <div className="rounded-2xl border border-border-standard bg-surface-card p-6 space-y-5 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-subtle pb-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-base font-bold text-text-primary">{passport.title}</h2>
              <StatusBadge status={passport.overallRunGuardStatus} size="lg" />
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-text-muted mt-1.5 font-mono">
              <span>ID: <code className="text-text-primary font-mono">{passport.id}</code></span>
              <span>•</span>
              <span>Timestamp: {passport.createdAt}</span>
              <span>•</span>
              <span>Target: <strong className="text-text-primary">{passport.targetEnvironment.targetGpu}</strong></span>
            </div>
          </div>

          {/* Export Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleDownloadHtml}
              className="flex items-center gap-2 rounded-xl bg-nvidia-green px-4 py-2.5 text-xs font-bold text-app hover:bg-nvidia-light transition shadow-nvidia-glow"
              title="Download self-contained HTML audit report"
            >
              <Download className="h-3.5 w-3.5 text-app" />
              <span>Download HTML</span>
            </button>
            <button
              onClick={handleDownloadJson}
              className="flex items-center gap-2 rounded-xl border border-border-standard bg-surface-elevated px-4 py-2.5 text-xs font-semibold text-text-primary hover:bg-surface-card hover:border-nvidia-green transition shadow-sm"
              title="Download structured JSON"
            >
              <Download className="h-3.5 w-3.5 text-text-muted" />
              <span>JSON</span>
            </button>
            <button
              onClick={handleCopyJson}
              className="flex items-center gap-2 rounded-xl border border-border-standard bg-surface-elevated px-4 py-2.5 text-xs font-semibold text-text-primary hover:bg-surface-card hover:border-nvidia-green transition shadow-sm"
              title="Copy JSON to clipboard"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-nvidia-green" /> : <Copy className="h-3.5 w-3.5 text-text-muted" />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>
          </div>
        </div>

        {/* View Switcher: Formatted Visual vs Raw JSON */}
        <div className="flex items-center space-x-2 text-xs">
          <button
            onClick={() => setActiveView("visual")}
            className={`rounded-lg px-3.5 py-1.5 font-semibold transition ${
              activeView === "visual"
                ? "bg-nvidia-surface text-nvidia-green border border-nvidia-border shadow-sm"
                : "text-text-muted hover:text-text-primary"
            }`}
          >
            Formatted Audit View
          </button>
          <button
            onClick={() => setActiveView("json")}
            className={`rounded-lg px-3.5 py-1.5 font-semibold transition ${
              activeView === "json"
                ? "bg-nvidia-surface text-nvidia-green border border-nvidia-border shadow-sm"
                : "text-text-muted hover:text-text-primary"
            }`}
          >
            Structured JSON Schema
          </button>
        </div>
      </div>

      {activeView === "visual" ? (
        <div className="space-y-6">
          {/* Section 1: Preflight Results */}
          <div className="rounded-2xl border border-border-standard bg-surface-card p-6 space-y-4 shadow-card">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary">
              1. Deterministic Validation State
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-elevated text-[11px] text-text-muted uppercase tracking-wider border-b border-border-subtle">
                  <tr>
                    <th className="py-3 px-4">Check</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Summary</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {passport.preflightChecks.map((c) => (
                    <tr key={c.id} className="hover:bg-surface-elevated/40 transition">
                      <td className="py-3 px-4 font-semibold text-text-primary">{c.name}</td>
                      <td className="py-3 px-4 font-mono text-[11px]">
                        {c.isRuntimeTest ? (
                          <span className="text-nvidia-green font-semibold">Runtime Test</span>
                        ) : (
                          <span className="text-text-muted">Static Check</span>
                        )}
                      </td>
                      <td className="py-3 px-4"><StatusBadge status={c.status} /></td>
                      <td className="py-3 px-4 text-text-secondary leading-relaxed">{c.summary}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 2: FinOps Margin Sizing */}
          <div className="rounded-2xl border border-border-standard bg-surface-card p-6 space-y-4 shadow-card">
            <h3 className="text-xs font-bold uppercase tracking-wider text-nvidia-green">
              2. FinOps Margin &amp; Cost Sizing Summary
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
              <div className="rounded-xl border border-border-subtle bg-surface-input p-4">
                <div className="text-[10px] text-text-muted uppercase">Baseline Spend</div>
                <div className="text-sm font-bold text-text-primary mt-1">
                  ${passport.finopsSummary.baselineCostUsd.toFixed(2)} USD
                </div>
              </div>
              <div className="rounded-xl border border-border-subtle bg-surface-input p-4">
                <div className="text-[10px] text-text-muted uppercase">Proposed Spend</div>
                <div className="text-sm font-bold text-text-primary mt-1">
                  ${passport.finopsSummary.proposedCostUsd.toFixed(2)} USD
                </div>
              </div>
              <div className="rounded-xl border border-border-subtle bg-surface-input p-4">
                <div className="text-[10px] text-text-muted uppercase">Margin Delta (&Delta;C)</div>
                <div className="text-sm font-bold text-nvidia-green mt-1">
                  ${passport.finopsSummary.deltaSavingsUsd.toFixed(2)} USD
                </div>
              </div>
              <div className="rounded-xl border border-border-subtle bg-surface-input p-4">
                <div className="text-[10px] text-text-muted uppercase">Cost Reduction %</div>
                <div className="text-sm font-bold text-nvidia-green mt-1">
                  {passport.finopsSummary.percentageSavings.toFixed(1)}%
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Diagnostic Investigation & Documentation Evidence */}
          {passport.diagnosticInvestigation && (
            <div className="rounded-2xl border border-border-standard bg-surface-card p-6 space-y-4 shadow-card">
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary">
                3. NVIDIA Nemotron AI Diagnostic Reasoning
              </h3>
              <div className="rounded-xl border border-border-subtle bg-surface-input p-4 text-xs text-text-primary leading-relaxed border-l-4 border-l-nvidia-green">
                <div className="text-[10px] uppercase font-bold text-text-muted mb-1">Likely Root Cause</div>
                {passport.diagnosticInvestigation.likelyRootCause}
              </div>

              {passport.diagnosticInvestigation.citations.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="text-xs font-semibold text-text-muted">
                    Retrieved Documentation Citations ({passport.diagnosticInvestigation.citations.length}):
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {passport.diagnosticInvestigation.citations.map((cite, idx) => (
                      <div key={idx} className="rounded-xl border border-border-subtle bg-surface-input p-3.5">
                        <a
                          href={cite.url}
                          target="_blank"
                          rel="noreferrer"
                          className="font-bold text-text-primary hover:text-nvidia-green hover:underline flex items-center gap-1.5"
                        >
                          <span className="truncate">{cite.title}</span>
                          <ExternalLink className="h-3 w-3 shrink-0" />
                        </a>
                        <p className="text-[11px] text-text-secondary mt-1.5 line-clamp-2 leading-relaxed">{cite.snippet}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Section 4: Audit Trail */}
          <div className="rounded-2xl border border-border-standard bg-surface-card p-6 space-y-4 shadow-card">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary">
              4. Audit Trail &amp; Chain of Custody
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-surface-elevated text-[11px] text-text-muted uppercase tracking-wider border-b border-border-subtle">
                  <tr>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Step</th>
                    <th className="py-3 px-4">Actor</th>
                    <th className="py-3 px-4">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {passport.auditTrail.map((at, idx) => (
                    <tr key={idx} className="hover:bg-surface-elevated/40 transition">
                      <td className="py-3 px-4 text-text-muted text-[11px]">{at.timestamp}</td>
                      <td className="py-3 px-4 text-text-primary font-bold">{at.step}</td>
                      <td className="py-3 px-4 text-text-primary font-semibold">{at.actor}</td>
                      <td className="py-3 px-4 text-text-secondary font-sans leading-relaxed">{at.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-border-standard bg-surface-input p-5 font-mono text-xs overflow-x-auto max-h-[600px] shadow-card">
          <pre className="text-text-secondary leading-relaxed">
            {JSON.stringify(passport, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};
