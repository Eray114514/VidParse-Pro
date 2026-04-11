<h1 align="center">VidParse Pro 🚀</h1>

<p align="center">
  <strong>一款全能的视频解析与下载工具（支持 Bilibili 和 YouTube），兼具云端部署与桌面原生双引擎。</strong>
</p>

<p align="center">
  <a href="#特性-features">特性</a> •
  <a href="#快速开始-getting-started">快速开始</a> •
  <a href="#双端架构-architecture">双端架构</a> •
  <a href="#开发指南-development">开发指南</a>
</p>

---

## 🌟 特性 (Features)

- 🔗 **多平台支持**：突破限制，无缝解析并提取 Bilibili 与 YouTube 的最高清直链。
- 🖥️ **全平台双形态**：
  - **Web 端**：可一键托管于 Vercel，提供免安装的网页端服务（API 直链/代理中转）。
  - **桌面端 (Windows)**：基于 Tauri 引擎构建的现代化本地应用，自带 `yt-dlp` 和 `ffmpeg` 核心，完全不消耗 Vercel 流量。
- ⚙️ **专业级配置**：桌面端专属设置面板，支持自定义**本地下载目录**与注入 Bilibili `SESSDATA`（解锁 1080P/4K 高码率大会员画质）。
- 🎨 **现代化 UI**：采用 Next.js 14 App Router + Tailwind CSS + Framer Motion，精心打磨的响应式玻璃拟物风格（支持深浅色模式）。
- ⚡ **智能回退 (Fallback)**：B 站解析内置多级容错（官方接口 -> Cobalt API -> injahow API），确保最高成功率。

## 📦 快速开始 (Getting Started)

### 选项 1：下载桌面客户端 (推荐)
前往 [Releases 页面](https://github.com/Eray114514/VidParse-Pro/releases) 下载最新的 `.exe` 安装包。
安装后双击运行即可，**无需预装任何环境**（程序已内置音视频混流所需的 ffmpeg）。

### 选项 2：Vercel 一键部署 (Web 端)
点击下方按钮将项目一键克隆并部署到您的 Vercel 账号下：

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FEray114514%2FVidParse-Pro)

*(注意：Web 端中转下载会消耗 Vercel 的免费带宽)*

## 🏗️ 双端架构 (Architecture)

本项目采用 **“UI 层全量共享，逻辑层依赖倒置”** 的混合架构：
- **前端核心**：Next.js (React) 构建统一的组件树与路由（如 Sidebar、Settings 等）。
- **运行环境嗅探**：通过 `isTauri()` 动态识别当前处于浏览器沙箱还是桌面 WebView 中。
- **差异化能力**：
  - 在 Vercel 中，调用 `/api/parse/*` 路由并配合 Vercel Edge/Serverless Functions 输出文件。
  - 在 Tauri 桌面端中，Next.js 导出为纯静态文件（SSG），前端组件调用 Rust Sidecar 进程（唤起底层的 `yt-dlp.exe` 和 `ffmpeg.exe`），将视频真实落盘保存至用户电脑。

## 🛠️ 开发指南 (Development)

如果您想对项目进行二次开发或自己编译桌面端，请参考以下步骤：

### 环境准备
- Node.js 20+
- [Rust 编译器](https://www.rust-lang.org/tools/install) (用于构建 Tauri)
- Windows 开发者需安装 C++ Build Tools

### 安装与运行
1. 克隆仓库并安装前端依赖：
   ```bash
   git clone https://github.com/Eray114514/VidParse-Pro.git
   cd VidParse-Pro
   npm install
   ```

2. 运行 Web 端本地服务 (http://localhost:3000)：
   ```bash
   npm run dev
   ```

3. 运行 Tauri 桌面端调试环境：
   ```bash
   # 如果是首次运行 Tauri，请确保在 src-tauri/binaries/ 下放置了对应平台的 yt-dlp 和 ffmpeg 可执行文件。
   # (或参考 .github/workflows/release.yml 中的下载脚本自动获取)
   npm run tauri dev
   ```

### 自动构建与发布
项目已配置 GitHub Actions，只需在 Git 中打上 `v*` 的 Tag（如 `v1.0.0`），云端流水线将自动拉取最新的 ffmpeg 和 yt-dlp 依赖，编译生成 Windows 版本的 Tauri `.exe` 文件并发布到 Releases 页面。
