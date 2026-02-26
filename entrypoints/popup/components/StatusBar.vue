<script setup lang="ts">
defineProps<{
  text: string;
  active: boolean;
  recording?: boolean;
}>();
</script>

<template>
  <div class="flex items-center gap-2 px-3.5 py-2.5 bg-[#1a1a2e] rounded-xl mb-4 text-[13px]">
    <span
      class="w-2 h-2 rounded-full shrink-0 transition-colors"
      :class="
        recording
          ? 'bg-red-400 shadow-[0_0_6px_theme(colors.red.400)] animate-pulse'
          : active
            ? 'bg-green-400 shadow-[0_0_6px_theme(colors.green.400)]'
            : 'bg-gray-600'
      "
    />
    <span class="text-gray-300">{{ text }}</span>
  </div>
</template>
