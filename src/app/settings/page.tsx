"use client";

import { useState, useEffect } from "react";
import { isTauri } from "@/lib/env";

export default function SettingsPage() {
  const [downloadPath, setDownloadPath] = useState("");
  const [sessdata, setSessdata] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setDownloadPath(localStorage.getItem("downloadPath") || "");
    setSessdata(localStorage.getItem("sessdata") || "");
  }, []);

  const handleSelectDir = async () => {
    if (!isTauri()) {
      alert("网页版无法配置本地目录。");
      return;
    }
    try {
      const { open } = await import("@tauri-apps/plugin-dialog");
      const selected = await open({
        directory: true,
        multiple: false,
      });
      if (selected && typeof selected === 'string') {
        setDownloadPath(selected);
        localStorage.setItem("downloadPath", selected);
      }
    } catch (e: any) {
      alert("选择目录失败: " + e.message);
    }
  };

  const handleSessdataChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSessdata(val);
    localStorage.setItem("sessdata", val);
  };

  if (!mounted) return null;

  return (
    <div className="max-w-3xl mx-auto w-full space-y-8">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">系统设置</h2>
        <p className="text-slate-500 dark:text-slate-400">配置您的本地下载偏好与账号信息。</p>
      </div>

      <div className="glass-panel p-6 rounded-3xl space-y-8 shadow-sm">
        {/* 下载目录设置 */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
            本地下载目录 (仅客户端)
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              readOnly
              value={downloadPath}
              placeholder="未设置 (默认将保存到下载文件夹)"
              className="flex-1 bg-slate-100 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 outline-none text-slate-600 dark:text-slate-300"
            />
            <button
              onClick={handleSelectDir}
              disabled={!isTauri()}
              className="px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              选择目录
            </button>
          </div>
        </div>

        {/* SESSDATA 设置 */}
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
            Bilibili SESSDATA (仅客户端)
          </label>
          <p className="text-xs text-slate-500 mb-2">
            配置您的 SESSDATA 可在客户端突破画质限制，下载 1080P 高码率甚至 4K 视频（需要您本身是大会员）。网页端将继续使用服务器配置。
          </p>
          <input
            type="password"
            value={sessdata}
            onChange={handleSessdataChange}
            placeholder="粘贴您的 SESSDATA"
            className="w-full bg-slate-100 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      </div>
    </div>
  );
}
