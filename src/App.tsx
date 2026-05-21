import { t } from './i18n';
import { allCardIds, cardsByType } from './core/cards';
import type { CardType } from './core/types';
import { createRng } from './core/rng';
import { rollWind } from './core/rules-engine';

const CATEGORIES: readonly CardType[] = [
  'turbine',
  'tech',
  'fault',
  'func',
  'weather',
  'contract',
];

/**
 * Sprint 1 的「Hello」畫面：同時驗證資料載入、seeded RNG、i18n 三條線都接通。
 * 真正的遊戲畫面在 Sprint 5（UI 層）。
 */
export default function App() {
  const total = allCardIds.length;
  // 用固定 seed 展示可重現亂數（也是「天氣對抗同題競賽」的基礎）
  const rng = createRng(20260521);
  const demoWind = Array.from({ length: 5 }, () => rollWind(rng).label);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-5 bg-slate-900 p-6 text-slate-100">
      <h1 className="text-4xl font-bold tracking-wide">{t('app.title')}</h1>
      <p className="text-slate-400">{t('app.subtitle')}</p>
      <p className="text-sm text-slate-200">{t('app.cardsLoaded', { n: total })}</p>

      <div className="flex flex-wrap justify-center gap-2 text-xs">
        {CATEGORIES.map((ty) => (
          <span
            key={ty}
            className="rounded-full border border-slate-600 px-3 py-1 text-slate-300"
          >
            {t(`category.${ty}`)} × {cardsByType(ty).length}
          </span>
        ))}
      </div>

      <p className="text-xs text-slate-500">
        {t('app.windDemo')}：{demoWind.join('、')}
      </p>
    </main>
  );
}
