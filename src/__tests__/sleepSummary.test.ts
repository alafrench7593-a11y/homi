/**
 * Correction de sieste (brief « De la saisie au relais parent ») : une seule donnée source pour la mini-app, la
 * catégorie, l'accueil et le brouillon de relais. 13 h 10 – 14 h 35 (1 h 25) → fin corrigée à 14 h 20 (1 h 10) :
 * le jour et la période baissent chacun de 15 min ; les autres siestes restent comptées ; Noé n'est jamais concerné.
 */
import { lastNap, periodTotal, proposedEnd, sessionMinutes, sleepByDay, type SleepLike } from '@/lib/domain/sleepSummary';
import { relayItems, relaySince } from '@/lib/domain/relayDraft';

const iso = (day: number, h: number, m: number) => new Date(2026, 10, day, h, m).toISOString();
const NOW = new Date(2026, 10, 23, 15, 20);
const lina = (id: string, day: number, h: number, m: number, h2: number, m2: number, note: string | null = null): SleepLike =>
  ({ id, child_id: 'lina', started_at: iso(day, h, m), ended_at: iso(day, h2, m2), note, kind: 'nap' });
const base: SleepLike[] = [
  lina('matin', 23, 9, 30, 10, 10),
  lina('aprem', 23, 13, 10, 14, 35, 'endormie en poussette'),
  lina('hier', 22, 13, 0, 14, 0),
  { id: 'noe', child_id: 'noe', started_at: iso(23, 13, 0), ended_at: iso(23, 15, 0), note: null, kind: 'nap' },
];
const corrected = base.map((s) => (s.id === 'aprem' ? { ...s, ended_at: proposedEnd(s, '14:20')!.toISOString() } : s));

describe('correction 14 h 35 → 14 h 20', () => {
  it('durée proposée 1 h 10, début ancré, note conservée', () => {
    const s = corrected.find((x) => x.id === 'aprem')!;
    expect(sessionMinutes(base.find((x) => x.id === 'aprem')!, NOW)).toBe(85);
    expect(sessionMinutes(s, NOW)).toBe(70);
    expect(s.started_at).toBe(iso(23, 13, 10));
    expect(s.note).toBe('endormie en poussette');
  });
  it('catégorie : le jour et la période baissent chacun de 15 min, les autres siestes restent comptées', () => {
    const before = sleepByDay(base, 'lina', NOW, 7); const after = sleepByDay(corrected, 'lina', NOW, 7);
    expect(before[6].minutes).toBe(40 + 85);
    expect(after[6].minutes).toBe(40 + 70);
    expect(periodTotal(before).minutes! - periodTotal(after).minutes!).toBe(15);
    expect(after[5].minutes).toBe(60);
  });
  it('accueil : la dernière sieste est la même session, corrigée', () => {
    const s = lastNap(corrected, 'lina')!;
    expect([s.id, sessionMinutes(s, NOW)]).toEqual(['aprem', 70]);
  });
  it('relais : le brouillon lit la valeur corrigée, et jamais les données de Noé', () => {
    const items = relayItems({ childId: 'lina', since: relaySince(null, NOW), now: NOW, sleeps: corrected, bottles: [] });
    expect(items.map((i) => i.id)).toEqual(['matin', 'aprem']);
    expect(items.find((i) => i.id === 'aprem')).toMatchObject({ minutes: 70, note: 'endormie en poussette' });
  });
  it('relais déjà transmis : seuls les événements après la transmission', () => {
    const since = relaySince(iso(23, 11, 0), NOW);
    expect(relayItems({ childId: 'lina', since, now: NOW, sleeps: corrected, bottles: [{ id: 'b', child_id: 'lina', at: iso(23, 12, 45), consumed_ml: 150 }] }).map((i) => i.id)).toEqual(['b', 'aprem']);
  });
});

describe('jours sans saisie, minuit, heures invalides', () => {
  it('un jour sans saisie reste « inconnu » (null), jamais 0 ; la période ne compte que les jours renseignés', () => {
    const d = sleepByDay(base, 'lina', NOW, 7);
    expect(d.slice(0, 5).every((x) => x.minutes === null)).toBe(true);
    expect(periodTotal(d)).toEqual({ minutes: 60 + 125, knownDays: 2 });
    expect(periodTotal(sleepByDay([], 'lina', NOW, 7))).toEqual({ minutes: null, knownDays: 0 });
  });
  it('session qui traverse minuit : répartie sur les deux jours', () => {
    const night: SleepLike = { id: 'n', child_id: 'lina', started_at: iso(22, 23, 30), ended_at: iso(23, 0, 45), note: null, kind: 'night' };
    const d = sleepByDay([night], 'lina', NOW, 2, 'all');
    expect(d.map((x) => x.minutes)).toEqual([30, 45]);
  });
  it('fin avant le début → le lendemain ; saisie invalide refusée', () => {
    const s = lina('x', 23, 23, 30, 23, 50);
    expect(proposedEnd(s, '00:15')!.getDate()).toBe(24);
    expect(proposedEnd(s, '25:00')).toBeNull();
    expect(proposedEnd(s, '14h20')).not.toBeNull();
  });
});
