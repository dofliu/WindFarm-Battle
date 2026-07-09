// ============================================================
// 使用者體驗設定（音效 / 音量 / 螢幕震動 / 手機震動）。
//
// 為什麼獨立成一個 store：這些是「跨畫面、需持久化」的偏好，
// 與遊戲狀態（game-store）生命週期不同——重開一局不該重置音量。
// 持久化到 localStorage（鍵：wfb-settings），與 ThemeContext 同一套模式。
//
// 架構定位：屬 store 層（UI-tier），可讀瀏覽器 API；core/ 不依賴此檔。
// ============================================================
import { create } from 'zustand';

const STORAGE_KEY = 'wfb-settings';

export interface Settings {
  /** 總開關：關閉時完全靜音（不建立/不播放任何音訊） */
  soundOn: boolean;
  /** 主音量 0..1 */
  volume: number;
  /** 螢幕震動（受擊 / 颱風時的畫面抖動）。預設尊重系統 prefers-reduced-motion */
  screenShakeOn: boolean;
  /** 手機震動回饋（navigator.vibrate；桌機無效果，安全略過） */
  hapticsOn: boolean;
}

interface SettingsStore extends Settings {
  setSoundOn: (v: boolean) => void;
  toggleSound: () => void;
  setVolume: (v: number) => void;
  setScreenShakeOn: (v: boolean) => void;
  setHapticsOn: (v: boolean) => void;
}

/** 系統是否偏好減少動態效果（無障礙）。用於 screenShakeOn 的預設值。 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

const DEFAULTS: Settings = {
  soundOn: true,
  volume: 0.7,
  // 尊重系統無障礙偏好：使用者若要求減少動態，預設關閉螢幕震動
  screenShakeOn: !prefersReducedMotion(),
  hapticsOn: true,
};

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

/** 讀取持久化設定；缺鍵時回退預設，容忍隱私模式 / SSR。 */
function readStored(): Settings {
  if (typeof window === 'undefined') return { ...DEFAULTS };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw) as Partial<Settings>;
    return {
      soundOn: typeof parsed.soundOn === 'boolean' ? parsed.soundOn : DEFAULTS.soundOn,
      volume: typeof parsed.volume === 'number' ? clamp01(parsed.volume) : DEFAULTS.volume,
      screenShakeOn:
        typeof parsed.screenShakeOn === 'boolean' ? parsed.screenShakeOn : DEFAULTS.screenShakeOn,
      hapticsOn: typeof parsed.hapticsOn === 'boolean' ? parsed.hapticsOn : DEFAULTS.hapticsOn,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

function persist(s: Settings): void {
  if (typeof window === 'undefined') return;
  try {
    const payload: Settings = {
      soundOn: s.soundOn,
      volume: s.volume,
      screenShakeOn: s.screenShakeOn,
      hapticsOn: s.hapticsOn,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* ignore（隱私模式 / 配額） */
  }
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  ...readStored(),

  setSoundOn: (v) => {
    set({ soundOn: v });
    persist(get());
  },
  toggleSound: () => {
    set({ soundOn: !get().soundOn });
    persist(get());
  },
  setVolume: (v) => {
    set({ volume: clamp01(v) });
    persist(get());
  },
  setScreenShakeOn: (v) => {
    set({ screenShakeOn: v });
    persist(get());
  },
  setHapticsOn: (v) => {
    set({ hapticsOn: v });
    persist(get());
  },
}));

/**
 * 給非 React 環境（如 sound-engine 排程回呼、event-sounds）讀取當前設定的快照。
 * Zustand store 在 React 外也能用 getState()。
 */
export function getSettings(): Settings {
  const s = useSettingsStore.getState();
  return {
    soundOn: s.soundOn,
    volume: s.volume,
    screenShakeOn: s.screenShakeOn,
    hapticsOn: s.hapticsOn,
  };
}

// 給測試使用：重設為預設並清除持久化（不對 UI 公開）
export const _resetSettingsForTest = (): void => {
  useSettingsStore.setState({ ...DEFAULTS });
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }
};
