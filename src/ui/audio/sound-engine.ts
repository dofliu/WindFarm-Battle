// ============================================================
// Web Audio 合成音效引擎（零音檔）。
//
// 設計理念：教學工具要能輕鬆散佈、不塞一堆 mp3、離線可跑，
// 所以所有音效都用 Web Audio API「即時合成」——振盪器 + 噪音 + 包絡，
// 每個語意音（出牌 / 故障 / 修復…）是一段程式配方（recipe），非音檔。
//
// 瀏覽器自動播放政策：AudioContext 必須在「使用者手勢」後才能發聲。
// 因此 context 延遲建立，並在首次 pointer/key/touch 事件時 resume（unlock）。
//
// 架構定位：UI-tier（用瀏覽器 API），core/ 不依賴此檔。
// 對外只暴露 play(name, offset) / unlock() / setMasterVolume() / isAvailable()。
// ============================================================

export type SoundName =
  | 'cardPlay'
  | 'deploy'
  | 'techDeploy'
  | 'faultHit'
  | 'faultCascade'
  | 'repairFull'
  | 'repairPartial'
  | 'shieldAbsorb'
  | 'shieldUp'
  | 'score'
  | 'mwhBoost'
  | 'extraAction'
  | 'weather'
  | 'contract'
  | 'typhoon'
  | 'retreat'
  | 'resourceGrab'
  | 'roundStart'
  | 'skill'
  | 'shutdown'
  | 'win'
  | 'lose'
  | 'draw'
  | 'tap';

// ── AudioContext 單例管理 ────────────────────────────────────
type Ctor = typeof AudioContext;

function getAudioCtor(): Ctor | null {
  if (typeof window === 'undefined') return null;
  // Safari 舊版用 webkitAudioContext；Window 型別未必宣告這兩個屬性，故經 unknown 轉型。
  const w = window as unknown as { AudioContext?: Ctor; webkitAudioContext?: Ctor };
  return w.AudioContext ?? w.webkitAudioContext ?? null;
}

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let masterVolume = 0.7;
let unlockBound = false;

/** 引擎能否運作（瀏覽器支援 Web Audio）。SSR / jsdom 測試回傳 false。 */
export function isAvailable(): boolean {
  return getAudioCtor() !== null;
}

function ensureCtx(): AudioContext | null {
  if (ctx) return ctx;
  const Ctor = getAudioCtor();
  if (!Ctor) return null;
  try {
    ctx = new Ctor();
    master = ctx.createGain();
    master.gain.value = masterVolume;
    master.connect(ctx.destination);
  } catch {
    ctx = null;
    master = null;
  }
  return ctx;
}

/**
 * 在使用者手勢中呼叫以解鎖音訊（建立 / resume AudioContext）。
 * 綁一次全域監聽器作保險：任何點擊 / 按鍵都會嘗試 resume 被暫停的 context。
 */
export function unlock(): void {
  const c = ensureCtx();
  if (c && c.state === 'suspended') {
    void c.resume().catch(() => undefined);
  }
  if (unlockBound || typeof window === 'undefined') return;
  unlockBound = true;
  const handler = (): void => {
    const cc = ensureCtx();
    if (cc && cc.state === 'suspended') void cc.resume().catch(() => undefined);
  };
  window.addEventListener('pointerdown', handler, { passive: true });
  window.addEventListener('keydown', handler, { passive: true });
  window.addEventListener('touchstart', handler, { passive: true });
}

export function setMasterVolume(v: number): void {
  masterVolume = Math.min(1, Math.max(0, v));
  if (master && ctx) {
    // 平滑過渡避免爆音
    master.gain.setTargetAtTime(masterVolume, ctx.currentTime, 0.02);
  }
}

// ── 合成原語 ────────────────────────────────────────────────
interface ToneOpts {
  readonly freq: number;
  readonly type?: OscillatorType;
  readonly dur: number;
  readonly gain?: number;
  readonly attack?: number;
  readonly release?: number;
  /** 滑音目標頻率（頻率在 dur 內線性滑到此值） */
  readonly glideTo?: number;
  /** 相對於 now 的起始延遲（秒） */
  readonly at?: number;
}

/** 單一振盪器 + ADSR 簡化包絡（attack→sustain→release）。 */
function tone(o: ToneOpts): void {
  if (!ctx || !master) return;
  const now = ctx.currentTime + (o.at ?? 0);
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = o.type ?? 'sine';
  osc.frequency.setValueAtTime(o.freq, now);
  if (o.glideTo && o.glideTo !== o.freq) {
    osc.frequency.linearRampToValueAtTime(o.glideTo, now + o.dur);
  }
  const peak = o.gain ?? 0.3;
  const atk = o.attack ?? 0.005;
  const rel = o.release ?? Math.min(0.12, o.dur * 0.5);
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(peak, now + atk);
  g.gain.setValueAtTime(peak, now + Math.max(atk, o.dur - rel));
  g.gain.exponentialRampToValueAtTime(0.0001, now + o.dur);
  osc.connect(g);
  g.connect(master);
  osc.start(now);
  osc.stop(now + o.dur + 0.02);
}

