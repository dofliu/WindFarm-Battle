import type { CapacitorConfig } from '@capacitor/cli';

/**
 * WindFarm Battle — Capacitor 設定
 *
 * webDir: Vite 建置輸出目錄（dist/）
 * appId: 對應 App Store / Google Play 上架 Bundle ID
 * appName: App 顯示名稱（學生裝置上看到的）
 */
const config: CapacitorConfig = {
  appId: 'cc.doflab.windfarm',
  appName: '風場大戰',
  webDir: 'dist',
  server: {
    // 開發時啟用熱重載（正式包裝時移除此欄位）
    // url: 'http://192.168.x.x:5173',
    // cleartext: true,
  },
  android: {
    // 允許在 WebView 中使用 localStorage（Zustand 持久化未來需要）
    allowMixedContent: false,
    // Android 最小 SDK 版本：Android 7.0+（API 24）
    minSdkVersion: 24,
  },
  ios: {
    // 允許 WKWebView 執行內嵌 JS（遊戲邏輯需要）
    limitsNavigationsToAppBoundDomains: true,
    // 偏好用 WKWebView 而非舊版 UIWebView
    contentInset: 'automatic',
  },
  plugins: {
    // 未來可加入：SplashScreen、StatusBar、Keyboard 等
  },
};

export default config;
