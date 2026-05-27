import { NextRequest, NextResponse } from "next/server";

/**
 * Verifies the request carries a valid internal API secret header.
 * Used to guard write/modify API routes called from the admin Vite dashboard.
 * Returns a 401 NextResponse if unauthorized, or null if authorized.
 */
export function requireInternalSecret(req: NextRequest): NextResponse | null {
  const secret = process.env.INTERNAL_API_SECRET;
  if (!secret) {
    // If no secret is configured, block all requests for safety
    console.error("INTERNAL_API_SECRET is not configured");
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
  }

  const headerSecret = req.headers.get("x-api-key");
  if (!headerSecret || headerSecret !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null; // authorized
}
