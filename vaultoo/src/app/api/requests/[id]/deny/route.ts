// ============================================================
// POST /api/requests/[id]/deny - Deny Access Request
// ============================================================
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
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
    });

    if (!accessRequest) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "Request not found" },
        { status: 404, headers: CORS_HEADERS },
      );
    }

    if (accessRequest.ownerId !== user.id) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "Only the account owner can deny requests" },
        { status: 403, headers: CORS_HEADERS },
      );
    }

    if (
      accessRequest.status !== "PENDING" &&
      accessRequest.status !== "EXTENSION_PENDING"
    ) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: `Request is already ${accessRequest.status.toLowerCase()}`,
        },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    await prisma.accessRequest.update({
      where: { id },
      data: { status: "DENIED" },
    });

    // Notify requester
    try {
      await pusherServer.trigger(
        PUSHER_CHANNELS.OWNER(accessRequest.requesterId),
        "REQUEST_DENIED",
        {
          requestId: id,
          timestamp: new Date().toISOString(),
        },
      );
    } catch {
      console.warn("[Pusher] Notification failed");
    }

    return NextResponse.json<ApiResponse>(
      { success: true, message: "Request denied" },
      { headers: CORS_HEADERS },
    );
  } catch (error) {
    console.error("[Deny]", error);
    return NextResponse.json<ApiResponse>(
      { success: false, message: "Internal server error" },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: CORS_HEADERS });
}
