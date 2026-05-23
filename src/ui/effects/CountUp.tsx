// 數字遞增動畫，給回合結算 toast / 結局畫面使用。
import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';

interface Props {
  readonly from: number;
  readonly to: number;
  readonly duration?: number;
  readonly format?: (v: number) => string;
  readonly style?: CSSProperties;
}

export function CountUp({ from, to, duration = 1200, format = (v) => String(v), style }: Props) {
  const [v, setV] = useState(from);
  useEffect(() => {
    if (from === to) {
      setV(to);
      return;
    }
    const start = Date.now();
    const id = window.setInterval(() => {
      const tt = Math.min(1, (Date.now() - start) / duration);
      const eased = 1 - Math.pow(1 - tt, 3);
      setV(Math.round(from + (to - from) * eased));
      if (tt >= 1) window.clearInterval(id);
    }, 30);
    return () => window.clearInterval(id);
  }, [from, to, duration]);
  return <span style={style}>{format(v)}</span>;
}
