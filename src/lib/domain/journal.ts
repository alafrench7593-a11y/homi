/**
 * Journal unifié : toutes les saisies réellement enregistrées, normalisées en une seule chronologie.
 * Statistiques DESCRIPTIVES (des comptes), sans interprétation : une tendance ne prouve aucune cause.
 */
import { csvCell } from '../csv';
import { localeTag, t as tr } from '@/i18n';
import { localized } from '@/i18n/localized';

export type JournalCategory = 'feeding' | 'sleep' | 'diaper' | 'health' | 'medication' | 'teeth' | 'memory' | 'appointment' | 'task';

const JOURNAL_CATEGORIES_FR: { value: JournalCategory; label: string }[] = [
  { value: 'feeding', label: 'Biberons et repas' },
  { value: 'sleep', label: 'Sommeil' },
  { value: 'diaper', label: 'Changes' },
  { value: 'health', label: 'Observations' },
  { value: 'medication', label: 'Médicaments notés' },
  { value: 'teeth', label: 'Dents' },
  { value: 'memory', label: 'Souvenirs et étapes' },
  { value: 'appointment', label: 'Rendez-vous' },
  { value: 'task', label: 'Tâches faites' },
];
const JOURNAL_CATEGORIES_EN: { value: JournalCategory; label: string }[] = [
  { value: 'feeding', label: 'Bottles and meals' },
  { value: 'sleep', label: 'Sleep' },
  { value: 'diaper', label: 'Nappy changes' },
  { value: 'health', label: 'Observations' },
  { value: 'medication', label: 'Medicines logged' },
  { value: 'teeth', label: 'Teeth' },
  { value: 'memory', label: 'Memories and milestones' },
  { value: 'appointment', label: 'Appointments' },
  { value: 'task', label: 'Tasks done' },
];
export const JOURNAL_CATEGORIES: { value: JournalCategory; label: string }[] = localized(JOURNAL_CATEGORIES_FR, JOURNAL_CATEGORIES_EN);

export interface JournalEntry { key: string; at: string; category: JournalCategory; title: string; detail: string; note?: string | null; route?: string }

export function filterJournal(entries: JournalEntry[], o: { from: Date; to: Date; categories?: JournalCategory[]; search?: string }) {
  const q = (o.search ?? '').trim().toLocaleLowerCase('fr-FR').normalize('NFD').replace(/\p{Diacritic}/gu, '');
  const norm = (s: string) => s.toLocaleLowerCase('fr-FR').normalize('NFD').replace(/\p{Diacritic}/gu, '');
  return entries
    .filter((e) => Date.parse(e.at) >= o.from.getTime() && Date.parse(e.at) < o.to.getTime())
    .filter((e) => !o.categories?.length || o.categories.includes(e.category))
    .filter((e) => !q || norm(`${e.title} ${e.detail} ${e.note ?? ''}`).includes(q))
    .sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));
}

/** Nombre d'entrées par catégorie (descriptif). */
export function journalStats(entries: JournalEntry[]) {
  return JOURNAL_CATEGORIES.map((c) => ({ ...c, count: entries.filter((e) => e.category === c.value).length })).filter((c) => c.count > 0);
}

/** Export CSV (séparateur « ; » pour Excel en français), UTF-8 avec BOM. */
export function journalCsv(entries: JournalEntry[], childName: string) {
  const cell = csvCell;
  const label = (c: JournalCategory) => JOURNAL_CATEGORIES.find((x) => x.value === c)?.label ?? c;
  const rows = [[tr('l2.journal.csvDate'), tr('l2.journal.csvTime'), tr('l2.journal.csvCategory'), tr('l2.journal.csvEntry'), tr('l2.journal.csvDetail'), tr('l2.journal.csvNote')].map(cell).join(';')];
  for (const e of [...entries].sort((a, b) => (a.at < b.at ? -1 : 1))) {
    const d = new Date(e.at);
    rows.push([d.toLocaleDateString(localeTag()), d.toLocaleTimeString(localeTag(), { hour: '2-digit', minute: '2-digit' }), label(e.category), e.title, e.detail, e.note ?? ''].map(cell).join(';'));
  }
  return `﻿${tr('l2.journal.csvTitle', { name: childName })}\r\n${rows.join('\r\n')}\r\n`;
}
