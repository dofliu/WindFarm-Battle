// 中央回合資訊條：回合進度 / 風速骰 / 動作點 / 天氣 + 合約狀態。
import { useTheme } from '../theme/ThemeContext';
import { DiceRoller } from '../effects/Dice';
import { Storm, Contract } from '../icons';
import { CARDS } from '../../core/cards';
import { cardName } from '../../i18n';
import type { GameState, Wind, ActiveWeather, ActiveContract } from '../../core/types';

/** 把 wind.roll 轉成兩顆骰子的點數陣列。'6+6' → [6,6]；單顆 → [n, null]；數字字串/數字皆支援 */
function rollToDice(wind: Wind): [number | null, number | null] {
  const r = wind.roll;
  if (r === '6+6' || r === 12) return [6, 6];
  if (typeof r === 'number') return [r, null];
  if (typeof r === 'string') {
    const n = parseInt(r, 10);
    return Number.isFinite(n) ? [n, null] : [null, null];
  }
  return [null, null];
}

interface CenterProps {
  readonly state: GameState;
  readonly windRolling: boolean;
}

export function BattleCenter({ state, windRolling }: CenterProps) {
  const { themeKey } = useTheme();
  return (
    <div
      style={{
        padding: '10px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
        flexWrap: 'wrap',
        background:
          themeKey === 'tideboard'
            ? 'linear-gradient(180deg, rgba(40,25,15,0.85) 0%, rgba(30,18,8,0.95) 100%)'
            : 'rgba(255,255,255,0.4)',
        borderTop: themeKey === 'tideboard' ? '2px solid #c89848' : '1px solid rgba(28,42,58,0.06)',
        borderBottom: themeKey === 'tideboard' ? '2px solid #c89848' : '1px solid rgba(28,42,58,0.06)',
        backdropFilter: themeKey === 'cumulus' ? 'blur(10px)' : 'none',
      }}
    >
      <RoundDisplay round={state.round} maxRounds={state.maxRounds} />
      <Divider />
      <WindDisplay wind={state.wind} rolling={windRolling} />
      <Divider />
      <ActionPips actionsLeft={state.actionsLeft} />
      {(state.activeWeather.length > 0 || state.activeContracts.length > 0) && (
        <>
          <Divider />
          <StatusEffects weather={state.activeWeather} contracts={state.activeContracts} />
        </>
      )}
    </div>
  );
}

function Divider() {
  const { themeKey } = useTheme();
  return (
    <div
      style={{
        height: 36,
        width: 1,
        background: themeKey === 'tideboard' ? 'rgba(200,152,72,0.4)' : 'rgba(28,42,58,0.1)',
      }}
    />
  );
}

function RoundDisplay({ round, maxRounds }: { readonly round: number; readonly maxRounds: number }) {
  const { themeKey } = useTheme();
  if (themeKey === 'tideboard') {
    return (
      <div style={{ textAlign: 'center', color: '#f4d68a' }}>
        <div style={{ fontSize: 9, letterSpacing: '0.25em', opacity: 0.7, fontFamily: '"Cinzel", serif' }}>VOYAGE</div>
        <div style={{ fontSize: 26, fontWeight: 700, lineHeight: 1, fontFamily: 'Georgia, serif' }}>
          {round}
          <span style={{ fontSize: 12, opacity: 0.5 }}>/{maxRounds}</span>
        </div>
        <div style={{ display: 'flex', gap: 1.5, justifyContent: 'center', marginTop: 4 }}>
          {Array.from({ length: maxRounds }, (_, i) => (
            <div
              key={i}
              style={{ width: 6, height: 3, background: i < round ? '#c89848' : 'rgba(200,152,72,0.2)' }}
            />
          ))}
        </div>
      </div>
    );
  }
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 9, color: '#6a7888', letterSpacing: '0.2em', textTransform: 'uppercase' }}>回合</div>
      <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1, color: '#1c2a3a' }}>
        {round}
        <span style={{ fontSize: 12, color: '#6a7888', fontWeight: 400 }}>/{maxRounds}</span>
      </div>
      <div style={{ display: 'flex', gap: 1.5, justifyContent: 'center', marginTop: 4 }}>
        {Array.from({ length: maxRounds }, (_, i) => (
          <div
            key={i}
            style={{
              width: 6,
              height: 3,
              borderRadius: 999,
              background: i < round ? '#3aa7c8' : 'rgba(28,42,58,0.1)',
              boxShadow: i === round - 1 ? '0 0 4px #3aa7c8' : 'none',
            }}
          />
        ))}
      </div>
    </div>
  );
}

