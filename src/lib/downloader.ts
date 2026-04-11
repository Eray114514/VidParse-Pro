import { isTauri } from "./env";

export async function invokeTauriDownload(targetUrl: string, platform: "bilibili" | "youtube") {
  if (!isTauri()) {
    throw new Error("请在客户端中使用本地下载。");
  }

  const { Command } = await import("@tauri-apps/plugin-shell");
  const { resolveResource } = await import("@tauri-apps/api/path");
  const { downloadDir } = await import("@tauri-apps/api/path");
  
  let targetDir = localStorage.getItem("downloadPath");
  if (!targetDir) {
    targetDir = await downloadDir();
  }

  const cookieBrowser = localStorage.getItem("cookieBrowser") || "none";
  const cookieString = localStorage.getItem("cookieString") || localStorage.getItem("sessdata");
  
  let finalUrl = targetUrl;
  if (platform === "bilibili" && targetUrl.startsWith("BV")) {
    finalUrl = `https://www.bilibili.com/video/${targetUrl}`;
  }

  try {
    const ffmpegPath = await resolveResource("binaries/ffmpeg.exe");
    
    const args = [
      finalUrl,
      '-f', 'bestvideo+bestaudio/best',
      '--ffmpeg-location', ffmpegPath,
      '--merge-output-format', 'mp4',
      '-o', `${targetDir}/%(title)s.%(ext)s`,
      '--newline'
    ];

    if (platform === "bilibili") {
      if (cookieBrowser !== "none") {
        args.push('--cookies-from-browser', cookieBrowser);
      } else if (cookieString) {
        const headerValue = cookieString.includes('=') ? cookieString : `SESSDATA=${cookieString}`;
        args.push('--add-header', `Cookie: ${headerValue}`);
      }
    }

    const command = Command.sidecar("binaries/yt-dlp", args);

    command.on('close', data => {
      console.log(`yt-dlp finished with code ${data.code} and signal ${data.signal}`);
      if (data.code === 0) {
        alert("下载完成！已保存至: " + targetDir);
      } else {
        alert("下载发生错误，请查看控制台日志。");
      }
    });

    command.on('error', error => {
      console.error(`yt-dlp error: "${error}"`);
      alert("下载进程出错: " + error);
    });

    command.stdout.on('data', line => {
      console.log(`yt-dlp stdout: "${line}"`);
    });

    command.stderr.on('data', line => {
      console.log(`yt-dlp stderr: "${line}"`);
    });

    await command.spawn();
    alert("已开始在后台下载，请留意控制台或等待完成通知...");

  } catch (error: any) {
    console.error("Failed to spawn sidecar", error);
    throw new Error("下载启动失败，可能是缺少核心组件或权限: " + error.message);
  }
}
