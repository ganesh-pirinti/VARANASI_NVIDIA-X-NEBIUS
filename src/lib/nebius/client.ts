import { sanitizeText, truncateLogForInference } from "../sanitizer";

export interface NebiusDiagnosticPromptInputs {
  diagnosticLog: string;
  dockerfileSnippet?: string;
  configSnippet?: string;
  projectName?: string;
  targetGpu?: string;
}

export interface NebiusDiagnosticResult {
  success: boolean;
  modelUsed: string;
  rawText: string;
  parsedResponse?: {
    likelyRootCause: string;
    alternativeExplanations: string[];
    actionPlan: string[];
    suggestedPatch?: {
      targetFile: string;
      originalSnippet: string;
      proposedPatchSnippet: string;
      explanation: string;
    };
  };
  sanitizedTokensProcessed: number;
  error?: string;
}

const DEFAULT_BASE_URL = "https://api.tokenfactory.nebius.com/v1";
const DEFAULT_MODEL = "nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B";

/**
 * Executes a diagnostic reasoning request to an eligible NVIDIA open-source model
 * hosted on Nebius Token Factory.
 */
export async function queryNebiusDiagnostic(
  inputs: NebiusDiagnosticPromptInputs
): Promise<NebiusDiagnosticResult> {
  const apiKey = process.env.NEBIUS_API_KEY;
  const baseUrl = (process.env.NEBIUS_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, "");
  const model = process.env.NEBIUS_MODEL || DEFAULT_MODEL;

  if (!apiKey || apiKey.trim().length === 0) {
    return {
      success: false,
      modelUsed: model,
      rawText: "",
      sanitizedTokensProcessed: 0,
      error:
        "NEBIUS_API_KEY environment variable is not configured. Please supply a valid Nebius Token Factory API key to enable live NVIDIA model inference.",
    };
  }

  // Sanitize and bound the log payload
  const sanitizedLog = truncateLogForInference(inputs.diagnosticLog, 120);
  const sanitizedDockerfile = inputs.dockerfileSnippet ? sanitizeText(inputs.dockerfileSnippet).sanitizedText : "";
  const sanitizedConfig = inputs.configSnippet ? sanitizeText(inputs.configSnippet).sanitizedText : "";

  const systemPrompt = `You are VARANASI's specialized GPU Infrastructure Diagnostic Engine powered by NVIDIA open-source models on Nebius Token Factory.
Your purpose: Analyze sanitized GPU runtime failure traces and cluster configurations.
Rules:
1. Provide technical root cause analysis based on NVIDIA CUDA, PyTorch, NCCL, and container runtime internals.
2. Formulate 1 primary likely root cause, 2 alternative explanations, and a concrete action plan.
3. Propose a targeted code/configuration patch if applicable.
4. Output your response in valid JSON matching this schema:
{
  "likelyRootCause": "Brief high-precision technical explanation",
  "alternativeExplanations": ["alt 1", "alt 2"],
  "actionPlan": ["step 1", "step 2", "step 3"],
  "suggestedPatch": {
    "targetFile": "e.g. Dockerfile or workload.yaml",
    "originalSnippet": "faulty code snippet",
    "proposedPatchSnippet": "corrected code snippet",
    "explanation": "why this patch fixes the crash"
  }
}
Do NOT wrap the JSON in Markdown backticks. Return ONLY the raw JSON string.`;

  const userPrompt = `Project: ${inputs.projectName || "AI Workload"}
Target GPU Architecture: ${inputs.targetGpu || "NVIDIA Hopper / H100"}

--- SANITIZED RUNTIME LOG ---
${sanitizedLog || "[No diagnostic log provided]"}

${sanitizedDockerfile ? `--- DOCKERFILE ---\n${sanitizedDockerfile}` : ""}
${sanitizedConfig ? `--- WORKLOAD CONFIG ---\n${sanitizedConfig}` : ""}

Diagnose the failure and return the JSON schema response.`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 35000); // 35s timeout

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.1,
        max_tokens: 1500,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errBody = await response.text().catch(() => "");
      return {
        success: false,
        modelUsed: model,
        rawText: "",
        sanitizedTokensProcessed: 0,
        error: `Nebius Token Factory API Error (${response.status} ${response.statusText}): ${errBody.slice(0, 300)}`,
      };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    const totalTokens = data.usage?.total_tokens || Math.ceil((userPrompt.length + content.length) / 4);

    // Attempt to parse JSON response
    let parsedResponse;
    try {
      // Clean potential markdown fencing if model included it
      const cleanedJson = content.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
      parsedResponse = JSON.parse(cleanedJson);
    } catch {
      // Fallback if model returned unstructured text
      parsedResponse = {
        likelyRootCause: content.slice(0, 250),
        alternativeExplanations: ["See raw model text for detailed diagnostic notes."],
        actionPlan: ["Review hardware memory headroom", "Inspect multi-node communication configuration"],
      };
    }

    return {
      success: true,
      modelUsed: model,
      rawText: content,
      parsedResponse,
      sanitizedTokensProcessed: totalTokens,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      modelUsed: model,
      rawText: "",
      sanitizedTokensProcessed: 0,
      error: `Failed to connect to Nebius Token Factory: ${errorMsg}`,
    };
  }
}
