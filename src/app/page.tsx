"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Search, Download, AlertTriangle, Play, Moon, Sun, Check, Video } from "lucide-react";
import { useTheme } from "next-themes";

interface ParsedResult {
  title: string;
  cover?: string;
  downloadUrl: string;
  platform: "bilibili" | "youtube";
  duration?: string;
  parseMethod?: string;
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ParsedResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => setMounted(true), []);

  const handleCopy = async () => {
    if (result?.downloadUrl) {
      try {
        await navigator.clipboard.writeText(result.downloadUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy", err);
      }
    }
  };

  const handleDemoClick = () => {
    setUrl("https://www.bilibili.com/video/BV1GJ411x7h7");
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const isBilibili = /bilibili\.com|b23\.tv/.test(url);
      const isYoutube = /youtube\.com|youtu\.be/.test(url);

      if (!isBilibili && !isYoutube) {
        throw new Error("目前仅支持 Bilibili 和 YouTube 链接。");
      }

      const platform = isBilibili ? "bilibili" : "youtube";
      const endpoint = `/api/parse/${platform}`;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "解析失败，请重试");
      }

      const rawDownloadUrl = data.sourceUrl || data.url || "";
      const parseMethod = platform === 'bilibili' ? (data.fallbackUsed || "unknown") : (data.source || "unknown");
      
      // Bilibili CDNs require Referer. If it's official or injahow, the URL points to Bilibili CDNs,
      // so we proxy it through our Next.js API to add the Referer and bypass 403.
      const downloadUrl = (platform === 'bilibili' && ['official', 'injahow'].includes(parseMethod)) 
        ? `/api/proxy?url=${encodeURIComponent(rawDownloadUrl)}`
        : rawDownloadUrl;

      setResult({
        title: data.title || "未知标题",
        cover: data.cover || "",
        downloadUrl,
        platform,
        parseMethod,
      });
    } catch (err: any) {
      setError(err.message || "发生未知错误");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="relative min-h-screen overflow-hidden font-sans text-slate-900 dark:text-white transition-colors duration-500">
      {/* Decorative Background Blobs */}
      <div className="fixed inset-0 overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-500/20 dark:bg-purple-600/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[100px] opacity-70 animate-blob"></div>
        <div className="absolute top-[20%] right-[-10%] w-[400px] h-[400px] bg-blue-500/20 dark:bg-blue-600/20 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[100px] opacity-70 animate-blob" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-[-20%] left-[20%] w-[600px] h-[600px] bg-emerald-500/10 dark:bg-emerald-500/10 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[100px] opacity-50 animate-blob" style={{ animationDelay: '4s' }}></div>
      </div>

      <div className="relative z-10 p-4 sm:p-8 flex flex-col items-center max-w-7xl mx-auto min-h-screen">
        {/* Header */}
        <header className="w-full flex justify-between items-center mb-16 lg:mb-24">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4 cursor-default"
          >
            <div className="relative w-12 h-12 glass-panel rounded-2xl flex items-center justify-center text-primary shadow-lg">
              <Play className="w-6 h-6 fill-current" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">VidParse Pro</h1>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-widest uppercase">
                Universal Video Tool
              </p>
            </div>
          </motion.div>
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="w-12 h-12 rounded-full glass-panel flex items-center justify-center hover:bg-white/40 dark:hover:bg-white/10 transition-all text-slate-700 dark:text-slate-300 shadow-lg active:scale-95"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </motion.button>
        </header>

        {/* Hero / Input Section */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-3xl flex flex-col gap-8 mb-8"
        >
          <div className="text-center space-y-6 mb-4">
            <h2 className="text-5xl md:text-7xl font-extrabold tracking-tight drop-shadow-sm">
              全能视频解析
            </h2>
            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed font-medium">
              支持 <span className="font-bold text-blue-600 dark:text-blue-400">B站</span> 与 <span className="font-bold text-red-500 dark:text-red-400">YouTube</span>，突破限制提取最高清直链。无需客户端，粘贴即下。
            </p>
          </div>

          <div className="relative mx-auto w-full group z-20">
            <div className="relative flex items-center glass-panel rounded-3xl p-2 shadow-2xl transition-all duration-500 hover:ring-2 hover:ring-primary/30 focus-within:ring-2 focus-within:ring-primary/50 focus-within:shadow-primary/10">
              <div className="pl-5 pr-3 text-slate-400">
                <Search className="w-6 h-6" />
              </div>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="粘贴视频链接 (Bilibili, YouTube...)"
                className="flex-1 bg-transparent border-none outline-none px-2 py-5 text-lg md:text-xl placeholder-slate-400/80 font-medium w-full"
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                disabled={loading}
              />
              <button
                onClick={() => handleSubmit()}
                disabled={loading || !url.trim()}
                className="px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-bold text-lg transition-all duration-300 shadow-xl hover:shadow-2xl hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
              >
                {loading ? (
                  <Loader2 className="animate-spin w-6 h-6" />
                ) : (
                  <span>解析</span>
                )}
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="mx-auto bg-red-500/10 backdrop-blur-md border border-red-500/20 text-red-700 dark:text-red-400 px-6 py-4 rounded-2xl flex items-center gap-3 shadow-lg"
              >
                <AlertTriangle className="w-6 h-6 shrink-0" />
                <span className="font-medium text-sm md:text-base">{error}</span>
              </motion.div>
            )}

            {!result && !loading && !error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center"
              >
                <button
                  onClick={handleDemoClick}
                  className="text-sm md:text-base font-semibold text-slate-500 dark:text-slate-400 hover:text-primary transition-colors flex items-center justify-center gap-2 mx-auto group"
                >
                  <Play className="w-4 h-4 group-hover:scale-125 transition-transform" />
                  没有链接？试一试示例视频
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Results Section */}
        <AnimatePresence mode="wait">
          {loading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-4xl mt-4 grid grid-cols-1 md:grid-cols-12 gap-6"
            >
              <div className="md:col-span-8 h-[300px] rounded-3xl glass-panel animate-pulse bg-slate-200/50 dark:bg-slate-800/50" />
              <div className="md:col-span-4 h-[300px] rounded-3xl glass-panel animate-pulse bg-slate-200/50 dark:bg-slate-800/50" />
            </motion.div>
          )}

          {result && !loading && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 40, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
              className="w-full max-w-5xl mt-4 grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              {/* Left: Info & Preview */}
              <div className="lg:col-span-8 flex flex-col gap-6">
                <div className="relative rounded-3xl overflow-hidden shadow-2xl ring-1 ring-slate-200 dark:ring-white/10 bg-black/5 backdrop-blur-sm group aspect-video">
                  {result.cover ? (
                    <img
                      src={result.cover}
                      alt={result.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-800">
                      <Video className="w-16 h-16 text-slate-300 dark:text-slate-600" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none"></div>
                  <div className="absolute bottom-6 left-6 right-6 flex flex-col gap-3 items-start">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/20 text-white backdrop-blur-md border border-white/20">
                        {result.platform}
                      </span>
                      {result.parseMethod && (
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-primary/20 text-white backdrop-blur-md border border-primary/20">
                          解析: {result.parseMethod}
                        </span>
                      )}
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight line-clamp-2 drop-shadow-md">
                      {result.title}
                    </h2>
                  </div>
                </div>
              </div>

              {/* Right: Actions */}
              <div className="lg:col-span-4 space-y-6">
                <div className="glass-panel rounded-3xl p-6 shadow-xl flex flex-col h-full">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-primary/10 text-primary">
                      <Download className="w-6 h-6" />
                    </div>
                    获取资源
                  </h3>

                  <div className="flex-1 space-y-4">
                    <a
                      href={result.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 rounded-2xl font-bold text-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1"
                    >
                      <Download className="w-5 h-5" />
                      直接下载
                    </a>
                    
                    <button
                      onClick={handleCopy}
                      className="w-full flex items-center justify-center gap-3 px-6 py-4 glass-panel hover:bg-white/40 dark:hover:bg-white/10 rounded-2xl font-bold text-lg transition-all duration-300"
                    >
                      {copied ? (
                        <>
                          <Check className="w-5 h-5 text-emerald-500" />
                          <span className="text-emerald-500">已复制</span>
                        </>
                      ) : (
                        <>
                          <Search className="w-5 h-5 opacity-0 absolute" /> {/* spacer */}
                          复制链接
                        </>
                      )}
                    </button>
                  </div>

                  <div className="mt-8 pt-6 border-t border-slate-200/50 dark:border-white/10">
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                      <strong className="text-slate-700 dark:text-slate-300">提示：</strong><br/>
                      如果点击下载直接在浏览器播放，可以右键视频选择「视频另存为...」，或者使用复制的链接在下载软件中下载。
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <footer className="mt-auto pt-20 pb-8 text-center text-sm font-semibold tracking-wider text-slate-400 dark:text-slate-500">
          <p>© {new Date().getFullYear()} VidParse Pro · Crafted with Premium UI</p>
        </footer>
      </div>
    </div>
  );
}
