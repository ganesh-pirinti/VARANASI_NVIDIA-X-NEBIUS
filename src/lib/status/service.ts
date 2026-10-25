import { SystemStatusResponse, IntegrationState } from "@/types/api";

// Module-level cache for status checks within an active runtime instance
let cachedStatus: {
  data: SystemStatusResponse;
  timestamp: number;
} | null = null;

const CACHE_TTL_MS = 15000; // 15 seconds cache

// Cooldown to avoid hammering Tavily's /usage endpoint on repeated reloads
let lastTavilyUsageProbeTime = 0;
let lastTavilyUsageResult: ServiceCheckResult | null = null;
let lastTavilyKey = "";
const TAVILY_PROBE_COOLDOWN_MS = 30000; // 30s minimum between /usage hits

/**
 * Resets status cache and cooldown timers. Used for testing cold starts.
 */
export function _resetStatusCacheForTesting() {
  cachedStatus = null;
  lastTavilyUsageProbeTime = 0;
  lastTavilyUsageResult = null;
  lastTavilyKey = "";
}

export interface ServiceCheckResult {
  status: IntegrationState;
  statusCode?: number;
  error?: string;
  modelAvailable?: boolean;
  inferenceAvailable?: boolean;
  inferenceTested?: boolean;
  searchAvailable?: boolean;
  isStale?: boolean;
  staleTimestamp?: string;
}

/**
 * Validates Nebius Token Factory API connectivity.
 * Distinguishes catalogue presence (/models) from actual token generation (/chat/completions).
 */
