import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    let url: string;
    try {
      const body = await req.json();
      url = body.url;
    } catch (e) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    if (!url) {
      return NextResponse.json(
        { error: 'Video URL is required' },
        { status: 400 }
      );
    }

    // Step 1: Try Cobalt API first
    try {
      const cobaltRes = await fetch('https://api.cobalt.tools/api/json', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          vQuality: '720',
          filenamePattern: 'nerdy',
        }),
      });

      if (cobaltRes.ok) {
        const cobaltData = await cobaltRes.json();
        
        if (cobaltData.url) {
          return NextResponse.json({
            title: 'YouTube Video (Cobalt)',
            url: cobaltData.url,
            source: 'cobalt',
          });
        }
      } else {
        console.warn(`Cobalt API failed with status: ${cobaltRes.status}`);
      }
    } catch (cobaltError) {
      console.warn('Cobalt API request failed:', cobaltError);
      // Continue to fallback
    }

    // Step 2: Fallback to /api/yt (Python yt-dlp serverless function)
    console.log('Falling back to /api/yt...');
    
    // Determine the base URL dynamically from the request
    const urlObj = new URL(req.url);
    const baseUrl = `${urlObj.protocol}//${urlObj.host}`;
      
    const ytRes = await fetch(`${baseUrl}/api/yt?url=${encodeURIComponent(url)}`);
    
    if (!ytRes.ok) {
      let errorMsg = 'Failed to parse video';
      try {
        const errorData = await ytRes.json();
        errorMsg = errorData.error || errorMsg;
      } catch (e) {
        errorMsg = await ytRes.text() || errorMsg;
      }
      return NextResponse.json({ error: errorMsg }, { status: ytRes.status });
    }

    const ytData = await ytRes.json();
    return NextResponse.json(ytData);
    
  } catch (error: any) {
    console.error('YouTube parse route error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
