"use client";

import { Bell, Search, Menu } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import ThemeToggle from "@/components/ui/ThemeToggle";
import type { SafeUser } from "@/types";

interface HeaderProps {
  user: SafeUser | null;
  onMenuClick?: () => void;
}

export default function Header({ user, onMenuClick }: HeaderProps) {
  const [notifications] = useState<string[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);

  return (
    <header className="h-16 border-b border-white/5 bg-black/20 backdrop-blur-xl flex items-center justify-between px-4 sm:px-6">
      {/* Left side: hamburger + search */}
      <div className="flex items-center gap-3">
        {/* Mobile hamburger */}
        <button
          onClick={onMenuClick}
          className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Search */}
        <div className="relative hidden sm:block w-48 md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search sessions, requests..."
            className="w-full pl-10 pr-4 py-2 rounded-xl text-sm text-white bg-white/5 border border-white/10
              placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/30 transition-all"
          />
        </div>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-3">
        <ThemeToggle />

        {/* Notifications */}
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowNotifs(!showNotifs)}
            className="relative p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Bell className="w-5 h-5" />
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">
                {notifications.length}
              </span>
            )}
          </motion.button>

          <AnimatePresence>
            {showNotifs && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-2 w-72 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-4 z-50"
              >
                <h3 className="text-sm font-semibold text-white mb-3">
                  Notifications
                </h3>
                {notifications.length === 0 ? (
                  <p className="text-sm text-slate-400">No new notifications</p>
                ) : (
                  notifications.map((n, i) => (
                    <div
                      key={i}
                      className="text-sm text-slate-300 py-2 border-b border-white/5 last:border-0"
                    >
                      {n}
                    </div>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User */}
        {user && (
          <div className="flex items-center gap-3 pl-3 border-l border-white/10">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-white leading-tight">
                {user.name}
              </p>
              <p className="text-xs text-slate-400">{user.email}</p>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
