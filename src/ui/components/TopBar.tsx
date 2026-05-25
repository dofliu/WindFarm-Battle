// 戰場頂部欄：標題 + 難度 + 動作按鈕 + 主題切換 + 語言切換。
import { useTheme } from '../theme/ThemeContext';
import { Compass, TurbineFloat } from '../icons';
import type { Difficulty } from '../../core/types';
import { t } from '../../i18n';
import { useLocale } from '../locale/LocaleContext';
import { LocaleSwitcher } from './LocaleSwitcher';

interface Props {
  readonly difficulty: Difficulty;
  readonly onDifficulty: (d: Difficulty) => void;
  readonly onLibrary?: () => void;
  readonly onRestart?: () => void;
  readonly onTitle?: () => void;
  readonly onTheme?: () => void;
  readonly onHelp?: () => void;
}

export function TopBar({ difficulty, onDifficulty, onLibrary, onRestart, onTitle, onTheme, onHelp }: Props) {
  const { theme, themeKey } = useTheme();
  useLocale(); // 訂閱語言切換，觸發重新渲染

  if (themeKey === 'tideboard') {
    return (
      <div
        style={{
          height: 52,
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(180deg, rgba(40,25,15,0.92) 0%, rgba(40,25,15,0.5) 100%)',
          borderBottom: '2px solid #c89848',
          flexShrink: 0,
        }}
      >
        <button
          type="button"
          onClick={onTitle}
          style={{
            background: 'transparent',
            border: 'none',
            padding: 0,
            margin: 0,
            font: 'inherit',
            color: 'inherit',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            cursor: 'pointer',
          }}
        >
          <Compass size={26} stroke="#e8c878" strokeWidth={1.5} />
          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: '#f4d68a',
              fontFamily: '"Cinzel", Georgia, serif',
              letterSpacing: '0.08em',
            }}
          >
            WINDFARM BATTLE
          </div>
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <select
            value={difficulty}
            onChange={(e) => onDifficulty(e.target.value as Difficulty)}
            style={{
              background: '#3d2a1e',
              color: '#f4d68a',
              border: '1px solid #c89848',
              padding: '5px 10px',
              fontFamily: 'Georgia, serif',
              fontSize: 12,
            }}
          >
            <option value="easy">{t('topbar.difficulty.easy')}</option>
            <option value="medium">{t('topbar.difficulty.medium')}</option>
            <option value="hard">{t('topbar.difficulty.hard')}</option>
          </select>
          {onHelp && <TideButton label={t('topbar.help')} onClick={onHelp} />}
          {onLibrary && <TideButton label={t('topbar.library')} onClick={onLibrary} />}
          {onTheme && <TideButton label={t('topbar.theme')} onClick={onTheme} />}
          {onRestart && <TideButton label={t('topbar.restart')} onClick={onRestart} />}
          <LocaleSwitcher
            style={{
              color: '#f4d68a',
              borderColor: '#c89848',
              background: 'transparent',
              fontFamily: 'Georgia, serif',
              fontSize: 11,
              padding: '4px 8px',
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        height: 56,
        padding: '0 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(28,42,58,0.08)',
        flexShrink: 0,
        background: 'rgba(255,255,255,0.4)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <button
        type="button"
        onClick={onTitle}
        style={{
          background: 'transparent',
          border: 'none',
          padding: 0,
          margin: 0,
          font: 'inherit',
          color: 'inherit',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          cursor: 'pointer',
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            background: '#1c2a3a',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <TurbineFloat size={20} stroke="#fff" />
        </div>
        <div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: theme.textPrimary,
              letterSpacing: '0.02em',
              whiteSpace: 'nowrap',
            }}
          >
            WindFarm Battle
          </div>
          <div
            style={{
              fontSize: 10,
              color: theme.textSecondary,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
            }}
          >
            {t('app.subtitle')}
          </div>
        </div>
      </button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <select
          value={difficulty}
          onChange={(e) => onDifficulty(e.target.value as Difficulty)}
          style={{
            background: 'rgba(255,255,255,0.7)',
            border: '1px solid rgba(28,42,58,0.1)',
            borderRadius: 999,
            padding: '6px 12px',
            fontSize: 12,
            color: '#3a4858',
            fontFamily: 'inherit',
          }}
        >
          <option value="easy">😊 {t('topbar.difficulty.easy')}</option>
          <option value="medium">😐 {t('topbar.difficulty.medium')}</option>
          <option value="hard">😈 {t('topbar.difficulty.hard')}</option>
        </select>
        {onHelp && <CumButton label={`❓ ${t('topbar.help')}`} onClick={onHelp} />}
        {onLibrary && <CumButton label={`📚 ${t('topbar.library')}`} onClick={onLibrary} />}
        {onTheme && <CumButton label={`🎨 ${t('topbar.theme')}`} onClick={onTheme} />}
        {onRestart && <CumButton label={`🔄 ${t('topbar.restart')}`} onClick={onRestart} />}
        <LocaleSwitcher
          style={{
            color: '#3a4858',
            borderColor: 'rgba(28,42,58,0.15)',
            background: 'rgba(255,255,255,0.55)',
            backdropFilter: 'blur(8px)',
            fontSize: 11,
            padding: '5px 10px',
          }}
        />
      </div>
    </div>
  );
}

function TideButton({ label, onClick }: { readonly label: string; readonly onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: 'linear-gradient(180deg, #6e4a18, #3d2a1e)',
        border: '1px solid #c89848',
        borderRadius: 4,
        padding: '5px 14px',
        fontSize: 12,
        fontWeight: 600,
        color: '#f4d68a',
        fontFamily: 'Georgia, serif',
        letterSpacing: '0.1em',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  );
}

function CumButton({ label, onClick }: { readonly label: string; readonly onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: 'rgba(255,255,255,0.55)',
        border: '1px solid rgba(28,42,58,0.1)',
        borderRadius: 999,
        padding: '6px 14px',
        fontSize: 12,
        fontWeight: 500,
        color: '#3a4858',
        backdropFilter: 'blur(8px)',
        cursor: 'pointer',
        fontFamily: 'inherit',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  );
}
