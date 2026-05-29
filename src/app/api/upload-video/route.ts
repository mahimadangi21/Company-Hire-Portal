import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/server";
import { requireInternalSecret } from "@/lib/auth";
import * as fs from "fs";
import * as path from "path";

export const dynamic = "force-dynamic";

function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return !!(url && url.startsWith("http") && !url.includes("your_supabase_project_url") && !url.includes("gsevnubsikjmonlpoeux"));
}

export async function POST(request: NextRequest) {
  const authError = await requireInternalSecret(request);
  if (authError) return authError;

  try {
    const formData = await request.formData();
    const file = formData.get("video") as File | null;
    const candidateId = formData.get("candidateId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No video file provided." }, { status: 400 });
    }
    if (!candidateId) {
      return NextResponse.json({ error: "No candidate ID provided." }, { status: 400 });
    }

    let videoUrl = "";

    if (isSupabaseConfigured()) {
      console.log("Uploading video to real Supabase Storage...");
      const supabase = getServiceSupabase();
      const filename = `technical-interviews/${candidateId}-${Date.now()}.mp4`;
      const buffer = Buffer.from(await file.arrayBuffer());

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("interview-recordings")
        .upload(filename, buffer, {
          contentType: file.type || "video/mp4",
          upsert: true
        });

      if (uploadError) {
        console.error("Supabase upload error:", uploadError);
        return NextResponse.json({ error: `Supabase upload failed: ${uploadError.message}` }, { status: 500 });
      }

      const { data: publicUrlData } = supabase.storage
        .from("interview-recordings")
        .getPublicUrl(filename);

      videoUrl = publicUrlData?.publicUrl || "";
      console.log("Successfully uploaded to Supabase:", videoUrl);
    } else {
      console.log("Mock Supabase connection: saving video locally...");
      const filename = `${candidateId}-${Date.now()}.mp4`;
      const uploadsDir = path.join(process.cwd(), "public", "uploads");

      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const filePath = path.join(uploadsDir, filename);
      const buffer = Buffer.from(await file.arrayBuffer());
      fs.writeFileSync(filePath, buffer);

      videoUrl = `/uploads/${filename}`;
      console.log("Successfully saved locally:", videoUrl);
    }

    return NextResponse.json({ success: true, videoUrl });
  } catch (error: any) {
    console.error("Upload Error:", error);
    return NextResponse.json({ error: error.message || "Failed to upload video." }, { status: 500 });
  }
}
