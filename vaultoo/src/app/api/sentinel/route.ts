// ============================================================
// POST /api/sentinel - Get Sentinel Analysis for a Session
// ============================================================
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import { CORS_HEADERS } from "@/lib/constants";
import type { ApiResponse } from "@/types";
import type { ActivityLog } from "@prisma/client";

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "Unauthorized" },
        { status: 401, headers: CORS_HEADERS },
      );
    }

    const { sessionId } = (await request.json()) as { sessionId: string };

    if (!sessionId) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "Session ID is required" },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        request: { select: { ownerId: true } },
        activityLogs: {
          orderBy: { createdAt: "desc" },
          take: 50,
        },
      },
    });

    if (!session) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "Session not found" },
        { status: 404, headers: CORS_HEADERS },
      );
    }

    if (session.request.ownerId !== user.id) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "Unauthorized" },
        { status: 403, headers: CORS_HEADERS },
      );
    }

    const totalActions = session.activityLogs.length;
    const flaggedActions = session.activityLogs.filter(
      (l: ActivityLog) => l.riskFlag,
    ).length;
    const recentFlags = session.activityLogs
      .filter((l: ActivityLog) => l.riskFlag)
      .map((l: ActivityLog) => ({
        action: l.action,
        url: l.url,
        details: l.details,
        time: l.createdAt,
      }));

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        message: "Sentinel report",
        data: {
          sessionId,
          riskLevel: session.riskLevel,
          totalActions,
          flaggedActions,
          recentFlags,
        },
      },
      { headers: CORS_HEADERS },
    );
  } catch (error) {
    console.error("[Sentinel]", error);
    return NextResponse.json<ApiResponse>(
      { success: false, message: "Internal server error" },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: CORS_HEADERS });
}
