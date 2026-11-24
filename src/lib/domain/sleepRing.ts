/**
 * Anneau du sommeil sur 24 h (refonte « motion », lot 2 — 24/11/2026) : logique pure, testée.
 *
 * Fenêtre glissante [maintenant − 24 h, maintenant]. Chaque sommeil NOTÉ qui la recoupe devient un arc placé à son
 * heure réelle sur un cadran de 24 h (minuit en haut, sens horaire). Un sommeil en cours s'arrête à « maintenant ».
 * Le reste n'est PAS appelé « éveil » : c'est « rien de noté » (l'appli ne sait pas si l'enfant dormait).
 * Aucune phase (léger, profond, paradoxal) n'est déduite : un minuteur ne le permet pas.
 */
import type { Sleep } from '@/lib/types';

export const RING_WINDOW_MIN = 24 * 60;

export interface RingArc {
  id: string;
  kind: 'night' | 'nap';
  /** Angles en degrés sur le cadran de 24 h : 0 = minuit, 90 = 6 h, 180 = midi, 270 = 18 h */
  from: number;
  to: number;
  /** Bornes réelles dans la fenêtre (ISO) et durée retenue en minutes */
  start: string;
  end: string;
  minutes: number;
  ongoing: boolean;
}

export interface SleepRing {
  arcs: RingArc[];
  totalMin: number;
  nightMin: number;
  napMin: number;
  /** Minutes de la fenêtre sans aucun sommeil noté (≠ éveil) */
  unrecordedMin: number;
  /** Angle de « maintenant » sur le cadran */
  nowAngle: number;
}

/** Angle d'un instant sur un cadran de 24 h (heure locale). */
export function clockAngle(d: Date): number {
  return ((d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60) / RING_WINDOW_MIN) * 360;
}

/** Nuit si notée comme telle ; sinon, sans type : commencée entre 19 h et 5 h. */
export function sleepKind(s: Pick<Sleep, 'kind' | 'started_at'>): 'night' | 'nap' {
  if (s.kind === 'night' || s.kind === 'nap') return s.kind;
  const h = new Date(s.started_at).getHours();
  return h >= 19 || h < 5 ? 'night' : 'nap';
}

export function sleepRing(sleeps: readonly Sleep[], childId: string, now: Date): SleepRing {
  const winStart = now.getTime() - RING_WINDOW_MIN * 60_000;
  const winEnd = now.getTime();
  // Segments recoupant la fenêtre, triés ; les chevauchements (double saisie) ne sont comptés qu'une fois
  const segs = sleeps
    .filter((s) => s.child_id === childId)
    .map((s) => {
      const a = new Date(s.started_at).getTime();
      const b = s.ended_at ? new Date(s.ended_at).getTime() : winEnd;
      return { s, a: Math.max(a, winStart), b: Math.min(b, winEnd), ongoing: !s.ended_at };
    })
    .filter((x) => Number.isFinite(x.a) && Number.isFinite(x.b) && x.b > x.a)
    .sort((x, y) => x.a - y.a);

  const arcs: RingArc[] = [];
  let covered = 0;
  let cursor = winStart;
  let nightMin = 0;
  let napMin = 0;
  for (const x of segs) {
    const a = Math.max(x.a, cursor); // partie non déjà comptée
    if (x.b > a) {
      const min = (x.b - a) / 60_000;
      covered += min;
      if (sleepKind(x.s) === 'night') nightMin += min; else napMin += min;
      cursor = x.b;
    }
    const minutes = (x.b - x.a) / 60_000;
    const from = clockAngle(new Date(x.a));
    // Un arc de 24 h exactement ferait un cercle nul (from === to) : plafonné juste en dessous
    const sweep = Math.min(359.9, (minutes / RING_WINDOW_MIN) * 360);
    arcs.push({ id: x.s.id, kind: sleepKind(x.s), from, to: from + sweep, start: new Date(x.a).toISOString(), end: new Date(x.b).toISOString(), minutes, ongoing: x.ongoing });
  }
  const totalMin = Math.round(covered);
  return { arcs, totalMin, nightMin: Math.round(nightMin), napMin: Math.round(napMin), unrecordedMin: Math.max(0, RING_WINDOW_MIN - totalMin), nowAngle: clockAngle(now) };
}

/** Tracé SVG d'un arc de cercle (angles en degrés, 0 en haut, sens horaire). */
export function arcPath(cx: number, cy: number, r: number, from: number, to: number): string {
  const pt = (deg: number) => {
    const rad = ((deg - 90) * Math.PI) / 180;
    return `${(cx + r * Math.cos(rad)).toFixed(2)} ${(cy + r * Math.sin(rad)).toFixed(2)}`;
  };
  const large = to - from > 180 ? 1 : 0;
  return `M ${pt(from)} A ${r} ${r} 0 ${large} 1 ${pt(to)}`;
}
