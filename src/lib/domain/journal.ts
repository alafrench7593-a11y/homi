/**
 * Journal unifié : toutes les saisies réellement enregistrées, normalisées en une seule chronologie.
 * Statistiques DESCRIPTIVES (des comptes), sans interprétation : une tendance ne prouve aucune cause.
 */
export type JournalCategory = 'feeding' | 'sleep' | 'diaper' | 'health' | 'medication' | 'teeth' | 'memory' | 'appointment' | 'task';

export const JOURNAL_CATEGORIES: { value: JournalCategory; label: string }[] = [
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
  const cell = (s: string) => `"${s.replace(/"/g, '""')}"`;
  const label = (c: JournalCategory) => JOURNAL_CATEGORIES.find((x) => x.value === c)?.label ?? c;
  const rows = [['Date', 'Heure', 'Catégorie', 'Entrée', 'Détail', 'Note'].map(cell).join(';')];
  for (const e of [...entries].sort((a, b) => (a.at < b.at ? -1 : 1))) {
    const d = new Date(e.at);
    rows.push([d.toLocaleDateString('fr-FR'), d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }), label(e.category), e.title, e.detail, e.note ?? ''].map(cell).join(';'));
  }
  return `﻿# Journal de ${childName} — saisies enregistrées dans l’application, à vérifier avant toute décision\r\n${rows.join('\r\n')}\r\n`;
}
