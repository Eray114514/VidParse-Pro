"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Link2, Download, AlertCircle, Video, Check } from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

interface ParsedResult {
  title: string;
  cover?: string;
  downloadUrl: string;
  platform: "bilibili" | "youtube";
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ParsedResult | null>(null);
  const [copied, setCopied] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // 简单的正则判断平台
      const isBilibili = /bilibili\.com|b23\.tv/.test(url);
      const isYoutube = /youtube\.com|youtu\.be/.test(url);

      if (!isBilibili && !isYoutube) {
        throw new Error("目前仅支持 Bilibili 和 YouTube 链接。");
      }

      const platform = isBilibili ? "bilibili" : "youtube";
      const endpoint = `/api/parse/${platform}`;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "解析失败，请重试");
      }

      // 统一返回数据格式
      setResult({
        title: data.title || "未知标题",
        cover: data.cover || "",
        downloadUrl: data.sourceUrl || data.url || "",
        platform,
      });
    } catch (err: any) {
      setError(err.message || "发生未知错误");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 flex flex-col items-center py-20 px-4 font-sans selection:bg-primary/30">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl flex flex-col items-center"
      >
        <div className="mb-10 text-center">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-2xl mb-4">
            <Video className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-3">
            Universal Video Downloader
          </h1>
          <p className="text-lg text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
            快速解析并下载 Bilibili 和 YouTube 视频。只需粘贴链接即可开始。
          </p>
        </div>

        <Card className="w-full shadow-lg border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">解析视频</CardTitle>
            <CardDescription>
              支持 b23.tv, bilibili.com, youtube.com, youtu.be
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-5 h-5" />
                <Input
                  type="url"
                  placeholder="https://www.bilibili.com/video/BV..."
                  className="pl-10 h-12 text-base bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 focus-visible:ring-primary"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
              <Button 
                type="submit" 
                size="lg" 
                className="h-12 px-8 font-medium transition-all"
                disabled={loading || !url.trim()}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    解析中
                  </>
                ) : (
                  "开始解析"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              key="error"
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="w-full mt-6"
            >
              <Alert variant="destructive" className="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900">
                <AlertCircle className="h-5 w-5" />
                <AlertTitle className="text-base font-semibold">解析失败</AlertTitle>
                <AlertDescription className="text-sm mt-1 text-red-600 dark:text-red-400">
                  {error}
                </AlertDescription>
              </Alert>
            </motion.div>
          )}

          {loading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full mt-8 flex flex-col gap-4"
            >
              <Skeleton className="h-[200px] w-full rounded-xl bg-zinc-200 dark:bg-zinc-800" />
              <div className="space-y-3">
                <Skeleton className="h-6 w-3/4 bg-zinc-200 dark:bg-zinc-800" />
                <Skeleton className="h-4 w-1/2 bg-zinc-200 dark:bg-zinc-800" />
              </div>
            </motion.div>
          )}

          {result && !loading && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 100, damping: 15 }}
              className="w-full mt-8"
            >
              <Card className="overflow-hidden border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-md">
                {result.cover && (
                  <div className="relative w-full aspect-video bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
                    <img
                      src={result.cover}
                      alt={result.title}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-3 left-3 px-2 py-1 bg-black/60 backdrop-blur-md rounded-md text-xs font-medium text-white uppercase tracking-wider">
                      {result.platform}
                    </div>
                  </div>
                )}
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold line-clamp-2 mb-4 leading-snug">
                    {result.title}
                  </h3>
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    <a 
                      href={result.downloadUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={buttonVariants({ className: "flex-1 h-11 text-base font-medium transition-all" })}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      下载视频
                    </a>
                    <Button 
                      variant="outline" 
                      onClick={handleCopy}
                      className="flex-1 h-11 border-zinc-200 dark:border-zinc-800 text-base font-medium"
                    >
                      {copied ? (
                        <>
                          <Check className="mr-2 h-4 w-4 text-green-500" />
                          已复制
                        </>
                      ) : (
                        <>
                          <Link2 className="mr-2 h-4 w-4" />
                          复制链接
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
