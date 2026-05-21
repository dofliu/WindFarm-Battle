// Zustand store（UI 狀態）。Sprint 2/5 會接上 core 的 GameState 與動作。
import { create } from 'zustand';
import type { GameMode, Difficulty } from '../core/types';

interface AppStore {
  mode: GameMode;
  difficulty: Difficulty;
  setMode: (mode: GameMode) => void;
  setDifficulty: (difficulty: Difficulty) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  mode: 'versus',
  difficulty: 'hard',
  setMode: (mode) => set({ mode }),
  setDifficulty: (difficulty) => set({ difficulty }),
}));
