(function() {
  'use strict';

  if (window.__movieCompanionLoaded) return;
  window.__movieCompanionLoaded = true;

  const DEFAULT_PRESETS = [
    { trigger: '截图', action: 'screenshot' },
    { trigger: 'cap', action: 'screenshot' },
    { trigger: '录制', action: 'gif' },
    { trigger: 'gif', action: 'gif' },
    { trigger: '连拍', action: 'burst' },
  ];

  let presets = DEFAULT_PRESETS;
  let settings = {
    gifDuration: 3,
    gifFps: 10,
    gifQuality: 15,
    imageFormat: 'png',
    jpegQuality: 92,
  };

  let isRecordingGif = false;

  init();

  function init() {
    loadPresets();
    loadSettings();
    setupMessageListener();
    setupInputMonitor();
    setupKeyboardShortcuts();
  }

  async function loadPresets() {
    try {
      const data = await chrome.storage.local.get('presets');
      if (data.presets) presets = data.presets;
    } catch {}
  }

  async function loadSettings() {
    try {
      const data = await chrome.storage.local.get([
        'gifDuration', 'gifFps', 'gifQuality', 'imageFormat', 'jpegQuality'
      ]);
      Object.assign(settings, data);
    } catch {}
  }

  function setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      switch (message.action) {
        case 'screenshot':
          if (message.settings) Object.assign(settings, message.settings);
          takeScreenshot();
          sendResponse({ success: true });
          break;
        case 'gif':
          if (message.settings) Object.assign(settings, message.settings);
          recordGif();
          sendResponse({ success: true });
          break;
        case 'burst':
          if (message.settings) Object.assign(settings, message.settings);
          burstCapture();
          sendResponse({ success: true });
          break;
        case 'checkVideo':
          const video = findVideo();
          if (video) {
            sendResponse({
              hasVideo: true,
              videoWidth: video.videoWidth,
              videoHeight: video.videoHeight,
            });
          } else {
            sendResponse({ hasVideo: false });
          }
          break;
        case 'updatePresets':
          if (message.presets) presets = message.presets;
          sendResponse({ success: true });
          break;
        case 'updateSettings':
          Object.assign(settings, message);
          sendResponse({ success: true });
          break;
      }
      return true;
    });
  }

  function setupInputMonitor() {
    document.addEventListener('input', handleInput, true);
    document.addEventListener('keydown', handleInputKeydown, true);
  }

  function handleInput(e) {
    const target = e.target;
    if (!isInputElement(target)) return;

    const value = (target.value || target.textContent || '').trim();
    checkPresetTrigger(value, target);
  }

  function handleInputKeydown(e) {
    if (e.key !== 'Enter') return;
    const target = e.target;
    if (!isInputElement(target)) return;

    const value = (target.value || target.textContent || '').trim();
    const matched = presets.find(p => value === p.trigger);
    if (matched) {
      e.preventDefault();
      e.stopPropagation();
      clearInput(target);
      executeAction(matched.action);
    }
  }

  function isInputElement(el) {
    if (!el) return false;
    const tag = el.tagName.toLowerCase();
    return tag === 'input' || tag === 'textarea' || el.isContentEditable;
  }

  function clearInput(el) {
    if (el.value !== undefined) {
      el.value = '';
    } else if (el.isContentEditable) {
      el.textContent = '';
    }
  }

  let hintTimeout;
  function checkPresetTrigger(value, target) {
    if (!value) return;

    const matched = presets.find(p => value === p.trigger);
    if (matched) {
      showCommandHint(`按 Enter 执行: ${getActionLabel(matched.action)}`);
      return;
    }

    const partial = presets.find(p => p.trigger.startsWith(value) && value.length > 0);
    if (partial) {
      showCommandHint(`输入 "${partial.trigger}" → ${getActionLabel(partial.action)}`);
    } else {
      removeCommandHint();
    }
  }

  function getActionLabel(action) {
    switch (action) {
      case 'screenshot': return '截图';
      case 'gif': return '录制GIF';
      case 'burst': return '连拍';
      default: return action;
    }
  }

  function executeAction(action) {
    switch (action) {
      case 'screenshot':
        takeScreenshot();
        break;
      case 'gif':
        recordGif();
        break;
      case 'burst':
        burstCapture();
        break;
    }
  }

  function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      if (e.target && isInputElement(e.target)) return;

      if (e.altKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        takeScreenshot();
      } else if (e.altKey && e.key.toLowerCase() === 'g') {
        e.preventDefault();
        recordGif();
      } else if (e.altKey && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        burstCapture();
      }
    });
  }

  // --- Video Detection ---

  function findVideo() {
    const videos = Array.from(document.querySelectorAll('video'));

    // Prefer the largest visible playing video
    let best = null;
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

    // Fallback: check for video in shadow DOMs
    const allElements = document.querySelectorAll('*');
    for (const el of allElements) {
      if (el.shadowRoot) {
        const shadowVideo = el.shadowRoot.querySelector('video');
        if (shadowVideo && shadowVideo.videoWidth > 0) return shadowVideo;
      }
    }

    return null;
  }

  // --- Screenshot ---

  function takeScreenshot() {
    const video = findVideo();
    if (!video) {
      showToast('未找到视频元素', 'error');
      return;
    }

    showFlash();

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    let format = settings.imageFormat || 'png';
    let mimeType = `image/${format}`;
    if (format === 'jpg') {
      format = 'jpeg';
      mimeType = 'image/jpeg';
    }

    const quality = format === 'jpeg' ? (settings.jpegQuality || 92) / 100 : undefined;
    const dataUrl = canvas.toDataURL(mimeType, quality);

    const timestamp = getTimestamp();
    const filename = `movie-companion-${timestamp}.${format === 'jpeg' ? 'jpg' : format}`;

    showPreview(dataUrl, filename);
    showToast('截图成功！', 'success');
  }

  // --- Burst Capture ---

  async function burstCapture() {
    const video = findVideo();
    if (!video) {
      showToast('未找到视频元素', 'error');
      return;
    }

    const count = 5;
    const interval = 500;
    showToast(`连拍开始 (${count}张)...`, 'recording');

    for (let i = 0; i < count; i++) {
      await sleep(interval);
      showFlash();

      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const format = settings.imageFormat || 'png';
      const mimeType = `image/${format === 'jpg' ? 'jpeg' : format}`;
      const quality = format === 'jpeg' ? (settings.jpegQuality || 92) / 100 : undefined;
      const dataUrl = canvas.toDataURL(mimeType, quality);

      const timestamp = getTimestamp();
      const ext = format === 'jpeg' ? 'jpg' : format;
      const filename = `movie-companion-burst-${timestamp}-${i + 1}.${ext}`;

      downloadDataUrl(dataUrl, filename);
    }

    showToast(`连拍完成！已保存 ${count} 张图片`, 'success');
  }

  // --- GIF Recording ---

  async function recordGif() {
    if (isRecordingGif) {
      showToast('正在录制中...', 'error');
      return;
    }

    const video = findVideo();
    if (!video) {
      showToast('未找到视频元素', 'error');
      return;
    }

    if (typeof GIFEncoder === 'undefined') {
      showToast('GIF编码器未加载', 'error');
      return;
    }

    isRecordingGif = true;
    const duration = (settings.gifDuration || 3) * 1000;
    const fps = settings.gifFps || 10;
    const quality = settings.gifQuality || 15;
    const frameInterval = 1000 / fps;

    const maxDim = 480;
    let w = video.videoWidth;
    let h = video.videoHeight;
    if (w > maxDim || h > maxDim) {
      const scale = maxDim / Math.max(w, h);
      w = Math.round(w * scale);
      h = Math.round(h * scale);
    }
    // Ensure even dimensions
    w = w & ~1;
    h = h & ~1;

    const indicator = showRecordingIndicator(duration);
    showToast(`录制GIF中 (${settings.gifDuration}秒)...`, 'recording');

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');

    const encoder = new GIFEncoder(w, h);
    encoder.setRepeat(0);
    encoder.setDelay(frameInterval);
    encoder.setQuality(quality);
    encoder.start();

    const totalFrames = Math.ceil(duration / frameInterval);
    let framesCaptures = 0;

    for (let i = 0; i < totalFrames; i++) {
      if (!isRecordingGif) break;

      ctx.drawImage(video, 0, 0, w, h);
      const imageData = ctx.getImageData(0, 0, w, h);
      encoder.addFrame(imageData.data);
      framesCaptures++;

      updateRecordingIndicator(indicator, (i + 1) / totalFrames);
      await sleep(frameInterval);
    }

    encoder.finish();
    isRecordingGif = false;
    removeRecordingIndicator(indicator);

    const blob = encoder.getBlob();
    const url = URL.createObjectURL(blob);
    const timestamp = getTimestamp();
    const filename = `movie-companion-${timestamp}.gif`;

    showPreview(url, filename, true);
    showToast(`GIF录制完成！(${framesCaptures}帧)`, 'success');
  }

  // --- UI Helpers ---

  function showToast(text, type = 'info') {
    removeAllToasts();

    const toast = document.createElement('div');
    toast.className = `mc-toast ${type}`;

    const icons = {
      success: '✅',
      error: '❌',
      recording: '🔴',
      info: '🎬',
    };

    toast.innerHTML = `
      <span class="mc-toast-icon">${icons[type] || icons.info}</span>
      <span class="mc-toast-text">${text}</span>
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'mc-slide-out 0.3s ease-in forwards';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  function removeAllToasts() {
    document.querySelectorAll('.mc-toast').forEach(t => t.remove());
  }

  function showFlash() {
    const flash = document.createElement('div');
    flash.className = 'mc-screenshot-flash';
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 300);
  }

  function showPreview(url, filename, isBlob = false) {
    document.querySelectorAll('.mc-preview').forEach(p => p.remove());

    const preview = document.createElement('div');
    preview.className = 'mc-preview';
    preview.innerHTML = `
      <img src="${url}" alt="preview" />
      <div class="mc-preview-actions">
        <button class="mc-preview-btn save">保存</button>
        <button class="mc-preview-btn close">关闭</button>
      </div>
    `;

    document.body.appendChild(preview);

    preview.querySelector('.save').addEventListener('click', (e) => {
      e.stopPropagation();
      downloadDataUrl(url, filename);
      preview.remove();
    });

    preview.querySelector('.close').addEventListener('click', (e) => {
      e.stopPropagation();
      if (isBlob) URL.revokeObjectURL(url);
      preview.remove();
    });

    setTimeout(() => {
      if (preview.parentNode) {
        if (isBlob) URL.revokeObjectURL(url);
        preview.style.animation = 'mc-slide-out 0.3s ease-in forwards';
        setTimeout(() => preview.remove(), 300);
      }
    }, 15000);
  }

  function showRecordingIndicator(duration) {
    const indicator = document.createElement('div');
    indicator.className = 'mc-recording-indicator';
    indicator.innerHTML = `
      <span class="mc-recording-dot"></span>
      <span>REC</span>
      <span class="mc-rec-time">0.0s / ${(duration / 1000).toFixed(1)}s</span>
    `;
    document.body.appendChild(indicator);

    const startTime = Date.now();
    indicator._interval = setInterval(() => {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      const timeEl = indicator.querySelector('.mc-rec-time');
      if (timeEl) {
        timeEl.textContent = `${elapsed}s / ${(duration / 1000).toFixed(1)}s`;
      }
    }, 100);

    return indicator;
  }

  function updateRecordingIndicator(indicator, progress) {
    // progress bar could be added here if needed
  }

  function removeRecordingIndicator(indicator) {
    if (indicator) {
      clearInterval(indicator._interval);
      indicator.remove();
    }
  }

  function showCommandHint(text) {
    removeCommandHint();
    const hint = document.createElement('div');
    hint.className = 'mc-command-hint';
    hint.textContent = text;
    document.body.appendChild(hint);

    clearTimeout(hintTimeout);
    hintTimeout = setTimeout(removeCommandHint, 3000);
  }

  function removeCommandHint() {
    document.querySelectorAll('.mc-command-hint').forEach(h => h.remove());
  }

  // --- Download ---

  function downloadDataUrl(dataUrl, filename) {
    try {
      chrome.runtime.sendMessage({
        action: 'download',
        url: dataUrl,
        filename: `MovieCompanion/${filename}`,
        saveAs: false,
      });
    } catch {
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = filename;
      a.click();
    }
  }

  // --- Utilities ---

  function getTimestamp() {
    const now = new Date();
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

  function pad(n) {
    return n < 10 ? '0' + n : '' + n;
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

})();
