
import yt_dlp
import json

def extract_info(url):
    ydl_opts = {
        'quiet': True,
        'skip_download': True,
        'no_warnings': True,
        'extract_flat': False
    }
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            
            formats = []
            if 'formats' in info:
                for f in info['formats']:
                    if f.get('url'):
                        formats.append({
                            'format_id': f.get('format_id', ''),
                            'ext': f.get('ext', ''),
                            'resolution': f.get('resolution', 'audio only' if f.get('vcodec') == 'none' else 'unknown'),
                            'filesize': f.get('filesize', 0),
                            'url': f.get('url', '')
                        })
            
            result = {
                'title': info.get('title', 'Unknown Title'),
                'duration': info.get('duration', 0),
                'thumbnail': info.get('thumbnail', ''),
                'formats': formats
            }
            return json.dumps({'success': True, 'data': result})
    except Exception as e:
        return json.dumps({'success': False, 'error': str(e)})
