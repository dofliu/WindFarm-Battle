// ============================================================
// 故障 / 修復一次性特效。
// 由 store.effects 觸發；800-1000ms 後 store 自動移除節點。
// ============================================================
import { CARDS } from '../../core/cards';
import { pickIcon, FaultLightning, Spark } from '../icons';
import type { CardType } from '../styles/themes';

interface FaultFlashProps {
  readonly cardId?: string;
}

/** v2 卡類（tool/item）映射到舊主題色系的六大類 */
function mapToThemeType(type: string | undefined): CardType {
  if (type === 'tool') return 'tech';
  if (type === 'item') return 'func';
  if (type === 'turbine' || type === 'tech' || type === 'fault' || type === 'func' || type === 'weather' || type === 'contract') return type;
  return 'fault';
}

export function FaultFlashFX({ cardId }: FaultFlashProps) {
  const card = cardId ? CARDS[cardId] : undefined;
  const IconComp = card ? pickIcon(card.icon, mapToThemeType(card.type)) : FaultLightning;
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
      }}
    >
      {/* 紅色閃光 */}
      <div
        style={{
          position: 'absolute',
          inset: -10,
          borderRadius: 22,
          background: 'radial-gradient(circle, rgba(217,108,90,0.7) 0%, transparent 70%)',
          animation: 'wf-fault-flash 1s ease-out forwards',
        }}
      />
      {/* 五道放射閃電 */}
      <svg width="120" height="120" viewBox="0 0 120 120" style={{ position: 'absolute' }}>
        {[0, 72, 144, 216, 288].map((rot) => (
          <g key={rot} transform={`rotate(${rot} 60 60)`} style={{ animation: 'wf-fault-bolt 0.6s ease-out' }}>
            <path
              d="M 60 20 L 56 50 L 64 50 L 58 80"
              stroke="#fff"
              strokeWidth={2.5}
              fill="none"
              opacity="0.9"
              filter="drop-shadow(0 0 4px #d96c5a)"
            />
          </g>
        ))}
      </svg>
      {/* 中央 icon */}
      <div style={{ position: 'relative', animation: 'wf-fault-zoom 1s ease-out forwards' }}>
        <IconComp size={48} stroke="#fff" strokeWidth={2.5} style={{ filter: 'drop-shadow(0 0 8px #d96c5a)' }} />
      </div>
    </div>
  );
}

const SPARKLE_POSITIONS: ReadonlyArray<{ x: number; y: number; delay: number }> = [
  { x: 0.2, y: 0.3, delay: 0 },
  { x: 0.8, y: 0.4, delay: 0.1 },
  { x: 0.5, y: 0.2, delay: 0.05 },
  { x: 0.3, y: 0.7, delay: 0.15 },
  { x: 0.7, y: 0.75, delay: 0.2 },
  { x: 0.5, y: 0.5, delay: 0.05 },
];

export function RepairFX() {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: -10,
          borderRadius: 22,
          background: 'radial-gradient(circle, rgba(93,181,140,0.5) 0%, transparent 70%)',
          animation: 'wf-repair-flash 0.9s ease-out forwards',
        }}
      />
      {SPARKLE_POSITIONS.map((p, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${p.x * 100}%`,
            top: `${p.y * 100}%`,
            transform: 'translate(-50%, -50%)',
            animation: `wf-sparkle 0.7s ease-out ${p.delay}s forwards`,
            opacity: 0,
          }}
        >
          <Spark size={20} stroke="#5db58c" fill="#a8d878" strokeWidth={1.5} style={{ filter: 'drop-shadow(0 0 6px #5db58c)' }} />
        </div>
      ))}
      <div style={{ position: 'relative', animation: 'wf-repair-check 0.9s ease-out forwards', opacity: 0 }}>
        <svg width="48" height="48" viewBox="0 0 48 48">
          <circle cx="24" cy="24" r="20" fill="#5db58c" style={{ filter: 'drop-shadow(0 0 12px #5db58c)' }} />
          <path d="M 14 24 L 21 31 L 34 17" stroke="#fff" strokeWidth={3.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}
