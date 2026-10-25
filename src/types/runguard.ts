export type CheckStatus = "PASS" | "FAIL" | "UNKNOWN" | "RUNNING" | "NOT_TESTED";
export type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";
export type CheckCategory = 
  | "DOCKER_CONTAINER"
  | "DEPENDENCIES_CUDA"
  | "WORKLOAD_RESOURCES"
  | "SHARED_MEMORY"
  | "DISTRIBUTED_COMMUNICATION"
  | "VRAM_CAPACITY"
  | "STATIC_SYNTAX"
  | "CUSTOM_RULE";

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
  isActionable?: boolean;
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
  ruleDetails?: string;
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

export interface CustomValidationRule {
  id: string;
  name: string;
  category: CheckCategory;
  field: "vram_allocated_gib" | "batch_size" | "context_length" | "gpu_count" | "shm_size_gib" | "dockerfile_content" | "requirements_content" | "log_content";
  operator: ">" | "<" | ">=" | "<=" | "==" | "!=" | "contains" | "missing";
  threshold: string;
  severity: Severity;
  description: string;
  recommendedFix: string;
  isEnabled: boolean;
}

export interface CustomWorkloadConfig {
  id: string;
  name: string;
  description?: string;
  targetGpu: string;
  gpuCount: number;
  modelName?: string;
  estimatedModelParamsBillion?: number;
  precision?: "FP32" | "FP16" | "BF16" | "FP8" | "INT4";
  contextLengthTokens?: number;
  batchSize?: number;
  pythonVersion?: string;
  dockerfileContent?: string;
  requirementsContent?: string;
  workloadConfigContent?: string;
  diagnosticLogContent?: string;
  slaConstraintHours?: number;
  budgetConstraintUsd?: number;
  createdAt: string;
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
  customRules?: CustomValidationRule[];
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
