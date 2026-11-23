/**
 * Aura 2.0 — actions qui ENREGISTRENT (sieste, biberon) et lectures sans IA (sommeil du jour) : reconnaissance FR/EN
 * (fautes, familier), calculs, conflits, doublons, droits. L'écriture elle-même passe par useAddLog (même chemin que
 * les écrans) et n'a lieu qu'après l'appui du parent : ici on vérifie la préparation.
 */
import { matchIntent, resolveIntent, sleepMinutesToday, sleepWindow, span, type IntentContext, type MemberLike } from '@/lib/aura/intents';

const iso = (d: number, h: number, m: number) => new Date(2026, 10, d, h, m).toISOString();
const NOW = new Date(2026, 10, 23, 16, 0);
const owner: MemberLike = { role: 'owner', can_view: [], can_edit: [] };
const t = (k: string, v?: Record<string, string | number>) => (v ? `${k} ${JSON.stringify(v)}` : k);
const ctx = (over: Partial<IntentContext> = {}): IntentContext => ({
  children: [{ id: 'lina', first_name: 'Lina' }], activeChildId: 'lina', member: owner, catalog: [], pregnancyCatalog: [],
  sleeps: [{ id: 'matin', child_id: 'lina', started_at: iso(23, 9, 30), ended_at: iso(23, 10, 10), kind: 'nap' },
    { id: 'nuit', child_id: 'lina', started_at: iso(22, 20, 0), ended_at: iso(23, 7, 0), kind: 'night' }],
  bottles: [], now: NOW, t, clock: (d) => `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`, ...over,
});

describe('reconnaissance', () => {
  it.each([
    ['Mon bébé s’est endormi à 14 h 20 et réveillé à 15 h 45', { kind: 'log_sleep', start: '14:20', end: '15:45' }],
    ['il a dormi de 14h à 15h30, ajoute ça', { kind: 'log_sleep', start: '14:00', end: '15:30' }],
    ['sieste 13h10 14h05', { kind: 'log_sleep', start: '13:10', end: '14:05' }],
    ['she fell asleep at 1:20 pm and woke up at 2:45 pm', { kind: 'log_sleep', start: '13:20', end: '14:45' }],
    ['Il vient de boire 150 ml', { kind: 'log_bottle', ml: 150 }],
    ['bib de 120ml fini', { kind: 'log_bottle', ml: 120 }],
    ['he drank 90 ml', { kind: 'log_bottle', ml: 90 }],
    ['Combien mon fils a dormi aujourd’hui ?', { kind: 'sleep_today' }],
    ['how much did she sleep today', { kind: 'sleep_today' }],
  ])('« %s »', (q, expected) => { expect(matchIntent(q)).toEqual(expected); });
  it('une correction reste une correction (priorité)', () => {
    expect(matchIntent('J’ai mis 14 h 35 mais elle s’est réveillée à 14 h 20')).toMatchObject({ kind: 'fix_sleep_end' });
  });
  it('un nombre sans biberon ni boisson ne crée rien', () => { expect(matchIntent('elle pèse 150 g de plus')?.kind).not.toBe('log_bottle'); });
  it('quantité absurde ignorée', () => { expect(matchIntent('il a bu 2000 ml')?.kind).not.toBe('log_bottle'); });
});

describe('calculs déterministes', () => {
  it('durée', () => { expect(span(85)).toBe('1 h 25'); expect(span(45)).toBe('45 min'); expect(span(120)).toBe('2 h'); });
  it('fenêtre : passage de minuit et jamais dans le futur', () => {
    const night = sleepWindow('20:30', '06:10', NOW)!;
    expect(night.start.getDate()).toBe(22); expect(night.end.getDate()).toBe(23);
    const later = sleepWindow('17:00', '18:00', NOW)!; // pas encore arrivé aujourd'hui → hier
    expect(later.start.getDate()).toBe(22);
    expect(sleepWindow('14:00', '14:02', NOW)).toBeNull();
  });
  it('sommeil du jour : la nuit d’avant est coupée à minuit', () => {
    expect(sleepMinutesToday(ctx().sleeps, NOW)).toBe(7 * 60 + 40);
  });
});

describe('préparation (rien n’est écrit ici)', () => {
  it('sieste : résumé, ligne prête, durée exacte', () => {
    const r = resolveIntent({ kind: 'log_sleep', start: '14:20', end: '15:45' }, ctx());
    expect(r.status).toBe('confirm');
    if (r.status !== 'confirm') return;
    expect(r.write.kind).toBe('sleep');
    expect(r.write.row).toMatchObject({ child_id: 'lina', kind: 'nap', started_at: iso(23, 14, 20), ended_at: iso(23, 15, 45) });
    expect(r.doneLabel).toContain('1 h 25');
    expect(r.viewHref).toBe('/sleep/lina');
  });
  it('chevauchement : refus, renvoi vers Sommeil', () => {
    const r = resolveIntent({ kind: 'log_sleep', start: '09:00', end: '10:00' }, ctx());
    expect(r).toMatchObject({ status: 'unavailable', alternative: { href: '/sleep/lina' } });
  });
  it('biberon : doublon récent refusé, sinon prêt', () => {
    expect(resolveIntent({ kind: 'log_bottle', ml: 150 }, ctx({ bottles: [{ at: iso(23, 15, 55), consumed_ml: 150 }] })).status).toBe('unavailable');
    const r = resolveIntent({ kind: 'log_bottle', ml: 150 }, ctx());
    expect(r).toMatchObject({ status: 'confirm', write: { kind: 'bottle', row: { child_id: 'lina', consumed_ml: 150 } } });
  });
  it('droits : lecture seule → aucune écriture proposée ; enfant hors périmètre → rien', () => {
    const viewer: MemberLike = { role: 'coparent', can_view: ['daily'], can_edit: [], child_scope: ['lina'] };
    expect(resolveIntent({ kind: 'log_bottle', ml: 120 }, ctx({ member: viewer })).status).toBe('unavailable');
    expect(resolveIntent({ kind: 'sleep_today' }, ctx({ member: viewer })).status).toBe('answer');
    const other: MemberLike = { role: 'coparent', can_view: ['daily'], can_edit: ['daily'], child_scope: ['noe'] };
    expect(resolveIntent({ kind: 'log_sleep', start: '14:20', end: '15:45' }, ctx({ member: other })).status).toBe('unavailable');
    expect(resolveIntent({ kind: 'sleep_today' }, ctx({ member: other })).status).toBe('unavailable');
  });
  it('plusieurs enfants sans profil actif : Aura demande lequel', () => {
    const r = resolveIntent({ kind: 'log_bottle', ml: 120 }, ctx({ activeChildId: null, children: [{ id: 'lina', first_name: 'Lina' }, { id: 'noe', first_name: 'Noé' }] }));
    expect(r.status).toBe('ask');
  });
  it('réponse fondée sur les données, jamais inventée', () => {
    expect(resolveIntent({ kind: 'sleep_today' }, ctx({ sleeps: [] }))).toMatchObject({ status: 'answer', text: expect.stringContaining('noSleepToday') });
  });
});
