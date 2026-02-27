"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";
import { motion } from "framer-motion";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

const variants = {
  primary:
    "bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white shadow-lg shadow-violet-500/25",
  secondary: "bg-white/10 hover:bg-white/20 text-white border border-white/10",
  danger:
    "bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg shadow-red-500/25",
  ghost: "bg-transparent hover:bg-white/5 text-slate-300",
  outline:
    "bg-transparent border border-violet-500/50 hover:border-violet-400 text-violet-400 hover:text-violet-300",
};

const sizes = {
  sm: "px-3 py-1.5 text-xs rounded-lg",
  md: "px-5 py-2.5 text-sm rounded-xl",
  lg: "px-8 py-3.5 text-base rounded-xl",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = "",
      variant = "primary",
      size = "md",
      loading,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
        whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
        className={`
          inline-flex items-center justify-center gap-2 font-medium
          transition-all duration-200 cursor-pointer
          disabled:opacity-50 disabled:cursor-not-allowed
          ${variants[variant]} ${sizes[size]} ${className}
        `}
        disabled={disabled || loading}
        {...(props as React.ComponentProps<typeof motion.button>)}
      >
        {loading && (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        {children}
      </motion.button>
    );
  },
);

Button.displayName = "Button";
export default Button;
