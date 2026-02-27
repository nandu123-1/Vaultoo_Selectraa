"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MonitorUp,
  Clock,
  Globe,
  Smartphone,
  AlertTriangle,
  Shield,
} from "lucide-react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import KillSwitch from "@/components/ui/KillSwitch";
import { useCountdown } from "@/hooks/useCountdown";

interface SessionData {
  id: string;
  sessionToken: string;
  status: string;
  expiresAt: string;
  userIp: string;
  userAgent: string;
  riskLevel: string;
  createdAt: string;
  user: { id: string; name: string; email: string };
  request: {
    id: string;
    duration: number;
    reason: string;
    account: { id: string; platform: string };
  };
  activityLogs: Array<{
    id: string;
    action: string;
    riskFlag: boolean;
    createdAt: string;
  }>;
}

function SessionCard({
  session,
  onKill,
}: {
  session: SessionData;
  onKill: (id: string) => Promise<void>;
}) {
  const countdown = useCountdown(session.expiresAt);

  const riskVariant = {
    LOW: "success",
    MEDIUM: "warning",
    HIGH: "danger",
    CRITICAL: "danger",
  }[session.riskLevel] as "success" | "warning" | "danger";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card className="relative overflow-hidden">
        {/* Risk indicator bar */}
        {(session.riskLevel === "HIGH" || session.riskLevel === "CRITICAL") && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-rose-500" />
        )}

        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold">
              {session.user.name.charAt(0)}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">
                {session.user.name}
              </h3>
              <p className="text-xs text-slate-400">{session.user.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant={riskVariant} pulse={session.riskLevel !== "LOW"}>
              {session.riskLevel} Risk
            </Badge>
            <Badge
              variant={session.status === "ACTIVE" ? "success" : "default"}
              pulse={session.status === "ACTIVE"}
            >
              {session.status}
            </Badge>
          </div>
        </div>

        {/* Metadata */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Clock className="w-3.5 h-3.5" />
            <span>
              {session.status === "ACTIVE" ? (
                <span
                  className={
                    countdown.total < 300000
                      ? "text-amber-400"
                      : "text-emerald-400"
                  }
                >
                  {countdown.formatted} remaining
                </span>
              ) : (
                "Ended"
              )}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Globe className="w-3.5 h-3.5" />
            <span>{session.userIp || "Unknown IP"}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400 col-span-2">
            <Smartphone className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">
              {session.userAgent || "Unknown device"}
            </span>
          </div>
        </div>

        {/* Recent Activity */}
        {session.activityLogs.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-slate-500 mb-2">Recent Activity</p>
            <div className="space-y-1">
              {session.activityLogs.slice(0, 3).map((log) => (
                <div
                  key={log.id}
                  className={`text-xs px-2 py-1 rounded-lg flex items-center gap-2 ${
                    log.riskFlag
                      ? "bg-red-500/10 text-red-400"
                      : "bg-white/5 text-slate-400"
                  }`}
                >
                  {log.riskFlag && <AlertTriangle className="w-3 h-3" />}
                  {log.action}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Kill Switch */}
        {session.status === "ACTIVE" && (
          <div className="flex justify-end">
            <KillSwitch sessionId={session.id} onKill={onKill} />
          </div>
        )}
      </Card>
    </motion.div>
  );
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "expired" | "killed">(
    "all",
  );

  const fetchSessions = async () => {
    try {
      const res = await fetch("/api/sessions?view=owner");
      const data = await res.json();
      if (data.success && data.data) {
        setSessions(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
    const interval = setInterval(fetchSessions, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleKill = async (sessionId: string) => {
    try {
      const res = await fetch(`/api/sessions/${sessionId}/kill`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        await fetchSessions();
      } else {
        alert(data.message || "Failed to kill session");
      }
    } catch (error) {
      console.error("Kill failed:", error);
      alert("Failed to kill session. Please try again.");
    }
  };

  const filtered = sessions.filter((s) => {
    if (filter === "all") return true;
    return s.status === filter.toUpperCase();
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <div className="w-10 h-10 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <MonitorUp className="w-6 h-6 text-violet-400" />
            Active Sessions
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Monitor and manage all access sessions
          </p>
        </div>

        {/* Filter */}
        <div className="flex gap-2">
          {(["all", "active", "expired", "killed"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === f
                  ? "bg-violet-500/20 text-violet-400 border border-violet-500/30"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Shield className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No sessions found</p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4">
          <AnimatePresence>
            {filtered.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onKill={handleKill}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
