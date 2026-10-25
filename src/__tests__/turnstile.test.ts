import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { verifyTurnstileToken } from "@/lib/security/turnstile";

describe("Cloudflare Turnstile Server-Side Verification Helper", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it("fails with HTTP 400 when token is missing or empty", async () => {
    process.env.TURNSTILE_SECRET_KEY = "1x0000000000000000000000000000000AA";

    const res1 = await verifyTurnstileToken({});
    expect(res1.success).toBe(false);
    expect(res1.status).toBe(400);
    expect(res1.error).toContain("Security verification token is missing");

    const res2 = await verifyTurnstileToken({ token: "   " });
    expect(res2.success).toBe(false);
    expect(res2.status).toBe(400);
  });

  it("fails closed with HTTP 503 when TURNSTILE_SECRET_KEY is not configured on the server", async () => {
    delete process.env.TURNSTILE_SECRET_KEY;

    const res = await verifyTurnstileToken({ token: "dummy_valid_token" });
    expect(res.success).toBe(false);
    expect(res.status).toBe(503);
    expect(res.error).toContain("Security verification is not configured on the server");
  });

  it("successfully validates a valid token against Cloudflare siteverify", async () => {
    process.env.TURNSTILE_SECRET_KEY = "1x0000000000000000000000000000000AA";

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        challenge_ts: "2026-10-26T00:00:00.000Z",
        hostname: "varanasi.vercel.app",
        action: "varanasi_diagnose",
      }),
    });

    const res = await verifyTurnstileToken({
      token: "valid_cf_token",
      action: "varanasi_diagnose",
      clientIp: "203.0.113.195",
      idempotencyKey: "test-idempotency-key-1",
    });

    expect(res.success).toBe(true);
    expect(res.status).toBe(200);
    expect(res.hostname).toBe("varanasi.vercel.app");
    expect(res.action).toBe("varanasi_diagnose");
    expect(res.timestamp).toBe("2026-10-26T00:00:00.000Z");

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [callUrl, callOptions] = (global.fetch as any).mock.calls[0];
    expect(callUrl).toBe("https://challenges.cloudflare.com/turnstile/v0/siteverify");
    expect(callOptions.method).toBe("POST");
    expect(callOptions.body).toContain("secret=1x0000000000000000000000000000000AA");
    expect(callOptions.body).toContain("response=valid_cf_token");
    expect(callOptions.body).toContain("remoteip=203.0.113.195");
    expect(callOptions.body).toContain("idempotency_key=test-idempotency-key-1");
  });

  it("handles invalid-input-response error code with sanitized HTTP 403 message", async () => {
    process.env.TURNSTILE_SECRET_KEY = "1x0000000000000000000000000000000AA";

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        success: false,
        "error-codes": ["invalid-input-response"],
      }),
    });

    const res = await verifyTurnstileToken({ token: "invalid_token" });
    expect(res.success).toBe(false);
    expect(res.status).toBe(403);
    expect(res.error).toBe("Security token was invalid or malformed.");
  });

  it("handles timeout-or-duplicate error code with expired HTTP 403 message", async () => {
    process.env.TURNSTILE_SECRET_KEY = "1x0000000000000000000000000000000AA";

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        success: false,
        "error-codes": ["timeout-or-duplicate"],
      }),
    });

    const res = await verifyTurnstileToken({ token: "reused_token" });
    expect(res.success).toBe(false);
    expect(res.status).toBe(403);
    expect(res.error).toBe("Security token has expired or has already been used. Please refresh.");
  });

  it("rejects token when action does not match expected action", async () => {
    process.env.TURNSTILE_SECRET_KEY = "1x0000000000000000000000000000000AA";

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        action: "wrong_action",
        hostname: "varanasi.vercel.app",
      }),
    });

    const res = await verifyTurnstileToken({
      token: "valid_token",
      action: "varanasi_diagnose",
    });

    expect(res.success).toBe(false);
    expect(res.status).toBe(403);
    expect(res.error).toContain("action mismatch");
  });

  it("enforces allowed hostnames whitelist", async () => {
    process.env.TURNSTILE_SECRET_KEY = "1x0000000000000000000000000000000AA";
    process.env.TURNSTILE_ALLOWED_HOSTNAMES = "varanasi.vercel.app, localhost";

    // 1. Unauthorized hostname rejected
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        hostname: "attacker-site.com",
      }),
    });

    const resUnauthorized = await verifyTurnstileToken({ token: "valid_token" });
    expect(resUnauthorized.success).toBe(false);
    expect(resUnauthorized.status).toBe(403);
    expect(resUnauthorized.error).toContain("hostname is not authorized");

    // 2. Exact match accepted
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        hostname: "varanasi.vercel.app",
      }),
    });

    const resExact = await verifyTurnstileToken({ token: "valid_token" });
    expect(resExact.success).toBe(true);
    expect(resExact.status).toBe(200);

    // 3. Subdomain match accepted
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        hostname: "preview-123.varanasi.vercel.app",
      }),
    });

    const resSub = await verifyTurnstileToken({ token: "valid_token" });
    expect(resSub.success).toBe(true);

    // 4. Wildcard allows any hostname
    process.env.TURNSTILE_ALLOWED_HOSTNAMES = "*";
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        hostname: "any-host.com",
      }),
    });

    const resWildcard = await verifyTurnstileToken({ token: "valid_token" });
    expect(resWildcard.success).toBe(true);
  });

  it("returns HTTP 503 if Cloudflare siteverify endpoint returns HTTP 500 error", async () => {
    process.env.TURNSTILE_SECRET_KEY = "1x0000000000000000000000000000000AA";

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    const res = await verifyTurnstileToken({ token: "valid_token" });
    expect(res.success).toBe(false);
    expect(res.status).toBe(503);
    expect(res.error).toContain("HTTP 500");
  });

  it("returns HTTP 504 on verification timeout", async () => {
    process.env.TURNSTILE_SECRET_KEY = "1x0000000000000000000000000000000AA";

    const abortError = new Error("The user aborted a request.");
    abortError.name = "AbortError";
    global.fetch = vi.fn().mockRejectedValueOnce(abortError);

    const res = await verifyTurnstileToken({ token: "valid_token", timeoutMs: 100 });
    expect(res.success).toBe(false);
    expect(res.status).toBe(504);
    expect(res.error).toContain("timed out");
  });

  it("returns HTTP 503 on network failure", async () => {
    process.env.TURNSTILE_SECRET_KEY = "1x0000000000000000000000000000000AA";

    global.fetch = vi.fn().mockRejectedValueOnce(new Error("Network connection reset"));

    const res = await verifyTurnstileToken({ token: "valid_token" });
    expect(res.success).toBe(false);
    expect(res.status).toBe(503);
    expect(res.error).toContain("temporarily unreachable");
  });
});
