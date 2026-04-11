"use client";

import { useState, useEffect } from "react";
import { isTauri, isTauriMobile } from "@/lib/env";
import { Folder, Key, ShieldCheck, Globe, MonitorUp, Server } from "lucide-react";

export default function SettingsPage() {
  const [downloadPath, setDownloadPath] = useState("");
  const [cookieString, setCookieString] = useState("");
  const [cookieBrowser, setCookieBrowser] = useState("none");
  const [maxQuality, setMaxQuality] = useState("80"); // 80: 1080P, 116/120: 4K
  const [apiEndpoint, setApiEndpoint] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setDownloadPath(localStorage.getItem("downloadPath") || "");
    setCookieString(localStorage.getItem("cookieString") || localStorage.getItem("sessdata") || "");
    setCookieBrowser(localStorage.getItem("cookieBrowser") || "none");
    setMaxQuality(localStorage.getItem("maxQuality") || "80");
    setApiEndpoint(localStorage.getItem("apiEndpoint") || "https://vidparse-pro.vercel.app");
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

  const handleCookieStringChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCookieString(val);
    localStorage.setItem("cookieString", val);
  };

  const handleCookieBrowserChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setCookieBrowser(val);
    localStorage.setItem("cookieBrowser", val);
  };

  const handleMaxQualityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setMaxQuality(val);
    localStorage.setItem("maxQuality", val);
  };

  const handleApiEndpointChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setApiEndpoint(val);
    localStorage.setItem("apiEndpoint", val);
  };

  const resetApiEndpoint = () => {
    setApiEndpoint("https://vidparse-pro.vercel.app");
    localStorage.setItem("apiEndpoint", "https://vidparse-pro.vercel.app");
  };

  if (!mounted) return null;

  if (!isTauri()) {
    return (
      <div className="w-full flex flex-col items-center justify-center min-h-[50vh] text-center gap-4">
        <h2 className="text-3xl font-bold">网页端无需配置</h2>
        <p className="text-slate-500 max-w-md">网页端不支持本地下载及画质配置。系统会默认通过云端环境变量 (BILIBILI_COOKIE) 为您提供最佳解析画质 (1080P)。</p>
      </div>
    );
  }

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

        {/* Cookie / SESSDATA Card */}
        <div className="bg-white/70 dark:bg-[#1a1a1e]/70 backdrop-blur-xl p-8 rounded-3xl shadow-sm border border-slate-200/50 dark:border-white/5 relative overflow-hidden group transition-colors">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
            <ShieldCheck className="w-32 h-32" />
          </div>
          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 shadow-inner">
                <Key className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold">Bilibili 身份鉴权 (Cookie)</h3>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium max-w-2xl leading-relaxed">
              配置 Cookie 可突破画质限制，下载 1080P/4K 高码率视频（需本身是大会员）。推荐客户端用户直接使用“提取浏览器”功能。网页端用户可手动填写 Cookie 字符串。
            </p>

            {isTauri() && (
              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Globe className="w-4 h-4" /> 自动提取浏览器 Cookie
                </label>
                <select
                  value={cookieBrowser}
                  onChange={handleCookieBrowserChange}
                  className="w-full bg-white/50 dark:bg-black/20 backdrop-blur-sm border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-purple-500/50 text-slate-700 dark:text-slate-300 font-medium transition-all appearance-none cursor-pointer"
                >
                  <option value="none">不自动提取 (使用下方手动输入)</option>
                  <option value="chrome">Google Chrome</option>
                  <option value="edge">Microsoft Edge</option>
                  <option value="firefox">Mozilla Firefox</option>
                  <option value="safari">Safari</option>
                  <option value="opera">Opera</option>
                  <option value="brave">Brave</option>
                </select>
                <p className="text-xs text-slate-500">选择您平时登录 B站 的浏览器。程序将在下载时自动读取其 Cookie，无需手动配置。</p>
              </div>
            )}

            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                手动输入 Cookie {isTauri() && cookieBrowser !== 'none' && <span className="text-slate-400 font-normal">(当前已被浏览器提取覆盖)</span>}
              </label>
              <input
                type="password"
                value={cookieString}
                onChange={handleCookieStringChange}
                disabled={isTauri() && cookieBrowser !== 'none'}
                placeholder="在此粘贴您的完整 Cookie"
                className="w-full bg-white/50 dark:bg-black/20 backdrop-blur-sm border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-purple-500/50 text-slate-700 dark:text-slate-300 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>
        </div>
        {/* API Endpoint Card */}
        {isTauriMobile() && (
          <div className="bg-white/70 dark:bg-[#1a1a1e]/70 backdrop-blur-xl p-8 rounded-3xl shadow-sm border border-slate-200/50 dark:border-white/5 relative overflow-hidden group transition-colors">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
              <Server className="w-32 h-32" />
            </div>
            <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shadow-inner">
                  <Server className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold">云端解析节点 (API Endpoint)</h3>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                默认使用 Vercel 节点。如果您所在的网络环境无法连接 (Failed to fetch)，您可以绑定自己的域名并填入下方。
              </p>
              <div className="flex gap-3 pt-2">
                <input
                  type="url"
                  value={apiEndpoint}
                  onChange={handleApiEndpointChange}
                  placeholder="https://vidparse-pro.vercel.app"
                  className="flex-1 bg-white/50 dark:bg-black/20 backdrop-blur-sm border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-emerald-500/50 text-slate-700 dark:text-slate-300 font-medium transition-all"
                />
                <button
                  onClick={resetApiEndpoint}
                  className="px-6 py-4 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 rounded-2xl font-bold transition-all duration-300 hover:bg-slate-200 dark:hover:bg-white/10 whitespace-nowrap"
                >
                  恢复默认
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quality Card */}
        <div className="bg-white/70 dark:bg-[#1a1a1e]/70 backdrop-blur-xl p-8 rounded-3xl shadow-sm border border-slate-200/50 dark:border-white/5 relative overflow-hidden group transition-colors">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
            <MonitorUp className="w-32 h-32" />
          </div>
          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-orange-500/10 text-orange-600 dark:text-orange-400 shadow-inner">
                <MonitorUp className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold">最高画质偏好</h3>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
              选择您希望下载的最高画质。如果视频不包含该画质，将自动向下兼容。
            </p>
            <div className="pt-2">
              <select
                value={maxQuality}
                onChange={handleMaxQualityChange}
                className="w-full bg-white/50 dark:bg-black/20 backdrop-blur-sm border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-orange-500/50 text-slate-700 dark:text-slate-300 font-medium transition-all appearance-none cursor-pointer"
              >
                <option value="80">最高 1080P (默认, 大部分用户)</option>
                <option value="116">最高 4K/1080P60 帧 (需要下方鉴权配置为大会员账号)</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
