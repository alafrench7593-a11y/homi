/**
 * Communauté de bout en bout sur le moteur local (mode démonstration) :
 * espaces, publication, commentaires, réponses, notifications, recherche,
 * favoris, pseudonyme, signalement, blocage, modération.
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

import { createDemoBackend } from '@/lib/backend/demo';
import { eq, inList } from '@/lib/backend/types';
import { pseudonymError, splitSpaces, threadComments } from '@/lib/data/hooks-community';
import type { AppNotification, FeedComment, FeedPost, Forum } from '@/lib/types';

const SPACES = [
  'Suivi du cycle', 'Projet bébé', 'Grossesse', 'Jumeaux et triplés', 'Nouveau-né', 'Allaitement', 'Biberon', 'Sommeil',
  'Diversification et repas', 'Santé et développement', 'Troubles neurodéveloppementaux', 'Post-partum et bien-être de la mère',
  'Parents de plusieurs enfants', 'Questions générales',
];
const PW = 'MotDePasse!2026';

describe('communauté (moteur local)', () => {
  const db = createDemoBackend();
  let forums: Forum[] = [];
  const space = (slug: string) => forums.find((f) => f.slug === slug)!;
  const me = async () => (await db.auth.getSession())!.userId;
  const as = async (email: string) => {
    await db.auth.signOut();
    await db.auth.signIn(email, PW);
  };
  const feed = () => db.select<FeedPost>({ table: 'forum_feed', order: [{ col: 'created_at', asc: false }] });
  const comments = (postId: string) => db.select<FeedComment>({ table: 'comment_feed', filters: [eq('post_id', postId)], order: [{ col: 'created_at' }] });
  const notifs = (category: string) => db.select<AppNotification>({ table: 'notifications', filters: [eq('category', category)] });
  let post: FeedPost;
  let hugoComment: FeedComment;
  let inesReply: FeedComment;

  it('14 catégories, dans l’ordre', async () => {
    forums = await db.select<Forum>({ table: 'forums', order: [{ col: 'position' }] });
    expect(forums.map((f) => f.title)).toEqual(SPACES);
    // Les exemples de la démonstration sont répartis dans les nouveaux espaces
    await db.auth.signUp('lea@exemple.test', PW);
    const posts = await feed();
    expect(new Set(posts.map((p) => p.forum_id)).size).toBeGreaterThanOrEqual(8);
    expect(posts.every((p) => forums.some((f) => f.id === p.forum_id))).toBe(true);
  });

  it('« Mes espaces » d’après le parcours, tous les autres restent ouverts', () => {
    const { mine, others } = splitSpaces(forums, ['ttc']);
    expect(mine.map((f) => f.slug)).toEqual(['projet-bebe']);
    expect(others).toHaveLength(13);
    expect(others.map((f) => f.slug)).toContain('nouveau-ne');
    expect(splitSpaces(forums, []).mine).toHaveLength(0);
  });

  it('pseudonyme requis, jamais le prénom ni l’e-mail', async () => {
    await db.auth.signUp('ines@exemple.test', PW);
    await db.update('profiles', { display_name: 'Inès', journeys: ['ttc'] }, [eq('id', await me())]);
    await expect(db.insert('posts', { forum_id: space('grossesse').id, title: 'Bonjour', body: 'Test' })).rejects.toThrow(/pseudonyme/);
    await expect(db.insert('community_profiles', { pseudonym: 'ines' })).rejects.toThrow(/différent/);
    await expect(db.insert('community_profiles', { pseudonym: 'inès' })).rejects.toThrow(/différent/);
    await expect(db.insert('community_profiles', { pseudonym: 'Maïa_et_Sohan' })).rejects.toThrow(/existe/);
    expect(pseudonymError('ines', { email: 'ines@exemple.test' })).toMatch(/différent/);
    expect(pseudonymError('x', {})).toMatch(/3 à 24/);
    expect(pseudonymError('Ines_en_projet', { displayName: 'Inès', email: 'ines@exemple.test' })).toBeNull();
    await db.insert('community_profiles', { user_id: await me(), pseudonym: 'Ines_en_projet' });
  });

  it('publication dans un espace hors de son parcours (Projet bébé → Nouveau-né)', async () => {
    [post] = await db.insert<FeedPost>('posts', { forum_id: space('nouveau-ne').id, title: 'Organiser la chambre', body: 'Comment avez-vous organisé la chambre de bébé ?' });
    expect(post.status).toBe('visible');
    const mine = (await feed()).find((p) => p.id === post.id)!;
    expect(mine).toMatchObject({ is_mine: true, pseudonym: 'Ines_en_projet' });
    expect(JSON.stringify(mine)).not.toMatch(/ines@exemple/);
    const perSpace = await db.select<FeedPost>({ table: 'forum_feed', filters: [eq('forum_id', space('nouveau-ne').id)] });
    expect(perSpace.map((p) => p.id)).toContain(post.id);
  });

  it('recherche : insensible à la casse et aux accents, filtrable par espace', async () => {
    const r1 = await db.rpc<FeedPost[]>('search_posts', { p_query: 'CHAMBRE' });
    expect(r1.map((p) => p.id)).toContain(post.id);
    const r2 = await db.rpc<FeedPost[]>('search_posts', { p_query: 'reveil' });
    expect(r2.some((p) => (p.title ?? '').startsWith('Réveils'))).toBe(true);
    expect(await db.rpc<FeedPost[]>('search_posts', { p_query: 'chambre', p_forum: space('sommeil').id })).toHaveLength(0);
    expect(await db.rpc<FeedPost[]>('search_posts', { p_query: 'c' })).toHaveLength(0);
  });

  it('commentaire → notification à l’autrice de la publication', async () => {
    await db.auth.signUp('hugo@exemple.test', PW);
    await db.insert('community_profiles', { user_id: await me(), pseudonym: 'PapaHugo' });
    [hugoComment] = await db.insert<FeedComment>('comments', { post_id: post.id, body: 'Un lit, une commode, et c’est tout !' });
    await as('ines@exemple.test');
    const n = await notifs('community_comment');
    expect(n).toHaveLength(1);
    expect(n[0]).toMatchObject({ title: 'PapaHugo a commenté votre publication', deep_link: `/community/post/${post.id}?comment=${hugoComment.id}` });
  });

  it('réponse à un commentaire → notification community_reply', async () => {
    [inesReply] = await db.insert<FeedComment>('comments', { post_id: post.id, parent_id: hugoComment.id, body: 'Merci beaucoup !' });
    expect(inesReply.parent_id).toBe(hugoComment.id);
    expect(await notifs('community_reply')).toHaveLength(0); // pas de notification pour soi-même
    await as('hugo@exemple.test');
    const n = await notifs('community_reply');
    expect(n).toHaveLength(1);
    expect(n[0].title).toBe('Ines_en_projet a répondu à votre commentaire');
  });

  it('réponse à une réponse : un seul niveau, la personne visée est notifiée une fois', async () => {
    const [r] = await db.insert<FeedComment>('comments', { post_id: post.id, parent_id: inesReply.id, body: 'Avec plaisir.' });
    expect(r.parent_id).toBe(hugoComment.id);
    await as('ines@exemple.test');
    expect(await notifs('community_reply')).toHaveLength(1);
    expect(await notifs('community_comment')).toHaveLength(1); // pas de doublon
    const threads = threadComments(await comments(post.id));
    expect(threads).toHaveLength(1);
    expect(threads[0].replies.map((c) => c.body)).toEqual(['Merci beaucoup !', 'Avec plaisir.']);
    expect((await feed()).find((p) => p.id === post.id)!.comment_count).toBe(3);
    const [other] = await db.insert<FeedPost>('posts', { forum_id: space('sommeil').id, title: 'Autre sujet', body: 'Rien à voir' });
    await expect(db.insert('comments', { post_id: other.id, parent_id: hugoComment.id, body: 'Mauvais fil' })).rejects.toThrow(/introuvable/);
  });

  it('favoris : enregistrer, lister, retirer', async () => {
    const target = (await feed()).find((p) => !p.is_mine)!;
    await db.insert('saved_posts', { post_id: target.id, user_id: await me() }, { onConflict: 'post_id,user_id', ignoreDuplicates: true });
    await db.insert('saved_posts', { post_id: target.id, user_id: await me() }, { onConflict: 'post_id,user_id', ignoreDuplicates: true });
    const saved = await db.select<FeedPost>({ table: 'forum_feed', filters: [eq('saved', true)] });
    expect(saved.map((p) => p.id)).toEqual([target.id]);
    await db.remove('saved_posts', [eq('post_id', target.id), eq('user_id', await me())]);
    expect(await db.select({ table: 'forum_feed', filters: [eq('saved', true)] })).toHaveLength(0);
  });

  it('blocage : contenus masqués dans les deux sens, recherche comprise, puis déblocage', async () => {
    await as('hugo@exemple.test');
    const [hugoPost] = await db.insert<FeedPost>('posts', { forum_id: space('sommeil').id, title: 'Rituel du coucher', body: 'Bain, histoire, câlin.' });
    const hugoId = await me();
    await as('ines@exemple.test');
    expect((await feed()).some((p) => p.id === hugoPost.id)).toBe(true);
    await db.rpc('block_author', { p_comment: hugoComment.id });
    await db.rpc('block_author', { p_comment: hugoComment.id }); // idempotent
    expect(await db.select({ table: 'user_blocks' })).toHaveLength(1);
    expect((await feed()).some((p) => p.id === hugoPost.id)).toBe(false);
    expect((await comments(post.id)).some((c) => c.pseudonym === 'PapaHugo')).toBe(false);
    expect(await db.rpc<FeedPost[]>('search_posts', { p_query: 'rituel' })).toHaveLength(0);
    // Les réponses d'Inès restent visibles pour elle, même sans le commentaire parent
    expect(threadComments(await comments(post.id)).map((t) => t.root.body)).toEqual(['Merci beaucoup !']);
    await as('hugo@exemple.test');
    expect((await feed()).some((p) => p.id === post.id)).toBe(false);
    await expect(db.insert('comments', { post_id: post.id, parent_id: inesReply.id, body: 'Test' })).rejects.toThrow(/Impossible/);
    await as('ines@exemple.test');
    await db.remove('user_blocks', [eq('blocker_id', await me()), eq('blocked_id', hugoId)]);
    expect((await feed()).some((p) => p.id === hugoPost.id)).toBe(true);
  });

  it('signalement avec motif, masquage automatique au 3e, file de modération et rétablissement', async () => {
    await as('hugo@exemple.test');
    const [target] = await db.insert<FeedPost>('posts', { forum_id: space('biberon').id, title: 'Publication signalée', body: 'Contenu discutable' });
    for (const [i, email] of ['ines@exemple.test', 'lea@exemple.test', 'sam@exemple.test'].entries()) {
      if (i < 2) await as(email);
      else { await db.auth.signOut(); await db.auth.signUp(email, PW); }
      await db.insert('reports', { post_id: target.id, reason: i === 0 ? 'spam' : 'inappropriate', details: 'Test' });
      if (i === 0) await expect(db.insert('reports', { post_id: target.id, reason: 'spam' })).rejects.toThrow(/déjà signalé/);
    }
    expect((await feed()).some((p) => p.id === target.id)).toBe(false);
    const queue = await db.select<{ id: string; status: string; report_count: number }>({ table: 'posts', filters: [inList('status', ['hidden', 'pending_review'])] });
    expect(queue.find((p) => p.id === target.id)).toMatchObject({ status: 'hidden', report_count: 3 });
    await db.rpc('moderate', { p_action: 'restore', p_post: target.id });
    expect((await feed()).some((p) => p.id === target.id)).toBe(true);
    expect((await db.select<{ status: string }>({ table: 'reports' })).every((r) => r.status === 'resolved')).toBe(true);
  });

  it('signalement d’un commentaire', async () => {
    const [c] = await comments(post.id);
    await db.insert('reports', { comment_id: c.id, reason: 'harassment' });
    const raw = await db.select<{ id: string; report_count: number }>({ table: 'comments', filters: [eq('id', c.id)] });
    expect(raw[0].report_count).toBe(1);
  });

  it('modération : termes interdits bloqués, termes sensibles mis en relecture et absents de la recherche', async () => {
    await as('lea@exemple.test');
    await db.insert('community_profiles', { user_id: await me(), pseudonym: 'Lea_attend' });
    await expect(db.insert('posts', { forum_id: space('allaitement').id, title: 'Promo', body: 'Gagnez au casino' })).rejects.toThrow(/règles/);
    const [p] = await db.insert<FeedPost>('posts', { forum_id: space('allaitement').id, title: 'Surplus', body: 'Je vends mon lait maternel congelé' });
    expect(p.status).toBe('pending_review');
    expect(await db.rpc<FeedPost[]>('search_posts', { p_query: 'lait maternel' })).toHaveLength(0);
    await expect(db.insert('comments', { post_id: p.id, body: 'Test' })).rejects.toThrow(/commentaires/);
  });

  it('suppression d’un commentaire : ses réponses partent avec lui', async () => {
    await as('hugo@exemple.test');
    await db.remove('comments', [eq('id', hugoComment.id)]);
    await as('ines@exemple.test');
    expect(await comments(post.id)).toHaveLength(0);
    expect((await feed()).find((p) => p.id === post.id)!.comment_count).toBe(0);
  });
});
