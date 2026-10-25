import { NextRequest, NextResponse } from "next/server";
import { getSystemStatus } from "@/lib/status/service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const forceRefresh = url.searchParams.get("refresh") === "true";
  const verifySearch = url.searchParams.get("verifySearch") === "true";
  const clientTavilyVerified = url.searchParams.get("clientTavilyVerified");
  const clientNebiusVerified = url.searchParams.get("clientNebiusVerified");

  const { response } = await getSystemStatus({
    forceRefresh,
    verifySearch,
    clientTavilyVerified,
    clientNebiusVerified,
  });

  return NextResponse.json(response, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
