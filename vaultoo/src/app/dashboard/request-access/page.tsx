"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { KeyRound, CheckCircle2, XCircle, Clock } from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import Select from "@/components/ui/Select";

interface OwnerAccount {
  id: string;
  platform: string;
  owner: { name: string; email: string };
}

export default function RequestAccessPage() {
  const [accounts, setAccounts] = useState<OwnerAccount[]>([]);
  const [accountId, setAccountId] = useState("");
  const [duration, setDuration] = useState("30");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const res = await fetch("/api/accounts");
        const data = await res.json();
        if (data.success) {
          setAccounts(data.data || []);
        }
      } catch {
        console.error("Failed to fetch accounts");
      } finally {
        setLoadingAccounts(false);
      }
    };
    fetchAccounts();
  }, []);

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

      if (data.success) {
        setAccountId("");
        setReason("");
        setDuration("30");
      }
    } catch {
      setResult({ success: false, message: "Failed to submit request" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <KeyRound className="w-6 h-6 text-violet-400" />
          Request Access
        </h1>
        <p className="text-slate-400 mt-1">
          Request temporary access to a shared Selectraa account
        </p>
      </motion.div>

      {/* Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="max-w-xl p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Account Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Account
              </label>
              {loadingAccounts ? (
                <div className="h-10 bg-white/5 rounded-xl animate-pulse" />
              ) : accounts.length > 0 ? (
                <Select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  options={[
                    { value: "", label: "Select an account..." },
                    ...accounts.map((a) => ({
                      value: a.id,
                      label: `${a.platform} — ${a.owner?.name || "Unknown"}`,
                    })),
                  ]}
                />
              ) : (
                <div>
                  <Input
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    placeholder="Enter account ID"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Ask the account owner for their Account ID
                  </p>
                </div>
              )}
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                <Clock className="w-4 h-4 inline mr-1" />
                Duration
              </label>
              <Select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                options={[
                  { value: "5", label: "5 minutes" },
                  { value: "15", label: "15 minutes" },
                  { value: "30", label: "30 minutes" },
                  { value: "60", label: "1 hour" },
                  { value: "120", label: "2 hours" },
                  { value: "240", label: "4 hours" },
                  { value: "480", label: "8 hours" },
                ]}
              />
            </div>

            {/* Reason */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Reason (optional)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Why do you need access?"
                rows={3}
                className="w-full px-4 py-3 rounded-xl text-sm text-white bg-white/5 border border-white/10
                  placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/30
                  transition-all resize-none"
              />
            </div>

            {/* Result Message */}
            {result && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-center gap-2 p-3 rounded-xl text-sm ${
                  result.success
                    ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                    : "bg-red-500/10 border border-red-500/20 text-red-400"
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

            <Button
              type="submit"
              loading={loading}
              disabled={!accountId || loading}
              className="w-full"
            >
              Submit Request
            </Button>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
