import { NextRequest, NextResponse } from "next/server";
import { queryNebiusDiagnostic } from "@/lib/nebius/client";
import { executeTavilySearch } from "@/lib/tavily/client";
import { DiagnoseResponse } from "@/types/api";
import { DiagnoseRequestSchema, formatZodError } from "@/lib/security/validators";
import { verifyTurnstileToken } from "@/lib/security/turnstile";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limiter";
import { readBoundedJson } from "@/lib/security/request-parser";

export async function POST(req: NextRequest) {
  const modelUsed = process.env.NEBIUS_MODEL || "nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B";
  const clientIp = getClientIp(req);

  try {
    // 1. Parse bounded JSON payload (Max 1MB) with deterministic size enforcement
    const parsed = await readBoundedJson(req, 1024 * 1024);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          modelUsed,
          likelyRootCause: parsed.status === 413 ? "Payload size exceeds maximum allowed limit." : "Invalid JSON payload in request.",
          alternativeExplanations: [],
          suggestedActionPlan: [],
          citations: [],
          sanitizedTokensProcessed: 0,
          error: parsed.error || "Invalid request body.",
        },
        { status: parsed.status || 400 }
      );
    }

    const rawBody = parsed.data;

    const validationResult = DiagnoseRequestSchema.safeParse(rawBody);
    if (!validationResult.success) {
      const errorMsg = formatZodError(validationResult.error);
      return NextResponse.json(
        {
          success: false,
          modelUsed,
          likelyRootCause: "Request validation failed.",
          alternativeExplanations: [],
          suggestedActionPlan: [],
          citations: [],
          sanitizedTokensProcessed: 0,
          error: errorMsg,
        },
        { status: 400 }
      );
    }

    const body = validationResult.data;

    // 2. Server-Side Rate Limiter Guardrail (10 requests per minute per IP)
    const rateLimit = await checkRateLimit(`diagnose:${clientIp}`, 10, 60000);
    if (!rateLimit.allowed) {
      const retryAfterSeconds = Math.max(1, Math.ceil(rateLimit.resetMs / 1000));
      return NextResponse.json(
        {
          success: false,
          modelUsed,
          likelyRootCause: "Diagnostic request rate limit exceeded.",
          alternativeExplanations: [],
          suggestedActionPlan: ["Please wait before initiating another deep diagnostic query."],
          citations: [],
          sanitizedTokensProcessed: 0,
          error: rateLimit.error || "Rate limit reached. Please wait before retrying.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfterSeconds),
          },
        }
      );
    }

    // 3. Cloudflare Turnstile Token Verification
    // CRITICAL: Must verify BEFORE sending any request to Nebius or Tavily!
    const turnstileResult = await verifyTurnstileToken({
      token: body.turnstileToken,
      action: "varanasi_diagnose",
      clientIp,
    });

    if (!turnstileResult.success) {
      return NextResponse.json(
        {
          success: false,
          modelUsed,
          likelyRootCause: "Security verification challenge failed.",
          alternativeExplanations: [],
          suggestedActionPlan: ["Complete the security challenge on the client before proceeding."],
          citations: [],
          sanitizedTokensProcessed: 0,
          error: turnstileResult.error || "Security challenge verification failed.",
        },
        { status: turnstileResult.status }
      );
    }

    // 4. Formulate targeted Tavily search query based on log content
    let searchQuery = "NVIDIA CUDA PyTorch error troubleshooting";
    if (body.diagnosticLog) {
      if (/OutOfMemoryError|CUDA out of memory/i.test(body.diagnosticLog)) {
        searchQuery = "PyTorch CUDA out of memory vLLM KV cache optimization";
      } else if (/NCCL error|collective operation timeout/i.test(body.diagnosticLog)) {
        searchQuery = "NCCL watchdog collective operation timeout multi-GPU PyTorch";
      } else if (/Bus error|DataLoader/i.test(body.diagnosticLog)) {
        searchQuery = "PyTorch DataLoader worker killed by signal Bus error /dev/shm";
      } else if (/Ninja is required|subcommand failed/i.test(body.diagnosticLog)) {
        searchQuery = "flash-attn ninja build stopped subcommand failed Dao-AILab";
      } else if (/no kernel image is available/i.test(body.diagnosticLog)) {
        searchQuery = "CUDA no kernel image is available for execution on device compute capability";
      }
    }

    // 5. Execute Nebius Model Inference and Tavily search concurrently
    const [nebiusResult, tavilyResult] = await Promise.all([
      queryNebiusDiagnostic({
        diagnosticLog: body.diagnosticLog || "",
        dockerfileSnippet: body.dockerfileContent,
        configSnippet: body.workloadConfigContent,
        projectName: body.projectName,
        targetGpu: body.targetGpu,
      }),
      executeTavilySearch({
        query: searchQuery,
        maxResults: 4,
      }),
    ]);

    // 6. Construct response
    const response: DiagnoseResponse = {
      success: nebiusResult.success,
      modelUsed: nebiusResult.modelUsed,
      likelyRootCause:
        nebiusResult.parsedResponse?.likelyRootCause ||
        (nebiusResult.success ? nebiusResult.rawText.slice(0, 300) : "Model investigation could not complete."),
      alternativeExplanations: nebiusResult.parsedResponse?.alternativeExplanations || [],
      suggestedActionPlan: nebiusResult.parsedResponse?.actionPlan || [],
      suggestedPatch: nebiusResult.parsedResponse?.suggestedPatch,
      citations: tavilyResult.citations,
      sanitizedTokensProcessed: nebiusResult.sanitizedTokensProcessed,
      error: nebiusResult.error || (tavilyResult.error ? `Note: ${tavilyResult.error}` : undefined),
    };

    return NextResponse.json(response);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json(
      {
        success: false,
        modelUsed,
        likelyRootCause: "Diagnostic workflow encountered an unhandled exception.",
        alternativeExplanations: [],
        suggestedActionPlan: [],
        citations: [],
        sanitizedTokensProcessed: 0,
        error: errorMsg,
      },
      { status: 500 }
    );
  }
}
