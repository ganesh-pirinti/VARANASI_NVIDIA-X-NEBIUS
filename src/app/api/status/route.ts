import { NextRequest, NextResponse } from "next/server";
import { SystemStatusResponse, IntegrationState } from "@/types/api";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// In-memory cache for status checks to prevent hitting endpoints on rapid re-renders
let cachedStatus: {
  data: SystemStatusResponse;
  timestamp: number;
} | null = null;

const CACHE_TTL_MS = 15000; // 15 seconds cache

interface LastKnownSuccess {
  timestamp: string; // ISO string
  modelAvailable?: boolean;
}

// Retain last known verified connection state across transient errors (e.g. rate limits or timeouts)
let lastKnownNebiusSuccess: LastKnownSuccess | null = null;
let lastKnownTavilySuccess: LastKnownSuccess | null = null;

interface ServiceCheckResult {
  status: IntegrationState;
  statusCode?: number;
  error?: string;
  modelAvailable?: boolean;
  isStale?: boolean;
  staleTimestamp?: string;
}

/**
 * Validates Nebius Token Factory API connectivity using the official /models endpoint.
 * CONNECTED is returned only after an authenticated HTTP 200 response.
 */
async function checkNebius(
  apiKey: string,
  baseUrl: string,
  configuredModel: string
): Promise<ServiceCheckResult> {
  if (!apiKey || apiKey.length === 0) {
    lastKnownNebiusSuccess = null;
    return {
      status: "NOT_CONFIGURED",
      error: "NEBIUS_API_KEY is not configured in environment.",
      modelAvailable: false,
    };
  }

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
        lastKnownNebiusSuccess = {
          timestamp: new Date().toISOString(),
          modelAvailable: true,
        };
        return {
          status: "CONNECTED",
          statusCode,
          modelAvailable: true,
        };
      } else {
        lastKnownNebiusSuccess = {
          timestamp: new Date().toISOString(),
          modelAvailable: false,
        };
        return {
          status: "CONFIGURED",
          statusCode,
          modelAvailable: false,
          error: `Connected to Nebius catalogue (HTTP 200), but model '${configuredModel}' was not found in active catalogue (${models.length} models available).`,
        };
      }
    }

    if (statusCode === 401 || statusCode === 403) {
      lastKnownNebiusSuccess = null; // Invalidate any prior success on explicit authentication rejection
      return {
        status: "FAILED",
        statusCode,
        modelAvailable: false,
        error: `Authentication failed (HTTP ${statusCode}): Invalid or expired NEBIUS_API_KEY.`,
      };
    }

    if (statusCode === 429) {
      const rateLimitError = `Rate limit reached (HTTP 429): Nebius models endpoint throttled.`;
      if (lastKnownNebiusSuccess) {
        return {
          status: "CONNECTED",
          statusCode,
          isStale: true,
          staleTimestamp: lastKnownNebiusSuccess.timestamp,
          modelAvailable: lastKnownNebiusSuccess.modelAvailable,
          error: `${rateLimitError} Retaining verified connection (STALE: ${new Date(lastKnownNebiusSuccess.timestamp).toLocaleTimeString()}).`,
        };
      }
      return {
        status: "FAILED",
        statusCode,
        modelAvailable: false,
        error: rateLimitError,
      };
    }

    const serviceError = statusCode >= 500
      ? `Nebius upstream server error (HTTP ${statusCode}).`
      : `Nebius service returned HTTP ${statusCode}.`;

    if (lastKnownNebiusSuccess) {
      return {
        status: "CONNECTED",
        statusCode,
        isStale: true,
        staleTimestamp: lastKnownNebiusSuccess.timestamp,
        modelAvailable: lastKnownNebiusSuccess.modelAvailable,
        error: `${serviceError} Retaining verified connection (STALE: ${new Date(lastKnownNebiusSuccess.timestamp).toLocaleTimeString()}).`,
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
    const isTimeout = msg.includes("aborted") || msg.includes("timeout");
    const netError = isTimeout ? "Connection timed out (8s limit)" : "Network connection to Nebius failed";

    if (lastKnownNebiusSuccess) {
      return {
        status: "CONNECTED",
        isStale: true,
        staleTimestamp: lastKnownNebiusSuccess.timestamp,
        modelAvailable: lastKnownNebiusSuccess.modelAvailable,
        error: `${netError}. Retaining verified connection (STALE: ${new Date(lastKnownNebiusSuccess.timestamp).toLocaleTimeString()}).`,
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
 * Validates Tavily Technical Search API connectivity using the official /usage endpoint.
 * CONNECTED is returned only after an authenticated HTTP 200 response.
 */
async function checkTavily(apiKey: string): Promise<ServiceCheckResult> {
  if (!apiKey || apiKey.length === 0) {
    lastKnownTavilySuccess = null;
    return {
      status: "NOT_CONFIGURED",
      error: "TAVILY_API_KEY is not configured in environment.",
    };
  }

  // Check if global execution recorded a real search query success
  const globalAny = globalThis as unknown as { __lastKnownTavilySuccess?: number };
  if (globalAny.__lastKnownTavilySuccess) {
    lastKnownTavilySuccess = {
      timestamp: new Date(globalAny.__lastKnownTavilySuccess).toISOString(),
    };
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

    if (res.ok) {
      lastKnownTavilySuccess = {
        timestamp: new Date().toISOString(),
      };
      return {
        status: "CONNECTED",
        statusCode,
      };
    }

    if (statusCode === 401 || statusCode === 403) {
      lastKnownTavilySuccess = null; // Invalidate any prior success on explicit authentication rejection
      return {
        status: "FAILED",
        statusCode,
        error: `Authentication failed (HTTP ${statusCode}): Invalid or expired TAVILY_API_KEY.`,
      };
    }

    if (statusCode === 429) {
      const rateLimitError = `Rate limit reached (HTTP 429): Tavily usage endpoint throttled due to request frequency.`;
      if (lastKnownTavilySuccess) {
        return {
          status: "CONNECTED",
          statusCode,
          isStale: true,
          staleTimestamp: lastKnownTavilySuccess.timestamp,
          error: `${rateLimitError} Retaining verified connection (STALE: ${new Date(lastKnownTavilySuccess.timestamp).toLocaleTimeString()}).`,
        };
      }
      return {
        status: "FAILED",
        statusCode,
        error: `${rateLimitError} Retry in a few minutes.`,
      };
    }

    const serviceError = statusCode >= 500
      ? `Tavily upstream server error (HTTP ${statusCode}).`
      : `Tavily service returned HTTP ${statusCode}.`;

    if (lastKnownTavilySuccess) {
      return {
        status: "CONNECTED",
        statusCode,
        isStale: true,
        staleTimestamp: lastKnownTavilySuccess.timestamp,
        error: `${serviceError} Retaining verified connection (STALE: ${new Date(lastKnownTavilySuccess.timestamp).toLocaleTimeString()}).`,
      };
    }

    return {
      status: "FAILED",
      statusCode,
      error: serviceError,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const isTimeout = msg.includes("aborted") || msg.includes("timeout");
    const netError = isTimeout ? "Connection timed out (8s limit)" : "Network connection to Tavily failed";

    if (lastKnownTavilySuccess) {
      return {
        status: "CONNECTED",
        isStale: true,
        staleTimestamp: lastKnownTavilySuccess.timestamp,
        error: `${netError}. Retaining verified connection (STALE: ${new Date(lastKnownTavilySuccess.timestamp).toLocaleTimeString()}).`,
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

export async function GET(req: NextRequest) {
  const now = Date.now();
  const url = new URL(req.url);
  const forceRefresh = url.searchParams.get("refresh") === "true";

  if (!forceRefresh && cachedStatus && now - cachedStatus.timestamp < CACHE_TTL_MS) {
    return NextResponse.json(cachedStatus.data, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  }

  const nebiusKey = process.env.NEBIUS_API_KEY?.trim() || "";
  const tavilyKey = process.env.TAVILY_API_KEY?.trim() || "";
  const nebiusBaseUrl = (process.env.NEBIUS_BASE_URL || "https://api.tokenfactory.nebius.com/v1").replace(/\/+$/, "");
  const configuredModel = process.env.NEBIUS_MODEL?.trim() || "nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B";

  // Execute checks in parallel
  const [nebiusResult, tavilyResult] = await Promise.all([
    checkNebius(nebiusKey, nebiusBaseUrl, configuredModel),
    checkTavily(tavilyKey),
  ]);

  const response: SystemStatusResponse = {
    nebiusConfigured: nebiusKey.length > 0,
    nebiusStatus: nebiusResult.status,
    nebiusBaseUrl,
    nebiusModel: configuredModel,
    nebiusModelAvailable: nebiusResult.modelAvailable || false,
    nebiusError: nebiusResult.error,
    nebiusStatusCode: nebiusResult.statusCode,
    nebiusIsStale: nebiusResult.isStale,
    nebiusStaleTimestamp: nebiusResult.staleTimestamp,
    tavilyConfigured: tavilyKey.length > 0,
    tavilyStatus: tavilyResult.status,
    tavilyError: tavilyResult.error,
    tavilyStatusCode: tavilyResult.statusCode,
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

  return NextResponse.json(response, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
