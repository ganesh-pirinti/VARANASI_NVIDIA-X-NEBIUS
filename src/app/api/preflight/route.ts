import { NextRequest, NextResponse } from "next/server";
import { runPreflightChecks } from "@/lib/preflight/engine";
import { PreflightRequestSchema, formatZodError } from "@/lib/security/validators";

export async function POST(req: NextRequest) {
  try {
    let rawBody;
    try {
      rawBody = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Malformed JSON request body." },
        { status: 400 }
      );
    }

    // Guard against oversized payload (limit to 5MB)
    const contentPayloadSize = 
      (typeof rawBody?.dockerfileContent === "string" ? rawBody.dockerfileContent.length : 0) +
      (typeof rawBody?.requirementsContent === "string" ? rawBody.requirementsContent.length : 0) +
      (typeof rawBody?.workloadConfigContent === "string" ? rawBody.workloadConfigContent.length : 0) +
      (typeof rawBody?.diagnosticLogContent === "string" ? rawBody.diagnosticLogContent.length : 0);

    if (contentPayloadSize > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Payload exceeds safe maximum limit of 5MB." },
        { status: 413 }
      );
    }

    const validation = PreflightRequestSchema.safeParse(rawBody);
    if (!validation.success) {
      return NextResponse.json(
        { error: formatZodError(validation.error) },
        { status: 400 }
      );
    }

    const report = runPreflightChecks(validation.data as any);
    return NextResponse.json(report);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json(
      { error: `Preflight evaluation failed: ${errorMsg}` },
      { status: 500 }
    );
  }
}
