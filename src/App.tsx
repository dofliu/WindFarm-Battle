// ============================================================
// App 入口：Stage（1440×900 scale-to-fit）+ ThemeProvider，
// 在 title / battle / gameOver 三個畫面之間切換。
// 邏輯與資料完全來自 Zustand store（src/store/game-store.ts）。
// ============================================================
import { useCallback, useState } from 'react';
import { useGameStore } from './store/game-store';
import { Stage } from './ui/stage/Stage';
import { ThemeProvider } from './ui/theme/ThemeContext';
import { TitleScreen } from './ui/screens/TitleScreen';
import { BattleScreen } from './ui/screens/BattleScreen';
import { GameOverScreen } from './ui/screens/GameOverScreen';
import { ThemeSwitcher } from './ui/components/ThemeSwitcher';

type ScreenKey = 'title' | 'battle' | 'gameover';

function AppInner() {
  const newGame = useGameStore((s) => s.newGame);
  const state = useGameStore((s) => s.state);
  const [screen, setScreen] = useState<ScreenKey>('title');
  const [showTheme, setShowTheme] = useState(false);

  const handleStart = useCallback(() => {
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
      <AppInner />
    </ThemeProvider>
  );
}
