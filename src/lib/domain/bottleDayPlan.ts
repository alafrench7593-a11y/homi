/**
 * « Ma journée biberons » — logique pure.
 *
 * Dès le premier biberon de la journée, l'écran montre toute la journée en créneaux : ceux déjà notés, le suivant,
 * et les suivants prévus jusqu'au soir. Chaque créneau peut être rempli en un geste.
 *
 * Principe inchangé : l'application ne calcule ni ne recommande AUCUN rythme ni AUCUNE quantité. Les créneaux
 * viennent uniquement du DÉLAI CHOISI PAR LE PARENT (celui de son rappel) et la quantité proposée est celle qu'il
 * a lui-même préparée la dernière fois (ou prévue sur le rappel). Sans délai choisi, aucun créneau n'est inventé.
 */
import type { Bottle } from '@/lib/types';

export type SlotStatus = 'done' | 'missed' | 'next' | 'planned';

export interface DaySlot {
  /** Heure (ISO) : réelle pour un biberon noté, prévue sinon. */
  at: string;
  status: SlotStatus;
  bottle?: Pick<Bottle, 'id' | 'at' | 'prepared_ml' | 'consumed_ml'>;
  /** Quantité reprise des saisies du parent (jamais calculée). */
  suggestedMl: number | null;
}

export interface DayPlanInput {
  /** Biberons notés aujourd'hui (n'importe quel ordre). */
  todays: Pick<Bottle, 'id' | 'at' | 'prepared_ml' | 'consumed_ml'>[];
  /** Délai choisi par le parent (minutes) — null : pas de créneaux prévus. */
  intervalMinutes: number | null;
  /** Quantité prévue sur le rappel, sinon la dernière quantité préparée. */
  plannedMl?: number | null;
  now?: Date;
  /** Dernier créneau proposé au plus tard à cette heure (heure locale), 23 h par défaut. */
  dayEndHour?: number;
  /** Nombre maximal de créneaux affichés (sécurité). */
  max?: number;
}

const MIN = 60_000;
/** Au-delà de 30 min de retard, un créneau prévu est proposé « à remplir » plutôt que « suivant ». */
export const GRACE_MIN = 30;

/** Fin de la journée locale du jour de `now` à `hour` h. */
function endOf(now: Date, hour: number) {
  const d = new Date(now);
  d.setHours(hour, 0, 0, 0);
  return d.getTime();
}

/** Quantité proposée : celle du rappel, sinon la dernière préparée aujourd'hui, sinon rien. */
export function usualMl(todays: DayPlanInput['todays'], plannedMl?: number | null): number | null {
  if (plannedMl != null) return plannedMl;
  const sorted = [...todays].sort((a, b) => b.at.localeCompare(a.at));
  return sorted.find((b) => b.prepared_ml != null)?.prepared_ml ?? null;
}

export function bottleDayPlan({ todays, intervalMinutes, plannedMl = null, now = new Date(), dayEndHour = 23, max = 12 }: DayPlanInput): DaySlot[] {
  const done = [...todays].sort((a, b) => a.at.localeCompare(b.at));
  const ml = usualMl(done, plannedMl);
  const slots: DaySlot[] = done.map((b) => ({ at: b.at, status: 'done', bottle: b, suggestedMl: b.prepared_ml ?? b.consumed_ml ?? null }));
  if (!done.length || intervalMinutes == null || intervalMinutes <= 0) return slots;
  const end = endOf(now, dayEndHour);
  // un créneau passé depuis plus de 30 min est « à remplir » (oublié) ; le premier qui ne l'est pas est le « suivant »
  const late = now.getTime() - GRACE_MIN * MIN;
  let t = Date.parse(done[done.length - 1].at) + intervalMinutes * MIN;
  let nextGiven = false;
  // le biberon suivant est toujours proposé, même tard le soir ou la nuit ; les autres jusqu'à l'heure de fin
  while ((t <= end || !nextGiven) && slots.length < max) {
    const status: SlotStatus = t < late ? 'missed' : nextGiven ? 'planned' : 'next';
    if (status === 'next') nextGiven = true;
    slots.push({ at: new Date(t).toISOString(), status, suggestedMl: ml });
    t += intervalMinutes * MIN;
  }
  return slots;
}

/** Le créneau à noter maintenant (le suivant), s'il y en a un. */
export function nextSlot(slots: DaySlot[]): DaySlot | null {
  return slots.find((s) => s.status === 'next') ?? null;
}

/** Heure affichée « 14 h 30 ». */
export function slotClock(iso: string): string {
  const d = new Date(iso);
  return `${d.getHours()} h ${String(d.getMinutes()).padStart(2, '0')}`;
}
