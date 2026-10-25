import { NextRequest, NextResponse } from "next/server";
import { calculateFinOpsCost, compareFinOpsConfigurations } from "@/lib/finops/calculator";
import { FinOpsCalculateRequestSchema, formatZodError } from "@/lib/security/validators";
import { readBoundedJson } from "@/lib/security/request-parser";

export async function POST(req: NextRequest) {
  try {
    const parsed = await readBoundedJson(req, 128 * 1024);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error || "Invalid request body." },
        { status: parsed.status || 400 }
      );
    }

    const rawBody = parsed.data;

    const validation = FinOpsCalculateRequestSchema.safeParse(rawBody);
    if (!validation.success) {
      return NextResponse.json(
        { error: formatZodError(validation.error) },
        { status: 400 }
      );
    }

    const body = validation.data;
    const baselineResult = calculateFinOpsCost(body.baselineGpu, body.baselineModel);

    // If proposed configuration is provided, compare baseline vs proposed
    if (body.proposedGpu || body.proposedModel) {
      const proposedResult = calculateFinOpsCost(body.proposedGpu, body.proposedModel);
      const comparison = compareFinOpsConfigurations(baselineResult, proposedResult, {
        baselineGpuId: body.baselineGpu?.gpuId,
        proposedGpuId: body.proposedGpu?.gpuId,
        baselinePrecision: body.context?.baselinePrecision,
        proposedPrecision: body.context?.proposedPrecision,
        modelParamBillion: body.context?.modelParamBillion,
        isEmpiricallyBenchmarked: body.context?.isEmpiricallyBenchmarked,
      });

      return NextResponse.json({
        type: "COMPARISON",
        comparison,
      });
    }

    return NextResponse.json({
      type: "SINGLE",
      result: baselineResult,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json(
      { error: `FinOps calculation failed: ${errorMsg}` },
      { status: 500 }
    );
  }
}
