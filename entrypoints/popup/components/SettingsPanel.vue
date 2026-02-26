<script setup lang="ts">
import type { Settings } from '@/utils/types';

const props = defineProps<{
  settings: Settings;
}>();

const emit = defineEmits<{
  update: [patch: Partial<Settings>];
}>();
</script>

<template>
  <!-- GIF Settings -->
  <section class="bg-[#1a1a2e] rounded-xl p-3.5 mb-3">
    <h2 class="text-[13px] font-medium text-gray-500 uppercase tracking-wide mb-2.5">GIF设置</h2>

    <div class="flex items-center justify-between py-1.5">
      <label class="text-[13px] text-gray-400">录制时长</label>
      <div class="flex items-center gap-2">
        <input
          type="range"
          :min="1"
          :max="10"
          :value="settings.gifDuration"
          class="w-24 accent-violet-400"
          @input="emit('update', { gifDuration: +($event.target as HTMLInputElement).value })"
        />
        <span class="text-xs text-violet-400 min-w-[30px] text-right">{{ settings.gifDuration }}秒</span>
      </div>
    </div>

    <div class="flex items-center justify-between py-1.5">
      <label class="text-[13px] text-gray-400">帧率(FPS)</label>
      <div class="flex items-center gap-2">
        <input
          type="range"
          :min="5"
          :max="30"
          :value="settings.gifFps"
          class="w-24 accent-violet-400"
          @input="emit('update', { gifFps: +($event.target as HTMLInputElement).value })"
        />
        <span class="text-xs text-violet-400 min-w-[30px] text-right">{{ settings.gifFps }}</span>
      </div>
    </div>

    <div class="flex items-center justify-between py-1.5">
      <label class="text-[13px] text-gray-400">画质</label>
      <div class="flex items-center gap-2">
        <select
          :value="settings.gifQuality"
          class="px-2 py-1 bg-[#0f0f1a] border border-[#2a2a4a] rounded-md text-gray-200 text-xs outline-none"
          @change="emit('update', { gifQuality: +($event.target as HTMLSelectElement).value })"
        >
          <option :value="10">高</option>
          <option :value="15">中</option>
          <option :value="20">低</option>
        </select>
      </div>
    </div>
  </section>

  <!-- Screenshot Settings -->
  <section class="bg-[#1a1a2e] rounded-xl p-3.5 mb-3">
    <h2 class="text-[13px] font-medium text-gray-500 uppercase tracking-wide mb-2.5">截图设置</h2>

    <div class="flex items-center justify-between py-1.5">
      <label class="text-[13px] text-gray-400">图片格式</label>
      <div class="flex items-center gap-2">
        <select
          :value="settings.imageFormat"
          class="px-2 py-1 bg-[#0f0f1a] border border-[#2a2a4a] rounded-md text-gray-200 text-xs outline-none"
          @change="emit('update', { imageFormat: ($event.target as HTMLSelectElement).value as Settings['imageFormat'] })"
        >
          <option value="png">PNG</option>
          <option value="jpeg">JPEG</option>
          <option value="webp">WebP</option>
        </select>
      </div>
    </div>

    <div class="flex items-center justify-between py-1.5">
      <label class="text-[13px] text-gray-400">JPEG质量</label>
      <div class="flex items-center gap-2">
        <input
          type="range"
          :min="50"
          :max="100"
          :value="settings.jpegQuality"
          class="w-24 accent-violet-400"
          @input="emit('update', { jpegQuality: +($event.target as HTMLInputElement).value })"
        />
        <span class="text-xs text-violet-400 min-w-[30px] text-right">{{ settings.jpegQuality }}%</span>
      </div>
    </div>
  </section>
</template>
