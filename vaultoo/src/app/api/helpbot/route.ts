// ============================================================
// POST /api/helpbot — AI HelpBot powered by Google Gemini
// ============================================================
import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import type { ApiResponse } from "@/types";

const SYSTEM_PROMPT = `You are Vaultoo HelpBot — a friendly, concise AI assistant for the Vaultoo access orchestration platform.

Vaultoo is a zero-trust enterprise access management system that:
- Lets account owners securely share access to platforms (like Selectra) without revealing passwords
- Uses OTP-based verification for each session
- Provides real-time activity monitoring and session management
- Supports session kill switches, time extensions, risk-based alerting, and live screen feeds

Key concepts:
- Owner: The person who owns the account credentials
- Requester: The person who needs temporary access
- Session: A time-limited access window after OTP verification
- Sentinel: Risk analysis engine that flags suspicious activity
- Screen Feed: Live view of what the requester is doing

Answer user questions about Vaultoo features, security practices, troubleshooting, and general help.
Keep answers clear and concise. Use emojis sparingly. Format with markdown when helpful.`;

export async function POST(request: Request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const { message, history } = (await request.json()) as {
      message: string;
      history?: Array<{ role: string; content: string }>;
    };

    if (!message || typeof message !== "string") {
      return NextResponse.json<ApiResponse>(
        { success: false, message: "Message is required" },
        { status: 400 },
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message:
            "HelpBot is not configured. Set GEMINI_API_KEY in environment variables.",
        },
        { status: 503 },
      );
    }

    // Build conversation for Gemini
    const contents: Array<{
      role: string;
      parts: Array<{ text: string }>;
    }> = [];

    // Add conversation history
    if (history && Array.isArray(history)) {
      for (const msg of history.slice(-10)) {
        // Keep last 10 messages
        contents.push({
          role: msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.content }],
        });
      }
    }

    // Add the new user message
    contents.push({
      role: "user",
      parts: [{ text: message }],
    });

    // Call Gemini API
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: SYSTEM_PROMPT }],
          },
          contents,
          generationConfig: {
            temperature: 0.7,
            topP: 0.9,
            maxOutputTokens: 1024,
          },
        }),
      },
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error("[HelpBot] Gemini API error:", geminiRes.status, errText);
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          message: "Failed to get response from AI. Please try again.",
        },
        { status: 502 },
      );
    }

    const geminiData = await geminiRes.json();
    const reply =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "I'm sorry, I couldn't generate a response. Please try again.";

    return NextResponse.json<ApiResponse>({
      success: true,
      message: "OK",
      data: {
        reply,
        model: "gemini-2.0-flash",
      },
    });
  } catch (error) {
    console.error("[HelpBot]", error);
    return NextResponse.json<ApiResponse>(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
