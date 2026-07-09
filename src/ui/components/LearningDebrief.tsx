// ============================================================
// 局後學習複盤（教學）modal。
//
// 把一局的「知識-效益」表現攤開給學生看：維運效率評級、因專長不符而
// 永久損失的可用率、本局遇到的故障類別（配真實運維情境與該找的專長）、
// 接觸到的 IEC 61400 系列標準。資料來自 core/learning 純函式，文案來自 i18n/knowledge。
//
// 漸進式揭露：這是「按需開啟」的深度層（GameOver 的按鈕），不強塞在主畫面。
// ============================================================
import { useTheme } from '../theme/ThemeContext';
import { useLocale } from '../locale/LocaleContext';
import { t } from '../../i18n';
import type { LearningReport, GradeTier } from '../../core/learning';

interface Props {
  readonly report: LearningReport;
  readonly onClose: () => void;
}

const GRADE_COLOR: Record<GradeTier, string> = {
  S: '#d9a85a',
  A: '#2a8a5a',
  B: '#c77d2a',
  C: '#a8453a',
};

export function LearningDebrief({ report, onClose }: Props) {
  useLocale();
  const { theme, themeKey } = useTheme();
  const isTide = themeKey === 'tideboard';

  const cardBg = isTide ? 'linear-gradient(180deg, #2a1c10, #1e140a)' : '#fff';
  const textColor = isTide ? '#f4e8d0' : '#1c2a3a';
  const subColor = isTide ? '#c89848' : '#6a7888';
  const divider = isTide ? '1px solid rgba(200,152,72,0.25)' : '1px solid rgba(28,42,58,0.08)';
  const gradeColor = GRADE_COLOR[report.grade];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('learning.title')}
      onClick={onClose}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 520,
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
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
          width: 480,
          maxWidth: '100%',
          maxHeight: '86vh',
          overflowY: 'auto',
          boxShadow: '0 24px 60px rgba(0,0,0,0.45)',
          fontFamily: theme.fontUI,
        }}
      >
        <h2
          style={{
            fontSize: 20,
            fontWeight: 800,
            margin: 0,
            marginBottom: 2,
            fontFamily: isTide ? '"Cinzel", Georgia, serif' : theme.fontUI,
          }}
        >
          📖 {t('learning.title')}
        </h2>
        <p style={{ fontSize: 12, color: subColor, margin: 0, marginBottom: 18 }}>{t('learning.subtitle')}</p>

        {/* 維運效率評級 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
          <div
            style={{
              flexShrink: 0,
              width: 72,
              height: 72,
              borderRadius: isTide ? 8 : 16,
              background: `${gradeColor}22`,
              border: `2px solid ${gradeColor}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 40,
              fontWeight: 800,
              color: gradeColor,
              fontFamily: isTide ? '"Cinzel", Georgia, serif' : theme.fontDisplay,
            }}
          >
            {report.grade}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 10, color: subColor, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
              {t('learning.grade')}
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: gradeColor, marginTop: 2 }}>
              {t(`knowledge.grade.${report.grade}.title`)}
            </div>
            <div style={{ fontSize: 11, color: subColor, marginTop: 3, lineHeight: 1.4 }}>
              {t(`knowledge.grade.${report.grade}.desc`)}
            </div>
          </div>
        </div>

        {report.totalRepairs === 0 ? (
          <div
            style={{
              padding: '14px 16px',
              borderRadius: 10,
              background: isTide ? 'rgba(200,152,72,0.1)' : 'rgba(42,138,90,0.08)',
              fontSize: 12,
              color: subColor,
              textAlign: 'center',
            }}
          >
            {t('learning.noRepairs')}
          </div>
        ) : (
          <>
            {/* 維修統計 */}
            <div style={{ paddingTop: 14, borderTop: divider }}>
              <div style={{ fontSize: 10, color: subColor, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>
                {t('learning.repairsLabel')}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <StatBox label={t('learning.full')} value={String(report.fullRepairs)} color="#2a8a5a" subColor={subColor} isTide={isTide} />
                <StatBox label={t('learning.partial')} value={String(report.partialRepairs)} color="#c77d2a" subColor={subColor} isTide={isTide} />
                <StatBox
                  label={t('learning.permLost')}
                  value={`−${report.permanentAvailLost}%`}
                  color={report.permanentAvailLost > 0 ? '#a8453a' : subColor}
                  subColor={subColor}
                  isTide={isTide}
                />
                <StatBox
                  label={t('learning.matchRate')}
                  value={`${Math.round(report.matchRate * 100)}%`}
                  color={textColor}
                  subColor={subColor}
                  isTide={isTide}
                />
              </div>
            </div>
          </>
        )}

        {/* 本局遇到的故障類別（配真實運維知識） */}
        {report.categoriesSeen.length > 0 && (
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: divider }}>
            <div style={{ fontSize: 10, color: subColor, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>
              {t('learning.categoriesLabel')}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {report.categoriesSeen.map(({ category, count }) => (
                <div key={category} style={{ display: 'flex', gap: 10 }}>
                  <div
                    style={{
                      flexShrink: 0,
                      alignSelf: 'flex-start',
                      fontSize: 10,
                      fontWeight: 700,
                      color: subColor,
                      background: isTide ? 'rgba(200,152,72,0.12)' : 'rgba(28,42,58,0.05)',
                      borderRadius: 999,
                      padding: '3px 8px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {t('learning.times', { n: count })}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{t(`knowledge.category.${category}.name`)}</div>
                    <div style={{ fontSize: 11, color: subColor, lineHeight: 1.45, marginTop: 2 }}>
                      {t(`knowledge.category.${category}.real`)}
                    </div>
                    <div style={{ fontSize: 11, color: '#2a8a5a', fontWeight: 600, marginTop: 3 }}>
                      💡 {t('learning.specialistNeeded', { name: t(`knowledge.category.${category}.specialist`) })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 接觸的 IEC 標準 */}
        {report.iecSeen.length > 0 && (
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: divider }}>
            <div style={{ fontSize: 10, color: subColor, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>
              {t('learning.iecLabel')}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {report.iecSeen.map((code) => (
                <span
                  key={code}
                  style={{
                    fontSize: 10.5,
                    fontWeight: 600,
                    color: isTide ? '#d8c4a0' : '#4a5868',
                    background: isTide ? 'rgba(60,40,25,0.5)' : 'rgba(28,42,58,0.05)',
                    border: divider,
                    borderRadius: 6,
                    padding: '4px 9px',
                  }}
                >
                  {t(`knowledge.iec.${code}.title`)}
                </span>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 20px',
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

function StatBox({
  label, value, color, subColor, isTide,
}: {
  readonly label: string; readonly value: string; readonly color: string;
  readonly subColor: string; readonly isTide: boolean;
}) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        textAlign: 'center',
        padding: '8px 4px',
        borderRadius: 10,
        background: isTide ? 'rgba(60,40,25,0.4)' : 'rgba(28,42,58,0.04)',
      }}
    >
      <div style={{ fontSize: 18, fontWeight: 800, color, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      <div style={{ fontSize: 9, color: subColor, marginTop: 2, letterSpacing: '0.02em' }}>{label}</div>
    </div>
  );
}
