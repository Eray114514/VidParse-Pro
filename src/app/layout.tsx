import PolyfillClient from "@/components/PolyfillClient";
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
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // 修复 Chrome 61 缺失的 globalThis (最常见的 React 19/Next 15 白屏元凶)
              if (typeof window !== 'undefined') {
                if (typeof window.globalThis === 'undefined') {
                  Object.defineProperty(Object.prototype, '__magic__', {
                    get: function() { return this; },
                    configurable: true
                  });
                  __magic__.globalThis = __magic__;
                  delete Object.prototype.__magic__;
                }
                
                // 修复 queueMicrotask
                if (typeof window.queueMicrotask !== "function") {
                  window.queueMicrotask = function (callback) {
                    Promise.resolve()
                      .then(callback)
                      .catch(function(e) { setTimeout(function() { throw e; }); });
                  };
                }

                // 修复 structuredClone
                if (typeof window.structuredClone !== "function") {
                  window.structuredClone = function(obj) {
                    return JSON.parse(JSON.stringify(obj));
                  };
                }
              }
            `,
          }}
        />
        {/* 本地引入 Polyfill 以确保无网络或无法请求外部 CDN 的情况下 Android WebView 也能加载 */}
        <script src="/js/core-js-bundle.js"></script>
        <script src="/js/resize-observer.js"></script>
      </head>
      <body className={`${inter.className} min-h-screen selection:bg-primary/30 antialiased`}>
        <PolyfillClient />
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