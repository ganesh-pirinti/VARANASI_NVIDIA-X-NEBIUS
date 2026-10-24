import { NextRequest, NextResponse } from "next/server";
import { queryNebiusDiagnostic } from "@/lib/nebius/client";
import { executeTavilySearch } from "@/lib/tavily/client";
import { DiagnoseRequest, DiagnoseResponse } from "@/types/api";

export async function POST(req: NextRequest) {
  try {
    const body: DiagnoseRequest = await req.json();

    if (!body.diagnosticLog && !body.dockerfileContent && !body.workloadConfigContent) {
      return NextResponse.json(
        {
          success: false,
          modelUsed: process.env.NEBIUS_MODEL || "nvidia/Llama-3.1-Nemotron-70B-Instruct-HF",
          likelyRootCause: "No diagnostic logs or configuration files provided for investigation.",
          alternativeExplanations: [],
          suggestedActionPlan: [],
          citations: [],
          sanitizedTokensProcessed: 0,
          error: "At least one log trace or configuration file is required for diagnosis.",
        },
        { status: 400 }
      );
    }

    // Formulate targeted Tavily search query based on log content
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

    // Execute Nebius Model Inference and Tavily search concurrently
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

    // Construct response
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
        modelUsed: process.env.NEBIUS_MODEL || "nvidia/Llama-3.1-Nemotron-70B-Instruct-HF",
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
