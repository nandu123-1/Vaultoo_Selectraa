// ============================================================
// /api/sessions - Session Management
// ============================================================
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import { CORS_HEADERS } from "@/lib/constants";
import type { ApiResponse } from "@/types";

// GET - List sessions (owner sees all sessions for their accounts)
export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "Unauthorized" },
        { status: 401, headers: CORS_HEADERS },
      );
    }

    // Support ?view=owner or ?view=requester to filter data
    const { searchParams } = new URL(request.url);
    const view = searchParams.get("view");
    let requestFilter;
    if (view === "owner") {
      requestFilter = { ownerId: user.id };
    } else if (view === "requester") {
      requestFilter = { requesterId: user.id };
    } else {
      requestFilter = { OR: [{ ownerId: user.id }, { requesterId: user.id }] };
    }

    const sessions = await prisma.session.findMany({
      where: {
        request: requestFilter,
      },
      include: {
        user: { select: { id: true, email: true, name: true } },
        request: {
          select: {
            id: true,
            duration: true,
            reason: true,
            account: { select: { id: true, platform: true } },
            owner: { select: { id: true, name: true, email: true } },
          },
        },
        activityLogs: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Check and expire stale sessions
    const now = new Date();
    for (const session of sessions) {
      if (session.status === "ACTIVE" && session.expiresAt < now) {
        await prisma.session.update({
          where: { id: session.id },
          data: { status: "EXPIRED" },
        });
        session.status = "EXPIRED";
      }
    }

    return NextResponse.json<ApiResponse>(
      { success: true, message: "Sessions fetched", data: sessions },
      { headers: CORS_HEADERS },
    );
  } catch (error) {
    console.error("[Sessions GET]", error);
    return NextResponse.json<ApiResponse>(
      { success: false, message: "Internal server error" },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: CORS_HEADERS });
}
