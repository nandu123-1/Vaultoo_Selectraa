// ============================================================
// POST /api/auth/login - User Login
// ============================================================
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { comparePassword, signToken } from "@/lib/auth";
import { CORS_HEADERS } from "@/lib/constants";
import type { LoginRequest, ApiResponse, SafeUser } from "@/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as LoginRequest;
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "Email and password are required" },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "Invalid email or password" },
        { status: 401, headers: CORS_HEADERS },
      );
    }

    const isValid = await comparePassword(password, user.password);
    if (!isValid) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "Invalid email or password" },
        { status: 401, headers: CORS_HEADERS },
      );
    }

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
      { success: true, message: "Login successful", data: safeUser },
      { status: 200, headers: CORS_HEADERS },
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
    console.error("[Login] Error:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, message: "Internal server error" },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: CORS_HEADERS });
}
