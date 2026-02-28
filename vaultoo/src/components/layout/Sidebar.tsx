"use client";

import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  MonitorUp,
  Inbox,
  Activity,
  Settings,
  Shield,
  LogOut,
  ChevronLeft,
  KeyRound,
  Crown,
  User,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";

const ownerItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Active Sessions", href: "/dashboard/sessions", icon: MonitorUp },
  { label: "Incoming Requests", href: "/dashboard/requests", icon: Inbox },
  { label: "Activity Log", href: "/dashboard/activity", icon: Activity },
];

const userItems = [
  {
    label: "Request Access",
    href: "/dashboard/request-access",
    icon: KeyRound,
  },
  { label: "My Sessions", href: "/dashboard/my-sessions", icon: MonitorUp },
];

const commonItems = [
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

function SectionLabel({
  label,
  icon: Icon,
  collapsed,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  collapsed: boolean;
}) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 mb-1">
      <Icon className="w-3.5 h-3.5 text-slate-500 shrink-0" />
      <AnimatePresence>
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-[10px] font-bold uppercase tracking-widest text-slate-500"
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}

function NavButton({
  item,
  isActive,
  collapsed,
  onClick,
}: {
  item: NavItem;
  isActive: boolean;
  collapsed: boolean;
  onClick: () => void;
}) {
  const Icon = item.icon;
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ x: 2 }}
      className={`
        w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
        transition-all duration-200 cursor-pointer
        ${
          isActive
            ? "bg-violet-500/15 text-violet-400 border border-violet-500/20"
            : "text-slate-400 hover:text-white hover:bg-white/5"
        }
      `}
    >
      <Icon className="w-5 h-5 shrink-0" />
      <AnimatePresence>
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="whitespace-nowrap"
          >
            {item.label}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function Sidebar({
  mobileOpen = false,
  onMobileClose,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  // Close mobile sidebar on route change
  useEffect(() => {
    onMobileClose?.();
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const handleNav = (href: string) => {
    router.push(href);
    onMobileClose?.();
  };

  return (
    <>
      {/* Mobile backdrop */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onMobileClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 72 : 260 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className={`
          fixed left-0 top-0 h-screen z-50 flex flex-col
          bg-black/40 backdrop-blur-2xl border-r border-white/5
          transition-transform duration-300 ease-in-out
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="text-lg font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent"
                >
                  Vaultoo
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          {/* Mobile close button */}
          <button
            onClick={onMobileClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {/* Owner Section */}
          <SectionLabel label="Owner" icon={Crown} collapsed={collapsed} />
          {ownerItems.map((item) => (
            <NavButton
              key={item.href}
              item={item}
              isActive={pathname === item.href}
              collapsed={collapsed}
              onClick={() => handleNav(item.href)}
            />
          ))}

          {/* Divider */}
          <div className="my-3 border-t border-white/5" />

          {/* User Section */}
          <SectionLabel label="User" icon={User} collapsed={collapsed} />
          {userItems.map((item) => (
            <NavButton
              key={item.href}
              item={item}
              isActive={pathname === item.href}
              collapsed={collapsed}
              onClick={() => handleNav(item.href)}
            />
          ))}

          {/* Divider */}
          <div className="my-3 border-t border-white/5" />

          {/* Common */}
          {commonItems.map((item) => (
            <NavButton
              key={item.href}
              item={item}
              isActive={pathname === item.href}
              collapsed={collapsed}
              onClick={() => handleNav(item.href)}
            />
          ))}
        </nav>

        {/* Footer */}
        <div className="px-3 pb-4 space-y-1">
          <motion.button
            onClick={handleLogout}
            whileHover={{ x: 2 }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
            text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 cursor-pointer"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  Logout
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>

          <motion.button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center p-2 rounded-xl
            text-slate-500 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <motion.div animate={{ rotate: collapsed ? 180 : 0 }}>
              <ChevronLeft className="w-5 h-5" />
            </motion.div>
          </motion.button>
        </div>
      </motion.aside>
    </>
  );
}