function WindDisplay({ wind, rolling }: { readonly wind: Wind; readonly rolling: boolean }) {
  const { themeKey } = useTheme();
  const dice = rollToDice(wind);
  if (themeKey === 'tideboard') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <DiceRoller dice={dice} rolling={rolling} typhoon={wind.typhoon} theme={themeKey} size={48} />
        <div style={{ color: '#f4d68a', fontFamily: 'Georgia, serif' }}>
          <div style={{ fontSize: 9, letterSpacing: '0.25em', color: '#c89848', fontFamily: '"Cinzel", serif' }}>WIND</div>
          <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.1 }}>
            {wind.speed}
            <span style={{ fontSize: 11, color: '#c89848' }}>m/s</span>
          </div>
          <div style={{ fontSize: 10, color: '#c89848' }}>
            {wind.label} · ×{wind.coeff.toFixed(2)}
          </div>
        </div>
      </div>
    );
  }
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '8px 18px 8px 10px',
        background: 'rgba(255,255,255,0.85)',
        borderRadius: 16,
        boxShadow: '0 4px 16px rgba(28,42,58,0.08)',
        border: '1px solid rgba(28,42,58,0.08)',
      }}
    >
      <DiceRoller dice={dice} rolling={rolling} typhoon={wind.typhoon} theme={themeKey} size={44} />
      <div>
        <div style={{ fontSize: 9, color: '#6a7888', letterSpacing: '0.18em', textTransform: 'uppercase' }}>本回合風速</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 1 }}>
          <span style={{ fontSize: 20, fontWeight: 700, color: '#1c2a3a' }}>{wind.speed}</span>
          <span style={{ fontSize: 11, color: '#6a7888' }}>m/s</span>
        </div>
        <div style={{ fontSize: 10, fontWeight: 600, color: wind.typhoon ? '#a8453a' : '#3aa7c8' }}>
          {wind.label} · ×{wind.coeff.toFixed(2)}
        </div>
      </div>
    </div>
  );
}

function ActionPips({ actionsLeft }: { readonly actionsLeft: number }) {
  const { themeKey } = useTheme();
  if (themeKey === 'tideboard') {
    return (
      <div style={{ textAlign: 'center', color: '#f4d68a' }}>
        <div style={{ fontSize: 9, letterSpacing: '0.25em', opacity: 0.7, fontFamily: '"Cinzel", serif' }}>ACTIONS</div>
        <div style={{ display: 'flex', gap: 4, marginTop: 6, justifyContent: 'center' }}>
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                width: 14,
                height: 14,
                borderRadius: '50%',
                background: i < actionsLeft ? 'radial-gradient(circle at 30% 30%, #f4d68a, #c89848)' : 'transparent',
                border: '1.5px solid #c89848',
                boxShadow: i < actionsLeft ? '0 0 6px rgba(244,214,138,0.6)' : 'none',
              }}
            />
          ))}
        </div>
      </div>
    );
  }
  return (
    <div>
      <div style={{ fontSize: 9, color: '#6a7888', letterSpacing: '0.2em', textTransform: 'uppercase' }}>動作</div>
      <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              width: 13,
              height: 13,
              borderRadius: '50%',
              background: i < actionsLeft ? '#d9a85a' : 'rgba(28,42,58,0.1)',
              boxShadow: i < actionsLeft ? '0 0 0 3px rgba(217,168,90,0.2)' : 'none',
              transition: 'all 0.3s ease',
            }}
          />
        ))}
      </div>
    </div>
  );
}

function StatusEffects({
  weather,
  contracts,
}: {
  readonly weather: readonly ActiveWeather[];
  readonly contracts: readonly ActiveContract[];
}) {
  const { themeKey } = useTheme();
  if (weather.length === 0 && contracts.length === 0) return null;
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {weather.map((w, i) => {
        const card = CARDS[w.cardId];
        const name = card ? cardName(w.cardId) || w.cardId : w.cardId;
        if (themeKey === 'tideboard') {
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 10px',
                background: 'rgba(217,108,90,0.15)',
                border: '1px solid #d96c5a',
              }}
            >
              <Storm size={18} stroke="#f4886a" />
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#f4886a', fontFamily: 'Georgia, serif' }}>{name}</div>
                <div style={{ fontSize: 9, color: '#f4886a', opacity: 0.7 }}>還剩 {w.duration} 回</div>
              </div>
            </div>
          );
        }
        return (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 12px',
              background: 'rgba(217,168,90,0.15)',
              border: '1px solid rgba(217,168,90,0.3)',
              borderRadius: 10,
            }}
          >
            <Storm size={18} stroke="#a87a2a" />
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#a87a2a' }}>{name}</div>
              <div style={{ fontSize: 9, color: '#a87a2a', opacity: 0.7 }}>還剩 {w.duration} 回</div>
            </div>
          </div>
        );
      })}
      {contracts.map((c, i) => {
        const card = CARDS[c.cardId];
        const name = card ? cardName(c.cardId) || c.cardId : c.cardId;
        if (themeKey === 'tideboard') {
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 10px',
                background: 'rgba(168,216,120,0.1)',
                border: '1px solid #5db58c',
              }}
            >
              <Contract size={18} stroke="#a8d878" />
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#a8d878', fontFamily: 'Georgia, serif' }}>{name}</div>
                <div style={{ fontSize: 9, color: '#a8d878', opacity: 0.7 }}>進度 {c.progress}</div>
              </div>
            </div>
          );
        }
        return (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 12px',
              background: 'rgba(157,127,200,0.12)',
              border: '1px solid rgba(157,127,200,0.3)',
              borderRadius: 10,
            }}
          >
            <Contract size={18} stroke="#7a5ca8" />
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#7a5ca8' }}>{name}</div>
              <div style={{ fontSize: 9, color: '#7a5ca8', opacity: 0.7 }}>進度 {c.progress}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
