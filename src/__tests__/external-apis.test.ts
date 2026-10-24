import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { queryNebiusDiagnostic } from "@/lib/nebius/client";
import { executeTavilySearch } from "@/lib/tavily/client";

describe("External API Clients Reliability & Failure Modes", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it("handles missing NEBIUS_API_KEY gracefully with an explicit message", async () => {
    delete process.env.NEBIUS_API_KEY;

    const result = await queryNebiusDiagnostic({
      diagnosticLog: "CUDA out of memory",
      projectName: "Test Project",
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("NEBIUS_API_KEY environment variable is not configured");
  });

  it("handles missing TAVILY_API_KEY gracefully with an explicit message", async () => {
    delete process.env.TAVILY_API_KEY;

    const result = await executeTavilySearch({
      query: "CUDA out of memory PyTorch vLLM",
    });

    expect(result.success).toBe(false);
    expect(result.isFallback).toBe(true);
    expect(result.error).toContain("TAVILY_API_KEY environment variable is not configured");
  });

  it("handles network failure or 500 error from Nebius API without crashing", async () => {
    process.env.NEBIUS_API_KEY = "test_key_fake";
    
    // Mock global fetch to return a 500 error
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      text: async () => "GPU node unavailable in region",
    });

    const result = await queryNebiusDiagnostic({
      diagnosticLog: "Some error log",
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("Nebius Token Factory API Error (500 Internal Server Error)");
  });

  it("handles malformed JSON from Nebius inference cleanly without throwing", async () => {
    process.env.NEBIUS_API_KEY = "test_key_fake";

    // Mock global fetch returning plain text instead of requested JSON
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        choices: [
          {
            message: {
              content: "I recommend reducing batch size and checking NCCL sockets. (Unstructured text)",
            },
          },
        ],
        usage: { total_tokens: 120 },
      }),
    });

    const result = await queryNebiusDiagnostic({
      diagnosticLog: "CUDA error",
    });

    expect(result.success).toBe(true);
    expect(result.parsedResponse).toBeDefined();
    expect(result.parsedResponse?.likelyRootCause).toContain("I recommend reducing batch size");
  });
});
