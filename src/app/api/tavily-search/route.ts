import { NextRequest, NextResponse } from "next/server";
import { executeTavilySearch } from "@/lib/tavily/client";
import { TavilySearchResponse } from "@/types/api";
import { TavilySearchRequestSchema, formatZodError } from "@/lib/security/validators";
import { verifyTurnstileToken } from "@/lib/security/turnstile";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limiter";
import { readBoundedJson } from "@/lib/security/request-parser";

export async function POST(req: NextRequest) {
  const clientIp = getClientIp(req);

  try {
    // 1. Parse bounded JSON payload (Max 64KB) with Zod
    const parsed = await readBoundedJson(req, 64 * 1024);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, query: "", citations: [], error: parsed.error || "Invalid request body." },
        { status: parsed.status || 400 }
      );
    }

    const rawBody = parsed.data;

    const validationResult = TavilySearchRequestSchema.safeParse(rawBody);
    if (!validationResult.success) {
      const errorMsg = formatZodError(validationResult.error);
      return NextResponse.json(
        { success: false, query: (rawBody as any)?.query || "", citations: [], error: errorMsg },
        { status: 400 }
      );
    }

    const body = validationResult.data;

    // 2. Server-Side Rate Limiter Guardrail (15 requests per minute per IP)
    const rateLimit = await checkRateLimit(`tavily:${clientIp}`, 15, 60000);
    if (!rateLimit.allowed) {
      const retryAfterSeconds = Math.max(1, Math.ceil(rateLimit.resetMs / 1000));
      return NextResponse.json(
        {
          success: false,
          query: body.query,
          citations: [],
          error: rateLimit.error || "Search rate limit exceeded. Please wait before retrying.",
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
    // CRITICAL: Must verify BEFORE sending any request to Tavily!
    const turnstileResult = await verifyTurnstileToken({
      token: body.turnstileToken,
      action: "varanasi_search",
      clientIp,
    });

    if (!turnstileResult.success) {
      return NextResponse.json(
        {
          success: false,
          query: body.query,
          citations: [],
          error: turnstileResult.error || "Security challenge verification failed.",
        },
        { status: turnstileResult.status }
      );
    }

    // 4. Execute protected Tavily search
    const result = await executeTavilySearch({
      query: body.query,
      maxResults: body.maxResults || 4,
    });

    const response: TavilySearchResponse = {
      success: result.success,
      query: result.query,
      citations: result.citations,
      error: result.error,
    };

    return NextResponse.json(response);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json(
      { success: false, query: "", citations: [], error: `Tavily search failed: ${errorMsg}` },
      { status: 500 }
    );
  }
}
