import { NextRequest, NextResponse } from "next/server";
import { generateRunCostPassport, renderPassportHtml } from "@/lib/passport/generator";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const format = body.format || "json";

    const passport = generateRunCostPassport({
      projectName: body.projectName || "AI Workload",
      targetGpu: body.targetGpu || "NVIDIA H100 SXM5",
      gpuCount: body.gpuCount || 1,
      preflightReport: body.preflightReport,
      diagnosticResult: body.diagnosticResult,
      citations: body.citations,
      finopsComparison: body.finopsComparison,
      fallbackFinops: body.fallbackFinops,
      proposedPatch: body.proposedPatch,
    });

    if (format === "html") {
      const html = renderPassportHtml(passport);
      return new NextResponse(html, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Content-Disposition": `attachment; filename="VARANASI-Passport-${passport.id}.html"`,
        },
      });
    }

    return NextResponse.json(passport);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json(
      { error: `Passport generation failed: ${errorMsg}` },
      { status: 500 }
    );
  }
}
