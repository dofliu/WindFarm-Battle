// ============================================================
// Stage — 把整個遊戲鎖定在設計畫布，依視窗大小 scale-to-fit。
// 橫向（桌面）用 1440×900；直向（手機直握）改用 880×1560。
// 採用 letterbox（保持比例、補黑邊）。
//
// 額外暴露 wfViewportToStage(x, y)：把瀏覽器視窗座標轉成 stage 座標，
// 拖曳出牌的 overlay 需要這個來貼齊指標位置（讀即時 rect+scale，方向切換不受影響）。
// ============================================================
import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useOrientation } from './useOrientation';

export const STAGE_W = 1440;
export const STAGE_H = 900;
export const PORTRAIT_W = 880;
export const PORTRAIT_H = 1560;

interface StageGlobals {
  wfStageScale?: number;
  wfStageRect?: DOMRect | null;
  wfViewportToStage?: (x: number, y: number) => { x: number; y: number };
}

const globals = window as Window & StageGlobals;

globals.wfViewportToStage = (x: number, y: number) => {
  const rect = globals.wfStageRect;
  const scale = globals.wfStageScale ?? 1;
  if (!rect) return { x, y };
  return { x: (x - rect.left) / scale, y: (y - rect.top) / scale };
};

export function viewportToStage(x: number, y: number): { x: number; y: number } {
  return globals.wfViewportToStage!(x, y);
}

export function getStageScale(): number {
  return globals.wfStageScale ?? 1;
}

export function Stage({ children }: { readonly children: ReactNode }) {
  const orientation = useOrientation();
  const stageW = orientation === 'portrait' ? PORTRAIT_W : STAGE_W;
  const stageH = orientation === 'portrait' ? PORTRAIT_H : STAGE_H;
  const [scale, setScale] = useState(1);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const recompute = () => {
      const s = Math.min(window.innerWidth / stageW, window.innerHeight / stageH);
      setScale(s);
      globals.wfStageScale = s;
      if (ref.current) globals.wfStageRect = ref.current.getBoundingClientRect();
    };
    recompute();
    window.addEventListener('resize', recompute);
    window.addEventListener('scroll', recompute, true);
    return () => {
      window.removeEventListener('resize', recompute);
      window.removeEventListener('scroll', recompute, true);
    };
  }, [stageW, stageH]);

  // scale 變更後同步更新 rect（含 scroll 等情境）
  useEffect(() => {
    if (ref.current) globals.wfStageRect = ref.current.getBoundingClientRect();
  }, [scale]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#0d1924',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <div
        ref={ref}
        style={{
          width: stageW,
          height: stageH,
          flexShrink: 0,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 30px 80px rgba(0,0,0,0.5)',
        }}
      >
        {children}
      </div>
    </div>
  );
}
