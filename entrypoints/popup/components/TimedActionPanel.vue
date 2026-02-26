<script setup lang="ts">
import { ref, computed } from 'vue';
import { Clock, Camera, Circle, Video, AlertCircle } from 'lucide-vue-next';
import { parseTimedInput, formatTime } from '@/utils/time-parser';
import type { TimedActionType, VideoInfo } from '@/utils/types';

const props = defineProps<{
  videoInfo: VideoInfo;
}>();

const emit = defineEmits<{
  execute: [payload: { type: 'point'; action: TimedActionType; time: number }
    | { type: 'range'; action: TimedActionType; start: number; end: number }
    | { type: 'points'; action: TimedActionType; times: number[] }];
}>();

const timeInput = ref('');
const action = ref<TimedActionType>('screenshot');

const parsed = computed(() => {
  if (!timeInput.value.trim()) return null;
  return parseTimedInput(timeInput.value);
});

const validationError = computed(() => {
  if (!timeInput.value.trim()) return null;
  if (!parsed.value) return '无法识别时间格式';

  const duration = props.videoInfo.duration ?? 0;
  if (duration <= 0) return null;

  if (parsed.value.type === 'point') {
    if (parsed.value.time > duration) return `超出视频时长 (${formatTime(duration)})`;
  } else if (parsed.value.type === 'range') {
    if (parsed.value.end > duration) return `结束时间超出视频时长 (${formatTime(duration)})`;
  } else if (parsed.value.type === 'points') {
    const max = Math.max(...parsed.value.times);
    if (max > duration) return `时间点超出视频时长 (${formatTime(duration)})`;
  }
  return null;
});

const description = computed(() => {
  if (!parsed.value) return '';
  const a = action.value;
  if (parsed.value.type === 'point') {
    if (a === 'screenshot') return `在 ${formatTime(parsed.value.time)} 处截图`;
    return `无法对单个时间点录制，请输入时间段`;
  }
  if (parsed.value.type === 'range') {
    const dur = parsed.value.end - parsed.value.start;
    const rangeLabel = `${formatTime(parsed.value.start)} - ${formatTime(parsed.value.end)}`;
    if (a === 'screenshot') return `在 ${rangeLabel} 范围内截图`;
    if (a === 'gif') return `录制 ${rangeLabel} 的GIF (${dur.toFixed(1)}秒)`;
    return `录制 ${rangeLabel} 的视频 (${dur.toFixed(1)}秒，含声音)`;
  }
  if (parsed.value.type === 'points') {
    if (a === 'screenshot') return `在 ${parsed.value.times.length} 个时间点分别截图`;
    return `无法对多个时间点录制，请输入时间段`;
  }
  return '';
});

const canExecute = computed(() => {
  if (!props.videoInfo.hasVideo) return false;
  if (!parsed.value || validationError.value) return false;
  const a = action.value;
  if (parsed.value.type === 'point' && a !== 'screenshot') return false;
  if (parsed.value.type === 'points' && a !== 'screenshot') return false;
  return true;
});

function execute() {
  if (!parsed.value || !canExecute.value) return;

  if (parsed.value.type === 'point') {
    emit('execute', { type: 'point', action: action.value, time: parsed.value.time });
  } else if (parsed.value.type === 'range') {
    emit('execute', { type: 'range', action: action.value, start: parsed.value.start, end: parsed.value.end });
  } else if (parsed.value.type === 'points') {
    emit('execute', { type: 'points', action: action.value, times: parsed.value.times });
  }
}
</script>

<template>
  <section class="bg-[#1a1a2e] rounded-xl p-3.5 mb-3">
    <h2 class="flex items-center gap-1.5 text-[13px] font-medium text-gray-500 uppercase tracking-wide mb-2.5">
      <Clock :size="14" />
      定时操作
    </h2>

    <p class="text-xs text-gray-600 mb-2">
      输入时间点或时间段，对视频指定位置截图/录制
    </p>

    <!-- No video hint -->
    <div v-if="!videoInfo.hasVideo" class="text-xs text-gray-600 mb-2.5 flex items-center gap-1">
      <AlertCircle :size="12" class="text-gray-600" />
      等待检测到视频后可使用
    </div>

    <!-- Video time info -->
    <div v-else-if="videoInfo.duration" class="flex gap-3 text-xs text-gray-500 mb-2.5">
      <span>时长: {{ formatTime(videoInfo.duration) }}</span>
      <span v-if="videoInfo.currentTime !== undefined">当前: {{ formatTime(videoInfo.currentTime) }}</span>
    </div>

    <!-- Time input -->
    <div class="flex gap-1.5 mb-2">
      <input
        v-model="timeInput"
        type="text"
        placeholder="如: 1:05  或  1:00-1:10  或  0:30,1:00,1:30"
        :disabled="!videoInfo.hasVideo"
        class="flex-1 px-2.5 py-2 bg-[#0f0f1a] border border-[#2a2a4a] rounded-lg text-gray-200 text-[13px] outline-none focus:border-violet-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        @keydown.enter="execute"
      />
    </div>

    <!-- Action selector + Execute -->
    <div class="flex gap-1.5 items-center mb-2">
      <label class="flex items-center gap-1 cursor-pointer">
        <input
          v-model="action"
          type="radio"
          value="screenshot"
          class="accent-violet-400"
        />
        <Camera :size="14" class="text-gray-400" />
        <span class="text-xs text-gray-400">截图</span>
      </label>

      <label class="flex items-center gap-1 cursor-pointer ml-3">
        <input
          v-model="action"
          type="radio"
          value="gif"
          class="accent-violet-400"
        />
        <Circle :size="14" class="text-gray-400" />
        <span class="text-xs text-gray-400">GIF</span>
      </label>

      <label class="flex items-center gap-1 cursor-pointer ml-3">
        <input
          v-model="action"
          type="radio"
          value="video"
          class="accent-violet-400"
        />
        <Video :size="14" class="text-gray-400" />
        <span class="text-xs text-gray-400">视频</span>
      </label>

      <button
        class="ml-auto px-3 py-1.5 bg-violet-400 border-none rounded-lg text-white text-xs cursor-pointer hover:bg-violet-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        :disabled="!canExecute"
        @click="execute"
      >
        执行
      </button>
    </div>

    <!-- Description / Error -->
    <div v-if="validationError" class="flex items-center gap-1 text-xs text-red-400">
      <AlertCircle :size="12" />
      {{ validationError }}
    </div>
    <div v-else-if="description" class="text-xs text-gray-500">
      {{ description }}
    </div>

    <!-- Format hints -->
    <div class="mt-2 text-[11px] text-gray-700 space-y-0.5">
      <p>格式: <code class="text-gray-500">1:05</code> 单点 · <code class="text-gray-500">1:00-1:10</code> 时间段 · <code class="text-gray-500">0:30,1:00,1:30</code> 多点</p>
    </div>
  </section>
</template>
