/**
 * 172 Mode embrouille et 179 Moments à deux — logique pure, textes neutres (5 langues) et règles de la démonstration
 * (mêmes règles que 20261127000100_couple_embrouille_reconnexion.sql, vérifiées en SQL par 98zf).
 */
import { setLocale, t as tr, type TKey } from '@/i18n';
import { isNeutralText } from '@/lib/domain/missions';
import {
  CALM_TEMPLATES, calmTitle, draftDueAt, repliesFor, splitRequests, stateLabel, validateDraft, type CalmRequestRow,
} from '@/features/calm/domain';
import { MOMENT_IDEAS, momentActions, nextMomentStatus, splitMoments, suggestedIdeas, type Moment } from '@/features/moments/domain';
import { createAbsents } from '@/lib/backend/demoAbsents';

const LANGS = ['fr', 'en', 'de', 'es', 'it'] as const;
afterAll(() => setLocale('fr'));

describe('mode embrouille : modèles et réponses en un geste', () => {
  beforeAll(() => setLocale('fr'));
  it('six modèles pratiques, aucun texte libre', () => {
    expect(CALM_TEMPLATES.map((t) => t.key)).toEqual(['pickup', 'groceries', 'appointment', 'medicine', 'paper', 'night_relay']);
  });
  it('trois réponses seulement, selon l’état', () => {
    expect(repliesFor('pending')).toEqual(['accept', 'decline', 'complete']);
    expect(repliesFor('accepted')).toEqual(['complete', 'decline']);
    expect(repliesFor('done')).toEqual([]);
    expect(repliesFor('declined')).toEqual([]);
  });
  it('validation : modèle, enfant exigé, heure, passé refusé', () => {
    const now = new Date(2026, 10, 27, 12, 0);
    expect(validateDraft({ template: null, date: '2026-11-27', time: '16:30', childId: null }, now)).toBe('calm.err.template');
    expect(validateDraft({ template: 'pickup', date: '2026-11-27', time: '16:30', childId: null }, now)).toBe('calm.err.child');
    expect(validateDraft({ template: 'pickup', date: '2026-11-27', time: '25:00', childId: 'k' }, now)).toBe('calm.err.time');
    expect(validateDraft({ template: 'pickup', date: '2026-11-27', time: '09:00', childId: 'k' }, now)).toBe('calm.err.past');
    expect(validateDraft({ template: 'pickup', date: '2026-11-27', time: '16:30', childId: 'k' }, now)).toBeNull();
    // sans heure : la journée entière reste possible
    expect(validateDraft({ template: 'groceries', date: '2026-11-27', time: '', childId: null }, now)).toBeNull();
  });
  it('titre : une ligne, ≤ 120 caractères, neutre, dans chaque langue', () => {
    const at = draftDueAt('2026-11-28', '16:30')!;
    for (const l of LANGS) {
      setLocale(l);
      for (const t of CALM_TEMPLATES) {
        const s = calmTitle(t.key, { childName: 'Lina', dueAt: at, withTime: t.time });
        expect(s.length).toBeLessThanOrEqual(120);
        expect(s).not.toMatch(/[\r\n]/);
        expect(isNeutralText(s)).toBe(true);
      }
      for (const k of ['calm.intro', 'calm.private', 'calm.footer', 'calm.reply.accept', 'calm.reply.decline', 'calm.reply.complete', 'calm.coupleHidden'] as TKey[]) {
        expect(isNeutralText(tr(k))).toBe(true);
      }
    }
    setLocale('fr');
    expect(calmTitle('pickup', { childName: 'Lina', dueAt: at })).toMatch(/^Récupérer Lina — samedi 28 novembre/);
  });
  it('rangement : reçues / envoyées ouvertes, historique ; aucun compteur exposé', () => {
    const row = (id: string, to: string, from: string, due: string): CalmRequestRow => ({ id, household_id: 'h', task_id: `t${id}`, template_key: 'groceries', child_id: null, from_user: from, to_user: to, due_at: due, created_at: due });
    const s = splitRequests([row('1', 'me', 'sam', '2026-11-28T10:00:00Z'), row('2', 'sam', 'me', '2026-11-28T09:00:00Z'), row('3', 'me', 'sam', '2026-11-20T09:00:00Z')],
      { t1: 'pending', t2: 'accepted', t3: 'done' }, 'me');
    expect(s.received.map((x) => x.id)).toEqual(['1']);
    expect(s.sent.map((x) => x.id)).toEqual(['2']);
    expect(s.history.map((x) => x.id)).toEqual(['3']);
    expect(Object.keys(s).sort()).toEqual(['history', 'received', 'sent']);
    expect(stateLabel('declined')).toBe('Pas possible');
  });
});

