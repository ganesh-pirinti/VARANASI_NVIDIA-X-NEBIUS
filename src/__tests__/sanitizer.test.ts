import { describe, it, expect } from "vitest";
import { sanitizeText, truncateLogForInference } from "@/lib/sanitizer";

describe("Sanitizer & Privacy Guard", () => {
  it("redacts API keys with known prefixes", () => {
    const text = "Found key sk-abcdef1234567890abcdef1234567890 and neb_live9876543210fedcba9876543210 and tvly-live_test1234567890abcdef12345";
    const result = sanitizeText(text);

    expect(result.sanitizedText).not.toContain("sk-abcdef");
    expect(result.sanitizedText).not.toContain("neb_live");
    expect(result.sanitizedText).not.toContain("tvly-live");
    expect(result.sanitizedText).toContain("[REDACTED_API_KEY]");
    expect(result.redactedCount).toBeGreaterThanOrEqual(3);
  });

  it("redacts Bearer tokens in headers or logs", () => {
    const text = "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIn0";
    const result = sanitizeText(text);

    expect(result.sanitizedText).toContain("Bearer [REDACTED_BEARER_TOKEN]");
    expect(result.sanitizedText).not.toContain("eyJhbGciOi");
  });

  it("redacts ENV secret assignments", () => {
    const text = "API_KEY=supersecretkey12345\nPASSWORD=mypassword_unencrypted99\nNORMAL_VAR=hello";
    const result = sanitizeText(text);

    expect(result.sanitizedText).toContain("API_KEY=[REDACTED_SECRET]");
    expect(result.sanitizedText).toContain("PASSWORD=[REDACTED_SECRET]");
    expect(result.sanitizedText).toContain("NORMAL_VAR=hello");
    expect(result.sanitizedText).not.toContain("supersecretkey12345");
  });

  it("safely truncates oversized logs preserving head and tail stack trace", () => {
    const lines = [];
    for (let i = 1; i <= 200; i++) {
      lines.push(`Line ${i}: log statement`);
    }
    const log = lines.join("\n");
    const truncated = truncateLogForInference(log, 50);

    expect(truncated).toContain("Line 1:");
    expect(truncated).toContain("Line 200:");
    expect(truncated).toContain("Truncated 150 lines");
  });

  it("redacts Cloudflare Turnstile secret keys", () => {
    const text = "Turnstile secret: 0x4AAAAAAAxxxxxxxxxxxxxxxxxxxxxx or test key 1x0000000000000000000000000000000AA";
    const result = sanitizeText(text);

    expect(result.sanitizedText).not.toContain("0x4AAAAAAA");
    expect(result.sanitizedText).not.toContain("1x0000000000000000000000000000000AA");
    expect(result.sanitizedText).toContain("[REDACTED_CLOUDFLARE_KEY]");
  });

  it("redacts database connection URIs", () => {
    const text = "DATABASE_URL=postgresql://nebius_user:SuperSecretP@ss@db.nebius.internal:5432/varanasi_db";
    const result = sanitizeText(text);

    expect(result.sanitizedText).not.toContain("SuperSecretP@ss");
    expect(result.sanitizedText).toContain("[REDACTED_DB_CONNECTION]");
  });
});
