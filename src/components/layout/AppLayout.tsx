"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Settings, Download, MonitorPlay, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { isTauri } from "@/lib/env";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const containerClass = "w-full max-w-5xl mx-auto px-6";

  useEffect(() => {
    setMounted(true);
    setIsDesktop(isTauri());
  }, []);

  const navItems = [
    { name: "视频解析", href: "/", icon: Search },
    { name: "下载记录", href: "/downloads", icon: Download },
    { name: "偏好设置", href: "/settings", icon: Settings },
  ];

  if (!mounted) return null;

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-[#0a0a0c] text-slate-900 dark:text-slate-100 transition-colors duration-500 selection:bg-blue-500/30">
      
      {/* 沉浸式全局背景光效 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-15%] right-[-10%] w-[600px] h-[600px] bg-blue-500/10 dark:bg-blue-600/10 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[120px] opacity-70 animate-blob"></div>
        <div className="absolute bottom-[-15%] left-[-10%] w-[600px] h-[600px] bg-purple-500/10 dark:bg-purple-600/10 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[120px] opacity-50 animate-blob" style={{ animationDelay: '3s' }}></div>
      </div>

      {/* 桌面端：可拖拽区域 + 居中悬浮胶囊导航 */}
      {isDesktop && (
        <div
          data-tauri-drag-region
          className="fixed top-0 left-0 right-0 h-16 z-50 flex items-center justify-center select-none"
        >
           <div className="flex items-center gap-1 p-1.5 bg-white/70 dark:bg-[#1a1a1e]/70 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 rounded-full shadow-sm pointer-events-auto">
             {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link key={item.href} href={item.href} className="relative px-5 py-2 rounded-full text-sm font-semibold transition-colors z-10 flex items-center gap-2 group">
                    {isActive && (
                      <motion.div
                        layoutId="desktop-nav-indicator"
                        className="absolute inset-0 bg-white dark:bg-[#2a2a2e] rounded-full shadow-sm border border-slate-200/50 dark:border-white/5"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <item.icon className={`w-4 h-4 relative z-10 transition-colors duration-300 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-900 dark:group-hover:text-white'}`} />
                    <span className={`relative z-10 transition-colors duration-300 ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white'}`}>
                      {item.name}
                    </span>
                  </Link>
                );
             })}
           </div>
        </div>
      )}

      {/* 网页端：极简顶导 (不含侧边栏和底导，保持纯粹) */}
      {!isDesktop && (
        <header className={`${containerClass} flex justify-between items-center py-8 z-40 relative`}>
          <Link href="/" className="flex items-center gap-3 cursor-pointer group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/10 shadow-inner group-hover:scale-105 transition-transform duration-300">
              <MonitorPlay className="w-5 h-5" />
            </div>
            <div className="font-extrabold text-xl tracking-tight">
              VidParse <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">Pro</span>
            </div>
          </Link>
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="w-10 h-10 rounded-full bg-white/50 dark:bg-white/5 backdrop-blur-md border border-slate-200/50 dark:border-white/10 flex items-center justify-center hover:bg-white dark:hover:bg-white/10 transition-all text-slate-700 dark:text-slate-300 shadow-sm active:scale-95"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </header>
      )}
      
      {/* 桌面端主题切换悬浮按钮 (放置于右下角) */}
      {isDesktop && (
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="fixed bottom-8 right-8 w-12 h-12 z-50 rounded-full bg-white/80 dark:bg-[#1a1a1e]/80 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 flex items-center justify-center hover:bg-white dark:hover:bg-[#2a2a2e] transition-all text-slate-700 dark:text-slate-300 shadow-lg active:scale-95 pointer-events-auto group"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun className="w-5 h-5 group-hover:rotate-45 transition-transform duration-500" /> : <Moon className="w-5 h-5 group-hover:-rotate-12 transition-transform duration-500" />}
        </button>
      )}

      {/* 路由内容区 */}
      <main className={`flex-1 flex flex-col relative ${containerClass} ${isDesktop ? "pt-28" : ""} pb-12`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="h-full w-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
