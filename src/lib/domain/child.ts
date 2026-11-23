import { t as tr } from '@/i18n';
import { daysBetween, type ISODate, parseISODate, todayISO } from './dates';

export interface ChildAge {
  days: number;
  months: number; // mois révolus
  years: number;
  label: string;
}

export function childAge(birth: ISODate, today: ISODate = todayISO()): ChildAge {
  const days = Math.max(0, daysBetween(birth, today));
  const b = parseISODate(birth);
  const t = parseISODate(today);
  // Fin de mois : né un 31, le « jour anniversaire » d'un mois de 30 jours (ou de février) est son dernier jour
  const monthDay = (y: number, m: number) => Math.min(b.getUTCDate(), new Date(Date.UTC(y, m + 1, 0)).getUTCDate());
  let months = (t.getUTCFullYear() - b.getUTCFullYear()) * 12 + (t.getUTCMonth() - b.getUTCMonth());
  if (t.getUTCDate() < monthDay(t.getUTCFullYear(), t.getUTCMonth())) months -= 1;
  months = Math.max(0, months);
  const years = Math.floor(months / 12);
  let label: string;
  if (days < 14) label = days === 0 ? tr('l8.child.today') : tr('l8.child.day', { count: days });
  else if (months < 1) label = tr('l8.child.week', { count: Math.floor(days / 7) });
  else if (months < 24) {
    const am = b.getUTCMonth() + months;
    const anchor = new Date(Date.UTC(b.getUTCFullYear(), am, monthDay(b.getUTCFullYear(), am)));
    const rest = Math.max(0, Math.round((t.getTime() - anchor.getTime()) / 86_400_000));
    const mLabel = tr('l8.child.month', { count: months });
    label = rest ? tr('l8.child.and', { a: mLabel, b: tr('l8.child.day', { count: rest }) }) : mLabel;
  } else {
    const m = months % 12;
    const yLabel = tr('l8.child.year', { count: years });
    label = m ? tr('l8.child.and', { a: yLabel, b: tr('l8.child.month', { count: m }) }) : yLabel;
  }
  return { days, months, years, label };
}

/** Étape de vie, sert à choisir les contenus et la mise en page de l'accueil. */
export type ChildStage = 'newborn' | 'baby' | 'toddler' | 'child';
export function childStage(months: number): ChildStage {
  if (months < 3) return 'newborn';
  if (months < 18) return 'baby';
  if (months < 48) return 'toddler';
  return 'child';
}

export function initials(name: string): string {
  return name
    .split(/[\s-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('');
}
