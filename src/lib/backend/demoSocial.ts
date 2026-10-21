/**
 * Démonstration (sans serveur) du mini-réseau social : mêmes règles que 20261023000100_community_social.sql.
 * Suivre un membre, catégories suivies, mentions, groupes (thèmes, mois, privés), épinglage, sondages,
 * dossiers et albums (Premium), sujets consultés, journal d'activité, ateliers, réglages du résumé quotidien.
 */
import { BackendError } from './types';
import { normalizeHandle, textNeedsReview } from '../domain/communityRules';
import { cohortName, extractMentions } from '../domain/communitySocial';
import { DIGEST_ITEMS } from '../domain/dailyDigest';

type Row = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

export interface SocialCtx {
  T: (name: string) => Row[];
  me: () => string | undefined;
  uid: () => string;
  uuid: () => string;
  nowIso: () => string;
  limit: (key: string) => number;
  isModerator: () => boolean;
  blockedBetween: (a: string, b: string) => boolean;
  notify: (userId: string, n: Row) => void;
  actorLabel: (userId: string, postId: string) => string;
}

const premiumRequired = (feature: string) => new BackendError(`Fonction Premium (${feature})`, 'P0001', 'premium_required');
const forbidden = (msg = 'Vous n’avez pas l’autorisation de faire cette action.') => new BackendError(msg, '42501');

export const THEME_GROUPS = [
  { slug: 'parents-solo', name: 'Parents solos', description: 'S’organiser seul·e avec ses enfants, trouver du relais, se soutenir.', icon: 'users' },
  { slug: 'retour-au-travail', name: 'Retour au travail', description: 'Mode de garde, tire-lait au bureau, organisation, fatigue.', icon: 'briefcase' },
  { slug: 'prematurite', name: 'Naissance prématurée', description: 'Néonatologie, retour à la maison, âge corrigé : des parents qui sont passés par là.', icon: 'heart' },
  { slug: 'allaitement-long', name: 'Allaitement après 6 mois', description: 'Allaitement prolongé, diversification, sevrage en douceur.', icon: 'drop' },
  { slug: 'papas', name: 'Papas', description: 'Un espace pour les pères et les coparents.', icon: 'user' },
  { slug: 'handicap-maladie', name: 'Enfant malade ou en situation de handicap', description: 'Démarches, soins, fatigue, fratrie : partager son quotidien.', icon: 'shield' },
];

/** Préférence de notification correspondant à un type (mêmes valeurs par défaut que community_notify). */
const PREF_DEFAULT: Record<string, boolean> = { mention: true, new_follower: true, followed_post: false, group_activity: true, group_invite: true };

