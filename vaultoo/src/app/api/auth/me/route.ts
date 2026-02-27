// ============================================================
// GET /api/auth/me - Get Current User
// ============================================================
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { CORS_HEADERS } from "@/lib/constants";
import type { ApiResponse, SafeUser } from "@/types";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "Not authenticated" },
        { status: 401, headers: CORS_HEADERS },
      );
    }

    return NextResponse.json<ApiResponse<SafeUser>>(
      { success: true, message: "Authenticated", data: user },
      { headers: CORS_HEADERS },
    );
  } catch (error) {
    console.error("[Me] Error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, message: "Internal server error" },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: CORS_HEADERS });
}
