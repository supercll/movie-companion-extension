<script setup lang="ts">
import { ref } from 'vue';

const toast = ref<{ text: string; type: string } | null>(null);
const preview = ref<{ url: string; filename: string; isBlob: boolean } | null>(null);
const recording = ref<{ progress: number; elapsed: number; total: number } | null>(null);
const flash = ref(false);
const globalURL = globalThis.URL;

let toastTimer: ReturnType<typeof setTimeout> | undefined;
let previewTimer: ReturnType<typeof setTimeout> | undefined;

function showToast(text: string, type: string) {
  clearTimeout(toastTimer);
  toast.value = { text, type };
  toastTimer = setTimeout(() => (toast.value = null), 3500);
}

function showPreview(url: string, filename: string, isBlob = false) {
  clearTimeout(previewTimer);
  preview.value = { url, filename, isBlob };
  previewTimer = setTimeout(() => {
    if (preview.value?.isBlob) globalURL.revokeObjectURL(preview.value.url);
    preview.value = null;
  }, 15000);
}

function showRecording(show: boolean, progress = 0, elapsed = 0, total = 0) {
  recording.value = show ? { progress, elapsed, total } : null;
}

function showFlash() {
  flash.value = true;
  setTimeout(() => (flash.value = false), 300);
}

const emit = defineEmits<{
  save: [url: string, filename: string];
  stopRecording: [];
}>();

defineExpose({ showToast, showPreview, showRecording, showFlash });
</script>

<template>
  <!-- Screenshot Flash -->
  <div v-if="flash" class="mc-flash" />

  <!-- Toast -->
  <div v-if="toast" :class="['mc-toast', `mc-toast--${toast.type}`]">
    <span class="mc-toast__icon">
      <template v-if="toast.type === 'success'">✅</template>
      <template v-else-if="toast.type === 'error'">❌</template>
      <template v-else-if="toast.type === 'recording'">🔴</template>
      <template v-else>🎬</template>
    </span>
    <span class="mc-toast__text">{{ toast.text }}</span>
  </div>

  <!-- Recording Indicator -->
  <div v-if="recording" class="mc-recording">
    <span class="mc-recording__dot" />
    <span>REC</span>
    <span class="mc-recording__time">
      {{ recording.elapsed.toFixed(1) }}s / {{ recording.total.toFixed(1) }}s
    </span>
    <div class="mc-recording__bar">
      <div class="mc-recording__bar-fill" :style="{ width: `${recording.progress * 100}%` }" />
    </div>
    <button class="mc-recording__stop" :title="$t('overlay.stopRecording')" @click="emit('stopRecording')">
      <span class="mc-recording__stop-icon" />
    </button>
  </div>

  <!-- Preview -->
  <div v-if="preview" class="mc-preview">
    <img :src="preview.url" alt="preview" class="mc-preview__img" />
    <div class="mc-preview__actions">
      <button
        class="mc-preview__btn mc-preview__btn--save"
        @click="emit('save', preview!.url, preview!.filename); preview = null"
      >
        {{ $t('overlay.save') }}
      </button>
      <button
        class="mc-preview__btn mc-preview__btn--close"
        @click="if (preview?.isBlob) globalURL.revokeObjectURL(preview.url); preview = null"
      >
        {{ $t('overlay.close') }}
      </button>
    </div>
  </div>

</template>
