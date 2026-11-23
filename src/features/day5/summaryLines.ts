/**
 * Résumé du soir v5 : une ligne de résumé horodatée (« Biberon 08:30 · 120 ml bus », « 12:15 · Purée ») devient
 * une rangée de chronologie (heure dans la colonne alignée + texte). Au plus UN mot avant l'heure : une date longue
 * (« mercredi 16 décembre à 10:30 · … ») reste une ligne de texte. Pur, testé (day5.test.ts).
 */
const TIMED = /^(?:(\S+) )?(\d{1,2}[:h]\d{2})(?: · (.*))?$/;

export function splitTimed(line: string): { time: string; text: string } | null {
  const m = TIMED.exec(line);
  if (!m) return null;
  const [, word, time, rest] = m;
  const text = [word, rest].filter(Boolean).join(' · ');
  return text ? { time, text } : null;
}

/** Tri chronologique de libellés d'heure « 8:05 », « 08:30 », « 14h10 ». */
export const byClock = (a: string, b: string) => a.replace('h', ':').padStart(5, '0').localeCompare(b.replace('h', ':').padStart(5, '0'));
