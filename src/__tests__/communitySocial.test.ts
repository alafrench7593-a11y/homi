/**
 * Mini-réseau social : règles pures (mentions, groupes par mois, fil personnalisé, abonnements, sondages),
 * résumé quotidien, résumé et traduction de la communauté (contrôles de prudence) et moteur local (démonstration).
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

import { createDemoBackend } from '@/lib/backend/demo';
import { eq } from '@/lib/backend/types';
import {
  COMMUNITY_FREE, cohortName, cohortSuggestions, completeMention, extractMentions, hintCategories, mentionQuery, personalizedOrder, pinnedFirst,
  pollOptionsError, pollPercent, recommendedDiscussions, splitMentions, subscriptionsFeed, type FeedPostLike,
} from '@/lib/domain/communitySocial';
import { buildDigest, DIGEST_NOTIFICATION, parseTime, questionOfDay } from '@/lib/domain/dailyDigest';
import { checkSummary, checkTranslation, extractiveSummary, neutralize, parseRequest } from '../../supabase/functions/_shared/community-ai';
import { runSummary, runTranslation } from '../../supabase/functions/_shared/community-ai-run';
import type { AppNotification, FeedPost } from '@/lib/types';

const NOW = new Date('2026-10-22T09:00:00');

describe('mentions', () => {
  it('extraction (5 au plus, sans doublon, pas les adresses e-mail)', () => {
    expect(extractMentions('Merci @Lou_Nuit et @iris ! Écris à moi@exemple.fr @lou_nuit')).toEqual(['lou_nuit', 'iris']);
    expect(extractMentions('@aaa @bbb @ccc @ddd @eee @fff')).toHaveLength(5);
  });
  it('saisie en cours et complétion', () => {
    expect(mentionQuery('Bonjour @ma')).toBe('ma');
    expect(mentionQuery('Bonjour @ma ')).toBeNull();
    expect(completeMention('Bonjour @ma', 'maia_et_sohan')).toBe('Bonjour @maia_et_sohan ');
  });
  it('découpage pour afficher les liens', () => {
    expect(splitMentions('Merci @lou_nuit !')).toEqual([{ text: 'Merci ' }, { text: '@lou_nuit', handle: 'lou_nuit' }, { text: ' !' }]);
  });
});

describe('groupes par mois de naissance ou de terme', () => {
  it('nom identique à celui du serveur', () => {
    expect(cohortName('birth', '2026-03')).toBe('Bébés nés en mars 2026');
    expect(cohortName('due', '2027-01')).toBe('Terme prévu en janvier 2027');
  });
  it('propositions : seulement le mois, dans les limites du serveur', () => {
    const s = cohortSuggestions({ childBirthDates: ['2026-03-14', '2019-01-02', '2026-03-30'], dueDate: '2027-02-10' }, NOW);
    expect(s.map((x) => `${x.type}:${x.month}`)).toEqual(['due:2027-02', 'birth:2026-03']);
    expect(JSON.stringify(s)).not.toContain('14');
  });
});

describe('fil personnalisé', () => {
  const p = (id: string, forum: string, hoursAgo: number, extra: Partial<FeedPostLike> = {}): FeedPostLike => ({
    id, forum_id: forum, forum_slug: forum, created_at: new Date(NOW.getTime() - hoursAgo * 3_600_000).toISOString(), like_count: 0, comment_count: 0, ...extra,
  });
  const posts = [p('a', 'questions-generales', 1), p('b', 'sommeil', 3), p('c', 'grossesse', 4, { following_author: true }), p('d', 'biberon', 2, { group_id: 'g1', group_kind: 'private' }), p('e', 'post-partum', 2, { following_author: true, anonymous: true })];
  it('catégories utiles selon l’âge et la grossesse (calcul local)', () => {
    expect(hintCategories([2], null)).toContain('allaitement');
    expect(hintCategories([9], null)).toContain('diversification');
    expect(hintCategories([], 34)).toEqual(expect.arrayContaining(['grossesse', 'nouveau-ne']));
  });
  it('« Pour vous » : catégories suivies et membres suivis remontent ; groupes privés exclus', () => {
    const order = personalizedOrder(posts, { journeyForumIds: [], subscribedForumIds: ['sommeil'] }, NOW).map((x) => x.id);
    expect(order).not.toContain('d');
    expect(order.indexOf('b')).toBeLessThan(order.indexOf('a'));
    expect(order.indexOf('c')).toBeLessThan(order.indexOf('a'));
  });
  it('sujets consultés et âge de l’enfant influencent l’ordre', () => {
    const order = personalizedOrder([p('x', 'questions-generales', 1), p('y', 'diversification', 1)], { journeyForumIds: [], subscribedForumIds: [], childAgesMonths: [9] }, NOW);
    expect(order[0].id).toBe('y');
    const byViews = personalizedOrder([p('x', 'questions-generales', 1), p('y', 'biberon', 1)], { journeyForumIds: [], subscribedForumIds: [], topicViews: { biberon: 12 } }, NOW);
    expect(byViews[0].id).toBe('y');
  });
  it('« Abonnements » : jamais via une publication anonyme', () => {
    const feed = subscriptionsFeed(posts, { subscribedForumIds: [], groupIds: ['g1'] }).map((x) => x.id);
    expect(feed).toEqual(['d', 'c']);
  });
  it('discussions recommandées : questions pertinentes qui attendent des réponses', () => {
    const list = [p('q1', 'sommeil', 5, { comment_count: 0 }), p('q2', 'sommeil', 2, { comment_count: 8 }), p('q3', 'grossesse', 1), p('q4', 'sommeil', 1, { is_mine: true })];
    expect(recommendedDiscussions(list, { journeyForumIds: [], subscribedForumIds: ['sommeil'] }, NOW).map((x) => x.id)).toEqual(['q1']);
  });
  it('publications épinglées en premier', () => {
    expect(pinnedFirst([{ id: 1 }, { id: 2, pinned_at: '2026-10-01' }] as { id: number; pinned_at?: string }[]).map((x) => x.id)).toEqual([2, 1]);
  });
  it('sondages', () => {
    expect(pollOptionsError(['Oui'])).toMatch(/deux choix/);
    expect(pollOptionsError(['Oui', 'oui'])).toMatch(/identiques/);
    expect(pollOptionsError(['Oui', 'Non'])).toBeNull();
    expect(pollPercent(1, 3)).toBe(33);
  });
  it('version gratuite : la communauté de base reste gratuite', () => {
    for (const x of ['Suivre des membres et des catégories', 'Signaler et bloquer', 'Commenter, répondre, aimer']) expect(COMMUNITY_FREE).toContain(x);
  });
});

describe('résumé du matin et du soir', () => {
  it('matin : rendez-vous du jour, sieste estimée, biberon, réponses, question facultative', () => {
    const d = buildDigest({ moment: 'morning', now: NOW, firstName: 'Sarah', childName: 'Lina', childId: 'c1',
      events: [{ title: 'Pédiatre', at: '2026-10-22T14:30:00' }, { title: 'Vaccin', at: '2026-10-25T10:00:00' }],
      nextNap: { at: '2026-10-22T10:15:00' }, nextBottle: { at: '2026-10-22T11:00:00' }, unreadReplies: 2, groupPosts: 0 });
    expect(d.title).toBe('Bonjour, Sarah');
    expect(d.items.map((x) => x.key)).toEqual(['events', 'sleep', 'bottle', 'replies', 'question']);
    expect(d.items[0].detail).toBe('Pédiatre à 14 h 30');
    expect(d.items[1].title).toBe('Prochaine sieste estimée vers 10 h 15');
    expect(d.items[1].link).toBe('/sleep/c1');
  });
  it('rubriques masquées, question désactivée, aperçu Premium du rythme de sommeil', () => {
    const d = buildDigest({ moment: 'morning', now: NOW, hidden: ['events'], questionEnabled: false, childName: 'Lina', sleepPlannerTeaser: true, events: [{ title: 'X', at: '2026-10-22T14:00:00' }] });
    expect(d.items.map((x) => x.key)).toEqual(['sleep']);
    expect(d.items[0]).toMatchObject({ title: 'Découvrez le rythme personnalisé de Lina', premium: true });
  });
  it('soir : bilan sans reproche (rien de noté = rien affiché)', () => {
    const empty = buildDigest({ moment: 'evening', now: NOW, questionEnabled: false, day: { bottles: 0, bottleMl: 0, feeds: 0, diapers: 0, sleepMinutes: 0, meals: 0 } });
    expect(empty.items).toEqual([]);
    expect(JSON.stringify(empty)).not.toMatch(/rien noté|oubli|pensez à/i);
    const d = buildDigest({ moment: 'evening', now: NOW, questionEnabled: false, childName: 'Lina', day: { bottles: 5, bottleMl: 720, feeds: 0, diapers: 6, sleepMinutes: 795, meals: 2 } });
    expect(d.items[0].detail).toBe('5 biberons (720 ml) · 6 changes · 13 h 15 de sommeil · 2 repas');
  });
  it('notifications génériques (rien de personnel sur l’écran verrouillé) et heure valide', () => {
    expect(DIGEST_NOTIFICATION.morning.body).not.toMatch(/Lina|biberon|ml/);
    expect(parseTime('07:30')).toEqual({ hour: 7, minute: 30 });
    expect(parseTime('25:00')).toBeNull();
    expect(questionOfDay(NOW, 'baby')).toBe(questionOfDay(new Date('2026-10-22T20:00:00'), 'baby'));
  });
});

describe('résumé et traduction de la communauté (serveur)', () => {
  it('demande validée ; mentions, e-mails et numéros neutralisés', () => {
    expect(parseRequest({ action: 'delete', post_id: 'x' })).toBeNull();
    expect(parseRequest({ action: 'translate', post_id: '0b6a3f5e-1111-4222-8333-944444444444', target_lang: 'en' })?.target_lang).toBe('en');
    expect(neutralize('Merci @lou_nuit, écris-moi à a@b.fr ou au 06 12 34 56 78')).toBe('Merci @membre, écris-moi à [e-mail retiré] ou au [numéro retiré]');
  });
  it('contrôles de prudence : promesse, posologie ou pseudonyme refusés', () => {
    expect(checkSummary('{"points":["Plusieurs parents racontent avoir décalé le coucher."],"caution":null}').ok).toBe(true);
    expect(checkSummary('{"points":["C’est sans risque pour bébé."]}')).toEqual({ ok: false, reason: 'promesse' });
    expect(checkSummary('{"points":["Donner 15 mg/kg."]}')).toEqual({ ok: false, reason: 'promesse' });
    expect(checkSummary('{"points":["PapaDeNour conseille de…"]}', ['PapaDeNour'])).toEqual({ ok: false, reason: 'pseudonyme' });
    expect(checkSummary('pas du json').ok).toBe(false);
    expect(checkTranslation('{"text":"Hello"}', 'Bonjour')).toEqual({ ok: true, text: 'Hello' });
  });
  it('sans clé configurée : jamais de faux résumé', async () => {
    expect((await runSummary(null, { body: 'x' }, [], [])).ai).toBe('not_configured');
    expect((await runTranslation(null, 'x', 'en')).ai).toBe('not_configured');
  });
  it('avec un service simulé : texte neutralisé envoyé, réponse contrôlée', async () => {
    let sent = '';
    const fakeFetch = (async (_url: string, init: { body: string }) => {
      sent = init.body;
      return { ok: true, status: 200, json: async () => ({ candidates: [{ content: { parts: [{ text: '{"points":["Plusieurs parents décrivent des réveils fréquents."],"caution":null}' }] }, finishReason: 'STOP' }] }) };
    }) as unknown as typeof fetch;
    const r = await runSummary({ apiKey: 'test', model: 'm' }, { title: 'Réveils', body: 'Merci @lou_nuit' }, Array.from({ length: 6 }, () => ({ body: 'Pareil chez nous.' })), ['Lou Nuit'], fakeFetch);
    expect(r).toMatchObject({ ai: 'ok', kind: 'summary', points: ['Plusieurs parents décrivent des réveils fréquents.'] });
    expect(sent).toContain('@membre');
    expect(sent).not.toContain('lou_nuit');
  });
  it('extraits sans IA (démonstration)', () => {
    expect(extractiveSummary([{ body: 'On a décalé le coucher de 20 minutes. Ça a aidé.' }, { body: 'Ok' }])).toEqual(['On a décalé le coucher de 20 minutes.']);
  });
});

describe('moteur local : suivre, groupes, sondages, mentions, Premium', () => {
  const db = createDemoBackend();
  const PW = 'MotDePasse!2026';
  const as = async (email: string) => { await db.auth.signOut(); await db.auth.signIn(email, PW); };
  const forum = async (slug: string) => (await db.select<{ id: string; slug: string }>({ table: 'forums' })).find((f) => f.slug === slug)!.id;

  beforeAll(async () => {
    for (const [email, pseudo, handle] of [['s1@exemple.test', 'Iris Soleil', 'iris_soleil'], ['s2@exemple.test', 'Noah Papa', 'noah_papa'], ['s3@exemple.test', 'Lou Nuit', 'lou_nuit']]) {
      await db.auth.signUp(email, PW);
      await db.insert('community_profiles', { user_id: (await db.auth.getSession())!.userId, pseudonym: pseudo, handle, rules_accepted_at: new Date().toISOString() });
      await db.auth.signOut();
    }
  });

  it('suivre un membre : notification, fil Abonnements, aucun nombre public', async () => {
    await as('s2@exemple.test');
    await db.rpc('follow_member', { p_handle: '@iris_soleil' });
    await expect(db.insert('member_follows', { followee_id: 'x' })).rejects.toBeTruthy();
    const m = await db.rpc<Record<string, unknown>>('community_member', { p_handle: 'iris_soleil' });
    expect(m.is_following).toBe(true);
    expect(m).not.toHaveProperty('followers_count');
    await db.insert('community_notification_prefs', { followed_post: true });
    await as('s1@exemple.test');
    expect((await db.rpc<{ followers_count: number }>('my_community_profile')).followers_count).toBe(1);
    await db.insert('posts', { forum_id: await forum('sommeil'), title: 'Nuits hachées', body: 'Des idées pour les réveils ? @lou_nuit' });
    await db.insert('posts', { forum_id: await forum('post-partum'), body: 'Certains soirs je me sens dépassée.', kind: 'testimony', anonymous: true });
    await as('s2@exemple.test');
    const feed = await db.select<FeedPost & { following_author: boolean }>({ table: 'forum_feed' });
    expect(feed.find((p) => p.title === 'Nuits hachées')?.following_author).toBe(true);
    expect(feed.find((p) => p.body.startsWith('Certains soirs'))?.following_author).toBe(false);
    const notes = await db.select<AppNotification>({ table: 'notifications', filters: [eq('category', 'community_follow')] });
    expect(notes).toHaveLength(1);
    await as('s3@exemple.test');
    expect(await db.select<AppNotification>({ table: 'notifications', filters: [eq('category', 'community_mention')] })).toHaveLength(1);
  });

  it('sondage : votes anonymes, un seul choix', async () => {
    await as('s2@exemple.test');
    const [post] = await db.insert<{ id: string }>('posts', { forum_id: await forum('biberon'), title: 'Température ?', body: 'Biberon tiède ou ambiant ?' });
    await db.insert('post_polls', { post_id: post.id });
    const opts = await db.insert<{ id: string }>('poll_options', [{ post_id: post.id, label: 'Tiède', position: 0 }, { post_id: post.id, label: 'Ambiant', position: 1 }]);
    await as('s1@exemple.test');
    await expect(db.rpc('vote_poll', { p_post: post.id, p_options: opts.map((o) => o.id) })).rejects.toThrow(/Un seul choix/);
    await db.rpc('vote_poll', { p_post: post.id, p_options: [opts[1].id] });
    const [row] = await db.select<{ poll: { total: number; options: { mine: boolean }[] } }>({ table: 'forum_feed', filters: [eq('id', post.id)] });
    expect(row.poll.total).toBe(1);
    expect(row.poll.options[1].mine).toBe(true);
    await as('s2@exemple.test');
    expect(await db.select({ table: 'poll_votes' })).toHaveLength(0);
  });

  it('groupes : thème, mois de naissance, groupe privé Premium sur invitation', async () => {
    await as('s1@exemple.test');
    const groups = await db.rpc<{ id: string; slug: string }[]>('community_groups_overview');
    await db.rpc('join_group', { p_group: groups.find((g) => g.slug === 'parents-solo')!.id });
    const cohort = await db.rpc<string>('join_cohort_group', { p_type: 'birth', p_month: '2026-05-01' });
    expect((await db.rpc<{ name: string }>('group_detail', { p_group: cohort })).name).toBe('Bébés nés en mai 2026');
    await expect(db.rpc('create_private_group', { p_name: 'Copines' })).rejects.toMatchObject({ hint: 'premium_required' });
    await db.rpc('set_demo_subscription', { active: true, period: 'monthly' });
    const gid = await db.rpc<string>('create_private_group', { p_name: 'Copines de la maternité' });
    await db.rpc('invite_to_group', { p_group: gid, p_handle: 'noah_papa' });
    await db.insert('posts', { forum_id: await forum('questions-generales'), group_id: gid, title: 'Parc samedi', body: 'On se retrouve au parc samedi ?' });
    await as('s3@exemple.test');
    expect((await db.select<FeedPost>({ table: 'forum_feed' })).some((p) => p.title === 'Parc samedi')).toBe(false);
    await expect(db.rpc('join_group', { p_group: gid })).rejects.toBeTruthy();
    await as('s2@exemple.test');
    const inv = await db.select<{ id: string }>({ table: 'group_invitations' });
    await db.rpc('respond_group_invitation', { p_invitation: inv[0].id, p_accept: true });
    expect((await db.select<FeedPost>({ table: 'forum_feed' })).some((p) => p.title === 'Parc samedi')).toBe(true);
  });

  it('Premium : profil personnalisé, badge facultatif, dossiers, albums, recherche avancée ; données conservées à la fin', async () => {
    await as('s3@exemple.test');
    const me = await db.rpc<{ user_id: string }>('my_community_profile');
    await expect(db.update('community_profiles', { accent: 'menthe' }, [eq('user_id', me.user_id)])).rejects.toMatchObject({ hint: 'premium_required' });
    await expect(db.insert('saved_folders', { name: 'Sommeil' })).rejects.toMatchObject({ hint: 'premium_required' });
    await expect(db.rpc('search_posts_advanced', { p_kind: 'poll' })).rejects.toMatchObject({ hint: 'premium_required' });
    await db.rpc('set_demo_subscription', { active: true, period: 'annual' });
    await db.update('community_profiles', { accent: 'menthe', about: 'Maman de jumeaux.', show_premium_badge: true }, [eq('user_id', me.user_id)]);
    expect((await db.rpc<{ premium_badge: boolean }>('community_member', { p_handle: 'lou_nuit' })).premium_badge).toBe(true);
    const [folder] = await db.insert<{ id: string }>('saved_folders', { name: 'Sommeil' });
    expect(folder.id).toBeTruthy();
    expect(await db.rpc<FeedPost[]>('search_posts_advanced', { p_kind: 'poll', p_forums: [await forum('biberon')] })).toHaveLength(1);
    const [album] = await db.insert<{ id: string }>('community_albums', { title: 'Premiers pas' });
    await db.rpc('share_album', { p_album: album.id, p_handle: 'iris_soleil' });
    await db.rpc('set_demo_subscription', { active: false });
    expect((await db.rpc<{ premium_badge: boolean; about: string }>('community_member', { p_handle: 'lou_nuit' }))).toMatchObject({ premium_badge: false, about: 'Maman de jumeaux.' });
    expect(await db.select({ table: 'saved_folders' })).toHaveLength(1);
    expect(await db.rpc<unknown[]>('my_albums')).toHaveLength(1);
    await as('s1@exemple.test');
    expect(await db.rpc<unknown[]>('my_albums')).toHaveLength(1);
    await as('s2@exemple.test');
    expect(await db.rpc<unknown[]>('my_albums')).toHaveLength(0);
  });

  it('blocage : les abonnements s’arrêtent ; recherche de membres', async () => {
    await as('s1@exemple.test');
    expect((await db.rpc<{ handle: string }[]>('search_members', { p_query: 'noah' }))[0].handle).toBe('noah_papa');
    await db.rpc('block_member', { p_handle: 'noah_papa' });
    await as('s2@exemple.test');
    expect(await db.rpc<unknown[]>('my_follows')).toHaveLength(0);
    expect(await db.rpc<unknown[]>('search_members', { p_query: 'iris' })).toHaveLength(0);
  });
});
