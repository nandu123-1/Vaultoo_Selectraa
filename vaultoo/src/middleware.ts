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
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (publicPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Allow static assets & api preflight
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Handle OPTIONS (CORS preflight)
  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers":
          "Content-Type, Authorization, X-Session-Token",
      },
    });
  }

  // Check for auth token
  const token = request.cookies.get("vaultoo-token")?.value;

  if (!token) {
    // API routes return 401
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }
    // Page routes redirect to login
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Add CORS headers to all API responses
  if (pathname.startsWith("/api/")) {
    const response = NextResponse.next();
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS",
    );
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-Session-Token",
    );
    return response;
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
