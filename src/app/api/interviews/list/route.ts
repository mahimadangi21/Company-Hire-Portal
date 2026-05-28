import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = getServiceSupabase();
    
    // Fetch all interviews, ordering by newest first
    const { data, error } = await supabase
      .from("interviews")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching interviews:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Internal Server Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
