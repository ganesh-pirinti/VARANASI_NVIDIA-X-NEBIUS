import { z } from "zod";

/**
 * Deterministic Zod Schemas and Request Validators
 * Enforces payload limits, data types, and mandatory security tokens.
 */

export const DiagnoseRequestSchema = z
  .object({
    diagnosticLog: z
      .string()
      .max(500000, "Diagnostic log exceeds maximum allowed size (500,000 chars)")
      .optional()
      .default(""),
    dockerfileContent: z
      .string()
      .max(100000, "Dockerfile content exceeds maximum allowed size (100,000 chars)")
      .optional(),
    workloadConfigContent: z
      .string()
      .max(100000, "Workload config content exceeds maximum allowed size (100,000 chars)")
      .optional(),
    projectName: z
      .string()
      .max(200, "Project name exceeds maximum length (200 chars)")
      .optional()
      .default("Unnamed Workload"),
    targetGpu: z
      .string()
      .max(100, "Target GPU identifier exceeds maximum length (100 chars)")
      .optional()
      .default("nebius-h100-sxm"),
    turnstileToken: z
      .string()
      .min(1, "Security verification token must not be empty."),
  })
  .refine(
    (data) => {
      const hasLog = Boolean(data.diagnosticLog && data.diagnosticLog.trim().length > 0);
      const hasDocker = Boolean(data.dockerfileContent && data.dockerfileContent.trim().length > 0);
      const hasConfig = Boolean(data.workloadConfigContent && data.workloadConfigContent.trim().length > 0);
      return hasLog || hasDocker || hasConfig;
    },
    {
      message: "At least one log trace or configuration file is required for investigation.",
      path: ["diagnosticLog"],
    }
  );

export const TavilySearchRequestSchema = z.object({
  query: z
    .string()
    .trim()
    .min(1, "Search query must not be empty.")
    .max(500, "Search query exceeds maximum length (500 chars)."),
  maxResults: z
    .number()
    .int()
    .min(1, "maxResults must be at least 1")
    .max(10, "maxResults cannot exceed 10")
    .optional()
    .default(4),
  turnstileToken: z
    .string()
    .min(1, "Security verification token must not be empty."),
});

export type ValidatedDiagnoseRequest = z.infer<typeof DiagnoseRequestSchema>;
export type ValidatedTavilySearchRequest = z.infer<typeof TavilySearchRequestSchema>;

const GpuWorkloadInputSchema = z.object({
  gpuId: z.string().max(100),
  gpuCount: z.number().int().min(1).max(1024),
  billedHours: z.number().min(0).max(87600),
  pricingModel: z.enum(["on-demand", "preemptible"]).optional(),
  billingUnit: z.enum(["GPU-hour", "instance-hour"]).optional(),
  customHourlyRateUsd: z.number().min(0).optional().nullable(),
  storageGb: z.number().min(0).optional(),
  storageRatePerGbMonthUsd: z.number().min(0).optional(),
  networkEgressGb: z.number().min(0).optional(),
  networkEgressRatePerGbUsd: z.number().min(0).optional(),
});

const ModelInferenceInputSchema = z.object({
  modelName: z.string().max(100),
  inputTokensMillion: z.number().min(0).max(100000),
  outputTokensMillion: z.number().min(0).max(100000),
  inputTokenRatePerMillionUsd: z.number().min(0).optional().nullable(),
  outputTokenRatePerMillionUsd: z.number().min(0).optional().nullable(),
  requestCount: z.number().min(0).optional(),
  rateSourceUrl: z.string().max(300).optional(),
  lastVerifiedDate: z.string().max(50).optional(),
  isRateVerified: z.boolean().optional(),
});

export const FinOpsCalculateRequestSchema = z.object({
  baselineGpu: GpuWorkloadInputSchema.optional(),
  baselineModel: ModelInferenceInputSchema.optional(),
  proposedGpu: GpuWorkloadInputSchema.optional(),
  proposedModel: ModelInferenceInputSchema.optional(),
  context: z
    .object({
      baselineGpuId: z.string().max(100).optional(),
      proposedGpuId: z.string().max(100).optional(),
      baselinePrecision: z.string().max(30).optional(),
      proposedPrecision: z.string().max(30).optional(),
      modelParamBillion: z.number().min(0).max(2000).optional(),
      isEmpiricallyBenchmarked: z.boolean().optional(),
    })
    .optional(),
});

export const PreflightRequestSchema = z.object({
  dockerfileContent: z.string().max(2000000).optional(),
  requirementsContent: z.string().max(2000000).optional(),
  workloadConfigContent: z.string().max(2000000).optional(),
  diagnosticLogContent: z.string().max(3000000).optional(),
  projectName: z.string().max(200).optional(),
  targetGpu: z.string().max(100).optional(),
  gpuCount: z.number().int().min(1).max(1024).optional(),
  precision: z.string().max(30).optional(),
  contextLengthTokens: z.number().min(1).max(1000000).optional(),
  batchSize: z.number().min(1).max(100000).optional(),
  customRules: z.array(z.any()).max(50).optional(),
});

export const PassportRequestSchema = z.object({
  projectName: z.string().max(200).optional(),
  targetGpu: z.string().max(100).optional(),
  gpuCount: z.number().int().min(1).max(1024).optional(),
  format: z.enum(["json", "html"]).optional().default("json"),
  preflightReport: z.any().optional(),
  diagnosticResult: z.any().optional(),
  citations: z.array(z.any()).max(50).optional(),
  finopsComparison: z.any().optional(),
  fallbackFinops: z.any().optional(),
  proposedPatch: z.any().optional(),
});

/**
 * Strict Schema for Model-Generated Diagnostic Responses from Nebius / Nemotron.
 * Prevents trusting unvalidated model outputs.
 */
export const NebiusDiagnosticOutputSchema = z.object({
  likelyRootCause: z
    .string()
    .min(5, "Root cause must be at least 5 characters.")
    .max(1000, "Root cause exceeds maximum length of 1000 characters."),
  alternativeExplanations: z
    .array(z.string().min(3).max(500))
    .min(1, "At least one alternative explanation is required.")
    .max(10, "Cannot exceed 10 alternative explanations."),
  actionPlan: z
    .array(z.string().min(3).max(500))
    .min(1, "At least one action plan step is required.")
    .max(10, "Cannot exceed 10 action plan steps."),
  suggestedPatch: z
    .object({
      targetFile: z.string().min(1).max(250),
      originalSnippet: z.string().max(10000),
      proposedPatchSnippet: z.string().max(10000),
      explanation: z.string().max(1000),
    })
    .optional(),
});

export type ValidatedNebiusDiagnosticOutput = z.infer<typeof NebiusDiagnosticOutputSchema>;

/**
 * Helper to format Zod validation errors into a single concise string.
 */
export function formatZodError(error: z.ZodError): string {
  const issues = error.issues.map((i) => {
    const path = i.path.length > 0 ? `${i.path.join(".")}: ` : "";
    return `${path}${i.message}`;
  });
  return issues[0] || "Invalid request payload.";
}
