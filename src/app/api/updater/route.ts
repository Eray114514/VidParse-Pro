import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const version = searchParams.get('version');
    const target = searchParams.get('target');
    const arch = searchParams.get('arch');

    // Fetch the latest release from GitHub API
    const res = await fetch('https://api.github.com/repos/Eray114514/VidParse-Pro/releases/latest', {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'VidParse-Pro-Updater',
      },
      // Cache for 5 minutes
      next: { revalidate: 300 }
    });

    if (!res.ok) {
      return new NextResponse('Failed to fetch latest release', { status: 500 });
    }

    const data = await res.json();
    const latestVersion = data.tag_name.replace(/^v/, ''); // e.g. "1.1.2"
    
    if (version === latestVersion) {
      // Return 204 No Content if already up-to-date (Tauri behavior)
      return new NextResponse(null, { status: 204 });
    }

    // Find the Windows setup exe and sig
    const assets = data.assets || [];
    let exeAsset = assets.find((a: any) => a.name.endsWith('setup.exe') && a.name.includes('x64'));
    if (!exeAsset) {
      exeAsset = assets.find((a: any) => a.name.endsWith('.exe'));
    }
    
    let sigAsset = assets.find((a: any) => a.name === (exeAsset?.name + '.sig'));
    
    if (!exeAsset || !sigAsset) {
      return new NextResponse('Release assets not ready', { status: 404 });
    }

    // Fetch signature content
    const sigRes = await fetch(sigAsset.browser_download_url);
    if (!sigRes.ok) {
      return new NextResponse('Failed to fetch signature', { status: 500 });
    }
    const signature = await sigRes.text();

    // Use ghproxy.net to accelerate download in China
    const proxyUrl = `https://ghproxy.net/${exeAsset.browser_download_url}`;

    // Return the updater JSON response
    return NextResponse.json({
      version: latestVersion,
      notes: data.body || 'New version available.',
      pub_date: data.published_at,
      platforms: {
        'windows-x86_64': {
          signature,
          url: proxyUrl
        }
      }
    });

  } catch (error) {
    console.error('Updater error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
