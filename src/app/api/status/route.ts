import { NextResponse } from "next/server";
import { SystemStatusResponse, IntegrationState } from "@/types/api";

// Cache for status checks to prevent hitting endpoints on rapid re-renders
let cachedStatus: {
  data: SystemStatusResponse;
  timestamp: number;
} | null = null;

const CACHE_TTL_MS = 15000; // 15 seconds cache

export async function GET() {
  const now = Date.now();
  if (cachedStatus && now - cachedStatus.timestamp < CACHE_TTL_MS) {
    return NextResponse.json(cachedStatus.data);
  }

  const nebiusKey = process.env.NEBIUS_API_KEY?.trim() || "";
  const tavilyKey = process.env.TAVILY_API_KEY?.trim() || "";
  const nebiusBaseUrl = (process.env.NEBIUS_BASE_URL || "https://api.tokenfactory.nebius.com/v1").replace(/\/+$/, "");
  const configuredModel = process.env.NEBIUS_MODEL || "nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B";

  let nebiusStatus: IntegrationState = "NOT_CONFIGURED";
  let nebiusModelAvailable = false;
  let nebiusError: string | undefined = undefined;

  // Real, bounded Nebius API check using the free /models metadata endpoint
  if (nebiusKey.length > 0) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s strict timeout

      const res = await fetch(`${nebiusBaseUrl}/models`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${nebiusKey}`,
          Accept: "application/json",
        },
        signal: controller.signal,
        cache: "no-store",
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const body = await res.json().catch(() => null);
        const models: Array<{ id: string }> = body?.data || [];
        const found = models.some((m) => m.id === configuredModel);

        if (found) {
          nebiusStatus = "CONNECTED";
          nebiusModelAvailable = true;
        } else {
          // Connected to Nebius, but specific model ID differs from active catalogue
          nebiusStatus = "CONFIGURED";
          nebiusModelAvailable = false;
          nebiusError = `Connected to Nebius, but '${configuredModel}' was not found in the ${models.length} active models list.`;
        }
      } else if (res.status === 401 || res.status === 403) {
        nebiusStatus = "FAILED";
        nebiusError = `Authentication failed (${res.status}): Invalid API key.`;
      } else {
        nebiusStatus = "FAILED";
        nebiusError = `Service returned HTTP ${res.status}.`;
      }
    } catch (err: unknown) {
      nebiusStatus = "FAILED";
      const msg = err instanceof Error ? err.message : String(err);
      nebiusError = msg.includes("aborted") ? "Connection timed out (4s limit)" : "Network connection failed";
    }
  }

  // Truthful Tavily Status Check (without performing unrequested paid search queries)
  let tavilyStatus: IntegrationState = "NOT_CONFIGURED";
  let tavilyError: string | undefined = undefined;

  if (tavilyKey.length > 0) {
    // Check if key follows standard Tavily format (tvly-...)
    if (!tavilyKey.startsWith("tvly-") && tavilyKey.length < 16) {
      tavilyStatus = "FAILED";
      tavilyError = "Invalid Tavily API key format (expected tvly-...)";
    } else {
      // Check if global execution has verified connectivity
      const globalAny = globalThis as unknown as { __tavilyLastVerified?: { success: boolean; error?: string; timestamp: number } };
      if (globalAny.__tavilyLastVerified) {
        const timeDiff = now - globalAny.__tavilyLastVerified.timestamp;
        if (timeDiff < 600000) { // 10 minutes cache
          if (globalAny.__tavilyLastVerified.success) {
            tavilyStatus = "CONNECTED";
          } else {
            tavilyStatus = "FAILED";
            tavilyError = globalAny.__tavilyLastVerified.error || "Tavily search execution failed";
          }
        } else {
          tavilyStatus = "CONFIGURED";
        }
      } else {
        // Configured and syntax-validated; ready for runtime query execution
        tavilyStatus = "CONFIGURED";
      }
    }
  }

  const response: SystemStatusResponse = {
    nebiusConfigured: nebiusKey.length > 0,
    nebiusStatus,
    nebiusBaseUrl,
    nebiusModel: configuredModel,
    nebiusModelAvailable,
    nebiusError,
    tavilyConfigured: tavilyKey.length > 0,
    tavilyStatus,
    tavilyError,
    appVersion: process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0",
    environment: process.env.NODE_ENV || "development",
    checkedAt: new Date().toISOString(),
  };

  cachedStatus = {
    data: response,
    timestamp: now,
  };

  return NextResponse.json(response);
}
