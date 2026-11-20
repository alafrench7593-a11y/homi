/**
 * Animaux du foyer (outil 189) — logique pure, testée (foyerTools.test.ts).
 * Les dates de soin (fait le, prochain le) sont SAISIES par le parent : aucun calendrier vétérinaire n'est proposé,
 * aucune durée n'est calculée. Les tâches récurrentes (nourrir, promener, litière…) sont des missions du foyer.
 */
import { daysBetween, type ISODate } from '@/lib/domain/dates';
import type { TaskCategory } from '@/lib/domain/familyLoad';

export const PET_SPECIES = ['dog', 'cat', 'rabbit', 'rodent', 'bird', 'fish', 'reptile', 'other'] as const;
export type PetSpecies = (typeof PET_SPECIES)[number];
export const CARE_KINDS = ['vaccine', 'deworming', 'flea', 'vet', 'grooming', 'other'] as const;
export type CareKind = (typeof CARE_KINDS)[number];

export interface Pet {
  id: string; household_id: string; name: string; species: PetSpecies; birth_date: ISODate | null;
  vet_name: string | null; vet_phone: string | null; notes: string | null; created_at?: string; updated_at?: string; _pending?: boolean;
}
export interface PetCare {
  id: string; household_id: string; pet_id: string; kind: CareKind; label: string | null; done_on: ISODate | null; next_due: ISODate | null;
  note: string | null; created_at?: string; updated_at?: string; _pending?: boolean;
}

export type CareStatus = 'overdue' | 'soon' | 'planned' | 'done';
/** État d'un soin : en retard, bientôt (≤ 14 jours), prévu, ou seulement fait (aucune prochaine date saisie). */
export function careStatus(c: Pick<PetCare, 'next_due'>, today: ISODate, soonDays = 14): CareStatus {
  if (!c.next_due) return 'done';
  const d = daysBetween(today, c.next_due);
  if (d < 0) return 'overdue';
  return d <= soonDays ? 'soon' : 'planned';
}

/** Prochains soins (date saisie), du plus pressant au plus lointain ; les soins sans prochaine date sont exclus. */
export function upcomingCares<T extends Pick<PetCare, 'next_due'>>(list: T[]): T[] {
  return list.filter((c) => !!c.next_due).sort((a, b) => a.next_due!.localeCompare(b.next_due!));
}
/** Historique : soins faits, du plus récent au plus ancien. */
export function careHistory<T extends Pick<PetCare, 'done_on'>>(list: T[]): T[] {
  return list.filter((c) => !!c.done_on).sort((a, b) => b.done_on!.localeCompare(a.done_on!));
}

/** Âge en années et mois révolus (null sans date de naissance). */
export function petAge(birth: ISODate | null, today: ISODate): { years: number; months: number } | null {
  if (!birth || birth > today) return null;
  const [by, bm, bd] = birth.split('-').map(Number);
  const [ty, tm, td] = today.split('-').map(Number);
  let months = (ty - by) * 12 + (tm - bm) - (td < bd ? 1 : 0);
  months = Math.max(0, months);
  return { years: Math.floor(months / 12), months: months % 12 };
}

/** Tâches récurrentes proposées : des missions « Animaux » ordinaires (heure et répétition modifiables ensuite). */
export interface PetTaskTemplate { key: 'feed' | 'walk' | 'litter' | 'water' | 'cage'; time: string; repeat: 'daily' | 'weekly'; species: PetSpecies[] | 'all'; category: TaskCategory }
export const PET_TASKS: PetTaskTemplate[] = [
  { key: 'feed', time: '08:00', repeat: 'daily', species: 'all', category: 'pets' },
  { key: 'walk', time: '19:00', repeat: 'daily', species: ['dog'], category: 'pets' },
  { key: 'litter', time: '20:00', repeat: 'daily', species: ['cat'], category: 'pets' },
  { key: 'water', time: '09:00', repeat: 'daily', species: ['rabbit', 'rodent', 'bird', 'reptile', 'other'], category: 'pets' },
  { key: 'cage', time: '10:00', repeat: 'weekly', species: ['rabbit', 'rodent', 'bird', 'fish', 'reptile'], category: 'pets' },
];
export const tasksFor = (species: PetSpecies) => PET_TASKS.filter((t) => t.species === 'all' || t.species.includes(species));

/** Lien d'un rappel de soin (sert aussi à le retrouver pour le supprimer avec le soin). */
export const careReminderLink = (petId: string, careId: string) => `/family/pets/${petId}?care=${careId}`;
