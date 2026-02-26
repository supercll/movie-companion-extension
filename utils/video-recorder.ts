import type { Settings } from './types'
import { t } from './i18n'

declare global {
  interface HTMLVideoElement {
    captureStream: () => MediaStream
  }
}

export type VideoFormat = 'webm-vp9' | 'webm-h264' | 'mp4' | 'webm'

export interface VideoRecordingCallbacks {
  onProgress: (elapsed: number, total: number) => void
  onComplete: (blob: Blob, duration: number) => void
  onError: (error: string) => void
}

const FORMAT_MIME: Record<VideoFormat, string> = {
  'mp4': 'video/mp4;codecs=h264,aac',
  'webm-h264': 'video/webm;codecs=h264',
  'webm-vp9': 'video/webm;codecs=vp9,opus',
  'webm': 'video/webm',
}

export function detectBestFormat(): { format: VideoFormat, mimeType: string } {
  const preferred: VideoFormat[] = ['mp4', 'webm-vp9', 'webm-h264', 'webm']
  for (const fmt of preferred) {
    if (MediaRecorder.isTypeSupported(FORMAT_MIME[fmt])) {
      return { format: fmt, mimeType: FORMAT_MIME[fmt] }
    }
  }
  return { format: 'webm', mimeType: 'video/webm' }
}

export function getFormatExtension(format: VideoFormat): string {
  return format === 'mp4' ? 'mp4' : 'webm'
}

let activeRecorder: MediaRecorder | null = null
let stopTimer: ReturnType<typeof setTimeout> | undefined

export function isVideoRecording(): boolean {
  return activeRecorder !== null && activeRecorder.state === 'recording'
}

export function stopVideoRecording(): void {
  clearTimeout(stopTimer)
  if (activeRecorder && activeRecorder.state === 'recording') {
    activeRecorder.stop()
  }
}

export function startVideoRecording(
  video: HTMLVideoElement,
  settings: Settings,
  callbacks: VideoRecordingCallbacks,
): void {
  if (isVideoRecording()) {
    callbacks.onError(t('error.recordingInProgress'))
    return
  }

  let stream: MediaStream
  try {
    stream = video.captureStream()
  }
  catch {
    callbacks.onError(t('error.cannotCaptureStream'))
    return
  }

  if (stream.getVideoTracks().length === 0) {
    callbacks.onError(t('error.noVideoTrack'))
    return
  }

  const userFormat = settings.videoFormat ?? 'auto'
  let mimeType: string
  let format: VideoFormat

  if (userFormat === 'auto') {
    const detected = detectBestFormat()
    mimeType = detected.mimeType
    format = detected.format
  }
  else {
    format = userFormat as VideoFormat
    mimeType = FORMAT_MIME[format]
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      const fallback = detectBestFormat()
      mimeType = fallback.mimeType
      format = fallback.format
    }
  }

  const bitrate = (settings.videoBitrate ?? 2500) * 1000

  let recorder: MediaRecorder
  try {
    recorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: bitrate,
    })
  }
  catch {
    callbacks.onError(t('error.unsupportedFormat', { fmt: mimeType }))
    return
  }

  activeRecorder = recorder
  const chunks: Blob[] = []
  const duration = settings.videoDuration ?? 10
  const startTime = Date.now()

  recorder.ondataavailable = (e) => {
    if (e.data.size > 0)
      chunks.push(e.data)
  }

  recorder.onstop = () => {
    activeRecorder = null
    clearTimeout(stopTimer)

    if (chunks.length === 0) {
      callbacks.onError(t('error.noData'))
      return
    }

    const blob = new Blob(chunks, { type: mimeType })
    const elapsed = (Date.now() - startTime) / 1000
    callbacks.onComplete(blob, elapsed)
  }

  recorder.onerror = () => {
    activeRecorder = null
    clearTimeout(stopTimer)
    callbacks.onError(t('error.recordingError'))
  }

  recorder.start(1000)

  const progressInterval = setInterval(() => {
    if (!activeRecorder || activeRecorder.state !== 'recording') {
      clearInterval(progressInterval)
      return
    }
    const elapsed = (Date.now() - startTime) / 1000
    callbacks.onProgress(elapsed, duration)
  }, 500)

  stopTimer = setTimeout(() => {
    clearInterval(progressInterval)
    if (activeRecorder && activeRecorder.state === 'recording') {
      activeRecorder.stop()
    }
  }, duration * 1000)
}
