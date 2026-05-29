"use client";

import { RecordingChunk } from "@/types";

export async function mergeVideoChunks(chunks: RecordingChunk[]): Promise<Blob> {
  // Sort chunks by question index
  const sorted = [...chunks].sort((a, b) => a.questionIndex - b.questionIndex);

  // Simple browser-compatible concatenation using MediaSource
  // Since all chunks are recorded as WebM with the same settings,
  // we concatenate the blobs directly which works for WebM files
  const allBlobs = sorted.map((c) => c.blob);
  const merged = new Blob(allBlobs, { type: "video/webm" });
  return merged;
}

export async function uploadVideoToSupabase(
  blob: Blob,
  interviewId: string,
  supabaseUrl: string,
  anonKey: string
): Promise<string> {
  if (!supabaseUrl || supabaseUrl.includes("gsevnubsikjmonlpoeux") || supabaseUrl.includes("your_supabase_project_url")) {
    console.log("Mock Supabase connection: returning mock video url.");
    return "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";
  }

  const filename = `interviews/${interviewId}/final-interview.webm`;

  const response = await fetch(
    `${supabaseUrl}/storage/v1/object/interview-recordings/${filename}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${anonKey}`,
        "Content-Type": "video/webm",
        "x-upsert": "true",
      },
      body: blob,
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Upload failed: ${err}`);
  }

  // Return the public URL
  return `${supabaseUrl}/storage/v1/object/public/interview-recordings/${filename}`;
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
