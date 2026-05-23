// ============================================================
// 玩家手牌（含拖曳出牌）：
//   - pointerdown 開始拖曳，pointermove 跟著移動，pointerup 落點判定
//   - turbine / tech / func / weather / contract → 自己場地
//   - fault → 對手機組（落點未中時，進入 click-to-target 模式 selectFaultTarget）
// 主要 state machine 抄自 proto/battle.jsx dragInfo
// ============================================================
import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import type { GameState } from '../../core/types';
import { CARDS } from '../../core/cards';
import { canPlayCard } from '../../core/actions';
import { Card } from './Card';
import { HoverPreview } from './HoverPreview';
import { useTheme } from '../theme/ThemeContext';
import { viewportToStage } from '../stage/Stage';

export interface DragInfo {
  readonly handIdx: number;
  readonly cardId: string;
  x: number;
  y: number;
}

interface HandProps {
  readonly state: GameState;
  readonly isPlayerTurn: boolean;
  readonly pendingFaultHandIdx: number | null;
  /** 拖曳結束時呼叫：依卡類 + 落點 zone 觸發出牌 */
  readonly onDragEnd: (info: DragInfo, dropZone: { zone: 'mine' | 'opp' | null; slot: number | null }) => void;
  /** 玩家點擊手牌 — 沒拖曳意圖時（手機？）的退讓行為 */
  readonly onCardClick?: (handIdx: number) => void;
  readonly cardSize?: number;
  readonly onDragStateChange?: (info: DragInfo | null) => void;
}

export function Hand({
  state,
  isPlayerTurn,
  pendingFaultHandIdx,
  onDragEnd,
  onCardClick,
  cardSize = 138,
  onDragStateChange,
}: HandProps) {
  const { theme } = useTheme();
  const me = state.players[0];
  const [dragInfo, setDragInfo] = useState<DragInfo | null>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const dragInfoRef = useRef<DragInfo | null>(null);
  dragInfoRef.current = dragInfo;

  // 對外通知拖曳狀態（讓 BattleScreen 顯示 overlay）
  useEffect(() => {
    onDragStateChange?.(dragInfo);
  }, [dragInfo, onDragStateChange]);

  // 全域 pointer move / up 事件
  useEffect(() => {
    if (!dragInfo) return;
    const onMove = (e: PointerEvent) => {
      setDragInfo((d) => (d ? { ...d, x: e.clientX, y: e.clientY } : d));
    };
    const onUp = (e: PointerEvent) => {
      const current = dragInfoRef.current;
      if (!current) return;
      // 找落點：用 elementsFromPoint 跳過拖曳 overlay
      const els = document.elementsFromPoint(e.clientX, e.clientY);
      const target = els.find((el) => !el.closest('[data-drag-overlay]')) ?? els[0];
      const mine = target?.closest('[data-zone="play-mine"]');
      const opp = target?.closest('[data-zone="play-opp"]');
      const slotEl = target?.closest('[data-slot]');
      const slot = slotEl ? parseInt(slotEl.getAttribute('data-slot') ?? '-1', 10) : null;
      const zone: 'mine' | 'opp' | null = mine ? 'mine' : opp ? 'opp' : null;
      onDragEnd(current, { zone, slot: Number.isFinite(slot ?? NaN) ? slot : null });
      setDragInfo(null);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [dragInfo, onDragEnd]);

  const startDrag = (e: ReactPointerEvent<HTMLDivElement>, handIdx: number, cardId: string) => {
    e.preventDefault();
    setDragInfo({ handIdx, cardId, x: e.clientX, y: e.clientY });
    setHoverIdx(null);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, flex: 1, justifyContent: 'center', position: 'relative' }}>
      {me.hand.length === 0 && (
        <div
          style={{
            color: theme.textSecondary,
            fontSize: 12,
            fontFamily: theme.fontUI,
            padding: '20px 24px',
            border: `1.5px dashed ${theme.border}`,
            borderRadius: 12,
          }}
        >
          手牌空
        </div>
      )}
      {me.hand.map((cardId, i) => {
        const card = CARDS[cardId];
        if (!card) return null;
        const canAfford = isPlayerTurn && canPlayCard(state, 0, i);
        const isDragging = dragInfo?.handIdx === i;
        const isPending = pendingFaultHandIdx === i;
        const offset = Math.abs(i - (me.hand.length - 1) / 2);
        const angle = (i - (me.hand.length - 1) / 2) * 2.5;
        return (
          <div
            key={`${i}-${cardId}`}
            style={{
              position: 'relative',
              marginLeft: i === 0 ? 0 : -14,
              zIndex: hoverIdx === i ? 50 : Math.max(1, 10 - Math.round(offset)),
              transform:
                !isDragging && !pendingFaultHandIdx && !isPending
                  ? `translateY(${offset * 3}px) rotate(${angle}deg)`
                  : 'none',
              transition: 'transform 0.2s',
            }}
          >
            <Card
              cardId={cardId}
              lifted={hoverIdx === i && !isDragging}
              faded={!canAfford || isDragging}
              size={cardSize}
              onMouseEnter={() => setHoverIdx(i)}
              onMouseLeave={() => setHoverIdx((cur) => (cur === i ? null : cur))}
              onPointerDown={
                canAfford
                  ? (e) => startDrag(e, i, cardId)
                  : onCardClick
                    ? () => onCardClick(i)
                    : undefined
              }
            />
            {hoverIdx === i && !isDragging && !dragInfo && <HoverPreview cardId={cardId} />}
          </div>
        );
      })}
    </div>
  );
}

/** 拖曳中的浮動卡片（黏在指標上）。座標已由 Stage scale 轉成 stage 座標。 */
export function DragOverlay({ info, cardSize = 138 }: { readonly info: DragInfo; readonly cardSize?: number }) {
  const p = viewportToStage(info.x, info.y);
  return (
    <div
      data-drag-overlay="1"
      style={{
        position: 'absolute',
        left: p.x,
        top: p.y,
        transform: 'translate(-50%, -50%) rotate(-4deg) scale(1.15)',
        pointerEvents: 'none',
        zIndex: 1000,
        filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.5))',
      }}
    >
      <Card cardId={info.cardId} dragging size={cardSize} />
    </div>
  );
}