describe('moments à deux', () => {
  const m = (o: Partial<Moment>): Moment => ({ id: 'm', household_id: 'h', idea_key: 'coffee', from_user: 'me', to_user: 'sam', status: 'proposed', planned_at: null, duration_minutes: null,
    responded_at: null, done_at: null, created_at: '2026-11-20T10:00:00Z', updated_at: '2026-11-20T10:00:00Z', ...o });
  it('bibliothèque : 14 idées, textes dans les 5 langues, sans connotation sexuelle ni culpabilisation', () => {
    expect(MOMENT_IDEAS.length).toBe(14);
    const forbidden = /(sex|intim|câlin|caresse|lit\b|bed\b|bett\b|letto|cama\b|devez|devriez|must|should|müsst|dovete|debéis|culp|faute|guilt|schuld|colpa)/i;
    for (const l of LANGS) {
      setLocale(l);
      for (const i of MOMENT_IDEAS) {
        const title = tr(`mom.idea.${i.key}.title` as TKey);
        const sub = tr(`mom.idea.${i.key}.sub` as TKey);
        expect(title).not.toMatch(/^mom\./);
        expect(`${title} ${sub}`).not.toMatch(forbidden);
      }
      expect(isNeutralText(tr('mom.intro'))).toBe(true);
    }
    setLocale('fr');
  });
  it('qui fait quoi (miroir de couple_moment_respond)', () => {
    expect(momentActions(m({}), 'sam')).toEqual(['accept', 'decline', 'plan']);
    expect(momentActions(m({}), 'me')).toEqual(['cancel', 'delete']);
    expect(momentActions(m({ status: 'accepted' }), 'sam')).toEqual(['plan', 'done']);
    expect(momentActions(m({ status: 'accepted' }), 'me')).toEqual(['plan', 'done', 'cancel', 'delete']);
    expect(nextMomentStatus(m({}), 'accept', 'me')).toBeNull();
    expect(nextMomentStatus(m({}), 'decline', 'sam')).toBe('declined');
    expect(nextMomentStatus(m({ status: 'declined' }), 'decline', 'sam')).toBe('declined'); // rejeu : inchangé
    expect(nextMomentStatus(m({ status: 'accepted' }), 'done', 'sam')).toBe('done');
  });
  it('rangement et idées pas encore vécues d’abord', () => {
    const list = [m({ id: '1' }), m({ id: '2', from_user: 'sam', to_user: 'me' }), m({ id: '3', status: 'accepted', planned_at: '2026-11-29T18:00:00Z', idea_key: 'walk_10' }),
      m({ id: '4', status: 'done', done_at: '2026-11-10T10:00:00Z', idea_key: 'music' })];
    const s = splitMoments(list, 'me');
    expect(s.toAnswer.map((x) => x.id)).toEqual(['2']);
    expect(s.waiting.map((x) => x.id)).toEqual(['1']);
    expect(s.upcoming.map((x) => x.id)).toEqual(['3']);
    expect(s.past.map((x) => x.id)).toEqual(['4']);
    const ideas = suggestedIdeas(list).map((i) => i.key);
    expect(ideas.indexOf('walk_10')).toBeGreaterThan(ideas.indexOf('coffee'));
    expect(ideas.slice(-2).sort()).toEqual(['music', 'walk_10']);
  });
});

