import { NextResponse } from 'next/server';

// Type definition for Bilibili response
interface BilibiliResponse {
  sourceUrl: string;
  quality: number;
  title: string;
  cover: string;
  fallbackUsed?: string | false;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const url = body.url;

    if (!url) {
      return NextResponse.json({ error: 'Bilibili URL is required' }, { status: 400 });
    }

    let finalUrl = url;

    // Resolve b23.tv short links
    if (url.includes('b23.tv')) {
      try {
        const res = await fetch(url, { redirect: 'manual' });
        // The fetch might redirect automatically, but if we set manual, we can read location
        // Actually fetch with manual redirect throws in some environments or returns opaque.
        // Let's just fetch without redirect manual to get the final URL if it redirects.
        const resFollow = await fetch(url);
        finalUrl = resFollow.url;
      } catch (e) {
        console.error('Failed to resolve b23.tv link', e);
      }
    }

    // Extract bvid or avid
    const bvMatch = finalUrl.match(/BV[a-zA-Z0-9]+/);
    const avMatch = finalUrl.match(/av([0-9]+)/i);
    
    let idType = null;
    let idValue = null;
    
    if (bvMatch) {
      idType = 'bvid';
      idValue = bvMatch[0];
    } else if (avMatch) {
      idType = 'aid';
      idValue = avMatch[1];
    }

    let title = 'Bilibili Video';
    let cover = '';
    let cid = null;

    // 1. Official API Fallback
    if (idType && idValue) {
      try {
        // Step 1: Get Video Info (CID, Title, Cover)
        const infoApiUrl = `https://api.bilibili.com/x/web-interface/view?${idType}=${idValue}`;
        const infoRes = await fetch(infoApiUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });
        const infoData = await infoRes.json();
        
        if (infoData.code === 0 && infoData.data) {
          title = infoData.data.title || title;
          cover = infoData.data.pic || cover;
          cid = infoData.data.cid;
          
          // Step 2: Get Play URL
          const sessdata = process.env.SESSDATA;
          const headers: Record<string, string> = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Referer': 'https://www.bilibili.com'
          };
          if (sessdata) {
            headers['Cookie'] = `SESSDATA=${sessdata}`;
          }

          // qn=80 corresponds to 1080P, fnval=1 for mp4 (fnval=0 is flv)
          const playApiUrl = `https://api.bilibili.com/x/player/playurl?cid=${cid}&qn=80&fnval=1&${idType}=${idValue}`;
          const playRes = await fetch(playApiUrl, { headers });
          const playData = await playRes.json();

          if (playData.code === 0 && playData.data && playData.data.durl && playData.data.durl.length > 0) {
            const responseData: BilibiliResponse = {
              sourceUrl: playData.data.durl[0].url,
              quality: playData.data.quality || 80,
              title,
              cover,
              fallbackUsed: 'official'
            };
            return NextResponse.json(responseData);
          }
        }
      } catch (error) {
        console.error('Official API failed:', error);
      }
    }

    // 2. Cobalt API Fallback
    try {
      const cobaltRes = await fetch('https://api.cobalt.tools/api/json', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url: finalUrl })
      });
      
      if (cobaltRes.ok) {
        const cobaltData = await cobaltRes.json();
        if (cobaltData.url) {
          const responseData: BilibiliResponse = {
            sourceUrl: cobaltData.url,
            quality: 80, // Cobalt fetches best quality by default
            title,
            cover,
            fallbackUsed: 'cobalt'
          };
          return NextResponse.json(responseData);
        }
      }
    } catch (error) {
      console.error('Cobalt API failed:', error);
    }

    // 3. injahow API Fallback
    if (idType && idValue) {
      try {
        const paramName = idType === 'aid' ? 'av' : 'bv';
        const injahowUrl = `https://api.injahow.cn/bparse/?${paramName}=${idValue}&q=80&format=mp4`;
        const injahowRes = await fetch(injahowUrl);
        
        if (injahowRes.ok) {
          const injahowData = await injahowRes.json();
          if (injahowData.code === 0 && injahowData.url) {
            const responseData: BilibiliResponse = {
              sourceUrl: injahowData.url,
              quality: injahowData.quality || 80,
              title,
              cover,
              fallbackUsed: 'injahow'
            };
            return NextResponse.json(responseData);
          }
        }
      } catch (error) {
        console.error('injahow API failed:', error);
      }
    }

    // If all fail
    return NextResponse.json(
      { error: 'Failed to parse video from all sources' },
      { status: 500 }
    );
    
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
