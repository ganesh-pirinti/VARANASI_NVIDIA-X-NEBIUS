import { EvidenceCitation } from "./passport";

export interface DiagnoseRequest {
  diagnosticLog: string;
  dockerfileContent?: string;
  workloadConfigContent?: string;
  projectName?: string;
  targetGpu?: string;
}

export interface DiagnoseResponse {
  success: boolean;
  modelUsed: string;
  likelyRootCause: string;
  alternativeExplanations: string[];
  suggestedActionPlan: string[];
  suggestedPatch?: {
    targetFile: string;
    originalSnippet: string;
    proposedPatchSnippet: string;
    explanation: string;
  };
  citations: EvidenceCitation[];
  sanitizedTokensProcessed: number;
  error?: string;
}

export interface TavilySearchRequest {
  query: string;
  maxResults?: number;
}

export interface TavilySearchResponse {
  success: boolean;
  query: string;
  citations: EvidenceCitation[];
  error?: string;
}

export interface SystemStatusResponse {
  nebiusConfigured: boolean;
  nebiusBaseUrl: string;
  nebiusModel: string;
  tavilyConfigured: boolean;
  appVersion: string;
  environment: string;
}
