import { describe, it, expect } from "vitest";
import {
  computePatchContentHash,
  transitionPatchLifecycle,
} from "@/lib/runguard/patch-lifecycle";
import { ProposedPatch } from "@/types/runguard";

describe("Human-Controlled Patch Lifecycle & Content Binding", () => {
  const basePatch: ProposedPatch = {
    id: "patch-test-1",
    title: "Remediation Patch for /dev/shm",
    targetFile: "workload.yaml",
    originalContent: "services:\n  runner:\n    image: vllm:latest",
    patchedContent: "services:\n  runner:\n    image: vllm:latest\n    shm_size: '16gb'",
    diff: "+ shm_size: '16gb'",
    explanation: ["Increase shared memory to avoid Bus error: SIGBUS"],
    status: "GENERATED",
    createdAt: new Date().toISOString(),
  };

  it("computes deterministic SHA-256 hash across targetFile, originalContent, and patchedContent", () => {
    const hash1 = computePatchContentHash(basePatch);
    const hash2 = computePatchContentHash(basePatch);

    expect(hash1).toBe(hash2);
    expect(hash1).toMatch(/^[a-f0-9]{64}$/);

    // Modifying content produces different hash
    const modifiedPatch = { ...basePatch, patchedContent: basePatch.patchedContent + "\n    ipc: host" };
    const hash3 = computePatchContentHash(modifiedPatch);
    expect(hash3).not.toBe(hash1);
  });

  it("permits human approval and binds the approved content hash", () => {
    const result = transitionPatchLifecycle(basePatch, "APPROVED");

    expect(result.valid).toBe(true);
    expect(result.newStatus).toBe("APPROVED");
    expect(result.approvedHash).toBe(computePatchContentHash(basePatch));
  });

  it("rejects transition to APPLIED if patch was not APPROVED first", () => {
    // Attempting to apply a GENERATED patch without human approval
    const result = transitionPatchLifecycle(basePatch, "APPLIED");

    expect(result.valid).toBe(false);
    expect(result.error).toContain("must be explicitly APPROVED");
  });

  it("allows applying an approved patch when content hash matches", () => {
    const approved = transitionPatchLifecycle(basePatch, "APPROVED");
    const approvedPatch: ProposedPatch = {
      ...basePatch,
      status: "APPROVED",
      approvedAt: new Date().toISOString(),
    };

    const applied = transitionPatchLifecycle(approvedPatch, "APPLIED", {
      approvedHash: approved.approvedHash,
    });

    expect(applied.valid).toBe(true);
    expect(applied.newStatus).toBe("APPLIED");
  });

  it("invalidates approval if patch content is tampered with or modified before applying", () => {
    const approved = transitionPatchLifecycle(basePatch, "APPROVED");

    // Attacker or inadvertent code alters patched content after operator approved it
    const tamperedPatch: ProposedPatch = {
      ...basePatch,
      patchedContent: "services:\n  malicious_runner:\n    image: evil:latest",
      status: "APPROVED",
    };

    const applied = transitionPatchLifecycle(tamperedPatch, "APPLIED", {
      approvedHash: approved.approvedHash,
    });

    expect(applied.valid).toBe(false);
    expect(applied.error).toContain("modified after human approval");
  });

  it("rejects RE_VERIFIED if deterministic checks failed or did not pass", () => {
    const appliedPatch: ProposedPatch = {
      ...basePatch,
      status: "APPLIED",
    };

    // Independent checks ran and reported failure
    const result = transitionPatchLifecycle(appliedPatch, "RE_VERIFIED", {
      deterministicPassed: false,
      verificationNotes: "Preflight check still reports OOM risk.",
    });

    expect(result.valid).toBe(false);
    expect(result.newStatus).toBe("VERIFICATION_FAILED");
    expect(result.error).toContain("still reports OOM risk");
  });

  it("confirms RE_VERIFIED only when independent deterministic checks genuinely pass", () => {
    const appliedPatch: ProposedPatch = {
      ...basePatch,
      status: "APPLIED",
    };

    const result = transitionPatchLifecycle(appliedPatch, "RE_VERIFIED", {
      deterministicPassed: true,
    });

    expect(result.valid).toBe(true);
    expect(result.newStatus).toBe("RE_VERIFIED");
  });
});
