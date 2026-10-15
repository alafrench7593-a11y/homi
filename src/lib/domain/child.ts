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
  let months = (t.getUTCFullYear() - b.getUTCFullYear()) * 12 + (t.getUTCMonth() - b.getUTCMonth());
  if (t.getUTCDate() < b.getUTCDate()) months -= 1;
  months = Math.max(0, months);
  const years = Math.floor(months / 12);
  let label: string;
  if (days < 14) label = days <= 1 ? (days === 0 ? 'né aujourd’hui' : '1 jour') : `${days} jours`;
  else if (months < 1) label = `${Math.floor(days / 7)} semaines`;
  else if (months < 24) {
    const anchor = new Date(Date.UTC(b.getUTCFullYear(), b.getUTCMonth() + months, b.getUTCDate()));
    const rest = Math.max(0, Math.round((t.getTime() - anchor.getTime()) / 86_400_000));
    label = `${months} mois${rest ? ` et ${rest} jour${rest > 1 ? 's' : ''}` : ''}`;
  } else {
    const m = months % 12;
    label = `${years} an${years > 1 ? 's' : ''}${m ? ` et ${m} mois` : ''}`;
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