describe('démonstration : mêmes règles que le serveur', () => {
  function world() {
    const tables: Record<string, Record<string, unknown>[]> = {
      household_members: [{ household_id: 'h', user_id: 'me', role: 'owner' }, { household_id: 'h', user_id: 'sam', role: 'coparent' }, { household_id: 'h', user_id: 'nn', role: 'caregiver' }],
      family_tasks: [], calm_requests: [], couple_moments: [], notifications: [], checklists: [], checklist_items: [], children: [],
    };
    let me = 'me';
    const T = (n: string) => (tables[n] ??= []);
    let n = 0;
    const ab = createAbsents({ T, me: () => me, nowIso: () => new Date().toISOString(), uuid: () => `id${++n}`,
      missionRpc: (_name, a) => { const t = { id: `task${++n}`, household_id: a.p_household, client_id: a.p_client_id, notes: a.p_notes, mission_state: 'pending', title: a.p_title }; T('family_tasks').push(t); return t; } });
    return { T, ab, as: (u: string) => { me = u; } };
  }
  it('demande pratique : modèle vérifié, jamais à la nounou, rejeu sans doublon, visible des deux adultes seulement', () => {
    const w = world();
    expect(() => w.ab.rpcs.calm_request_send({ p_household: 'h', p_template: 'texte_libre', p_assignee: 'sam', p_title: 'x' })).toThrow();
    expect(() => w.ab.rpcs.calm_request_send({ p_household: 'h', p_template: 'groceries', p_assignee: 'nn', p_title: 'x' })).toThrow();
    expect(() => w.ab.rpcs.calm_request_send({ p_household: 'h', p_template: 'groceries', p_assignee: 'sam', p_title: 'a\nb' })).toThrow();
    w.ab.rpcs.calm_request_send({ p_household: 'h', p_template: 'groceries', p_assignee: 'sam', p_title: 'Faire les courses', p_client_id: 'c1' });
    w.ab.rpcs.calm_request_send({ p_household: 'h', p_template: 'groceries', p_assignee: 'sam', p_title: 'Faire les courses', p_client_id: 'c1' });
    expect(w.T('calm_requests')).toHaveLength(1);
    expect(w.T('family_tasks')[0].notes).toBeNull();
    expect(() => w.ab.beforeInsert('calm_requests', {})).toThrow();
    w.as('nn');
    expect(w.ab.filter('calm_requests', w.T('calm_requests'))).toHaveLength(0);
    w.as('sam');
    expect(w.ab.filter('calm_requests', w.T('calm_requests'))).toHaveLength(1);
  });
  it('moment : proposé, accepté par l’autre seulement, notification neutre, effacé par l’autrice seulement', () => {
    const w = world();
    const r: Record<string, unknown> = { id: 'mo', household_id: 'h', idea_key: 'coffee', to_user: 'sam', status: 'done' };
    w.ab.beforeInsert('couple_moments', r);
    w.T('couple_moments').push(r);
    expect(r.status).toBe('proposed');
    expect(r.from_user).toBe('me');
    expect(() => w.ab.rpcs.couple_moment_respond({ p_id: 'mo', p_action: 'accept' })).toThrow();
    w.as('sam');
    expect(w.ab.rpcs.couple_moment_respond({ p_id: 'mo', p_action: 'accept' })).toMatchObject({ status: 'ok' });
    expect(w.ab.rpcs.couple_moment_respond({ p_id: 'mo', p_action: 'accept' })).toMatchObject({ unchanged: true });
    expect(w.ab.filterRemove('couple_moments', w.T('couple_moments'))).toHaveLength(0);
    expect(w.T('notifications').map((x) => x.user_id)).toEqual(['sam', 'me']);
    expect(() => w.ab.beforeInsert('couple_moments', { household_id: 'h', idea_key: 'coffee', to_user: 'nn' })).toThrow();
  });
  it('liste privée de préparation : invisible des autres tant qu’elle n’est pas partagée', () => {
    const w = world();
    const l: Record<string, unknown> = { id: 'l', household_id: 'h', kind: 'coparent', private_to_creator: true };
    w.ab.beforeInsert('checklists', l);
    w.T('checklists').push(l);
    w.T('checklist_items').push({ id: 'i', checklist_id: 'l' });
    w.as('sam');
    expect(w.ab.filter('checklists', w.T('checklists'))).toHaveLength(0);
    expect(w.ab.filter('checklist_items', w.T('checklist_items'))).toHaveLength(0);
    expect(() => w.ab.beforeUpdate('checklists', l, { private_to_creator: false })).toThrow();
    l.private_to_creator = false;
    expect(w.ab.filter('checklist_items', w.T('checklist_items'))).toHaveLength(1);
    w.as('nn');
    expect(w.ab.filter('checklists', w.T('checklists'))).toHaveLength(0);
  });
});
