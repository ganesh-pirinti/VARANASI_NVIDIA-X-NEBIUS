import { NextResponse } from "next/server";
import { SystemStatusResponse } from "@/types/api";

export async function GET() {
  const nebiusKey = process.env.NEBIUS_API_KEY;
  const tavilyKey = process.env.TAVILY_API_KEY;

  const response: SystemStatusResponse = {
    nebiusConfigured: Boolean(nebiusKey && nebiusKey.trim().length > 0),
    nebiusBaseUrl: (process.env.NEBIUS_BASE_URL || "https://api.tokenfactory.nebius.com/v1").replace(/\/+$/, ""),
    nebiusModel: process.env.NEBIUS_MODEL || "nvidia/Llama-3.1-Nemotron-70B-Instruct-HF",
    tavilyConfigured: Boolean(tavilyKey && tavilyKey.trim().length > 0),
    appVersion: "1.0.0",
    environment: process.env.NODE_ENV || "development",
  };

  return NextResponse.json(response);
}
