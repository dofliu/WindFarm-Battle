// 體驗設定 store：預設值 / 切換 / clamp / 持久化。手感沉浸強化 S8。
import { describe, it, expect, beforeEach } from 'vitest';
import { useSettingsStore, getSettings, _resetSettingsForTest } from '../src/store/settings-store';

const KEY = 'wfb-settings';

beforeEach(() => {
  window.localStorage.clear();
  _resetSettingsForTest();
});

describe('預設值', () => {
  it('音效預設開、音量 0.7、手機震動開', () => {
    const s = getSettings();
    expect(s.soundOn).toBe(true);
    expect(s.volume).toBeCloseTo(0.7);
    expect(s.hapticsOn).toBe(true);
    // screenShakeOn 預設隨系統 prefers-reduced-motion；jsdom 無 matchMedia → true
    expect(typeof s.screenShakeOn).toBe('boolean');
  });
});

describe('切換與設定', () => {
  it('toggleSound 反轉音效開關', () => {
    expect(getSettings().soundOn).toBe(true);
    useSettingsStore.getState().toggleSound();
    expect(getSettings().soundOn).toBe(false);
    useSettingsStore.getState().toggleSound();
    expect(getSettings().soundOn).toBe(true);
  });

  it('setVolume 夾在 0..1', () => {
    useSettingsStore.getState().setVolume(1.8);
    expect(getSettings().volume).toBe(1);
    useSettingsStore.getState().setVolume(-0.5);
    expect(getSettings().volume).toBe(0);
    useSettingsStore.getState().setVolume(0.42);
    expect(getSettings().volume).toBeCloseTo(0.42);
  });

  it('setScreenShakeOn / setHapticsOn 生效', () => {
    useSettingsStore.getState().setScreenShakeOn(false);
    expect(getSettings().screenShakeOn).toBe(false);
    useSettingsStore.getState().setHapticsOn(false);
    expect(getSettings().hapticsOn).toBe(false);
  });
});

describe('持久化', () => {
  it('設定寫入 localStorage（wfb-settings）', () => {
    useSettingsStore.getState().setVolume(0.3);
    useSettingsStore.getState().setSoundOn(false);
    const raw = window.localStorage.getItem(KEY);
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw as string);
    expect(parsed.volume).toBeCloseTo(0.3);
    expect(parsed.soundOn).toBe(false);
  });
});
