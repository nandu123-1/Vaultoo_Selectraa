"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Lock, Shield, ArrowRight } from "lucide-react";
import dynamic from "next/dynamic";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

const ShieldScene = dynamic(() => import("@/components/three/ShieldScene"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-16 h-16 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
    </div>
  ),
});

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.message);
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#030014]">
      {/* Left - 3D Scene */}
      <div className="hidden lg:flex flex-1 items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-900/20 to-purple-900/20" />
        <div className="w-full h-[500px]">
          <ShieldScene />
        </div>
        <div className="absolute bottom-12 left-12 right-12 text-center">
          <h2 className="text-3xl font-bold text-white mb-2">
            Enterprise Access{" "}
            <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
              Orchestrator
            </span>
          </h2>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            Secure, time-limited access sharing with real-time monitoring and
            AI-powered threat detection.
          </p>
        </div>
      </div>

      {/* Right - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
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
            Welcome back
          </h2>
          <p className="text-slate-400 text-sm mb-8">
            Sign in to your account to continue
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
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
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
              Sign In
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            Don&apos;t have an account?{" "}
            <button
              onClick={() => router.push("/register")}
              className="text-violet-400 hover:text-violet-300 font-medium transition-colors"
            >
              Create one
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
