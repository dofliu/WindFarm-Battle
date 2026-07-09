// ============================================================
// 設定面板（modal）：音效 / 音量 / 螢幕震動 / 手機震動。
// 樣式與 ThemeSwitcher 一致（雙主題感知）。切換即時預覽音效，並持久化。
// ============================================================
import { useTheme } from '../theme/ThemeContext';
import { t } from '../../i18n';
import { useLocale } from '../locale/LocaleContext';
import { useSettingsStore } from '../../store/settings-store';
import { setMasterVolume, unlock, play } from '../audio/sound-engine';

interface Props {
  readonly onClose: () => void;
}

export function SettingsModal({ onClose }: Props) {
  useLocale();
  const { theme, themeKey } = useTheme();
  const isTide = themeKey === 'tideboard';

  const soundOn = useSettingsStore((s) => s.soundOn);
  const volume = useSettingsStore((s) => s.volume);
  const screenShakeOn = useSettingsStore((s) => s.screenShakeOn);
  const hapticsOn = useSettingsStore((s) => s.hapticsOn);
  const setSoundOn = useSettingsStore((s) => s.setSoundOn);
  const setVolume = useSettingsStore((s) => s.setVolume);
  const teachingTips = useSettingsStore((s) => s.teachingTips);
  const setScreenShakeOn = useSettingsStore((s) => s.setScreenShakeOn);
  const setHapticsOn = useSettingsStore((s) => s.setHapticsOn);
  const setTeachingTips = useSettingsStore((s) => s.setTeachingTips);

  const cardBg = isTide ? 'linear-gradient(180deg, #2a1c10, #1e140a)' : '#fff';
  const textColor = isTide ? '#f4e8d0' : '#1c2a3a';
  const subColor = isTide ? '#c89848' : '#6a7888';
  const accent = isTide ? '#c89848' : '#3aa7c8';

  const handleSoundToggle = (v: boolean) => {
    setSoundOn(v);
    if (v) {
      unlock();
      setMasterVolume(volume);
      play('score'); // 開啟時給個悅耳預覽
    }
  };

  const handleVolume = (v: number) => {
    setVolume(v);
    setMasterVolume(v);
    if (soundOn) {
      unlock();
      play('tap'); // 拖動時輕觸預覽
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('settings.title')}
      onClick={onClose}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 500,
        background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: cardBg,
          color: textColor,
          borderRadius: isTide ? 6 : 16,
          border: isTide ? '2px solid #c89848' : '1px solid rgba(28,42,58,0.1)',
          padding: 24,
          minWidth: 340,
          maxWidth: 400,
          boxShadow: '0 24px 60px rgba(0,0,0,0.4)',
          fontFamily: theme.fontUI,
        }}
      >
        <h2
          style={{
            fontSize: 18,
            fontWeight: 800,
            margin: 0,
            marginBottom: 4,
            fontFamily: isTide ? '"Cinzel", Georgia, serif' : theme.fontUI,
            letterSpacing: isTide ? '0.06em' : undefined,
          }}
        >
          {isTide ? '⚙ ' : '⚙️ '}
          {t('settings.title')}
        </h2>
        <p style={{ fontSize: 12, color: subColor, margin: 0, marginBottom: 18 }}>{t('settings.subtitle')}</p>

        {/* 音效總開關 */}
        <ToggleRow
          label={t('settings.sound')}
          hint={t('settings.soundHint')}
          on={soundOn}
          onChange={handleSoundToggle}
          accent={accent}
          textColor={textColor}
          subColor={subColor}
        />

        {/* 音量（音效開啟時才顯示） */}
        {soundOn && (
          <div style={{ padding: '10px 0 4px', borderBottom: `1px solid ${isTide ? 'rgba(200,152,72,0.2)' : 'rgba(28,42,58,0.06)'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{t('settings.volume')}</span>
              <span style={{ fontSize: 12, color: subColor, fontVariantNumeric: 'tabular-nums' }}>
                {Math.round(volume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(volume * 100)}
              onChange={(e) => handleVolume(Number(e.target.value) / 100)}
              aria-label={t('settings.volume')}
              style={{ width: '100%', accentColor: accent, cursor: 'pointer' }}
            />
          </div>
        )}

        {/* 螢幕震動 */}
        <ToggleRow
          label={t('settings.shake')}
          hint={t('settings.shakeHint')}
          on={screenShakeOn}
          onChange={setScreenShakeOn}
          accent={accent}
          textColor={textColor}
          subColor={subColor}
        />

        {/* 手機震動 */}
        <ToggleRow
          label={t('settings.haptics')}
          hint={t('settings.hapticsHint')}
          on={hapticsOn}
          onChange={setHapticsOn}
          accent={accent}
          textColor={textColor}
          subColor={subColor}
        />

        {/* 教學提示（維修知識即時解說） */}
        <ToggleRow
          label={t('settings.teaching')}
          hint={t('settings.teachingHint')}
          on={teachingTips}
          onChange={setTeachingTips}
          accent={accent}
          textColor={textColor}
          subColor={subColor}
          last
        />

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 18px',
              borderRadius: isTide ? 4 : 999,
              border: `1px solid ${isTide ? '#c89848' : 'rgba(28,42,58,0.15)'}`,
              background: isTide ? '#3d2a1e' : '#fff',
              color: isTide ? '#f4d68a' : '#1c2a3a',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 600,
              fontFamily: 'inherit',
            }}
          >
            {t('settings.close')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 開關列（label + hint + 滑動開關） ─────────────────────────
function ToggleRow({
  label, hint, on, onChange, accent, textColor, subColor, last,
}: {
  readonly label: string;
  readonly hint: string;
  readonly on: boolean;
  readonly onChange: (v: boolean) => void;
  readonly accent: string;
  readonly textColor: string;
  readonly subColor: string;
  readonly last?: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        padding: '12px 0',
        borderBottom: last ? undefined : `1px solid ${'rgba(128,128,128,0.15)'}`,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: textColor }}>{label}</div>
        <div style={{ fontSize: 11, color: subColor, marginTop: 2 }}>{hint}</div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={label}
        onClick={() => onChange(!on)}
        style={{
          flexShrink: 0,
          width: 46,
          height: 26,
          borderRadius: 999,
          border: 'none',
          padding: 3,
          cursor: 'pointer',
          background: on ? accent : 'rgba(128,128,128,0.35)',
          transition: 'background 0.2s',
          display: 'flex',
          justifyContent: on ? 'flex-end' : 'flex-start',
          alignItems: 'center',
        }}
      >
        <span
          style={{
            display: 'block',
            width: 20,
            height: 20,
            borderRadius: '50%',
            background: '#fff',
            boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
            transition: 'all 0.2s',
          }}
        />
      </button>
    </div>
  );
}
