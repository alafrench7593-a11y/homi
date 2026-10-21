/**
 * Communauté v2 — règles pures et moteur local : identifiants « @ », informations sensibles, fil « Pour vous »,
 * photos sans métadonnées, anonymat, visibilité du profil, photos, modifications, notifications par type, blocage.
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

import { createDemoBackend } from '@/lib/backend/demo';
import { eq } from '@/lib/backend/types';
import { forYouOrder, handleBase, handleError, joinedLabel, normalizeHandle, primaryCategories, sensitiveHints, textNeedsReview } from '@/lib/domain/communityRules';
import { encodeForCommunity, jpegHasMetadata } from '@/lib/community/photos';
import type { AppNotification, CommunityMember, CommunityProfile, FeedComment, FeedPost, Forum } from '@/lib/types';

describe('règles pures', () => {
  it('identifiant « @ »', () => {
    expect(handleBase('Maëlle Étoile')).toBe('maelle_etoile');
    expect(handleBase('Œ')).toBe('o_membre');
    expect(handleBase('!!!')).toBe('membre');
    expect(normalizeHandle('@Camille_Test ')).toBe('camille_test');
    expect(handleError('@camille_test')).toBeNull();
    expect(handleError('a b')).toMatch(/3 à 20/);
    expect(handleError('maëlle')).toMatch(/sans accent/);
    expect(handleError('moderation')).toMatch(/réservé/);
  });
  it('informations sensibles : mêmes règles que la base, avertissements avant publication', () => {
    expect(textNeedsReview('Appelez-moi au 06 12 34 56 78')).toBe(true);
    expect(textNeedsReview('écrivez à moi@exemple.fr')).toBe(true);
    expect(textNeedsReview('On habite au 12 rue des Lilas')).toBe(true);
    expect(textNeedsReview('Ma fille est née le 03/04/2026')).toBe(true);
    expect(textNeedsReview('Ici : 48.85661, 2.35222')).toBe(true);
    expect(textNeedsReview('https://a.fr https://b.fr https://c.fr')).toBe(true);
    expect(textNeedsReview('Notre fille de 6 mois se réveille à 5 h')).toBe(false);
    const hints = sensitiveHints('Né le 3/4/2025, il prend un traitement, appelez au 0612345678');
    expect(hints.map((h) => h.key)).toEqual(expect.arrayContaining(['birthdate', 'medical', 'phone']));
    expect(hints.find((h) => h.key === 'medical')!.blocking).toBe(false);
  });
  it('catégories principales selon le parcours, puis « Questions générales »', () => {
    const f = (slug: string, position: number, journeys: string[]): Forum => ({ id: slug, slug, title: slug, description: '', journeys: journeys as Forum['journeys'], icon: null, is_local: false, position });
    const all = [f('suivi-cycle', 1, ['cycle']), f('grossesse', 3, ['pregnant']), f('jumeaux', 4, ['pregnant', 'newborn']), f('nouveau-ne', 5, ['newborn']), f('sommeil', 8, ['newborn', 'child']), f('questions-generales', 14, []), f('autre', 9, ['child'])];
    expect(primaryCategories(all, ['pregnant']).map((x) => x.slug).slice(0, 3)).toEqual(['grossesse', 'jumeaux', 'questions-generales']);
    expect(primaryCategories(all, ['pregnant'])).toHaveLength(6);
  });
  it('fil « Pour vous » : catégories du parcours et discussions actives en avant, sans rien masquer', () => {
    const now = new Date('2026-10-22T12:00:00Z');
    const p = (id: string, forum: string, hoursAgo: number, likes = 0, comments = 0) => ({ id, forum_id: forum, created_at: new Date(now.getTime() - hoursAgo * 3_600_000).toISOString(), like_count: likes, comment_count: comments });
    const ordered = forYouOrder([p('a', 'autre', 1), p('b', 'mine', 3), p('c', 'autre', 2, 40, 12), p('d', 'mine', 200)], ['mine'], now).map((x) => x.id);
    expect(ordered[0]).toBe('c');
    expect(ordered.indexOf('b')).toBeLessThan(ordered.indexOf('a'));
    expect(ordered).toHaveLength(4);
  });
  it('« Membre depuis » : mois seulement', () => {
    expect(joinedLabel('2026-10')).toBe('Membre depuis octobre 2026');
    expect(joinedLabel(null)).toBeNull();
  });
});

describe('photos : aucune métadonnée ne quitte l’appareil', () => {
  it('détecte un segment Exif et ré-encode sans métadonnées', () => {
    // JPEG minimal avec un segment APP1 « Exif » (GPS) avant l'image
    const withExif = Uint8Array.from([0xff, 0xd8, 0xff, 0xe1, 0x00, 0x0a, 0x45, 0x78, 0x69, 0x66, 0x00, 0x00, 0x47, 0x50, 0xff, 0xda, 0x00, 0x02, 0xff, 0xd9]);
    expect(jpegHasMetadata(withExif)).toBe(true);
    const w = 32, h = 24;
    const data = new Uint8Array(w * h * 4);
    for (let i = 0; i < w * h; i++) { data[i * 4] = (i * 7) % 255; data[i * 4 + 1] = 120; data[i * 4 + 2] = 200; data[i * 4 + 3] = 255; }
    const out = encodeForCommunity({ width: w, height: h, data });
    expect(out[0]).toBe(0xff); expect(out[1]).toBe(0xd8);
    expect(jpegHasMetadata(out)).toBe(false);
    const ascii = Array.from(out, (b) => String.fromCharCode(b)).join('');
    expect(ascii.includes('Exif')).toBe(false);
    expect(ascii.includes('GPS')).toBe(false);
  });
});

describe('moteur local : confidentialité et fonctions du forum', () => {
  const db = createDemoBackend();
  const PW = 'MotDePasse!2026';
  let forums: Forum[] = [];
  const me = async () => (await db.auth.getSession())!.userId;
  const as = async (email: string) => { await db.auth.signOut(); await db.auth.signIn(email, PW); };
  const forum = (slug: string) => forums.find((f) => f.slug === slug)!.id;
  let ana = '';
  let anonPost: FeedPost;

  it('profil : identifiant unique, présentation privée pour un profil discret', async () => {
    forums = await db.select<Forum>({ table: 'forums' });
    await db.auth.signUp('ana@exemple.test', PW);
    ana = await me();
    await db.insert('community_profiles', { user_id: ana, pseudonym: 'Ana du Sud', bio: 'Maman solo, deux enfants.', visibility: 'minimal', avatar_preset: 'leaf' });
    const mine = await db.rpc<CommunityProfile>('my_community_profile');
    expect(mine).toMatchObject({ handle: 'ana_du_sud', bio: 'Maman solo, deux enfants.', visibility: 'minimal' });
    await expect(db.update('community_profiles', { handle: 'papadenour' }, [eq('user_id', ana)])).rejects.toThrow(/déjà pris/);
    await expect(db.update('community_profiles', { handle: 'a b' }, [eq('user_id', ana)])).rejects.toThrow(/3 à 20/);
    await db.update('community_profiles', { suspended_until: '2099-01-01' }, [eq('user_id', ana)]);
    expect((await db.rpc<CommunityProfile>('my_community_profile')).suspended_until).toBeNull();
    await db.auth.signUp('bea@exemple.test', PW);
    await db.insert('community_profiles', { user_id: await me(), pseudonym: 'Béa Lune' });
    const seen = await db.rpc<CommunityMember>('community_member', { p_handle: '@ana_du_sud' });
    expect(seen).toMatchObject({ pseudonym: 'Ana du Sud', is_me: false });
    expect(seen.bio).toBeUndefined();
    const rows = await db.select<Record<string, unknown>>({ table: 'community_profiles' });
    expect(rows.every((r) => !('bio' in r) && !('visibility' in r))).toBe(true);
  });

  it('anonymat : ni pseudonyme ni identifiant, y compris dans les réponses de l’autrice', async () => {
    await as('ana@exemple.test');
    [anonPost] = await db.insert<FeedPost>('posts', { forum_id: forum('post-partum'), body: 'Je me sens seule, vous aussi ?', kind: 'testimony', anonymous: true });
    await as('bea@exemple.test');
    const [c] = await db.insert<FeedComment>('comments', { post_id: anonPost.id, body: 'Oui, parlez-en à votre sage-femme.' });
    const fromBea = (await db.select<FeedPost>({ table: 'forum_feed', filters: [eq('id', anonPost.id)] }))[0];
    expect(fromBea).toMatchObject({ pseudonym: null, author_handle: null, avatar_preset: null, anonymous: true, kind: 'testimony' });
    expect(JSON.stringify(fromBea)).not.toMatch(/ana/i);
    await as('ana@exemple.test');
    await db.insert('comments', { post_id: anonPost.id, parent_id: c.id, body: 'Merci, ça m’aide.' });
    await as('bea@exemple.test');
    const reply = (await db.select<FeedComment>({ table: 'comment_feed', filters: [eq('post_id', anonPost.id)] })).find((x) => x.body === 'Merci, ça m’aide.')!;
    expect(reply).toMatchObject({ anonymous: true, pseudonym: null, is_op: true });
    const n = await db.select<AppNotification>({ table: 'notifications', filters: [eq('category', 'community_reply')] });
    expect(n[0].title).toBe('L’auteur·rice de la publication a répondu à votre commentaire');
    expect(n[0].deep_link).toMatch(/\?comment=/);
  });

  it('modifier ses contenus, jamais ceux des autres ; texte sensible remis en relecture', async () => {
    await as('bea@exemple.test');
    await db.update('posts', { body: 'Piratage' }, [eq('id', anonPost.id)]);
    expect((await db.select<FeedPost>({ table: 'forum_feed', filters: [eq('id', anonPost.id)] }))[0].body).not.toBe('Piratage');
    await as('ana@exemple.test');
    await db.update('posts', { body: 'Je me sens seule le soir, vous aussi ?', anonymous: false }, [eq('id', anonPost.id)]);
    const after = (await db.select<FeedPost>({ table: 'forum_feed', filters: [eq('id', anonPost.id)] }))[0];
    expect(after.edited_at).toBeTruthy();
    expect(after.anonymous).toBe(true);
    await db.update('posts', { body: 'Écrivez-moi : ana@exemple.fr' }, [eq('id', anonPost.id)]);
    expect((await db.select<FeedPost>({ table: 'forum_feed', filters: [eq('id', anonPost.id)] }))[0].status).toBe('pending_review');
    await expect(db.insert('posts', { forum_id: forum('sommeil'), body: 'Une question sur les siestes' })).resolves.toBeTruthy();
    await expect(db.insert('posts', { forum_id: forum('sommeil'), body: 'Une question sur les siestes' })).rejects.toThrow(/déjà publié/);
  });

  it('photos : 4 au plus, sur sa propre publication, effacées avec elle', async () => {
    await as('ana@exemple.test');
    const [p] = await db.insert<FeedPost>('posts', { forum_id: forum('nouveau-ne'), body: 'Notre coin change' });
    for (let i = 0; i < 4; i++) await db.insert('post_photos', { post_id: p.id, path: `${ana}/p${i}.jpg`, width: 800, height: 600, position: i });
    await expect(db.insert('post_photos', { post_id: p.id, path: `${ana}/p5.jpg` })).rejects.toThrow(/4 photos/);
    await expect(db.insert('post_photos', { post_id: p.id, path: `autre/p6.jpg` })).rejects.toThrow(/autorisation/);
    expect((await db.select<FeedPost>({ table: 'forum_feed', filters: [eq('id', p.id)] }))[0].photos).toHaveLength(4);
    await as('bea@exemple.test');
    await expect(db.insert('post_photos', { post_id: p.id, path: `x/p.jpg` })).rejects.toThrow(/autorisation/);
    await as('ana@exemple.test');
    await db.remove('posts', [eq('id', p.id)]);
    expect(await db.select({ table: 'post_photos', filters: [eq('post_id', p.id)] })).toHaveLength(0);
  });

  it('notifications : réaction une seule fois, préférences par type, publication enregistrée', async () => {
    await as('ana@exemple.test');
    const [p] = await db.insert<FeedPost>('posts', { forum_id: forum('biberon'), body: 'Biberons de nuit : vos astuces ?' });
    await as('bea@exemple.test');
    await db.insert('post_likes', { post_id: p.id, user_id: await me() });
    await db.remove('post_likes', [eq('post_id', p.id)]);
    await db.insert('post_likes', { post_id: p.id, user_id: await me() });
    await db.insert('saved_posts', { post_id: p.id, user_id: await me() });
    await as('ana@exemple.test');
    expect(await db.select({ table: 'notifications', filters: [eq('category', 'community_like')] })).toHaveLength(1);
    await db.insert('community_notification_prefs', { user_id: await me(), post_comment: false });
    await db.auth.signUp('cleo@exemple.test', PW);
    await db.insert('community_profiles', { user_id: await me(), pseudonym: 'Cléo trois' });
    await db.insert('comments', { post_id: p.id, body: 'Eau prête dans un thermos.' });
    await as('ana@exemple.test');
    expect((await db.select<AppNotification>({ table: 'notifications', filters: [eq('category', 'community_comment')] })).filter((x) => x.body?.startsWith('Eau prête'))).toHaveLength(0);
    await as('bea@exemple.test');
    expect(await db.select({ table: 'notifications', filters: [eq('category', 'community_saved')] })).toHaveLength(1);
  });

  it('modération : l’autrice est informée ; signaler et bloquer un membre depuis son profil', async () => {
    await as('ana@exemple.test');
    const [p] = await db.insert<FeedPost>('posts', { forum_id: forum('sommeil'), body: 'Contenu signalé trois fois' });
    for (const email of ['bea@exemple.test', 'cleo@exemple.test']) { await as(email); await db.insert('reports', { post_id: p.id, reason: 'spam' }); }
    await db.auth.signUp('dina@exemple.test', PW);
    await db.insert('reports', { post_id: p.id, reason: 'spam' });
    await as('ana@exemple.test');
    const mod = await db.select<AppNotification>({ table: 'notifications', filters: [eq('category', 'community_moderation')] });
    expect(mod[0].title).toMatch(/masqué/);
    await as('bea@exemple.test');
    await db.rpc('report_member', { p_handle: 'ana_du_sud', p_reason: 'harassment' });
    await expect(db.rpc('report_member', { p_handle: 'ana_du_sud', p_reason: 'harassment' })).rejects.toThrow(/déjà signalé/);
    await db.rpc('block_member', { p_handle: '@ana_du_sud' });
    expect((await db.rpc<CommunityMember>('community_member', { p_handle: 'ana_du_sud' })).blocked).toBe(true);
    expect((await db.select<FeedPost>({ table: 'forum_feed' })).some((x) => x.id === p.id)).toBe(false);
    await as('ana@exemple.test');
    expect((await db.rpc<CommunityMember>('community_member', { p_handle: 'bea_lune' })).unavailable).toBe(true);
  });
});
