// ============================================================
// POST /api/auth/logout - User Logout
// ============================================================
import { NextResponse } from "next/server";
import { CORS_HEADERS } from "@/lib/constants";
import type { ApiResponse } from "@/types";

export async function POST() {
  const response = NextResponse.json<ApiResponse>(
    { success: true, message: "Logged out successfully" },
    { headers: CORS_HEADERS },
  );

  response.cookies.set("vaultoo-token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });

  return response;
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: CORS_HEADERS });
}
