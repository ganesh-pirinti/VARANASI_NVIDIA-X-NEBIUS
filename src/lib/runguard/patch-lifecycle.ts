import { sha256 } from "../crypto/sha256";
import { ProposedPatch } from "@/types/runguard";

export type PatchLifecycleStatus = "GENERATED" | "APPROVED" | "APPLIED" | "RE_VERIFIED" | "VERIFICATION_FAILED";

export interface PatchTransitionResult {
  valid: boolean;
  newStatus?: PatchLifecycleStatus;
  approvedHash?: string;
  error?: string;
}

/**
 * Computes a deterministic SHA-256 hash of a patch's target file and content.
 * Binds human approval to the EXACT byte representation of the patch.
 */
export function computePatchContentHash(patch: {
  targetFile: string;
  originalContent: string;
  patchedContent: string;
}): string {
  const canonical = `${patch.targetFile}::${patch.originalContent}::${patch.patchedContent}`;
  return sha256(canonical);
}

/**
 * Validates state transitions in the human-controlled patch lifecycle:
 * GENERATED → APPROVED → APPLIED → RE-VERIFIED
 *
 * Rules:
 * 1. A patch must be explicitly APPROVED by a human before it can be APPLIED.
 * 2. If the patch content changes after approval, the approval is invalidated.
 * 3. A patch can only become RE_VERIFIED if independent checks confirm the fix.
 */
export function transitionPatchLifecycle(
  patch: ProposedPatch,
  targetStatus: PatchLifecycleStatus,
  options?: {
    approvedHash?: string;
    deterministicPassed?: boolean;
    verificationNotes?: string;
  }
): PatchTransitionResult {
  const currentHash = computePatchContentHash(patch);

  switch (targetStatus) {
    case "APPROVED": {
      // Any patch in GENERATED, APPLIED, or VERIFICATION_FAILED state can be approved
      return {
        valid: true,
        newStatus: "APPROVED",
        approvedHash: currentHash,
      };
    }

    case "APPLIED": {
      // Must be currently in APPROVED state
      if (patch.status !== "APPROVED") {
        return {
          valid: false,
          error: `Cannot apply patch in '${patch.status}' state. Patch must be explicitly APPROVED by human operator first.`,
        };
      }

      // Must match approved content hash
      const expectedHash = options?.approvedHash || (patch as any).approvedHash;
      if (!expectedHash || expectedHash !== currentHash) {
        return {
          valid: false,
          error: "Patch content was modified after human approval. You must review and re-approve the updated patch.",
        };
      }

      return {
        valid: true,
        newStatus: "APPLIED",
        approvedHash: expectedHash,
      };
    }

    case "RE_VERIFIED": {
      // Must be currently in APPLIED state
      if (patch.status !== "APPLIED") {
        return {
          valid: false,
          error: `Cannot verify patch in '${patch.status}' state. Patch must be APPLIED to the workload before independent re-verification.`,
        };
      }

      // Independent deterministic checks must have executed and passed
      if (!options?.deterministicPassed) {
        return {
          valid: false,
          newStatus: "VERIFICATION_FAILED",
          error: options?.verificationNotes || "Deterministic preflight checks did not pass. Patch remains unverified.",
        };
      }

      return {
        valid: true,
        newStatus: "RE_VERIFIED",
      };
    }

    case "GENERATED": {
      return {
        valid: true,
        newStatus: "GENERATED",
      };
    }

    default:
      return {
        valid: false,
        error: `Unsupported patch transition to '${targetStatus}'.`,
      };
  }
}
