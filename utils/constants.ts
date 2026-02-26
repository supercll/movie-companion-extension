import type { Preset, Settings } from './types';

export const DEFAULT_PRESETS: Preset[] = [
  { trigger: '截图', action: 'screenshot' },
  { trigger: 'cap', action: 'screenshot' },
  { trigger: '录制', action: 'gif' },
  { trigger: 'gif', action: 'gif' },
  { trigger: '连拍', action: 'burst' },
];

export const DEFAULT_SETTINGS: Settings = {
  gifDuration: 3,
  gifFps: 10,
  gifQuality: 15,
  imageFormat: 'png',
  jpegQuality: 92,
};

export const ACTION_LABELS: Record<string, string> = {
  screenshot: '截图',
  gif: '录制GIF',
  burst: '连拍(5张)',
};
