/**
 * Calendrier des champs date (audit final du 23/11/2026) : grille d'un mois, semaines commençant le lundi.
 * Logique pure, testée (src/__tests__/calendarGrid.test.ts). Aucune heure en jeu : uniquement des jours locaux.
 */
export interface Ymd { y: number; m: number; d: number }

export const pad2 = (n: number) => String(n).padStart(2, '0');
export const ymdToFr = (v: Ymd) => `${pad2(v.d)}/${pad2(v.m + 1)}/${v.y}`;
export const ymdKey = (v: Ymd) => `${v.y}-${pad2(v.m + 1)}-${pad2(v.d)}`;
export const daysIn = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
export const todayYmd = (now = new Date()): Ymd => ({ y: now.getFullYear(), m: now.getMonth(), d: now.getDate() });
export const addDays = (v: Ymd, n: number): Ymd => { const t = new Date(v.y, v.m, v.d + n); return { y: t.getFullYear(), m: t.getMonth(), d: t.getDate() }; };

/** Lit « JJ/MM/AAAA » (ou JJ.MM.AAAA, JJ-MM-AAAA) ; null si la date n'existe pas. */
export function parseFr(s: string | null | undefined): Ymd | null {
  const m = (s ?? '').trim().match(/^(\d{1,2})[/.\-\s](\d{1,2})[/.\-\s](\d{4})$/);
  if (!m) return null;
  const v = { y: +m[3], m: +m[2] - 1, d: +m[1] };
  return v.m >= 0 && v.m < 12 && v.d >= 1 && v.d <= daysIn(v.y, v.m) ? v : null;
}

/** Semaines du mois (lundi → dimanche) ; null = case vide avant le 1er ou après le dernier jour. */
export function monthGrid(y: number, m: number): (number | null)[][] {
  const lead = (new Date(y, m, 1).getDay() + 6) % 7; // lundi = 0
  const cells: (number | null)[] = [...Array(lead).fill(null), ...Array.from({ length: daysIn(y, m) }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);
  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

/** Mois suivant / précédent. */
export const shiftMonth = (y: number, m: number, n: number) => { const t = new Date(y, m + n, 1); return { y: t.getFullYear(), m: t.getMonth() }; };

/** Années proposées dans le sélecteur : de `from` à `to` (inclus), la plus récente en premier. */
export const yearRange = (from: number, to: number) => Array.from({ length: Math.max(0, to - from + 1) }, (_, i) => to - i);
