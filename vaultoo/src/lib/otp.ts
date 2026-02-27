// ============================================================
// Vaultoo - OTP Generation & Validation
// ============================================================
import { OTP_LENGTH, OTP_CHARS } from "./constants";
import crypto from "crypto";

/**
 * Generate a cryptographically secure alphanumeric OTP
 */
export function generateOTP(): string {
  let otp = "";
  const bytes = crypto.randomBytes(OTP_LENGTH);
  for (let i = 0; i < OTP_LENGTH; i++) {
    otp += OTP_CHARS[bytes[i] % OTP_CHARS.length];
  }
  return otp;
}

/**
 * Generate a secure verification token
 */
export function generateVerifyToken(): string {
  return crypto.randomBytes(32).toString("hex");
}
