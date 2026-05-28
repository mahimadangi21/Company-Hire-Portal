import { createBrowserClient } from "@supabase/ssr";
import { getMockSupabaseClient } from "./mockClient";

function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return !!(url && url.startsWith("http") && !url.includes("your_supabase_project_url"));
}

export function createClient() {
  if (!isSupabaseConfigured()) {
    return getMockSupabaseClient() as any;
  }

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
