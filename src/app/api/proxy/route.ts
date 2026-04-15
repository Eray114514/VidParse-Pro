export const runtime = 'edge';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get('url');

  if (!url) {
    return new Response('URL is required', { status: 400 });
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return new Response('Invalid URL', { status: 400 });
  }

  if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
    return new Response('Invalid URL protocol', { status: 400 });
  }

  const host = parsedUrl.hostname.toLowerCase();
  const allowedHostSuffixes = ['bilibili.com', 'bilivideo.com', 'hdslb.com', 'biliapi.net', 'akamaized.net'];
  const hostAllowed = allowedHostSuffixes.some((suffix) => host === suffix || host.endsWith(`.${suffix}`));
  if (!hostAllowed) {
    return new Response('URL host not allowed', { status: 400 });
  }

  try {
    const fetchResponse = await fetch(parsedUrl.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Referer': 'https://www.bilibili.com'
      }
    });

    if (!fetchResponse.ok) {
      return new Response(`Proxy failed: ${fetchResponse.statusText}`, { status: fetchResponse.status });
    }

    const headers = new Headers(fetchResponse.headers);
    headers.set('Content-Type', fetchResponse.headers.get('Content-Type') || 'video/mp4');
    headers.set('Content-Disposition', 'attachment; filename="bilibili_video.mp4"');
    headers.set('Access-Control-Allow-Origin', '*');

    return new Response(fetchResponse.body, {
      status: 200,
      headers
    });
  } catch (error: any) {
    return new Response(error.message, { status: 500 });
  }
}
