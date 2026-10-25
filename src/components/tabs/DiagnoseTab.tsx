"use client";

import React from "react";
import { 
  Sparkles, 
  Search, 
  Cpu, 
  AlertCircle, 
  CheckCircle2, 
  ShieldAlert, 
  RefreshCw,
  Info
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
      <div className="rounded-2xl border border-border-standard bg-surface-card p-6 space-y-5 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-subtle pb-4">
          <div>
            <h2 className="text-base font-bold text-text-primary flex items-center gap-2.5">
              <Sparkles className="h-5 w-5 text-nebius-cyan" />
              <span>Diagnose &amp; Investigate — NVIDIA Nemotron &amp; Tavily Search</span>
            </h2>
            <p className="text-xs text-text-muted mt-1 leading-relaxed">
              Deep contextual root-cause reasoning executed on Nebius Token Factory with real-time technical documentation retrieval via Tavily Search.
            </p>
          </div>

          <button
            onClick={onRunDiagnosis}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-nebius-cyan to-nebius-blue px-6 py-3 text-xs font-bold text-app hover:from-nebius-soft hover:to-nebius-cyan disabled:opacity-50 transition shadow-nebius-glow shrink-0"
          >
            {isLoading ? <RefreshCw className="h-4 w-4 animate-spin text-app" /> : <Sparkles className="h-4 w-4 text-app" />}
            <span>{isLoading ? "Investigating..." : "Launch Real-Time Investigation"}</span>
          </button>
        </div>

        {/* Integration Status Checks */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
          <div className="rounded-xl border border-border-subtle bg-surface-input p-4 flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase text-text-muted font-sans font-semibold">Nebius Token Factory</div>
              <div className="text-text-primary mt-1 font-semibold">
                {systemStatus?.nebiusConfigured ? (
                  <span className="text-nvidia-green flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-nvidia-green" />
                    Key Verified ({systemStatus.nebiusModel?.split("/")[1] || "Nemotron-70B"})
                  </span>
                ) : (
                  <span className="text-status-warning flex items-center gap-1.5">
                    <AlertCircle className="h-4 w-4 text-status-warning" />
                    NEBIUS_API_KEY Not Set
                  </span>
                )}
              </div>
            </div>
            <div className="text-[11px] text-text-muted font-mono">
              OpenAI /v1 API
            </div>
          </div>

          <div className="rounded-xl border border-border-subtle bg-surface-input p-4 flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase text-text-muted font-sans font-semibold">Tavily Technical Search</div>
              <div className="text-text-primary mt-1 font-semibold">
                {systemStatus?.tavilyConfigured ? (
                  <span className="text-nvidia-green flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-nvidia-green" />
                    Live Documentation Query Ready
                  </span>
                ) : (
                  <span className="text-status-warning flex items-center gap-1.5">
                    <AlertCircle className="h-4 w-4 text-status-warning" />
                    TAVILY_API_KEY Not Set
                  </span>
                )}
              </div>
            </div>
            <div className="text-[11px] text-text-muted font-mono">
              Technical Domains
            </div>
          </div>
        </div>
      </div>

      {/* Honest Empty State / Missing Credentials Guidance */}
      {!diagnoseResult && !isLoading && (
        <div className="rounded-2xl border border-border-standard bg-surface-card p-10 text-center space-y-4 shadow-card">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-elevated text-nebius-cyan border border-border-standard shadow-sm">
            <Sparkles className="h-7 w-7" />
          </div>
          <h3 className="text-base font-bold text-text-primary">No Active Investigation</h3>
          <p className="text-xs text-text-secondary max-w-lg mx-auto leading-relaxed">
            Configure your workload trace in the <strong>GPU RunGuard</strong> tab or click <strong>Launch Real-Time Investigation</strong> above. The system transmits only sanitized failure signatures with secrets automatically redacted.
          </p>
          {(!systemStatus?.nebiusConfigured || !systemStatus?.tavilyConfigured) && (
            <div className="mt-4 inline-block rounded-xl border border-status-warning/40 bg-status-warning/10 p-4 text-xs text-status-warning text-left max-w-xl">
              <div className="font-bold flex items-center gap-2 text-status-warning">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>API Credentials Configuration Note</span>
              </div>
              <div className="mt-1.5 text-[11px] text-text-secondary leading-relaxed">
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
            <div className="rounded-xl border border-status-warning/40 bg-status-warning/10 p-4 text-xs text-status-warning flex items-start gap-3 shadow-sm">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold text-text-primary">Diagnostic Service Report:</strong>
                <p className="mt-1 text-[11px] text-text-secondary leading-relaxed font-mono">
                  {diagnoseResult.error}
                </p>
              </div>
            </div>
          )}

          {/* Model Root Cause Card */}
          <div className="rounded-2xl border border-border-standard bg-surface-card p-6 space-y-5 shadow-card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-subtle pb-4">
              <div className="flex items-center gap-2.5">
                <Cpu className="h-4 w-4 text-nebius-cyan" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary">
                  NVIDIA Nemotron Technical Diagnosis
                </h3>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-text-muted">
                <span>Model: <strong className="text-text-primary">{diagnoseResult.modelUsed}</strong></span>
                <span>•</span>
                <span>Sanitized Tokens: <strong className="text-nebius-cyan">{diagnoseResult.sanitizedTokensProcessed}</strong></span>
              </div>
            </div>

            {/* Likely Root Cause */}
            <div className="space-y-2">
              <div className="text-[11px] uppercase font-bold text-text-muted tracking-wider">
                Likely Root Cause
              </div>
              <div className="rounded-xl border border-border-subtle bg-surface-input p-4 text-xs font-sans text-text-primary leading-relaxed border-l-4 border-l-nebius-cyan">
                {diagnoseResult.likelyRootCause}
              </div>
            </div>

            {/* Alternative Explanations */}
            {diagnoseResult.alternativeExplanations.length > 0 && (
              <div className="space-y-2.5">
                <div className="text-[11px] uppercase font-bold text-text-muted tracking-wider">
                  Alternative Hypotheses &amp; Edge Cases
                </div>
                <ul className="space-y-2 text-xs text-text-secondary">
                  {diagnoseResult.alternativeExplanations.map((alt, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <span className="text-nebius-cyan font-bold">•</span>
                      <span>{alt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Plan */}
            {diagnoseResult.suggestedActionPlan.length > 0 && (
              <div className="space-y-2.5">
                <div className="text-[11px] uppercase font-bold text-text-muted tracking-wider">
                  Recommended Engineering Remediation Plan
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {diagnoseResult.suggestedActionPlan.map((step, idx) => (
                    <div key={idx} className="rounded-xl border border-border-subtle bg-surface-input p-4 text-xs text-text-secondary leading-relaxed">
                      <span className="font-mono text-nebius-cyan font-bold mr-1.5">0{idx + 1}.</span> {step}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Uncertainty Notice */}
            <div className="border-t border-border-subtle pt-3.5 text-[11px] text-text-muted flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-status-warning shrink-0" />
              <span>
                <strong className="text-text-primary">Verification Boundary:</strong> LLM reasoning provides consultative explanations and does not substitute for deterministic unit tests or hardware memory validation.
              </span>
            </div>
          </div>

          {/* Tavily Technical Search Citations */}
          <div className="rounded-2xl border border-border-standard bg-surface-card p-6 space-y-4 shadow-card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border-subtle pb-4 gap-2">
              <div className="flex items-center gap-2.5">
                <Search className="h-4 w-4 text-nebius-cyan" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-primary">
                  Live Technical Sources &amp; Documentation Citations ({diagnoseResult.citations.length})
                </h3>
              </div>
              <span className="text-[11px] text-text-muted">
                Grounding Evidence from PyTorch, NVIDIA, &amp; Official Docs
              </span>
            </div>

            {diagnoseResult.citations.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {diagnoseResult.citations.map((cite, idx) => (
                  <CitationCard key={idx} citation={cite} />
                ))}
              </div>
            ) : (
              <div className="text-xs text-text-muted py-6 text-center">
                No citations retrieved. Ensure <code>TAVILY_API_KEY</code> is configured in <code>.env.local</code>.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
