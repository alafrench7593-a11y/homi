/**
 * Compréhension d'Aura sans IA (25/11/2026, mission Aura 2.0) : phrases simples, complexes, plusieurs actions,
 * fautes, langage familier, questions (qui ne doivent RIEN écrire), négations, futur, doublons, droits.
 * Chaque ligne = un scénario ; aucune donnée n'est écrite avant « Enregistrer ».
 */
import { durationIn, matchIntent, resolveIntent, type AuraIntent } from '@/lib/aura/intents';

const kids = [{ id: 'c1', first_name: 'Lina', household_id: 'h1' }, { id: 'c2', first_name: 'Noé', household_id: 'h1' }];
const NOW = new Date(2026, 10, 25, 17, 0);
const ctx = (o: Record<string, unknown> = {}) => ({
  now: NOW, children: kids, activeChildId: 'c1', catalog: [], member: { role: 'owner' }, sleeps: [], bottles: [],
  t: (k: string, p?: Record<string, unknown>) => `${k} ${JSON.stringify(p ?? {})}`,
  clock: (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`, ...o,
}) as never;
const kind = (q: string) => matchIntent(q)?.kind ?? null;

describe('durées dites', () => {
  it.each([
    ['dormi 45 minutes', 45], ['dormi 45 min', 45], ['il a dormi 1h30', 90], ['dormi 1 h 30', 90], ['allaité pendant 20 min', 20],
    ['dormi une heure', 60], ['une demi heure', 30], ['slept 40 minutes', 40], ['rien du tout', null],
  ])('%s → %s', (q, m) => expect(durationIn(q.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase())).toBe(m));
});

describe('une action par phrase', () => {
  it.each<[string, string | null]>([
    ['Bébé a bu 150 ml', 'log_bottle'],
    ['bib de 120ml', 'log_bottle'],
    ["j'ai changé sa couche", 'log_diaper'],
    ['couche pipi', 'log_diaper'],
    ['couche caca et pipi', 'log_diaper'],
    ['il a dormi de 13h à 14h30', 'log_sleep'],
    ['il a dormi 45 minutes', 'log_sleep_for'],
    ["j'ai allaité pendant 20 minutes à gauche", 'log_feed_for'],
    ['tétée de 15 min sein droit', 'log_feed_for'],
    ['commence une tétée à gauche', 'start_breastfeed'],
    ['combien a-t-il bu aujourd hui ?', 'bottles_today'],
    ['quand était la dernière couche ?', 'last_diaper'],
    ['combien de temps a-t-il dormi ?', 'sleep_today'],
    ['rappelle à mon conjoint de racheter du lait demain', 'assign_task'],
    ['ajoute un rendez-vous chez la pédiatre mardi à 10h', 'add_appointment'],
    ['prépare le relais de ce soir', 'prepare_relay'],
  ])('« %s » → %s', (q, k) => expect(kind(q)).toBe(k));
});

describe('les questions et explications n’écrivent rien', () => {
  it.each(['combien de couches aujourd hui ?', 'comment utiliser biberon ?', 'quand a-t-il dormi 45 minutes ?', 'à quoi sert le relais ?'])('« %s »', (q) => {
    expect(['log_diaper', 'log_sleep_for', 'log_feed_for', 'log_bottle', 'multi']).not.toContain(kind(q));
  });
});

describe('plusieurs actions dans une phrase', () => {
  it('« Bébé a bu 150 ml, dormi 45 minutes et je lui ai changé sa couche » → 3 actions dans 3 outils', () => {
    const it = matchIntent('Bébé a bu 150 ml, dormi 45 minutes et je lui ai changé sa couche') as Extract<AuraIntent, { kind: 'multi' }>;
    expect(it.kind).toBe('multi');
    expect(it.parts.map((p) => p.kind)).toEqual(['log_bottle', 'log_sleep_for', 'log_diaper']);
    const r = resolveIntent(it, ctx());
    expect(r.status).toBe('confirm');
    const batch = (r as unknown as { write: { batch: { kind: string; row: Record<string, unknown> }[] } }).write.batch;
    expect(batch.map((b) => b.kind)).toEqual(['bottle', 'sleep', 'diaper']);
    expect(batch[0].row.consumed_ml).toBe(150);
    expect(new Date(batch[1].row.started_at as string).getHours()).toBe(16); // 16:15 → 17:00
    expect(batch.every((b) => b.row.child_id === 'c1')).toBe(true);
  });
  it('fautes et familier : « bib 120ml puis couche caca »', () => {
    const it = matchIntent('bib 120ml puis couche caca') as Extract<AuraIntent, { kind: 'multi' }>;
    expect(it?.parts.map((p) => p.kind)).toEqual(['log_bottle', 'log_diaper']);
  });
  it('prénom cité : l’enfant nommé est utilisé pour TOUTES les actions', () => {
    const it = matchIntent('Noé a bu 90 ml et dormi 30 min') as Extract<AuraIntent, { kind: 'multi' }>;
    const r = resolveIntent({ ...it, childId: 'c2' }, ctx());
    const batch = (r as unknown as { write: { batch: { row: Record<string, unknown> }[] } }).write.batch;
    expect(batch.every((b) => b.row.child_id === 'c2')).toBe(true);
  });
  it('côté de tétée manquant : Aura DEMANDE (jamais deviné) en gardant toute la phrase', () => {
    const it = matchIntent('allaité 20 min et couche changée') as AuraIntent;
    const r = resolveIntent(it, ctx());
    expect(r.status).toBe('ask');
    const opt = (r as unknown as { options: { intent: AuraIntent }[] }).options[0].intent as Extract<AuraIntent, { kind: 'multi' }>;
    expect(opt.parts.length).toBe(2);
    const r2 = resolveIntent(opt, ctx());
    expect(r2.status).toBe('confirm');
  });
  it('une seule action reconnue → pas de carte multiple', () => {
    expect(kind('il a bu 150 ml et il est content')).toBe('log_bottle');
  });
  it('chevauchement de sommeil signalé, le reste reste enregistrable', () => {
    const sleeps = [{ id: 's', child_id: 'c1', started_at: new Date(2026, 10, 25, 16, 30).toISOString(), ended_at: new Date(2026, 10, 25, 16, 50).toISOString(), kind: 'nap' }];
    const r = resolveIntent(matchIntent('a bu 150 ml et dormi 45 minutes') as AuraIntent, ctx({ sleeps }));
    expect(r.status).toBe('confirm');
    const w = (r as unknown as { summary: string; write: { batch: unknown[] } });
    expect(w.write.batch.length).toBe(1);
    expect(w.summary).toContain('⚠');
  });
  it('sans droit de modifier : rien à enregistrer', () => {
    const r = resolveIntent(matchIntent('a bu 150 ml et couche changée') as AuraIntent, ctx({ member: { role: 'viewer' } }));
    expect(r.status).toBe('unavailable');
  });
});

describe('cas du retour iPhone', () => {
  it('« six biberons de 120 ml à partir de midi, toutes les deux heures » → 6 heures, 120 ml, rien dans le futur', () => {
    const it = matchIntent('Lina a pris six biberons de 120 ml à partir de midi, toutes les deux heures') as Extract<AuraIntent, { kind: 'log_bottle' }>;
    expect(it.kind).toBe('log_bottle');
    expect(it.ml).toBe(120);
    expect(it.times).toEqual(['12:00', '14:00', '16:00', '18:00', '20:00', '22:00']);
    const r = resolveIntent(it, ctx());
    const rows = (r as unknown as { write: { rows: unknown[] } }).write.rows;
    expect(rows.length).toBe(3); // 12h, 14h, 16h : 18h, 20h, 22h sont à venir à 17h
  });
});
