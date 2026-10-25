import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GET } from "@/app/api/status/route";
import { _resetStatusCacheForTesting } from "@/lib/status/service";
import { NextRequest } from "next/server";

describe("System Status API Route (/api/status)", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    _resetStatusCacheForTesting();
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it("reports NOT_CONFIGURED when API keys are absent", async () => {
    delete process.env.NEBIUS_API_KEY;
    delete process.env.TAVILY_API_KEY;

    const req = new NextRequest("http://localhost:3000/api/status?refresh=true");
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.nebiusConfigured).toBe(false);
    expect(data.nebiusStatus).toBe("NOT_CONFIGURED");
    expect(data.tavilyConfigured).toBe(false);
    expect(data.tavilyStatus).toBe("NOT_CONFIGURED");
    expect(data.nebiusModelAvailable).toBe(false);
  });

  it("reports CONNECTED for both services when external endpoints return 200 OK", async () => {
    process.env.NEBIUS_API_KEY = "mock-nebius-key";
    process.env.TAVILY_API_KEY = "tvly-mock-key";
    process.env.NEBIUS_MODEL = "nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B";

    global.fetch = vi.fn().mockImplementation((url: string | URL | Request) => {
      const urlStr = url.toString();
      if (urlStr.includes("nebius.com")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            data: [
              { id: "nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B" },
              { id: "meta-llama/Meta-Llama-3.1-8B-Instruct" },
            ],
          }),
        });
      }
      if (urlStr.includes("tavily.com")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ key: { usage: 10 } }),
        });
      }
      return Promise.reject(new Error("Unknown URL"));
    });

    const req = new NextRequest("http://localhost:3000/api/status?refresh=true");
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.nebiusConfigured).toBe(true);
    expect(data.nebiusStatus).toBe("CONNECTED");
    expect(data.nebiusModelAvailable).toBe(true);
    expect(data.tavilyConfigured).toBe(true);
    expect(data.tavilyStatus).toBe("CONNECTED");
    expect(data.tavilySearchAvailable).toBe(true);
  });

  it("reports CONFIGURED if Nebius key is valid but configured model is missing from catalogue", async () => {
    process.env.NEBIUS_API_KEY = "mock-nebius-key";
    process.env.TAVILY_API_KEY = "tvly-mock-key";
    process.env.NEBIUS_MODEL = "custom-nonexistent-model";

    global.fetch = vi.fn().mockImplementation((url: string | URL | Request) => {
      const urlStr = url.toString();
      if (urlStr.includes("nebius.com")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            data: [{ id: "other-model-1" }, { id: "other-model-2" }],
          }),
        });
      }
      if (urlStr.includes("tavily.com")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ key: { usage: 1 } }),
        });
      }
      return Promise.reject(new Error("Unknown URL"));
    });

    const req = new NextRequest("http://localhost:3000/api/status?refresh=true");
    const res = await GET(req);
    const data = await res.json();

    expect(data.nebiusStatus).toBe("CONFIGURED");
    expect(data.nebiusModelAvailable).toBe(false);
    expect(data.nebiusError).toContain("was not found");
  });

  it("reports FAILED when API credentials return 401 Unauthorized without leaking secrets", async () => {
    const sensitiveNebiusSecret = "v1.superSecretNebiusKey999";
    const sensitiveTavilySecret = "tvly-secret123456789";
    process.env.NEBIUS_API_KEY = sensitiveNebiusSecret;
    process.env.TAVILY_API_KEY = sensitiveTavilySecret;

    global.fetch = vi.fn().mockImplementation((url: string | URL | Request) => {
      const urlStr = url.toString();
      if (urlStr.includes("nebius.com")) {
        return Promise.resolve({
          ok: false,
          status: 401,
          json: async () => ({ error: "Unauthorized" }),
        });
      }
      if (urlStr.includes("tavily.com")) {
        return Promise.resolve({
          ok: false,
          status: 403,
          json: async () => ({ detail: "Forbidden" }),
        });
      }
      return Promise.reject(new Error("Unknown URL"));
    });

    const req = new NextRequest("http://localhost:3000/api/status?refresh=true");
    const res = await GET(req);
    const data = await res.json();

    expect(data.nebiusStatus).toBe("FAILED");
    expect(data.nebiusError).toContain("Authentication failed (HTTP 401)");
    expect(data.tavilyStatus).toBe("FAILED");
    expect(data.tavilyError).toContain("Authentication failed (HTTP 403)");

    // Crucial safety check: secrets must NEVER be present anywhere in the output
    const jsonStr = JSON.stringify(data);
    expect(jsonStr).not.toContain(sensitiveNebiusSecret);
    expect(jsonStr).not.toContain(sensitiveTavilySecret);
  });

  it("reports RATE_LIMITED on cold start when Tavily usage endpoint returns 429 without prior verification", async () => {
    process.env.NEBIUS_API_KEY = "mock-nebius-key";
    process.env.TAVILY_API_KEY = "tvly-mock-key";
    process.env.NEBIUS_MODEL = "nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B";

    global.fetch = vi.fn().mockImplementation((url: string | URL | Request) => {
      const urlStr = url.toString();
      if (urlStr.includes("nebius.com")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ data: [{ id: "nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B" }] }),
        });
      }
      if (urlStr.includes("tavily.com")) {
        return Promise.resolve({
          ok: false,
          status: 429,
          json: async () => ({ detail: { error: "Request limit exceeded" } }),
        });
      }
      return Promise.reject(new Error("Unknown URL"));
    });

    // Cold start invocation without any clientTavilyVerified query param
    const res = await GET(new NextRequest("http://localhost:3000/api/status?refresh=true"));
    const data = await res.json();

    // Never claim CONNECTED if unverified on cold start
    expect(data.tavilyStatus).toBe("RATE_LIMITED");
    expect(data.tavilyStatusCode).toBe(429);
    expect(data.tavilySearchAvailable).toBe(true);
    expect(data.tavilyIsStale).toBeFalsy();
    expect(data.tavilyError).toContain("HTTP 429");
  });

  it("retains CONNECTED labeled as STALE when client provides prior verification timestamp during a 429 rate limit", async () => {
    process.env.NEBIUS_API_KEY = "mock-nebius-key";
    process.env.TAVILY_API_KEY = "tvly-mock-key";
    process.env.NEBIUS_MODEL = "nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B";

    global.fetch = vi.fn().mockImplementation((url: string | URL | Request) => {
      const urlStr = url.toString();
      if (urlStr.includes("nebius.com")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ data: [{ id: "nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B" }] }),
        });
      }
      if (urlStr.includes("tavily.com")) {
        return Promise.resolve({
          ok: false,
          status: 429,
          json: async () => ({ detail: { error: "Your request has been blocked due to excessive requests." } }),
        });
      }
      return Promise.reject(new Error("Unknown URL"));
    });

    const clientVerifiedTime = "2026-10-25T18:00:00.000Z";
    const req = new NextRequest(`http://localhost:3000/api/status?refresh=true&clientTavilyVerified=${encodeURIComponent(clientVerifiedTime)}`);
    const res = await GET(req);
    const data = await res.json();

    // Must return STALE status with the timestamp provided
    expect(data.tavilyStatus).toBe("STALE");
    expect(data.tavilyIsStale).toBe(true);
    expect(data.tavilyStaleTimestamp).toBe(clientVerifiedTime);
    expect(data.tavilyStatusCode).toBe(429);
    expect(data.tavilyError).toContain("HTTP 429");
    expect(data.tavilyError).toContain("STALE");
  });

  it("verifies that GET /api/status never executes unprotected searches and queries /usage safely", async () => {
    process.env.NEBIUS_API_KEY = "mock-nebius-key";
    process.env.TAVILY_API_KEY = "tvly-mock-key";
    process.env.NEBIUS_MODEL = "nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B";

    let searchCalled = false;
    let usageCalled = false;
    global.fetch = vi.fn().mockImplementation((url: string | URL | Request) => {
      const urlStr = url.toString();
      if (urlStr.includes("nebius.com")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ data: [{ id: "nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B" }] }),
        });
      }
      if (urlStr.includes("tavily.com/search")) {
        searchCalled = true;
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ results: [] }),
        });
      }
      if (urlStr.includes("tavily.com/usage")) {
        usageCalled = true;
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ plan: "Developer", searches_used: 10 }),
        });
      }
      return Promise.reject(new Error("Unknown URL"));
    });

    const req = new NextRequest("http://localhost:3000/api/status");
    const res = await GET(req);
    const data = await res.json();

    // Must NEVER execute search on status polling
    expect(searchCalled).toBe(false);
    expect(usageCalled).toBe(true);
    expect(data.tavilyStatus).toBe("CONNECTED");
    expect(data.tavilyStatusCode).toBe(200);
    expect(data.tavilySearchAvailable).toBe(true);
    expect(data.tavilyIsStale).toBeFalsy();
  });

  it("verifies real Nebius model generation when verifyInference=true returns 200 OK", async () => {
    process.env.NEBIUS_API_KEY = "mock-nebius-key";
    process.env.TAVILY_API_KEY = "tvly-mock-key";
    process.env.NEBIUS_MODEL = "nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B";

    let inferenceCalled = false;
    global.fetch = vi.fn().mockImplementation((url: string | URL | Request) => {
      const urlStr = url.toString();
      if (urlStr.includes("/chat/completions")) {
        inferenceCalled = true;
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            choices: [{ message: { content: "pong" } }],
          }),
        });
      }
      if (urlStr.includes("tavily.com")) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ key: { usage: 1 } }),
        });
      }
      return Promise.reject(new Error("Unknown URL"));
    });

    const req = new NextRequest("http://localhost:3000/api/status?verifyInference=true");
    const res = await GET(req);
    const data = await res.json();

    expect(inferenceCalled).toBe(true);
    expect(data.nebiusStatus).toBe("CONNECTED");
    expect(data.nebiusInferenceAvailable).toBe(true);
    expect(data.nebiusInferenceTested).toBe(true);
  });

  it("handles network timeout gracefully without crashing", async () => {
    process.env.NEBIUS_API_KEY = "mock-nebius-key";
    process.env.TAVILY_API_KEY = "tvly-mock-key";

    global.fetch = vi.fn().mockImplementation(() => {
      const err = new Error("The operation was aborted due to timeout");
      err.name = "AbortError";
      return Promise.reject(err);
    });

    const res = await GET(new NextRequest("http://localhost:3000/api/status?refresh=true"));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.nebiusStatus).toBe("FAILED");
    expect(data.nebiusError).toContain("timed out");
    expect(data.tavilyStatus).toBe("FAILED");
    expect(data.tavilyError).toContain("timed out");
  });
});
