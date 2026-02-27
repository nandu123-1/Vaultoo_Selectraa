// ============================================================
// POST /api/v1/verify-otp - OTP Verification & Session Creation
// ============================================================
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { decrypt } from "@/lib/encryption";
import { CORS_HEADERS } from "@/lib/constants";
import { v4 as uuidv4 } from "uuid";
import type { ApiResponse, OTPVerifyRequest, OTPVerifyResponse } from "@/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as OTPVerifyRequest & {
      accountId?: string;
    };
    const { otp, requesterEmail, accountId } = body;

    if (!otp || (!requesterEmail && !accountId)) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "OTP and either requester email or account ID are required",
        },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    // Build query — support lookup by requesterEmail OR accountId
    const whereClause: Record<string, unknown> = {
      otp: otp.toUpperCase(),
      status: "APPROVED",
      otpExpiresAt: { gt: new Date() },
    };
    if (requesterEmail) {
      whereClause.requester = { email: requesterEmail.toLowerCase() };
    }
    if (accountId) {
      whereClause.accountId = accountId;
    }

    // Find the approved request with matching OTP
    const accessRequest = await prisma.accessRequest.findFirst({
      where: whereClause,
      include: {
        account: true,
        requester: { select: { id: true, email: true, name: true } },
      },
    });

    if (!accessRequest) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "Invalid or expired OTP" },
        { status: 401, headers: CORS_HEADERS },
      );
    }

    // Decrypt the Selectraa credentials
    const ivData = JSON.parse(accessRequest.account.encryptionIV);
    const decryptedEmail = decrypt({
      ciphertext: accessRequest.account.encryptedEmail,
      iv: ivData.emailIv,
    });
    const decryptedPassword = decrypt({
      ciphertext: accessRequest.account.encryptedPassword,
      iv: ivData.passwordIv,
    });

    // Create session
    const sessionToken = uuidv4();
    const expiresAt = new Date(Date.now() + accessRequest.duration * 60 * 1000);

    // Extract metadata
    const userIp =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    const session = await prisma.session.create({
      data: {
        requestId: accessRequest.id,
        userId: accessRequest.requesterId,
        sessionToken,
        expiresAt,
        userIp,
        userAgent,
      },
    });

    // Invalidate OTP (single use)
    await prisma.accessRequest.update({
      where: { id: accessRequest.id },
      data: { otp: null, otpExpiresAt: null },
    });

    const responseData: OTPVerifyResponse = {
      success: true,
      message: "OTP verified. Session created.",
      sessionToken: session.sessionToken,
      credentials: {
        email: decryptedEmail,
        password: decryptedPassword,
      },
      requesterName: accessRequest.requester.name,
      expiresAt: session.expiresAt.toISOString(),
    };

    return NextResponse.json<ApiResponse<OTPVerifyResponse>>(
      { success: true, message: "OTP verified", data: responseData },
      { headers: CORS_HEADERS },
    );
  } catch (error) {
    console.error("[VerifyOTP]", error);
    return NextResponse.json<ApiResponse>(
      { success: false, message: "Internal server error" },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: CORS_HEADERS });
}
