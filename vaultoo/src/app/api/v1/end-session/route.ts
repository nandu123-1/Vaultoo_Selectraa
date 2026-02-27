// ============================================================
// POST /api/v1/end-session - End session from Selectra
// Called when user clicks "End Session" in Selectra
// ============================================================
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { CORS_HEADERS } from "@/lib/constants";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionToken, reason } = body;

    if (!sessionToken) {
      return NextResponse.json(
        { success: false, message: "Session token required" },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    const session = await prisma.session.findUnique({
      where: { sessionToken },
      select: { id: true, status: true, requestId: true },
    });

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Session not found" },
        { status: 404, headers: CORS_HEADERS },
      );
    }

    if (session.status !== "ACTIVE") {
      return NextResponse.json(
        { success: true, message: "Session already ended" },
        { headers: CORS_HEADERS },
      );
    }

    // End the session and mark request as expired
    await prisma.$transaction([
      prisma.session.update({
        where: { id: session.id },
        data: { status: "EXPIRED" },
      }),
      prisma.accessRequest.update({
        where: { id: session.requestId },
        data: { status: "EXPIRED" },
      }),
    ]);

    console.log(
      `[EndSession] Session ${session.id} ended by user. Reason: ${reason || "USER_ENDED"}`,
    );

    return NextResponse.json(
      { success: true, message: "Session ended successfully" },
      { headers: CORS_HEADERS },
    );
  } catch (error) {
    console.error("[EndSession]", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: CORS_HEADERS });
}
