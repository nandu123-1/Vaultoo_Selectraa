"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Inbox,
  Check,
  X,
  Clock,
  Shield,
  Copy,
  CheckCheck,
  Key,
} from "lucide-react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";

interface RequestData {
  id: string;
  requesterId: string;
  ownerId: string;
  accountId: string;
  status: string;
  duration: number;
  reason?: string;
  createdAt: string;
  requester: { id: string; name: string; email: string };
  owner: { id: string; name: string; email: string };
  account: { id: string; platform: string };
  session?: {
    id: string;
    status: string;
    expiresAt: string;
    riskLevel: string;
  };
}

export default function RequestsPage() {
  const [requests, setRequests] = useState<RequestData[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [extensionModal, setExtensionModal] = useState<string | null>(null);
  const [extensionMinutes, setExtensionMinutes] = useState("30");
  const [extensionReason, setExtensionReason] = useState("");
  const [otpModal, setOtpModal] = useState<{
    otp: string;
    requesterName: string;
    requesterEmail: string;
  } | null>(null);
  const [copiedOtp, setCopiedOtp] = useState(false);

  const fetchRequests = async () => {
    try {
      const res = await fetch("/api/requests?view=owner");
      const data = await res.json();
      if (data.success && data.data) {
        setRequests(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch requests:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(fetchRequests, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      const req = requests.find((r) => r.id === id);
      const res = await fetch(`/api/requests/${id}/approve`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        if (data.data?.otp) {
          setOtpModal({
            otp: data.data.otp,
            requesterName: req?.requester.name || "Requester",
            requesterEmail: req?.requester.email || "",
          });
        }
        await fetchRequests();
      }
    } catch (error) {
      console.error("Approve failed:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const copyOtp = async () => {
    if (!otpModal) return;
    await navigator.clipboard.writeText(otpModal.otp);
    setCopiedOtp(true);
    setTimeout(() => setCopiedOtp(false), 2000);
  };

  const handleDeny = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/requests/${id}/deny`, { method: "POST" });
      const data = await res.json();
      if (data.success) await fetchRequests();
    } catch (error) {
      console.error("Deny failed:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleExtend = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/requests/${id}/extend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          additionalMinutes: parseInt(extensionMinutes),
          reason: extensionReason,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setExtensionModal(null);
        await fetchRequests();
      }
    } catch (error) {
      console.error("Extend failed:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const statusConfig: Record<
    string,
    {
      variant: "success" | "warning" | "danger" | "default" | "info";
      label: string;
    }
  > = {
    PENDING: { variant: "warning", label: "Pending" },
    APPROVED: { variant: "success", label: "Approved" },
    DENIED: { variant: "danger", label: "Denied" },
    EXPIRED: { variant: "default", label: "Expired" },
    EXTENSION_PENDING: { variant: "info", label: "Extension Request" },
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
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Inbox className="w-6 h-6 text-violet-400" />
          Requests
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Manage access requests from users
        </p>
      </div>

      {requests.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Shield className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No requests yet</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {requests.map((req, index) => {
              const status = statusConfig[req.status] || {
                variant: "default" as const,
                label: req.status,
              };

              return (
                <motion.div
                  key={req.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card>
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold shrink-0">
                          {req.requester.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-sm font-semibold text-white">
                              {req.requester.name}
                            </h3>
                            <Badge variant={status.variant}>
                              {status.label}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-400 mb-2">
                            {req.requester.email} &middot;{" "}
                            {req.account.platform}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-slate-400">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {req.duration} minutes
                            </span>
                            <span>
                              {new Date(req.createdAt).toLocaleDateString()} at{" "}
                              {new Date(req.createdAt).toLocaleTimeString()}
                            </span>
                          </div>
                          {req.reason && (
                            <p className="mt-2 text-xs text-slate-300 bg-white/5 rounded-lg px-3 py-2">
                              &ldquo;{req.reason}&rdquo;
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                        {(req.status === "PENDING" ||
                          req.status === "EXTENSION_PENDING") && (
                          <>
                            <Button
                              size="sm"
                              variant="primary"
                              loading={actionLoading === req.id}
                              onClick={() =>
                                req.status === "EXTENSION_PENDING"
                                  ? handleExtend(req.id)
                                  : handleApprove(req.id)
                              }
                            >
                              <Check className="w-4 h-4" />
                              {req.status === "EXTENSION_PENDING"
                                ? "Grant Extension"
                                : "Approve"}
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              loading={actionLoading === req.id}
                              onClick={() => handleDeny(req.id)}
                            >
                              <X className="w-4 h-4" />
                              Deny
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Extension Modal */}
      <Modal
        isOpen={!!extensionModal}
        onClose={() => setExtensionModal(null)}
        title="Extend Session Time"
      >
        <div className="space-y-4">
          <Input
            label="Additional Minutes"
            type="number"
            value={extensionMinutes}
            onChange={(e) => setExtensionMinutes(e.target.value)}
            placeholder="30"
          />
          <Input
            label="Reason (optional)"
            value={extensionReason}
            onChange={(e) => setExtensionReason(e.target.value)}
            placeholder="Why do you need more time?"
          />
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setExtensionModal(null)}>
              Cancel
            </Button>
            <Button
              loading={!!actionLoading}
              onClick={() => extensionModal && handleExtend(extensionModal)}
            >
              Grant Extension
            </Button>
          </div>
        </div>
      </Modal>

      {/* OTP Modal */}
      <Modal
        isOpen={!!otpModal}
        onClose={() => {
          setOtpModal(null);
          setCopiedOtp(false);
        }}
        title="Request Approved — OTP Generated"
      >
        <div className="space-y-5">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <Key className="w-5 h-5 text-emerald-400 shrink-0" />
            <p className="text-sm text-emerald-300">
              Share this one-time password with{" "}
              <span className="font-semibold text-white">
                {otpModal?.requesterName}
              </span>
              {otpModal?.requesterEmail && (
                <span className="text-slate-400">
                  {" "}
                  ({otpModal.requesterEmail})
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center justify-center gap-3">
            <code className="text-3xl font-mono font-bold tracking-[0.3em] text-white bg-white/5 border border-white/10 rounded-xl px-6 py-4">
              {otpModal?.otp}
            </code>
            <button
              onClick={copyOtp}
              className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
              title="Copy OTP"
            >
              {copiedOtp ? (
                <CheckCheck className="w-5 h-5 text-emerald-400" />
              ) : (
                <Copy className="w-5 h-5 text-slate-400" />
              )}
            </button>
          </div>

          <p className="text-xs text-slate-500 text-center">
            This OTP expires in 10 minutes. The requester must enter it in
            &ldquo;My Sessions&rdquo; to access the credentials.
          </p>

          <div className="flex justify-end">
            <Button
              onClick={() => {
                setOtpModal(null);
                setCopiedOtp(false);
              }}
            >
              Done
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
