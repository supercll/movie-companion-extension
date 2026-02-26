import type { Settings } from './types'

export const MAX_RECORDING_DURATION = 120

export const DEFAULT_SETTINGS: Settings = {
  locale: 'auto',
  gifDuration: 3,
  gifFps: 10,
  gifQuality: 15,
  imageFormat: 'png',
  jpegQuality: 92,
  videoDuration: 10,
  videoFormat: 'auto',
  videoBitrate: 2500,
}
