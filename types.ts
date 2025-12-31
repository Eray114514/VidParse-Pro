export interface VideoSource {
  url: string;
  format: string;
  quality: string;
  size?: string;
  isDownloadable?: boolean; // Some streams (like iframes) might not be directly downloadable
}

export interface AISummary {
  tags: string[];
  summary: string;
  sentiment: string;
}

export interface ParsedVideoData {
  id: string;
  title: string;
  platform: 'youtube' | 'bilibili' | 'direct' | 'unknown';
  playerType: 'native' | 'iframe';
  thumbnailUrl?: string;
  duration?: string;
  sources: VideoSource[];
  description?: string;
  aiSummary?: AISummary;
}

export enum AppStatus {
  IDLE = 'IDLE',
  PARSING = 'PARSING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}