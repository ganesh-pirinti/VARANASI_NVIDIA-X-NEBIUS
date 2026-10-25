import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GET } from "@/app/api/status/route";
import { NextRequest } from "next/server";

describe("System Status API Route (/api/status)", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
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
    expect(data.nebiusError).toContain("Authentication failed (401)");
    expect(data.tavilyStatus).toBe("FAILED");
    expect(data.tavilyError).toContain("Authentication failed (403)");

    // Crucial safety check: secrets must NEVER be present anywhere in the output
    const jsonStr = JSON.stringify(data);
    expect(jsonStr).not.toContain(sensitiveNebiusSecret);
    expect(jsonStr).not.toContain(sensitiveTavilySecret);
  });
});
