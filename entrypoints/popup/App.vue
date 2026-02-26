<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Film } from 'lucide-vue-next';
import type { Settings, Preset, VideoInfo } from '@/utils/types';
import { DEFAULT_SETTINGS, DEFAULT_PRESETS } from '@/utils/constants';
import { presetsStorage, settingsStorage } from '@/utils/storage';
import { getActiveTab, sendToContent } from '@/utils/messaging';
import StatusBar from './components/StatusBar.vue';
import ActionGrid from './components/ActionGrid.vue';
import PresetsPanel from './components/PresetsPanel.vue';
import SettingsPanel from './components/SettingsPanel.vue';
import HelpModal from './components/HelpModal.vue';

const settings = ref<Settings>({ ...DEFAULT_SETTINGS });
const presets = ref<Preset[]>([...DEFAULT_PRESETS]);
const videoInfo = ref<VideoInfo>({ hasVideo: false });
const statusText = ref('等待检测视频...');
const showPresets = ref(false);
const showHelp = ref(false);

onMounted(async () => {
  const s = await settingsStorage.getValue();
  if (s) settings.value = s;
  const p = await presetsStorage.getValue();
  if (p) presets.value = p;
  await checkVideo();
});

async function checkVideo() {
  const tab = await getActiveTab();
  if (!tab?.id) {
    statusText.value = '无法连接到页面';
    return;
  }
  try {
    const res = (await sendToContent(tab.id, { action: 'checkVideo' })) as VideoInfo;
    videoInfo.value = res;
    statusText.value = res.hasVideo
      ? `检测到视频 (${res.videoWidth}×${res.videoHeight})`
      : '未检测到视频';
  } catch {
    statusText.value = '无法连接到页面';
  }
}

async function sendCommand(action: string) {
  const tab = await getActiveTab();
  if (!tab?.id) {
    statusText.value = '请先打开包含视频的页面';
    return;
  }
  try {
    await sendToContent(tab.id, { action, settings: settings.value });
    const labels: Record<string, string> = {
      screenshot: '正在截图...',
      gif: '开始录制GIF...',
      burst: '开始连拍...',
    };
    statusText.value = labels[action] ?? '执行中...';
  } catch {
    statusText.value = '请先打开包含视频的页面';
  }
}

async function updateSettings(patch: Partial<Settings>) {
  Object.assign(settings.value, patch);
  await settingsStorage.setValue({ ...settings.value });
}

async function updatePresets(newPresets: Preset[]) {
  presets.value = newPresets;
  await presetsStorage.setValue(newPresets);
}
</script>

<template>
  <div class="p-4">
    <!-- Header -->
    <header class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-2 text-violet-400">
        <Film :size="28" />
        <h1
          class="text-lg font-semibold bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent"
        >
          观影伴侣
        </h1>
      </div>
      <span class="text-[11px] text-gray-600 bg-[#1a1a2e] px-2 py-0.5 rounded-xl">v2.0</span>
    </header>

    <StatusBar :text="statusText" :active="videoInfo.hasVideo" />

    <section class="mb-4">
      <h2 class="text-[13px] font-medium text-gray-500 uppercase tracking-wide mb-2.5">
        快捷操作
      </h2>
      <ActionGrid
        @screenshot="sendCommand('screenshot')"
        @gif="sendCommand('gif')"
        @burst="sendCommand('burst')"
        @preset="showPresets = !showPresets"
      />
    </section>

    <PresetsPanel v-if="showPresets" :presets="presets" @update="updatePresets" />

    <SettingsPanel :settings="settings" @update="updateSettings" />

    <footer class="flex justify-center items-center gap-2 pt-2">
      <button
        class="text-gray-600 text-xs hover:text-violet-400 transition-colors bg-transparent border-none cursor-pointer"
        @click="showHelp = true"
      >
        使用帮助
      </button>
      <span class="text-gray-700 text-xs">|</span>
      <button
        class="text-gray-600 text-xs hover:text-violet-400 transition-colors bg-transparent border-none cursor-pointer"
        @click="showHelp = true"
      >
        快捷键
      </button>
    </footer>

    <HelpModal v-if="showHelp" @close="showHelp = false" />
  </div>
</template>
