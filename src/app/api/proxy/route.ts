import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get('url');

  if (!url) {
    return new Response('URL is required', { status: 400 });
  }

  try {
    const fetchResponse = await fetch(url, {
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
