"use client";

import { useState, useEffect } from "react";
import { isTauri } from "@/lib/env";
import { Folder, Key, ShieldCheck } from "lucide-react";

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
    <div className="w-full flex flex-col gap-8 pb-12 animate-in fade-in duration-500">
      <div className="text-left space-y-4 mb-4">
        <h2 className="text-4xl font-extrabold tracking-tight drop-shadow-sm">
          偏好设置
        </h2>
        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed font-medium">
          配置您的本地下载偏好与账号信息，定制专属体验。
        </p>
      </div>

      <div className="grid gap-6">
        {/* Download Directory Card */}
        <div className="bg-white/70 dark:bg-[#1a1a1e]/70 backdrop-blur-xl p-8 rounded-3xl shadow-sm border border-slate-200/50 dark:border-white/5 relative overflow-hidden group transition-colors">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
            <Folder className="w-32 h-32" />
          </div>
          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 shadow-inner">
                <Folder className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold">本地下载目录</h3>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
              视频默认将保存至系统下载文件夹。您可以自定义保存位置（仅客户端生效）。
            </p>
            <div className="flex gap-3 pt-2">
              <input
                type="text"
                readOnly
                value={downloadPath}
                placeholder="未设置 (默认保存到下载文件夹)"
                className="flex-1 bg-white/50 dark:bg-black/20 backdrop-blur-sm border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-4 outline-none text-slate-700 dark:text-slate-300 font-medium transition-all"
              />
              <button
                onClick={handleSelectDir}
                disabled={!isTauri()}
                className="px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-bold transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none whitespace-nowrap"
              >
                选择目录
              </button>
            </div>
          </div>
        </div>

        {/* SESSDATA Card */}
        <div className="bg-white/70 dark:bg-[#1a1a1e]/70 backdrop-blur-xl p-8 rounded-3xl shadow-sm border border-slate-200/50 dark:border-white/5 relative overflow-hidden group transition-colors">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
            <ShieldCheck className="w-32 h-32" />
          </div>
          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 shadow-inner">
                <Key className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold">Bilibili 身份令牌 (SESSDATA)</h3>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium max-w-2xl leading-relaxed">
              配置您的 SESSDATA 可在客户端突破画质限制，下载 1080P 高码率甚至 4K 视频（需要您本身是大会员）。网页端将继续使用服务器端环境变量。
            </p>
            <div className="pt-2">
              <input
                type="password"
                value={sessdata}
                onChange={handleSessdataChange}
                placeholder="粘贴您的 SESSDATA"
                className="w-full bg-white/50 dark:bg-black/20 backdrop-blur-sm border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-purple-500/50 text-slate-700 dark:text-slate-300 font-medium transition-all"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
