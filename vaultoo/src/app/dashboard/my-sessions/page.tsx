"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MonitorUp,
  Clock,
  CheckCircle2,
  XCircle,
  KeyRound,
  Copy,
  CheckCheck,
  Shield,
} from "lucide-react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useCountdown } from "@/hooks/useCountdown";

interface MySession {
  id: string;
  sessionToken: string;
  status: string;
  expiresAt: string;
  riskLevel: string;
  createdAt: string;
  requestId: string;
  request: {
    id: string;
    duration: number;
    reason: string;
    account: { platform: string };
    owner: { name: string };
  };
}

function SessionCountdown({ expiresAt }: { expiresAt: string }) {
  const { formatted, expired } = useCountdown(expiresAt);
  if (expired) return <span className="text-red-400">Expired</span>;
  return <span className="text-emerald-400 font-mono">{formatted}</span>;
}

export default function MySessionsPage() {
  const [sessions, setSessions] = useState<MySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [otpInput, setOtpInput] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [validatedOtp, setValidatedOtp] = useState<{
    otp: string;
    platform: string;
    ownerName: string;
    duration: number;
    expiresAt?: string;
  } | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"active" | "past">("active");
  const [userEmail, setUserEmail] = useState("");
  const [copiedOtp, setCopiedOtp] = useState(false);

  useEffect(() => {
    fetchSessions();
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setUserEmail(d.data.email);
      })
      .catch(() => {});
  }, []);

  const copyOtp = async () => {
    if (!validatedOtp) return;
    await navigator.clipboard.writeText(validatedOtp.otp);
    setCopiedOtp(true);
    setTimeout(() => setCopiedOtp(false), 2000);
  };

  const fetchSessions = async () => {
    try {
      const res = await fetch("/api/sessions?view=requester");
      const data = await res.json();
      if (data.success) {
        setSessions(data.data || []);
      }
    } catch {
      console.error("Failed to fetch sessions");
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (!otpInput.trim()) return;
    setVerifying(true);
    setError("");

    try {
      const res = await fetch("/api/v1/validate-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp: otpInput, requesterEmail: userEmail }),
      });
      const data = await res.json();

      if (data.success) {
        setValidatedOtp({
          otp: otpInput.toUpperCase(),
          platform: data.data.platform,
          ownerName: data.data.ownerName,
          duration: data.data.duration,
          expiresAt: data.data.expiresAt,
        });
        setOtpInput("");
      } else {
        setError(data.message || "Invalid OTP");
      }
    } catch {
      setError("Verification failed");
    } finally {
      setVerifying(false);
    }
  };

  const requestExtension = async (sessionId: string) => {
    try {
      const session = sessions.find((s) => s.id === sessionId);
      if (!session) return;

      const res = await fetch(`/api/requests/${session.request.id}/extend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ additionalMinutes: 30 }),
      });
      const data = await res.json();
      if (data.success) {
        fetchSessions();
      }
    } catch {
      console.error("Extension request failed");
    }
  };

  const activeSessions = sessions.filter((s) => s.status === "ACTIVE");
  const pastSessions = sessions.filter((s) => s.status !== "ACTIVE");
  const displayed = tab === "active" ? activeSessions : pastSessions;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <MonitorUp className="w-6 h-6 text-violet-400" />
          My Sessions
        </h1>
        <p className="text-slate-400 mt-1">
          Your active and past access sessions
        </p>
      </motion.div>

      {/* OTP Verification */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-violet-400" />
            Enter OTP to Start Session
          </h3>
          <div className="flex gap-3">
            <Input
              value={otpInput}
              onChange={(e) => setOtpInput(e.target.value.toUpperCase())}
              placeholder="Enter 6-character OTP"
              maxLength={6}
              className="flex-1 font-mono tracking-widest text-center"
            />
            <Button
              onClick={verifyOTP}
              loading={verifying}
              disabled={otpInput.length < 6}
            >
              Verify
            </Button>
          </div>
          {error && (
            <p className="text-xs text-red-400 mt-2 flex items-center gap-1">
              <XCircle className="w-3 h-3" /> {error}
            </p>
          )}
        </Card>
      </motion.div>

      {/* OTP Validated — Instructions */}
      <AnimatePresence>
        {validatedOtp && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <Card className="p-5 border-emerald-500/20 bg-emerald-500/5">
              <h3 className="text-sm font-semibold text-emerald-400 mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                OTP Verified — Ready to Use
              </h3>

              <div className="space-y-4">
                {/* OTP Display with Copy */}
                <div className="flex items-center justify-center gap-3">
                  <code className="text-2xl font-mono font-bold tracking-[0.3em] text-white bg-white/5 border border-white/10 rounded-xl px-6 py-3">
                    {validatedOtp.otp}
                  </code>
                  <button
                    onClick={copyOtp}
                    className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                    title="Copy OTP"
                  >
                    {copiedOtp ? (
                      <CheckCheck className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                </div>

                {/* Session Info */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-black/20 rounded-lg px-3 py-2">
                    <p className="text-xs text-slate-500">Platform</p>
                    <p className="text-sm text-white font-medium">
                      {validatedOtp.platform}
                    </p>
                  </div>
                  <div className="bg-black/20 rounded-lg px-3 py-2">
                    <p className="text-xs text-slate-500">Owner</p>
                    <p className="text-sm text-white font-medium">
                      {validatedOtp.ownerName}
                    </p>
                  </div>
                  <div className="bg-black/20 rounded-lg px-3 py-2">
                    <p className="text-xs text-slate-500">Duration</p>
                    <p className="text-sm text-white font-medium">
                      {validatedOtp.duration} min
                    </p>
                  </div>
                </div>

                {/* Instructions */}
                <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-white">
                        How to access:
                      </p>
                      <ol className="text-xs text-slate-300 space-y-1.5 list-decimal list-inside">
                        <li>
                          Open{" "}
                          <span className="text-violet-400 font-medium">
                            Selectra
                          </span>{" "}
                          in your browser
                        </li>
                        <li>
                          Click{" "}
                          <span className="text-violet-400 font-medium">
                            &ldquo;Login via Vaultoo&rdquo;
                          </span>
                        </li>
                        <li>Enter the OTP above and the Account ID</li>
                        <li>
                          You&apos;ll be logged in automatically —{" "}
                          <span className="text-emerald-400">
                            no password revealed
                          </span>
                        </li>
                      </ol>
                    </div>
                  </div>
                </div>

                {validatedOtp.expiresAt && (
                  <p className="text-xs text-slate-400 text-center flex items-center justify-center gap-1">
                    <Clock className="w-3 h-3" />
                    OTP expires:{" "}
                    <SessionCountdown expiresAt={validatedOtp.expiresAt} />
                  </p>
                )}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <div className="flex gap-2">
        {(["active", "past"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
              tab === t
                ? "bg-violet-500/15 text-violet-400 border border-violet-500/20"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            {t === "active"
              ? `Active (${activeSessions.length})`
              : `Past (${pastSessions.length})`}
          </button>
        ))}
      </div>

      {/* Sessions List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-24 bg-white/5 rounded-2xl animate-pulse"
            />
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <Card className="p-8 text-center">
          <MonitorUp className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">
            {tab === "active" ? "No active sessions" : "No past sessions yet"}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {displayed.map((session, i) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-white">
                          {session.request.account.platform}
                        </h3>
                        <Badge
                          variant={
                            session.status === "ACTIVE"
                              ? "success"
                              : session.status === "EXPIRED"
                                ? "warning"
                                : "danger"
                          }
                        >
                          {session.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-400">
                        Owner: {session.request.owner?.name ?? "Unknown"} •{" "}
                        {session.request.duration} min
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      {session.status === "ACTIVE" && (
                        <>
                          <div className="text-right">
                            <p className="text-xs text-slate-500">Time left</p>
                            <SessionCountdown expiresAt={session.expiresAt} />
                          </div>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => requestExtension(session.id)}
                          >
                            Extend
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
