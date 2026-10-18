/** Journal unifié : filtres, recherche sans accents, statistiques descriptives, export CSV. */
import { filterJournal, journalCsv, journalStats, type JournalEntry } from '@/lib/domain/journal';

const e = (v: Partial<JournalEntry>): JournalEntry => ({ key: Math.random().toString(), at: '2026-10-18T08:00:00.000Z', category: 'feeding', title: 'Biberon', detail: '120 ml bus', ...v });
const all = [
  e({ at: '2026-10-18T06:00:00.000Z' }),
  e({ category: 'sleep', title: 'Sommeil', detail: '1 h 30', at: '2026-10-18T10:00:00.000Z' }),
  e({ category: 'health', title: 'Température', detail: '38,2 °C', note: 'Après la crèche', at: '2026-10-17T18:00:00.000Z' }),
  e({ category: 'memory', title: 'Premiers pas', detail: 'Étape', at: '2026-10-10T12:00:00.000Z' }),
];
const day = { from: new Date('2026-10-18T00:00:00.000Z'), to: new Date('2026-10-19T00:00:00.000Z') };

describe('journal unifié', () => {
  it('période et ordre antichronologique', () => {
    expect(filterJournal(all, day).map((x) => x.title)).toEqual(['Sommeil', 'Biberon']);
  });
  it('filtres par catégorie', () => {
    expect(filterJournal(all, { ...day, categories: ['sleep'] }).map((x) => x.title)).toEqual(['Sommeil']);
  });
  it('recherche insensible aux accents et à la casse, dans les notes aussi', () => {
    const week = { from: new Date('2026-10-01'), to: new Date('2026-10-20') };
    expect(filterJournal(all, { ...week, search: 'creche' }).map((x) => x.title)).toEqual(['Température']);
    expect(filterJournal(all, { ...week, search: 'PREMIERS' })).toHaveLength(1);
  });
  it('statistiques : des comptes, rien d’autre', () => {
    expect(journalStats(all)).toEqual([
      expect.objectContaining({ value: 'feeding', count: 1 }), expect.objectContaining({ value: 'sleep', count: 1 }),
      expect.objectContaining({ value: 'health', count: 1 }), expect.objectContaining({ value: 'memory', count: 1 }),
    ]);
  });
  it('CSV : BOM, « ; », guillemets échappés, avertissement', () => {
    const csv = journalCsv([e({ title: 'Repas "maison"', detail: 'purée; carottes' })], 'Lou');
    expect(csv.startsWith('﻿# Journal de Lou')).toBe(true);
    expect(csv).toMatch(/à vérifier avant toute décision/);
    expect(csv).toMatch(/"Repas ""maison""";"purée; carottes"/);
  });
});
