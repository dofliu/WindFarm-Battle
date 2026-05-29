/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// 單一設定檔同時供 Vite 與 Vitest 使用
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png'],
      manifest: {
        name: 'WindFarm Battle · 風場大戰',
        short_name: 'WindFarm',
        description: 'Wind Energy O&M Strategy Card Game — DOF Lab · NCUT',
        theme_color: '#1c2a3a',
        background_color: '#0d1924',
        display: 'standalone',
        orientation: 'portrait',
        start_url: './',
        scope: './',
        lang: 'zh-Hant',
        icons: [
          { src: 'icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: 'icons/icon-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],

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
