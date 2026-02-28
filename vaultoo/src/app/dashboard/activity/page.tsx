"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity as ActivityIcon,
  AlertTriangle,
  Shield,
  Monitor,
  Eye,
  EyeOff,
  RefreshCw,
  User as UserIcon,
} from "lucide-react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";

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

interface LiveSession {
  id: string;
  status: string;
  user: { name: string; email: string };
  request: { account: { platform: string }; duration: number };
  expiresAt: string;
  riskLevel: string;
}

interface FrameData {
  frame: string | null;
  frameUpdatedAt: string | null;
  user: { name: string; email: string };
}

export default function ActivityPage() {
  const [logs, setLogs] = useState<ActivityEntry[]>([]);
  const [activeSessions, setActiveSessions] = useState<LiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFlagged, setShowFlagged] = useState(false);

  // Screen feed state
  const [watchingSessionId, setWatchingSessionId] = useState<string | null>(
    null,
  );
  const [frameData, setFrameData] = useState<FrameData | null>(null);
  const [frameLoading, setFrameLoading] = useState(false);
  const [feedOpen, setFeedOpen] = useState(false);

  const fetchActivity = useCallback(async () => {
    try {
      const res = await fetch("/api/sessions?view=owner");
      const data = await res.json();
      if (data.success && data.data) {
        const actives = data.data.filter(
          (s: LiveSession) => s.status === "ACTIVE",
        );
        setActiveSessions(actives);

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
  }, []);

  useEffect(() => {
    fetchActivity();
    const interval = setInterval(fetchActivity, 15000);
    return () => clearInterval(interval);
  }, [fetchActivity]);

  // Poll for screen frames when watching a session
  useEffect(() => {
    if (!watchingSessionId) return;

    const fetchFrame = async () => {
      setFrameLoading(true);
      try {
        const res = await fetch(
          `/api/v1/screen-share?sessionId=${watchingSessionId}`,
        );
        const data = await res.json();
        if (data.success && data.data) {
          setFrameData(data.data);
        }
      } catch (err) {
        console.error("Frame fetch error:", err);
      } finally {
        setFrameLoading(false);
      }
    };

    fetchFrame();
    const interval = setInterval(fetchFrame, 2000);
    return () => clearInterval(interval);
  }, [watchingSessionId]);

  const startWatching = (sessionId: string) => {
    setWatchingSessionId(sessionId);
    setFrameData(null);
    setFeedOpen(true);
  };

  const stopWatching = () => {
    setWatchingSessionId(null);
    setFrameData(null);
    setFeedOpen(false);
  };

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

      {/* ───── Live Screen Feeds ───── */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Monitor className="w-5 h-5 text-emerald-400" />
          <h2 className="text-sm font-semibold text-white">
            Live Screen Feeds
          </h2>
          {activeSessions.length > 0 ? (
            <Badge variant="success" pulse>
              {activeSessions.length} Active
            </Badge>
          ) : (
            <Badge variant="default">No Active Sessions</Badge>
          )}
        </div>

        {activeSessions.length === 0 ? (
          <div className="text-center py-8">
            <Monitor className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-400">
              No active sessions to monitor
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Live screen feeds will appear here when a requester has an active
              session
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeSessions.map((session) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative group rounded-xl border border-white/5 bg-black/30 overflow-hidden cursor-pointer hover:border-violet-500/30 transition-all"
                onClick={() => startWatching(session.id)}
              >
                <div className="aspect-video bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center relative">
                  <div className="text-center">
                    <Monitor className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="text-xs text-slate-500">
                      Click to watch live
                    </p>
                  </div>

                  <div className="absolute inset-0 bg-violet-500/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="bg-violet-500/80 rounded-full p-3">
                      <Eye className="w-5 h-5 text-white" />
                    </div>
                  </div>

                  <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm rounded-full px-2 py-1">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-[10px] text-white font-medium">
                      LIVE
                    </span>
                  </div>
                </div>

                <div className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                      {session.user.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-white truncate">
                        {session.user.name}
                      </p>
                      <p className="text-[10px] text-slate-500 truncate">
                        {session.request.account.platform}
                      </p>
                    </div>
                    <Badge
                      variant={
                        session.riskLevel === "LOW"
                          ? "success"
                          : session.riskLevel === "MEDIUM"
                            ? "warning"
                            : "danger"
                      }
                    >
                      {session.riskLevel}
                    </Badge>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </Card>

      {/* ───── Activity Log ───── */}
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

      {/* ───── Live Feed Modal ───── */}
      <Modal
        isOpen={feedOpen}
        onClose={stopWatching}
        title="Live Screen Feed"
        size="lg"
      >
        <div className="space-y-4">
          <div className="relative rounded-xl overflow-hidden bg-black border border-white/10 aspect-video">
            {frameData?.frame ? (
              <motion.img
                key={frameData.frameUpdatedAt}
                initial={{ opacity: 0.7 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                src={`data:image/jpeg;base64,${frameData.frame}`}
                alt="Live screen feed"
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                {frameLoading ? (
                  <>
                    <RefreshCw className="w-8 h-8 text-violet-400 animate-spin mb-3" />
                    <p className="text-sm text-slate-400">
                      Connecting to screen feed...
                    </p>
                  </>
                ) : (
                  <>
                    <EyeOff className="w-8 h-8 text-slate-600 mb-3" />
                    <p className="text-sm text-slate-400">
                      No screen feed available
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      The requester needs to enable screen sharing in Selectra
                    </p>
                  </>
                )}
              </div>
            )}

            {frameData?.frame && (
              <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/70 backdrop-blur-sm rounded-full px-2.5 py-1">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs text-white font-medium">LIVE</span>
              </div>
            )}

            {frameData?.frameUpdatedAt && (
              <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-sm rounded-full px-2.5 py-1">
                <span className="text-[10px] text-slate-400">
                  Updated:{" "}
                  {new Date(frameData.frameUpdatedAt).toLocaleTimeString()}
                </span>
              </div>
            )}
          </div>

          {frameData?.user && (
            <div className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                {frameData.user.name.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-medium text-white">
                  {frameData.user.name}
                </p>
                <p className="text-xs text-slate-400">{frameData.user.email}</p>
              </div>
              <Badge variant="success" pulse>
                <UserIcon className="w-3 h-3 mr-1" />
                Sharing Screen
              </Badge>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
