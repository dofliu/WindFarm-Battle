// 戰場頂部欄：標題 + 難度 + 動作按鈕 + 主題切換 + 語言切換。
import { useTheme } from '../theme/ThemeContext';
import { Compass, TurbineFloat } from '../icons';
import type { Difficulty } from '../../core/types';
import { t } from '../../i18n';
import { useLocale } from '../locale/LocaleContext';
import { LocaleSwitcher } from './LocaleSwitcher';
import { useSettingsStore } from '../../store/settings-store';
import { unlock, setMasterVolume, play } from '../audio/sound-engine';

interface Props {
  readonly difficulty: Difficulty;
  readonly onDifficulty: (d: Difficulty) => void;
  readonly onLibrary?: () => void;
  readonly onRestart?: () => void;
  readonly onTitle?: () => void;
  readonly onTheme?: () => void;
  readonly onHelp?: () => void;
  readonly onSettings?: () => void;
  /** 深色戰場變體（v2 技師戰鬥桌面用）：深底亮字，與 slate-950 背景自洽 */
  readonly dark?: boolean;
}

export function TopBar({ difficulty, onDifficulty, onLibrary, onRestart, onTitle, onTheme, onHelp, onSettings, dark }: Props) {
  const { theme, themeKey } = useTheme();
  useLocale(); // 訂閱語言切換，觸發重新渲染

  // 快速靜音切換（頂欄一鍵，不必開設定面板）
  const soundOn = useSettingsStore((s) => s.soundOn);
  const toggleSound = useSettingsStore((s) => s.toggleSound);
  const volume = useSettingsStore((s) => s.volume);
  const handleMute = () => {
    const wasOn = soundOn;
    toggleSound();
    if (!wasOn) {
      // 剛開啟 → 解鎖音訊並給預覽
      unlock();
      setMasterVolume(volume);
      play('tap');
    }
  };
  const muteLabel = soundOn ? t('topbar.muteOn') : t('topbar.muteOff');

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
          <TideButton label={muteLabel} onClick={handleMute} title={t('topbar.mute')} />
          {onSettings && <TideButton label={t('topbar.settings')} onClick={onSettings} />}
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
        borderBottom: dark ? '1px solid rgba(148,180,220,0.12)' : '1px solid rgba(28,42,58,0.08)',
        flexShrink: 0,
        background: dark ? 'rgba(8,14,26,0.88)' : 'rgba(255,255,255,0.4)',
        backdropFilter: 'blur(10px)',
        position: 'relative',
        zIndex: 20,
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
              color: dark ? '#e8f0fa' : theme.textPrimary,
              letterSpacing: '0.02em',
              whiteSpace: 'nowrap',
            }}
          >
            WindFarm Battle
          </div>
          <div
            style={{
              fontSize: 10,
              color: dark ? 'rgba(180,200,225,0.6)' : theme.textSecondary,
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
            background: dark ? 'rgba(20,30,48,0.9)' : 'rgba(255,255,255,0.7)',
            border: dark ? '1px solid rgba(148,180,220,0.2)' : '1px solid rgba(28,42,58,0.1)',
            borderRadius: 999,
            padding: '6px 12px',
            fontSize: 12,
            color: dark ? '#c8d8ea' : '#3a4858',
            fontFamily: 'inherit',
          }}
        >
          <option value="easy">😊 {t('topbar.difficulty.easy')}</option>
          <option value="medium">😐 {t('topbar.difficulty.medium')}</option>
          <option value="hard">😈 {t('topbar.difficulty.hard')}</option>
        </select>
        {onHelp && <CumButton label={`❓ ${t('topbar.help')}`} onClick={onHelp} dark={dark} />}
        {onLibrary && <CumButton label={`📚 ${t('topbar.library')}`} onClick={onLibrary} dark={dark} />}
        {onTheme && <CumButton label={`🎨 ${t('topbar.theme')}`} onClick={onTheme} dark={dark} />}
        <CumButton label={soundOn ? '🔊' : '🔇'} onClick={handleMute} title={t('topbar.mute')} dark={dark} />
        {onSettings && <CumButton label={`⚙️ ${t('topbar.settings')}`} onClick={onSettings} dark={dark} />}
        {onRestart && <CumButton label={`🔄 ${t('topbar.restart')}`} onClick={onRestart} dark={dark} />}
        <LocaleSwitcher
          style={{
            color: dark ? '#c8d8ea' : '#3a4858',
            borderColor: dark ? 'rgba(148,180,220,0.25)' : 'rgba(28,42,58,0.15)',
            background: dark ? 'rgba(20,30,48,0.9)' : 'rgba(255,255,255,0.55)',
            backdropFilter: 'blur(8px)',
            fontSize: 11,
            padding: '5px 10px',
          }}
        />
      </div>
    </div>
  );
}

function TideButton({ label, onClick, title }: { readonly label: string; readonly onClick: () => void; readonly title?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
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

function CumButton({ label, onClick, title, dark }: { readonly label: string; readonly onClick: () => void; readonly title?: string; readonly dark?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      style={{
        background: dark ? 'rgba(20,30,48,0.9)' : 'rgba(255,255,255,0.55)',
        border: dark ? '1px solid rgba(148,180,220,0.2)' : '1px solid rgba(28,42,58,0.1)',
        borderRadius: 999,
        padding: '6px 14px',
        fontSize: 12,
        fontWeight: 500,
        color: dark ? '#c8d8ea' : '#3a4858',
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
