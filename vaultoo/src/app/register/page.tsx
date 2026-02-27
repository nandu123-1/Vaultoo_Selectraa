"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Mail,
  Lock,
  User,
  Shield,
  ArrowRight,
  Crown,
  UserCheck,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<"OWNER" | "USER">("OWNER");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.message);
        return;
      }

      router.push("/verify");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#030014] p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Vaultoo</h1>
        </div>

        <h2 className="text-xl font-semibold text-white mb-1">
          Create your account
        </h2>
        <p className="text-slate-400 text-sm mb-8">
          Set up your Vaultoo account to start managing access securely
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Role Selector */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              I want to
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole("OWNER")}
                className={`p-3 rounded-xl border text-left transition-all ${
                  role === "OWNER"
                    ? "bg-violet-500/20 border-violet-500/50 text-white"
                    : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"
                }`}
              >
                <Crown
                  className={`w-5 h-5 mb-1.5 ${role === "OWNER" ? "text-violet-400" : "text-slate-500"}`}
                />
                <p className="text-sm font-medium">Share Access</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  I own accounts &amp; grant access
                </p>
              </button>
              <button
                type="button"
                onClick={() => setRole("USER")}
                className={`p-3 rounded-xl border text-left transition-all ${
                  role === "USER"
                    ? "bg-violet-500/20 border-violet-500/50 text-white"
                    : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"
                }`}
              >
                <UserCheck
                  className={`w-5 h-5 mb-1.5 ${role === "USER" ? "text-violet-400" : "text-slate-500"}`}
                />
                <p className="text-sm font-medium">Request Access</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  I need to use shared accounts
                </p>
              </button>
            </div>
          </div>

          <Input
            label="Full Name"
            type="text"
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            icon={<User className="w-4 h-4" />}
            required
          />

          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={<Mail className="w-4 h-4" />}
            required
          />

          <Input
            label="Password"
            type="password"
            placeholder="Min. 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={<Lock className="w-4 h-4" />}
            required
          />

          <Input
            label="Confirm Password"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            icon={<Lock className="w-4 h-4" />}
            required
          />

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl p-3"
            >
              {error}
            </motion.p>
          )}

          <Button type="submit" loading={loading} className="w-full">
            Create Account
            <ArrowRight className="w-4 h-4" />
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Already have an account?{" "}
          <button
            onClick={() => router.push("/login")}
            className="text-violet-400 hover:text-violet-300 font-medium transition-colors"
          >
            Sign in
          </button>
        </p>
      </motion.div>
    </div>
  );
}
