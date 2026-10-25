import { NextRequest, NextResponse } from "next/server";
import { runPreflightChecks } from "@/lib/preflight/engine";
import { PreflightRequestSchema, formatZodError } from "@/lib/security/validators";
import { readBoundedJson } from "@/lib/security/request-parser";

export async function POST(req: NextRequest) {
  try {
    const parsed = await readBoundedJson(req, 5 * 1024 * 1024);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error || "Invalid request body." },
        { status: parsed.status || 400 }
      );
    }

    const rawBody = parsed.data;

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
