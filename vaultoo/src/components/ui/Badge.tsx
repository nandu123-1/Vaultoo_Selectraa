"use client";

interface BadgeProps {
  variant?: "default" | "success" | "warning" | "danger" | "info";
  children: React.ReactNode;
  className?: string;
  pulse?: boolean;
}

const variantStyles = {
  default: "bg-slate-500/20 text-slate-300 border-slate-500/30",
  success: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  warning: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  danger: "bg-red-500/20 text-red-400 border-red-500/30",
  info: "bg-violet-500/20 text-violet-400 border-violet-500/30",
};

export default function Badge({
  variant = "default",
  children,
  className = "",
  pulse = false,
}: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium
        rounded-full border ${variantStyles[variant]} ${className}
      `}
    >
      {pulse && (
        <span className="relative flex h-2 w-2">
          <span
            className={`
              animate-ping absolute inline-flex h-full w-full rounded-full opacity-75
              ${variant === "success" ? "bg-emerald-400" : ""}
              ${variant === "danger" ? "bg-red-400" : ""}
              ${variant === "warning" ? "bg-amber-400" : ""}
              ${variant === "info" ? "bg-violet-400" : ""}
              ${variant === "default" ? "bg-slate-400" : ""}
            `}
          />
          <span
            className={`
              relative inline-flex rounded-full h-2 w-2
              ${variant === "success" ? "bg-emerald-500" : ""}
              ${variant === "danger" ? "bg-red-500" : ""}
              ${variant === "warning" ? "bg-amber-500" : ""}
              ${variant === "info" ? "bg-violet-500" : ""}
              ${variant === "default" ? "bg-slate-500" : ""}
            `}
          />
        </span>
      )}
      {children}
    </span>
  );
}
