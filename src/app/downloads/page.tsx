import { DownloadCloud } from "lucide-react";

export default function DownloadsPage() {
  return (
    <div className="w-full flex flex-col gap-8 pb-12 animate-in fade-in duration-500">
      <div className="text-left space-y-4 mb-4">
        <h2 className="text-4xl font-extrabold tracking-tight drop-shadow-sm">
          下载记录
        </h2>
        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed font-medium">
          目前下载功能暂未接入进度展示，请前往设置的本地目录查看文件。
        </p>
      </div>

      <div className="bg-white/70 dark:bg-[#1a1a1e]/70 backdrop-blur-xl p-12 rounded-3xl shadow-sm border border-slate-200/50 dark:border-white/5 flex flex-col items-center justify-center text-center min-h-[300px] transition-colors">
        <div className="w-20 h-20 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-6">
          <DownloadCloud className="w-10 h-10 text-slate-400" />
        </div>
        <h3 className="text-xl font-bold mb-2">暂无下载记录</h3>
        <p className="text-slate-500 dark:text-slate-400">
          当您开始下载视频时，这里将显示下载任务状态。
        </p>
      </div>
    </div>
  );
}
