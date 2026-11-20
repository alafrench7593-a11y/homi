/**
 * 80 — Organisation des biberons avec le coparent : logique pure (testée).
 * Un relais = un biberon prévu (heure, quantité facultative) et la personne qui le donne. La personne proposée est
 * celle du relais de nuit à cette heure-là (outil existant), sinon la personne qui a donné le relais précédent est
 * alternée. Le relais est relié au biberon réellement noté (suivi existant), jamais deviné sans accord.
 * Aucun compteur par personne, aucun score.
 */
export type RelayStatus = 'planned' | 'given' | 'skipped';
export interface BottleRelay {
  id: string; household_id: string; child_id: string; planned_at: string; planned_ml: number | null; assigned_to: string;
  status: RelayStatus; bottle_id: string | null; given_at: string | null; note: string | null; created_by?: string | null;
  created_at?: string; updated_at?: string; _pending?: boolean;
}
interface ShiftLite { user_id: string; starts_at: string; ends_at: string; status?: string | null; kind?: string | null }
interface BottleLite { id: string; at: string; created_by?: string | null }

/** Parent du relais de nuit qui couvre cette heure (relais annulés ignorés). */
export function nightPersonAt(at: string, shifts: ShiftLite[]): string | null {
  const t = Date.parse(at);
  const s = shifts.find((x) => (x.kind ?? 'night') === 'night' && x.status !== 'cancelled' && Date.parse(x.starts_at) <= t && t < Date.parse(x.ends_at));
  return s?.user_id ?? null;
}

/**
 * Plan de plusieurs biberons : à partir d'une heure, toutes les `everyMinutes`, `count` fois. Personne : celle du relais
 * de nuit si l'heure est couverte, sinon alternance entre les parents donnés (en commençant par `first`).
 */
export function planRelays(o: { start: string; everyMinutes: number; count: number; people: string[]; first: string; shifts: ShiftLite[]; alternate: boolean }): { planned_at: string; assigned_to: string }[] {
  const n = Math.max(1, Math.min(12, Math.floor(o.count)));
  const step = Math.max(30, Math.min(12 * 60, Math.floor(o.everyMinutes))) * 60_000;
  const people = o.people.length ? o.people : [o.first];
  let idx = Math.max(0, people.indexOf(o.first));
  const out: { planned_at: string; assigned_to: string }[] = [];
  for (let i = 0; i < n; i++) {
    const at = new Date(Date.parse(o.start) + i * step).toISOString();
    const night = nightPersonAt(at, o.shifts);
    out.push({ planned_at: at, assigned_to: night ?? people[idx % people.length] });
    if (o.alternate && !night) idx++;
  }
  return out;
}

export type RelayView = 'upcoming' | 'now' | 'past' | 'given' | 'skipped';
/** « maintenant » : de 30 min avant à 60 min après l'heure prévue ; « passé » : prévu, plus tard, sans biberon relié. */
export function relayView(r: Pick<BottleRelay, 'status' | 'planned_at'>, now: Date = new Date()): RelayView {
  if (r.status === 'given') return 'given';
  if (r.status === 'skipped') return 'skipped';
  const d = Date.parse(r.planned_at) - now.getTime();
  if (d > 30 * 60_000) return 'upcoming';
  if (d >= -60 * 60_000) return 'now';
  return 'past';
}

/** Biberon noté autour de l'heure prévue (de 60 min avant à 120 min après), pas encore relié à un autre relais. */
export function matchingBottle(r: Pick<BottleRelay, 'planned_at'>, bottles: BottleLite[], relays: Pick<BottleRelay, 'bottle_id'>[]): BottleLite | null {
  const used = new Set(relays.map((x) => x.bottle_id).filter(Boolean));
  const t = Date.parse(r.planned_at);
  const cands = bottles.filter((b) => !used.has(b.id) && Date.parse(b.at) >= t - 60 * 60_000 && Date.parse(b.at) <= t + 120 * 60_000);
  return cands.sort((a, b) => Math.abs(Date.parse(a.at) - t) - Math.abs(Date.parse(b.at) - t))[0] ?? null;
}

/** Ordre d'affichage : à faire (le plus proche d'abord), puis l'historique (le plus récent d'abord). */
export function sortRelays<T extends Pick<BottleRelay, 'status' | 'planned_at'>>(list: T[]): { open: T[]; done: T[] } {
  const open = list.filter((r) => r.status === 'planned').sort((a, b) => a.planned_at.localeCompare(b.planned_at));
  const done = list.filter((r) => r.status !== 'planned').sort((a, b) => b.planned_at.localeCompare(a.planned_at));
  return { open, done };
}

export function validateRelay(d: { at: string | null; ml: string; person: string | null }): 'brl.err.time' | 'brl.err.ml' | 'brl.err.person' | null {
  if (!d.at || Number.isNaN(Date.parse(d.at))) return 'brl.err.time';
  if (d.ml.trim() && !(/^\d{1,3}$/.test(d.ml.trim()) && Number(d.ml) >= 1 && Number(d.ml) <= 500)) return 'brl.err.ml';
  if (!d.person) return 'brl.err.person';
  return null;
}
