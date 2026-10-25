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
  RotateCw,
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
  onRefreshStatus?: () => void;
  isRefreshingStatus?: boolean;
}

export const DiagnoseTab: React.FC<DiagnoseTabProps> = ({
  diagnoseResult,
  onRunDiagnosis,
  isLoading,
  systemStatus,
  setActiveTab,
  onRefreshStatus,
  isRefreshingStatus = false,
}) => {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner */}
      <div className="enterprise-card space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-subtle pb-4">
          <div>
            <h2 className="text-[24px] font-[650] leading-[1.3] text-text-primary flex items-center gap-2.5">
              <Sparkles className="h-6 w-6 text-nvidia-green" />
              <span>Diagnose &amp; Investigate — NVIDIA Nemotron &amp; Tavily Search</span>
            </h2>
            <p className="text-[13px] font-normal leading-[1.5] text-text-secondary mt-1">
              Deep contextual root-cause reasoning executed on Nebius Token Factory with real-time technical documentation retrieval via Tavily Search.
            </p>
          </div>

          <button
            onClick={onRunDiagnosis}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 h-10 px-4 rounded-[6px] bg-nvidia-green text-white text-[14px] font-semibold hover:bg-nvidia-hover active:scale-[0.98] disabled:opacity-50 transition-all duration-150 shadow-card focus:outline-none focus:ring-2 focus:ring-nvidia-green focus:ring-offset-2 shrink-0"
          >
            {isLoading ? <RefreshCw className="h-4 w-4 animate-spin text-white" /> : <Sparkles className="h-4 w-4 text-white" />}
            <span>{isLoading ? "Investigating..." : "Launch Real-Time Investigation"}</span>
          </button>
        </div>

        {/* Integration Status Checks */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] font-mono text-text-secondary">
            <span className="uppercase tracking-wider font-semibold">Live Integration Health &amp; Reachability</span>
            {onRefreshStatus && (
              <button
                onClick={onRefreshStatus}
                disabled={isRefreshingStatus}
                className="flex items-center gap-1.5 text-nvidia-dark hover:text-nvidia-hover font-sans text-[12px] font-semibold transition disabled:opacity-50"
                title="Verify real-time API reachability"
              >
                <RotateCw className={`h-3 w-3 ${isRefreshingStatus ? "animate-spin text-nvidia-green" : ""}`} />
                <span>{isRefreshingStatus ? "Pinging APIs..." : "Ping APIs"}</span>
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
          <div className="rounded-[8px] border border-border-subtle bg-surface-secondary p-4 flex items-center justify-between">
            <div>
              <div className="text-[11px] uppercase text-text-secondary font-sans font-semibold">Nebius Token Factory</div>
              <div className="text-text-primary mt-1 font-semibold text-[13px]">
                {!systemStatus || systemStatus.nebiusStatus === "CHECKING" ? (
                  <span className="text-status-warning flex items-center gap-1.5 font-sans">
                    <RefreshCw className="h-4 w-4 animate-spin text-status-warning" />
                    Checking Nebius...
                  </span>
                ) : systemStatus.nebiusStatus === "CONNECTED" ? (
                  <span className="text-nvidia-dark flex items-center gap-1.5 font-sans" title={systemStatus.nebiusError}>
                    <CheckCircle2 className={`h-4 w-4 ${systemStatus.nebiusIsStale ? "text-status-warning" : "text-nvidia-green"}`} />
                    <span>Connected ({systemStatus.nebiusModel})</span>
                    {systemStatus.nebiusIsStale && (
                      <span className="text-[10px] font-mono font-bold bg-[#FEF3C7] text-status-warning px-1.5 py-0.5 rounded border border-status-warning/30">
                        STALE ({systemStatus.nebiusStaleTimestamp ? new Date(systemStatus.nebiusStaleTimestamp).toLocaleTimeString() : ""})
                      </span>
                    )}
                  </span>
                ) : systemStatus.nebiusStatus === "CONFIGURED" ? (
                  <span className="text-text-secondary flex items-center gap-1.5 font-sans" title={systemStatus.nebiusError}>
                    <CheckCircle2 className="h-4 w-4 text-text-secondary" />
                    Configured ({systemStatus.nebiusModel})
                  </span>
                ) : systemStatus.nebiusStatus === "FAILED" ? (
                  <span className="text-status-error flex items-center gap-1.5 font-sans" title={systemStatus.nebiusError}>
                    <AlertCircle className="h-4 w-4 text-status-error" />
                    Failed: {systemStatus.nebiusError?.slice(0, 30) || "Auth Error"}...
                  </span>
                ) : (
                  <span className="text-status-warning flex items-center gap-1.5 font-sans">
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

          <div className="rounded-[8px] border border-border-subtle bg-surface-secondary p-4 flex items-center justify-between">
            <div>
              <div className="text-[11px] uppercase text-text-secondary font-sans font-semibold">Tavily Technical Search</div>
              <div className="text-text-primary mt-1 font-semibold text-[13px]">
                {!systemStatus || systemStatus.tavilyStatus === "CHECKING" ? (
                  <span className="text-status-warning flex items-center gap-1.5 font-sans">
                    <RefreshCw className="h-4 w-4 animate-spin text-status-warning" />
                    Checking Tavily...
                  </span>
                ) : systemStatus.tavilyStatus === "CONNECTED" ? (
                  <span className="text-nvidia-dark flex items-center gap-1.5 font-sans" title={systemStatus.tavilyError}>
                    <CheckCircle2 className={`h-4 w-4 ${systemStatus.tavilyIsStale ? "text-status-warning" : "text-nvidia-green"}`} />
                    <span>Search Endpoint Live &amp; Verified</span>
                    {systemStatus.tavilyIsStale && (
                      <span className="text-[10px] font-mono font-bold bg-[#FEF3C7] text-status-warning px-1.5 py-0.5 rounded border border-status-warning/30">
                        STALE ({systemStatus.tavilyStaleTimestamp ? new Date(systemStatus.tavilyStaleTimestamp).toLocaleTimeString() : ""})
                      </span>
                    )}
                  </span>
                ) : systemStatus.tavilyStatus === "CONFIGURED" ? (
                  <span className="text-text-secondary flex items-center gap-1.5 font-sans" title={systemStatus.tavilyError}>
                    <CheckCircle2 className="h-4 w-4 text-text-secondary" />
                    Key Configured (tvly-...)
                  </span>
                ) : systemStatus.tavilyStatus === "FAILED" ? (
                  <span className="text-status-error flex items-center gap-1.5 font-sans" title={systemStatus.tavilyError}>
                    <AlertCircle className="h-4 w-4 text-status-error" />
                    Failed: {systemStatus.tavilyError?.slice(0, 30) || "Search Error"}...
                  </span>
                ) : (
                  <span className="text-status-warning flex items-center gap-1.5 font-sans">
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
    </div>

      {/* Honest Empty State / Missing Credentials Guidance */}
      {!diagnoseResult && !isLoading && (
        <div className="rounded-[12px] border border-border-standard bg-white p-10 text-center space-y-4 shadow-card hover:border-border-hover transition">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[8px] bg-nvidia-surface text-nvidia-green border border-nvidia-green/30 shadow-sm">
            <Sparkles className="h-7 w-7 text-nvidia-green" />
          </div>
          <h3 className="text-[17px] font-semibold leading-[1.4] text-text-primary">No Active Investigation</h3>
          <p className="text-[13px] text-text-secondary max-w-lg mx-auto leading-[1.5]">
            Configure your workload trace in the <strong>GPU RunGuard</strong> tab or click <strong>Launch Real-Time Investigation</strong> above. The system transmits only sanitized failure signatures with secrets automatically redacted.
          </p>
          {(!systemStatus?.nebiusConfigured || !systemStatus?.tavilyConfigured) && (
            <div className="mt-4 inline-block rounded-[8px] border border-status-warning/30 bg-[#FEF3C7] p-4 text-[13px] text-status-warning text-left max-w-xl">
              <div className="font-bold flex items-center gap-2 text-status-warning">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>API Credentials Configuration Note</span>
              </div>
              <div className="mt-1.5 text-[12px] text-text-secondary leading-[1.5]">
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
            <div className="rounded-[8px] border border-status-warning/30 bg-[#FEF3C7] p-4 text-[13px] text-status-warning flex items-start gap-3 shadow-sm">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold text-text-primary">Diagnostic Service Report:</strong>
                <p className="mt-1 text-[12px] text-text-secondary leading-relaxed font-mono">
                  {diagnoseResult.error}
                </p>
              </div>
            </div>
          )}

          {/* Model Root Cause Card */}
          <div className="rounded-[12px] border border-border-standard bg-white p-5 space-y-5 shadow-card hover:border-border-hover transition">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-subtle pb-4">
              <div className="flex items-center gap-2.5">
                <Cpu className="h-5 w-5 text-nvidia-green" />
                <h3 className="text-[17px] font-semibold leading-[1.4] text-text-primary">
                  NVIDIA Nemotron Technical Diagnosis
                </h3>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-[12px] font-mono text-text-secondary">
                <span>Model: <strong className="text-text-primary">{diagnoseResult.modelUsed}</strong></span>
                <span>•</span>
                <span>Sanitized Tokens: <strong className="text-text-primary">{diagnoseResult.sanitizedTokensProcessed}</strong></span>
              </div>
            </div>

            {/* Likely Root Cause */}
            <div className="space-y-2">
              <div className="text-[12px] font-semibold text-text-secondary uppercase tracking-wider">
                Likely Root Cause
              </div>
              <div className="rounded-[8px] border border-border-subtle bg-surface-secondary p-4 text-[13px] font-sans text-text-primary leading-[1.5] border-l-4 border-l-nvidia-green">
                {diagnoseResult.likelyRootCause}
              </div>
            </div>

            {/* Alternative Explanations */}
            {diagnoseResult.alternativeExplanations.length > 0 && (
              <div className="space-y-2.5">
                <div className="text-[12px] font-semibold text-text-secondary uppercase tracking-wider">
                  Alternative Hypotheses &amp; Edge Cases
                </div>
                <ul className="space-y-2 text-[13px] text-text-secondary">
                  {diagnoseResult.alternativeExplanations.map((alt, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <span className="text-nvidia-dark font-bold">•</span>
                      <span>{alt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Plan */}
            {diagnoseResult.suggestedActionPlan.length > 0 && (
              <div className="space-y-2.5">
                <div className="text-[12px] font-semibold text-text-secondary uppercase tracking-wider">
                  Recommended Engineering Remediation Plan
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {diagnoseResult.suggestedActionPlan.map((step, idx) => (
                    <div key={idx} className="rounded-[8px] border border-border-subtle bg-surface-secondary p-4 text-[13px] text-text-secondary leading-[1.5]">
                      <span className="font-mono text-nvidia-dark font-bold mr-1.5">0{idx + 1}.</span> {step}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Uncertainty Notice */}
            <div className="border-t border-border-subtle pt-3.5 text-[12px] text-text-secondary flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-status-warning shrink-0" />
              <span>
                <strong className="text-text-primary">Verification Boundary:</strong> LLM reasoning provides consultative explanations and does not substitute for deterministic unit tests or hardware memory validation.
              </span>
            </div>
          </div>

          {/* Tavily Technical Search Citations */}
          <div className="rounded-[12px] border border-border-standard bg-white p-5 space-y-4 shadow-card hover:border-border-hover transition">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border-subtle pb-4 gap-2">
              <div className="flex items-center gap-2.5">
                <Search className="h-5 w-5 text-nvidia-green" />
                <h3 className="text-[17px] font-semibold leading-[1.4] text-text-primary">
                  Live Technical Sources &amp; Documentation Citations ({diagnoseResult.citations.length})
                </h3>
              </div>
              <span className="text-[12px] text-text-secondary">
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
              <div className="text-[13px] text-text-secondary py-6 text-center">
                No citations retrieved. Ensure <code>TAVILY_API_KEY</code> is configured in <code>.env.local</code>.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
