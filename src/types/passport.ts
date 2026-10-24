import { PreflightReport, CheckResult, Finding, ProposedPatch, CheckStatus } from "./runguard";
import { FinOpsComparisonResult, FinOpsCalculationResult } from "./finops";

export interface EvidenceCitation {
  title: string;
  url: string;
  snippet: string;
  relevanceScore?: number;
}

export interface DiagnosticInvestigation {
  modelUsed: string;
  querySummary: string;
  likelyRootCause: string;
  alternativeExplanations: string[];
  confidenceAssessment: string;
  citations: EvidenceCitation[];
  sanitizedLogSample: string;
  diagnosticTimestamp: string;
}

export interface RunCostPassport {
  id: string;
  schemaVersion: "1.0.0";
  title: string;
  createdAt: string;
  targetEnvironment: {
    projectName: string;
    targetGpu: string;
    gpuCount: number;
    nebiusModel: string;
    sanitizedBaseUrl: string;
  };
  overallRunGuardStatus: CheckStatus;
  preflightChecks: CheckResult[];
  diagnosticInvestigation?: DiagnosticInvestigation;
  proposedPatch?: ProposedPatch;
  finopsSummary: {
    baselineCostUsd: number;
    proposedCostUsd: number;
    deltaSavingsUsd: number;
    percentageSavings: number;
    assumptions: string[];
    priceSources: {
      label: string;
      rate: number;
      unit: string;
      sourceUrl: string;
      lastVerifiedDate: string;
    }[];
  };
  unresolvedRisks: string[];
  auditTrail: {
    step: string;
    actor: "SYSTEM_DETERMINISTIC" | "NEBIUS_NVIDIA_LLM" | "TAVILY_SEARCH" | "USER_APPROVAL";
    timestamp: string;
    details: string;
  }[];
}
