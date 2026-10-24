"use client";

import React from "react";
import { 
  Sparkles, 
  Search, 
  Cpu, 
  ExternalLink, 
  AlertCircle, 
  CheckCircle2, 
  ShieldAlert, 
  RefreshCw,
  HelpCircle,
  FileCode,
  ArrowRight
} from "lucide-react";
import { DiagnoseResponse } from "@/types/api";
import { SystemStatusResponse } from "@/types/api";
import { CitationCard } from "../ui/CitationCard";

interface DiagnoseTabProps {
  diagnoseResult: DiagnoseResponse | null;
  onRunDiagnosis: () => Promise<void>;
  isLoading: boolean;
  systemStatus: SystemStatusResponse | null;
  setActiveTab: (tab: string) => void;
}

export const DiagnoseTab: React.FC<DiagnoseTabProps> = ({
  diagnoseResult,
  onRunDiagnosis,
  isLoading,
  systemStatus,
  setActiveTab,
}) => {
  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-xl border border-navy-800 bg-navy-900/80 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-navy-800 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-cyan-400" />
              <span>Diagnose & Investigate — NVIDIA Nemotron & Tavily Search</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Deep contextual root-cause reasoning executed on Nebius Token Factory with real-time documentation retrieval via Tavily Search.
            </p>
          </div>

          <button
            onClick={onRunDiagnosis}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 px-5 py-2.5 text-xs font-bold text-navy-950 hover:from-cyan-400 hover:to-blue-400 disabled:opacity-50 transition shadow-lg shadow-cyan-500/20 shrink-0"
          >
            {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            <span>{isLoading ? "Investigating..." : "Launch Real-Time Investigation"}</span>
          </button>
        </div>

        {/* Integration Status Checks */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
          <div className="rounded border border-navy-750 bg-navy-950 p-3 flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase text-slate-500 font-sans">Nebius Token Factory</div>
              <div className="text-slate-200 mt-0.5 font-semibold">
                {systemStatus?.nebiusConfigured ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Key Verified ({systemStatus.nebiusModel})
                  </span>
                ) : (
                  <span className="text-amber-400 flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    NEBIUS_API_KEY Not Set
                  </span>
                )}
              </div>
            </div>
            <div className="text-[11px] text-slate-500">
              OpenAI /v1 API
            </div>
          </div>

          <div className="rounded border border-navy-750 bg-navy-950 p-3 flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase text-slate-500 font-sans">Tavily Technical Search</div>
              <div className="text-slate-200 mt-0.5 font-semibold">
                {systemStatus?.tavilyConfigured ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Live Documentation Query Ready
                  </span>
                ) : (
                  <span className="text-amber-400 flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    TAVILY_API_KEY Not Set
                  </span>
                )}
              </div>
            </div>
            <div className="text-[11px] text-slate-500">
              Technical Domains
            </div>
          </div>
        </div>
      </div>

      {/* Honest Empty State / Missing Credentials Guidance */}
      {!diagnoseResult && !isLoading && (
        <div className="rounded-xl border border-navy-800 bg-navy-900/50 p-8 text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-navy-800 text-cyan-400">
            <Sparkles className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-200">No Investigation Active</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            Configure your workload trace in the <strong>GPU RunGuard</strong> tab or click <strong>Launch Real-Time Investigation</strong> above. The system transmits only sanitized failure signatures with secrets redacted.
          </p>
          {(!systemStatus?.nebiusConfigured || !systemStatus?.tavilyConfigured) && (
            <div className="mt-4 inline-block rounded-lg border border-amber-500/30 bg-amber-950/20 p-3 text-xs text-amber-300 text-left max-w-lg">
              <div className="font-bold flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4 text-amber-400 shrink-0" />
                API Credentials Note
              </div>
              <div className="mt-1 text-[11px] text-amber-300/80 leading-relaxed">
                Add <code>NEBIUS_API_KEY</code> and <code>TAVILY_API_KEY</code> to your <code>.env.local</code> file to enable live runtime model calls. If omitted, the application will transparently report the configuration state rather than fabricating synthetic LLM responses.
              </div>
            </div>
          )}
        </div>
      )}

      {/* Investigation Results */}
      {diagnoseResult && (
        <div className="space-y-6">
          {/* Error Banner if API Call Encountered Error */}
          {diagnoseResult.error && (
            <div className="rounded-lg border border-amber-500/40 bg-amber-950/30 p-4 text-xs text-amber-200 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold">Diagnostic Service Report:</strong>
                <p className="mt-1 text-[11px] text-amber-200/90 leading-relaxed font-mono">
                  {diagnoseResult.error}
                </p>
              </div>
            </div>
          )}

          {/* Model Root Cause Card */}
          <div className="rounded-xl border border-navy-800 bg-navy-900/80 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-navy-800 pb-3">
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4 text-cyan-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  NVIDIA Nemotron Technical Diagnosis
                </h3>
              </div>
              <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
                <span>Model: <strong className="text-slate-200">{diagnoseResult.modelUsed}</strong></span>
                <span>Sanitized Tokens: {diagnoseResult.sanitizedTokensProcessed}</span>
              </div>
            </div>

            {/* Likely Root Cause */}
            <div className="space-y-2">
              <div className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
                Likely Root Cause
              </div>
              <div className="rounded-lg border border-navy-750 bg-navy-950 p-4 text-xs font-sans text-slate-200 leading-relaxed border-l-4 border-l-cyan-500">
                {diagnoseResult.likelyRootCause}
              </div>
            </div>

            {/* Alternative Explanations */}
            {diagnoseResult.alternativeExplanations.length > 0 && (
              <div className="space-y-2">
                <div className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
                  Alternative Hypotheses & Edge Cases
                </div>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {diagnoseResult.alternativeExplanations.map((alt, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-cyan-400 font-bold">•</span>
                      <span>{alt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Plan */}
            {diagnoseResult.suggestedActionPlan.length > 0 && (
              <div className="space-y-2">
                <div className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
                  Recommended Engineering Remediation Plan
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {diagnoseResult.suggestedActionPlan.map((step, idx) => (
                    <div key={idx} className="rounded border border-navy-750 bg-navy-950/60 p-3 text-xs text-slate-300">
                      <span className="font-mono text-cyan-400 font-bold mr-1">0{idx + 1}.</span> {step}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Uncertainty Notice */}
            <div className="border-t border-navy-800/80 pt-3 text-[11px] text-slate-500 flex items-center gap-2">
              <ShieldAlert className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              <span>
                <strong>Verification Boundary:</strong> LLM reasoning provides consultative explanations and does not substitute for deterministic unit tests or hardware memory validation.
              </span>
            </div>
          </div>

          {/* Tavily Technical Search Citations */}
          <div className="rounded-xl border border-navy-800 bg-navy-900/80 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-navy-800 pb-3">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-cyan-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Live Technical Sources & Documentation Citations ({diagnoseResult.citations.length})
                </h3>
              </div>
              <span className="text-[11px] text-slate-400">
                Grounding Evidence from PyTorch, NVIDIA, & GitHub
              </span>
            </div>

            {diagnoseResult.citations.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {diagnoseResult.citations.map((cite, idx) => (
                  <CitationCard key={idx} citation={cite} />
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-500 py-3 text-center">
                No citations retrieved. Ensure <code>TAVILY_API_KEY</code> is configured.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
