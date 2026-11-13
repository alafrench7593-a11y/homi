/**
 * Missions familiales (14/11/2026) : logique de statuts (miroir exact des transitions serveur), réponses rapides
 * selon la personne, modèles NEUTRES dans les 5 langues, textes et destinataires des notifications, catégorie
 * d'actions du push, et émulation de démonstration du scénario A (création → acceptation → courses → terminé).
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
const fs = require('fs') as { readFileSync(p: string, enc: string): string };
const path = require('path') as { join(...p: string[]): string };

import { DICTIONARIES } from '@/i18n/dictionaries';
import { setLocale } from '@/i18n';
import {
  canRemind, creatorActionsFor, defaultRecipient, EVENT_OF_ACTION, isNeutralText, MISSION_ACTIONS, MISSION_DOMAIN_OF, MISSION_STATES, MISSION_TEMPLATES,
  missionNotification, missionNotifyTarget, nextState, quickRepliesFor, receivedMissions, RESPONSIBILITIES, sentMissions, sortMissions, viewerOf,
  type Mission, type MissionEventType,
} from '@/lib/domain/missions';
import { DOMAINS } from '@/lib/domain/mentalLoad';
import { CATEGORIES } from '@/lib/domain/familyLoad';
import { lockScreenText, MISSION_PUSH_CATEGORY, pushCategory, pushData, type PushRow } from '../../supabase/functions/_shared/push-rules';
import { createDemoBackend } from '@/lib/backend/demo';

const SQL = (f: string) => fs.readFileSync(path.join(process.cwd(), 'supabase', f), 'utf8');

const base: Mission = {
  id: 'm1', household_id: 'h1', title: 'Acheter des couches taille 4 aujourd’hui', category: 'shopping', due_at: null, assignee_id: 'cp', priority: 'normal',
  essential: false, recurrence: null, status: 'todo', done_at: null, done_by: null, notes: null, routine_id: null, created_by: 'me', created_at: '2026-11-14T08:00:00Z',
  mission_state: 'pending', child_id: null, pet_id: null, shopping_item_id: null, product_label: 'Couches taille 4', document_id: null, domain_key: 'shopping',
  all_day: false, responded_at: null, last_reminded_at: null,
};

describe('missions : machine d’états (miroir du serveur)', () => {
  it('matrice complète identique à public._mission_next_state (même chaîne que le test SQL)', () => {
    const states = [...MISSION_STATES].sort();
    const actions = [...MISSION_ACTIONS].sort();
    const mine = states.flatMap((s) => actions.map((a) => `${s}>${a}=${nextState(s, a) ?? '-'}`)).join(' ');
    const sqlTest = SQL('tests/sql/98m_missions.sql');
    const expected = sqlTest.match(/= '(accepted>accept=[^']+)'/)?.[1];
    expect(expected).toBeTruthy();
    expect(mine).toBe(expected);
  });

  it('terminée et annulée sont finales ; refusée ne se rouvre que par la personne qui a demandé', () => {
    for (const a of MISSION_ACTIONS) { expect(nextState('done', a)).toBeNull(); expect(nextState('cancelled', a)).toBeNull(); }
    expect(nextState('declined', 'accept')).toBeNull();
    expect(nextState('declined', 'reassign')).toBe('pending');
    expect(nextState('declined', 'cancel')).toBe('cancelled');
  });

  it('refus possible à toute étape non finale, sans justification', () => {
    for (const s of ['pending', 'accepted', 'in_progress', 'postponed'] as const) expect(nextState(s, 'decline')).toBe('declined');
  });

  it('réponses rapides : seulement pour le destinataire (ou une mission à prendre), jamais pour l’autrice', () => {
    expect(quickRepliesFor(base, 'cp').map((r) => r.action)).toEqual(['accept', 'start', 'complete', 'postpone', 'ask', 'decline']);
    expect(quickRepliesFor(base, 'me')).toEqual([]);
    expect(quickRepliesFor(base, 'nounou')).toEqual([]);
    expect(quickRepliesFor({ ...base, mission_state: 'accepted' }, 'cp').map((r) => r.action)).toEqual(['complete', 'start', 'postpone', 'ask', 'decline']);
    expect(quickRepliesFor({ ...base, mission_state: 'done' }, 'cp')).toEqual([]);
    expect(quickRepliesFor({ ...base, assignee_id: null }, 'nounou').map((r) => r.action)).toEqual(['accept', 'start', 'complete']);
    expect(viewerOf({ ...base, assignee_id: null }, 'me')).toBe('creator');
  });

  it('actions de l’autrice : rappel limité à un par 24 h, réattribution après un refus, annulation', () => {
    const now = Date.parse('2026-11-14T12:00:00Z');
    expect(creatorActionsFor(base, 'me', now)).toEqual(['remind', 'reassign', 'cancel']);
    expect(creatorActionsFor({ ...base, last_reminded_at: '2026-11-14T08:00:00Z' }, 'me', now)).toEqual(['reassign', 'cancel']);
    expect(canRemind({ mission_state: 'pending', last_reminded_at: '2026-11-13T11:00:00Z' }, now)).toBe(true);
    expect(creatorActionsFor({ ...base, mission_state: 'in_progress' }, 'me', now)).toEqual(['cancel']);
    expect(creatorActionsFor({ ...base, mission_state: 'declined' }, 'me', now)).toEqual(['reassign', 'cancel']);
    expect(creatorActionsFor(base, 'cp', now)).toEqual([]);
  });

  it('reçues / envoyées et tri : à traiter d’abord, terminées à la fin', () => {
    const all = [
      { ...base, id: 'a', mission_state: 'done' as const, updated_at: '2026-11-14T10:00:00Z' },
      { ...base, id: 'b', mission_state: 'accepted' as const },
      { ...base, id: 'c' },
      { ...base, id: 'd', created_by: 'cp', assignee_id: 'me' },
      { ...base, id: 'e', created_by: 'cp', assignee_id: null },
    ];
    expect(receivedMissions(all, 'me').map((m) => m.id)).toEqual(['d', 'e']);
    expect(sortMissions(sentMissions(all, 'me')).map((m) => m.id)).toEqual(['c', 'b', 'a']);
  });
});

describe('missions : responsabilités', () => {
  it('8 responsabilités HOMI, toutes des domaines confiables traduits', () => {
    expect(RESPONSIBILITIES).toEqual(['shopping', 'meals', 'baby', 'childcare', 'pets', 'home', 'admin', 'health']);
    for (const k of RESPONSIBILITIES) expect(DOMAINS).toContain(k);
  });
  it('catégorie → domaine : miroir exact de public._mission_domain_of', () => {
    const sql = SQL('migrations/20261114000300_missions.sql');
    const body = sql.slice(sql.indexOf('function public._mission_domain_of'), sql.indexOf('$$;', sql.indexOf('function public._mission_domain_of')));
    const pairs = [...body.matchAll(/when '([a-z_]+)' then '([a-z_]+)'/g)].map((m) => [m[1], m[2]]);
    expect(Object.fromEntries(pairs)).toEqual(MISSION_DOMAIN_OF);
    for (const c of Object.keys(MISSION_DOMAIN_OF)) expect(CATEGORIES.map((x) => x.value)).toContain(c);
  });
  it('destinataire par défaut : la personne qui porte le domaine, jamais soi-même ni un ex-membre', () => {
    const domains = [{ key: 'shopping', owner_id: 'cp' }, { key: 'home', owner_id: 'me' }];
    expect(defaultRecipient('shopping', domains, 'me', ['me', 'cp'])).toBe('cp');
    expect(defaultRecipient('housework', domains, 'me', ['me', 'cp'])).toBeNull();
    expect(defaultRecipient('shopping', domains, 'me', ['me'])).toBeNull();
    expect(defaultRecipient('other', domains, 'me', ['me', 'cp'])).toBeNull();
  });
});

describe('missions : modèles neutres (5 langues)', () => {
  it('chaque modèle est traduit, et aucun ne contient de reproche, d’injonction ni d’urgence', () => {
    expect(MISSION_TEMPLATES.length).toBeGreaterThanOrEqual(10);
    for (const lang of ['fr', 'en', 'es', 'de', 'it']) {
      const dict = DICTIONARIES[lang];
      for (const tpl of MISSION_TEMPLATES) {
        for (const k of [tpl.title, tpl.product].filter(Boolean) as string[]) {
          const text = dict[k] as string;
          expect([lang, k, typeof text]).toEqual([lang, k, 'string']);
          expect([lang, text, isNeutralText(text)]).toEqual([lang, text, true]);
        }
      }
    }
  });
  it('le garde-fou de ton refuse les formulations culpabilisantes', () => {
    for (const bad of ['Tu as encore oublié le lait', 'Il faut ABSOLUMENT acheter des couches !', 'You forgot the milk again', 'Schon wieder vergessen', 'Has olvidado la leche', 'Hai dimenticato il latte']) {
      expect([bad, isNeutralText(bad)]).toEqual([bad, false]);
    }
    expect(isNeutralText('Acheter du lait avant 18 h')).toBe(true);
  });
  it('libellés des états et réponses rapides sans jugement (pas de « en retard », pas de score)', () => {
    setLocale('fr');
    const fr = DICTIONARIES.fr;
    expect(['mis.state.pending', 'mis.state.accepted', 'mis.state.in_progress', 'mis.state.done', 'mis.state.declined', 'mis.state.postponed', 'mis.state.cancelled'].map((k) => fr[k]))
      .toEqual(['À accepter', 'Acceptée', 'En cours', 'Terminée', 'Refusée', 'Reportée', 'Annulée']);
    expect(['mis.reply.accept', 'mis.reply.start', 'mis.reply.complete', 'mis.reply.decline', 'mis.reply.postpone', 'mis.reply.ask'].map((k) => fr[k]))
      .toEqual(['J’accepte', 'Je m’en occupe', 'C’est terminé', 'Je ne peux pas', 'Je propose un autre horaire', 'Besoin de précision']);
    const all = Object.entries(fr).filter(([k]) => k.startsWith('mis.')).map(([, v]) => JSON.stringify(v)).join(' ');
    expect(all).not.toMatch(/score|classement|en retard|oublié|vu à/i);
  });
});

describe('missions : notifications (miroir de public._mission_notification)', () => {
  const sql = SQL('migrations/20261114000300_missions.sql');
  const types: MissionEventType[] = ['mission.requested', 'mission.accepted', 'mission.declined', 'mission.postponed', 'mission.completed', 'mission.cancelled', 'mission.question', 'mission.reminded'];
  it('mêmes préfixes et mêmes textes que le serveur', () => {
    for (const ty of types) {
      const n = missionNotification(ty, 'X')!;
      expect(sql).toContain(`when '${ty}'`);
      expect(sql).toContain(`then '${n.title.slice(0, -1)}'`);
      expect(sql).toContain(n.body);
    }
    expect(missionNotification('mission.requested', 'Acheter des couches taille 4 aujourd’hui')?.title).toBe('Nouvelle mission : Acheter des couches taille 4 aujourd’hui');
  });
  it('« En cours » ne notifie personne (pas de relance) ; la bonne personne est prévenue', () => {
    expect(missionNotification('mission.started', 'X')).toBeNull();
    expect(missionNotifyTarget('mission.requested', base)).toBe('assignee');
    expect(missionNotifyTarget('mission.requested', { ...base, assignee_id: null })).toBe('household');
    expect(missionNotifyTarget('mission.accepted', base)).toBe('creator');
    expect(missionNotifyTarget('mission.completed', base)).toBe('creator');
    expect(missionNotifyTarget('mission.declined', base)).toBe('creator');
    expect(missionNotifyTarget('mission.cancelled', base)).toBe('assignee');
    expect(missionNotifyTarget('mission.reminded', base)).toBe('assignee');
    expect(EVENT_OF_ACTION.reassign).toBe('mission.requested');
  });
  it('aucun texte de notification ne culpabilise', () => {
    for (const ty of types) expect(isNeutralText(missionNotification(ty, 'Acheter du lait')!.title + ' ' + missionNotification(ty, 'x')!.body)).toBe(true);
  });
  it('écran verrouillé générique par défaut ; boutons « J’accepte / Je ne peux pas » seulement si le détail est visible', () => {
    const row: PushRow = { id: 'n1', user_id: 'cp', title: 'Nouvelle mission : Acheter des couches taille 4', body: 'Ouvrez HOMI pour répondre quand vous le pouvez.',
      deep_link: '/family/missions/m1', category: 'family', payload: { task_id: 'm1', mission: 'mission.requested', event_id: 'e1' } };
    expect(lockScreenText(row, 'fr', false)).toEqual({ title: 'Nouvelle notification', body: 'Ouvrez l’application pour voir le détail.' });
    expect(pushCategory(row, false)).toBeUndefined();
    expect(pushCategory(row, true)).toBe(MISSION_PUSH_CATEGORY);
    expect(pushCategory({ payload: { task_id: 'm1', mission: 'mission.accepted' } }, true)).toBeUndefined();
    expect(pushData(row)).toEqual({ url: '/family/missions/m1', notificationId: 'n1', taskId: 'm1' });
    expect(pushData({ id: 'n2', deep_link: null, payload: null })).toEqual({ url: '/notifications', notificationId: 'n2' });
  });
});

describe('missions : démonstration (scénario A, mêmes règles que le serveur)', () => {
  it('création → acceptation → article dans les courses → terminé → confirmation, sans doublon', async () => {
    const b = createDemoBackend({ strictPremium: false });
    await b.auth.signUp('maman@exemple.test', 'MotDePasse!2026');
    await b.auth.signIn('maman@exemple.test', 'MotDePasse!2026');
    const me = (await b.auth.getSession())!.userId;
    const { household_id: hid } = await b.rpc<{ household_id: string }>('ensure_my_account');
    const { user_id: partner } = await b.rpc<{ user_id: string }>('demo_mission_partner');
    const m = await b.rpc<Mission>('create_mission', { p_household: hid, p_title: 'Acheter des couches taille 4 aujourd’hui', p_assignee: partner, p_category: 'shopping', p_product_label: 'Couches taille 4', p_client_id: 'c-1' });
    expect(m.mission_state).toBe('pending');
    expect((await b.rpc<Mission>('create_mission', { p_household: hid, p_title: 'x', p_client_id: 'c-1' })).id).toBe(m.id);
    await expect(b.rpc('mission_respond', { p_task: m.id, p_action: 'accept' })).rejects.toBeTruthy(); // l'autrice ne répond pas à la place
    await expect(b.update('family_tasks', { status: 'done' }, [{ col: 'id', op: 'eq', value: m.id }])).rejects.toBeTruthy();
    await b.rpc('demo_switch_person', { p_user: partner });
    expect((await b.auth.getSession())!.userId).toBe(partner);
    const notes = await b.select<{ title: string; user_id: string }>({ table: 'notifications', filters: [{ col: 'user_id', op: 'eq', value: partner }] });
    expect(notes.map((n) => n.title)).toContain('Nouvelle mission : Acheter des couches taille 4 aujourd’hui');
    await b.rpc('mission_respond', { p_task: m.id, p_action: 'accept' });
    expect((await b.rpc<{ unchanged?: boolean }>('mission_respond', { p_task: m.id, p_action: 'accept' })).unchanged).toBe(true);
    const items = await b.select<{ label: string; checked: boolean }>({ table: 'shopping_items', filters: [{ col: 'household_id', op: 'eq', value: hid }] });
    expect(items.filter((i) => i.label === 'Couches taille 4')).toHaveLength(1);
    await b.rpc('mission_respond', { p_task: m.id, p_action: 'complete' });
    const after = await b.select<{ label: string; checked: boolean }>({ table: 'shopping_items', filters: [{ col: 'household_id', op: 'eq', value: hid }] });
    expect(after.find((i) => i.label === 'Couches taille 4')?.checked).toBe(true);
    await b.rpc('demo_switch_person', { p_user: me });
    const mine = await b.select<{ title: string }>({ table: 'notifications', filters: [{ col: 'user_id', op: 'eq', value: me }] });
    expect(mine.map((n) => n.title)).toEqual(expect.arrayContaining(['Mission acceptée : Acheter des couches taille 4 aujourd’hui', 'Mission terminée : Acheter des couches taille 4 aujourd’hui']));
    const history = await b.select<{ kind: string }>({ table: 'family_task_events', filters: [{ col: 'task_id', op: 'eq', value: m.id }], order: [{ col: 'created_at' }] });
    expect(history.map((e) => e.kind)).toEqual(['created', 'accepted', 'done']);
    // refus sans justification, puis transition interdite
    const d = await b.rpc<Mission>('create_mission', { p_household: hid, p_title: 'Sortir les poubelles', p_assignee: partner, p_category: 'housework' });
    await b.rpc('demo_switch_person', { p_user: partner });
    await b.rpc('mission_respond', { p_task: d.id, p_action: 'decline' });
    await expect(b.rpc('mission_respond', { p_task: d.id, p_action: 'accept' })).rejects.toBeTruthy();
  });
});
