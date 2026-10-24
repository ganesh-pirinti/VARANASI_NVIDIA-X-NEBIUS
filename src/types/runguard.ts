export type CheckStatus = "PASS" | "FAIL" | "UNKNOWN";
export type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";
export type CheckCategory = 
  | "DOCKER_CONTAINER"
  | "DEPENDENCIES_CUDA"
  | "WORKLOAD_RESOURCES"
  | "SHARED_MEMORY"
  | "DISTRIBUTED_COMMUNICATION"
  | "VRAM_CAPACITY"
  | "STATIC_SYNTAX";

export interface Finding {
  id: string;
  category: CheckCategory;
  severity: Severity;
  title: string;
  description: string;
  evidence: string;
  fileContext?: string;
  recommendedFix: string;
  ruleReference?: string;
}

export interface CheckResult {
  id: string;
  name: string;
  category: CheckCategory;
  status: CheckStatus;
  isRuntimeTest: boolean; // Explicitly distinguishes static checks from actual runtime tests
  summary: string;
  findings: Finding[];
  checkedAt: string;
}

export interface VramEstimate {
  modelParamsBillion: number;
  precision: "FP32" | "FP16" | "BF16" | "FP8" | "INT4";
  contextLengthTokens: number;
  batchSize: number;
  numLayers?: number;
  hiddenDimension?: number;
  numAttentionHeads?: number;
  weightMemoryGb: number;
  kvCacheMemoryGb: number;
  runtimeOverheadGb: number;
  totalEstimatedVramGb: number;
  gpuMemoryAvailableGb: number;
  gpuCount: number;
  isFeasible: boolean;
  notes: string[];
}

export interface PreflightInputs {
  projectName: string;
  targetGpu: string;
  gpuCount: number;
  dockerfileContent?: string;
  requirementsContent?: string;
  workloadConfigContent?: string;
  diagnosticLogContent?: string;
  estimatedModelParamsBillion?: number;
  precision?: "FP32" | "FP16" | "BF16" | "FP8" | "INT4";
  contextLengthTokens?: number;
  batchSize?: number;
}

export interface PreflightReport {
  id: string;
  projectName: string;
  timestamp: string;
  overallStatus: CheckStatus;
  checks: CheckResult[];
  findings: Finding[];
  vramEstimate?: VramEstimate;
  suggestedPatch?: ProposedPatch;
  unresolvedRisks: string[];
}

export interface ProposedPatch {
  id: string;
  title: string;
  targetFile: string;
  originalContent: string;
  patchedContent: string;
  diff: string;
  explanation: string[];
  status: "GENERATED" | "APPROVED" | "APPLIED" | "RE_VERIFIED";
  createdAt: string;
  approvedAt?: string;
  verifiedAt?: string;
}
