import "../polyfills";
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
        {/* 注入现代 JS 特性 Polyfill 以兼容 Android 8 / Chrome 61 */}
        <script src="https://cdnjs.cloudflare.com/ajax/libs/core-js-bundle/3.38.1/minified.js"></script>
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