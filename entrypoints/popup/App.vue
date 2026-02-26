<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { Film, Settings as SettingsIcon, RefreshCw } from 'lucide-vue-next';
import type { Settings, VideoInfo } from '@/utils/types';
import { DEFAULT_SETTINGS } from '@/utils/constants';
import { settingsStorage } from '@/utils/storage';
import { getActiveTab, sendToContent } from '@/utils/messaging';
import StatusBar from './components/StatusBar.vue';
import ActionGrid from './components/ActionGrid.vue';
import TimedActionPanel from './components/TimedActionPanel.vue';
import SettingsModal from './components/SettingsModal.vue';
import HelpModal from './components/HelpModal.vue';

declare const __APP_VERSION__: string;

const version = __APP_VERSION__;
const settings = ref<Settings>({ ...DEFAULT_SETTINGS });
const videoInfo = ref<VideoInfo>({ hasVideo: false });
const statusText = ref('等待检测视频...');
const showSettings = ref(false);
const showHelp = ref(false);
const checking = ref(false);

let pollTimer: ReturnType<typeof setInterval> | undefined;

onMounted(async () => {
  const s = await settingsStorage.getValue();
  if (s) settings.value = s;
  await checkVideo();

  if (!videoInfo.value.hasVideo) {
    pollTimer = setInterval(async () => {
      await checkVideo();
      if (videoInfo.value.hasVideo && pollTimer) {
        clearInterval(pollTimer);
        pollTimer = undefined;
      }
    }, 2000);
  }
});

onUnmounted(() => {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = undefined;
  }
});

async function checkVideo() {
  checking.value = true;
  const tab = await getActiveTab();
  if (!tab?.id) {
    statusText.value = '无法连接到页面';
    checking.value = false;
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
  checking.value = false;
}

async function sendTimedAction(payload: {
  type: string;
  action: string;
  time?: number;
  times?: number[];
  start?: number;
  end?: number;
}) {
  const tab = await getActiveTab();
  if (!tab?.id) {
    statusText.value = '请先打开包含视频的页面';
    return;
  }
  try {
    if (payload.type === 'point') {
      await sendToContent(tab.id, {
        action: 'timedScreenshot',
        time: payload.time,
        settings: settings.value,
      });
      statusText.value = '正在跳转截图...';
    } else if (payload.type === 'range' && payload.action === 'gif') {
      await sendToContent(tab.id, {
        action: 'timedGif',
        start: payload.start,
        end: payload.end,
        settings: settings.value,
      });
      statusText.value = '正在录制指定时间段GIF...';
    } else if (payload.type === 'range' && payload.action === 'video') {
      await sendToContent(tab.id, {
        action: 'timedVideo',
        start: payload.start,
        end: payload.end,
        settings: settings.value,
      });
      statusText.value = '正在录制指定时间段视频...';
    } else if (payload.type === 'range' && payload.action === 'screenshot') {
      await sendToContent(tab.id, {
        action: 'timedScreenshotPoints',
        times: [payload.start, payload.end],
        settings: settings.value,
      });
      statusText.value = '正在截图时间段起止帧...';
    } else if (payload.type === 'points') {
      await sendToContent(tab.id, {
        action: 'timedScreenshotPoints',
        times: payload.times,
        settings: settings.value,
      });
      statusText.value = `正在截取 ${payload.times?.length} 个时间点...`;
    }
  } catch {
    statusText.value = '请先打开包含视频的页面';
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
      video: '开始录制视频...',
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
      <div class="flex items-center gap-2">
        <button
          class="bg-transparent border-none text-gray-500 cursor-pointer p-1.5 rounded-lg hover:bg-[#1a1a2e] hover:text-violet-400 transition-colors"
          title="设置"
          @click="showSettings = true"
        >
          <SettingsIcon :size="18" />
        </button>
        <span class="text-[11px] text-gray-600 bg-[#1a1a2e] px-2 py-0.5 rounded-xl">v{{ version }}</span>
      </div>
    </header>

    <div class="flex items-center gap-2 mb-4">
      <StatusBar :text="statusText" :active="videoInfo.hasVideo" class="flex-1" />
      <button
        class="shrink-0 p-2 bg-[#1a1a2e] border border-[#2a2a4a] rounded-xl text-gray-500 cursor-pointer hover:text-violet-400 hover:border-violet-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        title="重新检测视频"
        :disabled="checking"
        @click="checkVideo"
      >
        <RefreshCw :size="14" :class="{ 'animate-spin': checking }" />
      </button>
    </div>

    <section class="mb-4">
      <h2 class="text-[13px] font-medium text-gray-500 uppercase tracking-wide mb-2.5">
        快捷操作
      </h2>
      <ActionGrid
        @screenshot="sendCommand('screenshot')"
        @gif="sendCommand('gif')"
        @video="sendCommand('video')"
        @burst="sendCommand('burst')"
      />
    </section>

    <TimedActionPanel
      :video-info="videoInfo"
      @execute="sendTimedAction"
    />

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

    <SettingsModal
      v-if="showSettings"
      :settings="settings"
      @update="updateSettings"
      @close="showSettings = false"
    />

    <HelpModal v-if="showHelp" @close="showHelp = false" />
  </div>
</template>
