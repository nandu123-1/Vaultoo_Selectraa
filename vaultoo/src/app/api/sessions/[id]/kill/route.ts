// ============================================================
// POST /api/sessions/[id]/kill - Kill an Active Session
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

    const session = await prisma.session.findUnique({
      where: { id },
      include: {
        request: { select: { ownerId: true, id: true } },
      },
    });

    if (!session) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "Session not found" },
        { status: 404, headers: CORS_HEADERS },
      );
    }

    // Allow both the account owner and the session user to kill
    if (session.request.ownerId !== user.id && session.userId !== user.id) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Only the account owner or session user can kill sessions",
        },
        { status: 403, headers: CORS_HEADERS },
      );
    }

    if (session.status !== "ACTIVE") {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "Session is not active" },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    // Kill session and mark request as expired
    await prisma.$transaction([
      prisma.session.update({
        where: { id },
        data: { status: "KILLED" },
      }),
      prisma.accessRequest.update({
        where: { id: session.request.id },
        data: { status: "EXPIRED" },
      }),
    ]);

    // Notify via Pusher — force logout signal
    try {
      await pusherServer.trigger(
        PUSHER_CHANNELS.SESSION(id),
        "SESSION_KILLED",
        {
          sessionId: id,
          timestamp: new Date().toISOString(),
        },
      );
    } catch {
      console.warn("[Pusher] Kill notification failed");
    }

    return NextResponse.json<ApiResponse>(
      { success: true, message: "Session terminated" },
      { headers: CORS_HEADERS },
    );
  } catch (error) {
    console.error("[Kill]", error);
    return NextResponse.json<ApiResponse>(
      { success: false, message: "Internal server error" },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: CORS_HEADERS });
}
