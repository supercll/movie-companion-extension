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
    <button :class="btnClass" title="截取当前视频画面" @click="$emit('screenshot')">
      <Camera :size="20" />
      <span>截图</span>
    </button>
    <button :class="btnClass" title="录制视频GIF动图" @click="$emit('gif')">
      <Circle :size="20" />
      <span>GIF</span>
    </button>
    <button :class="btnClass" title="录制视频片段(含声音)" @click="$emit('video')">
      <Video :size="20" />
      <span>录制</span>
    </button>
    <button :class="btnClass" title="连续截取多张图片" @click="$emit('burst')">
      <Layers :size="20" />
      <span>连拍</span>
    </button>
  </div>
</template>
