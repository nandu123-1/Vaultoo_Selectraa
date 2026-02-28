// ============================================================
// POST /api/v1/request-extension - Public Extension Request
// Uses session token auth (no JWT required)
// ============================================================
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { CORS_HEADERS } from "@/lib/constants";
import type { ApiResponse } from "@/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionToken, additionalMinutes, reason } = body;

    if (!sessionToken) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "Session token is required" },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    if (
      !additionalMinutes ||
      additionalMinutes < 5 ||
      additionalMinutes > 480
    ) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Additional time must be between 5 and 480 minutes",
        },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    // Find active session by token
    const session = await prisma.session.findUnique({
      where: { sessionToken },
      include: {
        request: {
          include: {
            requester: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    if (!session || session.status !== "ACTIVE") {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "No active session found" },
        { status: 404, headers: CORS_HEADERS },
      );
    }

    if (session.request.status === "EXTENSION_PENDING") {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "An extension request is already pending" },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    // Update access request to EXTENSION_PENDING
    await prisma.accessRequest.update({
      where: { id: session.requestId },
      data: {
        status: "EXTENSION_PENDING",
        reason: reason || `Requesting ${additionalMinutes} more minutes`,
        duration: session.request.duration + additionalMinutes,
      },
    });

    return NextResponse.json<ApiResponse>(
      { success: true, message: "Extension request sent to the account owner" },
      { headers: CORS_HEADERS },
    );
  } catch (error) {
    console.error("[RequestExtension]", error);
    return NextResponse.json<ApiResponse>(
      { success: false, message: "Internal server error" },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: CORS_HEADERS });
}
