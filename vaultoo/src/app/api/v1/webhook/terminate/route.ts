// ============================================================
// POST /api/v1/webhook/terminate - Force Logout Webhook
// Called by cron or timer to expire sessions
// ============================================================
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { CORS_HEADERS } from "@/lib/constants";
import { pusherServer } from "@/lib/pusher";
import { PUSHER_CHANNELS } from "@/lib/constants";
import type { ApiResponse } from "@/types";

export async function POST(request: Request) {
  try {
    // Verify webhook secret
    const authHeader = request.headers.get("Authorization");
    const webhookSecret =
      process.env.WEBHOOK_SECRET || "vaultoo-webhook-secret";

    if (authHeader !== `Bearer ${webhookSecret}`) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "Unauthorized webhook" },
        { status: 401, headers: CORS_HEADERS },
      );
    }

    // Find all expired active sessions
    const expiredSessions = await prisma.session.findMany({
      where: {
        status: "ACTIVE",
        expiresAt: { lt: new Date() },
      },
      include: {
        request: { select: { ownerId: true } },
      },
    });

    let terminated = 0;

    for (const session of expiredSessions) {
      await prisma.session.update({
        where: { id: session.id },
        data: { status: "EXPIRED" },
      });

      // Send force-logout signal to Selectraa
      try {
        await pusherServer.trigger(
          PUSHER_CHANNELS.SESSION(session.id),
          "SESSION_KILLED",
          {
            sessionId: session.id,
            reason: "Session expired",
            timestamp: new Date().toISOString(),
          },
        );
      } catch {
        // Pusher not configured — silent fail
      }

      terminated++;
    }

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        message: `Terminated ${terminated} expired session(s)`,
        data: { terminated },
      },
      { headers: CORS_HEADERS },
    );
  } catch (error) {
    console.error("[Webhook Terminate]", error);
    return NextResponse.json<ApiResponse>(
      { success: false, message: "Internal server error" },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: CORS_HEADERS });
}
