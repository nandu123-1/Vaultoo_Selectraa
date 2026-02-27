// ============================================================
// POST /api/requests/[id]/approve - Approve Access Request
// ============================================================
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import { generateOTP } from "@/lib/otp";
import { sendEmail, otpEmailHTML } from "@/lib/email";
import { CORS_HEADERS } from "@/lib/constants";
import { pusherServer } from "@/lib/pusher";
import { PUSHER_CHANNELS } from "@/lib/constants";
import type { ApiResponse } from "@/types";

export async function POST(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "Unauthorized" },
        { status: 401, headers: CORS_HEADERS },
      );
    }

    const { id } = params;

    const accessRequest = await prisma.accessRequest.findUnique({
      where: { id },
      include: {
        requester: { select: { id: true, email: true, name: true } },
      },
    });

    if (!accessRequest) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "Request not found" },
        { status: 404, headers: CORS_HEADERS },
      );
    }

    if (accessRequest.ownerId !== user.id) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Only the account owner can approve requests",
        },
        { status: 403, headers: CORS_HEADERS },
      );
    }

    if (accessRequest.status !== "PENDING") {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: `Request is already ${accessRequest.status.toLowerCase()}`,
        },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    const otp = generateOTP();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // OTP valid for 10 minutes

    await prisma.accessRequest.update({
      where: { id },
      data: {
        status: "APPROVED",
        otp,
        otpExpiresAt,
      },
    });

    // Send OTP to requester
    if (accessRequest.requester) {
      await sendEmail({
        to: accessRequest.requester.email,
        subject: "Vaultoo - Your Access OTP",
        html: otpEmailHTML(
          accessRequest.requester.name || "User",
          otp,
          accessRequest.duration,
        ),
      });
    }

    // Notify requester via Pusher
    try {
      await pusherServer.trigger(
        PUSHER_CHANNELS.OWNER(accessRequest.requesterId),
        "REQUEST_APPROVED",
        {
          requestId: id,
          otp,
          duration: accessRequest.duration,
          timestamp: new Date().toISOString(),
        },
      );
    } catch {
      console.warn("[Pusher] Notification failed");
    }

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        message: "Request approved. OTP sent to requester.",
        data: { otp },
      },
      { headers: CORS_HEADERS },
    );
  } catch (error) {
    console.error("[Approve]", error);
    return NextResponse.json<ApiResponse>(
      { success: false, message: "Internal server error" },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: CORS_HEADERS });
}
