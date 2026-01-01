import React, { useState, useEffect } from 'react';
import { Icons, DEMO_VIDEO_URL } from './constants';
import VideoPlayer from './components/VideoPlayer';
import { AppStatus, ParsedVideoData } from './types';
import { parseVideoInput } from './services/parserService';

const App = () => {
  const [darkMode, setDarkMode] = useState(true);
  const [inputUrl, setInputUrl] = useState('');
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [data, setData] = useState<ParsedVideoData | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [downloadingUrl, setDownloadingUrl] = useState<string | null>(null);

  // Initialize Theme and Body Class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.remove('light-mode-bg');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.add('light-mode-bg');
    }
  }, [darkMode]);

  const handleParse = async () => {
    if (!inputUrl.trim()) return;

    setStatus(AppStatus.PARSING);
    setData(null);
    setErrorMsg('');

    try {
        const result = await parseVideoInput(inputUrl);
        setData(result);
        setStatus(AppStatus.SUCCESS);
    } catch (e) {
        console.error(e);
        if (inputUrl.includes('demo')) {
            setData({
                id: 'demo_123',
                title: '演示视频: Big Buck Bunny (1080P High Quality)',
                platform: 'direct',
                playerType: 'native',
                sources: [{ url: DEMO_VIDEO_URL, format: 'MP4', quality: '1080P', size: '24MB', isDownloadable: true }]
            });
            setStatus(AppStatus.SUCCESS);
        } else {
            setStatus(AppStatus.ERROR);
            setErrorMsg("无法解析该链接，请确认格式正确 (支持: B站 BV/av/b23.tv, YouTube, 直链MP4)");
        }
    }
  };

  const handleDemoClick = () => {
      setInputUrl("https://www.bilibili.com/video/BV1GJ411x7h7"); 
  };

  const forceDownload = async (url: string, filename: string) => {
    if (downloadingUrl) return;
    setDownloadingUrl(url);
    
    try {
        const response = await fetch(url, { referrerPolicy: 'no-referrer' });
        if (!response.ok) throw new Error('Download failed');
        
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename || `video_${Date.now()}.mp4`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    } catch (e) {
        console.error("Force download failed, falling back to new tab", e);
        window.open(url, '_blank');
    } finally {
        setDownloadingUrl(null);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
        
      {/* Decorative Background Blobs - Kept subtle */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-blob"></div>
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      </div>

      <div className="relative z-10 p-4 sm:p-8 flex flex-col items-center max-w-7xl mx-auto">
        {/* Header */}
        <header className="w-full flex justify-between items-center mb-16">
          <div className="flex items-center gap-4 cursor-default">
              <div className="relative w-12 h-12 glass-panel rounded-2xl flex items-center justify-center text-white shadow-lg ring-1 ring-white/10">
                  <Icons.Play className="w-6 h-6 fill-current text-primary-400" />
              </div>
              <div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white">
                      VidParse Pro
                  </h1>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 tracking-wider uppercase">
                      Universal Video Tool
                  </p>
              </div>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="w-10 h-10 rounded-full glass-panel flex items-center justify-center hover:bg-white/20 transition-all text-slate-600 dark:text-slate-300 shadow-lg ring-1 ring-white/10"
          >
            {darkMode ? <Icons.Sun className="w-5 h-5" /> : <Icons.Moon className="w-5 h-5" />}
          </button>
        </header>

        {/* Hero / Input Section */}
        <div className="w-full max-w-3xl flex flex-col gap-8 animate-fade-in-up mb-8">
          <div className="text-center space-y-4 mb-2">
               <h2 className="text-4xl md:text-5xl font-extrabold text-slate-800 dark:text-white drop-shadow-sm tracking-tight">
                  全能视频解析
               </h2>
               <p className="text-lg text-slate-600 dark:text-slate-300 max-w-lg mx-auto leading-relaxed opacity-90">
                  支持 <span className="font-semibold text-primary-600 dark:text-primary-400">B站</span>、
                  <span className="font-semibold text-red-500 dark:text-red-400">YouTube</span> 及任意直链。
                  <br/>极速下载 · 4K画质 · 智能截帧
               </p>
          </div>

          <div className="relative mx-auto w-full group">
              {/* Clean Glass Input Container */}
              <div className="relative flex items-center glass-panel rounded-2xl p-2 shadow-2xl ring-1 ring-white/20 transition-all duration-300 hover:ring-primary-500/30 focus-within:ring-primary-500/50 focus-within:shadow-primary-500/10">
                  <div className="pl-4 pr-3 text-slate-400">
                      <Icons.Search className="w-6 h-6" />
                  </div>
                  <input
                      type="text"
                      value={inputUrl}
                      onChange={(e) => setInputUrl(e.target.value)}
                      placeholder="粘贴视频链接 (Bilibili, YouTube, MP4...)"
                      className="flex-1 bg-transparent border-none outline-none px-2 py-4 text-lg text-slate-800 dark:text-white placeholder-slate-400 font-medium"
                      onKeyDown={(e) => e.key === 'Enter' && handleParse()}
                  />
                  <button
                      onClick={handleParse}
                      disabled={status === AppStatus.PARSING}
                      className="px-8 py-3 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-gray-100 text-white dark:text-slate-900 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
                  >
                      {status === AppStatus.PARSING ? (
                          <Icons.Loader className="animate-spin w-5 h-5" />
                      ) : (
                          <span>解析</span>
                      )}
                  </button>
              </div>
          </div>
          
          {status === AppStatus.ERROR && (
              <div className="mx-auto animate-fade-in-up bg-red-500/5 backdrop-blur-md border border-red-500/20 text-red-600 dark:text-red-300 px-6 py-3 rounded-xl flex items-center gap-2 shadow-lg">
                  <Icons.AlertTriangle className="w-5 h-5" />
                  <span>{errorMsg}</span>
              </div>
          )}

          {status === AppStatus.IDLE && (
              <div className="text-center animate-fade-in-up delay-100">
                  <button 
                      onClick={handleDemoClick}
                      className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-300 transition-colors flex items-center justify-center gap-1 mx-auto group"
                  >
                      <Icons.Play className="w-3 h-3 group-hover:scale-110 transition-transform" />
                      没有链接？试一试示例视频
                  </button>
              </div>
          )}
        </div>

        {/* Results Section */}
        {status === AppStatus.SUCCESS && data && (
          <div className="w-full mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in-up">
              {/* Left: Video Player (8 cols) */}
              <div className="lg:col-span-8 flex flex-col gap-6">
                  {/* Player Container */}
                  <div className="relative rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/10 bg-black/40 backdrop-blur-sm group">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none z-10"></div>
                      <VideoPlayer 
                          url={data.sources[0].url} 
                          poster={data.thumbnailUrl} 
                          playerType={data.playerType} 
                      />
                  </div>
                  
                  {/* Info Card */}
                  <div className="glass-panel rounded-3xl p-8 shadow-xl">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                          <div className="flex-1">
                              <h2 className="text-2xl font-bold mb-3 text-slate-800 dark:text-white leading-tight">{data.title}</h2>
                              <div className="flex flex-wrap items-center gap-3 mb-4">
                                  <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-200">
                                      {data.platform}
                                  </span>
                                  {data.duration && (
                                      <span className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
                                          <Icons.Play className="w-3 h-3" /> {data.duration}
                                      </span>
                                  )}
                              </div>
                              {data.description && (
                                  <div className="p-4 rounded-2xl bg-slate-100/50 dark:bg-black/20 border border-slate-200/50 dark:border-white/5 text-slate-600 dark:text-slate-300 text-sm leading-relaxed max-h-40 overflow-y-auto custom-scrollbar">
                                      <p>{data.description}</p>
                                  </div>
                              )}
                          </div>
                      </div>
                  </div>
              </div>

              {/* Right: Sidebar Options (4 cols) */}
              <div className="lg:col-span-4 space-y-6">
                  
                  {/* Download Card */}
                  <div className="glass-panel rounded-3xl p-6 shadow-xl flex flex-col h-full max-h-[600px]">
                      <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-800 dark:text-white">
                          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                             <Icons.Download className="w-5 h-5" />
                          </div>
                          资源列表
                      </h3>
                      
                      {data.playerType === 'iframe' && (
                          <div className="mb-4 text-xs font-medium text-amber-700 dark:text-amber-300 bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl flex gap-2">
                              <Icons.AlertTriangle className="w-4 h-4 shrink-0" />
                              <p>仅提供内嵌播放或原始跳转。</p>
                          </div>
                      )}

                      <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar flex-1">
                          {data.sources.map((source, idx) => (
                              <div key={idx} className="relative group overflow-hidden rounded-xl bg-white/40 dark:bg-white/5 border border-white/40 dark:border-white/10 hover:bg-white/60 dark:hover:bg-white/10 transition-all p-4">
                                  <div className="flex items-center justify-between relative z-10">
                                      <div>
                                          <div className="font-bold text-sm text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                              <span className="px-1.5 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-[10px] tracking-wide text-slate-600 dark:text-slate-300">
                                                  {source.format}
                                              </span>
                                              {source.quality}
                                          </div>
                                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono opacity-80">{source.size}</div>
                                      </div>
                                      
                                      {source.isDownloadable ? (
                                          <button 
                                              onClick={() => forceDownload(source.url, `${data.title}.mp4`)}
                                              disabled={downloadingUrl === source.url}
                                              className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:scale-110 transition-transform shadow-lg disabled:opacity-50 disabled:scale-100"
                                              title="下载"
                                          >
                                              {downloadingUrl === source.url ? (
                                                  <Icons.Loader className="w-5 h-5 animate-spin"/>
                                              ) : (
                                                  <Icons.Download className="w-5 h-5" />
                                              )}
                                          </button>
                                      ) : (
                                          <button className="text-slate-300 dark:text-slate-600 cursor-not-allowed">
                                              <Icons.Play className="w-5 h-5" />
                                          </button>
                                      )}
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>

                  {/* Tips Card */}
                  <div className="glass-panel rounded-3xl p-6 shadow-xl">
                      <h3 className="font-bold text-sm mb-3 text-slate-700 dark:text-slate-200 flex items-center gap-2">
                          <Icons.Bot className="w-4 h-4" />
                          小贴士
                      </h3>
                      <ul className="text-xs space-y-3 text-slate-600 dark:text-slate-400 leading-relaxed">
                          <li className="flex gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0"></span>
                              B站视频会自动转为 MP4 直链。
                          </li>
                          <li className="flex gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 shrink-0"></span>
                              截帧功能会自动暂停视频。
                          </li>
                      </ul>
                  </div>

              </div>
          </div>
        )}
        
        {/* Footer */}
        <footer className="mt-20 py-8 text-center text-xs text-slate-400 dark:text-slate-500 font-medium tracking-wide">
          <p>© 2024 VidParse Pro · Pure Glass Design</p>
        </footer>
      </div>
    </div>
  );
};

export default App;