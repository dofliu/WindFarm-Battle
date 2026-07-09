// ============================================================
// App 入口：Stage（1440×900 scale-to-fit）+ ThemeProvider，
// 在 title / battle / gameOver 三個畫面之間切換。
// 邏輯與資料完全來自 Zustand store（src/store/game-store.ts）。
// ============================================================
import { useCallback, useEffect, useState } from 'react';
import { useGameStore } from './store/game-store';
import { useSettingsStore } from './store/settings-store';
import { Stage } from './ui/stage/Stage';
import { ThemeProvider } from './ui/theme/ThemeContext';
import { LocaleProvider } from './ui/locale/LocaleContext';
import { TitleScreen } from './ui/screens/TitleScreen';
import { BattleScreen } from './ui/screens/BattleScreen';
import { GameOverScreen } from './ui/screens/GameOverScreen';
import { ThemeSwitcher } from './ui/components/ThemeSwitcher';
import { unlock, setMasterVolume, play } from './ui/audio/sound-engine';

type ScreenKey = 'title' | 'battle' | 'gameover';

function AppInner() {
  const newGame = useGameStore((s) => s.newGame);
  const state = useGameStore((s) => s.state);
  const volume = useSettingsStore((s) => s.volume);
  const soundOn = useSettingsStore((s) => s.soundOn);
  const [screen, setScreen] = useState<ScreenKey>('title');
  const [showTheme, setShowTheme] = useState(false);

  // 讓合成引擎的主音量跟著設定走（靜音時仍設 0 作雙保險）
  useEffect(() => {
    setMasterVolume(soundOn ? volume : 0);
  }, [volume, soundOn]);

  const handleStart = useCallback(() => {
    // 「開始」是使用者手勢 → 解鎖音訊（瀏覽器自動播放政策）並給開場鐘聲
    unlock();
    if (useSettingsStore.getState().soundOn) {
      setMasterVolume(useSettingsStore.getState().volume);
      play('roundStart');
    }
    newGame();
    setScreen('battle');
  }, [newGame]);

  const handleRestart = useCallback(() => {
    newGame();
    setScreen('battle');
  }, [newGame]);

  const handleTitle = useCallback(() => {
    setScreen('title');
  }, []);

  const handleGameOver = useCallback(() => {
    setScreen('gameover');
  }, []);

  return (
    <Stage>
      {screen === 'title' && <TitleScreen onStart={handleStart} onTheme={() => setShowTheme(true)} />}
      {screen === 'battle' && <BattleScreen onTitle={handleTitle} onGameOver={handleGameOver} />}
      {screen === 'gameover' && <GameOverScreen state={state} onRestart={handleRestart} onTitle={handleTitle} />}
      {showTheme && <ThemeSwitcher onClose={() => setShowTheme(false)} />}
    </Stage>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LocaleProvider>
        <AppInner />
      </LocaleProvider>
    </ThemeProvider>
  );
}
