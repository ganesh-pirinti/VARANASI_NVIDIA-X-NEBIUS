import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { POST as handleDiagnose } from "@/app/api/diagnose/route";
import { POST as handleTavilySearch } from "@/app/api/tavily-search/route";
import * as nebiusClient from "@/lib/nebius/client";
import * as tavilyClient from "@/lib/tavily/client";
import * as turnstileLib from "@/lib/security/turnstile";
import { _resetRateLimitsForTesting } from "@/lib/security/rate-limiter";

describe("Protected API Routes Security Guardrails", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    _resetRateLimitsForTesting();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe("POST /api/diagnose", () => {
    it("returns HTTP 400 when turnstileToken is missing and never calls Nebius or Tavily", async () => {
      const nebiusSpy = vi.spyOn(nebiusClient, "queryNebiusDiagnostic");
      const tavilySpy = vi.spyOn(tavilyClient, "executeTavilySearch");

      const req = new NextRequest("http://localhost:3000/api/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          diagnosticLog: "CUDA out of memory in PyTorch allocate",
          projectName: "LLM Fine-tuning",
          // turnstileToken missing
        }),
      });

      const res = await handleDiagnose(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain("turnstileToken");
      expect(nebiusSpy).not.toHaveBeenCalled();
      expect(tavilySpy).not.toHaveBeenCalled();
    });

    it("returns HTTP 400 on malformed JSON payload", async () => {
      const req = new NextRequest("http://localhost:3000/api/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "invalid-json{",
      });

      const res = await handleDiagnose(req);
      expect(res.status).toBe(400);
    });

    it("blocks request and returns HTTP 403 when Turnstile verification fails", async () => {
      const nebiusSpy = vi.spyOn(nebiusClient, "queryNebiusDiagnostic");
      const tavilySpy = vi.spyOn(tavilyClient, "executeTavilySearch");

      vi.spyOn(turnstileLib, "verifyTurnstileToken").mockResolvedValueOnce({
        success: false,
        status: 403,
        error: "Security token has expired or has already been used. Please refresh.",
      });

      const req = new NextRequest("http://localhost:3000/api/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          diagnosticLog: "RuntimeError: CUDA error: device-side assert triggered",
          turnstileToken: "expired_token_123",
        }),
      });

      const res = await handleDiagnose(req);
      const data = await res.json();

      expect(res.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toContain("Security token has expired");
      expect(nebiusSpy).not.toHaveBeenCalled();
      expect(tavilySpy).not.toHaveBeenCalled();
    });

    it("executes diagnosis successfully when Turnstile verification succeeds", async () => {
      vi.spyOn(turnstileLib, "verifyTurnstileToken").mockResolvedValueOnce({
        success: true,
        status: 200,
        hostname: "localhost",
        action: "varanasi_diagnose",
      });

      const nebiusSpy = vi.spyOn(nebiusClient, "queryNebiusDiagnostic").mockResolvedValueOnce({
        success: true,
        modelUsed: "nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B",
        rawText: "CUDA OutOfMemory in activation memory",
        parsedResponse: {
          likelyRootCause: "CUDA OutOfMemory in activation memory",
          alternativeExplanations: ["Model weights exceed GPU memory capacity"],
          actionPlan: ["Enable gradient checkpointing", "Reduce batch size"],
        },
        sanitizedTokensProcessed: 120,
      });

      const tavilySpy = vi.spyOn(tavilyClient, "executeTavilySearch").mockResolvedValueOnce({
        success: true,
        query: "PyTorch CUDA out of memory vLLM KV cache optimization",
        isFallback: false,
        citations: [
          {
            title: "PyTorch Memory Management",
            url: "https://pytorch.org/docs/stable/notes/cuda.html",
            snippet: "Understanding memory allocation and cache.",
          },
        ],
      });

      const req = new NextRequest("http://localhost:3000/api/diagnose", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": "198.51.100.5",
        },
        body: JSON.stringify({
          diagnosticLog: "OutOfMemoryError: CUDA out of memory",
          projectName: "Production Llama inference",
          turnstileToken: "valid_cf_token_456",
        }),
      });

      const res = await handleDiagnose(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.likelyRootCause).toBe("CUDA OutOfMemory in activation memory");
      expect(data.citations).toHaveLength(1);
      expect(nebiusSpy).toHaveBeenCalledTimes(1);
      expect(tavilySpy).toHaveBeenCalledTimes(1);
    });

    it("enforces rate limits (10 req/min) returning HTTP 429 when threshold exceeded", async () => {
      vi.spyOn(turnstileLib, "verifyTurnstileToken").mockResolvedValue({
        success: true,
        status: 200,
      });

      vi.spyOn(nebiusClient, "queryNebiusDiagnostic").mockResolvedValue({
        success: true,
        modelUsed: "nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B",
        rawText: "Mock cause",
        parsedResponse: {
          likelyRootCause: "Mock cause",
          alternativeExplanations: [],
          actionPlan: [],
        },
        sanitizedTokensProcessed: 10,
      });

      vi.spyOn(tavilyClient, "executeTavilySearch").mockResolvedValue({
        success: true,
        query: "test",
        isFallback: false,
        citations: [],
      });

      const clientIp = "198.51.100.99";

      // 10 successful requests allowed
      for (let i = 0; i < 10; i++) {
        const req = new NextRequest("http://localhost:3000/api/diagnose", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-forwarded-for": clientIp,
          },
          body: JSON.stringify({
            diagnosticLog: `Log message ${i}`,
            turnstileToken: `token_${i}`,
          }),
        });

        const res = await handleDiagnose(req);
        expect(res.status).toBe(200);
      }

      // 11th request from the same IP must be rate limited
      const rateLimitedReq = new NextRequest("http://localhost:3000/api/diagnose", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": clientIp,
        },
        body: JSON.stringify({
          diagnosticLog: "Log message 11",
          turnstileToken: "token_11",
        }),
      });

      const rateLimitedRes = await handleDiagnose(rateLimitedReq);
      const data = await rateLimitedRes.json();

      expect(rateLimitedRes.status).toBe(429);
      expect(data.success).toBe(false);
      expect(data.error).toContain("Rate limit reached");
    });
  });

  describe("POST /api/tavily-search", () => {
    it("returns HTTP 400 when turnstileToken is missing and never invokes Tavily", async () => {
      const tavilySpy = vi.spyOn(tavilyClient, "executeTavilySearch");

      const req = new NextRequest("http://localhost:3000/api/tavily-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: "NCCL watchdog timeout troubleshooting",
          // turnstileToken missing
        }),
      });

      const res = await handleTavilySearch(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain("turnstileToken");
      expect(tavilySpy).not.toHaveBeenCalled();
    });

    it("returns HTTP 400 when query is empty", async () => {
      const req = new NextRequest("http://localhost:3000/api/tavily-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: "",
          turnstileToken: "valid_token",
        }),
      });

      const res = await handleTavilySearch(req);
      expect(res.status).toBe(400);
    });

    it("blocks request and returns HTTP 403 when Turnstile verification fails", async () => {
      const tavilySpy = vi.spyOn(tavilyClient, "executeTavilySearch");

      vi.spyOn(turnstileLib, "verifyTurnstileToken").mockResolvedValueOnce({
        success: false,
        status: 403,
        error: "Security verification hostname is not authorized.",
      });

      const req = new NextRequest("http://localhost:3000/api/tavily-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: "CUDA illegal memory access",
          turnstileToken: "unauthorized_token",
        }),
      });

      const res = await handleTavilySearch(req);
      const data = await res.json();

      expect(res.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toContain("hostname is not authorized");
      expect(tavilySpy).not.toHaveBeenCalled();
    });

    it("executes protected Tavily search when Turnstile token is valid", async () => {
      vi.spyOn(turnstileLib, "verifyTurnstileToken").mockResolvedValueOnce({
        success: true,
        status: 200,
        hostname: "localhost",
        action: "varanasi_search",
      });

      const tavilySpy = vi.spyOn(tavilyClient, "executeTavilySearch").mockResolvedValueOnce({
        success: true,
        query: "NCCL 2.18 ring allreduce timeout",
        isFallback: false,
        citations: [
          {
            title: "NVIDIA Collective Communications Library",
            url: "https://docs.nvidia.com/deeplearning/nccl/user-guide/docs/troubleshooting.html",
            snippet: "Check NCCL_DEBUG=INFO and network interfaces.",
          },
        ],
      });

      const req = new NextRequest("http://localhost:3000/api/tavily-search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": "198.51.100.8",
        },
        body: JSON.stringify({
          query: "NCCL 2.18 ring allreduce timeout",
          maxResults: 3,
          turnstileToken: "valid_search_token",
        }),
      });

      const res = await handleTavilySearch(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.citations).toHaveLength(1);
      expect(data.citations[0].title).toContain("NVIDIA Collective Communications Library");
      expect(tavilySpy).toHaveBeenCalledTimes(1);
    });

    it("enforces rate limits (15 req/min) returning HTTP 429 when threshold exceeded", async () => {
      vi.spyOn(turnstileLib, "verifyTurnstileToken").mockResolvedValue({
        success: true,
        status: 200,
      });

      vi.spyOn(tavilyClient, "executeTavilySearch").mockResolvedValue({
        success: true,
        query: "query",
        isFallback: false,
        citations: [],
      });

      const clientIp = "198.51.100.222";

      // 15 allowed requests
      for (let i = 0; i < 15; i++) {
        const req = new NextRequest("http://localhost:3000/api/tavily-search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-forwarded-for": clientIp,
          },
          body: JSON.stringify({
            query: `search query ${i}`,
            turnstileToken: `token_${i}`,
          }),
        });

        const res = await handleTavilySearch(req);
        expect(res.status).toBe(200);
      }

      // 16th request from same IP is rate limited
      const rateLimitedReq = new NextRequest("http://localhost:3000/api/tavily-search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": clientIp,
        },
        body: JSON.stringify({
          query: "search query 16",
          turnstileToken: "token_16",
        }),
      });

      const rateLimitedRes = await handleTavilySearch(rateLimitedReq);
      const data = await rateLimitedRes.json();

      expect(rateLimitedRes.status).toBe(429);
      expect(data.success).toBe(false);
      expect(data.error).toContain("Rate limit reached");
      expect(rateLimitedRes.headers.get("Retry-After")).toBeDefined();
    });

    it("returns HTTP 413 when search payload exceeds 64KB limit", async () => {
      const hugeQuery = "A".repeat(70 * 1024);

      const req = new NextRequest("http://localhost:3000/api/tavily-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: hugeQuery,
          turnstileToken: "valid_token",
        }),
      });

      const res = await handleTavilySearch(req);
      const data = await res.json();

      expect(res.status).toBe(413);
      expect(data.error).toContain("exceeds maximum allowed limit");
    });
  });

  describe("Payload Limits on POST /api/diagnose", () => {
    it("returns HTTP 413 when diagnostic payload exceeds 1MB ceiling", async () => {
      const hugeLog = "X".repeat(1.2 * 1024 * 1024);

      const req = new NextRequest("http://localhost:3000/api/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          diagnosticLog: hugeLog,
          turnstileToken: "valid_token",
        }),
      });

      const res = await handleDiagnose(req);
      const data = await res.json();

      expect(res.status).toBe(413);
      expect(data.error).toContain("exceeds maximum allowed limit");
    });

    it("includes Retry-After header on HTTP 429 rate limit response", async () => {
      vi.spyOn(turnstileLib, "verifyTurnstileToken").mockResolvedValue({
        success: true,
        status: 200,
      });

      const clientIp = "198.51.100.77";

      for (let i = 0; i < 10; i++) {
        const req = new NextRequest("http://localhost:3000/api/diagnose", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-forwarded-for": clientIp,
          },
          body: JSON.stringify({
            diagnosticLog: `Log message ${i}`,
            turnstileToken: `token_${i}`,
          }),
        });

        await handleDiagnose(req);
      }

      const rateLimitedReq = new NextRequest("http://localhost:3000/api/diagnose", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": clientIp,
        },
        body: JSON.stringify({
          diagnosticLog: "Log message 11",
          turnstileToken: "token_11",
        }),
      });

      const rateLimitedRes = await handleDiagnose(rateLimitedReq);
      expect(rateLimitedRes.status).toBe(429);
      expect(rateLimitedRes.headers.get("Retry-After")).toBeDefined();
    });
  });
});
