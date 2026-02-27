"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar, Header } from "@/components/layout";
import { motion } from "framer-motion";
import type { SafeUser } from "@/types";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<SafeUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();

        if (!data.success || !data.data) {
          router.push("/login");
          return;
        }

        setUser(data.data);
      } catch {
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030014] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#030014]">
      <Sidebar />
      <div className="ml-[260px] transition-all duration-300">
        <Header user={user} />
        <motion.main
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="p-6"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}
