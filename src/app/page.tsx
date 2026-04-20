"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Search, Download, AlertTriangle, Play, Check, Camera } from "lucide-react";
import { isAndroidShell, isTauri, isTauriMobile } from "@/lib/env";
import { invokeTauriDownload, parseVideoLocal } from "@/lib/downloader";

interface ParsedResult {
  title: string;
  cover?: string;
  downloadUrl: string;
  platform: "bilibili" | "youtube";
  duration?: string;
  parseMethod?: string;
  rawBvid?: string;
  requestId?: string;
  quality?: number;
  requestedQuality?: number;
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ParsedResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [captured, setCaptured] = useState(false);
  const [mounted, setMounted] = useState(false);

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
    setUrl("https://www.bilibili.com/video/BV1HyQ5BgEgo");
  };

  const handleCapture = () => {
    const video = document.getElementById('preview-video') as HTMLVideoElement;
    if (!video) return;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `frame_${new Date().getTime()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setCaptured(true);
        setTimeout(() => setCaptured(false), 2000);
      }
    } catch (err) {
      console.error('Failed to capture frame', err);
      alert('无法截取视频帧，可能是跨域策略限制。');
    }
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

      const bvidMatch = url.match(/BV[a-zA-Z0-9]+/);
      const rawBvid = bvidMatch ? bvidMatch[0] : undefined;

      const platform = isBilibili ? "bilibili" : "youtube";

      if (isTauri() && !isTauriMobile()) {
        // Desktop Windows/macOS App: Self-contained local parsing (NO Vercel dependency)
        const localData = await parseVideoLocal(url, platform);
        setResult(localData as ParsedResult);
      } else {
        // Web or Android App: Uses Vercel / Custom API endpoint
        const useRemoteApi = isTauri() || isAndroidShell();
        const customEndpoint = useRemoteApi
          ? (localStorage.getItem("apiEndpoint") || (isTauri() ? "https://vidparse-pro.vercel.app" : ""))
          : "";

        if (useRemoteApi && !customEndpoint) {
          throw new Error("请先在设置页填写云端解析节点 (API Endpoint)，否则将无法解析。");
        }

        const cleanEndpoint = customEndpoint.replace(/\/$/, "");
        const endpoint = useRemoteApi ? `${cleanEndpoint}/api/parse/${platform}` : `/api/parse/${platform}`;

        const cookieString = useRemoteApi ? (localStorage.getItem("cookieString") || "") : "";
        const requestedQuality = useRemoteApi ? Number.parseInt(localStorage.getItem("maxQuality") || "80", 10) : undefined;

        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url, cookie: cookieString, requestedQuality }),
        }).catch(err => {
          if (err.message.includes('Failed to fetch')) {
            throw new Error("网络连接失败。请检查您的网络，或在设置页配置可用的云端解析节点。");
          }
          throw err;
        });

        const data = await res.json();

        if (!res.ok) {
          const reqIdSuffix = data?.requestId ? ` (requestId: ${data.requestId})` : "";
          throw new Error((data.error || "解析失败，请重试") + reqIdSuffix);
        }

        const rawDownloadUrl = data.sourceUrl || data.url || "";
        const parseMethod = platform === 'bilibili' ? (data.fallbackUsed || "unknown") : (data.source || "unknown");
        
        const proxyPrefix = useRemoteApi ? cleanEndpoint : "";
        const downloadUrl = (platform === 'bilibili' && ['official', 'injahow'].includes(parseMethod)) 
          ? (isTauri() ? rawDownloadUrl : `${proxyPrefix}/api/proxy?url=${encodeURIComponent(rawDownloadUrl)}`)
          : rawDownloadUrl;

        setResult({
          title: data.title || "未知标题",
          cover: data.cover || "",
          downloadUrl,
          platform,
          parseMethod,
          rawBvid,
          requestId: data.requestId,
          quality: data.quality,
          requestedQuality: data.requestedQuality
        });
      }
    } catch (err: any) {
      console.error(err);
      const errMsg = err?.message || (typeof err === 'string' ? err : JSON.stringify(err));
      setError(errMsg || "发生未知错误");
    } finally {
      setLoading(false);
    }
  };

  const handleLocalDownload = async () => {
    const targetUrl = result?.rawBvid || url;
    if (!targetUrl) {
      alert("无法获取下载链接");
      return;
    }
    try {
      await invokeTauriDownload(targetUrl, result!.platform);
    } catch (e: any) {
      alert(e.message || "下载启动失败");
    }
  };

  if (!mounted) {
    return (
      <div className="w-full flex flex-col gap-8">
        <div className="text-left space-y-4 mb-4">
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight drop-shadow-sm">
            全能视频解析
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed font-medium">
            支持 <span className="font-bold text-blue-600 dark:text-blue-400">B站</span> 与 <span className="font-bold text-red-500 dark:text-red-400">YouTube</span>，突破限制提取最高清直链。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-8">
      <div className="text-left space-y-4 mb-4">
        <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight drop-shadow-sm">
          全能视频解析
        </h2>
        <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed font-medium">
          支持 <span className="font-bold text-blue-600 dark:text-blue-400">B站</span> 与 <span className="font-bold text-red-500 dark:text-red-400">YouTube</span>，突破限制提取最高清直链。
        </p>
      </div>

      <div className="relative w-full group z-20">
        <div className="relative flex items-center bg-white/70 dark:bg-[#1a1a1e]/70 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 rounded-[2rem] p-2 shadow-xl hover:shadow-2xl transition-all duration-500 hover:ring-1 hover:ring-blue-500/30 focus-within:ring-2 focus-within:ring-blue-500/50 focus-within:shadow-blue-500/10">
          <div className="pl-6 pr-3 text-slate-400">
            <Search className="w-6 h-6" />
          </div>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="粘贴视频链接 (Bilibili, YouTube...)"
            className="flex-1 bg-transparent border-none outline-none px-2 py-5 text-lg md:text-xl placeholder-slate-400/60 font-medium w-full text-slate-800 dark:text-slate-100"
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            disabled={loading}
          />
          <button
            onClick={() => handleSubmit()}
            disabled={loading || !url.trim()}
            className="px-8 py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-3xl font-bold text-lg transition-all duration-300 shadow-md hover:shadow-xl hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
          >
            {loading ? (
              <Loader2 className="animate-spin w-6 h-6" />
            ) : (
              <span>开始解析</span>
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
            className="w-full bg-red-500/10 backdrop-blur-md border border-red-500/20 text-red-700 dark:text-red-400 px-6 py-4 rounded-2xl flex items-center gap-3 shadow-lg"
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
            className="text-left mt-2"
          >
            <button
              onClick={handleDemoClick}
              className="text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-primary transition-colors flex items-center gap-2 group"
            >
              <Play className="w-4 h-4 group-hover:scale-125 transition-transform" />
              没有链接？试一试示例视频
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {loading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full grid grid-cols-1 md:grid-cols-12 gap-6"
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
            className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            <div className="lg:col-span-8 flex flex-col gap-6">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl ring-1 ring-slate-200 dark:ring-white/10 bg-black/5 backdrop-blur-sm group aspect-video">
                <video
                    id="preview-video"
                    src={result.downloadUrl}
                    poster={result.cover}
                    controls
                    className="w-full h-full object-contain bg-black"
                  >
                  您的浏览器不支持视频播放。
                </video>
                <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black/80 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute top-4 left-6 right-6 flex flex-col gap-3 items-start pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/20 text-white backdrop-blur-md border border-white/20">
                      {result.platform}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-white leading-tight line-clamp-1 drop-shadow-md">
                    {result.title}
                  </h2>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 space-y-6">
              <div className="glass-panel rounded-3xl p-6 shadow-xl flex flex-col h-full">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-primary/10 text-primary">
                    <Download className="w-6 h-6" />
                  </div>
                  获取资源
                </h3>

                <div className="flex-1 space-y-4">
                  {(result.parseMethod || result.requestId || result.quality) && (
                    <div className="glass-panel rounded-2xl p-4">
                      {result.parseMethod && (
                        <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                          解析来源：{result.parseMethod}
                        </div>
                      )}
                      {Number.isFinite(result.requestedQuality) && Number.isFinite(result.quality) && (
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          画质：请求 {result.requestedQuality}，实际 {result.quality}
                        </div>
                      )}
                      {result.requestId && (
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          requestId：{result.requestId}
                        </div>
                      )}
                    </div>
                  )}
                  {isTauri() && !isTauriMobile() ? (
                    <button
                      onClick={handleLocalDownload}
                      className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 rounded-2xl font-bold text-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1"
                    >
                      <Download className="w-5 h-5" />
                      本地落盘下载
                    </button>
                  ) : (
                    <a
                      href={result.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 rounded-2xl font-bold text-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-1"
                    >
                      <Download className="w-5 h-5" />
                      直接下载
                    </a>
                  )}
                  
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
                        <Search className="w-5 h-5 opacity-0 absolute" />
                        复制链接
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleCapture}
                    className="w-full flex items-center justify-center gap-3 px-6 py-4 glass-panel hover:bg-white/40 dark:hover:bg-white/10 rounded-2xl font-bold text-lg transition-all duration-300"
                  >
                    {captured ? (
                      <>
                        <Check className="w-5 h-5 text-emerald-500" />
                        <span className="text-emerald-500">已截取</span>
                      </>
                    ) : (
                      <>
                        <Camera className="w-5 h-5" />
                        视频截帧
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
