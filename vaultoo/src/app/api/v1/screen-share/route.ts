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
    const { sessionToken, frame, width, height } = body as {
      sessionToken: string;
      frame: string; // base64 JPEG
      width?: number; // logical capture width (px)
      height?: number; // logical capture height (px)
    };

    if (!sessionToken || !frame) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "sessionToken and frame are required" },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    // Validate frame size — allow up to ~500 KB base64
    // (HD JPEG at quality 0.72 typically comes in at 40–80 KB;
    //  500 KB headroom handles high-DPI or complex pages)
    if (frame.length > 500_000) {
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

    // Update latest frame (with optional dimension metadata in JSON prefix)
    const framePayload =
      width && height ? `${width}x${height}|${frame}` : frame;

    await prisma.session.update({
      where: { id: session.id },
      data: {
        latestFrame: framePayload,
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

    // Parse optional dimension prefix "WxH|<base64>"
    let frame: string | null = session.latestFrame;
    let frameWidth: number | null = null;
    let frameHeight: number | null = null;

    if (frame) {
      const dimMatch = frame.match(/^(\d+)x(\d+)\|/);
      if (dimMatch) {
        frameWidth = parseInt(dimMatch[1], 10);
        frameHeight = parseInt(dimMatch[2], 10);
        frame = frame.slice(dimMatch[0].length);
      }
    }

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        message: "OK",
        data: {
          sessionId: session.id,
          status: session.status,
          frame,
          frameWidth,
          frameHeight,
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
