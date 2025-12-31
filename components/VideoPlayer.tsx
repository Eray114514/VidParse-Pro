import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Icons } from '../constants';

interface VideoPlayerProps {
  url: string;
  poster?: string;
  playerType: 'native' | 'iframe';
  className?: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ url, poster, playerType, className }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Playback State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  
  // Download/Buffering State
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [useDirectStream, setUseDirectStream] = useState(false); // Fallback mode
  
  // Screenshot State
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  // 1. Handle URL Changes & Download Logic
  useEffect(() => {
    // Reset states
    setIsPlaying(false);
    setCurrentTime(0);
    setDownloadProgress(0);
    setCapturedImage(null);
    setUseDirectStream(false);
    
    // Revoke old blob to free memory
    if (blobUrl) {
      URL.revokeObjectURL(blobUrl);
      setBlobUrl(null);
    }

    if (playerType === 'iframe') return;

    // Start Download
    const controller = new AbortController();
    let isAborted = false;

    const fetchVideo = async () => {
      setIsDownloading(true);
      try {
        // Add timestamp to prevent caching issues with proxy
        const fetchUrl = url.includes('?') ? `${url}&t=${Date.now()}` : `${url}?t=${Date.now()}`;
        
        const response = await fetch(fetchUrl, {
            signal: controller.signal,
            referrerPolicy: "no-referrer" // Crucial for Bilibili
        });

        if (!response.ok) throw new Error("Network response was not ok");
        if (!response.body) throw new Error("No body");

        const contentLength = response.headers.get('content-length');
        const total = contentLength ? parseInt(contentLength, 10) : 0;
        let loaded = 0;

        const reader = response.body.getReader();
        const chunks = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          if (value) {
            chunks.push(value);
            loaded += value.length;
            if (total > 0) {
              setDownloadProgress(Math.min((loaded / total) * 100, 99)); // Cap at 99 until done
            }
          }
        }

        const blob = new Blob(chunks, { type: 'video/mp4' }); // Assume MP4 for simplicity
        const objectUrl = URL.createObjectURL(blob);
        
        if (!isAborted) {
            setBlobUrl(objectUrl);
            setDownloadProgress(100);
            setIsDownloading(false);
        }
      } catch (err: any) {
        if (err.name === 'AbortError') {
             console.log("Download cancelled");
        } else {
            console.warn("Blob download failed (likely CORS), falling back to direct stream:", err);
            // Auto fallback to direct stream
            if (!isAborted) {
                setUseDirectStream(true);
                setIsDownloading(false);
            }
        }
      }
    };

    fetchVideo();

    return () => {
      isAborted = true;
      controller.abort();
    };
  }, [url, playerType]);

  // 2. Playback Controls
  const togglePlay = useCallback((e?: React.MouseEvent) => {
    if (playerType === 'iframe') return;
    
    // If event is passed, check if we need to stop it
    if (e) {
       // Prevent toggling if clicking on controls inside the container
       const target = e.target as HTMLElement;
       if (target.closest('button') || target.closest('input')) {
           return;
       }
    }

    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying, playerType]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const skipDownload = () => {
      setUseDirectStream(true);
      setIsDownloading(false);
  };

  // 3. New Screenshot Strategy (Native Canvas)
  const captureFrame = useCallback((e: React.MouseEvent) => {
    // CRITICAL: Stop propagation to prevent video from toggling play/pause
    e.stopPropagation();
    e.preventDefault();

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video && canvas) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            try {
                ctx.drawImage(video, 0, 0);
                // This will fail if video is from remote source (Direct Stream) without CORS headers
                const dataUrl = canvas.toDataURL('image/png');
                
                setCapturedImage(dataUrl);
                
                // Pause if not already paused (optional, based on preference, but user paused manually usually)
                if (!video.paused) {
                    video.pause();
                    setIsPlaying(false);
                }

                // Smooth scroll to preview
                setTimeout(() => {
                    document.getElementById('capture-preview')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);

            } catch (err) {
                console.error("Screenshot failed:", err);
                alert("无法截取当前画面。\n\n原因：正在使用【流媒体直连模式】播放，且源视频服务器未返回跨域许可(CORS)。\n\n建议：等待视频【完全缓存/下载】后再尝试截取。");
            }
        }
    }
  }, []);

  const downloadCapturedImage = () => {
    if (!capturedImage) return;
    const link = document.createElement('a');
    link.href = capturedImage;
    link.download = `vidparse_frame_${Math.floor(currentTime)}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // Determine active source
  // If Blob is ready, use it. If DirectStream fallback active, use raw URL.
  // If still downloading, we don't show the video source yet (or we could show loading).
  const activeSrc = blobUrl || (useDirectStream ? url : undefined);
  const showLoadingOverlay = isDownloading && !blobUrl && !useDirectStream;

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
        <div 
          className="relative group bg-black rounded-xl overflow-hidden shadow-2xl aspect-video bg-gray-900"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          onClick={togglePlay} // Play/Pause on container click
        >
          {/* 1. Iframe Player */}
          {playerType === 'iframe' && (
              <div className="w-full h-full">
                <iframe 
                  src={url} 
                  className="w-full h-full border-0" 
                  allowFullScreen 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  referrerPolicy="no-referrer"
                />
              </div>
          )}

          {/* 2. Native Player */}
          {playerType === 'native' && (
             <>
                {activeSrc && (
                    <video
                        ref={videoRef}
                        src={activeSrc}
                        poster={poster}
                        className="w-full h-full object-contain"
                        // Important: No-referrer for direct link streaming
                        referrerPolicy="no-referrer" 
                        onTimeUpdate={handleTimeUpdate}
                        onLoadedMetadata={handleLoadedMetadata}
                        // Remove onClick from video here because parent handles it, preventing double toggle
                        onEnded={() => setIsPlaying(false)}
                        playsInline
                    />
                )}
                
                {/* Download/Loading Overlay */}
                {showLoadingOverlay && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-10 p-6 text-center" onClick={(e) => e.stopPropagation()}>
                        <Icons.Loader className="w-10 h-10 text-primary-400 animate-spin mb-4" />
                        <h3 className="text-white font-medium text-lg mb-2">正在缓存视频资源... {Math.round(downloadProgress)}%</h3>
                        <p className="text-gray-300 text-sm mb-6 max-w-md">
                            我们将视频下载到浏览器内存中，以提供流畅的拖拽体验和高质量截图。
                        </p>
                        <button 
                            onClick={(e) => { e.stopPropagation(); skipDownload(); }}
                            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm border border-white/20 transition-all"
                        >
                            跳过等待，直接播放 (可能卡顿)
                        </button>
                    </div>
                )}
             </>
          )}

          <canvas ref={canvasRef} className="hidden" />

          {/* Controls Overlay (Native Only) */}
          {playerType === 'native' && !showLoadingOverlay && (
            <div 
                className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4 transition-opacity duration-300 ${isHovering || !isPlaying ? 'opacity-100' : 'opacity-0'}`}
                onClick={(e) => e.stopPropagation()} // Stop bubbling from controls area
            >
                
                <input
                    type="range"
                    min="0"
                    max={duration || 100}
                    value={currentTime}
                    onChange={handleSeek}
                    className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer mb-4 accent-primary-500 hover:h-2 transition-all"
                />

                <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={(e) => { e.stopPropagation(); togglePlay(); }} 
                        className="text-white hover:text-primary-400 transition-colors"
                    >
                        {isPlaying ? (
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/></svg>
                        ) : (
                            <Icons.Play className="w-6 h-6 fill-current" />
                        )}
                    </button>
                    <span className="text-white text-sm font-mono">
                        {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                    
                    {/* Status Badge */}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${blobUrl ? 'border-green-500/50 text-green-400 bg-green-500/10' : 'border-yellow-500/50 text-yellow-400 bg-yellow-500/10'}`}>
                        {blobUrl ? '缓存模式' : '流媒体模式'}
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    <button
                    onClick={captureFrame}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg text-white text-sm transition-all border border-white/10 active:scale-95"
                    title="截取当前帧"
                    >
                    <Icons.Camera className="w-4 h-4" />
                    <span className="hidden sm:inline">截帧</span>
                    </button>
                </div>
                </div>
            </div>
          )}
          
          {/* Centered Play Button (When Paused) */}
          {playerType === 'native' && !isPlaying && !showLoadingOverlay && (
              <div 
                className="absolute inset-0 flex items-center justify-center bg-black/10 cursor-pointer pointer-events-none"
              >
                  <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                      <Icons.Play className="w-8 h-8 text-white fill-current ml-1" />
                  </div>
              </div>
          )}
        </div>

        {/* Captured Image Preview Area */}
        {capturedImage && (
            <div id="capture-preview" className="animate-fade-in bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm ring-1 ring-gray-200 dark:ring-gray-800 border-l-4 border-primary-500">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                        <Icons.Camera className="w-5 h-5 text-primary-500" />
                        截图预览
                    </h3>
                    <button 
                        onClick={() => setCapturedImage(null)}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors text-gray-500"
                        title="关闭预览"
                    >
                        <Icons.Close className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1 relative rounded-lg overflow-hidden bg-black/5 dark:bg-black/20 border border-gray-100 dark:border-gray-800 flex items-center justify-center min-h-[200px]">
                        <img 
                            src={capturedImage} 
                            alt="Captured Frame" 
                            className="max-w-full max-h-[400px] object-contain shadow-lg"
                        />
                    </div>
                    
                    <div className="w-full md:w-48 flex flex-col justify-center gap-3">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                           当前帧已截取。你可以下载保存到本地。
                        </p>
                        <button
                            onClick={downloadCapturedImage}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 hover:bg-primary-500 text-white rounded-lg font-medium transition-colors shadow-lg shadow-primary-500/20"
                        >
                            <Icons.Download className="w-4 h-4" />
                            下载图片
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default VideoPlayer;
