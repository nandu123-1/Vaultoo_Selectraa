"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  KeyRound,
  Mail,
  Clock,
  CheckCircle2,
  XCircle,
  Timer,
  MessageSquare,
  X,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import { useCountdown } from "@/hooks/useCountdown";

export default function SessionPage() {
  const [otp, setOtp] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<{
    sessionToken: string;
    requestId?: string;
    credentials: { email: string; password: string };
    expiresAt: string;
  } | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Extension modal
  const [extModalOpen, setExtModalOpen] = useState(false);
  const [extMinutes, setExtMinutes] = useState("15");
  const [extReason, setExtReason] = useState("");
  const [extLoading, setExtLoading] = useState(false);

  const countdown = useCountdown(session?.expiresAt || null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/v1/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp, requesterEmail: email }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.message);
        return;
      }

      setSession(data.data);
    } catch {
      setError("Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleExtend = async () => {
    if (!session) return;
    const mins = parseInt(extMinutes);
    if (isNaN(mins) || mins < 5 || mins > 480) {
      setError("Time must be between 5 and 480 minutes");
      return;
    }

    setExtLoading(true);
    setError("");
    try {
      const res = await fetch("/api/v1/request-extension", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionToken: session.sessionToken,
          additionalMinutes: mins,
          reason: extReason || `Requesting ${mins} more minutes`,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccess("Extension request sent to the account owner!");
        setExtModalOpen(false);
        setExtMinutes("15");
        setExtReason("");
        setTimeout(() => setSuccess(""), 5000);
      } else {
        setError(data.message || "Failed to send extension request");
      }
    } catch {
      setError("Failed to send extension request. Please try again.");
    } finally {
      setExtLoading(false);
    }
  };

  if (session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#030014] p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <Card>
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              </div>
              <h2 className="text-lg font-semibold text-white">
                Access Granted
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                Your session is active
              </p>
            </div>

            {/* Timer */}
            <div className="bg-white/5 rounded-xl p-4 mb-4 text-center">
              <p className="text-xs text-slate-400 mb-1 flex items-center justify-center gap-1">
                <Clock className="w-3 h-3" /> Time Remaining
              </p>
              <p
                className={`text-3xl font-mono font-bold ${
                  countdown.expired
                    ? "text-red-400"
                    : countdown.total < 300000
                      ? "text-amber-400"
                      : "text-emerald-400"
                }`}
              >
                {countdown.formatted}
              </p>
            </div>

            {/* Credentials (shown briefly) */}
            <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-4 mb-4">
              <p className="text-xs text-violet-400 font-medium mb-2">
                Selectraa Credentials
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Email:</span>
                  <span className="text-white font-mono">
                    {session.credentials.email}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Password:</span>
                  <span className="text-white font-mono">••••••••</span>
                </div>
              </div>
            </div>

            {/* Success message */}
            <AnimatePresence>
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 p-3 rounded-xl text-sm bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-4"
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  {success}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error message */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 p-3 rounded-xl text-sm bg-red-500/10 text-red-400 border border-red-500/20 mb-4"
                >
                  <XCircle className="w-4 h-4 shrink-0" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {!countdown.expired && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setExtModalOpen(true)}
              >
                <Clock className="w-4 h-4" />
                Ask for more time
              </Button>
            )}

            {countdown.expired && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-center">
                <p className="text-sm text-red-400">
                  Session expired. Please request a new one.
                </p>
              </div>
            )}
          </Card>
        </motion.div>

        {/* Extension Request Modal */}
        <AnimatePresence>
          {extModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={() => setExtModalOpen(false)}
            >
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-sm bg-[#0a0a1a]/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-6 shadow-2xl"
              >
                <button
                  onClick={() => setExtModalOpen(false)}
                  className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                    <Timer className="w-5 h-5 text-violet-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">
                      Request Extension
                    </h3>
                    <p className="text-xs text-slate-400">
                      Ask the owner for more time
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">
                      Additional Time (minutes)
                    </label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="number"
                        min={5}
                        max={480}
                        value={extMinutes}
                        onChange={(e) => setExtMinutes(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-white
                          bg-white/5 border border-white/10
                          focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
                        placeholder="15"
                      />
                    </div>
                    <div className="flex gap-2 mt-2">
                      {[10, 15, 30, 60].map((m) => (
                        <button
                          key={m}
                          onClick={() => setExtMinutes(String(m))}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            extMinutes === String(m)
                              ? "bg-violet-500/20 text-violet-400 border border-violet-500/30"
                              : "bg-white/5 text-slate-400 hover:text-white border border-transparent"
                          }`}
                        >
                          {m}m
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">
                      Reason (optional)
                    </label>
                    <div className="relative">
                      <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                      <textarea
                        value={extReason}
                        onChange={(e) => setExtReason(e.target.value)}
                        rows={2}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm text-white resize-none
                          bg-white/5 border border-white/10
                          focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
                        placeholder="Need more time to finish..."
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleExtend}
                    loading={extLoading}
                    className="w-full"
                  >
                    <Timer className="w-4 h-4" />
                    Send Extension Request
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#030014] p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
            <KeyRound className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Verify OTP</h1>
            <p className="text-xs text-slate-400">
              Enter the OTP sent to your email
            </p>
          </div>
        </div>

        <Card>
          <form onSubmit={handleVerify} className="space-y-5">
            <Input
              label="Your Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail className="w-4 h-4" />}
              required
            />

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                OTP Code
              </label>
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.toUpperCase())}
                className="w-full px-4 py-4 rounded-xl text-2xl text-center font-mono font-bold text-white tracking-[0.5em]
                  bg-white/5 border border-white/10
                  focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all
                  placeholder:text-slate-600 placeholder:tracking-[0.5em]"
                placeholder="------"
                required
              />
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 p-3 rounded-xl text-sm bg-red-500/10 text-red-400 border border-red-500/20"
              >
                <XCircle className="w-4 h-4 shrink-0" />
                {error}
              </motion.div>
            )}

            <Button type="submit" loading={loading} className="w-full">
              Verify & Login
            </Button>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
