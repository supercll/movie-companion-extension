import { storage } from 'wxt/utils/storage';
import type { Settings } from './types';
import { DEFAULT_SETTINGS } from './constants';

export const settingsStorage = storage.defineItem<Settings>('local:settings', {
  fallback: DEFAULT_SETTINGS,
});
