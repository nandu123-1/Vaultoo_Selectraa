// ============================================================
// Vaultoo - Next.js Middleware (Route Protection)
// ============================================================
import { NextRequest, NextResponse } from "next/server";

const publicPaths = [
  "/login",
  "/register",
  "/verify",
  "/access",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/verify-email",
  "/api/v1/verify-otp",
  "/api/v1/activity",
  "/api/v1/webhook",
  "/api/v1/session-status",
  "/api/v1/end-session",
  "/api/v1/screen-share",
  "/api/v1/request-extension",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const corsHeaders: Record<string, string> = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, X-Session-Token",
  };

  // Handle OPTIONS (CORS preflight) FIRST — before any auth checks
  if (request.method === "OPTIONS") {
    return new NextResponse(null, { status: 200, headers: corsHeaders });
  }

  // Helper: attach CORS headers to any API response
  const withCors = (response: NextResponse) => {
    if (pathname.startsWith("/api/")) {
      Object.entries(corsHeaders).forEach(([k, v]) =>
        response.headers.set(k, v),
      );
    }
    return response;
  };

  // Allow public paths
  if (publicPaths.some((path) => pathname.startsWith(path))) {
    return withCors(NextResponse.next());
  }

  // Allow static assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Check for auth token
  const token = request.cookies.get("vaultoo-token")?.value;

  if (!token) {
    // API routes return 401 (with CORS so browser can read the error)
    if (pathname.startsWith("/api/")) {
      return new NextResponse(
        JSON.stringify({ success: false, message: "Unauthorized" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        },
      );
    }
    // Page routes redirect to login
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Add CORS headers to all authenticated API responses
  if (pathname.startsWith("/api/")) {
    return withCors(NextResponse.next());
  }

  // Redirect root to dashboard
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
