// ============================================================
// /api/accounts - Manage Selectraa Accounts (encrypted)
// ============================================================
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import { encrypt } from "@/lib/encryption";
import { CORS_HEADERS } from "@/lib/constants";
import type { ApiResponse, AccountCreateRequest } from "@/types";

// GET - List owner's accounts
export async function GET(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "Unauthorized" },
        { status: 401, headers: CORS_HEADERS },
      );
    }

    const accounts = await prisma.account.findMany({
      where: { ownerId: user.id },
      select: {
        id: true,
        platform: true,
        encryptedEmail: true,
        createdAt: true,
        owner: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json<ApiResponse>(
      { success: true, message: "Accounts fetched", data: accounts },
      { headers: CORS_HEADERS },
    );
  } catch (error) {
    console.error("[Accounts GET]", error);
    return NextResponse.json<ApiResponse>(
      { success: false, message: "Internal server error" },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}

// POST - Add a new Selectraa account
export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "Unauthorized" },
        { status: 401, headers: CORS_HEADERS },
      );
    }

    if (user.role !== "OWNER" && user.role !== "ADMIN") {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "Only account owners can add accounts" },
        { status: 403, headers: CORS_HEADERS },
      );
    }

    const body = (await request.json()) as AccountCreateRequest;
    const { email, password, platform } = body;

    if (!email || !password) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "Email and password are required" },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    const encryptedEmail = encrypt(email);
    const encryptedPassword = encrypt(password);

    const account = await prisma.account.create({
      data: {
        ownerId: user.id,
        platform: platform || "selectraa",
        encryptedEmail: encryptedEmail.ciphertext,
        encryptedPassword: encryptedPassword.ciphertext,
        encryptionIV: JSON.stringify({
          emailIv: encryptedEmail.iv,
          passwordIv: encryptedPassword.iv,
        }),
      },
    });

    return NextResponse.json<ApiResponse>(
      {
        success: true,
        message: "Account added successfully",
        data: { id: account.id, platform: account.platform },
      },
      { status: 201, headers: CORS_HEADERS },
    );
  } catch (error) {
    console.error("[Accounts POST]", error);
    return NextResponse.json<ApiResponse>(
      { success: false, message: "Internal server error" },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: CORS_HEADERS });
}
