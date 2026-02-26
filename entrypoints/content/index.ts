import type { ComponentPublicInstance } from 'vue'
import type { Settings } from '@/utils/types'
import type { VideoFormat } from '@/utils/video-recorder'
import hotkeys from 'hotkeys-js'
import { createApp } from 'vue'
import { DEFAULT_SETTINGS } from '@/utils/constants'
import { downloadBlob, downloadDataUrl } from '@/utils/downloader'
import { isRecording, recordGif, stopRecording as stopGifRecording } from '@/utils/gif-recorder'
import { i18n, resolveLocale, setLocale, t } from '@/utils/i18n'
import { settingsStorage } from '@/utils/storage'
import { captureVideoFrame, findVideo, getTimestamp } from '@/utils/video'
import { getFormatExtension, isVideoRecording, startVideoRecording, stopVideoRecording } from '@/utils/video-recorder'
import { recordGifAtRange, screenshotAtPoints, screenshotAtTime } from '@/utils/video-seek'
import ContentOverlay from './components/ContentOverlay.vue'
import './style.css'

interface OverlayInstance {
  showToast: (text: string, type: string) => void
  showPreview: (url: string, filename: string, isBlob?: boolean) => void
  showRecording: (show: boolean, progress?: number, elapsed?: number, total?: number) => void
  showFlash: () => void
}

