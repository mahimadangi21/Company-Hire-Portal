import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { candidate_name, candidate_email, job_role, number_of_questions, expires_at } = body;

    if (!candidate_name || !candidate_email || !job_role || !number_of_questions) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // 1. Fetch questions for the job role
    const { data: questions, error: qError } = await supabase
      .from("questions_bank")
      .select("*")
      .eq("job_role", job_role);

    if (qError) {
      return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 });
    }

    if (!questions || questions.length === 0) {
      return NextResponse.json({ error: "No questions found for this job role" }, { status: 400 });
    }

    // 2. Separate mandatory and optional
    const mandatory = questions.filter(q => q.is_mandatory);
    const optional = questions.filter(q => !q.is_mandatory);

    // 3. Select the questions
    let selectedQuestions: string[] = [];
    const targetCount = parseInt(number_of_questions);

    // Always include all mandatory questions first (up to the target count, but typically we want all mandatory)
    // If mandatory count > targetCount, we just take targetCount mandatory questions
    if (mandatory.length >= targetCount) {
      selectedQuestions = mandatory.slice(0, targetCount).map(q => q.question_text);
    } else {
      // Add all mandatory
      selectedQuestions = [...mandatory.map(q => q.question_text)];
      
      // Randomly pick the rest from optional
      const remainingNeeded = targetCount - mandatory.length;
      const shuffledOptional = optional.sort(() => 0.5 - Math.random());
      
      const additional = shuffledOptional.slice(0, remainingNeeded).map(q => q.question_text);
      selectedQuestions = [...selectedQuestions, ...additional];
    }

    if (selectedQuestions.length === 0) {
      return NextResponse.json({ error: "Could not select any questions" }, { status: 400 });
    }

    // 4. Create the interview in Supabase
    const expiry = expires_at || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    
    const { data: interview, error: insertError } = await supabase
      .from("interviews")
      .insert({
        candidate_name,
        candidate_email,
        job_role,
        questions: selectedQuestions,
        status: "pending",
        expires_at: expiry,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: "Failed to create interview" }, { status: 500 });
    }

    // 5. Send Email via internal API call
    const emailRes = await fetch(new URL("/api/emails/send", req.url).toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "invite",
        to: candidate_email,
        candidateName: candidate_name,
        jobRole: job_role,
        interviewId: interview.id,
        expiresAt: expiry,
      }),
    });

    // 6. Sync status in candidates table
    try {
      await supabase
        .from("candidates")
        .update({
          video_status: "Pending",
          stage: "Video Interview"
        })
        .eq("email", candidate_email);
    } catch (dbErr) {
      console.error("Failed to sync candidate invite status:", dbErr);
    }

    if (!emailRes.ok) {
      console.error("Failed to send email API");
      // We still return success but maybe warn in console
    }

    return NextResponse.json({ success: true, data: interview }, { status: 201 });
  } catch (error: any) {
    console.error("Invite send error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
