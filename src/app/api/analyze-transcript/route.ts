export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireInternalSecret } from "@/lib/auth";

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

    const fullText = transcript.map((t: any) => `Q: ${t.question}\nA: ${t.answer || t.text || ""}`).join("\n\n");
    const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

    const prompt = `Analyze the following candidate interview transcript and perform a comprehensive assessment. 
You must respond with a JSON object matching this exact schema:
{
  "communication": number (0-100),
  "technical": number (0-100),
  "problemSolving": number (0-100),
  "professionalism": number (0-100),
  "leadership": number (0-100),
  "confidence": number (0-100),
  "fluency": number (0-100),
  "fillerWordCount": number,
  "fillerWords": string[],
  "tone": string (e.g. "Positive", "Professional", "Cautious"),
  "sentiment": string (e.g. "Positive", "Neutral", "Mixed"),
  "recommendation": string ("Strongly Recommend", "Recommend", "Consider", "Not Recommended"),
  "recommendationReason": string (detailed reasoning),
  "ownershipSignals": string[] (up to 5 sentences or examples of accountability/ownership),
  "hesitationPatterns": string[] (up to 4 patterns or filler patterns observed),
  "leadershipIndicators": string[] (up to 4 leadership signals or quotes),
  "keyObservations": string[] (at least 4 key overall observations about candidate's readiness),
  "behavioralSignals": {
    "ownership": number (0-100),
    "hesitation": number (0-100),
    "confidence": number (0-100),
    "communication": number (0-100)
  },
  "practicalExperienceScore": number (0-100),
  "technicalGaps": string[] (up to 3 observed technical gaps or lack of mentions)
}

Interview transcript:
${fullText}

Respond ONLY with the JSON object. Do not include markdown code block formatting or introductory text.`;

    const chatRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${secret}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: model,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: "You are an expert HR recruitment assistant. Respond ONLY in JSON." },
          { role: "user", content: prompt }
        ],
        temperature: 0.2
      })
    });

    if (!chatRes.ok) {
      const errorText = await chatRes.text();
      console.error("Groq Chat completions failed:", errorText);
      return NextResponse.json({ error: "Groq API error" }, { status: 502 });
    }

    const chatData = await chatRes.json();
    const contentStr = chatData.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(contentStr);

    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error("Analyze transcript error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
