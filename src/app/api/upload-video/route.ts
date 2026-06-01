import { NextRequest, NextResponse } from "next/server";
import { requireInternalSecret } from "@/lib/auth";
import * as fs from "fs";
import * as path from "path";

export const dynamic = "force-dynamic";

function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return !!(url && url.startsWith("http") && !url.includes("your_supabase_project_url"));
}

export async function POST(request: NextRequest) {
  const authError = await requireInternalSecret(request);
  if (authError) return authError;

  try {
    const formData = await request.formData();
    const file = (formData.get("video") || formData.get("file")) as File | null;
    const candidateId = formData.get("candidateId") as string | null;

    if (!file || file.size === 0) {
      return NextResponse.json({ error: "No video file provided or file is empty." }, { status: 400 });
    }
    if (!candidateId) {
      return NextResponse.json({ error: "No candidate ID provided." }, { status: 400 });
    }

    let videoUrl = "";

    if (isSupabaseConfigured()) {
      console.log("Uploading video to real Supabase Storage via proxy PUT...");
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (!supabaseUrl || !serviceKey) {
        return NextResponse.json(
          { error: 'Missing SUPABASE env variables on server' },
          { status: 500 },
        );
      }

      const bucketName = 'interview-recordings';
      const fileExt = (file.name.split('.').pop() || 'mp4').toLowerCase();
      const uploadPath = `technical-interviews/${candidateId}-${Date.now()}.${fileExt}`;
      const uploadUrl = `${supabaseUrl}/storage/v1/object/${bucketName}/${uploadPath}`;

      const fileBuffer = await file.arrayBuffer();

      const supabaseRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${serviceKey}`,
          'x-upsert': 'true',
          'Content-Type': file.type || 'video/mp4',
          'Content-Length': String(fileBuffer.byteLength),
        },
        body: fileBuffer,
      });

      const responseText = await supabaseRes.text();
      console.log('[upload-video] Supabase status:', supabaseRes.status, responseText);

      if (!supabaseRes.ok) {
        return NextResponse.json(
          { error: `Supabase upload failed: ${supabaseRes.status} — ${responseText}` },
          { status: supabaseRes.status },
        );
      }

      videoUrl = `${supabaseUrl}/storage/v1/object/public/${bucketName}/${uploadPath}`;
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

    return NextResponse.json({ success: true, videoUrl, publicUrl: videoUrl });
  } catch (error: any) {
    console.error("Upload Error:", error);
    return NextResponse.json({ error: error.message || "Failed to upload video." }, { status: 500 });
  }
}
