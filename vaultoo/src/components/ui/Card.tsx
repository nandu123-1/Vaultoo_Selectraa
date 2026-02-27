"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";

interface CardProps {
  children: ReactNode;
  className?: string;
  glass?: boolean;
  hover?: boolean;
  onClick?: () => void;
}

export default function Card({
  children,
  className = "",
  glass = true,
  hover = false,
  onClick,
}: CardProps) {
  const baseClasses = glass
    ? "bg-white/5 backdrop-blur-xl border border-white/10 shadow-xl"
    : "bg-slate-900 border border-slate-800";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      whileHover={
        hover
          ? { scale: 1.01, borderColor: "rgba(167,139,250,0.3)" }
          : undefined
      }
      onClick={onClick}
      className={`
        rounded-2xl p-6 ${baseClasses}
        ${hover ? "cursor-pointer" : ""}
        ${className}
      `}
    >
      {children}
    </motion.div>
  );
}
