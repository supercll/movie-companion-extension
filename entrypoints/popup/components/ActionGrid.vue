<script setup lang="ts">
import { Camera, Circle, Layers, Video } from 'lucide-vue-next';

defineEmits<{
  screenshot: [];
  gif: [];
  burst: [];
  video: [];
}>();

const btnClass =
  'flex flex-col items-center gap-1.5 py-3.5 px-1 bg-[#1a1a2e] border border-[#2a2a4a] rounded-xl text-gray-400 cursor-pointer transition-all text-xs hover:bg-[#252545] hover:border-violet-400 hover:text-violet-400 hover:-translate-y-0.5 active:translate-y-0';
</script>

<template>
  <div class="grid grid-cols-4 gap-2">
    <button :class="btnClass" :title="$t('action.screenshotTip')" @click="$emit('screenshot')">
      <Camera :size="20" />
      <span>{{ $t('action.screenshot') }}</span>
    </button>
    <button :class="btnClass" :title="$t('action.gifTip')" @click="$emit('gif')">
      <Circle :size="20" />
      <span>{{ $t('action.gif') }}</span>
    </button>
    <button :class="btnClass" :title="$t('action.recordTip')" @click="$emit('video')">
      <Video :size="20" />
      <span>{{ $t('action.record') }}</span>
    </button>
    <button :class="btnClass" :title="$t('action.burstTip')" @click="$emit('burst')">
      <Layers :size="20" />
      <span>{{ $t('action.burst') }}</span>
    </button>
  </div>
</template>
