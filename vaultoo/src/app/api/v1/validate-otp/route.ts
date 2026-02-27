// ============================================================
// POST /api/v1/validate-otp - Validate OTP without consuming it
// Used by Vaultoo dashboard to check if OTP is valid
// Does NOT return credentials or consume the OTP
// ============================================================
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { CORS_HEADERS } from "@/lib/constants";
import type { ApiResponse } from "@/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { otp, requesterEmail } = body;

    if (!otp || !requesterEmail) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "OTP and email are required" },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    const accessRequest = await prisma.accessRequest.findFirst({
      where: {
        otp: otp.toUpperCase(),
        status: "APPROVED",
        otpExpiresAt: { gt: new Date() },
        requester: { email: requesterEmail.toLowerCase() },
      },
      include: {
        account: { select: { platform: true } },
        owner: { select: { name: true } },
      },
    });

    if (!accessRequest) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "Invalid or expired OTP" },
        { status: 401, headers: CORS_HEADERS },
      );
    }

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        message: "OTP is valid. Use it in Selectra to start your session.",
        data: {
          platform: accessRequest.account.platform,
          ownerName: accessRequest.owner.name,
          duration: accessRequest.duration,
          expiresAt: accessRequest.otpExpiresAt?.toISOString(),
        },
      },
      { headers: CORS_HEADERS },
    );
  } catch (error) {
    console.error("[ValidateOTP]", error);
    return NextResponse.json<ApiResponse>(
      { success: false, message: "Internal server error" },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: CORS_HEADERS });
}
