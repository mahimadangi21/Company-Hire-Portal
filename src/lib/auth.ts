import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Verifies the request carries a valid internal API secret header OR a valid Supabase session.
 * Used to guard write/modify API routes called from the admin Vite dashboard or Next.js admin dashboard.
 * Returns a 401 NextResponse if unauthorized, or null if authorized.
 */
export async function requireInternalSecret(req: NextRequest): Promise<NextResponse | null> {
  const secret = process.env.INTERNAL_API_SECRET;
  if (!secret) {
    // If no secret is configured, block all requests for safety
    console.error("INTERNAL_API_SECRET is not configured");
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
  }

  // 1. Check if valid API Key is provided
  const headerSecret = req.headers.get("x-api-key");
  if (headerSecret && headerSecret === secret) {
    return null; // Authorized via API key
  }

  // 2. Check if user has an active session cookie (for Next.js Admin dashboard on the same domain)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (supabaseUrl && supabaseAnonKey) {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Read-only cookie check
        },
      },
    });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        return null; // Authorized via session cookie
      }
    } catch (e) {
      console.error("[auth] Error checking Supabase session cookie:", e);
    }
  }

  console.warn(`[auth-check] Authorization failed. Header key: "${headerSecret ? 'present' : 'missing'}"`);
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
