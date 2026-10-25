import { EvidenceCitation } from "./passport";

export type IntegrationState =
  | "NOT_CONFIGURED"
  | "CONFIGURED"
  | "CHECKING"
  | "CONNECTED"
  | "RATE_LIMITED"
  | "DEGRADED"
  | "FAILED"
  | "UNKNOWN";

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
  nebiusStatus: IntegrationState;
  nebiusBaseUrl: string;
  nebiusModel: string;
  nebiusModelAvailable: boolean;
  nebiusError?: string;
  nebiusStatusCode?: number;
  nebiusIsStale?: boolean;
  nebiusStaleTimestamp?: string;
  tavilyConfigured: boolean;
  tavilyStatus: IntegrationState;
  tavilyError?: string;
  tavilyStatusCode?: number;
  tavilySearchAvailable?: boolean;
  tavilyIsStale?: boolean;
  tavilyStaleTimestamp?: string;
  appVersion: string;
  environment: string;
  checkedAt?: string;
}
