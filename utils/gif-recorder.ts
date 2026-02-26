import { GIFEncoder, quantize, applyPalette } from 'gifenc';
import type { Settings } from './types';

export interface GifRecordingCallbacks {
  onProgress: (fraction: number, elapsed: number) => void;
  onComplete: (blob: Blob, frameCount: number) => void;
  onError: (error: string) => void;
}

let abortController: AbortController | null = null;

export function isRecording(): boolean {
  return abortController !== null;
}

export function stopRecording(): void {
  abortController?.abort();
}

export async function recordGif(
  video: HTMLVideoElement,
  settings: Settings,
  callbacks: GifRecordingCallbacks,
): Promise<void> {
  if (abortController) {
    callbacks.onError('正在录制中...');
    return;
  }

  abortController = new AbortController();
  const { signal } = abortController;

  const duration = settings.gifDuration * 1000;
  const fps = settings.gifFps;
  const frameInterval = 1000 / fps;

  const maxDim = 480;
  let w = video.videoWidth;
  let h = video.videoHeight;
  if (w > maxDim || h > maxDim) {
    const scale = maxDim / Math.max(w, h);
    w = Math.round(w * scale);
    h = Math.round(h * scale);
  }
  w = w & ~1;
  h = h & ~1;

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  const gif = GIFEncoder();
  const totalFrames = Math.ceil(duration / frameInterval);
  let framesCaptured = 0;

  try {
    for (let i = 0; i < totalFrames; i++) {
      if (signal.aborted) break;

      ctx.drawImage(video, 0, 0, w, h);
      const imageData = ctx.getImageData(0, 0, w, h);

      const palette = quantize(imageData.data, 256);
      const index = applyPalette(imageData.data, palette);
      gif.writeFrame(index, w, h, { palette, delay: frameInterval });

      framesCaptured++;
      callbacks.onProgress((i + 1) / totalFrames, ((i + 1) * frameInterval) / 1000);

      await new Promise((r) => setTimeout(r, frameInterval));
    }

    gif.finish();
    const bytes = gif.bytes();
    const copy = new Uint8Array(bytes.length);
    copy.set(bytes);
    const blob = new Blob([copy], { type: 'image/gif' });
    callbacks.onComplete(blob, framesCaptured);
  } catch (err) {
    callbacks.onError(err instanceof Error ? err.message : 'GIF录制失败');
  } finally {
    abortController = null;
  }
}
