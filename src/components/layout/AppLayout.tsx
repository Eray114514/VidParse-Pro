"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Search, Settings, Download, MonitorPlay, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { isTauri } from "@/lib/env";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsDesktop(isTauri());
  }, []);

  const navItems = [
    { name: "视频解析", href: "/", icon: Search },
    { name: "下载管理", href: "/downloads", icon: Download },
    { name: "系统设置", href: "/settings", icon: Settings },
  ];

  if (!mounted) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-[#09090b] text-slate-900 dark:text-white">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-200 dark:border-white/10 bg-white/50 dark:bg-black/20 backdrop-blur-xl flex flex-col pt-4 pb-6">
        {/* Logo */}
        <div className="px-6 mb-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <MonitorPlay className="w-5 h-5" />
          </div>
          <div className="font-bold text-xl tracking-tight">VidParse Pro</div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-4 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "bg-primary text-white shadow-md shadow-primary/20"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Theme Toggle */}
        <div className="px-8 mt-auto flex items-center justify-between text-sm text-slate-500">
          <span>深色模式</span>
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Tauri Titlebar Drag Area */}
        {isDesktop && (
          <div
            className="absolute top-0 left-0 right-0 h-10 z-50 flex items-center justify-end px-4"
            style={{ WebkitAppRegion: "drag" } as any}
          >
            {/* Window controls (optional, if you want custom ones instead of native) */}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-8 relative z-10 pt-16">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