interface NoiseOpts {
  readonly dur: number;
  readonly gain?: number;
  /** 帶通 / 低通中心頻率 */
  readonly filter?: number;
  readonly q?: number;
  readonly type?: BiquadFilterType;
  /** 濾波中心在 dur 內滑到此頻率（風/掃頻用） */
  readonly sweepTo?: number;
  readonly at?: number;
}

let noiseBuffer: AudioBuffer | null = null;
function getNoiseBuffer(c: AudioContext): AudioBuffer {
  if (noiseBuffer && noiseBuffer.sampleRate === c.sampleRate) return noiseBuffer;
  const len = Math.floor(c.sampleRate * 1.0);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  noiseBuffer = buf;
  return buf;
}

/** 一段濾波白噪音（風、掃頻、衝擊）。 */
function noise(o: NoiseOpts): void {
  if (!ctx || !master) return;
  const now = ctx.currentTime + (o.at ?? 0);
  const src = ctx.createBufferSource();
  src.buffer = getNoiseBuffer(ctx);
  const g = ctx.createGain();
  const peak = o.gain ?? 0.2;
  g.gain.setValueAtTime(0.0001, now);
  g.gain.exponentialRampToValueAtTime(peak, now + Math.min(0.03, o.dur * 0.3));
  g.gain.exponentialRampToValueAtTime(0.0001, now + o.dur);
  if (o.filter) {
    const filt = ctx.createBiquadFilter();
    filt.type = o.type ?? 'bandpass';
    filt.frequency.setValueAtTime(o.filter, now);
    if (o.sweepTo) filt.frequency.linearRampToValueAtTime(o.sweepTo, now + o.dur);
    filt.Q.value = o.q ?? 1;
    src.connect(filt);
    filt.connect(g);
  } else {
    src.connect(g);
  }
  g.connect(master);
  src.start(now);
  src.stop(now + o.dur + 0.02);
}

/** 依序播放一串音符（琶音）。 */
function arp(
  freqs: readonly number[],
  o: { type?: OscillatorType; noteDur?: number; gain?: number; gap?: number; at?: number },
): void {
  const nd = o.noteDur ?? 0.09;
  const gap = o.gap ?? nd * 0.9;
  freqs.forEach((f, i) => {
    tone({ freq: f, type: o.type ?? 'triangle', dur: nd, gain: o.gain ?? 0.26, at: (o.at ?? 0) + i * gap });
  });
}

// 音名頻率（等律，A4=440）方便寫配方
const N = {
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0, A4: 440.0, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.0, C6: 1046.5,
  G3: 196.0, C3: 130.81, E3: 164.81, A3: 220.0,
} as const;