export async function checkNebius(
  apiKey: string,
  baseUrl: string,
  configuredModel: string,
  clientVerifiedTimestamp?: string | null,
  verifyInference = false
): Promise<ServiceCheckResult> {
  if (!apiKey || apiKey.length === 0) {
    return {
      status: "NOT_CONFIGURED",
      error: "NEBIUS_API_KEY is not configured in environment.",
      modelAvailable: false,
    };
  }

  // 1. Explicit inference test if requested
  if (verifyInference) {
    let inferenceTimeoutId: NodeJS.Timeout | null = null;
    try {
      const controller = new AbortController();
      inferenceTimeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: configuredModel,
          messages: [{ role: "user", content: "ping" }],
          max_tokens: 1,
          temperature: 0,
        }),
        signal: controller.signal,
      });

      const statusCode = res.status;
      if (res.ok) {
        return {
          status: "CONNECTED",
          statusCode,
          modelAvailable: true,
          inferenceAvailable: true,
          inferenceTested: true,
        };
      }

      if (statusCode === 401 || statusCode === 403) {
        return {
          status: "FAILED",
          statusCode,
          modelAvailable: false,
          inferenceAvailable: false,
          inferenceTested: true,
          error: `Nebius authentication failed (HTTP ${statusCode}): Invalid or expired API key.`,
        };
      }

      if (statusCode === 429) {
        return {
          status: "RATE_LIMITED",
          statusCode,
          modelAvailable: false,
          inferenceAvailable: false,
          inferenceTested: true,
          error: `Nebius inference endpoint rate limited (HTTP 429).`,
        };
      }

      return {
        status: "FAILED",
        statusCode,
        modelAvailable: false,
        inferenceAvailable: false,
        inferenceTested: true,
        error: `Nebius inference service returned HTTP ${statusCode}.`,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        status: "FAILED",
        modelAvailable: false,
        inferenceAvailable: false,
        inferenceTested: true,
        error: `Nebius inference connection failed: ${msg}`,
      };
    } finally {
      if (inferenceTimeoutId) clearTimeout(inferenceTimeoutId);
    }
  }

  // 2. Catalogue check via /models
  let timeoutId: NodeJS.Timeout | null = null;
  try {
    const controller = new AbortController();
    timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

    const res = await fetch(`${baseUrl}/models`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
      signal: controller.signal,
      cache: "no-store",
    });

    const statusCode = res.status;

    if (res.ok) {
      const body = await res.json().catch(() => null);
      const models: Array<{ id: string }> = body?.data || [];
      const found = models.some((m) => m.id === configuredModel);

      if (found) {
        return {
          status: "CONNECTED",
          statusCode,
          modelAvailable: true,
          inferenceAvailable: true,
          inferenceTested: false,
        };
      } else {
        return {
          status: "CONFIGURED",
          statusCode,
          modelAvailable: false,
          inferenceAvailable: false,
          inferenceTested: false,
          error: `Connected to Nebius catalogue (HTTP 200), but model '${configuredModel}' was not found in active catalogue (${models.length} models available).`,
        };
      }
    }

    if (statusCode === 401 || statusCode === 403) {
      return {
        status: "FAILED",
        statusCode,
        modelAvailable: false,
        error: `Authentication failed (HTTP ${statusCode}): Invalid or expired NEBIUS_API_KEY.`,
      };
    }

    if (statusCode === 429) {
      const rateLimitError = `Rate limit reached (HTTP 429): Nebius models endpoint throttled.`;
      if (clientVerifiedTimestamp) {
        return {
          status: "STALE",
          statusCode,
          isStale: true,
          staleTimestamp: clientVerifiedTimestamp,
          modelAvailable: true,
          error: `${rateLimitError} Historical verified connection (STALE: ${new Date(clientVerifiedTimestamp).toLocaleTimeString()}).`,
        };
      }
      return {
        status: "RATE_LIMITED",
        statusCode,
        modelAvailable: false,
        error: rateLimitError,
      };
    }

    const serviceError = statusCode >= 500
      ? `Nebius upstream server error (HTTP ${statusCode}).`
      : `Nebius service returned HTTP ${statusCode}.`;

    if (clientVerifiedTimestamp) {
      return {
        status: "STALE",
        statusCode,
        isStale: true,
        staleTimestamp: clientVerifiedTimestamp,
        modelAvailable: true,
        error: `${serviceError} Historical verified connection (STALE: ${new Date(clientVerifiedTimestamp).toLocaleTimeString()}).`,
      };
    }

    return {
      status: "FAILED",
      statusCode,
      modelAvailable: false,
      error: serviceError,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const errName = err instanceof Error ? err.name : "";
    const isTimeout = errName === "AbortError" || msg.toLowerCase().includes("abort") || msg.toLowerCase().includes("timeout");
    const netError = isTimeout ? "Connection timed out (8s limit)" : "Network connection to Nebius failed";

    if (clientVerifiedTimestamp) {
      return {
        status: "STALE",
        isStale: true,
        staleTimestamp: clientVerifiedTimestamp,
        modelAvailable: true,
        error: `${netError}. Historical verified connection (STALE: ${new Date(clientVerifiedTimestamp).toLocaleTimeString()}).`,
      };
    }

    return {
      status: "FAILED",
      modelAvailable: false,
      error: netError,
    };
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

/**
 * Validates Tavily connectivity.
 * Distinguishes search workflow verification from usage-endpoint rate limiting.
 */
export async function checkTavily(
  apiKey: string,
  clientVerifiedTimestamp?: string | null,
  bypassCooldown = false
): Promise<ServiceCheckResult> {
  if (!apiKey || apiKey.length === 0) {
    return {
      status: "NOT_CONFIGURED",
      error: "TAVILY_API_KEY is not configured in environment.",
    };
  }

  // 1. Cooldown Guard for /usage endpoint to prevent triggering HTTP 429 throttling
  const now = Date.now();
  if (
    !bypassCooldown &&
    lastTavilyUsageResult &&
    apiKey === lastTavilyKey &&
    now - lastTavilyUsageProbeTime < TAVILY_PROBE_COOLDOWN_MS
  ) {
    // If we have a fresh probe result within the cooldown window, reuse it
    if (clientVerifiedTimestamp && lastTavilyUsageResult.status === "RATE_LIMITED") {
      return {
        ...lastTavilyUsageResult,
        status: "STALE",
        isStale: true,
        staleTimestamp: clientVerifiedTimestamp,
        error: `${lastTavilyUsageResult.error} Historical verified connection (STALE: ${new Date(clientVerifiedTimestamp).toLocaleTimeString()}).`,
      };
    }
    return lastTavilyUsageResult;
  }

  let timeoutId: NodeJS.Timeout | null = null;
  try {
    const controller = new AbortController();
    timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

    // Official Tavily usage / auth endpoint (does not consume search credits)
    const res = await fetch("https://api.tavily.com/usage", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
      signal: controller.signal,
      cache: "no-store",
    });

    const statusCode = res.status;
    lastTavilyUsageProbeTime = now;
    lastTavilyKey = apiKey;

    if (res.ok) {
      const result: ServiceCheckResult = {
        status: "CONNECTED",
        statusCode,
        searchAvailable: true,
      };
      lastTavilyUsageResult = result;
      return result;
    }

    if (statusCode === 401 || statusCode === 403) {
      const result: ServiceCheckResult = {
        status: "FAILED",
        statusCode,
        error: `Authentication failed (HTTP ${statusCode}): Invalid or expired TAVILY_API_KEY.`,
      };
      lastTavilyUsageResult = result;
      return result;
    }

    if (statusCode === 429) {
      const rateLimitError = `Rate limit reached (HTTP 429): Tavily usage endpoint throttled due to request frequency.`;
      
      // If a verified timestamp is provided by client/prior verification, return STALE (never claim CONNECTED)
      if (clientVerifiedTimestamp) {
        const result: ServiceCheckResult = {
          status: "STALE",
          statusCode,
          isStale: true,
          staleTimestamp: clientVerifiedTimestamp,
          searchAvailable: true,
          error: `${rateLimitError} Historical verified connection (STALE: ${new Date(clientVerifiedTimestamp).toLocaleTimeString()}). Search workflow remains operational.`,
        };
        lastTavilyUsageResult = result;
        return result;
      }

      // If cold start without prior verification, truthfully return RATE_LIMITED (never claim CONNECTED)
      const result: ServiceCheckResult = {
        status: "RATE_LIMITED",
        statusCode,
        searchAvailable: true, // Search endpoint is independent of /usage
        error: `${rateLimitError} Usage endpoint is throttled. Live search queries remain available.`,
      };
      lastTavilyUsageResult = result;
      return result;
    }

    const serviceError = statusCode >= 500
      ? `Tavily upstream server error (HTTP ${statusCode}).`
      : `Tavily service returned HTTP ${statusCode}.`;

    if (clientVerifiedTimestamp) {
      const result: ServiceCheckResult = {
        status: "STALE",
        statusCode,
        isStale: true,
        staleTimestamp: clientVerifiedTimestamp,
        error: `${serviceError} Historical verified connection (STALE: ${new Date(clientVerifiedTimestamp).toLocaleTimeString()}).`,
      };
      lastTavilyUsageResult = result;
      return result;
    }

    const result: ServiceCheckResult = {
      status: "DEGRADED",
      statusCode,
      error: serviceError,
    };
    lastTavilyUsageResult = result;
    return result;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const errName = err instanceof Error ? err.name : "";
    const isTimeout = errName === "AbortError" || msg.toLowerCase().includes("abort") || msg.toLowerCase().includes("timeout");
    const netError = isTimeout ? "Connection timed out (8s limit)" : "Network connection to Tavily failed";

    if (clientVerifiedTimestamp) {
      return {
        status: "STALE",
        isStale: true,
        staleTimestamp: clientVerifiedTimestamp,
        error: `${netError}. Historical verified connection (STALE: ${new Date(clientVerifiedTimestamp).toLocaleTimeString()}).`,
      };
    }

    return {
      status: "FAILED",
      error: netError,
    };
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export interface GetStatusOptions {
  forceRefresh?: boolean;
  verifyInference?: boolean;
  clientTavilyVerified?: string | null;
  clientNebiusVerified?: string | null;
}

export async function getSystemStatus(options: GetStatusOptions = {}): Promise<{ response: SystemStatusResponse; cached: boolean }> {
  const now = Date.now();
  const { forceRefresh = false, verifyInference = false, clientTavilyVerified, clientNebiusVerified } = options;

  if (!forceRefresh && !verifyInference && cachedStatus && now - cachedStatus.timestamp < CACHE_TTL_MS) {
    return { response: cachedStatus.data, cached: true };
  }

  const nebiusKey = process.env.NEBIUS_API_KEY?.trim() || "";
  const tavilyKey = process.env.TAVILY_API_KEY?.trim() || "";
  const nebiusBaseUrl = (process.env.NEBIUS_BASE_URL || "https://api.tokenfactory.nebius.com/v1").replace(/\/+$/, "");
  const configuredModel = process.env.NEBIUS_MODEL?.trim() || "nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B";

  // Execute checks in parallel without unprotected search operations
  const [nebiusResult, tavilyResult] = await Promise.all([
    checkNebius(nebiusKey, nebiusBaseUrl, configuredModel, clientNebiusVerified, verifyInference),
    checkTavily(tavilyKey, clientTavilyVerified, forceRefresh),
  ]);

  const response: SystemStatusResponse = {
    nebiusConfigured: nebiusKey.length > 0,
    nebiusStatus: nebiusResult.status,
    nebiusBaseUrl,
    nebiusModel: configuredModel,
    nebiusModelAvailable: nebiusResult.modelAvailable || false,
    nebiusInferenceAvailable: nebiusResult.inferenceAvailable,
    nebiusInferenceTested: nebiusResult.inferenceTested,
    nebiusError: nebiusResult.error,
    nebiusStatusCode: nebiusResult.statusCode,
    nebiusIsStale: nebiusResult.isStale,
    nebiusStaleTimestamp: nebiusResult.staleTimestamp,
    tavilyConfigured: tavilyKey.length > 0,
    tavilyStatus: tavilyResult.status,
    tavilyError: tavilyResult.error,
    tavilyStatusCode: tavilyResult.statusCode,
    tavilySearchAvailable: tavilyResult.searchAvailable,
    tavilyIsStale: tavilyResult.isStale,
    tavilyStaleTimestamp: tavilyResult.staleTimestamp,
    appVersion: process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0",
    environment: process.env.NODE_ENV || "development",
    checkedAt: new Date().toISOString(),
  };

  cachedStatus = {
    data: response,
    timestamp: now,
  };

  return { response, cached: false };
}
