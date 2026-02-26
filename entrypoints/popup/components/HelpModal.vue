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
      <h3 class="text-violet-400 mb-3 text-base font-semibold">使用帮助</h3>

      <div class="space-y-3 text-[13px]">
        <div>
          <p class="text-gray-300 font-medium mb-1">基本用法：</p>
          <ul class="list-disc pl-4 space-y-1 text-xs text-gray-400">
            <li>打开包含视频的网页（YouTube、B站等）</li>
            <li>点击插件图标，使用快捷操作按钮</li>
            <li>支持定时截图、GIF录制和视频录制</li>
          </ul>
        </div>

        <div>
          <p class="text-gray-300 font-medium mb-1">快捷键：</p>
          <ul class="list-disc pl-4 space-y-1 text-xs text-gray-400">
            <li>
              <kbd class="bg-[#0f0f1a] px-1.5 py-0.5 rounded text-[11px] border border-gray-700 text-violet-400">Alt+S</kbd>
              — 截图
            </li>
            <li>
              <kbd class="bg-[#0f0f1a] px-1.5 py-0.5 rounded text-[11px] border border-gray-700 text-violet-400">Alt+G</kbd>
              — 录制 GIF
            </li>
            <li>
              <kbd class="bg-[#0f0f1a] px-1.5 py-0.5 rounded text-[11px] border border-gray-700 text-violet-400">Alt+V</kbd>
              — 录制视频
            </li>
            <li>
              <kbd class="bg-[#0f0f1a] px-1.5 py-0.5 rounded text-[11px] border border-gray-700 text-violet-400">Alt+B</kbd>
              — 连拍
            </li>
          </ul>
        </div>

        <div>
          <p class="text-gray-300 font-medium mb-1">支持的网站：</p>
          <ul class="list-disc pl-4 space-y-1 text-xs text-gray-400">
            <li>YouTube、Bilibili、Netflix、爱奇艺等</li>
            <li>任何包含 &lt;video&gt; 标签的网页</li>
          </ul>
        </div>
      </div>

      <button
        class="w-full mt-4 py-2.5 bg-violet-400 border-none rounded-lg text-white cursor-pointer text-sm hover:bg-violet-500 transition-colors"
        @click="emit('close')"
      >
        关闭
      </button>
    </div>
  </div>
</template>
