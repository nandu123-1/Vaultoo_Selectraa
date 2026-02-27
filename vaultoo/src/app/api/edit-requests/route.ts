// ============================================================
// /api/edit-requests - Owner edits to pending requests
// ============================================================
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import { CORS_HEADERS } from "@/lib/constants";
import type { ApiResponse } from "@/types";

export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "Unauthorized" },
        { status: 401, headers: CORS_HEADERS },
      );
    }

    const pendingRequests = await prisma.accessRequest.findMany({
      where: {
        ownerId: user.id,
        status: { in: ["PENDING", "EXTENSION_PENDING"] },
      },
      include: {
        requester: { select: { id: true, email: true, name: true } },
        account: { select: { id: true, platform: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        message: "Pending requests fetched",
        data: pendingRequests,
      },
      { headers: CORS_HEADERS },
    );
  } catch (error) {
    console.error("[EditRequests]", error);
    return NextResponse.json<ApiResponse>(
      { success: false, message: "Internal server error" },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: CORS_HEADERS });
}
