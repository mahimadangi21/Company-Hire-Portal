import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/server";

// Fetch all global questions
export async function GET() {
  try {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from("questions_bank")
      .select("*")
      .order("job_role", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching questions:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Internal Server Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Add a new question to a job role
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { job_role, question_text, is_mandatory } = body;

    if (!job_role || !question_text) {
      return NextResponse.json(
        { error: "job_role and question_text are required" },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from("questions_bank")
      .insert({
        job_role,
        question_text,
        is_mandatory: is_mandatory || false
      })
      .select()
      .single();

    if (error) {
      console.error("Error inserting question:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Internal Server Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
