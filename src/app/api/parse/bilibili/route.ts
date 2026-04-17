import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

// Type definition for Bilibili response
interface BilibiliResponse {
  sourceUrl: string;
  requestId: string;
  requestedQuality: number;
  quality: number;
  title: string;
  cover: string;
  fallbackUsed?: string | false;
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const url = body.url;
    const userCookie = body.cookie;
    const requestedQualityRaw = body.requestedQuality;

    const requestId = randomUUID();

    const requestedQualityFromBody =
      typeof requestedQualityRaw === 'number'
        ? requestedQualityRaw
        : typeof requestedQualityRaw === 'string'
          ? Number.parseInt(requestedQualityRaw, 10)
          : undefined;

    const requestedQualityFromBodyNumber =
      typeof requestedQualityFromBody === 'number' && Number.isFinite(requestedQualityFromBody) ? requestedQualityFromBody : undefined;

    const requestedQualityForFallback = requestedQualityFromBodyNumber ?? 80;

    if (!url) {
      return NextResponse.json({ error: 'Bilibili URL is required', requestId }, { status: 400 });
    }

    let finalUrl = url;

    // Resolve b23.tv short links
    if (url.includes('b23.tv')) {
      try {
        const resFollow = await fetch(url, {
          redirect: 'follow',
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Referer': 'https://www.bilibili.com',
          },
        });
        finalUrl = resFollow.url || finalUrl;
      } catch (e) {
        console.error('[bilibili-parse]', { requestId, step: 'resolve_b23', error: String(e) });
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

    let bestDowngradedResponse: BilibiliResponse | null = null;
    const attempts: Array<Record<string, any>> = [];

    // 1. Official API Fallback
    if (idType && idValue) {
      try {
        // Prepare headers with optional cookie
        const envCookie = process.env.BILIBILI_COOKIE || process.env.SESSDATA;
        const apiHeaders: Record<string, string> = {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Referer': 'https://www.bilibili.com'
        };
        
        const cookieProvided = Boolean(userCookie || envCookie);

        if (userCookie) {
          apiHeaders['Cookie'] = userCookie.includes('=') ? userCookie : `SESSDATA=${userCookie}`;
        } else if (envCookie) {
          apiHeaders['Cookie'] = envCookie.includes('=') ? envCookie : `SESSDATA=${envCookie}`;
        }

        const requestedQuality = requestedQualityFromBodyNumber ?? (cookieProvided ? 80 : 64);

        const qnOrder = [120, 116, 80, 64, 32, 16];
        const qnCandidates = Array.from(
          new Set([requestedQuality, ...qnOrder.filter((q) => q <= requestedQuality)].filter((v) => Number.isFinite(v) && v > 0))
        );

        // Step 1: Get Video Info (CID, Title, Cover)
        const infoApiUrl = `https://api.bilibili.com/x/web-interface/view?${idType}=${idValue}`;
        const infoRes = await fetch(infoApiUrl, {
          headers: apiHeaders
        });
        const infoData = await infoRes.json();
        
        if (infoData.code === 0 && infoData.data) {
          title = infoData.data.title || title;
          cover = infoData.data.pic || cover;
          cid = infoData.data.cid;

          for (const qn of qnCandidates) {
            const playApiUrl = `https://api.bilibili.com/x/player/playurl?cid=${cid}&qn=${qn}&fnval=1&${idType}=${idValue}`;
            const playRes = await fetch(playApiUrl, { headers: apiHeaders });
            const playData = await playRes.json();

            if (
              playData.code === 0 &&
              playData.data &&
              playData.data.durl &&
              Array.isArray(playData.data.durl) &&
              playData.data.durl.length > 0 &&
              playData.data.durl[0]?.url
            ) {
              const actualQuality = playData.data.quality || qn;
              const acceptQuality = playData.data.accept_quality || [];

              const responseData: BilibiliResponse = {
                sourceUrl: playData.data.durl[0].url,
                requestId,
                requestedQuality: qn,
                quality: actualQuality,
                title,
                cover,
                fallbackUsed: 'official'
              };

              if (actualQuality < qn && acceptQuality.includes(qn)) {
                if (!bestDowngradedResponse) {
                  bestDowngradedResponse = responseData;
                }
                attempts.push({
                  requestId,
                  source: 'official',
                  stage: 'playurl',
                  ok: false,
                  qn,
                  code: playData.code,
                  message: `Downgraded to ${actualQuality}, trying fallbacks`,
                  quality: actualQuality,
                  cookieProvided
                });
                break; // Break the qn loop, go to Cobalt fallback
              }

              return NextResponse.json(responseData);
            }

            attempts.push({
              requestId,
              source: 'official',
              stage: 'playurl',
              ok: false,
              qn,
              code: playData?.code,
              message: playData?.message,
              quality: playData?.data?.quality,
              durlLength: Array.isArray(playData?.data?.durl) ? playData.data.durl.length : undefined,
              cookieProvided
            });
          }
        } else {
          attempts.push({
            requestId,
            source: 'official',
            stage: 'view',
            ok: false,
            code: infoData?.code,
            message: infoData?.message,
            cookieProvided
          });
        }
      } catch (error) {
        attempts.push({ requestId, source: 'official', ok: false, error: String(error) });
        console.error('[bilibili-parse]', { requestId, step: 'official', error: String(error) });
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
            requestId,
            requestedQuality: requestedQualityForFallback,
            quality: 80, // Cobalt fetches best quality by default
            title,
            cover,
            fallbackUsed: 'cobalt'
          };
          return NextResponse.json(responseData);
        }
        attempts.push({ requestId, source: 'cobalt', ok: false, reason: 'no_url' });
      } else {
        attempts.push({ requestId, source: 'cobalt', ok: false, status: cobaltRes.status, statusText: cobaltRes.statusText });
      }
    } catch (error) {
      attempts.push({ requestId, source: 'cobalt', ok: false, error: String(error) });
      console.error('[bilibili-parse]', { requestId, step: 'cobalt', error: String(error) });
    }

    // 3. injahow API Fallback
    if (idType && idValue) {
      try {
        const paramName = idType === 'aid' ? 'av' : 'bv';
        const injahowUrl = `https://api.injahow.cn/bparse/?${paramName}=${idValue}&q=${requestedQualityForFallback}&format=mp4`;
        const injahowRes = await fetch(injahowUrl);
        
        if (injahowRes.ok) {
          const injahowData = await injahowRes.json();
          if (injahowData.code === 0 && injahowData.url) {
            const responseData: BilibiliResponse = {
              sourceUrl: injahowData.url,
              requestId,
              requestedQuality: requestedQualityForFallback,
              quality: injahowData.quality || 80,
              title,
              cover,
              fallbackUsed: 'injahow'
            };
            return NextResponse.json(responseData);
          }
          attempts.push({
            requestId,
            source: 'injahow',
            ok: false,
            code: injahowData?.code,
            message: injahowData?.msg || injahowData?.message
          });
        } else {
          attempts.push({ requestId, source: 'injahow', ok: false, status: injahowRes.status, statusText: injahowRes.statusText });
        }
      } catch (error) {
        attempts.push({ requestId, source: 'injahow', ok: false, error: String(error) });
        console.error('[bilibili-parse]', { requestId, step: 'injahow', error: String(error) });
      }
    }

    // If all fail
    if (bestDowngradedResponse) {
      console.log('[bilibili-parse]', { requestId, step: 'all_fallbacks_failed_using_downgraded' });
      return NextResponse.json(bestDowngradedResponse);
    }

    console.error('[bilibili-parse]', { requestId, step: 'all_failed', finalUrl, attempts });
    return NextResponse.json(
      {
        error: 'Failed to parse video from all sources',
        requestId,
        attempts
      },
      { status: 500 }
    );
    
  } catch (error: any) {
    const requestId = randomUUID();
    return NextResponse.json({ error: error.message, requestId }, { status: 500 });
  }
}
