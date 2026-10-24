"use client";

import React, { useState } from "react";
import { 
  FileText, 
  Download, 
  Copy, 
  Check, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
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
    } catch (err) {
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
      <div className="rounded-xl border border-navy-800 bg-navy-900/50 p-12 text-center space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-navy-800 text-cyan-400">
          <FileText className="h-7 w-7" />
        </div>
        <h3 className="text-base font-bold text-slate-200">Run & Cost Passport Not Assembled</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
          The Run & Cost Passport unifies preflight findings, runtime test results, live documentation citations, patch approval states, and FinOps cost formulas into a certified audit manifest.
        </p>
        <button
          onClick={onGeneratePassport}
          disabled={isGenerating}
          className="mt-2 inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-5 py-2.5 text-xs font-bold text-navy-950 hover:bg-cyan-400 disabled:opacity-50 transition shadow-lg shadow-cyan-500/20"
        >
          <FileText className="h-4 w-4" />
          <span>{isGenerating ? "Compiling Passport..." : "Assemble Run & Cost Passport"}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Passport Header & Export Action Bar */}
      <div className="rounded-xl border border-navy-800 bg-navy-900/80 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-navy-800 pb-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-base font-bold text-slate-100">{passport.title}</h2>
              <StatusBadge status={passport.overallRunGuardStatus} size="lg" />
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1 font-mono">
              <span>ID: <code className="text-cyan-300">{passport.id}</code></span>
              <span>•</span>
              <span>Timestamp: {passport.createdAt}</span>
              <span>•</span>
              <span>Target: {passport.targetEnvironment.targetGpu}</span>
            </div>
          </div>

          {/* Export Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleDownloadHtml}
              className="flex items-center gap-1.5 rounded-lg bg-cyan-500 px-3.5 py-2 text-xs font-bold text-navy-950 hover:bg-cyan-400 transition shadow-lg shadow-cyan-500/20"
              title="Download self-contained HTML audit report"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download HTML</span>
            </button>
            <button
              onClick={handleDownloadJson}
              className="flex items-center gap-1.5 rounded-lg border border-navy-700 bg-navy-800 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-navy-750 transition"
              title="Download structured JSON"
            >
              <Download className="h-3.5 w-3.5" />
              <span>JSON</span>
            </button>
            <button
              onClick={handleCopyJson}
              className="flex items-center gap-1.5 rounded-lg border border-navy-700 bg-navy-800 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-navy-750 transition"
              title="Copy JSON to clipboard"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>
          </div>
        </div>

        {/* View Switcher: Formatted Visual vs Raw JSON */}
        <div className="flex items-center space-x-2 text-xs">
          <button
            onClick={() => setActiveView("visual")}
            className={`rounded px-3 py-1 font-semibold transition ${
              activeView === "visual"
                ? "bg-navy-800 text-cyan-300 border border-navy-700"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Formatted Audit View
          </button>
          <button
            onClick={() => setActiveView("json")}
            className={`rounded px-3 py-1 font-semibold transition ${
              activeView === "json"
                ? "bg-navy-800 text-cyan-300 border border-navy-700"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Structured JSON Schema
          </button>
        </div>
      </div>

      {activeView === "visual" ? (
        <div className="space-y-6">
          {/* Section 1: Preflight Results */}
          <div className="rounded-xl border border-navy-800 bg-navy-900/80 p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
              1. Deterministic Validation State
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-navy-950/80 text-[11px] text-slate-400 uppercase">
                  <tr>
                    <th className="p-2.5">Check</th>
                    <th className="p-2.5">Type</th>
                    <th className="p-2.5">Status</th>
                    <th className="p-2.5">Summary</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-800">
                  {passport.preflightChecks.map((c) => (
                    <tr key={c.id}>
                      <td className="p-2.5 font-semibold text-slate-200">{c.name}</td>
                      <td className="p-2.5 font-mono text-[11px]">
                        {c.isRuntimeTest ? (
                          <span className="text-cyan-400 font-semibold">Runtime Test</span>
                        ) : (
                          <span className="text-slate-400">Static Check</span>
                        )}
                      </td>
                      <td className="p-2.5"><StatusBadge status={c.status} /></td>
                      <td className="p-2.5 text-slate-300">{c.summary}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 2: FinOps Margin Sizing */}
          <div className="rounded-xl border border-navy-800 bg-navy-900/80 p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              2. FinOps Margin & Cost Sizing Summary
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="rounded border border-navy-750 bg-navy-950 p-3">
                <div className="text-[10px] text-slate-500">Baseline Cost</div>
                <div className="text-sm font-bold text-slate-200 mt-1">
                  ${passport.finopsSummary.baselineCostUsd.toFixed(2)} USD
                </div>
              </div>
              <div className="rounded border border-navy-750 bg-navy-950 p-3">
                <div className="text-[10px] text-slate-500">Proposed Cost</div>
                <div className="text-sm font-bold text-cyan-300 mt-1">
                  ${passport.finopsSummary.proposedCostUsd.toFixed(2)} USD
                </div>
              </div>
              <div className="rounded border border-navy-750 bg-navy-950 p-3">
                <div className="text-[10px] text-slate-500">Margin Delta (&Delta;C)</div>
                <div className="text-sm font-bold text-emerald-400 mt-1">
                  ${passport.finopsSummary.deltaSavingsUsd.toFixed(2)} USD
                </div>
              </div>
              <div className="rounded border border-navy-750 bg-navy-950 p-3">
                <div className="text-[10px] text-slate-500">Cost Reduction %</div>
                <div className="text-sm font-bold text-emerald-400 mt-1">
                  {passport.finopsSummary.percentageSavings.toFixed(1)}%
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Diagnostic Investigation & Documentation Evidence */}
          {passport.diagnosticInvestigation && (
            <div className="rounded-xl border border-navy-800 bg-navy-900/80 p-5 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                3. NVIDIA Nemotron AI Diagnostic Reasoning
              </h3>
              <div className="rounded-lg border border-navy-750 bg-navy-950 p-4 text-xs text-slate-200 leading-relaxed border-l-4 border-l-cyan-500">
                <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Likely Root Cause</div>
                {passport.diagnosticInvestigation.likelyRootCause}
              </div>

              {passport.diagnosticInvestigation.citations.length > 0 && (
                <div className="space-y-2 pt-2">
                  <div className="text-xs font-semibold text-slate-400">
                    Retrieved Documentation Citations ({passport.diagnosticInvestigation.citations.length}):
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {passport.diagnosticInvestigation.citations.map((cite, idx) => (
                      <div key={idx} className="rounded border border-navy-750 bg-navy-950 p-3">
                        <a
                          href={cite.url}
                          target="_blank"
                          rel="noreferrer"
                          className="font-bold text-cyan-400 hover:underline flex items-center gap-1"
                        >
                          <span className="truncate">{cite.title}</span>
                          <ExternalLink className="h-3 w-3 shrink-0" />
                        </a>
                        <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{cite.snippet}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Section 4: Audit Trail */}
          <div className="rounded-xl border border-navy-800 bg-navy-900/80 p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              4. Audit Trail & Chain of Custody
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-navy-950/80 text-[11px] text-slate-400 uppercase">
                  <tr>
                    <th className="p-2.5">Timestamp</th>
                    <th className="p-2.5">Step</th>
                    <th className="p-2.5">Actor</th>
                    <th className="p-2.5">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-800">
                  {passport.auditTrail.map((at, idx) => (
                    <tr key={idx}>
                      <td className="p-2.5 text-slate-500 text-[11px]">{at.timestamp}</td>
                      <td className="p-2.5 text-slate-200 font-bold">{at.step}</td>
                      <td className="p-2.5 text-cyan-400">{at.actor}</td>
                      <td className="p-2.5 text-slate-300 font-sans">{at.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-navy-800 bg-navy-950 p-4 font-mono text-xs overflow-x-auto max-h-[600px]">
          <pre className="text-slate-300 leading-relaxed">
            {JSON.stringify(passport, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};
