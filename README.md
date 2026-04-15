<h1 align="center">VidParse Pro 🚀</h1>

<p align="center">
  <strong>一款全能的视频解析与下载工具（支持 Bilibili 和 YouTube），兼具云端部署与多端原生双引擎。</strong>
</p>

<p align="center">
  <a href="#特性-features">特性</a> •
  <a href="#三端架构-architecture">三端架构</a> •
  <a href="#快速开始-getting-started">快速开始</a> •
  <a href="#开发指南-development">开发指南</a>
</p>

---

## 🌟 特性 (Features)

- 🔗 **多平台支持**：突破限制，无缝解析并提取 Bilibili 与 YouTube 的最高清直链。
- 🖥️ **全平台三端形态**：
  - **桌面端 (Windows)**：基于 Tauri 2.0 引擎构建的现代化本地应用，内置 `yt-dlp` 和 `ffmpeg` 核心，支持直接本地落盘，完全不消耗服务器流量。
  - **移动端 (Android)**：由 Tauri 2.0 驱动的安卓原生应用，接入云端 API，提供轻量便捷的移动端下载体验。
  - **Web 端**：可一键托管于 Vercel，提供免安装的网页端服务（API 直链/代理中转/Python Serverless），适合作为个人专属解析站。
- ⚙️ **专业级配置**：专属设置面板，支持自定义**本地下载目录**、注入 Bilibili `SESSDATA`（解锁 1080P/4K 高码率大会员画质）及自定义云端 API 节点。
- 🎨 **现代化 UI**：采用 Next.js App Router + Tailwind CSS v4 + shadcn/ui + Framer Motion，精心打磨的响应式玻璃拟物风格，支持深浅色模式无缝切换。
- ⚡ **智能回退 (Fallback)**：
  - **B 站解析**：内置多级容错（官方接口 -> Cobalt API -> injahow API），确保最高成功率。
  - **YouTube 解析**：优先尝试 Cobalt，失败后无缝回退至自建 Python Serverless API 节点。
- 🛠️ **实用工具**：支持视频在线预览、一键截取视频帧、一键复制下载直链。
- 🔄 **自动更新**：桌面端内置基于 Tauri Updater 的静默/提示自动更新机制，始终保持最新版本。

## 🏗️ 三端架构 (Architecture)

本项目采用 **“UI 层全量共享，逻辑层动态适配”** 的混合架构：
- **前端核心**：Next.js (React 19) 构建统一的组件树与路由。
- **运行环境嗅探**：通过 `isTauri()` 与 `isTauriMobile()` 动态识别当前处于 Web 浏览器、Windows 桌面端还是 Android 移动端。
- **差异化能力**：
  - **Vercel / Web**：调用 `/api/parse/*` 路由并配合 Vercel Edge/Serverless Functions 输出直链。
  - **Windows 桌面端**：前端组件调用 Rust Sidecar 进程（唤起底层的 `yt-dlp.exe` 和 `ffmpeg.exe`），将视频原画质混流并落盘至用户电脑。
  - **Android 移动端**：复用 Web 端 API 能力获取下载直链并交由系统处理下载。

## 📦 快速开始 (Getting Started)

### 选项 1：下载客户端 (Windows / Android)
前往 [Releases 页面](https://github.com/Eray114514/VidParse-Pro/releases) 下载最新的 `.exe` 安装包或 `.apk` 文件。
- **Windows**：安装后双击运行即可，**无需预装任何环境**（程序已内置音视频混流所需的 ffmpeg）。
- **Android**：下载 APK 安装包并允许安装未知来源应用即可。

### 选项 2：Vercel 一键部署 (Web 端)
点击下方按钮将项目一键克隆并部署到您的 Vercel 账号下：

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FEray114514%2FVidParse-Pro)

*(注意：Web 端中转下载及 Python Serverless 可能会消耗 Vercel 的免费带宽与运行时间)*

### Web 端环境变量 (可选，但推荐)
Web 端部署后，B 站解析即使不配置 Cookie 也能工作，但会自动降级到可用画质（通常 720P 或更低）。如果你希望在 Web/安卓端解锁更高清晰度，请在部署平台配置以下环境变量之一（无需同时配置）：

- `BILIBILI_COOKIE`：完整 Cookie 字符串（推荐）
- `SESSDATA`：仅填 SESSDATA 值（程序会自动拼成 `SESSDATA=...`）

注意：不要把自己的 Cookie 直接粘贴到公共网页里，也不要在 Issue 里公开 Cookie。

### B 站画质说明（一定要看）
- 没有 Cookie：大部分视频可解析，但会被 B 站限制最高画质，接口会自动返回降级后的 `quality`。
- 有 Cookie 且账号具备权限（例如大会员/视频本身有该清晰度）：可解锁 1080P/4K 等更高画质。
- 解析链路自带多级回退：官方接口 → Cobalt → injahow。即使官方接口被风控/网络不通，仍会自动切换备用方案提高成功率。

### 反馈解析失败时需要提供什么
为了能快速定位问题，请在反馈时至少提供：

- 你使用的链接（BV/av/b23 均可）
- 页面右侧显示的 `requestId`
- “解析来源 / 画质”信息（如果成功但画质不符合预期）
- 你是在 Web / Windows / Android 哪个端使用
- 是否配置了 Cookie（只需回答“配置/未配置”，不要贴 Cookie 内容）

## 🛠️ 开发指南 (Development)

如果您想对项目进行二次开发或自己编译桌面/移动端，请参考以下步骤：

### 环境准备
- Node.js 20+
- [Rust 编译器](https://www.rust-lang.org/tools/install) (用于构建 Tauri)
- Windows 开发者需安装 C++ Build Tools
- Android 开发者需配置 Android Studio 及 NDK

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

### 自动构建与发布 (CI/CD)
项目已配置 GitHub Actions 工作流，只需在 Git 中打上 `v*` 的 Tag（例如 `v1.2.0`），云端流水线将自动执行：
1. 拉取最新的 ffmpeg 和 yt-dlp 依赖。
2. 注入版本号并编译生成 Windows 版本的 Tauri `.exe` 文件。
3. 编译生成 Android 版本的 `.apk` 文件。
4. 自动创建 Release 并上传构建产物。
