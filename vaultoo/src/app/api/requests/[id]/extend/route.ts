// ============================================================
// POST /api/requests/[id]/extend - Request Time Extension
// ============================================================
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import { CORS_HEADERS, MAX_SESSION_DURATION } from "@/lib/constants";
import { pusherServer } from "@/lib/pusher";
import { PUSHER_CHANNELS } from "@/lib/constants";
import type { ApiResponse, ExtensionRequest } from "@/types";

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
    const body = (await request.json()) as ExtensionRequest;
    const { additionalMinutes, reason } = body;

    if (
      !additionalMinutes ||
      additionalMinutes < 5 ||
      additionalMinutes > MAX_SESSION_DURATION
    ) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Additional time must be between 5 and 480 minutes",
        },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    const accessRequest = await prisma.accessRequest.findUnique({
      where: { id },
      include: {
        session: true,
        requester: { select: { id: true, name: true, email: true } },
      },
    });

    if (!accessRequest) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "Request not found" },
        { status: 404, headers: CORS_HEADERS },
      );
    }

    // Requester asks for extension → owner gets notified
    if (user.id === accessRequest.requesterId) {
      await prisma.accessRequest.update({
        where: { id },
        data: {
          status: "EXTENSION_PENDING",
          reason: reason || `Requesting ${additionalMinutes} more minutes`,
          duration: accessRequest.duration + additionalMinutes,
        },
      });

      // Notify owner
      try {
        await pusherServer.trigger(
          PUSHER_CHANNELS.OWNER(accessRequest.ownerId),
          "EXTENSION_REQUEST",
          {
            requestId: id,
            requesterName: accessRequest.requester?.name,
            additionalMinutes,
            reason,
            timestamp: new Date().toISOString(),
          },
        );
      } catch {
        console.warn("[Pusher] Extension notification failed");
      }

      return NextResponse.json<ApiResponse>(
        { success: true, message: "Extension request sent to owner" },
        { headers: CORS_HEADERS },
      );
    }

    // Owner approves extension → update session expiry dynamically
    if (user.id === accessRequest.ownerId) {
      if (!accessRequest.session || accessRequest.session.status !== "ACTIVE") {
        return NextResponse.json<ApiResponse>(
          { success: false, message: "No active session to extend" },
          { status: 400, headers: CORS_HEADERS },
        );
      }

      const newExpiresAt = new Date(
        accessRequest.session.expiresAt.getTime() +
          additionalMinutes * 60 * 1000,
      );

      await prisma.session.update({
        where: { id: accessRequest.session.id },
        data: { expiresAt: newExpiresAt },
      });

      await prisma.accessRequest.update({
        where: { id },
        data: {
          status: "APPROVED",
          duration: accessRequest.duration + additionalMinutes,
        },
      });

      // Notify user session was extended
      try {
        await pusherServer.trigger(
          PUSHER_CHANNELS.SESSION(accessRequest.session.id),
          "EXTENSION_APPROVED",
          {
            newExpiresAt: newExpiresAt.toISOString(),
            additionalMinutes,
            timestamp: new Date().toISOString(),
          },
        );
      } catch {
        console.warn("[Pusher] Extension approved notification failed");
      }

      return NextResponse.json<ApiResponse>(
        {
          success: true,
          message: `Session extended by ${additionalMinutes} minutes`,
          data: { newExpiresAt: newExpiresAt.toISOString() },
        },
        { headers: CORS_HEADERS },
      );
    }

    return NextResponse.json<ApiResponse>(
      { success: false, message: "You are not authorized for this action" },
      { status: 403, headers: CORS_HEADERS },
    );
  } catch (error) {
    console.error("[Extend]", error);
    return NextResponse.json<ApiResponse>(
      { success: false, message: "Internal server error" },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: CORS_HEADERS });
}
