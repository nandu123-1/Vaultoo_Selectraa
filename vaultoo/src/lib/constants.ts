// ============================================================
// Vaultoo - Application Constants
// ============================================================

export const APP_NAME = "Vaultoo";
export const APP_DESCRIPTION = "Enterprise Access Orchestrator";

// Auth
export const JWT_EXPIRY = "7d";
export const VERIFY_TOKEN_EXPIRY_HOURS = 24;
export const OTP_LENGTH = 6;
export const OTP_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

// Session
export const DEFAULT_SESSION_DURATION = 30; // minutes
export const MAX_SESSION_DURATION = 480; // 8 hours
export const MIN_SESSION_DURATION = 5; // minutes
export const SESSION_CHECK_INTERVAL = 60_000; // 1 minute

// Sentinel - sensitive action patterns
export const SENSITIVE_PATTERNS = [
  "export",
  "download",
  "delete",
  "settings",
  "password",
  "billing",
  "payment",
  "admin",
  "api-key",
  "token",
  "secret",
  "credential",
  "transfer",
  "permission",
] as const;

// Risk thresholds
export const RISK_THRESHOLDS = {
  LOW: 0,
  MEDIUM: 3,
  HIGH: 5,
  CRITICAL: 8,
} as const;

// UI
export const SIDEBAR_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
  { label: "Active Sessions", href: "/dashboard/sessions", icon: "MonitorUp" },
  { label: "Requests", href: "/dashboard/requests", icon: "Inbox" },
  { label: "Activity", href: "/dashboard/activity", icon: "Activity" },
  { label: "Settings", href: "/dashboard/settings", icon: "Settings" },
] as const;

// Pusher channels
export const PUSHER_CHANNELS = {
  OWNER: (ownerId: string) => `owner-${ownerId}`,
  SESSION: (sessionId: string) => `session-${sessionId}`,
  GLOBAL: "vaultoo-global",
} as const;

// HTTP
export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Session-Token",
} as const;
