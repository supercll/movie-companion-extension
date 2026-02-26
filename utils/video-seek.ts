import type { GifRecordingCallbacks } from './gif-recorder'
import type { Settings } from './types'
import { encode } from 'modern-gif'
import { MAX_RECORDING_DURATION } from './constants'
import { t } from './i18n'
import { captureVideoFrame, getTimestamp } from './video'

function waitForSeek(video: HTMLVideoElement): Promise<void> {
  return new Promise((resolve, reject) => {
    const ac = new AbortController()
    const cleanup = () => ac.abort()

    video.addEventListener('seeked', () => {
      cleanup()
      resolve()
    }, { once: true, signal: ac.signal })

    video.addEventListener('error', () => {
      cleanup()
      reject(new Error(t('error.seekFailed')))
    }, { once: true, signal: ac.signal })

    setTimeout(() => {
      cleanup()
      resolve()
    }, 3000)
  })
}

/**
 * Seek to a specific time and take a screenshot.
 * Returns the video to its original position afterward.
 */
export async function screenshotAtTime(
  video: HTMLVideoElement,
  time: number,
  settings: Settings,
): Promise<{ dataUrl: string, filename: string }> {
  const originalTime = video.currentTime
  const wasPlaying = !video.paused
  if (wasPlaying)
    video.pause()

  video.currentTime = time
  await waitForSeek(video)

  const format = settings.imageFormat || 'png'
  const { dataUrl } = captureVideoFrame(video, format, settings.jpegQuality)
  const ext = format === 'jpeg' ? 'jpg' : format
  const timeLabel = formatSeekTime(time)
  const filename = `movie-companion-${getTimestamp()}-at${timeLabel}.${ext}`

  video.currentTime = originalTime
  await waitForSeek(video)
  if (wasPlaying)
    video.play()

  return { dataUrl, filename }
}

/**
 * Seek to multiple time points and take screenshots at each.
 */
export async function screenshotAtPoints(
  video: HTMLVideoElement,
  times: number[],
  settings: Settings,
  onProgress?: (current: number, total: number) => void,
): Promise<Array<{ dataUrl: string, filename: string }>> {
  const originalTime = video.currentTime
  const wasPlaying = !video.paused
  if (wasPlaying)
    video.pause()

  const results: Array<{ dataUrl: string, filename: string }> = []

  for (let i = 0; i < times.length; i++) {
    video.currentTime = times[i]
    await waitForSeek(video)

    const format = settings.imageFormat || 'png'
    const { dataUrl } = captureVideoFrame(video, format, settings.jpegQuality)
    const ext = format === 'jpeg' ? 'jpg' : format
    const timeLabel = formatSeekTime(times[i])
    const filename = `movie-companion-${getTimestamp()}-at${timeLabel}.${ext}`
    results.push({ dataUrl, filename })

    onProgress?.(i + 1, times.length)
  }

  video.currentTime = originalTime
  await waitForSeek(video)
  if (wasPlaying)
    video.play()

  return results
}

/**
 * Seek through a time range and record a GIF by capturing frames at each seek position.
 */
export async function recordGifAtRange(
  video: HTMLVideoElement,
  startTime: number,
  endTime: number,
  settings: Settings,
  callbacks: GifRecordingCallbacks,
): Promise<void> {
  const originalTime = video.currentTime
  const wasPlaying = !video.paused
  if (wasPlaying)
    video.pause()

  const fps = settings.gifFps
  const frameInterval = 1 / fps
  const clampedEnd = Math.min(endTime, startTime + MAX_RECORDING_DURATION)
  const duration = clampedEnd - startTime

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

  const totalFrames = Math.ceil(duration * fps)
  const frames: Array<{ data: ArrayBuffer, delay: number }> = []

  try {
    for (let i = 0; i < totalFrames; i++) {
      const t = startTime + i * frameInterval
      if (t > clampedEnd)
        break

      video.currentTime = t
      await waitForSeek(video)

      ctx.drawImage(video, 0, 0, w, h)
      const { data } = ctx.getImageData(0, 0, w, h)
      const copy = new Uint8Array(data.length)
      copy.set(data)
      frames.push({ data: copy.buffer, delay: frameInterval * 1000 })

      callbacks.onProgress((i + 1) / totalFrames, t - startTime)
    }

    if (frames.length === 0) {
      callbacks.onError(t('error.noFrames'))
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
    video.currentTime = originalTime
    await waitForSeek(video).catch(() => {})
    if (wasPlaying)
      video.play()
  }
}

function formatSeekTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`)
  return `${pad(m)}m${pad(s)}s`
}
