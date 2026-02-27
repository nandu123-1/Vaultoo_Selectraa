"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  MonitorUp,
  Inbox,
  Activity,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

interface DashboardStats {
  activeSessions: number;
  pendingRequests: number;
  totalSessions: number;
  highRiskAlerts: number;
}

interface RecentSession {
  id: string;
  user: { name: string; email: string };
  status: string;
  expiresAt: string;
  riskLevel: string;
  request: { duration: number; account: { platform: string } };
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    activeSessions: 0,
    pendingRequests: 0,
    totalSessions: 0,
    highRiskAlerts: 0,
  });
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sessionsRes, requestsRes] = await Promise.all([
          fetch("/api/sessions?view=owner"),
          fetch("/api/requests?view=owner"),
        ]);

        const sessionsData = await sessionsRes.json();
        const requestsData = await requestsRes.json();

        if (sessionsData.success && sessionsData.data) {
          const sessions = sessionsData.data;
          const active = sessions.filter(
            (s: RecentSession) => s.status === "ACTIVE",
          );
          const highRisk = sessions.filter(
            (s: RecentSession) =>
              s.riskLevel === "HIGH" || s.riskLevel === "CRITICAL",
          );

          setStats((prev) => ({
            ...prev,
            activeSessions: active.length,
            totalSessions: sessions.length,
            highRiskAlerts: highRisk.length,
          }));

          setRecentSessions(sessions.slice(0, 5));
        }

        if (requestsData.success && requestsData.data) {
          const pending = requestsData.data.filter(
            (r: { status: string }) =>
              r.status === "PENDING" || r.status === "EXTENSION_PENDING",
          );
          setStats((prev) => ({ ...prev, pendingRequests: pending.length }));
        }
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const statCards = [
    {
      label: "Active Sessions",
      value: stats.activeSessions,
      icon: MonitorUp,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Pending Requests",
      value: stats.pendingRequests,
      icon: Inbox,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
    },
    {
      label: "Total Sessions",
      value: stats.totalSessions,
      icon: TrendingUp,
      color: "text-violet-400",
      bg: "bg-violet-500/10",
    },
    {
      label: "Risk Alerts",
      value: stats.highRiskAlerts,
      icon: AlertTriangle,
      color: "text-red-400",
      bg: "bg-red-500/10",
    },
  ];

  const riskBadge = (level: string) => {
    const map: Record<string, "success" | "warning" | "danger" | "info"> = {
      LOW: "success",
      MEDIUM: "warning",
      HIGH: "danger",
      CRITICAL: "danger",
    };
    return map[level] || "info";
  };

  const statusBadge = (status: string) => {
    const map: Record<
      string,
      { variant: "success" | "warning" | "danger" | "default"; label: string }
    > = {
      ACTIVE: { variant: "success", label: "Active" },
      EXPIRED: { variant: "default", label: "Expired" },
      KILLED: { variant: "danger", label: "Killed" },
    };
    return map[status] || { variant: "default" as const, label: status };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <div className="w-10 h-10 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">
          Overview of your access management
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card>
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center`}
                >
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-slate-400">{stat.label}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Recent Sessions */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-violet-400" />
            Recent Sessions
          </h2>
        </div>

        {recentSessions.length === 0 ? (
          <div className="text-center py-8">
            <Shield className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">No sessions yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {recentSessions.map((session, index) => {
                const status = statusBadge(session.status);
                return (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                        {session.user?.name?.charAt(0) || "?"}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">
                          {session.user?.name || "Unknown User"}
                        </p>
                        <p className="text-xs text-slate-400">
                          {session.request?.account?.platform || "selectraa"}{" "}
                          &middot; {session.request?.duration}min
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant={riskBadge(session.riskLevel)}>
                        {session.riskLevel}
                      </Badge>
                      <Badge
                        variant={status.variant}
                        pulse={session.status === "ACTIVE"}
                      >
                        {status.label}
                      </Badge>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </Card>
    </div>
  );
}
