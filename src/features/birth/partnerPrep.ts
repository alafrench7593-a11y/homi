/**
 * 48 — Préparation du coparent à l'accouchement : modèle de la liste (réutilise les listes de préparation existantes :
 * checklists de genre « coparent » + checklist_items, dont la NOTE porte le numéro, le trajet, le détail). La liste est
 * PRIVÉE à sa création ; seule la personne qui l'a créée la partage avec l'autre parent (private_to_creator).
 * Contenu pratique, non médical. Logique pure, testée.
 */
import { t as tr, type TKey } from '@/i18n';
import type { IconName } from '@/components/ui';

export type PrepGroup = 'numbers' | 'route' | 'bag' | 'papers' | 'start' | 'role';
export const PREP_GROUPS: readonly { key: PrepGroup; icon: IconName }[] = [
  { key: 'numbers', icon: 'phone' }, { key: 'route', icon: 'map-pin' }, { key: 'bag', icon: 'briefcase' },
  { key: 'papers', icon: 'file-text' }, { key: 'start', icon: 'clock' }, { key: 'role', icon: 'users' },
];

/** Points du modèle : clé stable, groupe, et si une note (numéro, adresse…) est attendue. */
export const PREP_ITEMS: readonly { key: string; group: PrepGroup; note: boolean }[] = [
  { key: 'maternity_phone', group: 'numbers', note: true },
  { key: 'midwife_phone', group: 'numbers', note: true },
  { key: 'emergency_numbers', group: 'numbers', note: false },
  { key: 'kids_care_phone', group: 'numbers', note: true },
  { key: 'route_known', group: 'route', note: true },
  { key: 'parking', group: 'route', note: true },
  { key: 'night_transport', group: 'route', note: true },
  { key: 'fuel_seat', group: 'route', note: false },
  { key: 'bag_ready', group: 'bag', note: false },
  { key: 'partner_bag', group: 'bag', note: false },
  { key: 'snacks_water', group: 'bag', note: false },
  { key: 'chargers', group: 'bag', note: false },
  { key: 'id_cards', group: 'papers', note: false },
  { key: 'pregnancy_file', group: 'papers', note: false },
  { key: 'birth_plan_copy', group: 'papers', note: false },
  { key: 'when_to_call', group: 'start', note: true },
  { key: 'timer_ready', group: 'start', note: false },
  { key: 'who_to_tell', group: 'start', note: true },
  { key: 'leave_work', group: 'start', note: true },
  { key: 'listen_wishes', group: 'role', note: false },
  { key: 'speak_for', group: 'role', note: false },
  { key: 'first_days', group: 'role', note: true },
];

/** Libellé enregistré dans la liste (langue de la personne qui la crée ; modifiable ensuite comme toute liste). */
export const itemLabel = (key: string) => tr(`bpp.item.${key}` as TKey);
export const itemHint = (key: string) => tr(`bpp.hint.${key}` as TKey);

/** Lignes à créer pour une nouvelle liste (position = ordre du modèle). */
export function templateRows(): { label: string; position: number; group: PrepGroup; key: string }[] {
  return PREP_ITEMS.map((i, n) => ({ label: itemLabel(i.key), position: n * 10, group: i.group, key: i.key }));
}

/** Groupe d'un point de la liste, retrouvé par sa position (les points ajoutés à la main : « Autres »). */
export function groupOfPosition(position: number): PrepGroup | null {
  if (position % 10 !== 0) return null;
  return PREP_ITEMS[position / 10]?.group ?? null;
}
export const keyOfPosition = (position: number): string | null => (position % 10 === 0 ? PREP_ITEMS[position / 10]?.key ?? null : null);

/** Texte à partager (feuille de partage du téléphone) : points cochés ou non, avec leurs notes. */
export function prepText(title: string, items: { label: string; done: boolean; note: string | null }[]): string {
  return [title, '', ...items.map((i) => `${i.done ? '☑' : '☐'} ${i.label}${i.note ? ` : ${i.note}` : ''}`)].join('\n');
}
