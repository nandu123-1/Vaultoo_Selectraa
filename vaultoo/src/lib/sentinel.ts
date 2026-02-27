// ============================================================
// Vaultoo - AI Sentinel (Action Analyzer)
// ============================================================
import { SENSITIVE_PATTERNS, RISK_THRESHOLDS } from "./constants";
import type { SentinelAnalysis } from "@/types";

interface ActionContext {
  action: string;
  url?: string;
  details?: string;
  previousFlags: number;
}

/**
 * Analyze a user action for risk signals.
 * Uses pattern matching against known sensitive operations.
 */
export function analyzeAction(context: ActionContext): SentinelAnalysis {
  const flags: string[] = [];
  const combined =
    `${context.action} ${context.url || ""} ${context.details || ""}`.toLowerCase();

  for (const pattern of SENSITIVE_PATTERNS) {
    if (combined.includes(pattern)) {
      flags.push(`Detected sensitive pattern: "${pattern}" in action`);
    }
  }

  // Rapid action detection
  if (context.previousFlags >= 2) {
    flags.push("Multiple flagged actions in short succession");
  }

  // Determine risk level
  const totalFlags = flags.length + context.previousFlags;
  let riskLevel: SentinelAnalysis["riskLevel"] = "LOW";
  let recommendation = "Normal activity. No action needed.";

  if (totalFlags >= RISK_THRESHOLDS.CRITICAL) {
    riskLevel = "CRITICAL";
    recommendation =
      "Immediate session termination recommended. User attempting multiple sensitive operations.";
  } else if (totalFlags >= RISK_THRESHOLDS.HIGH) {
    riskLevel = "HIGH";
    recommendation =
      "High risk detected. Consider monitoring closely or terminating session.";
  } else if (totalFlags >= RISK_THRESHOLDS.MEDIUM) {
    riskLevel = "MEDIUM";
    recommendation =
      "Moderate risk. User has triggered some security flags. Monitor activity.";
  }

  return { riskLevel, flags, recommendation };
}
