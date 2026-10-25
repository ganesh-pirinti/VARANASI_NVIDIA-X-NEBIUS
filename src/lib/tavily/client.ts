import { EvidenceCitation } from "@/types/passport";

export interface TavilySearchOptions {
  query: string;
  maxResults?: number;
  searchDepth?: "basic" | "advanced";
  includeDomains?: string[];
}

export interface TavilySearchResult {
  success: boolean;
  query: string;
  citations: EvidenceCitation[];
  isFallback: boolean;
  error?: string;
}

const TAVILY_ENDPOINT = "https://api.tavily.com/search";

/**
 * Executes a real search request against Tavily Search API
 * to gather technical documentation and NVIDIA/PyTorch references.
 */
export async function executeTavilySearch(
  options: TavilySearchOptions
): Promise<TavilySearchResult> {
  const apiKey = process.env.TAVILY_API_KEY;
  const maxResults = options.maxResults || 4;

  if (!apiKey || apiKey.trim().length === 0) {
    return {
      success: false,
      query: options.query,
      citations: [],
      isFallback: true,
      error:
        "TAVILY_API_KEY environment variable is not configured. Live technical reference retrieval requires a valid Tavily API key.",
    };
  }

  let timeoutId: NodeJS.Timeout | null = null;
  try {
    const controller = new AbortController();
    timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout

    const response = await fetch(TAVILY_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: apiKey,
        query: options.query,
        search_depth: options.searchDepth || "basic",
        max_results: maxResults,
        include_domains: options.includeDomains || [
          "github.com",
          "pytorch.org",
          "docs.nvidia.com",
          "nebius.com",
          "vllm.ai",
          "huggingface.co",
          "stackoverflow.com",
        ],
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      const isRateLimited = response.status === 429;
      const errorMsg = isRateLimited
        ? "Tavily API search rate limit exceeded (HTTP 429). Search endpoint throttled. Please retry shortly."
        : `Tavily API responded with status ${response.status}: ${errText.slice(0, 200)}`;
      const globalAny = globalThis as unknown as { __tavilyLastVerified?: { success: boolean; error?: string; timestamp: number } };
      globalAny.__tavilyLastVerified = { success: false, error: errorMsg, timestamp: Date.now() };
      return {
        success: false,
        query: options.query,
        citations: [],
        isFallback: false,
        error: errorMsg,
      };
    }

    const data = await response.json();
    const rawResults = data.results || [];

    const citations: EvidenceCitation[] = rawResults.map((r: { title?: string; url?: string; content?: string; score?: number }) => ({
      title: r.title || "Technical Reference",
      url: r.url || "",
      snippet: r.content ? r.content.slice(0, 320) + (r.content.length > 320 ? "..." : "") : "No snippet preview available.",
      relevanceScore: r.score,
    }));

    const globalAny = globalThis as unknown as { 
      __tavilyLastVerified?: { success: boolean; error?: string; timestamp: number };
      __lastKnownTavilySuccess?: number;
    };
    globalAny.__tavilyLastVerified = { success: true, timestamp: Date.now() };
    globalAny.__lastKnownTavilySuccess = Date.now();

    return {
      success: true,
      query: options.query,
      citations,
      isFallback: false,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    const globalAny = globalThis as unknown as { __tavilyLastVerified?: { success: boolean; error?: string; timestamp: number } };
    globalAny.__tavilyLastVerified = { success: false, error: errorMsg, timestamp: Date.now() };
    return {
      success: false,
      query: options.query,
      citations: [],
      isFallback: false,
      error: `Tavily API search execution failed: ${errorMsg}`,
    };
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}
