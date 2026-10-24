import { NextRequest, NextResponse } from "next/server";
import { calculateFinOpsCost, compareFinOpsConfigurations } from "@/lib/finops/calculator";
import { GpuWorkloadInput, ModelInferenceInput } from "@/types/finops";

export interface FinOpsCalculatePayload {
  baselineGpu?: GpuWorkloadInput;
  baselineModel?: ModelInferenceInput;
  proposedGpu?: GpuWorkloadInput;
  proposedModel?: ModelInferenceInput;
  context?: {
    baselineGpuId?: string;
    proposedGpuId?: string;
    baselinePrecision?: string;
    proposedPrecision?: string;
    modelParamBillion?: number;
  };
}

export async function POST(req: NextRequest) {
  try {
    const body: FinOpsCalculatePayload = await req.json();

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
