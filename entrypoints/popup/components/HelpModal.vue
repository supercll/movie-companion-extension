<script setup lang="ts">
const emit = defineEmits<{
  close: [];
}>();
</script>

<template>
  <div
    class="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
    @click="emit('close')"
  >
    <div
      class="bg-[#1a1a2e] rounded-2xl p-5 w-80 max-h-[400px] overflow-y-auto"
      @click.stop
    >
      <h3 class="text-violet-400 mb-3 text-base font-semibold">{{ $t('help.title') }}</h3>

      <div class="space-y-3 text-[13px]">
        <div>
          <p class="text-gray-300 font-medium mb-1">{{ $t('help.basicUsage') }}</p>
          <ul class="list-disc pl-4 space-y-1 text-xs text-gray-400">
            <li>{{ $t('help.basicStep1') }}</li>
            <li>{{ $t('help.basicStep2') }}</li>
            <li>{{ $t('help.basicStep3') }}</li>
          </ul>
        </div>

        <div>
          <p class="text-gray-300 font-medium mb-1">{{ $t('help.shortcuts') }}</p>
          <ul class="list-disc pl-4 space-y-1 text-xs text-gray-400">
            <li>
              <kbd class="bg-[#0f0f1a] px-1.5 py-0.5 rounded text-[11px] border border-gray-700 text-violet-400">Alt+S</kbd>
              — {{ $t('help.shortcutScreenshot') }}
            </li>
            <li>
              <kbd class="bg-[#0f0f1a] px-1.5 py-0.5 rounded text-[11px] border border-gray-700 text-violet-400">Alt+G</kbd>
              — {{ $t('help.shortcutGif') }}
            </li>
            <li>
              <kbd class="bg-[#0f0f1a] px-1.5 py-0.5 rounded text-[11px] border border-gray-700 text-violet-400">Alt+V</kbd>
              — {{ $t('help.shortcutVideo') }}
            </li>
            <li>
              <kbd class="bg-[#0f0f1a] px-1.5 py-0.5 rounded text-[11px] border border-gray-700 text-violet-400">Alt+B</kbd>
              — {{ $t('help.shortcutBurst') }}
            </li>
          </ul>
        </div>

        <div>
          <p class="text-gray-300 font-medium mb-1">{{ $t('help.supportedSites') }}</p>
          <ul class="list-disc pl-4 space-y-1 text-xs text-gray-400">
            <li>{{ $t('help.siteList') }}</li>
            <li>{{ $t('help.siteAny') }}</li>
          </ul>
        </div>
      </div>

      <button
        class="w-full mt-4 py-2.5 bg-violet-400 border-none rounded-lg text-white cursor-pointer text-sm hover:bg-violet-500 transition-colors"
        @click="emit('close')"
      >
        {{ $t('help.close') }}
      </button>
    </div>
  </div>
</template>
