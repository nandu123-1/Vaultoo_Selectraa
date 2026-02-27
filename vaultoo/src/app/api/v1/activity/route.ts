// ============================================================
// POST /api/v1/activity - Log User Activity
// ============================================================
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { analyzeAction } from "@/lib/sentinel";
import { CORS_HEADERS } from "@/lib/constants";
import { pusherServer } from "@/lib/pusher";
import { PUSHER_CHANNELS } from "@/lib/constants";
import type { ApiResponse, ActivityLogRequest } from "@/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ActivityLogRequest;
    const { sessionToken, action, url, details } = body;

    if (!sessionToken || !action) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "Session token and action are required" },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    const session = await prisma.session.findUnique({
      where: { sessionToken },
      include: {
        request: { select: { ownerId: true } },
      },
    });

    if (!session) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "Invalid session" },
        { status: 401, headers: CORS_HEADERS },
      );
    }

    // If session was killed or expired, tell Selectra to terminate
    if (session.status === "KILLED" || session.status === "EXPIRED") {
      return NextResponse.json(
        {
          success: false,
          terminated: true,
          reason:
            session.status === "KILLED"
              ? "Session was terminated by the account owner"
              : "Session has expired",
          message: "Session is no longer active",
        },
        { headers: CORS_HEADERS },
      );
    }

    if (session.status !== "ACTIVE") {
      return NextResponse.json(
        {
          success: false,
          terminated: true,
          reason: "Session is not active",
          message: "Session is not active",
        },
        { headers: CORS_HEADERS },
      );
    }

    if (session.expiresAt < new Date()) {
      await prisma.session.update({
        where: { id: session.id },
        data: { status: "EXPIRED" },
      });
      return NextResponse.json(
        {
          success: false,
          terminated: true,
          reason: "Session has expired",
          message: "Session expired",
        },
        { headers: CORS_HEADERS },
      );
    }

    // Count previous flags for this session
    const previousFlags = await prisma.activityLog.count({
      where: { sessionId: session.id, riskFlag: true },
    });

    // AI Sentinel analysis
    const analysis = analyzeAction({
      action,
      url,
      details,
      previousFlags,
    });

    const isRisky = analysis.flags.length > 0;

    // Log the activity
    await prisma.activityLog.create({
      data: {
        sessionId: session.id,
        userId: session.userId,
        action,
        url,
        details,
        riskFlag: isRisky,
      },
    });

    // Update session risk level if escalated
    if (analysis.riskLevel !== "LOW") {
      await prisma.session.update({
        where: { id: session.id },
        data: { riskLevel: analysis.riskLevel },
      });

      // Alert owner about risk
      try {
        await pusherServer.trigger(
          PUSHER_CHANNELS.OWNER(session.request.ownerId),
          "RISK_ALERT",
          {
            sessionId: session.id,
            riskLevel: analysis.riskLevel,
            flags: analysis.flags,
            recommendation: analysis.recommendation,
            timestamp: new Date().toISOString(),
          },
        );
      } catch {
        console.warn("[Pusher] Risk alert failed");
      }
    }

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        message: "Activity logged",
        data: { riskLevel: analysis.riskLevel, flagged: isRisky },
      },
      { headers: CORS_HEADERS },
    );
  } catch (error) {
    console.error("[Activity]", error);
    return NextResponse.json<ApiResponse>(
      { success: false, message: "Internal server error" },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: CORS_HEADERS });
}
