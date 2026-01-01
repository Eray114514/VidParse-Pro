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
  const [useDirectStream, setUseDirectStream] = useState(false); 
  
  // Screenshot State
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  // ... (Logic remains largely the same, focusing on UI update in return)
  
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDownloadProgress(0);
    setCapturedImage(null);
    setUseDirectStream(false);
    
    if (blobUrl) {
      URL.revokeObjectURL(blobUrl);
      setBlobUrl(null);
    }

    if (playerType === 'iframe') return;

    const controller = new AbortController();
    let isAborted = false;

    const fetchVideo = async () => {
      setIsDownloading(true);
      try {
        const fetchUrl = url.includes('?') ? `${url}&t=${Date.now()}` : `${url}?t=${Date.now()}`;
        
        const response = await fetch(fetchUrl, {
            signal: controller.signal,
            referrerPolicy: "no-referrer"
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
              setDownloadProgress(Math.min((loaded / total) * 100, 99));
            }
          }
        }

        const blob = new Blob(chunks, { type: 'video/mp4' });
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
            console.warn("Blob download failed, falling back to stream:", err);
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

  const togglePlay = useCallback((e?: React.MouseEvent) => {
    if (playerType === 'iframe') return;
    if (e) {
       const target = e.target as HTMLElement;
       if (target.closest('button') || target.closest('input')) return;
    }
    if (videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying, playerType]);

  const handleTimeUpdate = () => {
    if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) setDuration(videoRef.current.duration);
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

  const captureFrame = useCallback((e: React.MouseEvent) => {
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
                const dataUrl = canvas.toDataURL('image/png');
                setCapturedImage(dataUrl);
                
                if (!video.paused) {
                    video.pause();
                    setIsPlaying(false);
                }

                setTimeout(() => {
                    document.getElementById('capture-preview')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);

            } catch (err) {
                console.error("Screenshot failed:", err);
                alert("当前模式不支持截帧 (CORS限制)。请等待缓存完成。");
            }
        }
    }
  }, []);

  const downloadCapturedImage = () => {
    if (!capturedImage) return;
    const link = document.createElement('a');
    link.href = capturedImage;
    link.download = `frame_${Math.floor(currentTime)}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const activeSrc = blobUrl || (useDirectStream ? url : undefined);
  const showLoadingOverlay = isDownloading && !blobUrl && !useDirectStream;

  return (
    <div className={`flex flex-col gap-6 ${className}`}>
        {/* Main Player Container */}
        <div 
          className="relative group w-full aspect-video bg-black overflow-hidden shadow-2xl"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          onClick={togglePlay}
        >
          {playerType === 'iframe' && (
              <iframe 
                src={url} 
                className="w-full h-full border-0" 
                allowFullScreen 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                referrerPolicy="no-referrer"
              />
          )}

          {playerType === 'native' && (
             <>
                {activeSrc && (
                    <video
                        ref={videoRef}
                        src={activeSrc}
                        poster={poster}
                        className="w-full h-full object-contain"
                        referrerPolicy="no-referrer" 
                        onTimeUpdate={handleTimeUpdate}
                        onLoadedMetadata={handleLoadedMetadata}
                        onEnded={() => setIsPlaying(false)}
                        playsInline
                    />
                )}
                
                {showLoadingOverlay && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-md z-20 p-6 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="relative mb-4">
                            <div className="absolute inset-0 bg-primary-500 rounded-full blur opacity-40 animate-pulse"></div>
                            <Icons.Loader className="relative w-12 h-12 text-primary-400 animate-spin" />
                        </div>
                        <h3 className="text-white font-bold text-xl mb-2 tracking-tight">正在极速缓存... {Math.round(downloadProgress)}%</h3>
                        <div className="w-64 h-1.5 bg-gray-700 rounded-full overflow-hidden mb-6">
                            <div className="h-full bg-gradient-to-r from-primary-500 to-purple-500 transition-all duration-300" style={{ width: `${downloadProgress}%` }}></div>
                        </div>
                        <button 
                            onClick={(e) => { e.stopPropagation(); skipDownload(); }}
                            className="text-gray-400 hover:text-white text-xs underline underline-offset-4 transition-colors"
                        >
                            跳过缓存 (流媒体播放)
                        </button>
                    </div>
                )}
             </>
          )}

          <canvas ref={canvasRef} className="hidden" />

          {/* Controls Overlay */}
          {playerType === 'native' && !showLoadingOverlay && (
            <div 
                className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-12 pb-4 px-6 transition-all duration-500 ${isHovering || !isPlaying ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Progress Bar */}
                <div className="relative w-full h-1 bg-white/20 rounded-full mb-4 group/progress cursor-pointer hover:h-1.5 transition-all">
                    <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary-500 to-purple-500 rounded-full" style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}></div>
                    <input
                        type="range"
                        min="0"
                        max={duration || 100}
                        value={currentTime}
                        onChange={handleSeek}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={(e) => { e.stopPropagation(); togglePlay(); }} 
                            className="text-white hover:text-primary-400 transition-colors transform hover:scale-110 active:scale-95"
                        >
                            {isPlaying ? (
                                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/></svg>
                            ) : (
                                <Icons.Play className="w-8 h-8 fill-current" />
                            )}
                        </button>
                        <span className="text-white font-mono text-sm tracking-widest opacity-90">
                            {formatTime(currentTime)} <span className="text-white/40">/</span> {formatTime(duration)}
                        </span>
                        
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border backdrop-blur-sm font-bold uppercase tracking-wider ${blobUrl ? 'border-green-500/30 text-green-300 bg-green-500/10' : 'border-yellow-500/30 text-yellow-300 bg-yellow-500/10'}`}>
                            {blobUrl ? 'LOCAL CACHE' : 'STREAM'}
                        </span>
                    </div>

                    <button
                        onClick={captureFrame}
                        className="group/btn flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-lg text-white text-sm font-medium transition-all border border-white/10 hover:border-white/30 active:scale-95"
                    >
                        <Icons.Camera className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                        <span>截帧</span>
                    </button>
                </div>
            </div>
          )}
          
          {/* Big Play Button */}
          {playerType === 'native' && !isPlaying && !showLoadingOverlay && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-2xl animate-pulse">
                      <Icons.Play className="w-10 h-10 text-white fill-current ml-1" />
                  </div>
              </div>
          )}
        </div>

        {/* Capture Preview UI */}
        {capturedImage && (
            <div id="capture-preview" className="animate-fade-in-up glass-panel rounded-3xl p-6 shadow-2xl ring-2 ring-primary-500/20">
                <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-4">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                        <div className="p-1.5 bg-primary-500 rounded-lg shadow-lg shadow-primary-500/30">
                           <Icons.Camera className="w-4 h-4 text-white" />
                        </div>
                        截图预览
                    </h3>
                    <button 
                        onClick={() => setCapturedImage(null)}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-colors text-slate-500 dark:text-slate-400"
                    >
                        <Icons.Close className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1 relative rounded-2xl overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 border border-white/20 shadow-inner flex items-center justify-center min-h-[240px]">
                        {/* Checkerboard pattern for transparency */}
                        <div className="absolute inset-0 opacity-20" style={{backgroundImage: 'radial-gradient(#444 1px, transparent 1px)', backgroundSize: '10px 10px'}}></div>
                        
                        <img 
                            src={capturedImage} 
                            alt="Captured Frame" 
                            className="relative z-10 max-w-full max-h-[400px] object-contain shadow-2xl rounded-lg"
                        />
                    </div>
                    
                    <div className="w-full md:w-64 flex flex-col justify-center gap-4">
                        <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
                            <h4 className="text-sm font-bold text-blue-600 dark:text-blue-400 mb-1">高清原图</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400">分辨率: {videoRef.current?.videoWidth} x {videoRef.current?.videoHeight}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">时间点: {formatTime(currentTime)}</p>
                        </div>

                        <button
                            onClick={downloadCapturedImage}
                            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 rounded-xl font-bold transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5 active:translate-y-0"
                        >
                            <Icons.Download className="w-5 h-5" />
                            保存到本地
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default VideoPlayer;