// ── 語意音效配方 ────────────────────────────────────────────
const RECIPES: Record<SoundName, (at: number) => void> = {
  // 出牌：柔和撥弦
  cardPlay: (at) => tone({ freq: N.A4, type: 'triangle', dur: 0.12, gain: 0.22, at }),
  // 部署機組：兩音上行（葉片轉起來）+ 一絲風
  deploy: (at) => {
    tone({ freq: N.E4, type: 'sawtooth', dur: 0.16, gain: 0.14, glideTo: N.A4, at });
    tone({ freq: N.A4, type: 'triangle', dur: 0.18, gain: 0.18, at: at + 0.09 });
    noise({ dur: 0.22, gain: 0.05, filter: 600, sweepTo: 1600, q: 0.7, at });
  },
  // 招募技師：溫暖和弦點
  techDeploy: (at) => {
    tone({ freq: N.C4, type: 'triangle', dur: 0.2, gain: 0.16, at });
    tone({ freq: N.E4, type: 'triangle', dur: 0.2, gain: 0.14, at });
    tone({ freq: N.G4, type: 'triangle', dur: 0.22, gain: 0.13, at: at + 0.03 });
  },
  // 施加故障：刺耳下行 buzz + 衝擊噪音
  faultHit: (at) => {
    tone({ freq: 320, type: 'sawtooth', dur: 0.22, gain: 0.2, glideTo: 90, at });
    noise({ dur: 0.16, gain: 0.16, filter: 1800, sweepTo: 300, q: 0.8, at });
  },
  // 連鎖故障：雙重衝擊
  faultCascade: (at) => {
    RECIPES.faultHit(at);
    tone({ freq: 260, type: 'square', dur: 0.18, gain: 0.14, glideTo: 70, at: at + 0.12 });
  },
  // 完全修復：明亮上行琶音（成功）
  repairFull: (at) => arp([N.C5, N.E5, N.G5, N.C6], { type: 'triangle', noteDur: 0.1, gain: 0.2, gap: 0.07, at }),
  // 部分修復：較短、較悶的兩音（提醒「不完全」）
  repairPartial: (at) => {
    tone({ freq: N.E4, type: 'triangle', dur: 0.12, gain: 0.18, at });
    tone({ freq: N.G4, type: 'triangle', dur: 0.14, gain: 0.15, at: at + 0.09 });
  },
  // 保護盾吸收：金屬 ping
  shieldAbsorb: (at) => {
    tone({ freq: N.C6, type: 'sine', dur: 0.28, gain: 0.16, at });
    tone({ freq: N.G5, type: 'sine', dur: 0.24, gain: 0.1, at: at + 0.02 });
  },
  shieldUp: (at) => tone({ freq: N.G4, type: 'sine', dur: 0.22, gain: 0.16, glideTo: N.D5, at }),
  // 得分：清脆亮音
  score: (at) => {
    tone({ freq: N.G5, type: 'triangle', dur: 0.12, gain: 0.2, at });
    tone({ freq: N.C6, type: 'triangle', dur: 0.16, gain: 0.16, at: at + 0.08 });
  },
  // 發電加成：閃爍上行
  mwhBoost: (at) => arp([N.E5, N.A5, N.C6], { type: 'sine', noteDur: 0.09, gain: 0.16, gap: 0.06, at }),
  // 額外動作：輕快 tick
  extraAction: (at) => tone({ freq: N.D5, type: 'square', dur: 0.07, gain: 0.12, at }),
  // 天氣：空靈掃風
  weather: (at) => noise({ dur: 0.5, gain: 0.12, filter: 400, sweepTo: 2200, q: 0.6, at }),
  // 合約：紙張 / 蓋章
  contract: (at) => {
    tone({ freq: N.C4, type: 'square', dur: 0.09, gain: 0.14, at });
    noise({ dur: 0.08, gain: 0.1, filter: 900, type: 'lowpass', at: at + 0.02 });
  },
  // 颱風：低頻隆隆 + 下行（戲劇性）
  typhoon: (at) => {
    tone({ freq: 140, type: 'sawtooth', dur: 0.9, gain: 0.2, glideTo: 55, at });
    noise({ dur: 0.9, gain: 0.16, filter: 300, sweepTo: 120, q: 0.5, at });
    tone({ freq: N.A3, type: 'square', dur: 0.5, gain: 0.08, glideTo: N.E3, at: at + 0.1 });
  },
  // 撤退：下行 swoosh
  retreat: (at) => noise({ dur: 0.3, gain: 0.12, filter: 1400, sweepTo: 300, q: 0.9, at }),
  // 搶資源：喀噠上鎖
  resourceGrab: (at) => {
    tone({ freq: N.A4, type: 'square', dur: 0.05, gain: 0.14, at });
    tone({ freq: N.D5, type: 'square', dur: 0.07, gain: 0.14, at: at + 0.05 });
  },
  // 新回合：柔和鐘聲
  roundStart: (at) => {
    tone({ freq: N.C5, type: 'sine', dur: 0.3, gain: 0.14, at });
    tone({ freq: N.G4, type: 'sine', dur: 0.34, gain: 0.1, at: at + 0.02 });
  },
  // 技師出招
  skill: (at) => {
    tone({ freq: N.D5, type: 'triangle', dur: 0.1, gain: 0.18, glideTo: N.G5, at });
    tone({ freq: N.G5, type: 'sine', dur: 0.1, gain: 0.12, at: at + 0.06 });
  },
  // 緊急停機：警報下墜
  shutdown: (at) => {
    tone({ freq: 440, type: 'square', dur: 0.5, gain: 0.16, glideTo: 110, at });
    noise({ dur: 0.4, gain: 0.08, filter: 500, sweepTo: 150, at: at + 0.05 });
  },
  // 勝利：凱旋琶音
  win: (at) => arp([N.C5, N.E5, N.G5, N.C6, N.E5, N.G5, N.C6], { type: 'triangle', noteDur: 0.14, gain: 0.22, gap: 0.11, at }),
  // 敗北：下行嘆息
  lose: (at) => arp([N.G4, N.E4, N.C4, N.G3], { type: 'sine', noteDur: 0.2, gain: 0.18, gap: 0.16, at }),
  // 平手：中性兩音
  draw: (at) => {
    tone({ freq: N.C5, type: 'triangle', dur: 0.24, gain: 0.16, at });
    tone({ freq: N.G4, type: 'triangle', dur: 0.28, gain: 0.14, at: at + 0.18 });
  },
  // 按鈕輕觸
  tap: (at) => tone({ freq: N.A4, type: 'sine', dur: 0.05, gain: 0.1, at }),
};

/**
 * 播放一個語意音效。
 * @param name 音效名稱
 * @param offsetSec 相對於現在的起始延遲（秒），用於批次錯開避免糊成一團
 */
export function play(name: SoundName, offsetSec = 0): void {
  const c = ensureCtx();
  if (!c) return;
  if (c.state === 'suspended') void c.resume().catch(() => undefined);
  const recipe = RECIPES[name];
  if (!recipe) return;
  try {
    recipe(Math.max(0, offsetSec));
  } catch {
    /* 合成失敗（極少數瀏覽器）不應影響遊戲 */
  }
}

// 給測試使用（jsdom 無 AudioContext，僅驗證 API 形狀）
export const _soundNames = Object.keys(RECIPES) as SoundName[];
