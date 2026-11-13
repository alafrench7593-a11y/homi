/**
 * Historique et journal du sommeil (src/lib/domain/sleepJournal.ts) : chronomètre lu dans les horodatages,
 * découpage nuit / sieste, historique des nuits (réveils et repas sur la même chronologie), barres 7/14/30 jours,
 * journal daté, résumé pour le pédiatre (aucune note, aucune norme, aucune conclusion).
 */
import {
  napHistory, nightHistory, notesInRange, pediatricSummary, rangeSummary, runningSleep, sleepBars, splitSleeps, stopwatch,
  summaryHtml, validateNote, type FeedEvent, type SleepNote,
} from '@/lib/domain/sleepJournal';
import type { SleepRecord } from '@/lib/domain/sleepPlanner';

const D = (d: number, h: number, m = 0) => new Date(2026, 10, d, h, m);
const iso = (d: number, h: number, m = 0) => D(d, h, m).toISOString();
const NINA = 'nina';
const NOE = 'noe';
const nap = (d: number, h1: number, m1: number, h2: number, m2: number, child = NINA): SleepRecord => ({ id: `nap-${child}-${d}-${h1}`, child_id: child, kind: 'nap', started_at: iso(d, h1, m1), ended_at: iso(d, h2, m2) });
const night = (d: number, h1: number, m1: number, h2: number | null, m2 = 0, child = NINA, extra: Partial<SleepRecord> = {}): SleepRecord => ({
  id: `night-${child}-${d}`, child_id: child, kind: 'night', started_at: iso(d, h1, m1), ended_at: h2 === null ? null : iso(d + 1, h2, m2), ...extra,
});

describe('chronomètre', () => {
  it('se recalcule à partir de l’heure enregistrée (survit à la fermeture de l’application)', () => {
    const sleeps = [nap(13, 9, 0, 10, 0), { id: 'open', child_id: NINA, kind: 'nap' as const, started_at: iso(13, 14, 5), ended_at: null }];
    // « Réouverture » de l’application 47 minutes plus tard : rien n’est gardé en mémoire, le temps reste juste
    const r = runningSleep(sleeps, NINA, D(13, 14, 52));
    expect(r).toMatchObject({ id: 'open', kind: 'nap', elapsedMinutes: 47, sleptMinutes: 47, wakingSince: null, extraOpen: 0 });
    expect(runningSleep(sleeps, NINA, D(13, 15, 5))!.elapsedMinutes).toBe(60);
  });
  it('un seul enregistrement par session : un sommeil ouvert en trop est signalé, jamais additionné', () => {
    const a = { id: 'a', child_id: NINA, kind: 'night' as const, started_at: iso(12, 20, 0), ended_at: null };
    const b = { id: 'b', child_id: NINA, kind: 'nap' as const, started_at: iso(13, 9, 0), ended_at: null };
    const r = runningSleep([a, b], NINA, D(13, 9, 30))!;
    expect(r.id).toBe('b');
    expect(r.extraOpen).toBe(1);
    expect(r.elapsedMinutes).toBe(30);
  });
  it('réveil nocturne en cours : déduit du sommeil, heure du réveil exposée', () => {
    const n = night(12, 20, 0, null, 0, NINA, { wake_events: [{ at: iso(13, 2, 0), back_at: iso(13, 2, 20), minutes: 20 }, { at: iso(13, 4, 0), open: true }] });
    const r = runningSleep([n], NINA, D(13, 4, 30))!;
    expect(r.kind).toBe('night');
    expect(r.wakingSince).toBe(D(13, 4, 0).getTime());
    expect(r.elapsedMinutes).toBe(510);
    expect(r.sleptMinutes).toBe(510 - 20 - 30);
  });
  it('jumeaux : le sommeil en cours de Noé n’apparaît jamais chez Nina', () => {
    const sleeps = [{ id: 'x', child_id: NOE, kind: 'nap' as const, started_at: iso(13, 14, 0), ended_at: null }];
    expect(runningSleep(sleeps, NINA, D(13, 14, 30))).toBeNull();
    expect(runningSleep(sleeps, NOE, D(13, 14, 30))).not.toBeNull();
  });
  it('affichage h:mm:ss', () => {
    const t0 = D(13, 14, 0).getTime();
    expect(stopwatch(t0, t0 + 65_000)).toBe('1:05');
    expect(stopwatch(t0, t0 + 3_725_000)).toBe('1:02:05');
    expect(stopwatch(t0, t0 - 5000)).toBe('0:00');
  });
});

