const DEFAULT_PRESETS = [
  { trigger: '截图', action: 'screenshot' },
  { trigger: 'cap', action: 'screenshot' },
  { trigger: '录制', action: 'gif' },
  { trigger: 'gif', action: 'gif' },
  { trigger: '连拍', action: 'burst' },
];

const ACTION_LABELS = {
  screenshot: '截图',
  gif: '录制GIF',
  burst: '连拍(5张)',
};

let presets = [];

document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  await loadPresets();
  bindEvents();
  checkVideoStatus();
});

async function loadSettings() {
  const data = await chrome.storage.local.get([
    'gifDuration', 'gifFps', 'gifQuality', 'imageFormat', 'jpegQuality'
  ]);

  if (data.gifDuration) {
    document.getElementById('gifDuration').value = data.gifDuration;
    document.getElementById('gifDurationVal').textContent = data.gifDuration + '秒';
  }
  if (data.gifFps) {
    document.getElementById('gifFps').value = data.gifFps;
    document.getElementById('gifFpsVal').textContent = data.gifFps;
  }
  if (data.gifQuality) {
    document.getElementById('gifQuality').value = data.gifQuality;
  }
  if (data.imageFormat) {
    document.getElementById('imageFormat').value = data.imageFormat;
  }
  if (data.jpegQuality) {
    document.getElementById('jpegQuality').value = data.jpegQuality;
    document.getElementById('jpegQualityVal').textContent = data.jpegQuality + '%';
  }
}

async function loadPresets() {
  const data = await chrome.storage.local.get('presets');
  presets = data.presets || DEFAULT_PRESETS;
  renderPresets();
}

function renderPresets() {
  const list = document.getElementById('presetList');
  list.innerHTML = '';

  presets.forEach((preset, index) => {
    const item = document.createElement('div');
    item.className = 'preset-item';
    item.innerHTML = `
      <span class="trigger">${preset.trigger}</span>
      <span class="action-label">${ACTION_LABELS[preset.action]}</span>
      <button class="btn-remove" data-index="${index}">&times;</button>
    `;
    list.appendChild(item);
  });
}

async function savePresets() {
  await chrome.storage.local.set({ presets });
  notifyContentScript('updatePresets', { presets });
}

function bindEvents() {
  document.getElementById('btnScreenshot').addEventListener('click', () => {
    sendCommand('screenshot');
  });

  document.getElementById('btnGif').addEventListener('click', () => {
    sendCommand('gif');
  });

  document.getElementById('btnBurst').addEventListener('click', () => {
    sendCommand('burst');
  });

  document.getElementById('btnPreset').addEventListener('click', () => {
    const panel = document.getElementById('presetsPanel');
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
  });

  document.getElementById('btnAddPreset').addEventListener('click', addPreset);
  document.getElementById('newPresetTrigger').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addPreset();
  });

  document.getElementById('presetList').addEventListener('click', (e) => {
    if (e.target.classList.contains('btn-remove')) {
      const index = parseInt(e.target.dataset.index);
      presets.splice(index, 1);
      renderPresets();
      savePresets();
    }
  });

  const settingInputs = ['gifDuration', 'gifFps', 'gifQuality', 'imageFormat', 'jpegQuality'];
  settingInputs.forEach(id => {
    document.getElementById(id).addEventListener('input', saveSettings);
  });

  document.getElementById('gifDuration').addEventListener('input', (e) => {
    document.getElementById('gifDurationVal').textContent = e.target.value + '秒';
  });
  document.getElementById('gifFps').addEventListener('input', (e) => {
    document.getElementById('gifFpsVal').textContent = e.target.value;
  });
  document.getElementById('jpegQuality').addEventListener('input', (e) => {
    document.getElementById('jpegQualityVal').textContent = e.target.value + '%';
  });

  document.getElementById('btnHelp').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('helpModal').style.display = 'flex';
  });

  document.getElementById('btnCloseHelp').addEventListener('click', () => {
    document.getElementById('helpModal').style.display = 'none';
  });

  document.getElementById('btnShortcuts').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('helpModal').style.display = 'flex';
  });
}

function addPreset() {
  const trigger = document.getElementById('newPresetTrigger').value.trim();
  const action = document.getElementById('newPresetAction').value;

  if (!trigger) return;

  if (presets.some(p => p.trigger === trigger)) {
    showStatus('该触发词已存在', false);
    return;
  }

  presets.push({ trigger, action });
  renderPresets();
  savePresets();
  document.getElementById('newPresetTrigger').value = '';
}

async function saveSettings() {
  const settings = {
    gifDuration: parseInt(document.getElementById('gifDuration').value),
    gifFps: parseInt(document.getElementById('gifFps').value),
    gifQuality: parseInt(document.getElementById('gifQuality').value),
    imageFormat: document.getElementById('imageFormat').value,
    jpegQuality: parseInt(document.getElementById('jpegQuality').value),
  };
  await chrome.storage.local.set(settings);
  notifyContentScript('updateSettings', settings);
}

async function sendCommand(action) {
  const settings = {
    gifDuration: parseInt(document.getElementById('gifDuration').value),
    gifFps: parseInt(document.getElementById('gifFps').value),
    gifQuality: parseInt(document.getElementById('gifQuality').value),
    imageFormat: document.getElementById('imageFormat').value,
    jpegQuality: parseInt(document.getElementById('jpegQuality').value),
  };

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;

  try {
    await chrome.tabs.sendMessage(tab.id, {
      action,
      settings,
    });
    showStatus(getActionMessage(action), true);
  } catch (err) {
    showStatus('请先打开包含视频的页面', false);
  }
}

function getActionMessage(action) {
  switch (action) {
    case 'screenshot': return '正在截图...';
    case 'gif': return '开始录制GIF...';
    case 'burst': return '开始连拍...';
    default: return '执行中...';
  }
}

async function notifyContentScript(type, data) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;
  try {
    await chrome.tabs.sendMessage(tab.id, { action: type, ...data });
  } catch {
    // content script not loaded
  }
}

async function checkVideoStatus() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;

  try {
    const response = await chrome.tabs.sendMessage(tab.id, { action: 'checkVideo' });
    const statusBar = document.getElementById('statusBar');
    if (response && response.hasVideo) {
      statusBar.classList.add('active');
      statusBar.querySelector('.status-text').textContent =
        `检测到视频 (${response.videoWidth}×${response.videoHeight})`;
    } else {
      statusBar.querySelector('.status-text').textContent = '未检测到视频';
    }
  } catch {
    document.getElementById('statusBar').querySelector('.status-text').textContent =
      '无法连接到页面';
  }
}

function showStatus(text, success) {
  const statusBar = document.getElementById('statusBar');
  statusBar.querySelector('.status-text').textContent = text;
  if (success) {
    statusBar.classList.add('active');
  }
}
