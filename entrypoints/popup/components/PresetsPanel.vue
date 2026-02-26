<script setup lang="ts">
import { ref } from 'vue';
import { X } from 'lucide-vue-next';
import type { Preset, ActionType } from '@/utils/types';
import { ACTION_LABELS } from '@/utils/constants';

const props = defineProps<{
  presets: Preset[];
}>();

const emit = defineEmits<{
  update: [presets: Preset[]];
}>();

const trigger = ref('');
const action = ref<ActionType>('screenshot');

function addPreset() {
  const t = trigger.value.trim();
  if (!t) return;
  if (props.presets.some((p) => p.trigger === t)) return;
  emit('update', [...props.presets, { trigger: t, action: action.value }]);
  trigger.value = '';
}

function removePreset(index: number) {
  emit('update', props.presets.filter((_, i) => i !== index));
}
</script>

<template>
  <section class="bg-[#1a1a2e] rounded-xl p-3.5 mb-4">
    <h2 class="text-[13px] font-medium text-gray-500 uppercase tracking-wide mb-2">
      预设指令管理
    </h2>
    <p class="text-xs text-gray-600 mb-2.5">在视频页面的输入框中输入指令即可触发对应操作</p>

    <div class="max-h-[150px] overflow-y-auto mb-2.5 space-y-1.5">
      <div
        v-for="(preset, i) in presets"
        :key="i"
        class="flex items-center justify-between px-2.5 py-2 bg-[#0f0f1a] rounded-lg text-[13px]"
      >
        <span class="text-violet-400 font-medium">{{ preset.trigger }}</span>
        <span class="text-gray-500 text-xs">{{ ACTION_LABELS[preset.action] }}</span>
        <button
          class="bg-transparent border-none text-gray-600 cursor-pointer p-0 hover:text-red-400 transition-colors"
          @click="removePreset(i)"
        >
          <X :size="14" />
        </button>
      </div>
    </div>

    <div class="flex gap-1.5">
      <input
        v-model="trigger"
        type="text"
        placeholder="触发词，如：截图"
        class="flex-1 px-2.5 py-2 bg-[#0f0f1a] border border-[#2a2a4a] rounded-lg text-gray-200 text-[13px] outline-none focus:border-violet-400 transition-colors"
        @keydown.enter="addPreset"
      />
      <select
        v-model="action"
        class="px-2 py-2 bg-[#0f0f1a] border border-[#2a2a4a] rounded-lg text-gray-200 text-xs outline-none"
      >
        <option value="screenshot">截图</option>
        <option value="gif">录制GIF</option>
        <option value="burst">连拍(5张)</option>
      </select>
      <button
        class="w-9 h-9 bg-violet-400 border-none rounded-lg text-white text-xl cursor-pointer flex items-center justify-center hover:bg-violet-500 transition-colors shrink-0"
        @click="addPreset"
      >
        +
      </button>
    </div>
  </section>
</template>
