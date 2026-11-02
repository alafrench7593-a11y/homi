/**
 * Campagne QA, lot E (E-01, E-02, E-05) : les fils lus par fonctions serveur (community_feed, member_posts,
 * member_comments) renvoient exactement ce que renvoyaient les vues filtrées ; la liste d'articles sans texte
 * garde la même règle d'affichage en anglais.
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

import { createDemoBackend } from '@/lib/backend/demo';
import { eq, type Query } from '@/lib/backend/types';
import { ARTICLE_LIST_COLUMNS, localizeArticle } from '@/lib/data/hooks';
import type { Article, ArticleSummary, FeedComment, FeedPost, Forum } from '@/lib/types';

describe('fils de la communauté : fonctions serveur = anciennes requêtes sur les vues', () => {
  const db = createDemoBackend({ streamDelayMs: 0 });
  const PW = 'MotDePasse!2026';
  const me = async () => (await db.auth.getSession())!.userId;
  const as = async (email: string) => { await db.auth.signOut(); await db.auth.signIn(email, PW); };
  const ids = (rows: { id: string }[]) => rows.map((r) => r.id);
  // Requêtes exactes des hooks avant la correction (vue + filtre + tri date décroissante + limit 100)
  const viewQuery = (table: string, filters: Query['filters']): Query => ({ table, filters, order: [{ col: 'created_at', asc: false }, { col: 'id', asc: false }], limit: 100 });

  it('prépare : trois membres, publication anonyme, commentaires, blocage', async () => {
    const forums = await db.select<Forum>({ table: 'forums' });
    const forum = (slug: string) => forums.find((f) => f.slug === slug)!.id;
    for (const [email, pseudonym] of [['fp-ana@exemple.test', 'Fp Ana'], ['fp-bea@exemple.test', 'Fp Bea'], ['fp-cleo@exemple.test', 'Fp Cleo']]) {
      await db.auth.signUp(email, PW);
      await db.insert('community_profiles', { user_id: await me(), pseudonym });
    }
    await as('fp-ana@exemple.test');
    const [signed] = await db.insert<FeedPost>('posts', { forum_id: forum('sommeil'), body: 'Les siestes du matin raccourcissent, normal ?' });
    const [anon] = await db.insert<FeedPost>('posts', { forum_id: forum('post-partum'), body: 'Je me sens seule le soir.', anonymous: true });
    await db.insert('comments', { post_id: anon.id, body: 'Merci pour vos messages.' }); // réponse anonyme de l'autrice
    await db.insert('comments', { post_id: signed.id, body: 'Précision : elle a 7 mois.' });
    await as('fp-cleo@exemple.test');
    await db.insert('posts', { forum_id: forum('sommeil'), body: 'Rituel du coucher : vos idées ?' });
    await db.insert('comments', { post_id: signed.id, body: 'Chez nous aussi, vers 7 mois.' });
    await as('fp-bea@exemple.test');
    await db.rpc('block_member', { p_handle: 'fp_cleo' });
  });

  it.each(['fp-ana@exemple.test', 'fp-bea@exemple.test', 'fp-cleo@exemple.test'])('mêmes lignes et même ordre pour %s', async (email) => {
    await as(email);
    const forums = await db.select<Forum>({ table: 'forums' });
    const sommeil = forums.find((f) => f.slug === 'sommeil')!.id;
    expect(ids(await db.rpc<FeedPost[]>('community_feed', { p_forum: null, p_limit: 100 }))).toEqual(ids(await db.select<FeedPost>(viewQuery('forum_feed', []))));
    expect(ids(await db.rpc<FeedPost[]>('community_feed', { p_forum: sommeil, p_limit: 100 }))).toEqual(ids(await db.select<FeedPost>(viewQuery('forum_feed', [eq('forum_id', sommeil)]))));
    for (const handle of ['fp_ana', 'fp_bea', 'fp_cleo', 'inconnu']) {
      expect(await db.rpc<FeedPost[]>('member_posts', { p_handle: handle, p_limit: 100 })).toEqual(await db.select<FeedPost>(viewQuery('forum_feed', [eq('author_handle', handle)])));
      expect(await db.rpc<FeedComment[]>('member_comments', { p_handle: handle, p_limit: 100 })).toEqual(await db.select<FeedComment>(viewQuery('comment_feed', [eq('author_handle', handle)])));
    }
  });

  it('anonymat et blocage conservés', async () => {
    await as('fp-bea@exemple.test');
    const anaPosts = await db.rpc<FeedPost[]>('member_posts', { p_handle: 'fp_ana', p_limit: 100 });
    expect(anaPosts).toHaveLength(1);
    expect(anaPosts.every((p) => !p.anonymous)).toBe(true);
    expect((await db.rpc<FeedComment[]>('member_comments', { p_handle: 'fp_ana', p_limit: 100 })).map((c) => c.body)).toEqual(['Précision : elle a 7 mois.']);
    expect(await db.rpc<FeedPost[]>('member_posts', { p_handle: 'fp_cleo', p_limit: 100 })).toEqual([]);
    expect(await db.rpc<FeedComment[]>('member_comments', { p_handle: 'fp_cleo', p_limit: 100 })).toEqual([]);
    expect((await db.rpc<FeedPost[]>('community_feed', { p_forum: null, p_limit: 100 })).some((p) => p.author_handle === 'fp_cleo')).toBe(false);
    expect(await db.rpc<FeedPost[]>('community_feed', { p_forum: null, p_limit: 1 })).toHaveLength(1);
  });
});

describe('articles : liste sans texte', () => {
  const base: ArticleSummary = {
    id: 'a1', slug: 'sommeil-bebe', category_id: null, title: 'Le sommeil de bébé', summary: 'Résumé', journeys: [], min_week: null, max_week: null,
    min_age_months: null, max_age_months: null, postpartum: false, tags: [], author_name: null, reviewer_name: null, reviewer_qualification: null,
    validated_at: null, updated_on: '2026-11-01', status: 'published', is_premium: false, is_safety_critical: false, title_en: 'Baby sleep', summary_en: 'Summary',
  };
  it('la liste ne demande ni le texte ni les sources', () => {
    const cols = ARTICLE_LIST_COLUMNS.split(',');
    expect(cols).not.toEqual(expect.arrayContaining(['body_md']));
    expect(cols.filter((c) => c.startsWith('body_md') || c === 'sources')).toEqual([]);
    expect(cols).toEqual(expect.arrayContaining(['id', 'slug', 'title', 'summary', 'tags', 'journeys', 'is_premium', 'is_safety_critical', 'updated_on', 'title_en', 'summary_en', 'english_ready']));
  });
  it('anglais seulement si titre ET texte anglais existent (même règle qu’avant)', () => {
    expect(localizeArticle({ ...base, english_ready: true }, 'en')).toMatchObject({ title: 'Baby sleep', summary: 'Summary' });
    expect(localizeArticle({ ...base, english_ready: false }, 'en').title).toBe('Le sommeil de bébé');
    expect(localizeArticle({ ...base, english_ready: true }, 'fr').title).toBe('Le sommeil de bébé');
    const full: Article = { ...base, body_md: 'Texte', body_md_en: 'Text', sources: [] };
    expect(localizeArticle(full, 'en')).toMatchObject({ title: 'Baby sleep', body_md: 'Text' });
    expect(localizeArticle({ ...full, body_md_en: '' }, 'en')).toMatchObject({ title: 'Le sommeil de bébé', body_md: 'Texte' });
    expect(localizeArticle({ ...full, title_en: null }, 'en').body_md).toBe('Texte');
  });
});
