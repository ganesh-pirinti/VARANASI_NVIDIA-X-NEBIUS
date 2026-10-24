import { NextRequest, NextResponse } from "next/server";
import { runPreflightChecks } from "@/lib/preflight/engine";
import { PreflightInputs } from "@/types/runguard";

export async function POST(req: NextRequest) {
  try {
    const body: PreflightInputs = await req.json();

    // Guard against oversized payload (limit to 5MB)
    const contentPayloadSize = 
      (body.dockerfileContent?.length || 0) +
      (body.requirementsContent?.length || 0) +
      (body.workloadConfigContent?.length || 0) +
      (body.diagnosticLogContent?.length || 0);

    if (contentPayloadSize > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Payload exceeds safe maximum limit of 5MB." },
        { status: 413 }
      );
    }

    const report = runPreflightChecks(body);
    return NextResponse.json(report);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json(
      { error: `Preflight evaluation failed: ${errorMsg}` },
      { status: 500 }
    );
  }
}
