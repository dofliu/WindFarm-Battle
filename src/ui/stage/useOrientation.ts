// ============================================================
// useOrientation — 依視窗長寬比判斷直向 / 橫向。
// 直向（高 ≥ 寬）給手機直握使用，橫向沿用桌面設計。
// Stage 用它挑畫布尺寸，BattleScreen 用它切換版面。
// ============================================================
import { useEffect, useState } from 'react';

export type Orientation = 'portrait' | 'landscape';

export function getOrientation(): Orientation {
  return window.innerHeight >= window.innerWidth ? 'portrait' : 'landscape';
}

export function useOrientation(): Orientation {
  const [orientation, setOrientation] = useState<Orientation>(getOrientation());
  useEffect(() => {
    const onResize = () => setOrientation(getOrientation());
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
    };
  }, []);
  return orientation;
}
