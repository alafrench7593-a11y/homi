/**
 * Module Neuro — profil sensoriel et journal de situations structurés (23/11/2026).
 * Aucune migration : stockés dans `child_need_entries` (kind « observation ») avec un corps encodé
 * reconnaissable (`§sens1` / `§sit1`), donc mêmes droits RLS « santé », même export et même suppression.
 * Le diagnostic n'est jamais requis. Logique pure, testée dans src/__tests__/neuroStructured.test.ts.
 */

export const SENSES = ['noise', 'light', 'touch', 'food', 'smell', 'movement', 'crowd'] as const;
export type Sense = (typeof SENSES)[number];
export const SENSE_LEVELS = ['avoids', 'seeks', 'ok'] as const;
export type SenseLevel = (typeof SENSE_LEVELS)[number];

export interface SensoryProfile { levels: Partial<Record<Sense, SenseLevel>>; calms: string; avoid: string }
export interface Situation { before: string; during: string; after: string; helped: string; intensity: number | null }

const SENS = '§sens1';
const SIT = '§sit1';
const MAX = 600;

/** Une valeur sur une ligne : pas de retour à la ligne (séparateur), longueur bornée. */
const flat = (s: string) => s.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, MAX);

function kv(body: string, head: string): Record<string, string> | null {
  const [first, ...rest] = body.split('\n');
  if (first?.trim() !== head) return null;
  const out: Record<string, string> = {};
  for (const line of rest) {
    const i = line.indexOf('=');
    if (i > 0) out[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return out;
}

export function encodeSensory(p: SensoryProfile): string {
  const lines = [SENS];
  for (const s of SENSES) { const v = p.levels[s]; if (v && (SENSE_LEVELS as readonly string[]).includes(v)) lines.push(`${s}=${v}`); }
  if (flat(p.calms)) lines.push(`calms=${flat(p.calms)}`);
  if (flat(p.avoid)) lines.push(`avoid=${flat(p.avoid)}`);
  return lines.join('\n');
}

export function parseSensory(body: string | null | undefined): SensoryProfile | null {
  const m = body ? kv(body, SENS) : null;
  if (!m) return null;
  const levels: SensoryProfile['levels'] = {};
  for (const s of SENSES) if ((SENSE_LEVELS as readonly string[]).includes(m[s] ?? '')) levels[s] = m[s] as SenseLevel;
  return { levels, calms: m.calms ?? '', avoid: m.avoid ?? '' };
}

export function encodeSituation(s: Situation): string {
  const lines = [SIT];
  (['before', 'during', 'after', 'helped'] as const).forEach((k) => { if (flat(s[k])) lines.push(`${k}=${flat(s[k])}`); });
  if (s.intensity && s.intensity >= 1 && s.intensity <= 5) lines.push(`intensity=${Math.round(s.intensity)}`);
  return lines.join('\n');
}

export function parseSituation(body: string | null | undefined): Situation | null {
  const m = body ? kv(body, SIT) : null;
  if (!m) return null;
  const n = Number(m.intensity);
  return { before: m.before ?? '', during: m.during ?? '', after: m.after ?? '', helped: m.helped ?? '', intensity: n >= 1 && n <= 5 ? n : null };
}

/** Une situation est valide dès qu'on a noté ce qui s'est passé. */
export const situationValid = (s: Situation) => flat(s.during).length > 0;

/** Profil le plus récent parmi des entrées triées du plus récent au plus ancien. */
export function latestSensory<T extends { body: string | null }>(entries: T[] | null | undefined): { entry: T; profile: SensoryProfile } | null {
  for (const e of entries ?? []) { const p = parseSensory(e.body); if (p) return { entry: e, profile: p }; }
  return null;
}

/** Ce qui aide le plus souvent (situations récentes) : repérage simple, sans interprétation. */
export function whatHelps<T extends { body: string | null }>(entries: T[] | null | undefined, max = 3): string[] {
  const count = new Map<string, { label: string; n: number }>();
  for (const e of entries ?? []) {
    const s = parseSituation(e.body);
    if (!s?.helped) continue;
    for (const part of s.helped.split(/[,;]/)) {
      const label = part.trim();
      if (!label) continue;
      const k = label.toLowerCase();
      const cur = count.get(k);
      count.set(k, { label: cur?.label ?? label, n: (cur?.n ?? 0) + 1 });
    }
  }
  return [...count.values()].sort((a, b) => b.n - a.n).slice(0, max).map((x) => x.label);
}

/** Lignes imprimables (fiche pour l'école, la nounou, les grands-parents). */
export function sensoryLines(p: SensoryProfile, label: (s: Sense) => string, level: (l: SenseLevel) => string, calmsLabel: string, avoidLabel: string): string[] {
  const out = SENSES.filter((s) => p.levels[s] && p.levels[s] !== 'ok').map((s) => `${label(s)} : ${level(p.levels[s]!)}`);
  if (p.calms) out.push(`${calmsLabel} : ${p.calms}`);
  if (p.avoid) out.push(`${avoidLabel} : ${p.avoid}`);
  return out;
}
