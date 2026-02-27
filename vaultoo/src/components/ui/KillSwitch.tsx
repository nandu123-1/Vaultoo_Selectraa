"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Power } from "lucide-react";

interface KillSwitchProps {
  sessionId: string;
  onKill: (sessionId: string) => Promise<void>;
  disabled?: boolean;
}

export default function KillSwitch({
  sessionId,
  onKill,
  disabled,
}: KillSwitchProps) {
  const [confirming, setConfirming] = useState(false);
  const [killing, setKilling] = useState(false);

  const handleClick = async () => {
    if (!confirming) {
      setConfirming(true);
      setTimeout(() => setConfirming(false), 3000); // reset after 3s
      return;
    }

    setKilling(true);
    try {
      await onKill(sessionId);
    } finally {
      setKilling(false);
      setConfirming(false);
    }
  };

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      onClick={handleClick}
      disabled={disabled || killing}
      className={`
        inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
        transition-all duration-300
        ${
          confirming
            ? "bg-red-600 text-white shadow-lg shadow-red-500/30 animate-pulse"
            : "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20"
        }
        disabled:opacity-50 disabled:cursor-not-allowed
      `}
    >
      <Power className="w-4 h-4" />
      {killing
        ? "Terminating..."
        : confirming
          ? "Confirm Kill"
          : "Kill Session"}
    </motion.button>
  );
}
