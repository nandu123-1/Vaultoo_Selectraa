"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Activity as ActivityIcon, AlertTriangle, Shield } from "lucide-react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

interface ActivityEntry {
  id: string;
  action: string;
  url?: string;
  details?: string;
  riskFlag: boolean;
  createdAt: string;
  session: {
    user: { name: string; email: string };
  };
}

export default function ActivityPage() {
  const [logs, setLogs] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFlagged, setShowFlagged] = useState(false);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const res = await fetch("/api/sessions?view=owner");
        const data = await res.json();
        if (data.success && data.data) {
          // Collect all activity logs from all sessions
          const allLogs: ActivityEntry[] = [];
          for (const session of data.data) {
            if (session.activityLogs) {
              for (const log of session.activityLogs) {
                allLogs.push({
                  ...log,
                  session: { user: session.user },
                });
              }
            }
          }
          allLogs.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          );
          setLogs(allLogs);
        }
      } catch (error) {
        console.error("Failed to fetch activity:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
    const interval = setInterval(fetchActivity, 15000);
    return () => clearInterval(interval);
  }, []);

  const filtered = showFlagged ? logs.filter((l) => l.riskFlag) : logs;

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
            <ActivityIcon className="w-6 h-6 text-violet-400" />
            Security Logs
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Track all user actions across sessions
          </p>
        </div>

        <button
          onClick={() => setShowFlagged(!showFlagged)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            showFlagged
              ? "bg-red-500/20 text-red-400 border border-red-500/30"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          {showFlagged ? "Showing Flagged Only" : "Show Flagged Only"}
        </button>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Shield className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">
              {showFlagged ? "No flagged activity" : "No activity logs yet"}
            </p>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="space-y-2">
            <AnimatePresence>
              {filtered.map((log, index) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className={`flex items-center justify-between p-3 rounded-xl transition-colors ${
                    log.riskFlag
                      ? "bg-red-500/5 border border-red-500/10"
                      : "bg-white/5 border border-transparent hover:border-white/5"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {log.riskFlag ? (
                      <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                        <AlertTriangle className="w-4 h-4 text-red-400" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                        <ActivityIcon className="w-4 h-4 text-slate-400" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-white">{log.action}</p>
                      <p className="text-xs text-slate-400">
                        {log.session?.user?.name || "Unknown"}{" "}
                        {log.url && `· ${log.url}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {log.riskFlag && <Badge variant="danger">Flagged</Badge>}
                    <span className="text-xs text-slate-500">
                      {new Date(log.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </Card>
      )}
    </div>
  );
}
