import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';
import pkg from './package.json';

export default defineConfig({
  modules: ['@wxt-dev/module-vue'],
  manifest: {
    name: '观影伴侣 - Movie Companion',
    description: '智能观影伴侣：自动截图视频画面、录制GIF动图',
    permissions: ['activeTab', 'storage', 'downloads'],
    host_permissions: ['<all_urls>'],
    icons: {
      16: '/icon-16.png',
      48: '/icon-48.png',
      128: '/icon-128.png',
    },
  },
  vite: () => ({
    plugins: [tailwindcss()],
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version),
    },
  }),
});
