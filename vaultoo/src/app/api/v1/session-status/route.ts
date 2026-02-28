// ============================================================
// POST /api/v1/session-status - Check if a session is still active
// Lightweight endpoint for Selectra to poll
// ============================================================
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { CORS_HEADERS } from "@/lib/constants";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionToken } = body;

    if (!sessionToken) {
      return NextResponse.json(
        { active: false, reason: "No session token" },
        { headers: CORS_HEADERS },
      );
    }

    const session = await prisma.session.findUnique({
      where: { sessionToken },
      select: { id: true, status: true, expiresAt: true },
    });

    if (!session) {
      return NextResponse.json(
        { active: false, reason: "Session not found" },
        { headers: CORS_HEADERS },
      );
    }

    // Check expiry
    if (session.status === "ACTIVE" && session.expiresAt < new Date()) {
      await prisma.session.update({
        where: { sessionToken },
        data: { status: "EXPIRED" },
      });
      return NextResponse.json(
        { active: false, reason: "Session expired" },
        { headers: CORS_HEADERS },
      );
    }

    if (session.status !== "ACTIVE") {
      return NextResponse.json(
        {
          active: false,
          reason:
            session.status === "KILLED"
              ? "Session terminated by account owner"
              : "Session " + session.status.toLowerCase(),
        },
        { headers: CORS_HEADERS },
      );
    }

    return NextResponse.json(
      { active: true, expiresAt: session.expiresAt.toISOString() },
      { headers: CORS_HEADERS },
    );
  } catch (error) {
    console.error("[SessionStatus]", error);
    return NextResponse.json(
      { active: false, reason: "Server error" },
      { headers: CORS_HEADERS },
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: CORS_HEADERS });
}
