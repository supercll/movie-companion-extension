import type { Settings } from './types'
import { storage } from 'wxt/utils/storage'
import { DEFAULT_SETTINGS } from './constants'

export const settingsStorage = storage.defineItem<Settings>('local:settings', {
  fallback: DEFAULT_SETTINGS,
})
