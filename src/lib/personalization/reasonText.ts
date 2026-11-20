/** Texte lisible d'une raison de recommandation (« Parce que Lina a 8 mois »), dans la langue active. */
import { t as tr, type TKey } from '@/i18n';
import type { Reason } from './rules';

/** Âge court : « 8 mois » avant 2 ans, puis « 6 ans ». */
export function ageText(months: number): string {
  return months < 24 ? tr('l8.child.month', { count: months }) : tr('l8.child.year', { count: Math.floor(months / 12) });
}

export function reasonText(r: Reason): string {
  if (r.key === 'pz.r.pregMine' && r.weeks == null) return tr('pz.r.pregMineNoWeek');
  if ((r.key === 'pz.r.caregiver' || r.key === 'pz.r.nanny') && !r.name) return tr(`${r.key}NoName` as TKey);
  return tr(r.key as TKey, { name: r.name ?? '', age: r.months != null ? ageText(r.months) : '', weeks: r.weeks ?? '' });
}
