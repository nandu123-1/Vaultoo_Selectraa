// ============================================================
// Vaultoo - JWT Auth Utilities
// ============================================================
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import prisma from "./prisma";
import type { SafeUser } from "@/types";

const JWT_SECRET =
  process.env.JWT_SECRET || "vaultoo-jwt-secret-change-in-production";
const SALT_ROUNDS = 12;

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compare a password with its hash
 */
export async function comparePassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Sign a JWT token
 */
export function signToken(payload: {
  userId: string;
  email: string;
  role: string;
}): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(
  token: string,
): { userId: string; email: string; role: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
      role: string;
    };
  } catch {
    return null;
  }
}

/**
 * Get current authenticated user from cookies
 */
export async function getCurrentUser(): Promise<SafeUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("vaultoo-token")?.value;
    if (!token) return null;

    const decoded = verifyToken(token);
    if (!decoded) return null;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    if (!user) return null;

    return {
      ...user,
      createdAt: user.createdAt.toISOString(),
    } as SafeUser;
  } catch {
    return null;
  }
}

/**
 * Extract token from Authorization header or cookies
 */
export function extractToken(request: Request): string | null {
  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  // Fallback: parse cookie header
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(/vaultoo-token=([^;]+)/);
  return match ? match[1] : null;
}

/**
 * Middleware helper to get user from request
 */
export async function getUserFromRequest(
  request: Request,
): Promise<SafeUser | null> {
  const token = extractToken(request);
  if (!token) return null;

  const decoded = verifyToken(token);
  if (!decoded) return null;

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      emailVerified: true,
      createdAt: true,
    },
  });

  if (!user) return null;
  return { ...user, createdAt: user.createdAt.toISOString() } as SafeUser;
}
