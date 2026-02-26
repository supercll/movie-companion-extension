export function findVideo(): HTMLVideoElement | null {
  const videos = Array.from(document.querySelectorAll('video'));

  let best: HTMLVideoElement | null = null;
  let bestArea = 0;

  for (const v of videos) {
    if (v.videoWidth === 0 || v.videoHeight === 0) continue;
    const rect = v.getBoundingClientRect();
    const area = rect.width * rect.height;
    if (area > bestArea) {
      bestArea = area;
      best = v;
    }
  }

  if (best) return best;

  // Fallback: check shadow DOMs
  for (const el of document.querySelectorAll('*')) {
    if (el.shadowRoot) {
      const shadowVideo = el.shadowRoot.querySelector('video');
      if (shadowVideo && shadowVideo.videoWidth > 0) return shadowVideo;
    }
  }

  return null;
}

export function captureVideoFrame(
  video: HTMLVideoElement,
  format: string = 'png',
  quality: number = 92,
): { dataUrl: string; width: number; height: number } {
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  const mimeType = `image/${format === 'jpg' ? 'jpeg' : format}`;
  const q = format === 'jpeg' ? quality / 100 : undefined;
  const dataUrl = canvas.toDataURL(mimeType, q);

  return { dataUrl, width: canvas.width, height: canvas.height };
}

export function getTimestamp(): string {
  const now = new Date();
  const pad = (n: number) => (n < 10 ? '0' + n : '' + n);
  return [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate()),
    '-',
    pad(now.getHours()),
    pad(now.getMinutes()),
    pad(now.getSeconds()),
  ].join('');
}
