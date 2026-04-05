from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import json
import yt_dlp

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self._handle_request()

    def do_POST(self):
        self._handle_request()

    def _handle_request(self):
        url = None
        if self.command == 'POST':
            content_length = int(self.headers.get('Content-Length', 0))
            if content_length > 0:
                post_data = self.rfile.read(content_length)
                try:
                    data = json.loads(post_data)
                    url = data.get('url')
                except json.JSONDecodeError:
                    pass
        else:
            parsed_path = urlparse(self.path)
            params = parse_qs(parsed_path.query)
            url = params.get('url', [''])[0]

        if not url:
            self._send_response(400, {'error': 'URL is required'})
            return

        # Configure yt-dlp to get 720p or best available up to 720p
        # Prefer pre-merged formats (video+audio) since serverless environment might not have ffmpeg
        ydl_opts = {
            'format': 'best[height<=720]/best',
            'quiet': True,
            'no_warnings': True,
            'simulate': True,
            'skip_download': True
        }

        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=False)
                
                response_data = {
                    'title': info.get('title'),
                    'thumbnail': info.get('thumbnail'),
                    'duration': info.get('duration'),
                    'url': info.get('url'),
                    'ext': info.get('ext'),
                    'source': 'yt-dlp'
                }
                
                # Check if we got a list of formats (sometimes 'url' isn't at top level)
                if not response_data['url'] and 'formats' in info:
                    # Find best format that has both video and audio
                    formats = [f for f in info['formats'] if f.get('vcodec') != 'none' and f.get('acodec') != 'none' and f.get('height', 0) <= 720]
                    if formats:
                        best_format = sorted(formats, key=lambda x: x.get('height', 0), reverse=True)[0]
                        response_data['url'] = best_format.get('url')
                        response_data['ext'] = best_format.get('ext')
                
                self._send_response(200, response_data)
        except Exception as e:
            self._send_response(500, {'error': str(e)})

    def _send_response(self, status_code, data):
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        # Allow CORS
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
