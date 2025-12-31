import { ParsedVideoData } from "../types";

// Proxies
const PROXY_RAW = "https://api.allorigins.win/raw?url=";
const PROXY_JSON = "https://api.allorigins.win/get?url=";

// Third-party Parser API
const PARSER_API = "https://api.injahow.cn/bparse/";

export const parseVideoInput = async (input: string): Promise<ParsedVideoData> => {
  let url = input.trim();
  let bvid = '';
  let avid = '';

  // 1. Resolve b23.tv short links
  if (url.includes('b23.tv')) {
    try {
      // Cache buster
      const resolveUrl = `${PROXY_JSON}${encodeURIComponent(url)}&t=${Date.now()}`;
      const response = await fetch(resolveUrl);
      const data = await response.json();
      if (data.status?.url) {
        url = data.status.url;
      } else if (data.contents) {
         const match = data.contents.match(/(BV[a-zA-Z0-9]{10})/);
         if (match) bvid = match[1];
      }
    } catch (e) {
      console.warn("Failed to resolve b23.tv link", e);
    }
  }

  // 2. Extract IDs (BV, AV)
  const bvMatch = url.match(/(BV[a-zA-Z0-9]{10})/);
  const avMatch = url.match(/(?:av)([0-9]+)/);
  
  if (bvMatch) bvid = bvMatch[1];
  else if (avMatch) avid = avMatch[1];

  if (bvid || avid) {
    // A. Fetch Metadata (Title, Cover)
    let metaData: any = {};
    try {
      const idParam = bvid ? `bvid=${bvid}` : `aid=${avid}`;
      const metaUrl = `https://api.bilibili.com/x/web-interface/view?${idParam}`;
      const res = await fetch(`${PROXY_RAW}${encodeURIComponent(metaUrl)}&t=${Date.now()}`);
      const json = await res.json();
      if (json.code === 0) {
        metaData = json.data;
      }
    } catch (e) {
      console.warn("Metadata fetch failed", e);
    }

    // B. Fetch Direct Stream URL via Injahow API
    // IMPORTANT: Add cache buster (t=...) to avoid 403 or cached failures from proxy
    let directUrl = '';
    let parseError = false;

    try {
        const idParam = bvid ? `bv=${bvid}` : `av=${avid}`;
        const parseUrl = `${PARSER_API}?${idParam}&p=1&q=80&format=mp4&otype=json`;
        
        // Proxy request with timestamp
        const proxyUrl = `${PROXY_RAW}${encodeURIComponent(parseUrl)}&t=${Date.now()}`;
        const res = await fetch(proxyUrl);
        
        // Sometimes proxy returns text that needs parsing
        const text = await res.text();
        let json;
        try {
            json = JSON.parse(text);
        } catch {
            console.error("Failed to parse parser JSON", text);
        }

        if (json && json.code === 0 && json.url) {
            directUrl = json.url;
        } else {
            console.warn("Parser API returned error or empty URL:", json);
            parseError = true;
        }
    } catch (e) {
        console.warn("Direct link parsing network error", e);
        parseError = true;
    }

    const title = metaData.title || `Bilibili 视频 (${bvid || avid})`;
    const cover = metaData.pic || '';
    const desc = metaData.desc || '';
    const duration = metaData.duration ? formatDuration(metaData.duration) : '';

    // C. Construct Response
    // Priority: Native MP4. 
    // If Native failed, only return Iframe IF we absolutely have no other choice, 
    // but ideally we should prompt user to retry if they hate Iframes.
    // However, for stability, we keep iframe as fallback but log the failure.
    
    if (directUrl) {
        return {
            id: bvid || avid,
            title: title,
            platform: 'bilibili',
            playerType: 'native',
            thumbnailUrl: cover,
            duration: duration,
            description: desc,
            sources: [
                { 
                    url: directUrl, 
                    format: 'MP4 (Direct)', 
                    quality: 'High (q=80)', 
                    size: 'Unknown', 
                    isDownloadable: true 
                }
            ]
        };
    } else if (parseError) {
        // Fallback but with explicit "Retry" or different handling could go here.
        // For now, we still fall back to iframe but since we added timestamp, directUrl should work more often.
         console.log("Falling back to iframe due to parser error.");
    }

    // Fallback: Return Iframe
    return {
        id: bvid || avid,
        title: title,
        platform: 'bilibili',
        playerType: 'iframe',
        thumbnailUrl: cover,
        duration: duration,
        description: desc,
        sources: [
            { 
                url: `//player.bilibili.com/player.html?${bvid ? `bvid=${bvid}` : `aid=${avid}`}&high_quality=1&danmaku=0`, 
                format: 'Embed', 
                quality: 'Auto', 
                size: 'N/A', 
                isDownloadable: false 
            }
        ]
    };
  }

  // 3. YouTube Parsing
  const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const ytMatch = url.match(ytRegex);
  
  if (ytMatch) {
    const videoId = ytMatch[1];
    return {
      id: videoId,
      title: 'YouTube 视频',
      platform: 'youtube',
      playerType: 'iframe',
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      sources: [
        { url: `https://www.youtube.com/embed/${videoId}`, format: 'Embed', quality: 'Auto', size: 'N/A', isDownloadable: false },
        { url: `https://youtu.be/${videoId}`, format: 'Source', quality: 'Original', size: 'External', isDownloadable: true }
      ]
    };
  }

  // 4. Direct File URL
  const isDirect = url.match(/\.(mp4|webm|ogg|mov)$/i);
  if (isDirect) {
    const fileName = url.split('/').pop() || '未命名视频';
    return {
      id: 'direct_file',
      title: decodeURIComponent(fileName),
      platform: 'direct',
      playerType: 'native',
      sources: [
        { url: url, format: 'Original', quality: 'Source', size: 'Unknown', isDownloadable: true }
      ]
    };
  }

  throw new Error("Format not supported");
};

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}
