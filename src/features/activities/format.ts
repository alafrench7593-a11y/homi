/** Activités extrascolaires : textes affichés (jour court, créneaux) dans la langue active. */
import { formatDate, t as tr } from '@/i18n';
import type { Slot, Weekday } from './domain';

/** Jour court (« mer. ») : le 5 janvier 2026 est un lundi. */
export const dayShort = (d: Weekday) => formatDate(new Date(2026, 0, 4 + d, 12), { weekday: 'short' });
export const slotsText = (slots: Slot[]) => slots.map((s) => tr('p2.act.slot', { day: dayShort(s.day), from: s.from, to: s.to })).join(' · ');