export default defineContentScript({
  matches: ['<all_urls>'],
  cssInjectionMode: 'ui',

  async main(ctx) {
    let settings: Settings = { ...DEFAULT_SETTINGS }

    settings = (await settingsStorage.getValue()) ?? DEFAULT_SETTINGS
    setLocale(resolveLocale(settings.locale))

    settingsStorage.watch((newVal) => {
      if (newVal) {
        settings = newVal
        setLocale(resolveLocale(newVal.locale))
      }
    })

    // --- UI Overlay (Vue) ---
    let overlay: OverlayInstance | null = null

    const ui = await createShadowRootUi(ctx, {
      name: 'movie-companion-overlay',
      position: 'inline',
      anchor: 'body',
      append: 'last',
      onMount(container) {
        const wrapper = document.createElement('div')
        container.append(wrapper)
        const app = createApp(ContentOverlay, {
          onSave(url: string, filename: string) {
            downloadDataUrl(url, filename)
          },
          onStopRecording() {
            if (isRecording()) {
              stopGifRecording()
            }
            else if (isVideoRecording()) {
              stopVideoRecording()
            }
          },
        })
        app.use(i18n)
        const vm = app.mount(wrapper) as ComponentPublicInstance & OverlayInstance
        overlay = vm
        return app
      },
      onRemove(app) {
        app?.unmount()
        overlay = null
      },
    })
    ui.mount()

    // --- Actions ---
    function takeScreenshot() {
      const video = findVideo()
      if (!video) {
        overlay?.showToast(t('toast.noVideo'), 'error')
        return
      }
      overlay?.showFlash()
      const format = settings.imageFormat || 'png'
      const { dataUrl } = captureVideoFrame(video, format, settings.jpegQuality)
      const ext = format === 'jpeg' ? 'jpg' : format
      const filename = `movie-companion-${getTimestamp()}.${ext}`
      overlay?.showPreview(dataUrl, filename)
      overlay?.showToast(t('toast.screenshotOk'), 'success')
    }

    async function burstCapture() {
      const video = findVideo()
      if (!video) {
        overlay?.showToast(t('toast.noVideo'), 'error')
        return
      }
      const count = 5
      overlay?.showToast(t('toast.burstStart', { n: count }), 'recording')

      for (let i = 0; i < count; i++) {
        await new Promise(r => setTimeout(r, 500))
        overlay?.showFlash()
        const format = settings.imageFormat || 'png'
        const { dataUrl } = captureVideoFrame(video, format, settings.jpegQuality)
        const ext = format === 'jpeg' ? 'jpg' : format
        const filename = `movie-companion-burst-${getTimestamp()}-${i + 1}.${ext}`
        downloadDataUrl(dataUrl, filename)
      }
      overlay?.showToast(t('toast.burstDone', { n: count }), 'success')
    }

    async function startGifRecording() {
      const video = findVideo()
      if (!video) {
        overlay?.showToast(t('toast.noVideo'), 'error')
        return
      }
      if (isRecording()) {
        overlay?.showToast(t('toast.recording'), 'error')
        return
      }

      overlay?.showRecording(true, 0, 0, settings.gifDuration)
      overlay?.showToast(t('toast.gifRecording', { n: settings.gifDuration }), 'recording')

      await recordGif(video, settings, {
        onProgress(fraction, elapsed) {
          overlay?.showRecording(true, fraction, elapsed, settings.gifDuration)
        },
        onComplete(blob, frameCount) {
          overlay?.showRecording(false)
          const filename = `movie-companion-${getTimestamp()}.gif`
          const url = URL.createObjectURL(blob)
          overlay?.showPreview(url, filename, true)
          overlay?.showToast(t('toast.gifDone', { n: frameCount }), 'success')
        },
        onError(error) {
          overlay?.showRecording(false)
          overlay?.showToast(error, 'error')
        },
      })
    }

    async function timedScreenshot(time: number) {
      const video = findVideo()
      if (!video) {
        overlay?.showToast(t('toast.noVideo'), 'error')
        return
      }
      overlay?.showToast(t('toast.timedSeek'), 'info')
      try {
        const { dataUrl, filename } = await screenshotAtTime(video, time, settings)
        overlay?.showFlash()
        overlay?.showPreview(dataUrl, filename)
        overlay?.showToast(t('toast.timedScreenshotOk'), 'success')
      }
      catch (err) {
        overlay?.showToast(err instanceof Error ? err.message : t('toast.timedScreenshotFail'), 'error')
      }
    }

    async function timedScreenshotPoints(times: number[]) {
      const video = findVideo()
      if (!video) {
        overlay?.showToast(t('toast.noVideo'), 'error')
        return
      }
      overlay?.showToast(t('toast.batchCapturing', { n: times.length }), 'recording')
      try {
        const results = await screenshotAtPoints(video, times, settings, (current, total) => {
          overlay?.showToast(t('toast.batchProgress', { current, total }), 'recording')
        })
        for (const { dataUrl, filename } of results) {
          overlay?.showFlash()
          downloadDataUrl(dataUrl, filename)
        }
        overlay?.showToast(t('toast.batchDone', { n: results.length }), 'success')
      }
      catch (err) {
        overlay?.showToast(err instanceof Error ? err.message : t('toast.batchFail'), 'error')
      }
    }

    async function timedGifRecording(start: number, end: number) {
      const video = findVideo()
      if (!video) {
        overlay?.showToast(t('toast.noVideo'), 'error')
        return
      }
      if (isRecording()) {
        overlay?.showToast(t('toast.recording'), 'error')
        return
      }
      const duration = end - start
      overlay?.showRecording(true, 0, 0, duration)
      overlay?.showToast(t('toast.timedGifRecording', { n: duration.toFixed(1) }), 'recording')

      await recordGifAtRange(video, start, end, settings, {
        onProgress(fraction, elapsed) {
          overlay?.showRecording(true, fraction, elapsed, duration)
        },
        onComplete(blob, frameCount) {
          overlay?.showRecording(false)
          const filename = `movie-companion-${getTimestamp()}.gif`
          const url = URL.createObjectURL(blob)
          overlay?.showPreview(url, filename, true)
          overlay?.showToast(t('toast.gifDone', { n: frameCount }), 'success')
        },
        onError(error) {
          overlay?.showRecording(false)
          overlay?.showToast(error, 'error')
        },
      })
    }

    function recordVideo() {
      const video = findVideo()
      if (!video) {
        overlay?.showToast(t('toast.noVideo'), 'error')
        return
      }
      if (isVideoRecording()) {
        stopVideoRecording()
        overlay?.showToast(t('toast.stoppingRecord'), 'info')
        return
      }

      overlay?.showRecording(true, 0, 0, settings.videoDuration)
      overlay?.showToast(t('toast.videoRecording', { n: settings.videoDuration }), 'recording')

      startVideoRecording(video, settings, {
        onProgress(elapsed, total) {
          overlay?.showRecording(true, elapsed / total, elapsed, total)
        },
        onComplete(blob, duration) {
          overlay?.showRecording(false)
          const fmt = (settings.videoFormat === 'auto' ? 'webm' : settings.videoFormat) as VideoFormat
          const ext = getFormatExtension(fmt)
          const filename = `movie-companion-${getTimestamp()}.${ext}`
          downloadBlob(blob, filename)
          overlay?.showToast(t('toast.videoDone', { n: duration.toFixed(1) }), 'success')
        },
        onError(error) {
          overlay?.showRecording(false)
          overlay?.showToast(error, 'error')
        },
      })
    }

    function _executeAction(action: string) {
      switch (action) {
        case 'screenshot':
          takeScreenshot()
          break
        case 'gif':
          startGifRecording()
          break
        case 'burst':
          burstCapture()
          break
        case 'video':
          recordVideo()
          break
      }
    }

    // --- Keyboard Shortcuts (hotkeys-js) ---
    hotkeys.filter = () => true
    hotkeys('alt+s', (e) => {
      e.preventDefault()
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA')
        return
      takeScreenshot()
    })
    hotkeys('alt+g', (e) => {
      e.preventDefault()
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA')
        return
      startGifRecording()
    })
    hotkeys('alt+b', (e) => {
      e.preventDefault()
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA')
        return
      burstCapture()
    })
    hotkeys('alt+v', (e) => {
      e.preventDefault()
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA')
        return
      recordVideo()
    })

    // --- Message Listener (from popup) ---
    browser.runtime.onMessage.addListener((message: Record<string, unknown>, _sender, sendResponse) => {
      switch (message.action) {
        case 'screenshot':
          if (message.settings)
            settings = { ...settings, ...(message.settings as Partial<Settings>) }
          takeScreenshot()
          sendResponse({ success: true })
          break
        case 'gif':
          if (message.settings)
            settings = { ...settings, ...(message.settings as Partial<Settings>) }
          startGifRecording()
          sendResponse({ success: true })
          break
        case 'burst':
          if (message.settings)
            settings = { ...settings, ...(message.settings as Partial<Settings>) }
          burstCapture()
          sendResponse({ success: true })
          break
        case 'timedScreenshot':
          if (message.settings)
            settings = { ...settings, ...(message.settings as Partial<Settings>) }
          timedScreenshot(message.time as number)
          sendResponse({ success: true })
          break
        case 'timedScreenshotPoints':
          if (message.settings)
            settings = { ...settings, ...(message.settings as Partial<Settings>) }
          timedScreenshotPoints(message.times as number[])
          sendResponse({ success: true })
          break
        case 'timedGif':
          if (message.settings)
            settings = { ...settings, ...(message.settings as Partial<Settings>) }
          timedGifRecording(message.start as number, message.end as number)
          sendResponse({ success: true })
          break
        case 'video':
          if (message.settings)
            settings = { ...settings, ...(message.settings as Partial<Settings>) }
          recordVideo()
          sendResponse({ success: true })
          break
        case 'stopVideo':
          stopVideoRecording()
          sendResponse({ success: true })
          break
        case 'timedVideo': {
          if (message.settings)
            settings = { ...settings, ...(message.settings as Partial<Settings>) }
          const tvideo = findVideo()
          if (!tvideo) {
            overlay?.showToast(t('toast.noVideo'), 'error')
            sendResponse({ success: false, error: t('toast.noVideoFound') })
            break
          }
          const tstart = message.start as number
          const tend = message.end as number
          const tdur = tend - tstart

          const wasPlaying = !tvideo.paused
          tvideo.currentTime = tstart
          tvideo.play()

          overlay?.showRecording(true, 0, 0, tdur)
          overlay?.showToast(t('toast.timedVideoRecording', { start: tstart.toFixed(1), end: tend.toFixed(1) }), 'recording')

          const overrideSettings = { ...settings, videoDuration: tdur }
          startVideoRecording(tvideo, overrideSettings, {
            onProgress(elapsed, total) {
              overlay?.showRecording(true, elapsed / total, elapsed, total)
            },
            onComplete(blob, duration) {
              overlay?.showRecording(false)
              if (wasPlaying)
                tvideo.play()
              else
                tvideo.pause()
              const fmt = (settings.videoFormat === 'auto' ? 'webm' : settings.videoFormat) as VideoFormat
              const ext = getFormatExtension(fmt)
              const filename = `movie-companion-${getTimestamp()}.${ext}`
              downloadBlob(blob, filename)
              overlay?.showToast(t('toast.videoDone', { n: duration.toFixed(1) }), 'success')
            },
            onError(error) {
              overlay?.showRecording(false)
              if (wasPlaying)
                tvideo.play()
              else
                tvideo.pause()
              overlay?.showToast(error, 'error')
            },
          })
          sendResponse({ success: true })
          break
        }
        case 'checkVideo': {
          const video = findVideo()
          sendResponse(
            video
              ? {
                  hasVideo: true,
                  videoWidth: video.videoWidth,
                  videoHeight: video.videoHeight,
                  duration: video.duration || 0,
                  currentTime: video.currentTime || 0,
                }
              : { hasVideo: false },
          )
          break
        }
      }
      return true
    })
  },
})
