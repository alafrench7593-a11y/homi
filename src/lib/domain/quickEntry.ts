/**
 * Saisie rapide en une phrase (tapée ou dictée) : « Lina a bu 150 ml à 14 h ».
 * Analyse locale, sans service externe : rien n'est envoyé hors de l'appareil. Le résultat ne s'enregistre jamais
 * seul : il ouvre le formulaire habituel pré-rempli, que le parent vérifie avant d'enregistrer.
 */
export type QuickKind = 'bottle' | 'sleep' | 'diaper';
export interface QuickResult { kind: QuickKind; childId: string; childName: string; ml: number | null; at: Date }
export type QuickParse = { ok: true; value: QuickResult } | { ok: false; error: 'child' | 'kind' | 'ml' };

const fold = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’']/g, ' ');

export function parseQuickEntry(text: string, children: { id: string; first_name: string }[], now = new Date(), activeChildId?: string | null): QuickParse {
  const t = ` ${fold(text)} `;
  const named = children.filter((c) => new RegExp(`[^a-z]${fold(c.first_name).replace(/[^a-z0-9 -]/g, '')}[^a-z]`).test(t));
  const child = named.length === 1 ? named[0] : named.length === 0 ? children.find((c) => c.id === activeChildId) ?? (children.length === 1 ? children[0] : undefined) : undefined;
  if (!child) return { ok: false, error: 'child' };

  const kind: QuickKind | null = /(biberon|\bbu\b|\bbois|\bml\b|lait)/.test(t) ? 'bottle'
    : /(couche|change)/.test(t) ? 'diaper'
    : /(dort|dormi|sieste|endormi|couche a|sommeil)/.test(t) ? 'sleep' : null;
  if (!kind) return { ok: false, error: 'kind' };

  let ml: number | null = null;
  const m = t.match(/(\d{1,3})\s*(ml|millilitres?)\b/);
  if (m) ml = Number(m[1]);
  if (kind === 'bottle' && ml != null && (ml < 1 || ml > 500)) return { ok: false, error: 'ml' };

  // Heure : « à 14 h », « 14h30 », « 14:30 », « 9 h 05 » ; sinon maintenant
  const at = new Date(now);
  at.setSeconds(0, 0);
  const h = t.match(/(?:^|[^0-9])([01]?\d|2[0-3])\s*(?:h|:|heures?)\s*([0-5]\d)?/);
  if (h) {
    at.setHours(Number(h[1]), h[2] ? Number(h[2]) : 0);
    // une heure « future » de plus de 30 min désigne la veille (ex. « 23 h » saisi à 1 h du matin) : jamais dans le futur
    if (at.getTime() - now.getTime() > 30 * 60_000) at.setDate(at.getDate() - 1);
  }
  return { ok: true, value: { kind, childId: child.id, childName: child.first_name, ml, at } };
}
