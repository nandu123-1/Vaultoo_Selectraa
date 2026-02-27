// ============================================================
// GET /api/auth/verify-email?token=xxx - Email Verification
// ============================================================
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { CORS_HEADERS } from "@/lib/constants";
import type { ApiResponse } from "@/types";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "Verification token is required" },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    const user = await prisma.user.findFirst({
      where: {
        verifyToken: token,
        verifyExpires: { gt: new Date() },
      },
    });

    if (!user) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "Invalid or expired verification token" },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verifyToken: null,
        verifyExpires: null,
      },
    });

    return NextResponse.json<ApiResponse>(
      { success: true, message: "Email verified successfully" },
      { headers: CORS_HEADERS },
    );
  } catch (error) {
    console.error("[VerifyEmail] Error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, message: "Internal server error" },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: CORS_HEADERS });
}
