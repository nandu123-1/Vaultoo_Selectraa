"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { KeyRound, CheckCircle2, XCircle } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";

export default function RequestAccessPage() {
  const [accountId, setAccountId] = useState("");
  const [duration, setDuration] = useState("30");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId,
          duration: parseInt(duration),
          reason,
        }),
      });

      const data = await res.json();
      setResult({ success: data.success, message: data.message });
    } catch {
      setResult({ success: false, message: "Failed to submit request" });
    } finally {
      setLoading(false);
    }
  };

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
            <h1 className="text-xl font-bold text-white">Request Access</h1>
            <p className="text-xs text-slate-400">
              Ask the account owner for temporary access
            </p>
          </div>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Account ID"
              placeholder="Enter the account ID"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              required
            />

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Duration
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl text-sm text-white bg-white/5 border border-white/10
                  focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all appearance-none"
              >
                <option value="15" className="bg-slate-900">
                  15 minutes
                </option>
                <option value="30" className="bg-slate-900">
                  30 minutes
                </option>
                <option value="60" className="bg-slate-900">
                  1 hour
                </option>
                <option value="120" className="bg-slate-900">
                  2 hours
                </option>
                <option value="240" className="bg-slate-900">
                  4 hours
                </option>
                <option value="480" className="bg-slate-900">
                  8 hours
                </option>
              </select>
            </div>

            <Input
              label="Reason (optional)"
              placeholder="Why do you need access?"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />

            {result && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-center gap-2 p-3 rounded-xl text-sm ${
                  result.success
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "bg-red-500/10 text-red-400 border border-red-500/20"
                }`}
              >
                {result.success ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 shrink-0" />
                )}
                {result.message}
              </motion.div>
            )}

            <Button type="submit" loading={loading} className="w-full">
              Submit Request
            </Button>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
