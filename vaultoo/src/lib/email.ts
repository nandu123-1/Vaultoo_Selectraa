// ============================================================
// Vaultoo - Email Utilities (Nodemailer)
// ============================================================
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({
  to,
  subject,
  html,
}: EmailOptions): Promise<boolean> {
  try {
    if (!process.env.SMTP_USER) {
      console.warn("[Vaultoo] SMTP not configured — email skipped:", {
        to,
        subject,
      });
      return true; // Don't block flows if email isn't set up
    }

    await transporter.sendMail({
      from: `"Vaultoo" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
    return true;
  } catch (error) {
    console.error("[Vaultoo] Email send failed:", error);
    return false;
  }
}

export function verificationEmailHTML(name: string, verifyUrl: string): string {
  return `
    <div style="font-family: 'Segoe UI', sans-serif; max-width: 500px; margin: 0 auto; padding: 32px; background: #0a0a0a; border-radius: 16px; border: 1px solid #1a1a2e;">
      <h1 style="color: #a78bfa; font-size: 24px; margin-bottom: 8px;">Welcome to Vaultoo</h1>
      <p style="color: #94a3b8; font-size: 16px;">Hi ${name},</p>
      <p style="color: #94a3b8; font-size: 14px;">Verify your email to activate your account:</p>
      <a href="${verifyUrl}" style="display: inline-block; padding: 12px 32px; background: linear-gradient(135deg, #7c3aed, #a78bfa); color: white; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 16px 0;">
        Verify Email
      </a>
      <p style="color: #64748b; font-size: 12px; margin-top: 24px;">This link expires in 24 hours.</p>
    </div>
  `;
}

export function otpEmailHTML(
  name: string,
  otp: string,
  duration: number,
): string {
  return `
    <div style="font-family: 'Segoe UI', sans-serif; max-width: 500px; margin: 0 auto; padding: 32px; background: #0a0a0a; border-radius: 16px; border: 1px solid #1a1a2e;">
      <h1 style="color: #a78bfa; font-size: 24px; margin-bottom: 8px;">Access Approved</h1>
      <p style="color: #94a3b8; font-size: 16px;">Hi ${name},</p>
      <p style="color: #94a3b8; font-size: 14px;">Your access request has been approved. Use this OTP to login:</p>
      <div style="background: #1a1a2e; padding: 16px 32px; border-radius: 12px; text-align: center; margin: 16px 0;">
        <span style="color: #a78bfa; font-size: 32px; letter-spacing: 8px; font-weight: 700;">${otp}</span>
      </div>
      <p style="color: #94a3b8; font-size: 14px;">Duration: <strong style="color: #e2e8f0;">${duration} minutes</strong></p>
      <p style="color: #64748b; font-size: 12px; margin-top: 24px;">This OTP is single-use. Do not share it with anyone.</p>
    </div>
  `;
}
