import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/server";
import { requireInternalSecret } from "@/lib/auth";
import { encrypt } from "@/lib/encryption";

export async function GET(request: NextRequest) {
  const authError = await requireInternalSecret(request);
  if (authError) return authError;

  try {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from("email_settings")
      .select("id, email, provider, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching email settings:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Internal Server Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authError = await requireInternalSecret(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { email, password, provider } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "email and password are required" },
        { status: 400 }
      );
    }

    const encrypted_password = encrypt(password);

    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from("email_settings")
      .insert({
        email,
        encrypted_password,
        provider: provider || 'gmail'
      })
      .select("id, email, provider, created_at")
      .single();

    if (error) {
      console.error("Error inserting email setting:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Internal Server Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const authError = await requireInternalSecret(request);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return NextResponse.json(
        { error: "id is required for deletion" },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();
    const { error } = await supabase
      .from("email_settings")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting email setting:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Internal Server Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": process.env.NEXT_PUBLIC_PORTAL_URL || "http://localhost:5173",
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, x-api-key",
    },
  });
}
