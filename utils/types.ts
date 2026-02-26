export type ActionType = 'screenshot' | 'gif' | 'burst';

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
}

export type MessageAction =
  | { action: 'screenshot'; settings: Settings }
  | { action: 'gif'; settings: Settings }
  | { action: 'burst'; settings: Settings }
  | { action: 'checkVideo' }
  | { action: 'updatePresets'; presets: Preset[] }
  | { action: 'updateSettings'; settings: Settings };

export type MessageResponse =
  | { success: true }
  | { success: false; error: string }
  | VideoInfo;
