export type ActionType = 'screenshot' | 'gif' | 'burst';

export type TimedActionType = 'screenshot' | 'gif';

export interface Preset {
  trigger: string;
  action: ActionType;
}

export interface Settings {
  gifDuration: number;
  gifFps: number;
  gifQuality: number;
  imageFormat: 'png' | 'jpeg' | 'webp';
  jpegQuality: number;
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
  | { action: 'updatePresets'; presets: Preset[] }
  | { action: 'updateSettings'; settings: Settings }
  | { action: 'timedScreenshot'; time: number; settings: Settings }
  | { action: 'timedScreenshotPoints'; times: number[]; settings: Settings }
  | { action: 'timedGif'; start: number; end: number; settings: Settings };

export type MessageResponse =
  | { success: true }
  | { success: false; error: string }
  | VideoInfo;
