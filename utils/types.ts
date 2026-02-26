export type ActionType = 'screenshot' | 'gif' | 'burst' | 'video';

export type TimedActionType = 'screenshot' | 'gif' | 'video';


export interface Settings {
  gifDuration: number;
  gifFps: number;
  gifQuality: number;
  imageFormat: 'png' | 'jpeg' | 'webp';
  jpegQuality: number;
  videoDuration: number;
  videoFormat: 'auto' | 'mp4' | 'webm-vp9' | 'webm-h264' | 'webm';
  videoBitrate: number;
}

export interface VideoInfo {
  hasVideo: boolean;
  videoWidth?: number;
  videoHeight?: number;
  duration?: number;
  currentTime?: number;
}

export type MessageAction =
  | { action: 'screenshot'; settings: Settings }
  | { action: 'gif'; settings: Settings }
  | { action: 'burst'; settings: Settings }
  | { action: 'checkVideo' }
  | { action: 'updateSettings'; settings: Settings }
  | { action: 'timedScreenshot'; time: number; settings: Settings }
  | { action: 'timedScreenshotPoints'; times: number[]; settings: Settings }
  | { action: 'timedGif'; start: number; end: number; settings: Settings }
  | { action: 'video'; settings: Settings }
  | { action: 'stopVideo' }
  | { action: 'timedVideo'; start: number; end: number; settings: Settings };

export type MessageResponse =
  | { success: true }
  | { success: false; error: string }
  | VideoInfo;
