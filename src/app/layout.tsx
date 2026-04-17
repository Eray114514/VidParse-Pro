import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import AppLayout from "@/components/layout/AppLayout";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "VidParse Pro",
  description: "Universal Video Parsing & Download Tool",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh" suppressHydrationWarning>
      <head>
        {/* WebView 版本拦截器：如果版本过低，阻断 React 渲染并提示用户去 Play 商店更新 */}
        <script dangerouslySetInnerHTML={{
          __html: `
            (function() {
              try {
                var match = navigator.userAgent.match(/Chrome\\/([0-9]+)/i);
                var version = match ? parseInt(match[1], 10) : 0;
                var isAndroid = /Android/i.test(navigator.userAgent);
                
                // Chrome 90 是一个合理的分水岭，兼容现代 CSS (Tailwind v4) 和 JS 特性
                if (isAndroid && version > 0 && version < 90) {
                  window.__WEBVIEW_TOO_OLD__ = true;
                  document.write('<div style="position:fixed;top:0;left:0;width:100%;height:100%;background:#0f172a;color:white;z-index:999999;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;text-align:center;font-family:sans-serif;box-sizing:border-box;">' +
                    '<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>' +
                    '<h2 style="margin-top:24px;font-size:24px;margin-bottom:0;">系统内核过旧</h2>' +
                    '<p style="margin-top:16px;color:#94a3b8;line-height:1.6;font-size:16px;">当前内核版本：Chrome ' + version + '<br/>运行本应用需要 Chrome 90 或更高版本。</p>' +
                    '<div style="background:#1e293b;border-radius:12px;padding:16px;margin-top:20px;width:100%;max-width:320px;">' +
                      '<p style="margin:0;color:#cbd5e1;line-height:1.5;font-size:14px;"><strong>为什么会这样？</strong><br/>虽然您安装了新版浏览器，但安卓系统默认仍在使用极旧的“系统 WebView”组件来渲染 App，导致应用无法正常运行。</p>' +
                    '</div>' +
                    '<a href="market://details?id=com.google.android.webview" style="margin-top:32px;background:#3b82f6;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;box-shadow:0 4px 14px rgba(59,130,246,0.3);">前往应用商店更新 WebView</a>' +
                    '<p style="margin-top:32px;font-size:13px;color:#64748b;line-height:1.6;">或者在手机的<br/><strong>[开发者选项] -> [WebView 实现]</strong><br/>中，将其切换为您已安装的最新版 Chrome。</p>' +
                  '</div>');
                  window.stop(); // 立即停止解析后续的 HTML 和 React JS，防止产生报错
                }
              } catch (e) {}
            })();
          `
        }} />
      </head>
      <body className={`${inter.className} min-h-screen selection:bg-primary/30 antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
        >
          <AppLayout>{children}</AppLayout>
        </ThemeProvider>
      </body>
    </html>
  );
}
