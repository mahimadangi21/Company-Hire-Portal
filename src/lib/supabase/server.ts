import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getMockSupabaseClient } from "./mockClient";

function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return !!(url && url.startsWith("http") && !url.includes("your_supabase_project_url"));
}

export async function createClient() {
  if (!isSupabaseConfigured()) {
    return getMockSupabaseClient() as any;
  }

  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Can be ignored in Server Components
          }
        },
      },
    }
  );
}

export async function createAdminClient() {
  if (!isSupabaseConfigured()) {
    return getMockSupabaseClient() as any;
  }

  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Can be ignored in Server Components
          }
        },
      },
    }
  );
}

export function getServiceSupabase() {
  if (!isSupabaseConfigured()) {
    return getMockSupabaseClient() as any;
  }

  const { createClient: createDirectClient } = require("@supabase/supabase-js");
  return createDirectClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
