// ============================================================
// POST /api/auth/register - User Registration
// ============================================================
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hashPassword, signToken } from "@/lib/auth";
import { CORS_HEADERS } from "@/lib/constants";
import type { RegisterRequest, ApiResponse, SafeUser } from "@/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RegisterRequest & { role?: string };
    const { email, password, name, role } = body;

    if (!email || !password || !name) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "Email, password, and name are required" },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    if (password.length < 8) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "Password must be at least 8 characters" },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (existing) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "An account with this email already exists",
        },
        { status: 409, headers: CORS_HEADERS },
      );
    }

    const hashedPassword = await hashPassword(password);

    const userRole = role === "USER" ? "USER" : "OWNER";

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        name,
        password: hashedPassword,
        role: userRole,
        emailVerified: true,
      },
    });

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role as SafeUser["role"],
    });

    const safeUser: SafeUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as SafeUser["role"],
      emailVerified: user.emailVerified,
      createdAt: user.createdAt.toISOString(),
    };

    const response = NextResponse.json<ApiResponse<SafeUser>>(
      {
        success: true,
        message: "Account created successfully.",
        data: safeUser,
      },
      { status: 201, headers: CORS_HEADERS },
    );

    response.cookies.set("vaultoo-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("[Register] Error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, message: "Internal server error" },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: CORS_HEADERS });
}