describe('découpage nuit / sieste', () => {
  it('sépare les siestes des nuits (type noté, sinon heure de début), du plus récent au plus ancien', () => {
    const untypedEvening: SleepRecord = { child_id: NINA, started_at: iso(11, 20, 0), ended_at: iso(12, 6, 30) };
    const untypedNoon: SleepRecord = { child_id: NINA, started_at: iso(12, 13, 0), ended_at: iso(12, 14, 0) };
    const { naps, nights } = splitSleeps([nap(12, 9, 30, 10, 15), untypedEvening, untypedNoon, night(12, 19, 45, 7), nap(12, 9, 0, 9, 20, NOE)], NINA);
    expect(naps.map((s) => s.started_at)).toEqual([iso(12, 13, 0), iso(12, 9, 30)]);
    expect(nights.map((s) => s.started_at)).toEqual([iso(12, 19, 45), iso(11, 20, 0)]);
  });
  it('historique des siestes limité à la période', () => {
    const sleeps = [nap(13, 9, 0, 10, 0), nap(1, 9, 0, 10, 0)];
    expect(napHistory(sleeps, NINA, D(13, 18, 0), 7)).toHaveLength(1);
    expect(napHistory(sleeps, NINA, D(13, 18, 0), 30)).toHaveLength(2);
  });
});

describe('historique des nuits', () => {
  const feeds: FeedEvent[] = [
    { at: iso(13, 2, 10), kind: 'bottle', child_id: NINA },
    { at: iso(13, 5, 0), kind: 'breastfeed', child_id: NINA },
    { at: iso(12, 18, 30), kind: 'meal', child_id: NINA }, // avant le coucher : pas dans la nuit
    { at: iso(13, 3, 0), kind: 'bottle', child_id: NOE }, // autre enfant : jamais affiché
  ];
  it('réveils datés et repas notés sur la même chronologie, dans l’ordre', () => {
    const n = night(12, 20, 0, 7, 0, NINA, { wakeups: 3, wake_events: [{ at: iso(13, 2, 0), back_at: iso(13, 2, 25), minutes: 25 }, { at: iso(13, 4, 50), minutes: 15 }] });
    const [h] = nightHistory([n], NINA, feeds, D(13, 9, 0), 7);
    expect(h.wakings).toEqual([
      { at: D(13, 2, 0).getTime(), back: D(13, 2, 25).getTime(), minutes: 25 },
      { at: D(13, 4, 50).getTime(), back: D(13, 5, 5).getTime(), minutes: 15 },
    ]);
    expect(h.untimedWakings).toBe(1);
    expect(h.feeds.map((f) => f.kind)).toEqual(['bottle', 'breastfeed']);
    expect(h.events.map((e) => e.type)).toEqual(['asleep', 'waking', 'feed', 'back', 'waking', 'feed', 'back', 'wake']);
    expect(h.inBedMinutes).toBe(11 * 60);
    // même calcul que le reste de l’application (sleptMinutes) : seuls les réveils avec « rendormi » noté sont déduits
    expect(h.sleptMinutes).toBe(11 * 60 - 25);
  });
  it('nuit en cours : pas d’heure de fin, repas jusqu’à maintenant', () => {
    const [h] = nightHistory([night(12, 20, 0, null)], NINA, feeds, D(13, 3, 0), 7);
    expect(h.ongoing).toBe(true);
    expect(h.end).toBeNull();
    expect(h.feeds).toHaveLength(1);
    expect(h.events[h.events.length - 1].type).toBe('feed');
  });
  it('la plus récente d’abord, uniquement la période choisie', () => {
    const sleeps = [night(12, 20, 0, 7), night(10, 20, 0, 7), night(1, 20, 0, 7)];
    expect(nightHistory(sleeps, NINA, [], D(13, 9, 0), 7).map((n) => new Date(n.start).getDate())).toEqual([12, 10]);
    expect(nightHistory(sleeps, NINA, [], D(13, 9, 0), 30)).toHaveLength(3);
  });
});

describe('barres 7 / 14 / 30 jours', () => {
  const sleeps = [
    night(12, 20, 0, 7, 0), nap(12, 9, 0, 10, 0), nap(12, 14, 0, 15, 30),
    night(10, 19, 30, 6, 30, NINA, { wakeups: 2 }),
    night(12, 21, 0, 6, 0, NOE),
  ];
  const now = D(13, 18, 0);
  it('une barre par jour (du plus ancien à aujourd’hui), pour 7, 14 et 30 jours', () => {
    for (const days of [7, 14, 30] as const) {
      const bars = sleepBars(sleeps, NINA, now, days);
      expect(bars).toHaveLength(days);
      expect(bars[days - 1].date).toBe('2026-11-13');
    }
  });
  it('nuit rattachée au soir où elle commence, siestes du jour, rien de l’autre enfant', () => {
    const bars = sleepBars(sleeps, NINA, now, 7);
    const d12 = bars.find((b) => b.date === '2026-11-12')!;
    expect(d12).toMatchObject({ nightMinutes: 11 * 60, napMinutes: 150, totalMinutes: 11 * 60 + 150, naps: 2, hasData: true });
    expect(bars.find((b) => b.date === '2026-11-10')).toMatchObject({ nightMinutes: 11 * 60, wakings: 2 });
    expect(bars.find((b) => b.date === '2026-11-11')).toMatchObject({ totalMinutes: 0, hasData: false });
  });
  it('moyennes sur les seuls jours notés (un jour vide n’est pas un zéro), aucune note', () => {
    const s = rangeSummary(sleepBars(sleeps, NINA, now, 7));
    expect(s.daysWithData).toBe(2);
    expect(s.avgNight).toBe(11 * 60);
    expect(s.avgNap).toBe(75);
    expect(s.avgWakings).toBe(1);
    expect(Object.keys(s)).not.toContain('score');
    expect(rangeSummary(sleepBars([], NINA, now, 30))).toEqual({ daysWithData: 0, avgTotal: null, avgNight: null, avgNap: null, avgWakings: null });
  });
});

