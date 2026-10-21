/**
 * Saisie vocale ou en une phrase : « Lina a bu 150 millilitres à 13 h 10 », « Noé s'est endormi à 20 h 30 »,
 * « Ajouter le rendez-vous du pédiatre mardi à 15 h », « Rappelle-moi le médicament prescrit de Noé à 17 h ».
 * Analyse LOCALE (rien n'est envoyé hors de l'appareil), transformée en données structurées que la personne confirme
 * avant tout enregistrement. Jamais de quantité, d'heure, de médicament ni de dose inventés : ce qui n'est pas dit
 * reste vide (ou « maintenant », affiché comme tel, pour un biberon ou un sommeil).
 */
export type QuickKind = 'bottle' | 'sleep_start' | 'sleep_end' | 'diaper' | 'appointment' | 'medication';
export interface QuickResult {
  kind: QuickKind;
  childId: string | null;
  childName: string | null;
  ml: number | null;
  at: Date;
  /** L'heure a-t-elle été dite ? (sinon : maintenant, affiché comme tel) */
  timeGiven: boolean;
  /** Rendez-vous : intitulé dit par la personne (« pédiatre ») */
  title?: string;
  /** Médicament : heure « HH:MM » ; le traitement lui-même est choisi parmi ceux DÉJÀ enregistrés */
  time?: string;
}
export type QuickError = 'child' | 'kind' | 'ml' | 'time' | 'date';
export type QuickParse = { ok: true; value: QuickResult } | { ok: false; error: QuickError };

const fold = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’']/g, ' ');
const WEEKDAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const NUMBERS: Record<string, number> = { un: 1, une: 1, deux: 2, trois: 3, quatre: 4, cinq: 5, six: 6, sept: 7, huit: 8, neuf: 9, dix: 10, onze: 11, douze: 12, treize: 13, quatorze: 14, quinze: 15, seize: 16, vingt: 20, trente: 30, quarante: 40, cinquante: 50, midi: 12, minuit: 0 };

function readTime(t: string): { h: number; m: number } | null {
  const h = t.match(/(?:^|[^0-9])([01]?\d|2[0-3])\s*(?:h|:|heures?)\s*([0-5]\d)?/);
  if (h) return { h: Number(h[1]), m: h[2] ? Number(h[2]) : 0 };
  if (/\bmidi\b/.test(t)) return { h: 12, m: 0 };
  if (/\bminuit\b/.test(t)) return { h: 0, m: 0 };
  return null;
}

export function parseQuickEntry(text: string, children: { id: string; first_name: string }[], now = new Date(), activeChildId?: string | null): QuickParse {
  const t = ` ${fold(text).replace(/millilitres?/g, 'ml')} `;
  const named = children.filter((c) => new RegExp(`[^a-z]${fold(c.first_name).replace(/[^a-z0-9 -]/g, '')}[^a-z]`).test(t));
  const fallback = children.find((c) => c.id === activeChildId) ?? (children.length === 1 ? children[0] : undefined);
  const child = named.length === 1 ? named[0] : named.length === 0 ? fallback : undefined;
  const time = readTime(t);

  // Rendez-vous : un jour et une heure sont indispensables (jamais devinés)
  if (/(rendez-vous|rendez vous|\brdv\b|consultation)/.test(t)) {
    if (!time) return { ok: false, error: 'time' };
    const at = new Date(now); at.setSeconds(0, 0); at.setHours(time.h, time.m);
    const wd = WEEKDAYS.findIndex((d) => new RegExp(`\\b${d}\\b`).test(t));
    const dom = t.match(/\ble (\d{1,2})\b(?!\s*(?:h|:|ml))/);
    if (/\bdemain\b/.test(t)) at.setDate(at.getDate() + 1);
    else if (wd >= 0) { let diff = (wd - at.getDay() + 7) % 7; if (diff === 0 && at <= now) diff = 7; at.setDate(at.getDate() + diff); }
    else if (dom) { at.setDate(Number(dom[1])); if (at <= now) at.setMonth(at.getMonth() + 1, Number(dom[1])); }
    else if (!/aujourd hui/.test(t)) return { ok: false, error: 'date' };
    const who = t.match(/(?:rendez-vous|rendez vous|rdv|consultation)\s+(?:du|de la|de l |de|chez le|chez la|chez l |chez)\s+([a-z -]+?)(?:\s+(?:de|pour)\s+[a-z]+)?\s+(?:lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche|demain|aujourd|le \d|a \d|\d)/);
    // Intitulé repris tel que dit (avec ses accents) : mêmes mots, retrouvés dans la phrase d'origine
    const words = who ? who[1].trim().split(/\s+/) : [];
    const orig = text.split(/\s+/);
    const start = orig.findIndex((_, i) => words.every((w, k) => fold(orig[i + k] ?? '').replace(/[^a-z0-9-]/g, '') === w));
    const said = start >= 0 ? orig.slice(start, start + words.length).join(' ') : words.join(' ');
    const title = said ? said.replace(/^./, (c) => c.toUpperCase()) : 'Rendez-vous';
    return { ok: true, value: { kind: 'appointment', childId: named.length === 1 ? named[0].id : null, childName: named.length === 1 ? named[0].first_name : null, ml: null, at, timeGiven: true, title } };
  }

  // Médicament : seulement un rappel pour un traitement DÉJÀ enregistré ; l'heure est indispensable
  if (/(medicament|traitement)/.test(t)) {
    if (!child) return { ok: false, error: 'child' };
    if (!time) return { ok: false, error: 'time' };
    const at = new Date(now); at.setSeconds(0, 0); at.setHours(time.h, time.m);
    return { ok: true, value: { kind: 'medication', childId: child.id, childName: child.first_name, ml: null, at, timeGiven: true, time: `${String(time.h).padStart(2, '0')}:${String(time.m).padStart(2, '0')}` } };
  }

  if (!child) return { ok: false, error: 'child' };
  const kind: QuickKind | null = /(biberon|\bbu\b|\bbois|\bml\b|lait)/.test(t) ? 'bottle'
    : /(reveille|reveil|leve)/.test(t) ? 'sleep_end'
    : /(endormi|endort|dort|dormi|sieste|couche a|couchee a|au lit)/.test(t) ? 'sleep_start'
    : /(couche|change)/.test(t) ? 'diaper' : null;
  if (!kind) return { ok: false, error: 'kind' };

  let ml: number | null = null;
  const m = t.match(/(\d{1,3})\s*ml\b/);
  if (m) ml = Number(m[1]);
  else {
    const w = t.match(/\b(cent|deux cents?|trois cents?)\s*(cinquante|vingt|trente|quarante)?\s*ml\b/);
    if (w) ml = (w[1].startsWith('deux') ? 200 : w[1].startsWith('trois') ? 300 : 100) + (w[2] ? NUMBERS[w[2]] : 0);
  }
  if (kind === 'bottle' && ml != null && (ml < 1 || ml > 500)) return { ok: false, error: 'ml' };

  const at = new Date(now);
  at.setSeconds(0, 0);
  if (time) {
    at.setHours(time.h, time.m);
    // une heure « future » de plus de 30 min désigne la veille (ex. « 23 h » saisi à 1 h du matin) : jamais dans le futur
    if (at.getTime() - now.getTime() > 30 * 60_000) at.setDate(at.getDate() - 1);
  }
  return { ok: true, value: { kind, childId: child.id, childName: child.first_name, ml, at, timeGiven: !!time } };
}
