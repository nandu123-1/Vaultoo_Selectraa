// ============================================================
// POST /api/auth/role - Toggle user role between USER and OWNER
// ============================================================
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromRequest, signToken } from "@/lib/auth";
import { CORS_HEADERS } from "@/lib/constants";
import type { ApiResponse, SafeUser } from "@/types";

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "Unauthorized" },
        { status: 401, headers: CORS_HEADERS },
      );
    }

    const { role } = (await request.json()) as { role: string };

    if (!role || !["USER", "OWNER"].includes(role)) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "Invalid role. Must be USER or OWNER" },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { role: role as string },
    });

    const token = signToken({
      userId: updated.id,
      email: updated.email,
      role: updated.role,
    });

    const safeUser: SafeUser = {
      id: updated.id,
      email: updated.email,
      name: updated.name,
      role: updated.role as SafeUser["role"],
      emailVerified: updated.emailVerified,
      createdAt: updated.createdAt.toISOString(),
    };

    const response = NextResponse.json<ApiResponse<SafeUser>>(
      {
        success: true,
        message: `Role switched to ${role}`,
        data: safeUser,
      },
      { headers: CORS_HEADERS },
    );

    response.cookies.set("vaultoo-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("[Role Switch]", error);
    return NextResponse.json<ApiResponse>(
      { success: false, message: "Internal server error" },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: CORS_HEADERS });
}
