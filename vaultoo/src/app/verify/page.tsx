"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, CheckCircle2, XCircle } from "lucide-react";
import Button from "@/components/ui/Button";

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<
    "pending" | "verifying" | "success" | "error"
  >(token ? "verifying" : "pending");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) return;

    const verify = async () => {
      try {
        const res = await fetch(`/api/auth/verify-email?token=${token}`);
        const data = await res.json();

        if (data.success) {
          setStatus("success");
          setMessage("Your email has been verified!");
        } else {
          setStatus("error");
          setMessage(data.message || "Verification failed");
        }
      } catch {
        setStatus("error");
        setMessage("Something went wrong");
      }
    };

    verify();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#030014] p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md w-full"
      >
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center">
            {status === "pending" && <Mail className="w-8 h-8 text-white" />}
            {status === "verifying" && (
              <div className="w-8 h-8 border-3 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {status === "success" && (
              <CheckCircle2 className="w-8 h-8 text-white" />
            )}
            {status === "error" && <XCircle className="w-8 h-8 text-white" />}
          </div>
        </div>

        {status === "pending" && (
          <>
            <h2 className="text-2xl font-bold text-white mb-2">
              Check your email
            </h2>
            <p className="text-slate-400 mb-8">
              We&apos;ve sent a verification link to your email address. Click
              the link to verify your account.
            </p>
            <Button variant="secondary" onClick={() => router.push("/login")}>
              Go to Login
            </Button>
          </>
        )}

        {status === "verifying" && (
          <>
            <h2 className="text-2xl font-bold text-white mb-2">Verifying...</h2>
            <p className="text-slate-400">
              Please wait while we verify your email
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <h2 className="text-2xl font-bold text-white mb-2">
              Email Verified!
            </h2>
            <p className="text-slate-400 mb-8">{message}</p>
            <Button onClick={() => router.push("/dashboard")}>
              Go to Dashboard
            </Button>
          </>
        )}

        {status === "error" && (
          <>
            <h2 className="text-2xl font-bold text-white mb-2">
              Verification Failed
            </h2>
            <p className="text-red-400 mb-8">{message}</p>
            <Button variant="secondary" onClick={() => router.push("/login")}>
              Back to Login
            </Button>
          </>
        )}
      </motion.div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#030014]">
          <div className="w-8 h-8 border-3 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
