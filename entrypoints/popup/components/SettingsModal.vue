<script setup lang="ts">
import { Settings as SettingsIcon, X } from 'lucide-vue-next';
import type { Settings } from '@/utils/types';

defineProps<{
  settings: Settings;
}>();

const emit = defineEmits<{
  update: [patch: Partial<Settings>];
  close: [];
}>();
</script>

<template>
  <div
    class="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
    @click="emit('close')"
  >
    <div
      class="bg-[#12122a] rounded-2xl w-[340px] max-h-[480px] flex flex-col"
      @click.stop
    >
      <!-- Header -->
      <div class="flex items-center justify-between px-5 pt-4 pb-3 border-b border-[#2a2a4a]">
        <div class="flex items-center gap-2 text-violet-400">
          <SettingsIcon :size="18" />
          <h3 class="text-base font-semibold">设置</h3>
        </div>
        <button
          class="bg-transparent border-none text-gray-500 cursor-pointer p-1 rounded-lg hover:bg-[#1a1a2e] hover:text-gray-300 transition-colors"
          @click="emit('close')"
        >
          <X :size="18" />
        </button>
      </div>

      <!-- Scrollable Content -->
      <div class="flex-1 overflow-y-auto px-5 py-3 space-y-3">
        <!-- Screenshot Settings -->
        <section class="bg-[#1a1a2e] rounded-xl p-3.5">
          <h2 class="text-[13px] font-medium text-gray-500 uppercase tracking-wide mb-2.5">截图设置</h2>

          <div class="flex items-center justify-between py-1.5">
            <label class="text-[13px] text-gray-400">图片格式</label>
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

          <div class="flex items-center justify-between py-1.5">
            <label class="text-[13px] text-gray-400">JPEG质量</label>
            <div class="flex items-center gap-2">
              <input
                type="range"
                :min="50"
                :max="100"
                :value="settings.jpegQuality"
                class="w-20 accent-violet-400"
                @input="emit('update', { jpegQuality: +($event.target as HTMLInputElement).value })"
              />
              <span class="text-xs text-violet-400 min-w-[30px] text-right">{{ settings.jpegQuality }}%</span>
            </div>
          </div>
        </section>

        <!-- GIF Settings -->
        <section class="bg-[#1a1a2e] rounded-xl p-3.5">
          <h2 class="text-[13px] font-medium text-gray-500 uppercase tracking-wide mb-2.5">GIF设置</h2>

          <div class="flex items-center justify-between py-1.5">
            <label class="text-[13px] text-gray-400">录制时长</label>
            <div class="flex items-center gap-2">
              <input
                type="range"
                :min="1"
                :max="10"
                :value="settings.gifDuration"
                class="w-20 accent-violet-400"
                @input="emit('update', { gifDuration: +($event.target as HTMLInputElement).value })"
              />
              <span class="text-xs text-violet-400 min-w-[30px] text-right">{{ settings.gifDuration }}秒</span>
            </div>
          </div>

          <div class="flex items-center justify-between py-1.5">
            <label class="text-[13px] text-gray-400">帧率</label>
            <div class="flex items-center gap-2">
              <input
                type="range"
                :min="5"
                :max="30"
                :value="settings.gifFps"
                class="w-20 accent-violet-400"
                @input="emit('update', { gifFps: +($event.target as HTMLInputElement).value })"
              />
              <span class="text-xs text-violet-400 min-w-[30px] text-right">{{ settings.gifFps }}fps</span>
            </div>
          </div>

          <div class="flex items-center justify-between py-1.5">
            <label class="text-[13px] text-gray-400">画质</label>
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
        </section>

        <!-- Video Recording Settings -->
        <section class="bg-[#1a1a2e] rounded-xl p-3.5">
          <h2 class="text-[13px] font-medium text-gray-500 uppercase tracking-wide mb-2.5">视频录制设置</h2>

          <div class="flex items-center justify-between py-1.5">
            <label class="text-[13px] text-gray-400">录制时长</label>
            <div class="flex items-center gap-2">
              <input
                type="range"
                :min="5"
                :max="60"
                :step="5"
                :value="settings.videoDuration"
                class="w-20 accent-violet-400"
                @input="emit('update', { videoDuration: +($event.target as HTMLInputElement).value })"
              />
              <span class="text-xs text-violet-400 min-w-[30px] text-right">{{ settings.videoDuration }}秒</span>
            </div>
          </div>

          <div class="flex items-center justify-between py-1.5">
            <label class="text-[13px] text-gray-400">视频格式</label>
            <select
              :value="settings.videoFormat"
              class="px-2 py-1 bg-[#0f0f1a] border border-[#2a2a4a] rounded-md text-gray-200 text-xs outline-none"
              @change="emit('update', { videoFormat: ($event.target as HTMLSelectElement).value as Settings['videoFormat'] })"
            >
              <option value="auto">自动(最佳)</option>
              <option value="mp4">MP4 (H264)</option>
              <option value="webm-vp9">WebM (VP9)</option>
              <option value="webm-h264">WebM (H264)</option>
              <option value="webm">WebM</option>
            </select>
          </div>

          <div class="flex items-center justify-between py-1.5">
            <label class="text-[13px] text-gray-400">码率</label>
            <div class="flex items-center gap-2">
              <input
                type="range"
                :min="500"
                :max="8000"
                :step="500"
                :value="settings.videoBitrate"
                class="w-20 accent-violet-400"
                @input="emit('update', { videoBitrate: +($event.target as HTMLInputElement).value })"
              />
              <span class="text-xs text-violet-400 min-w-[38px] text-right">{{ (settings.videoBitrate / 1000).toFixed(1) }}M</span>
            </div>
          </div>
        </section>
      </div>

      <!-- Footer -->
      <div class="px-5 py-3 border-t border-[#2a2a4a]">
        <button
          class="w-full py-2 bg-violet-400 border-none rounded-lg text-white cursor-pointer text-sm hover:bg-violet-500 transition-colors"
          @click="emit('close')"
        >
          完成
        </button>
      </div>
    </div>
  </div>
</template>
