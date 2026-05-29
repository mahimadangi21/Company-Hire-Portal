export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireInternalSecret } from "@/lib/auth";
import { analyzeTranscriptWithGroq } from "@/services/groqTranscriptAnalyzer";

export async function POST(request: NextRequest) {
  const authError = await requireInternalSecret(request);
  if (authError) return authError;

  try {
    const { transcript } = await request.json();
    if (!transcript || !Array.isArray(transcript)) {
      return NextResponse.json({ error: "Transcript array is required" }, { status: 400 });
    }

    const secret = process.env.GROQ_API_KEY;
    if (!secret) {
      return NextResponse.json({ error: "Groq API key not configured" }, { status: 501 });
    }

    console.log("[API analyze-transcript] Invoking high-quality chunked Groq transcript analyzer...");
    const result = await analyzeTranscriptWithGroq(transcript);

    if ('error' in result) {
      return NextResponse.json({ error: result.message }, { status: 502 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[API analyze-transcript] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