export function createSocial(c: SocialCtx) {
  const { T } = c;
  const prof = (id: string) => T('community_profiles').find((p) => p.user_id === id);
  const byHandle = (h: unknown) => T('community_profiles').find((p) => p.handle === normalizeHandle(String(h ?? '')));
  const premiumOf = (userId: string | undefined) => {
    const s = T('subscriptions').find((r) => r.user_id === userId);
    return !!s && ['trial', 'active', 'grace', 'cancelled'].includes(s.status) && (!s.expires_at || s.expires_at > c.nowIso());
  };
  const assertPremium = (feature: string) => { if (!premiumOf(c.me())) throw premiumRequired(feature); };
  const requireProfile = (msg: string) => { if (!prof(c.uid())) throw new BackendError(msg, 'P0001', 'pseudonym_required'); };
  const notifyKind = (userId: string | undefined, kind: string, n: Row) => {
    if (!userId) return;
    const prefs = T('community_notification_prefs').find((x) => x.user_id === userId);
    const on = prefs && kind in prefs ? prefs[kind] !== false : PREF_DEFAULT[kind] ?? true;
    if (on) c.notify(userId, n);
  };

  // ---------------------------------------------------------------- groupes
  const group = (id: unknown) => T('community_groups').find((g) => g.id === id);
  const isMember = (groupId: unknown, userId = c.me()) => T('group_members').some((m) => m.group_id === groupId && m.user_id === userId);
  const canSeeGroup = (groupId: unknown, userId = c.me()) => {
    const g = group(groupId);
    return !!g && ((['theme', 'cohort'].includes(g.kind) && !g.archived) || isMember(groupId, userId) || c.isModerator());
  };
  const pendingInvite = (groupId: unknown, userId = c.me()) => T('group_invitations').find((i) => i.group_id === groupId && i.invited_id === userId && i.status === 'pending');
  const addMember = (groupId: string, userId: string, role = 'member') => {
    if (isMember(groupId, userId)) return;
    T('group_members').push({ group_id: groupId, user_id: userId, role, joined_at: c.nowIso() });
    const g = group(groupId); if (g) g.member_count = (g.member_count ?? 0) + 1;
  };
  const removeMember = (groupId: string, userId: string) => {
    const before = T('group_members').length;
    const rows = T('group_members');
    const idx = rows.findIndex((m) => m.group_id === groupId && m.user_id === userId);
    if (idx >= 0) rows.splice(idx, 1);
    const g = group(groupId); if (g && rows.length < before) g.member_count = Math.max(0, (g.member_count ?? 1) - 1);
  };

  function seed() {
    for (const g of THEME_GROUPS) {
      const ex = T('community_groups').find((x) => x.slug === g.slug);
      if (ex) Object.assign(ex, g);
      else T('community_groups').push({ id: c.uuid(), ...g, kind: 'theme', cohort_type: null, cohort_month: null, owner_id: null, member_count: 0, archived: false, created_at: c.nowIso() });
    }
    seedSamples();
  }

  /** Exemples de démonstration (additifs, idempotents) : sondage, groupe thématique, publication épinglée par la modération. */
  function seedSamples() {
    const forum = (slug: string) => T('forums').find((f) => f.slug === slug)?.id;
    if (!T('community_profiles').some((p) => p.user_id === 'demo-moderation')) {
      T('community_profiles').push({ user_id: 'demo-moderation', pseudonym: 'Modération', handle: 'moderation_toietmoi', bio: 'L’équipe qui veille au respect des règles.', avatar_preset: 'star', journey_label: null, visibility: 'members', suspended_until: null, created_at: new Date(Date.now() - 300 * 86_400_000).toISOString() });
      T('user_roles').push({ user_id: 'demo-moderation', role: 'moderator' });
    }
    const post = (o: Row) => {
      if (!o.forum_id || T('posts').some((x) => x.title === o.title)) return null;
      const row: Row = { id: c.uuid(), kind: 'question', anonymous: false, status: 'visible', report_count: 0, like_count: 0, comment_count: 0, edited_at: null, area_label: null, group_id: null, pinned_at: null, ...o };
      T('posts').push(row);
      return row;
    };
    const ago = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();
    post({ forum_id: forum('questions-generales'), author_id: 'demo-moderation', title: 'Bienvenue : nos règles en 5 points', created_at: ago(400), pinned_at: ago(400), like_count: 40,
      body: 'Bienvenue ! 1. Restez bienveillant·e. 2. Pas d’adresse, de numéro ni de date de naissance complète. 3. Les messages sur la santé sont des témoignages, pas des avis médicaux. 4. Signalez ce qui vous inquiète. 5. En cas d’urgence, appelez le 15 ou le 112.' });
    const poll = post({ forum_id: forum('sommeil'), author_id: 'demo-voisine-1', title: 'À quelle heure couchez-vous votre bébé ?', body: 'Petit sondage pour comparer nos soirées (bébés de 6 à 12 mois).', created_at: ago(6), like_count: 4 });
    if (poll) {
      T('post_polls').push({ post_id: poll.id, multiple: false, closes_at: null, created_at: poll.created_at });
      const labels = ['Avant 19 h 30', 'Entre 19 h 30 et 20 h 30', 'Après 20 h 30'];
      const opts = labels.map((label, position) => ({ id: c.uuid(), post_id: poll.id, label, position }));
      T('poll_options').push(...opts);
      T('poll_votes').push({ post_id: poll.id, option_id: opts[1].id, user_id: 'demo-voisin-2', created_at: ago(5) }, { post_id: poll.id, option_id: opts[0].id, user_id: 'demo-voisine-3', created_at: ago(4) });
    }
    const papas = T('community_groups').find((g) => g.slug === 'papas');
    if (papas) {
      if (!isMember(papas.id, 'demo-voisin-2')) addMember(papas.id, 'demo-voisin-2');
      post({ forum_id: forum('questions-generales'), author_id: 'demo-voisin-2', group_id: papas.id, title: 'Congé de paternité : vous l’avez pris comment ?', body: 'D’un bloc ou en plusieurs fois ? On hésite pour les jumeaux.', created_at: ago(14), like_count: 6 });
    }
  }

  /** Lecture d'une publication : règle des groupes (en plus des règles v2). */
  const postInGroupVisible = (p: Row, me = c.me()) => !p.group_id || canSeeGroup(p.group_id, me) || p.author_id === me;

  // ---------------------------------------------------------------- sondages, albums
  function pollSummary(postId: string): Row | null {
    const poll = T('post_polls').find((x) => x.post_id === postId);
    if (!poll) return null;
    const me = c.me();
    const votes = T('poll_votes').filter((v) => v.post_id === postId);
    return {
      multiple: !!poll.multiple, closes_at: poll.closes_at ?? null, closed: !!poll.closes_at && poll.closes_at < c.nowIso(),
      total: new Set(votes.map((v) => v.user_id)).size,
      options: T('poll_options').filter((o) => o.post_id === postId).sort((a, b) => a.position - b.position)
        .map((o) => ({ id: o.id, label: o.label, votes: votes.filter((v) => v.option_id === o.id).length, mine: votes.some((v) => v.option_id === o.id && v.user_id === me) })),
    };
  }
  const canReadAlbum = (albumId: unknown, me = c.me()) => {
    const a = T('community_albums').find((x) => x.id === albumId);
    return !!a && !!me && (a.owner_id === me || (T('album_shares').some((s) => s.album_id === a.id && s.user_id === me) && !c.blockedBetween(a.owner_id, me)));
  };
  const premiumBadge = (userId: string) => !!prof(userId)?.show_premium_badge && premiumOf(userId);

  /** Colonnes ajoutées aux fils (mêmes que la vue forum_feed). */
  function feedExtras(p: Row): Row {
    const me = c.me();
    const g = p.group_id ? group(p.group_id) : null;
    return {
      group_id: p.group_id ?? null, group_name: g?.name ?? null, group_kind: g?.kind ?? null, pinned_at: p.pinned_at ?? null,
      following_author: !p.anonymous && T('member_follows').some((f) => f.follower_id === me && f.followee_id === p.author_id),
      author_badge: p.anonymous ? false : premiumBadge(p.author_id),
      author_accent: p.anonymous ? null : prof(p.author_id)?.accent ?? null,
      saved_folder_id: T('saved_posts').find((s) => s.post_id === p.id && s.user_id === me)?.folder_id ?? null,
      poll: pollSummary(p.id),
    };
  }
  const commentExtras = (cm: Row, post: Row): Row => ({ author_badge: post.anonymous && cm.author_id === post.author_id ? false : premiumBadge(cm.author_id) });

  // ---------------------------------------------------------------- vues (lecture directe des tables)
  const OWN: Record<string, string> = {
    forum_subscriptions: 'user_id', saved_folders: 'user_id', community_topic_views: 'user_id', daily_digest_prefs: 'user_id',
    event_registrations: 'user_id', poll_votes: 'user_id', member_follows: 'follower_id', group_members: 'user_id',
  };
  function view(table: string): Row[] | undefined {
    const me = c.me();
    if (OWN[table]) return T(table).filter((r) => r[OWN[table]] === me);
    if (table === 'community_groups') return T(table).filter((g) => canSeeGroup(g.id) || !!pendingInvite(g.id));
    if (table === 'group_invitations') return T(table).filter((i) => i.invited_id === me || i.invited_by === me);
    if (table === 'post_polls' || table === 'poll_options') return T(table).filter((x) => { const p = T('posts').find((y) => y.id === x.post_id); return !!p && postInGroupVisible(p) && (p.status === 'visible' || p.author_id === me); });
    if (table === 'community_albums') return T(table).filter((a) => canReadAlbum(a.id));
    if (table === 'album_photos') return T(table).filter((a) => canReadAlbum(a.album_id));
    if (table === 'album_shares') return T(table).filter((s) => s.user_id === me || T('community_albums').some((a) => a.id === s.album_id && a.owner_id === me));
    if (table === 'community_events') return T(table).filter((e) => !e.archived).map(({ join_url: _j, ...rest }) => rest); // eslint-disable-line @typescript-eslint/no-unused-vars
    return undefined;
  }

  // ---------------------------------------------------------------- écritures
  function checkProfilePremium(next: Row, before?: Row) {
    if (next.about != null) next.about = String(next.about).trim() || null;
    if (next.about && String(next.about).length > 1200) throw new BackendError('Présentation enrichie : 1 200 caractères au plus.');
    if (next.accent != null && !['rose', 'lavande', 'menthe', 'peche', 'ciel', 'sable'].includes(next.accent)) throw new BackendError('Couleur indisponible.');
    if (next.banner != null && !['aube', 'nuit', 'prairie', 'ocean', 'nacre'].includes(next.banner)) throw new BackendError('Bannière indisponible.');
    const changed = (k: string) => k in next && next[k] != null && next[k] !== false && next[k] !== (before?.[k] ?? null);
    if ((changed('accent') || changed('banner') || changed('about') || (next.show_premium_badge === true && !before?.show_premium_badge)) && !premiumOf(before?.user_id ?? c.me())) {
      throw premiumRequired('community_profile');
    }
  }

  function beforeInsert(table: string, r: Row) {
    const me = c.me();
    switch (table) {
      case 'member_follows': case 'poll_votes': case 'album_shares': case 'community_topic_views':
      case 'group_members': case 'community_groups': case 'group_invitations':
        throw forbidden();
      case 'forum_subscriptions':
        r.user_id = me; r.created_at = c.nowIso();
        if (T(table).some((x) => x.user_id === me && x.forum_id === r.forum_id)) throw new BackendError('Catégorie déjà suivie.', '23505');
        break;
      case 'posts':
        r.group_id ??= null; r.pinned_at = null;
        if (r.group_id && !isMember(r.group_id, me)) throw forbidden('Rejoignez ce groupe pour y publier.');
        break;
      case 'comments': {
        const post = T('posts').find((p) => p.id === r.post_id);
        if (post?.group_id && !isMember(post.group_id, me)) throw forbidden('Rejoignez ce groupe pour répondre.');
        break;
      }
      case 'community_profiles':
        checkProfilePremium(r);
        r.accent ??= null; r.banner ??= null; r.about ??= null; r.show_premium_badge = !!r.show_premium_badge;
        break;
      case 'community_notification_prefs':
        for (const [k, v] of Object.entries(PREF_DEFAULT)) r[k] ??= v;
        break;
      case 'saved_folders':
        assertPremium('saved_folders');
        r.user_id = me; r.name = String(r.name ?? '').trim();
        if (!r.name || r.name.length > 40) throw new BackendError('Nom du dossier : 1 à 40 caractères.');
        if (T(table).filter((x) => x.user_id === me).length >= c.limit('saved_folders_count')) throw premiumRequired('saved_folders');
        r.created_at = c.nowIso();
        break;
      case 'saved_posts':
        r.folder_id ??= null;
        if (r.folder_id) { assertPremium('saved_folders'); if (!T('saved_folders').some((f) => f.id === r.folder_id && f.user_id === me)) throw forbidden(); }
        break;
      case 'post_polls': {
        const p = T('posts').find((x) => x.id === r.post_id);
        if (!p || p.author_id !== me) throw forbidden();
        if (T(table).some((x) => x.post_id === r.post_id)) throw new BackendError('Sondage déjà créé.', '23505');
        r.multiple = !!r.multiple; r.closes_at ??= null; r.created_at = c.nowIso();
        break;
      }
      case 'poll_options': {
        const p = T('posts').find((x) => x.id === r.post_id);
        if (!p || p.author_id !== me || !T('post_polls').some((x) => x.post_id === r.post_id)) throw forbidden();
        if (T('poll_votes').some((v) => v.post_id === r.post_id)) throw forbidden();
        if (T(table).filter((x) => x.post_id === r.post_id).length >= 6) throw new BackendError('6 choix au plus dans un sondage.');
        r.label = String(r.label ?? '').trim();
        if (!r.label || r.label.length > 80) throw new BackendError('Chaque choix : 1 à 80 caractères.');
        if (textNeedsReview(r.label)) throw new BackendError('Retirez les informations personnelles du choix.');
        break;
      }
      case 'community_albums':
        assertPremium('community_albums');
        r.owner_id = me; r.title = String(r.title ?? '').trim();
        if (!r.title || r.title.length > 80) throw new BackendError('Titre : 1 à 80 caractères.');
        if (T(table).filter((x) => x.owner_id === me).length >= c.limit('albums_count')) throw premiumRequired('community_albums');
        r.description ??= null; r.created_at = c.nowIso();
        break;
      case 'album_photos': {
        const a = T('community_albums').find((x) => x.id === r.album_id);
        if (!a || a.owner_id !== me || !String(r.path ?? '').startsWith(`${me}/album-`)) throw forbidden();
        assertPremium('community_albums');
        if (T(table).filter((x) => x.album_id === r.album_id).length >= 200) throw new BackendError('200 photos au plus par album.');
        r.owner_id = me; r.created_at = c.nowIso();
        break;
      }
      case 'event_registrations': {
        const e = T('community_events').find((x) => x.id === r.event_id);
        if (!e || e.archived || e.starts_at < c.nowIso()) throw new BackendError('Inscription impossible.');
        if (e.premium_only) assertPremium('community_events');
        if (e.capacity && T(table).filter((x) => x.event_id === e.id).length >= e.capacity) throw new BackendError('Cet atelier est complet.');
        r.user_id = me; r.created_at = c.nowIso();
        break;
      }
      case 'daily_digest_prefs':
        r.user_id = me;
        if (T(table).some((x) => x.user_id === me)) throw new BackendError('Réglages déjà enregistrés.', '23505');
        Object.assign(r, { morning: !!r.morning, morning_time: r.morning_time ?? '08:00', evening: !!r.evening, evening_time: r.evening_time ?? '20:30', question: r.question !== false, hidden_items: r.hidden_items ?? [], ...r });
        checkDigest(r);
        break;
    }
  }
  function checkDigest(r: Row) {
    if ((r.hidden_items ?? []).some((k: string) => !(DIGEST_ITEMS as readonly string[]).includes(k))) throw new BackendError('Rubrique inconnue.');
    r.updated_at = c.nowIso();
  }

  /** Mentions (5 au plus) : jamais pour une personne qui ne peut pas lire la publication. */
  function notifyMentions(author: string, post: Row, commentId: string | null, text: string, done: Set<string>) {
    for (const h of extractMentions(text)) {
      const target = T('community_profiles').find((p) => p.handle === h)?.user_id;
      if (!target || done.has(target) || c.blockedBetween(target, author)) continue;
      if (post.group_id && !isMember(post.group_id, target)) continue;
      notifyKind(target, 'mention', { category: 'community_mention', title: `${c.actorLabel(author, post.id)} vous a mentionné·e`, body: text.slice(0, 120),
        deep_link: `/community/post/${post.id}${commentId ? `?comment=${commentId}` : ''}`, payload: { post_id: post.id, comment_id: commentId } });
      done.add(target);
    }
  }

  function afterInsert(table: string, r: Row) {
    if (table === 'posts' && r.status === 'visible') {
      const done = new Set<string>([r.author_id]);
      notifyMentions(r.author_id, r, null, `${r.title ?? ''} ${r.body}`, done);
      const g = r.group_id ? group(r.group_id) : null;
      const who = prof(r.author_id)?.pseudonym ?? 'Quelqu’un';
      const link = `/community/post/${r.id}`;
      if (!r.anonymous && (!g || g.kind !== 'private')) {
        for (const f of T('member_follows').filter((x) => x.followee_id === r.author_id)) {
          if (done.has(f.follower_id) || c.blockedBetween(f.follower_id, r.author_id)) continue;
          notifyKind(f.follower_id, 'followed_post', { category: 'community_follow', title: `${who} a publié`, body: String(r.title ?? r.body).slice(0, 120), deep_link: link, payload: { post_id: r.id } });
          done.add(f.follower_id);
        }
      }
      if (g?.kind === 'private') {
        for (const m of T('group_members').filter((x) => x.group_id === g.id)) {
          if (done.has(m.user_id) || c.blockedBetween(m.user_id, r.author_id)) continue;
          const recent = T('notifications').some((n) => n.user_id === m.user_id && n.category === 'community_group' && n.payload?.group_id === g.id && n.payload?.post_id && Date.now() - Date.parse(n.created_at) < 6 * 3_600_000);
          if (recent) continue;
          notifyKind(m.user_id, 'group_activity', { category: 'community_group', title: `Nouvelle publication dans « ${g.name} »`, body: String(r.title ?? r.body).slice(0, 120), deep_link: link, payload: { post_id: r.id, group_id: g.id } });
        }
      }
    }
    if (table === 'comments' && r.status === 'visible') {
      const post = T('posts').find((p) => p.id === r.post_id);
      if (post) {
        const parent = r.parent_id ? T('comments').find((x) => x.id === r.parent_id)?.author_id : null;
        notifyMentions(r.author_id, post, r.id, r.body, new Set([r.author_id, post.author_id, ...(parent ? [parent] : [])]));
      }
    }
    if (table === 'user_blocks') {
      const a = r.blocker_id; const b = r.blocked_id;
      const follows = T('member_follows');
      for (let i = follows.length - 1; i >= 0; i--) if ((follows[i].follower_id === a && follows[i].followee_id === b) || (follows[i].follower_id === b && follows[i].followee_id === a)) follows.splice(i, 1);
      const shares = T('album_shares');
      for (let i = shares.length - 1; i >= 0; i--) {
        const al = T('community_albums').find((x) => x.id === shares[i].album_id);
        if (al && ((al.owner_id === a && shares[i].user_id === b) || (al.owner_id === b && shares[i].user_id === a))) shares.splice(i, 1);
      }
    }
  }

  /** Modifications : retourne false pour ignorer la ligne (droits). */
  function beforeUpdate(table: string, row: Row, patch: Row): boolean {
    const me = c.me();
    if (table === 'saved_posts') {
      if (row.user_id !== me) return false;
      if (patch.folder_id && patch.folder_id !== row.folder_id) {
        assertPremium('saved_folders');
        if (!T('saved_folders').some((f) => f.id === patch.folder_id && f.user_id === me)) throw forbidden();
      }
    }
    if (table === 'daily_digest_prefs') { if (row.user_id !== me) return false; checkDigest({ ...row, ...patch }); }
    if (['saved_folders', 'forum_subscriptions', 'community_notification_prefs'].includes(table) && row.user_id !== me) return false;
    if (table === 'community_albums' && row.owner_id !== me) return false;
    if (['member_follows', 'poll_votes', 'post_polls', 'poll_options', 'group_members', 'community_groups', 'group_invitations', 'community_topic_views', 'album_shares', 'event_registrations', 'community_events'].includes(table)) throw forbidden();
    return true;
  }

  /** Suppressions : lignes autorisées + effets en cascade. */
  function filterRemove(table: string, rows: Row[]): Row[] {
    const me = c.me();
    if (OWN[table]) return rows.filter((r) => r[OWN[table]] === me && (table !== 'group_members' || r.role !== 'owner'));
    if (table === 'community_albums' || table === 'album_photos') return rows.filter((r) => r.owner_id === me);
    if (table === 'album_shares') return rows.filter((s) => s.user_id === me || T('community_albums').some((a) => a.id === s.album_id && a.owner_id === me));
    if (['community_groups', 'group_invitations', 'post_polls', 'poll_options', 'community_events'].includes(table)) return [];
    return rows;
  }
  function afterRemove(table: string, removed: Row[], tables: Record<string, Row[]>) {
    const ids = new Set(removed.map((r) => r.id));
    if (table === 'community_albums') {
      tables.album_photos = T('album_photos').filter((p) => !ids.has(p.album_id));
      tables.album_shares = T('album_shares').filter((s) => !ids.has(s.album_id));
    }
    if (table === 'saved_folders') for (const s of T('saved_posts')) if (ids.has(s.folder_id)) s.folder_id = null;
    if (table === 'posts') {
      tables.post_polls = T('post_polls').filter((p) => !ids.has(p.post_id));
      tables.poll_options = T('poll_options').filter((p) => !ids.has(p.post_id));
      tables.poll_votes = T('poll_votes').filter((p) => !ids.has(p.post_id));
    }
    if (table === 'group_members') for (const m of removed) { const g = group(m.group_id); if (g) g.member_count = Math.max(0, (g.member_count ?? 1) - 1); }
  }

  // ---------------------------------------------------------------- fonctions (RPC)
  const groupRow = (g: Row) => ({
    id: g.id, slug: g.slug ?? null, name: g.name, description: g.description ?? null, kind: g.kind, cohort_type: g.cohort_type ?? null, cohort_month: g.cohort_month ?? null,
    icon: g.icon ?? null, member_count: g.member_count ?? 0, is_member: isMember(g.id), is_owner: g.owner_id === c.me(), pending_invitation: pendingInvite(g.id)?.id ?? null,
    last_post_at: T('posts').filter((p) => p.group_id === g.id && p.status === 'visible').map((p) => p.created_at).sort().pop() ?? null,
  });
  const followRow = (userId: string, since?: string) => { const p = prof(userId)!; return { handle: p.handle, pseudonym: p.pseudonym, avatar_path: p.avatar_path ?? null, avatar_preset: p.avatar_preset ?? null, since: since ?? null }; };

  const rpcs: Record<string, (a: Row) => unknown> = {
    follow_member: (a) => {
      const me = c.uid();
      requireProfile('Créez votre profil communautaire pour suivre un membre');
      const v = byHandle(a.p_handle);
      if (!v || v.user_id === me) throw new BackendError('Membre introuvable');
      if (c.blockedBetween(me, v.user_id)) throw forbidden('Impossible de suivre ce membre');
      if (T('member_follows').some((f) => f.follower_id === me && f.followee_id === v.user_id)) return null;
      T('member_follows').push({ follower_id: me, followee_id: v.user_id, created_at: c.nowIso() });
      const mine = prof(me)!;
      const recent = T('notifications').some((n) => n.user_id === v.user_id && n.category === 'community_follow' && n.payload?.follower === mine.handle && Date.now() - Date.parse(n.created_at) < 7 * 86_400_000);
      if (!recent) notifyKind(v.user_id, 'new_follower', { category: 'community_follow', title: `${mine.pseudonym} suit maintenant vos publications`, body: null, deep_link: `/community/u/${mine.handle}`, payload: { follower: mine.handle } });
      return null;
    },
    unfollow_member: (a) => {
      const me = c.uid(); const v = byHandle(a.p_handle);
      const rows = T('member_follows'); const i = rows.findIndex((f) => f.follower_id === me && f.followee_id === v?.user_id);
      if (i >= 0) rows.splice(i, 1);
      return null;
    },
    my_follows: () => {
      const me = c.uid();
      return T('member_follows').filter((f) => f.follower_id === me && !c.blockedBetween(f.followee_id, me) && prof(f.followee_id))
        .sort((x, y) => y.created_at.localeCompare(x.created_at)).map((f) => followRow(f.followee_id, f.created_at));
    },
    search_members: (a) => {
      const me = c.uid();
      const q = String(a.p_query ?? '').trim();
      if (q.length < 2) return [];
      const h = normalizeHandle(q);
      return T('community_profiles').filter((p) => p.user_id !== me && !c.blockedBetween(p.user_id, me) && (String(p.handle).includes(h) || String(p.pseudonym).toLowerCase().includes(q.toLowerCase())))
        .map((p) => ({ handle: p.handle, pseudonym: p.pseudonym, avatar_path: p.avatar_path ?? null, avatar_preset: p.avatar_preset ?? null,
          is_following: T('member_follows').some((f) => f.follower_id === me && f.followee_id === p.user_id), rank: p.handle === h ? 0 : String(p.handle).startsWith(h) ? 1 : 2 }))
        .sort((x, y) => x.rank - y.rank || x.handle.localeCompare(y.handle)).slice(0, Number(a.p_limit ?? 20));
    },
    community_groups_overview: () => {
      c.uid();
      return T('community_groups').filter((g) => !g.archived && (g.kind === 'theme' || isMember(g.id) || !!pendingInvite(g.id)))
        .sort((x, y) => Number(y.kind === 'private') - Number(x.kind === 'private') || String(x.kind).localeCompare(String(y.kind)) || String(y.cohort_month ?? '').localeCompare(String(x.cohort_month ?? '')) || x.name.localeCompare(y.name))
        .map(groupRow);
    },
    group_detail: (a) => {
      const me = c.uid();
      const g = group(a.p_group);
      if (!g || !(canSeeGroup(g.id) || pendingInvite(g.id))) return null;
      const member = isMember(g.id);
      return {
        ...groupRow(g),
        can_invite: g.owner_id === me && g.kind === 'private' ? premiumOf(me) : null,
        members: g.kind === 'private' && member ? T('group_members').filter((m) => m.group_id === g.id).map((m) => ({ ...followRow(m.user_id), role: m.role })).sort((x, y) => (x.role === 'owner' ? -1 : y.role === 'owner' ? 1 : x.pseudonym.localeCompare(y.pseudonym))) : null,
        invitations: g.owner_id === me ? T('group_invitations').filter((i) => i.group_id === g.id && i.status === 'pending').map((i) => ({ id: i.id, handle: prof(i.invited_id)?.handle, status: i.status, created_at: i.created_at })) : null,
      };
    },
    join_group: (a) => {
      const me = c.uid();
      requireProfile('Créez votre profil communautaire pour rejoindre un groupe');
      const g = group(a.p_group);
      if (!g || g.archived) throw new BackendError('Groupe introuvable');
      if (g.kind === 'private') throw forbidden('Ce groupe est privé : il faut une invitation');
      addMember(g.id, me);
      return null;
    },
    join_cohort_group: (a) => {
      const me = c.uid();
      const type = String(a.p_type);
      if (!['birth', 'due'].includes(type)) throw new BackendError('Type de groupe inconnu');
      const month = String(a.p_month).slice(0, 7);
      const now = new Date(); const cur = now.getFullYear() * 12 + now.getMonth();
      const [y, m] = month.split('-').map(Number); const v = y * 12 + (m - 1);
      if (type === 'birth' && (v > cur || v < cur - 72)) throw new BackendError('Mois de naissance hors des groupes proposés');
      if (type === 'due' && (v < cur - 2 || v > cur + 10)) throw new BackendError('Mois de terme hors des groupes proposés');
      requireProfile('Créez votre profil communautaire pour rejoindre un groupe');
      let g = T('community_groups').find((x) => x.kind === 'cohort' && x.cohort_type === type && x.cohort_month === `${month}-01`);
      if (!g) {
        g = { id: c.uuid(), slug: `${type === 'birth' ? 'naissance' : 'terme'}-${month}`, name: cohortName(type as 'birth' | 'due', month),
          description: type === 'birth' ? 'Les parents d’enfants nés le même mois : étapes, nuits, premières fois.' : 'Les futurs parents qui attendent leur bébé le même mois.',
          kind: 'cohort', cohort_type: type, cohort_month: `${month}-01`, icon: type === 'birth' ? 'gift' : 'moon', owner_id: null, member_count: 0, archived: false, created_at: c.nowIso() };
        T('community_groups').push(g);
      }
      addMember(g.id, me);
      return g.id;
    },
    leave_group: (a) => {
      const me = c.uid();
      if (T('group_members').some((m) => m.group_id === a.p_group && m.user_id === me && m.role === 'owner')) throw new BackendError('Vous avez créé ce groupe : supprimez-le ou gardez-le');
      removeMember(String(a.p_group), me);
      return null;
    },
    create_private_group: (a) => {
      const me = c.uid();
      requireProfile('Créez votre profil communautaire');
      assertPremium('community_groups');
      if (T('community_groups').filter((g) => g.owner_id === me && g.kind === 'private' && !g.archived).length >= c.limit('private_groups_count')) throw premiumRequired('community_groups');
      const name = String(a.p_name ?? '').trim();
      const description = String(a.p_description ?? '').trim() || null;
      if (name.length < 3 || name.length > 60) throw new BackendError('Nom du groupe : 3 à 60 caractères.');
      if (textNeedsReview(`${name} ${description ?? ''}`)) throw new BackendError('Retirez les informations personnelles (téléphone, adresse…) du nom ou de la description');
      const g = { id: c.uuid(), slug: null, name, description, kind: 'private', cohort_type: null, cohort_month: null, icon: 'lock', owner_id: me, member_count: 0, archived: false, created_at: c.nowIso() };
      T('community_groups').push(g);
      addMember(g.id, me, 'owner');
      return g.id;
    },
    invite_to_group: (a) => {
      const me = c.uid();
      const g = group(a.p_group);
      if (!g || g.kind !== 'private' || g.owner_id !== me || g.archived) throw forbidden('Seule la créatrice du groupe peut inviter');
      assertPremium('community_groups');
      if ((g.member_count ?? 0) >= 100) throw new BackendError('Un groupe privé compte 100 membres au plus');
      const v = byHandle(a.p_handle);
      if (!v || v.user_id === me) throw new BackendError('Membre introuvable');
      if (c.blockedBetween(v.user_id, me)) throw forbidden('Impossible d’inviter ce membre');
      if (isMember(g.id, v.user_id)) throw new BackendError('Ce membre fait déjà partie du groupe');
      if (pendingInvite(g.id, v.user_id)) throw new BackendError('Une invitation est déjà en attente');
      const inv = { id: c.uuid(), group_id: g.id, invited_id: v.user_id, invited_by: me, status: 'pending', created_at: c.nowIso(), answered_at: null };
      T('group_invitations').push(inv);
      notifyKind(v.user_id, 'group_invite', { category: 'community_group', title: `${prof(me)?.pseudonym} vous invite dans le groupe privé « ${g.name} »`,
        body: 'Acceptez ou refusez l’invitation : vous seul·e décidez.', deep_link: `/community/group/${g.id}?invite=${inv.id}`, payload: { group_id: g.id, invitation_id: inv.id } });
      return inv.id;
    },
    respond_group_invitation: (a) => {
      const me = c.uid();
      const inv = T('group_invitations').find((i) => i.id === a.p_invitation && i.invited_id === me && i.status === 'pending');
      if (!inv) throw new BackendError('Invitation introuvable ou déjà traitée');
      if (a.p_accept) requireProfile('Créez votre profil communautaire pour rejoindre ce groupe');
      inv.status = a.p_accept ? 'accepted' : 'declined'; inv.answered_at = c.nowIso();
      if (a.p_accept) addMember(inv.group_id, me);
      return inv.group_id;
    },
    remove_group_member: (a) => {
      const me = c.uid(); const g = group(a.p_group);
      if (!g || g.owner_id !== me) throw forbidden('Seule la créatrice du groupe peut retirer un membre');
      const v = byHandle(a.p_handle);
      if (v && v.user_id !== me) removeMember(g.id, v.user_id);
      return null;
    },
    delete_private_group: (a) => {
      const me = c.uid(); const g = group(a.p_group);
      if (!g || g.owner_id !== me || g.kind !== 'private') throw forbidden('Seule la créatrice du groupe peut le supprimer');
      const postIds = new Set(T('posts').filter((p) => p.group_id === g.id).map((p) => p.id));
      for (const [t, col] of [['posts', 'id'], ['comments', 'post_id'], ['post_photos', 'post_id'], ['post_likes', 'post_id'], ['saved_posts', 'post_id'], ['post_polls', 'post_id'], ['poll_options', 'post_id'], ['poll_votes', 'post_id']] as const) {
        const rows = T(t); for (let i = rows.length - 1; i >= 0; i--) if (postIds.has(rows[i][col])) rows.splice(i, 1);
      }
      for (const t of ['group_members', 'group_invitations']) { const rows = T(t); for (let i = rows.length - 1; i >= 0; i--) if (rows[i].group_id === g.id) rows.splice(i, 1); }
      const rows = T('community_groups'); rows.splice(rows.indexOf(g), 1);
      return null;
    },
    pin_post: (a) => {
      const p = T('posts').find((x) => x.id === a.p_post);
      if (!p) throw new BackendError('Publication introuvable');
      const g = p.group_id ? group(p.group_id) : null;
      if (!(c.isModerator() || (g && g.kind === 'private' && g.owner_id === c.me()))) throw forbidden('Épinglage réservé à la modération ou à la créatrice du groupe');
      const sameSpot = T('posts').filter((x) => x.id !== p.id && x.pinned_at && x.status === 'visible' && (p.group_id ? x.group_id === p.group_id : !x.group_id && x.forum_id === p.forum_id));
      if (a.p_pin && sameSpot.length >= 3) throw new BackendError('3 publications épinglées au plus');
      p.pinned_at = a.p_pin ? c.nowIso() : null;
      return null;
    },
    vote_poll: (a) => {
      const me = c.uid();
      const p = T('posts').find((x) => x.id === a.p_post);
      const poll = T('post_polls').find((x) => x.post_id === a.p_post);
      if (!p || !poll || !postInGroupVisible(p) || (p.status !== 'visible' && p.author_id !== me) || c.blockedBetween(p.author_id, me)) throw new BackendError('Sondage introuvable');
      if (poll.closes_at && poll.closes_at < c.nowIso()) throw new BackendError('Ce sondage est terminé');
      if (p.group_id && !isMember(p.group_id)) throw forbidden('Rejoignez ce groupe pour voter');
      const opts: string[] = Array.isArray(a.p_options) ? a.p_options : [];
      if (!poll.multiple && opts.length > 1) throw new BackendError('Un seul choix possible');
      const valid = new Set(T('poll_options').filter((o) => o.post_id === p.id).map((o) => o.id));
      if (opts.some((o) => !valid.has(o))) throw new BackendError('Choix inconnu');
      const votes = T('poll_votes'); for (let i = votes.length - 1; i >= 0; i--) if (votes[i].post_id === p.id && votes[i].user_id === me) votes.splice(i, 1);
      for (const o of opts) votes.push({ post_id: p.id, option_id: o, user_id: me, created_at: c.nowIso() });
      return null;
    },
    note_topic_view: (a) => {
      const me = c.me(); if (!me) return null;
      const p = T('posts').find((x) => x.id === a.p_post);
      if (!p || !postInGroupVisible(p)) return null;
      const row = T('community_topic_views').find((x) => x.user_id === me && x.forum_id === p.forum_id);
      if (row) { row.views = Math.min(10000, row.views + 1); row.last_at = c.nowIso(); }
      else T('community_topic_views').push({ user_id: me, forum_id: p.forum_id, views: 1, last_at: c.nowIso() });
      return null;
    },
    my_community_activity: (a) => {
      const me = c.uid();
      assertPremium('community_history');
      const before = String(a.p_before ?? '9999');
      const label = (postId: string) => { const p = T('posts').find((x) => x.id === postId); return p ? String(p.title ?? p.body).slice(0, 90) : ''; };
      return [
        ...T('posts').filter((p) => p.author_id === me).map((p) => ({ kind: 'post', at: p.created_at, post_id: p.id, label: String(p.title ?? p.body).slice(0, 90) })),
        ...T('comments').filter((x) => x.author_id === me).map((x) => ({ kind: 'comment', at: x.created_at, post_id: x.post_id, label: String(x.body).slice(0, 90) })),
        ...T('post_likes').filter((x) => x.user_id === me).map((x) => ({ kind: 'like', at: x.created_at ?? c.nowIso(), post_id: x.post_id, label: label(x.post_id) })),
        ...T('saved_posts').filter((x) => x.user_id === me).map((x) => ({ kind: 'save', at: x.created_at ?? c.nowIso(), post_id: x.post_id, label: label(x.post_id) })),
      ].filter((x) => x.at < before).sort((x, y) => y.at.localeCompare(x.at)).slice(0, Number(a.p_limit ?? 50));
    },
    share_album: (a) => {
      const me = c.uid();
      const al = T('community_albums').find((x) => x.id === a.p_album && x.owner_id === me);
      if (!al) throw forbidden('Album introuvable');
      assertPremium('community_albums');
      const v = byHandle(a.p_handle);
      if (!v || v.user_id === me) throw new BackendError('Membre introuvable');
      if (c.blockedBetween(v.user_id, me)) throw forbidden('Impossible de partager avec ce membre');
      if (T('album_shares').filter((s) => s.album_id === al.id).length >= 30) throw new BackendError('30 personnes au plus par album');
      if (T('album_shares').some((s) => s.album_id === al.id && s.user_id === v.user_id)) return null;
      T('album_shares').push({ album_id: al.id, user_id: v.user_id, created_at: c.nowIso() });
      notifyKind(v.user_id, 'group_invite', { category: 'community_group', title: `${prof(me)?.pseudonym} partage un album avec vous : « ${al.title} »`, body: null, deep_link: `/community/album/${al.id}`, payload: { album_id: al.id } });
      return null;
    },
    my_albums: () => {
      const me = c.uid();
      return T('community_albums').filter((al) => canReadAlbum(al.id)).sort((x, y) => y.created_at.localeCompare(x.created_at)).map((al) => {
        const photos = T('album_photos').filter((p) => p.album_id === al.id).sort((x, y) => x.created_at.localeCompare(y.created_at));
        const owner = prof(al.owner_id);
        return { id: al.id, title: al.title, description: al.description ?? null, created_at: al.created_at, is_mine: al.owner_id === me, owner_handle: owner?.handle ?? null,
          owner_pseudonym: owner?.pseudonym ?? null, photo_count: photos.length, cover: photos[0]?.path ?? null,
          shared_with: al.owner_id === me ? T('album_shares').filter((s) => s.album_id === al.id).map((s) => prof(s.user_id)?.handle).filter(Boolean).sort() : null };
      });
    },
    event_join_link: (a) => {
      const me = c.uid();
      const e = T('community_events').find((x) => x.id === a.p_event);
      return e && T('event_registrations').some((r) => r.event_id === e.id && r.user_id === me) ? e.join_url ?? null : null;
    },
  };

  /** Colonnes ajoutées aux profils (abonnements, personnalisation, badge) — jamais de nombre d'abonné·es public. */
  function myProfileExtras(me: string): Row {
    const v = prof(me);
    return {
      accent: v?.accent ?? null, banner: v?.banner ?? null, about: v?.about ?? null, show_premium_badge: !!v?.show_premium_badge,
      premium: premiumOf(me), premium_badge: premiumBadge(me),
      following_count: T('member_follows').filter((f) => f.follower_id === me).length,
      followers_count: T('member_follows').filter((f) => f.followee_id === me).length,
    };
  }
  function memberExtras(userId: string, full: boolean): Row {
    const me = c.me();
    const v = prof(userId);
    return {
      is_following: T('member_follows').some((f) => f.follower_id === me && f.followee_id === userId),
      premium_badge: premiumBadge(userId), accent: v?.accent ?? null, banner: v?.banner ?? null, ...(full ? { about: v?.about ?? null } : {}),
    };
  }

  return { seed, view, feedExtras, commentExtras, postInGroupVisible, beforeInsert, afterInsert, beforeUpdate, filterRemove, afterRemove, checkProfilePremium, rpcs, myProfileExtras, memberExtras, isMember, premiumOf };
}
