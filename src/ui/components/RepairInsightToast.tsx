// ============================================================
// 維修知識即時解說卡（教學）。
//
// 修復發生時滑入左側，把隱藏的「知識-效益修復模型」講給玩家聽：
//   - 完全修復（專長相符）：綠色，正向強化「對症下藥」
//   - 部分修復（專長不符）：橙色，點出永久損耗 + 提示該找的專長
//
// 資料來自 core/learning 的 RepairInsight（純函式拆解），文案來自 i18n/knowledge。
// 由 settings.teachingTips 控制是否出現（見 useRepairInsight）。
// ============================================================
import { useTheme } from '../theme/ThemeContext';
import { useLocale } from '../locale/LocaleContext';
import { cardName, t } from '../../i18n';
import type { RepairInsight } from '../../core/learning';

interface Props {
  readonly insight: RepairInsight;
}

export function RepairInsightToast({ insight }: Props) {
  const { theme, themeKey } = useTheme();
  useLocale();
  const isTide = themeKey === 'tideboard';
  const matched = insight.matched;

  const accent = matched ? '#2a8a5a' : '#c77d2a';
  const accentBg = matched ? 'rgba(42,138,90,0.12)' : 'rgba(199,125,42,0.14)';

  const categoryName = insight.category ? t(`knowledge.category.${insight.category}.name`) : '';
  const specialist = insight.category ? t(`knowledge.category.${insight.category}.specialist`) : '';
  const faultLabel = cardName(insight.faultId) || insight.faultId;
  const techLabel = insight.techId ? cardName(insight.techId) || insight.techId : '';
  const verdictTitle = matched ? t('knowledge.repair.full.title') : t('knowledge.repair.partial.title');
  const verdictDesc = matched ? t('knowledge.repair.full.desc') : t('knowledge.repair.partial.desc');

  return (
    <div
      className="wf-slide-in-left"
      style={{
        position: 'absolute',
        left: 16,
        top: '50%',
        zIndex: 210,
        width: 268,
        maxWidth: '38vw',
        padding: 14,
        borderRadius: isTide ? 6 : 14,
        background: isTide ? 'linear-gradient(180deg, rgba(40,25,15,0.96), rgba(30,18,8,0.97))' : 'rgba(255,255,255,0.97)',
        border: `1.5px solid ${accent}`,
        boxShadow: '0 16px 40px rgba(0,0,0,0.28)',
        backdropFilter: 'blur(8px)',
        color: isTide ? '#f4e8d0' : '#1c2a3a',
        fontFamily: theme.fontUI,
        pointerEvents: 'none',
      }}
    >
      {/* 標頭：教學徽章 + 故障類別 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <span
          style={{
            fontSize: 9,
            fontWeight: 800,
            letterSpacing: '0.12em',
            color: '#fff',
            background: accent,
            padding: '2px 7px',
            borderRadius: 999,
          }}
        >
          📖 {t('insight.badge')}
        </span>
        {categoryName && (
          <span style={{ fontSize: 11, fontWeight: 700, color: accent, letterSpacing: '0.03em' }}>{categoryName}</span>
        )}
      </div>

      {/* 誰修了什麼 */}
      <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, lineHeight: 1.4 }}>
        {techLabel
          ? t('insight.repairedBy', { tech: techLabel, fault: faultLabel })
          : faultLabel}
      </div>

      {/* 判定：完全 / 部分 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 10px',
          borderRadius: 8,
          background: accentBg,
          marginBottom: 8,
        }}
      >
        <span style={{ fontSize: 14 }}>{matched ? '✓' : '⚠'}</span>
        <span style={{ fontSize: 12, fontWeight: 800, color: accent }}>{verdictTitle}</span>
        {!matched && insight.availLost > 0 && (
          <span style={{ fontSize: 11, fontWeight: 700, color: '#a8453a', marginLeft: 'auto' }}>
            {t('insight.permLost', { n: insight.availLost })}
          </span>
        )}
      </div>

      {/* 教學解說 */}
      <div style={{ fontSize: 11, lineHeight: 1.5, color: isTide ? '#d8c4a0' : '#4a5868' }}>{verdictDesc}</div>

      {/* 部分修復：提示該找的專長 */}
      {!matched && specialist && (
        <div
          style={{
            marginTop: 8,
            paddingTop: 8,
            borderTop: `1px solid ${isTide ? 'rgba(200,152,72,0.25)' : 'rgba(28,42,58,0.08)'}`,
            fontSize: 11,
            fontWeight: 700,
            color: accent,
          }}
        >
          💡 {t('learning.specialistNeeded', { name: specialist })}
        </div>
      )}
    </div>
  );
}