describe('journal', () => {
  const now = D(13, 18, 0);
  it('mêmes règles que la table : jamais vide, 1 000 caractères, pas dans le futur, étiquettes connues', () => {
    expect(validateNote({ kind: 'difficulty', tags: [], note: '  ', notedAt: now }, now)).toBe('empty');
    expect(validateNote({ kind: 'difficulty', tags: ['night_wakings'], note: '', notedAt: now }, now)).toBeNull();
    expect(validateNote({ kind: 'routine_change', tags: [], note: 'x'.repeat(1001), notedAt: now }, now)).toBe('tooLong');
    expect(validateNote({ kind: 'routine_change', tags: [], note: 'crèche', notedAt: D(14, 9, 0) }, now)).toBe('future');
    expect(validateNote({ kind: 'difficulty', tags: ['laisser_pleurer' as never], note: '', notedAt: now }, now)).toBe('badTag');
  });
  it('notes de cet enfant seulement, dans la période, les plus récentes d’abord', () => {
    const n = (id: string, child: string, d: number): SleepNote => ({ id, child_id: child, household_id: 'h', kind: 'difficulty', noted_at: iso(d, 20, 0), tags: ['short_naps'], note: null });
    const list = notesInRange([n('a', NINA, 10), n('b', NOE, 12), n('c', NINA, 12), n('d', NINA, 1)], NINA, now, 7);
    expect(list.map((x) => x.id)).toEqual(['c', 'a']);
  });
});

describe('résumé pour le pédiatre', () => {
  const now = D(13, 18, 0);
  const sleeps = [night(12, 20, 0, 7, 0, NINA, { wakeups: 1, wake_events: [{ at: iso(13, 2, 0), back_at: iso(13, 2, 20), minutes: 20 }] }), nap(12, 14, 0, 15, 0)];
  const notes: SleepNote[] = [
    { id: '1', child_id: NINA, household_id: 'h', kind: 'difficulty', noted_at: iso(12, 21, 0), tags: ['falling_asleep'], note: 'Long à s’endormir' },
    { id: '2', child_id: NINA, household_id: 'h', kind: 'routine_change', noted_at: iso(11, 18, 0), tags: [], note: 'Reprise de la crèche' },
    { id: '3', child_id: NOE, household_id: 'h', kind: 'difficulty', noted_at: iso(12, 21, 0), tags: [], note: 'Note de Noé' },
  ];
  it('ne contient que ce qui a été noté, pour cet enfant, sans score ni norme', () => {
    const text = pediatricSummary({ name: 'Nina', ageLabel: '7 mois', childId: NINA, sleeps, feeds: [{ at: iso(13, 2, 5), kind: 'bottle', child_id: NINA }], notes, now, days: 14, question: 'Est-ce un souci ?' });
    expect(text).toContain('Sommeil de Nina (7 mois)');
    expect(text).toContain('Jours notés : 1 sur 14');
    expect(text).toContain('20 h → 7 h, dormi 10 h 40');
    expect(text).toContain('réveil à 2 h (20 min)');
    expect(text).toContain('Biberon à 2 h 05');
    expect(text).toContain('Endormissement difficile — Long à s’endormir');
    expect(text).toContain('Reprise de la crèche');
    expect(text).toContain('Question de la famille : Est-ce un souci ?');
    expect(text).not.toContain('Note de Noé');
    expect(text).not.toMatch(/score|normal|recommand|toute la nuit/i);
  });
  it('période sans saisie : le dit simplement', () => {
    expect(pediatricSummary({ name: 'Nina', ageLabel: '7 mois', childId: NINA, sleeps: [], feeds: [], notes: [], now, days: 7 })).toContain('Aucun sommeil noté sur cette période.');
  });
  it('version imprimable : HTML autonome, texte échappé', () => {
    const html = summaryHtml('Sommeil de <Nina>\nLigne & co', 'fr');
    expect(html.startsWith('<!doctype html>')).toBe(true);
    expect(html).toContain('<title>Sommeil de &lt;Nina&gt;</title>');
    expect(html).toContain('<p>Ligne &amp; co</p>');
    expect(html).not.toMatch(/<script|https?:\/\//);
  });
});
