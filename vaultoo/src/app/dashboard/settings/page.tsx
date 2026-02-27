"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Settings as SettingsIcon,
  Shield,
  Key,
  Plus,
  Copy,
  Check,
} from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";

interface Account {
  id: string;
  platform: string;
  encryptedEmail: string;
  createdAt: string;
}

export default function SettingsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyAccountId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const res = await fetch("/api/accounts");
      const data = await res.json();
      if (data.success && data.data) {
        setAccounts(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch accounts:", error);
    }
  };

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddLoading(true);
    setAddError("");

    try {
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: newEmail,
          password: newPassword,
          platform: "selectraa",
        }),
      });

      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        setNewEmail("");
        setNewPassword("");
        await fetchAccounts();
      } else {
        setAddError(data.message);
      }
    } catch {
      setAddError("Failed to add account");
    } finally {
      setAddLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-violet-400" />
          Settings
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Manage your accounts and preferences
        </p>
      </div>

      {/* Selectraa Accounts */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-violet-400" />
            <h2 className="text-lg font-semibold text-white">
              Selectraa Accounts
            </h2>
          </div>
          <Button size="sm" onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4" />
            Add Account
          </Button>
        </div>

        {accounts.length === 0 ? (
          <div className="text-center py-8">
            <Shield className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">No accounts added yet</p>
            <p className="text-slate-500 text-xs mt-1">
              Add a Selectraa account to start sharing access
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {accounts.map((account) => (
              <motion.div
                key={account.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-violet-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">
                      {account.platform}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <code className="text-xs text-slate-400 font-mono bg-white/5 px-1.5 py-0.5 rounded">
                        {account.id}
                      </code>
                      <button
                        onClick={() => copyAccountId(account.id)}
                        className="p-0.5 rounded hover:bg-white/10 transition-colors cursor-pointer"
                        title="Copy Account ID"
                      >
                        {copiedId === account.id ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3 text-slate-500 hover:text-white" />
                        )}
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Added {new Date(account.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Badge variant="success">Encrypted</Badge>
              </motion.div>
            ))}
          </div>
        )}
      </Card>

      {/* Security Info */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-violet-400" />
          <h2 className="text-lg font-semibold text-white">Security</h2>
        </div>
        <div className="space-y-3 text-sm text-slate-400">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            All credentials are encrypted using AES-256 before storage
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            OTPs are single-use and expire after 10 minutes
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            Sessions are automatically terminated when time expires
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            AI Sentinel monitors all session activity in real-time
          </div>
        </div>
      </Card>

      {/* Add Account Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Selectraa Account"
      >
        <form onSubmit={handleAddAccount} className="space-y-4">
          <p className="text-sm text-slate-400 mb-4">
            Your credentials will be encrypted with AES-256 before storage.
          </p>
          <Input
            label="Selectraa Email"
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="account@selectraa.com"
            required
          />
          <Input
            label="Selectraa Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
          {addError && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
              {addError}
            </p>
          )}
          <div className="flex gap-3 justify-end">
            <Button
              variant="secondary"
              type="button"
              onClick={() => setShowAddModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={addLoading}>
              Add Account
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
