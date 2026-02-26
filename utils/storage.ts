import { storage } from 'wxt/utils/storage';
import type { Preset, Settings } from './types';
import { DEFAULT_PRESETS, DEFAULT_SETTINGS } from './constants';

export const presetsStorage = storage.defineItem<Preset[]>('local:presets', {
  fallback: DEFAULT_PRESETS,
});

export const settingsStorage = storage.defineItem<Settings>('local:settings', {
  fallback: DEFAULT_SETTINGS,
});
