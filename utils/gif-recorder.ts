import type { Settings } from './types'
import { encode } from 'modern-gif'
import { t } from './i18n'

export interface GifRecordingCallbacks {
  onProgress: (fraction: number, elapsed: number) => void
  onComplete: (blob: Blob, frameCount: number) => void
  onError: (error: string) => void
}

let abortController: AbortController | null = null

export function isRecording(): boolean {
  return abortController !== null
}

export function stopRecording(): void {
  abortController?.abort()
}

export async function recordGif(
  video: HTMLVideoElement,
  settings: Settings,
  callbacks: GifRecordingCallbacks,
): Promise<void> {
  if (abortController) {
    callbacks.onError(t('error.recordingInProgress'))
    return
  }

  abortController = new AbortController()
  const { signal } = abortController

  const duration = settings.gifDuration * 1000
  const fps = settings.gifFps
  const frameInterval = 1000 / fps

  const maxDim = 480
  let w = video.videoWidth
  let h = video.videoHeight
  if (w > maxDim || h > maxDim) {
    const scale = maxDim / Math.max(w, h)
    w = Math.round(w * scale)
    h = Math.round(h * scale)
  }
  w = w & ~1
  h = h & ~1

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!

  const totalFrames = Math.ceil(duration / frameInterval)
  const frames: Array<{ data: ArrayBuffer, delay: number }> = []

  try {
    for (let i = 0; i < totalFrames; i++) {
      if (signal.aborted)
        break

      ctx.drawImage(video, 0, 0, w, h)
      const { data } = ctx.getImageData(0, 0, w, h)
      const copy = new Uint8Array(data.length)
      copy.set(data)
      frames.push({ data: copy.buffer, delay: frameInterval })

      callbacks.onProgress((i + 1) / totalFrames, ((i + 1) * frameInterval) / 1000)

      await new Promise(r => setTimeout(r, frameInterval))
    }

    if (signal.aborted && frames.length === 0) {
      callbacks.onError(t('error.recordingCancelled'))
      return
    }

    const output = await encode({
      width: w,
      height: h,
      frames,
      maxColors: Math.max(2, Math.min(255, 256 - (settings.gifQuality ?? 10))),
    })

    const blob = new Blob([output], { type: 'image/gif' })
    callbacks.onComplete(blob, frames.length)
  }
  catch (err) {
    callbacks.onError(err instanceof Error ? err.message : t('error.gifFailed'))
  }
  finally {
    abortController = null
  }
}
