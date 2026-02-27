// ============================================================
// /api/requests - Access Request Management
// ============================================================
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import { CORS_HEADERS } from "@/lib/constants";
import { pusherServer } from "@/lib/pusher";
import { PUSHER_CHANNELS } from "@/lib/constants";
import type { ApiResponse, AccessRequestCreate } from "@/types";

// GET - List requests (for owner or requester)
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
    let whereClause;
    if (view === "owner") {
      whereClause = { ownerId: user.id };
    } else if (view === "requester") {
      whereClause = { requesterId: user.id };
    } else {
      whereClause = { OR: [{ ownerId: user.id }, { requesterId: user.id }] };
    }

    const requests = await prisma.accessRequest.findMany({
      where: whereClause,
      include: {
        requester: {
          select: { id: true, email: true, name: true },
        },
        owner: {
          select: { id: true, email: true, name: true },
        },
        account: {
          select: { id: true, platform: true },
        },
        session: {
          select: { id: true, status: true, expiresAt: true, riskLevel: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json<ApiResponse>(
      { success: true, message: "Requests fetched", data: requests },
      { headers: CORS_HEADERS },
    );
  } catch (error) {
    console.error("[Requests GET]", error);
    return NextResponse.json<ApiResponse>(
      { success: false, message: "Internal server error" },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}

// POST - Create a new access request
export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "Unauthorized" },
        { status: 401, headers: CORS_HEADERS },
      );
    }

    const body = (await request.json()) as AccessRequestCreate;
    const { accountId, duration, reason } = body;

    if (!accountId || !duration) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "Account ID and duration are required" },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    if (duration < 5 || duration > 480) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Duration must be between 5 and 480 minutes",
        },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    const account = await prisma.account.findUnique({
      where: { id: accountId },
      select: { ownerId: true },
    });

    if (!account) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "Account not found" },
        { status: 404, headers: CORS_HEADERS },
      );
    }

    if (account.ownerId === user.id) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "You cannot request access to your own account",
        },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    const accessRequest = await prisma.accessRequest.create({
      data: {
        requesterId: user.id,
        ownerId: account.ownerId,
        accountId,
        duration,
        reason,
      },
      include: {
        requester: { select: { id: true, email: true, name: true } },
      },
    });

    // Notify owner via Pusher
    try {
      await pusherServer.trigger(
        PUSHER_CHANNELS.OWNER(account.ownerId),
        "NEW_REQUEST",
        {
          request: accessRequest,
          timestamp: new Date().toISOString(),
        },
      );
    } catch {
      console.warn(
        "[Pusher] Notification failed — Pusher may not be configured",
      );
    }

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        message: "Access request submitted",
        data: accessRequest,
      },
      { status: 201, headers: CORS_HEADERS },
    );
  } catch (error) {
    console.error("[Requests POST]", error);
    return NextResponse.json<ApiResponse>(
      { success: false, message: "Internal server error" },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: CORS_HEADERS });
}
