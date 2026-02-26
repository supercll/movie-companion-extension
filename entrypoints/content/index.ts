import './style.css';
import { createApp, type ComponentPublicInstance } from 'vue';
import hotkeys from 'hotkeys-js';
import { findVideo, captureVideoFrame, getTimestamp } from '@/utils/video';
import { recordGif, isRecording } from '@/utils/gif-recorder';
import { screenshotAtTime, screenshotAtPoints, recordGifAtRange } from '@/utils/video-seek';
import { downloadDataUrl, downloadBlob } from '@/utils/downloader';
import { presetsStorage, settingsStorage } from '@/utils/storage';
import type { Settings, Preset } from '@/utils/types';
import { DEFAULT_SETTINGS, DEFAULT_PRESETS } from '@/utils/constants';
import ContentOverlay from './components/ContentOverlay.vue';

interface OverlayInstance {
  showToast: (text: string, type: string) => void;
  showPreview: (url: string, filename: string, isBlob?: boolean) => void;
  showRecording: (show: boolean, progress?: number, elapsed?: number, total?: number) => void;
  showFlash: () => void;
  showHint: (text: string) => void;
}

export default defineContentScript({
  matches: ['<all_urls>'],
  cssInjectionMode: 'ui',

  async main(ctx) {
    let settings: Settings = { ...DEFAULT_SETTINGS };
    let presets: Preset[] = [...DEFAULT_PRESETS];

    settings = (await settingsStorage.getValue()) ?? DEFAULT_SETTINGS;
    presets = (await presetsStorage.getValue()) ?? DEFAULT_PRESETS;

    settingsStorage.watch((newVal) => {
      if (newVal) settings = newVal;
    });
    presetsStorage.watch((newVal) => {
      if (newVal) presets = newVal;
    });

    // --- UI Overlay (Vue) ---
    let overlay: OverlayInstance | null = null;

    const ui = await createShadowRootUi(ctx, {
      name: 'movie-companion-overlay',
      position: 'inline',
      anchor: 'body',
      append: 'last',
      onMount(container) {
        const wrapper = document.createElement('div');
        container.append(wrapper);
        const app = createApp(ContentOverlay, {
          onSave(url: string, filename: string) {
            downloadDataUrl(url, filename);
          },
        });
        const vm = app.mount(wrapper) as ComponentPublicInstance & OverlayInstance;
        overlay = vm;
        return app;
      },
      onRemove(app) {
        app?.unmount();
        overlay = null;
      },
    });
    ui.mount();

    // --- Actions ---
    function takeScreenshot() {
      const video = findVideo();
      if (!video) {
        overlay?.showToast('未找到视频元素', 'error');
        return;
      }
      overlay?.showFlash();
      const format = settings.imageFormat || 'png';
      const { dataUrl } = captureVideoFrame(video, format, settings.jpegQuality);
      const ext = format === 'jpeg' ? 'jpg' : format;
      const filename = `movie-companion-${getTimestamp()}.${ext}`;
      overlay?.showPreview(dataUrl, filename);
      overlay?.showToast('截图成功！', 'success');
    }

    async function burstCapture() {
      const video = findVideo();
      if (!video) {
        overlay?.showToast('未找到视频元素', 'error');
        return;
      }
      const count = 5;
      overlay?.showToast(`连拍开始 (${count}张)...`, 'recording');

      for (let i = 0; i < count; i++) {
        await new Promise((r) => setTimeout(r, 500));
        overlay?.showFlash();
        const format = settings.imageFormat || 'png';
        const { dataUrl } = captureVideoFrame(video, format, settings.jpegQuality);
        const ext = format === 'jpeg' ? 'jpg' : format;
        const filename = `movie-companion-burst-${getTimestamp()}-${i + 1}.${ext}`;
        downloadDataUrl(dataUrl, filename);
      }
      overlay?.showToast(`连拍完成！已保存 ${count} 张图片`, 'success');
    }

    async function startGifRecording() {
      const video = findVideo();
      if (!video) {
        overlay?.showToast('未找到视频元素', 'error');
        return;
      }
      if (isRecording()) {
        overlay?.showToast('正在录制中...', 'error');
        return;
      }

      overlay?.showRecording(true, 0, 0, settings.gifDuration);
      overlay?.showToast(`录制GIF中 (${settings.gifDuration}秒)...`, 'recording');

      await recordGif(video, settings, {
        onProgress(fraction, elapsed) {
          overlay?.showRecording(true, fraction, elapsed, settings.gifDuration);
        },
        onComplete(blob, frameCount) {
          overlay?.showRecording(false);
          const filename = `movie-companion-${getTimestamp()}.gif`;
          const url = URL.createObjectURL(blob);
          overlay?.showPreview(url, filename, true);
          overlay?.showToast(`GIF录制完成！(${frameCount}帧)`, 'success');
        },
        onError(error) {
          overlay?.showRecording(false);
          overlay?.showToast(error, 'error');
        },
      });
    }

    async function timedScreenshot(time: number) {
      const video = findVideo();
      if (!video) {
        overlay?.showToast('未找到视频元素', 'error');
        return;
      }
      overlay?.showToast(`正在跳转到指定时间截图...`, 'info');
      try {
        const { dataUrl, filename } = await screenshotAtTime(video, time, settings);
        overlay?.showFlash();
        overlay?.showPreview(dataUrl, filename);
        overlay?.showToast('定时截图成功！', 'success');
      } catch (err) {
        overlay?.showToast(err instanceof Error ? err.message : '定时截图失败', 'error');
      }
    }

    async function timedScreenshotPoints(times: number[]) {
      const video = findVideo();
      if (!video) {
        overlay?.showToast('未找到视频元素', 'error');
        return;
      }
      overlay?.showToast(`正在截取 ${times.length} 个时间点...`, 'recording');
      try {
        const results = await screenshotAtPoints(video, times, settings, (current, total) => {
          overlay?.showToast(`截图进度: ${current}/${total}`, 'recording');
        });
        for (const { dataUrl, filename } of results) {
          overlay?.showFlash();
          downloadDataUrl(dataUrl, filename);
        }
        overlay?.showToast(`完成！已保存 ${results.length} 张截图`, 'success');
      } catch (err) {
        overlay?.showToast(err instanceof Error ? err.message : '批量截图失败', 'error');
      }
    }

    async function timedGifRecording(start: number, end: number) {
      const video = findVideo();
      if (!video) {
        overlay?.showToast('未找到视频元素', 'error');
        return;
      }
      if (isRecording()) {
        overlay?.showToast('正在录制中...', 'error');
        return;
      }
      const duration = end - start;
      overlay?.showRecording(true, 0, 0, duration);
      overlay?.showToast(`录制指定时间段GIF (${duration.toFixed(1)}秒)...`, 'recording');

      await recordGifAtRange(video, start, end, settings, {
        onProgress(fraction, elapsed) {
          overlay?.showRecording(true, fraction, elapsed, duration);
        },
        onComplete(blob, frameCount) {
          overlay?.showRecording(false);
          const filename = `movie-companion-${getTimestamp()}.gif`;
          const url = URL.createObjectURL(blob);
          overlay?.showPreview(url, filename, true);
          overlay?.showToast(`GIF录制完成！(${frameCount}帧)`, 'success');
        },
        onError(error) {
          overlay?.showRecording(false);
          overlay?.showToast(error, 'error');
        },
      });
    }

    function executeAction(action: string) {
      switch (action) {
        case 'screenshot': takeScreenshot(); break;
        case 'gif': startGifRecording(); break;
        case 'burst': burstCapture(); break;
      }
    }

    // --- Keyboard Shortcuts (hotkeys-js) ---
    hotkeys.filter = () => true;
    hotkeys('alt+s', (e) => {
      e.preventDefault();
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
      takeScreenshot();
    });
    hotkeys('alt+g', (e) => {
      e.preventDefault();
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
      startGifRecording();
    });
    hotkeys('alt+b', (e) => {
      e.preventDefault();
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
      burstCapture();
    });

    // --- Input Monitor for Preset Triggers ---
    function isInputElement(el: Element | null): boolean {
      if (!el) return false;
      const tag = el.tagName.toLowerCase();
      return tag === 'input' || tag === 'textarea' || (el as HTMLElement).isContentEditable;
    }

    function getInputValue(el: Element): string {
      if ((el as HTMLInputElement).value !== undefined) return (el as HTMLInputElement).value.trim();
      if ((el as HTMLElement).isContentEditable) return (el as HTMLElement).textContent?.trim() ?? '';
      return '';
    }

    function clearInput(el: Element) {
      if ((el as HTMLInputElement).value !== undefined) {
        (el as HTMLInputElement).value = '';
      } else if ((el as HTMLElement).isContentEditable) {
        (el as HTMLElement).textContent = '';
      }
    }

    document.addEventListener('input', (e) => {
      const target = e.target as Element;
      if (!isInputElement(target)) return;
      const value = getInputValue(target);
      if (!value) return;

      const labels: Record<string, string> = { screenshot: '截图', gif: '录制GIF', burst: '连拍' };
      const matched = presets.find((p) => value === p.trigger);
      if (matched) {
        overlay?.showHint(`按 Enter 执行: ${labels[matched.action]}`);
        return;
      }
      const partial = presets.find((p) => p.trigger.startsWith(value) && value.length > 0);
      if (partial) {
        overlay?.showHint(`输入 "${partial.trigger}" → ${labels[partial.action]}`);
      }
    }, true);

    document.addEventListener('keydown', (e) => {
      const target = e.target as Element;
      if (e.key !== 'Enter' || !isInputElement(target)) return;
      const value = getInputValue(target);
      const matched = presets.find((p) => value === p.trigger);
      if (matched) {
        e.preventDefault();
        e.stopPropagation();
        clearInput(target);
        executeAction(matched.action);
      }
    }, true);

    // --- Message Listener (from popup) ---
    browser.runtime.onMessage.addListener((message: Record<string, unknown>, _sender, sendResponse) => {
      switch (message.action) {
        case 'screenshot':
          if (message.settings) settings = { ...settings, ...(message.settings as Partial<Settings>) };
          takeScreenshot();
          sendResponse({ success: true });
          break;
        case 'gif':
          if (message.settings) settings = { ...settings, ...(message.settings as Partial<Settings>) };
          startGifRecording();
          sendResponse({ success: true });
          break;
        case 'burst':
          if (message.settings) settings = { ...settings, ...(message.settings as Partial<Settings>) };
          burstCapture();
          sendResponse({ success: true });
          break;
        case 'timedScreenshot':
          if (message.settings) settings = { ...settings, ...(message.settings as Partial<Settings>) };
          timedScreenshot(message.time as number);
          sendResponse({ success: true });
          break;
        case 'timedScreenshotPoints':
          if (message.settings) settings = { ...settings, ...(message.settings as Partial<Settings>) };
          timedScreenshotPoints(message.times as number[]);
          sendResponse({ success: true });
          break;
        case 'timedGif':
          if (message.settings) settings = { ...settings, ...(message.settings as Partial<Settings>) };
          timedGifRecording(message.start as number, message.end as number);
          sendResponse({ success: true });
          break;
        case 'checkVideo': {
          const video = findVideo();
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
          );
          break;
        }
      }
      return true;
    });
  },
});
