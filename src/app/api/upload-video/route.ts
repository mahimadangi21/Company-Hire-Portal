import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/upload-video
 *
 * Accepts a raw video file upload from the admin browser and proxies it to
 * Supabase Storage using the SERVICE ROLE KEY, which bypasses RLS.
 *
 * Body: FormData with fields:
 *   file        — the video File
 *   candidateId — string, used to build the storage path
 *
 * Returns: { publicUrl: string }
 */
export async function POST(req: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json(
        { error: 'Missing SUPABASE env variables on server' },
        { status: 500 },
      );
    }

    const formData    = await req.formData();
    const file        = formData.get('file') as File | null;
    const candidateId = formData.get('candidateId') as string | null;

    if (!file || file.size === 0) {
      return NextResponse.json({ error: 'No file provided or file is empty' }, { status: 400 });
    }
    if (!candidateId) {
      return NextResponse.json({ error: 'candidateId is required' }, { status: 400 });
    }

    const bucketName = 'interview-recordings';
    const fileExt    = (file.name.split('.').pop() || 'mp4').toLowerCase();
    const uploadPath = `admin_uploads/${candidateId}_${Date.now()}.${fileExt}`;
    const uploadUrl  = `${supabaseUrl}/storage/v1/object/${bucketName}/${uploadPath}`;

    console.log('[upload-video] Uploading to Supabase:', uploadUrl);
    console.log('[upload-video] File:', file.name, 'Size:', file.size, 'Type:', file.type);

    // Read file bytes
    const fileBuffer = await file.arrayBuffer();

    const supabaseRes = await fetch(uploadUrl, {
      method:  'PUT',
      headers: {
        Authorization:  `Bearer ${serviceKey}`,
        'x-upsert':     'true',
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

    const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucketName}/${uploadPath}`;
    console.log('[upload-video] Success — publicUrl:', publicUrl);

    return NextResponse.json({ publicUrl }, { status: 200 });

  } catch (err: any) {
    console.error('[upload-video] Server error:', err);
    return NextResponse.json({ error: err.message || 'Unknown server error' }, { status: 500 });
  }
}
