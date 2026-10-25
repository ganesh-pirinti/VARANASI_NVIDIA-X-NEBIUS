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
