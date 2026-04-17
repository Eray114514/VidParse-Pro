import { isTauri, isTauriMobile } from "./env";

export async function parseVideoLocal(targetUrl: string, platform: "bilibili" | "youtube") {
  const { Command } = await import("@tauri-apps/plugin-shell");
  const cookieBrowser = localStorage.getItem("cookieBrowser") || "none";
  const cookieString = localStorage.getItem("cookieString") || localStorage.getItem("sessdata");

  let finalUrl = targetUrl;
  if (platform === "bilibili" && targetUrl.startsWith("BV")) {
    finalUrl = `https://www.bilibili.com/video/${targetUrl}`;
  }

  const args = [
    '--dump-json',
    '--no-warnings',
    finalUrl
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
  let output;
  try {
    output = await command.execute();
  } catch (err: any) {
    throw new Error("执行 yt-dlp 失败: " + (err.message || JSON.stringify(err) || err));
  }

  if (output.code !== 0) {
    throw new Error("本地引擎解析失败: " + output.stderr);
  }

  const data = JSON.parse(output.stdout);

  let playableUrl = data.url;
  if (!playableUrl && data.formats) {
    // Find best format with both video and audio for preview
    const formats = data.formats.filter((f: any) => f.vcodec !== 'none' && f.acodec !== 'none');
    if (formats.length > 0) {
      playableUrl = formats[formats.length - 1].url;
    }
  }

  return {
    title: data.title || "未知标题",
    cover: data.thumbnail || "",
    downloadUrl: playableUrl || finalUrl,
    platform,
    parseMethod: "yt-dlp (本地离线引擎)",
    rawBvid: targetUrl
  };
}

export async function invokeTauriDownload(targetUrl: string, platform: "bilibili" | "youtube") {
  if (!isTauri()) {
    throw new Error("请在客户端中使用本地下载。");
  }

  if (isTauriMobile()) {
    throw new Error("安卓端暂不支持调用本地 yt-dlp 引擎，请直接点击“直接下载”通过云端解析保存。");
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
  const maxQuality = localStorage.getItem("maxQuality") || "80";
  
  let finalUrl = targetUrl;
  if (platform === "bilibili" && targetUrl.startsWith("BV")) {
    finalUrl = `https://www.bilibili.com/video/${targetUrl}`;
  }

  let formatStr = 'bestvideo+bestaudio/best';
  if (platform === "bilibili") {
    // 80 corresponds to 1080p, 116 corresponds to 1080p60/4k
    if (maxQuality === "80") {
      formatStr = 'bestvideo[height<=1080]+bestaudio/best';
    }
  }

  try {
    const ffmpegPath = await resolveResource("binaries/ffmpeg.exe");
    
    const args = [
      finalUrl,
      '-f', formatStr,
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
    const errMsg = error?.message || (typeof error === 'string' ? error : JSON.stringify(error));
    throw new Error("下载启动失败，可能是缺少核心组件或权限: " + errMsg);
  }
}
