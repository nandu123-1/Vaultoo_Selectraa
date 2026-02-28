// ============================================================
// /api/v1/screen-share — Live Screen Feed (Selectra → Owner)
// POST: Selectra sends a screenshot frame
// GET:  Owner polls for the latest frame
// ============================================================
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { CORS_HEADERS } from "@/lib/constants";
import type { ApiResponse } from "@/types";

// ---- POST: Receive a frame from Selectra ----
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionToken, frame } = body as {
      sessionToken: string;
      frame: string; // base64 JPEG
    };

    if (!sessionToken || !frame) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "sessionToken and frame are required" },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    // Validate frame size (max ~200KB base64)
    if (frame.length > 300_000) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "Frame too large" },
        { status: 413, headers: CORS_HEADERS },
      );
    }

    const session = await prisma.session.findUnique({
      where: { sessionToken },
    });

    if (!session || session.status !== "ACTIVE") {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "No active session" },
        { status: 404, headers: CORS_HEADERS },
      );
    }

    // Update latest frame
    await prisma.session.update({
      where: { id: session.id },
      data: {
        latestFrame: frame,
        frameUpdatedAt: new Date(),
      },
    });

    return NextResponse.json<ApiResponse>(
      { success: true, message: "Frame received" },
      { headers: CORS_HEADERS },
    );
  } catch (error) {
    console.error("[ScreenShare POST]", error);
    return NextResponse.json<ApiResponse>(
      { success: false, message: "Internal server error" },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}

// ---- GET: Owner polls for the latest frame ----
export async function GET(request: NextRequest) {
  try {
    const sessionId = request.nextUrl.searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "sessionId is required" },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        status: true,
        latestFrame: true,
        frameUpdatedAt: true,
        user: { select: { name: true, email: true } },
      },
    });

    if (!session) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "Session not found" },
        { status: 404, headers: CORS_HEADERS },
      );
    }

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        message: "OK",
        data: {
          sessionId: session.id,
          status: session.status,
          frame: session.latestFrame,
          frameUpdatedAt: session.frameUpdatedAt?.toISOString() || null,
          user: session.user,
        },
      },
      { headers: CORS_HEADERS },
    );
  } catch (error) {
    console.error("[ScreenShare GET]", error);
    return NextResponse.json<ApiResponse>(
      { success: false, message: "Internal server error" },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: CORS_HEADERS });
}
