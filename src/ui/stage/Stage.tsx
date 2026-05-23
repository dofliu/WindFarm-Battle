// ============================================================
// Stage — 把整個遊戲鎖定在 1440×900 設計畫布，依視窗大小 scale-to-fit。
// 採用 letterbox（保持比例、補黑邊），未來行動裝置直向再加 portrait layout。
//
// 額外暴露 wfViewportToStage(x, y)：把瀏覽器視窗座標轉成 stage 座標，
// 拖曳出牌的 overlay 需要這個來貼齊指標位置。
// ============================================================
import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

export const STAGE_W = 1440;
export const STAGE_H = 900;

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
  const [scale, setScale] = useState(1);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const recompute = () => {
      const s = Math.min(window.innerWidth / STAGE_W, window.innerHeight / STAGE_H);
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
  }, []);

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
          width: STAGE_W,
          height: STAGE_H,
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
