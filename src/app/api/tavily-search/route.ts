import { NextRequest, NextResponse } from "next/server";
import { executeTavilySearch } from "@/lib/tavily/client";
import { TavilySearchRequest, TavilySearchResponse } from "@/types/api";

export async function POST(req: NextRequest) {
  try {
    const body: TavilySearchRequest = await req.json();

    if (!body.query || body.query.trim().length === 0) {
      return NextResponse.json(
        { success: false, query: "", citations: [], error: "Search query must not be empty." },
        { status: 400 }
      );
    }

    const result = await executeTavilySearch({
      query: body.query.slice(0, 300),
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
