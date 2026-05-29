if (typeof window === 'undefined' && typeof globalThis !== 'undefined' && 'localStorage' in globalThis) {
  try {
    delete (globalThis as any).localStorage;
  } catch (e) {}
}

import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Block the signup page entirely — redirect to login
  if (path.startsWith("/admin/signup")) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }

  // Protect all /admin/* and /video-bot-admin/* routes except /admin/login
  if ((path.startsWith("/admin") || path.startsWith("/video-bot-admin")) && !path.startsWith("/admin/login")) {
    const adminSession = request.cookies.get("kl_admin_session");

    if (!adminSession) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/admin/login";
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
