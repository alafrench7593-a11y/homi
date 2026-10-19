/**
 * Carte « Mon cycle » de l'accueil : éléments et raccourcis personnalisables (gardés sur l'appareil).
 * Le masquage des données sensibles (« hide_on_home ») est, lui, une préférence du compte (cycle_preferences).
 */
import type { CycleIconName } from './kit';

export const CARD_ITEMS = ['day', 'last', 'next', 'fertile', 'length', 'symptoms', 'discharge', 'stats'] as const;
export type CardItem = (typeof CARD_ITEMS)[number];

export const CARD_SHORTCUTS = ['period', 'symptoms', 'discharge', 'calendar', 'stats', 'journal', 'bleeding', 'guides'] as const;
export type CardShortcut = (typeof CARD_SHORTCUTS)[number];
export const MAX_SHORTCUTS = 4;

export const SHORTCUT_META: Record<CardShortcut, { icon: CycleIconName; href: string }> = {
  period: { icon: 'period', href: '/cycle?all=1' },
  symptoms: { icon: 'symptoms', href: '/cycle/symptoms' },
  discharge: { icon: 'discharge', href: '/cycle/discharge/new' },
  calendar: { icon: 'calendar', href: '/cycle/calendar' },
  stats: { icon: 'stats', href: '/cycle/stats' },
  journal: { icon: 'journal', href: '/cycle/journal' },
  bleeding: { icon: 'bleeding', href: '/cycle/bleeding' },
  guides: { icon: 'guide', href: '/cycle/guides' },
};

export function defaultItems(mode: 'ttc' | 'avoid' | 'cycle'): CardItem[] {
  return mode === 'cycle' ? ['day', 'last', 'next', 'length', 'symptoms', 'discharge'] : ['day', 'last', 'next', 'fertile', 'length'];
}
export const DEFAULT_SHORTCUTS: CardShortcut[] = ['period', 'symptoms', 'discharge', 'calendar'];

/** Éléments à afficher : choix enregistré (valeurs inconnues ignorées), sinon les éléments par défaut du parcours. */
export function resolveItems(stored: string[] | null | undefined, mode: 'ttc' | 'avoid' | 'cycle'): CardItem[] {
  if (!stored) return defaultItems(mode);
  return stored.filter((k): k is CardItem => (CARD_ITEMS as readonly string[]).includes(k));
}
export function resolveShortcuts(stored: string[] | null | undefined): CardShortcut[] {
  if (!stored) return DEFAULT_SHORTCUTS;
  return [...new Set(stored)].filter((k): k is CardShortcut => (CARD_SHORTCUTS as readonly string[]).includes(k)).slice(0, MAX_SHORTCUTS);
}
/** Ordre complet pour l'écran de réglage : éléments choisis d'abord (dans leur ordre), puis les autres. */
export function fullOrder(chosen: CardItem[]): CardItem[] {
  return [...chosen, ...CARD_ITEMS.filter((k) => !chosen.includes(k))];
}
export function moveItem<T>(list: T[], item: T, d: -1 | 1): T[] {
  const i = list.indexOf(item); const j = i + d;
  if (i < 0 || j < 0 || j >= list.length) return list;
  const next = [...list]; [next[i], next[j]] = [next[j], next[i]];
  return next;
}
