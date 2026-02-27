// ============================================================
// Vaultoo - TypeScript Interfaces & Types
// ============================================================

// ---- Auth Types ----
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: SafeUser;
  token?: string;
}

export interface SafeUser {
  id: string;
  email: string;
  name: string;
  role: "USER" | "OWNER" | "ADMIN";
  emailVerified: boolean;
  createdAt: string;
}

// ---- Account Types ----
export interface AccountCreateRequest {
  platform?: string;
  email: string;
  password: string;
}

export interface AccountResponse {
  id: string;
  platform: string;
  encryptedEmail: string;
  createdAt: string;
}

// ---- Access Request Types ----
export interface AccessRequestCreate {
  accountId: string;
  duration: number; // minutes
  reason?: string;
}

export interface AccessRequestResponse {
  id: string;
  requesterId: string;
  ownerId: string;
  accountId: string;
  status: RequestStatus;
  duration: number;
  reason?: string;
  otp?: string;
  createdAt: string;
  requester?: SafeUser;
  owner?: SafeUser;
}

export type RequestStatus =
  | "PENDING"
  | "APPROVED"
  | "DENIED"
  | "EXPIRED"
  | "EXTENSION_PENDING";

// ---- OTP Types ----
export interface OTPVerifyRequest {
  otp: string;
  requesterEmail: string;
}

export interface OTPVerifyResponse {
  success: boolean;
  message: string;
  sessionToken?: string;
  credentials?: {
    email: string;
    password: string;
  };
  requesterName?: string;
  expiresAt?: string;
}

// ---- Session Types ----
export interface SessionResponse {
  id: string;
  requestId: string;
  userId: string;
  sessionToken: string;
  status: "ACTIVE" | "EXPIRED" | "KILLED";
  expiresAt: string;
  userIp?: string;
  userAgent?: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  createdAt: string;
  user?: SafeUser;
}

// ---- Activity Log Types ----
export interface ActivityLogEntry {
  id: string;
  sessionId: string;
  userId: string;
  action: string;
  url?: string;
  details?: string;
  riskFlag: boolean;
  createdAt: string;
}

export interface ActivityLogRequest {
  sessionToken: string;
  action: string;
  url?: string;
  details?: string;
}

// ---- Sentinel Types ----
export interface SentinelAnalysis {
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  flags: string[];
  recommendation: string;
}

// ---- Extension Request Types ----
export interface ExtensionRequest {
  additionalMinutes: number;
  reason?: string;
}

// ---- API Response Wrapper ----
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// ---- WebSocket Event Types ----
export interface WSEvent {
  type:
    | "NEW_REQUEST"
    | "REQUEST_APPROVED"
    | "REQUEST_DENIED"
    | "SESSION_KILLED"
    | "EXTENSION_REQUEST"
    | "EXTENSION_APPROVED"
    | "RISK_ALERT"
    | "SESSION_EXPIRED";
  payload: Record<string, unknown>;
  timestamp: string;
}
