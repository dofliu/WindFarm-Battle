/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// 單一設定檔同時供 Vite 與 Vitest 使用
export default defineConfig({
  plugins: [react()],

  // base: './' 讓 Capacitor WebView 可用相對路徑載入資源
  // Web 部署時若掛在 root 不受影響；若掛在子路徑，需改回 '/your-path/'
  base: './',

  // 固定 dev port 避免被其他常駐 app（例：隨行 AI 秘書）佔用 5173；
  // strictPort=true 讓佔用時直接報錯，不偷偷換 port 造成「Vite 表面 ready 但打不開」的誤判。
  server: { port: 5180, strictPort: true },

  // 針對 Capacitor 最佳化建置輸出
  build: {
    // 保留 sourcemap 以利 Android Studio / Xcode 偵錯
    sourcemap: false,
    // 降低 chunk 大小警告門檻（Capacitor 束傳遞整包 WebView）
    chunkSizeWarningLimit: 1000,
  },

  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.{ts,tsx}'],
  },
});
