/**
 * Messagerie privée de la communauté : règles pures (fil, boîte, brouillon) et moteur local à deux comptes.
 * Mêmes règles que supabase/migrations/20261119000300_messagerie_privee.sql (testées côté base dans
 * supabase/tests/sql/98zb_messagerie_privee.sql) : suivre → écrire → répondre → bloquer, demandes de message,
 * refus silencieux, aucune écriture directe, notification sans le texte du message.
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

import { createDemoBackend } from '@/lib/backend/demo';
import { eq } from '@/lib/backend/types';
import {
  DM_MAX_LENGTH, DM_REQUEST_LIMIT, badgeLabel, cleanMessage, draftError, splitInbox, threadRows,
  type DmConversation, type DmMessage, type DmOutgoing, type DmUnread,
} from '@/lib/domain/messages';
import { changeSpecs, PERSONAL_TABLES } from '@/lib/sync';
import { DICTIONARIES } from '@/i18n/dictionaries';
import type { AppNotification, MemberCard } from '@/lib/types';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs') as { readFileSync(p: string, enc: 'utf8'): string };

describe('règles pures', () => {
  const m = (id: string, mine: boolean, at: string): DmMessage => ({ id, body: id, mine, created_at: at, client_id: `c-${id}` });
  it('brouillon : vide, trop long, nettoyé', () => {
    expect(draftError('   \n ')).toBe('empty');
    expect(draftError('x'.repeat(DM_MAX_LENGTH + 1))).toBe('too_long');
    expect(draftError('Bonjour')).toBeNull();
    expect(cleanMessage('  a\r\nb\n\n\n\n\n\nc  ')).toBe('a\nb\n\n\nc');
  });
  it('fil : séparateurs de jour, heure en fin de série, envoi en cours sans doublon une fois confirmé', () => {
    const msgs = [m('1', false, '2026-11-17T09:00:00'), m('2', false, '2026-11-17T09:01:00'), m('3', true, '2026-11-17T09:02:00'), m('4', true, '2026-11-18T08:00:00')];
    const out: DmOutgoing[] = [
      { client_id: 'c-4', body: '4', created_at: '2026-11-18T08:00:00', state: 'sending' }, // déjà confirmé par le serveur
      { client_id: 'c-5', body: 'en cours', created_at: '2026-11-18T08:01:00', state: 'sending' },
      { client_id: 'c-6', body: 'raté', created_at: '2026-11-18T08:02:00', state: 'failed', error: 'Non envoyé.' },
    ];
    const rows = threadRows(msgs, out);
    expect(rows.map((r) => (r.kind === 'day' ? 'day' : r.message.id))).toEqual(['day', '1', '2', '3', 'day', '4', 'c-5', 'c-6']);
    const byId = Object.fromEntries(rows.flatMap((r) => (r.kind === 'message' ? [[r.message.id, r]] : [])));
    expect(byId['1'].showTime).toBe(false);
    expect(byId['2'].showTime).toBe(true);
    expect(byId['4'].outgoing).toBeUndefined();
    expect(byId['c-6'].outgoing?.state).toBe('failed');
    expect(new Set(rows.map((r) => r.key)).size).toBe(rows.length);
  });
  it('boîte : demandes reçues à part, plus récentes d’abord ; pastille 9+', () => {
    const c = (id: string, status: DmConversation['status'], last_at: string): DmConversation => ({ id, status, handle: id, pseudonym: id, last_body: 'x', last_at, last_mine: false, unread: 1, can_send: true, request_left: null });
    const s = splitInbox([c('a', 'open', '2026-11-01'), c('b', 'request_received', '2026-11-03'), c('c', 'request_sent', '2026-11-05'), c('d', 'open', '2026-11-04')]);
    expect(s.conversations.map((x) => x.id)).toEqual(['c', 'd', 'a']);
    expect(s.requests.map((x) => x.id)).toEqual(['b']);
    expect([badgeLabel(0), badgeLabel(3), badgeLabel(12)]).toEqual([null, '3', '9+']);
  });
  it('temps réel : canal à part, seule la ligne « participante » filtrée sur la personne ; le foyer n’en dépend pas', () => {
    expect(PERSONAL_TABLES).not.toContain('dm_participants' as never);
    expect(changeSpecs('foyer-1', 'user-1').some((s) => s.table.startsWith('dm_'))).toBe(false);
    const src = fs.readFileSync('src/lib/data/hooks-messages.ts', 'utf8');
    expect(src).toContain("backend.subscribeChanges([{ table: KEY, filter: `user_id=eq.${userId}` }]");
    expect(src).toContain("const KEY = 'dm_participants';");
  });
  it('mêmes limites que le serveur', () => {
    const sql = fs.readFileSync('supabase/migrations/20261119000300_messagerie_privee.sql', 'utf8');
    expect(sql).toContain(`char_length(body) between 1 and ${DM_MAX_LENGTH}`);
    expect(sql).toContain(`if v_sent >= ${DM_REQUEST_LIMIT} then`);
    // aucune politique d'écriture : seules les fonctions écrivent
    expect(sql).not.toMatch(/create policy \w+ on public\.dm_\w+ for (insert|update|delete|all)/);
    // la notification ne porte jamais le texte
    expect(sql).toMatch(/community_notify\(v_other, 'private_message', 'community_message',[\s\S]{0,220}\n\s+null, '\/community\/messages\/'/);
  });
  it('textes traduits dans les 5 langues, sans clé manquante', () => {
    const keys = Object.keys(DICTIONARIES.fr).filter((k) => k.startsWith('dm.'));
    expect(keys.length).toBeGreaterThan(60);
    for (const lang of ['en', 'es', 'de', 'it']) for (const k of keys) expect(DICTIONARIES[lang][k]).toBeTruthy();
  });
});

describe('moteur local : deux comptes', () => {
  const db = createDemoBackend();
  const PW = 'MotDePasse!2026';
  const as = async (email: string) => { await db.auth.signOut(); await db.auth.signIn(email, PW); };
  const me = async () => (await db.auth.getSession())!.userId;
  const inbox = () => db.rpc<DmConversation[]>('dm_inbox');
  const send = (id: string, body: string, key: string) => db.rpc<DmMessage>('dm_send', { p_conversation: id, p_body: body, p_client_id: key });
  const list = (id: string) => db.rpc<DmMessage[]>('dm_messages_list', { p_conversation: id, p_before: null, p_limit: 100 });
  let ab = ''; let ca = '';

  it('suivre dans les deux sens', async () => {
    await db.auth.signUp('alice@exemple.test', PW);
    await db.insert('community_profiles', { user_id: await me(), pseudonym: 'Alice Test' });
    await db.auth.signUp('bea@exemple.test', PW);
    await db.insert('community_profiles', { user_id: await me(), pseudonym: 'Bea Test' });
    await db.auth.signUp('chloe@exemple.test', PW);
    await db.insert('community_profiles', { user_id: await me(), pseudonym: 'Chloe Test' });

    await as('alice@exemple.test');
    await db.rpc('follow_member', { p_handle: 'bea_test' });
    expect((await db.rpc<MemberCard[]>('my_follows')).map((f) => f.handle)).toEqual(['bea_test']);
    expect((await db.rpc<{ is_following: boolean }>('community_member', { p_handle: 'bea_test' })).is_following).toBe(true);
    await as('bea@exemple.test');
    const notes = await db.select<AppNotification>({ table: 'notifications', filters: [eq('category', 'community_follow')] });
    expect(notes).toHaveLength(1);
    expect(notes[0].deep_link).toBe('/community/u/alice_test');
    await db.rpc('follow_member', { p_handle: 'alice_test' });
    // ne plus suivre, puis suivre à nouveau
    await db.rpc('unfollow_member', { p_handle: 'alice_test' });
    expect(await db.rpc<MemberCard[]>('my_follows')).toEqual([]);
    await db.rpc('follow_member', { p_handle: 'alice_test' });
  });

  it('écrire à quelqu’un que l’on suit et qui vous suit : conversation ouverte, non-lus, notification sans texte', async () => {
    await as('bea@exemple.test');
    ab = await db.rpc<string>('dm_open', { p_handle: '@alice_test' });
    expect(await db.rpc<string>('dm_open', { p_handle: 'alice_test' })).toBe(ab);
    expect((await db.rpc<DmConversation>('dm_conversation', { p_conversation: ab })).status).toBe('open');
    expect(await inbox()).toEqual([]); // rien tant qu'aucun message
    const sent = await send(ab, '  Bonjour Alice, comment va Sohan ?  ', 'k1');
    expect(sent).toMatchObject({ body: 'Bonjour Alice, comment va Sohan ?', mine: true });
    // nouvel essai après une coupure : même identifiant, aucun doublon
    expect((await send(ab, 'Bonjour Alice, comment va Sohan ?', 'k1')).id).toBe(sent.id);
    expect(await list(ab)).toHaveLength(1);
    await expect(send(ab, '   ', 'k2')).rejects.toThrow();
    await expect(send(ab, 'x'.repeat(DM_MAX_LENGTH + 1), 'k3')).rejects.toThrow();

    await as('alice@exemple.test');
    expect(await db.rpc<DmUnread>('dm_unread')).toEqual({ messages: 1, requests: 0 });
    const box = await inbox();
    expect(box).toHaveLength(1);
    expect(box[0]).toMatchObject({ id: ab, status: 'open', handle: 'bea_test', unread: 1, last_mine: false, last_body: 'Bonjour Alice, comment va Sohan ?' });
    const notes = await db.select<AppNotification>({ table: 'notifications', filters: [eq('category', 'community_message')] });
    expect(notes).toHaveLength(1);
    expect(notes[0]).toMatchObject({ body: null, deep_link: `/community/messages/${ab}` });
    expect(JSON.stringify(notes)).not.toMatch(/Sohan|Bonjour/);
  });

  it('répondre : lu, puis une seule notification par série de messages non lus', async () => {
    await as('alice@exemple.test');
    await db.rpc('dm_mark_read', { p_conversation: ab });
    expect((await db.rpc<DmUnread>('dm_unread')).messages).toBe(0);
    await send(ab, 'Très bien, merci !', 'a1');
    await send(ab, 'Et de votre côté ?', 'a2');
    await as('bea@exemple.test');
    expect((await list(ab)).map((x) => [x.body, x.mine])).toEqual([['Bonjour Alice, comment va Sohan ?', true], ['Très bien, merci !', false], ['Et de votre côté ?', false]]);
    expect((await inbox())[0]).toMatchObject({ unread: 2, last_mine: false });
    expect(await db.select<AppNotification>({ table: 'notifications', filters: [eq('category', 'community_message')] })).toHaveLength(1);
  });

  it('aucune lecture ni écriture directe des tables, rien pour une tierce personne', async () => {
    await as('chloe@exemple.test');
    for (const t of ['dm_messages', 'dm_conversations', 'dm_participants']) expect(await db.select({ table: t })).toEqual([]);
    expect(await list(ab)).toEqual([]);
    expect(await db.rpc('dm_conversation', { p_conversation: ab })).toBeNull();
    await expect(send(ab, 'intrusion', 'c0')).rejects.toThrow();
    await expect(db.insert('dm_messages', { conversation_id: ab, body: 'direct', client_id: 'x' })).rejects.toThrow();
    await expect(db.update('dm_participants', { unread_count: 0 }, [])).rejects.toThrow();
    await expect(db.remove('dm_messages', [])).rejects.toThrow();
    await as('bea@exemple.test');
    expect(await db.select({ table: 'dm_messages' })).toEqual([]); // même pour une participante : fonctions uniquement
  });

  it('sans suivi mutuel : demande de message (3 messages, sans coordonnées), refus jamais annoncé', async () => {
    await as('chloe@exemple.test');
    ca = await db.rpc<string>('dm_open', { p_handle: 'alice_test' });
    expect((await db.rpc<DmConversation>('dm_conversation', { p_conversation: ca }))).toMatchObject({ status: 'request_sent', request_left: 3, can_send: true });
    await expect(send(ca, 'Écris-moi : chloe@exemple.fr', 'c1')).rejects.toThrow(/coordonnées/);
    await send(ca, 'Bonjour, nous avons des jumeaux du même âge.', 'c2');
    await send(ca, 'Deuxième', 'c3');
    await send(ca, 'Troisième', 'c4');
    await expect(send(ca, 'Quatrième', 'c5')).rejects.toThrow(/accepte/);
    expect((await db.rpc<DmConversation>('dm_conversation', { p_conversation: ca }))).toMatchObject({ can_send: false, request_left: 0 });
    await expect(db.rpc('dm_respond', { p_conversation: ca, p_accept: true })).rejects.toThrow();

    await as('alice@exemple.test');
    expect(await db.rpc<DmUnread>('dm_unread')).toMatchObject({ requests: 1 });
    expect(splitInbox(await inbox()).requests.map((x) => x.handle)).toEqual(['chloe_test']);
    await db.rpc('dm_respond', { p_conversation: ca, p_accept: false });
    expect((await inbox()).some((x) => x.handle === 'chloe_test')).toBe(false);
    expect(await list(ca)).toEqual([]);

    await as('chloe@exemple.test');
    expect((await db.rpc<DmConversation>('dm_conversation', { p_conversation: ca })).status).toBe('request_sent'); // rien ne trahit le refus
    await db.rpc('dm_open', { p_handle: 'alice_test' }); // rouvrir ne change rien pour la demandeuse
    expect((await db.rpc<DmConversation>('dm_conversation', { p_conversation: ca })).status).toBe('request_sent');
  });

  it('accepter une demande ouvre la conversation ; répondre l’accepte aussi', async () => {
    await as('chloe@exemple.test');
    const cb = await db.rpc<string>('dm_open', { p_handle: 'bea_test' });
    await send(cb, 'Bonjour Béa', 'c10');
    await as('bea@exemple.test');
    expect((await db.rpc<DmConversation>('dm_conversation', { p_conversation: cb })).status).toBe('request_received');
    await db.rpc('dm_respond', { p_conversation: cb, p_accept: true });
    expect((await db.rpc<DmConversation>('dm_conversation', { p_conversation: cb })).status).toBe('open');
    await send(cb, 'Bonjour Chloé', 'b10');
    await as('chloe@exemple.test');
    expect((await db.rpc<DmConversation>('dm_conversation', { p_conversation: cb }))).toMatchObject({ status: 'open', can_send: true, request_left: null });
  });

  it('signaler (pièces pour la modération), puis bloquer : plus de message, plus de suivi, conversation retirée des deux boîtes', async () => {
    await as('alice@exemple.test');
    await db.rpc('dm_report', { p_conversation: ab, p_reason: 'harassment', p_details: null });
    await expect(db.rpc('dm_report', { p_conversation: ab, p_reason: 'spam', p_details: null })).rejects.toThrow();
    await db.rpc('block_member', { p_handle: 'bea_test' });
    expect((await inbox()).some((x) => x.handle === 'bea_test')).toBe(false);
    expect(await db.rpc('dm_conversation', { p_conversation: ab })).toBeNull();
    await expect(send(ab, 'encore', 'a9')).rejects.toThrow();
    expect(await db.rpc<MemberCard[]>('my_follows')).toEqual([]);

    await as('bea@exemple.test');
    expect((await inbox()).some((x) => x.handle === 'alice_test')).toBe(false);
    expect(await list(ab)).toEqual([]);
    await expect(send(ab, 'pourquoi ?', 'b9')).rejects.toThrow();
    await expect(db.rpc('dm_open', { p_handle: 'alice_test' })).rejects.toThrow();
    expect((await db.rpc<MemberCard[]>('my_follows')).some((f) => f.handle === 'alice_test')).toBe(false);
    await expect(db.rpc('follow_member', { p_handle: 'alice_test' })).rejects.toThrow();
    expect(await db.select({ table: 'dm_report_evidence' })).toEqual([]);
  });

  it('démonstration : la famille d’exemple reçoit une conversation et une demande (deux personnages)', async () => {
    await db.auth.signUp('demo-famille@exemple.test', PW);
    await db.rpc('load_sample_family');
    if (!(await db.rpc('my_community_profile'))) await db.insert('community_profiles', { user_id: await me(), pseudonym: 'Visiteuse Démo' });
    const s = splitInbox(await inbox());
    expect(s.conversations.map((x) => [x.handle, x.status, x.unread])).toEqual([['maia_et_sohan', 'open', 2]]);
    expect(s.requests.map((x) => [x.handle, x.status])).toEqual([['papadenour', 'request_received']]);
    expect((await inbox()).length).toBe(2); // jamais semé deux fois
    const notes = await db.select<AppNotification>({ table: 'notifications', filters: [eq('category', 'community_message')] });
    expect(notes.every((n) => n.body === null)).toBe(true);
  });
});
