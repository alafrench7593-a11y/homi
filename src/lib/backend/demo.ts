/**
 * Moteur LOCAL de démonstration (aucun serveur). Les données restent sur l'appareil.
 * Il reproduit les règles métier essentielles de la base Supabase afin que
 * l'application se comporte de la même façon ; la sécurité multi-utilisateur
 * (RLS) n'a pas de sens ici puisqu'un seul compte local existe par appareil.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import content from '@/content/demo-content.json';
import { uuid } from '../uuid';
import { BackendError, type Backend, type Filter, type Query, type Session } from './types';
import { assessSafety, crisisMessage } from '../../../supabase/functions/_shared/safety';
import { assessProduct, type ProductData } from '../../../supabase/functions/_shared/product-rules';
import { ASSISTANT_FOOTER } from '../../../supabase/functions/_shared/assistant-prompt';
import { buildSampleFamily } from './demoSample';

type Row = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
type Tables = Record<string, Row[]>;

const KEY = 'toietmoi.demo.v1';
/** Version des exemples de la communauté : l'augmenter ajoute les nouveaux exemples aux appareils existants. */
const COMMUNITY_SEED_VERSION = 2;
const CATALOG_TABLES = ['content_categories', 'articles', 'forums', 'emergency_resources', 'foods', 'baby_names', 'products', 'product_recalls', 'plan_limits'] as const;
const CHILD_TABLES = ['child_measurements', 'child_milestones', 'child_health_items', 'breastfeeds', 'pumpings', 'bottles', 'meals', 'food_introductions', 'diapers', 'sleeps', 'child_observations'];
const OWNER_TABLES: Record<string, string> = {
  period_entries: 'user_id', symptom_logs: 'user_id', ovulation_tests: 'user_id', pregnancy_tests: 'user_id', maternal_weights: 'user_id',
  mood_checkins: 'user_id', reminders: 'user_id', favorites: 'user_id', product_scans: 'user_id', push_devices: 'user_id',
  assistant_conversations: 'user_id', assistant_messages: 'user_id', consents: 'user_id', posts: 'author_id', comments: 'author_id',
  post_likes: 'user_id', saved_posts: 'user_id', reports: 'reporter_id', user_blocks: 'blocker_id', notes: 'author_id',
  documents: 'uploaded_by', name_votes: 'user_id',
  parent_sleep_logs: 'user_id',
  // Parcours fertilité : données intimes, strictement personnelles
  intercourse_logs: 'user_id', fertility_observations: 'user_id', contraception_methods: 'user_id', consultation_questions: 'user_id',
};

interface DemoState {
  users: { id: string; email: string; pw: string }[];
  session: Session | null;
  tables: Tables;
}

// Empreinte simple (mode démo uniquement : rien ne quitte l'appareil)
function fnv(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return (h >>> 0).toString(16);
}

const nowIso = () => new Date().toISOString();

/** Termes surveillés (mêmes règles que supabase/seed.sql → moderation_terms). */
const DEMO_TERMS: { pattern: RegExp; action: 'block' | 'review'; reason: string }[] = [
  { pattern: /\b(viagra|casino|crypto ?monnaie)\b/i, action: 'block', reason: 'spam' },
  { pattern: /(vends?|achète|acheter|vente).{0,20}lait maternel/i, action: 'review', reason: 'vente de lait maternel' },
  { pattern: /(arrêtez|arrête|arrêter) (le|son|votre) traitement/i, action: 'review', reason: 'conseil médical potentiellement dangereux' },
  { pattern: /\b(mon|notre) adresse (est|:)/i, action: 'review', reason: 'donnée personnelle' },
];
const PERSONAL_DATA = /(\+33|0)[1-9]([ .-]?[0-9]{2}){4}|[\w.%+-]+@[\w.-]+\.[a-z]{2,}/i;
const PSEUDONYM = /^[A-Za-zÀ-ÿ0-9_.\- ]{3,24}$/;
const fold = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

function matches(row: Row, f: Filter): boolean {
  const v = row[f.col];
  switch (f.op) {
    case 'eq': return v === f.value;
    case 'neq': return v !== f.value;
    case 'in': return (f.value as unknown[]).includes(v);
    case 'gte': return v != null && v >= (f.value as never);
    case 'lte': return v != null && v <= (f.value as never);
    case 'gt': return v != null && v > (f.value as never);
    case 'lt': return v != null && v < (f.value as never);
    case 'is': return v == null;
    case 'ilike': {
      const pat = String(f.value).toLowerCase().replace(/%/g, '');
      return String(v ?? '').toLowerCase().includes(pat);
    }
    case 'contains': return Array.isArray(v) && (f.value as unknown[]).every((x) => v.includes(x));
  }
}

export function createDemoBackend(): Backend {
  let state: DemoState = { users: [], session: null, tables: {} };
  let loaded: Promise<void> | null = null;
  const listeners = new Set<(s: Session | null) => void>();
  let saveTimer: ReturnType<typeof setTimeout> | null = null;

  const catalogs = content as unknown as Record<string, Row[]>;

  async function load() {
    if (!loaded) {
      loaded = (async () => {
        try {
          const raw = await AsyncStorage.getItem(KEY);
          if (raw) state = JSON.parse(raw);
        } catch {
          // stockage illisible : on repart d'un état vide
        }
        for (const t of CATALOG_TABLES) state.tables[t] = JSON.parse(JSON.stringify(catalogs[t] ?? []));
        if ((state.tables._community_seed?.[0]?.version ?? 0) < COMMUNITY_SEED_VERSION) seedCommunity();
      })();
    }
    return loaded;
  }

  function persist() {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      const tables: Tables = {};
      for (const [k, v] of Object.entries(state.tables)) if (!(CATALOG_TABLES as readonly string[]).includes(k)) tables[k] = v;
      AsyncStorage.setItem(KEY, JSON.stringify({ ...state, tables })).catch(() => undefined);
    }, 150);
  }

  const T = (name: string) => (state.tables[name] ??= []);
  const uid = () => {
    if (!state.session) throw new BackendError('Connexion requise.', '42501');
    return state.session.userId;
  };
  const isPremium = () => {
    const s = T('subscriptions').find((r) => r.user_id === state.session?.userId);
    return !!s && ['trial', 'active', 'grace', 'cancelled'].includes(s.status) && (!s.expires_at || s.expires_at > nowIso());
  };
  const limit = (key: string) => {
    const l = T('plan_limits').find((p) => p.key === key);
    return l ? (isPremium() ? l.premium_value : l.free_value) : Infinity;
  };
  let replyTarget: string | null = null;
  const blockedBetween = (a: string, b: string) => T('user_blocks').some((x) => (x.blocker_id === a && x.blocked_id === b) || (x.blocker_id === b && x.blocked_id === a));
  /** Pseudonyme : format, unicité, jamais le prénom du profil ni l'identifiant de l'e-mail. */
  function checkPseudonym(r: Row, creating: boolean) {
    if (r.pseudonym == null) return;
    r.pseudonym = String(r.pseudonym).trim();
    if (!PSEUDONYM.test(r.pseudonym)) throw new BackendError('Pseudonyme invalide : 3 à 24 caractères (lettres, chiffres, espace, point, tiret).');
    const owner = r.user_id ?? state.session?.userId;
    if (T('community_profiles').some((p) => p.pseudonym === r.pseudonym && (creating || p.user_id !== owner))) throw new BackendError('Ce pseudonyme existe déjà.', '23505');
    const name = T('profiles').find((p) => p.id === owner)?.display_name;
    const email = state.users.find((u) => u.id === owner)?.email.split('@')[0];
    const lower = r.pseudonym.toLowerCase();
    if ((name && lower === String(name).trim().toLowerCase()) || (email && lower === email.toLowerCase())) {
      throw new BackendError('Choisissez un pseudonyme différent de votre prénom et de votre adresse e-mail.', 'P0001', 'pseudonym_identifying');
    }
  }
  const notify = (userId: string, n: Row) => T('notifications').push({ id: uuid(), user_id: userId, payload: {}, read_at: null, created_at: nowIso(), ...n });

  function seedCommunity() {
    const forum = (slug: string) => T('forums').find((f) => f.slug === slug)?.id;
    const others = [
      { user_id: 'demo-voisine-1', pseudonym: 'Maïa_et_Sohan', area_label: 'Lyon' },
      { user_id: 'demo-voisin-2', pseudonym: 'PapaDeNour', area_label: 'Lille' },
      { user_id: 'demo-voisine-3', pseudonym: 'Clem.2026', area_label: 'Nantes' },
    ];
    // Amorçage additif : un appareil qui avait déjà la démo reçoit les nouveaux exemples sans perdre ses données
    for (const o of others) if (!T('community_profiles').some((x) => x.user_id === o.user_id)) T('community_profiles').push({ ...o, suspended_until: null, created_at: nowIso() });
    const p = (slugF: string, author: string, title: string, body: string, hoursAgo: number, likes = 0) => ({
      id: uuid(), forum_id: forum(slugF), author_id: author, title, body, area_label: null, status: 'visible', report_count: 0,
      like_count: likes, comment_count: 0, created_at: new Date(Date.now() - hoursAgo * 3600_000).toISOString(), edited_at: null,
    });
    const samples = [
      p('post-partum', 'demo-voisine-1', 'Trois semaines après : on en parle ?', 'Je pensais être plus en forme. Les nuits sont longues et je pleure facilement. Vous avez vécu ça aussi ?', 5, 12),
      p('jumeaux-triples', 'demo-voisin-2', 'Tableau de relais pour les nuits', 'Avec ma compagne on a fait un tableau : 22h-2h pour moi, 2h-6h pour elle. Ça nous a sauvés. Et vous ?', 20, 31),
      p('grossesse', 'demo-voisine-3', 'Valise : vous l’avez préparée quand ?', 'Je suis à 30 SA et je n’ai encore rien fait. Pas de panique ?', 30, 7),
      p('parents-enfants', 'demo-voisin-2', 'Préparer un aîné à l’arrivée du bébé', 'Notre fille de 4 ans pose plein de questions. Des livres à conseiller ?', 52, 18),
      p('sommeil', 'demo-voisine-1', 'Réveils à 5 h du matin', 'Notre fils de 15 mois se réveille tous les jours à 5 h. Des idées pour décaler un peu le réveil ?', 8, 9),
      p('diversification', 'demo-voisine-3', 'Premières purées : par quoi commencer ?', 'On démarre la diversification la semaine prochaine. Carotte, courgette… vous avez commencé par quoi ?', 26, 14),
      p('projet-bebe', 'demo-voisine-1', 'Un an d’essais, comment tenir le moral ?', 'Chaque mois l’attente puis la déception. Comment faites-vous pour garder le moral à deux ?', 40, 22),
      p('fertilite', 'demo-voisine-3', 'Premier rendez-vous en centre de PMA', 'Rendez-vous dans deux semaines. Quelles questions avez-vous posées la première fois ?', 70, 6),
      p('biberon', 'demo-voisin-2', 'Biberons la nuit : vos astuces ?', 'Eau prête à température, doses de lait préparées… comment vous organisez-vous la nuit ?', 12, 5),
      { ...p('rencontres-locales', 'demo-voisine-1', 'Balade poussette au parc de la Tête d’Or', 'Une balade samedi matin, entre parents de bébés ? Rendez-vous devant l’entrée principale.', 16, 3), area_label: 'Lyon' },
    ];
    const added = new Set<number>();
    samples.forEach((s, i) => {
      if (!s.forum_id || T('posts').some((x) => x.title === s.title)) return;
      T('posts').push(s);
      added.add(i);
    });
    const c = (postIdx: number, author: string, body: string, parentId: string | null = null) => {
      if (!added.has(postIdx)) return null;
      const post = samples[postIdx];
      post.comment_count += 1;
      const row = { id: uuid(), post_id: post.id, parent_id: parentId, author_id: author, body, status: 'visible', report_count: 0, created_at: nowIso() };
      T('comments').push(row);
      return row;
    };
    const first = c(0, 'demo-voisine-3', 'Oui. Ça m’a fait du bien d’en parler à ma sage-femme. Tu n’es pas seule.');
    if (first) c(0, 'demo-voisine-1', 'Merci, je vais lui en parler au prochain rendez-vous.', first.id);
    c(1, 'demo-voisine-1', 'Excellente idée, on va essayer !');
    c(4, 'demo-voisin-2', 'On a décalé le coucher de 20 minutes, ça a aidé au bout d’une semaine.');
    state.tables._community_seed = [{ version: COMMUNITY_SEED_VERSION }];
  }

  // ---------------------------------------------------------------- règles d'insertion
  function beforeInsert(table: string, r: Row): Row {
    const me = state.session?.userId;
    const ownerCol = OWNER_TABLES[table];
    if (ownerCol && r[ownerCol] == null && me) r[ownerCol] = me;
    r.id ??= uuid();
    r.created_at ??= nowIso();

    if (CHILD_TABLES.includes(table)) {
      const child = T('children').find((c) => c.id === r.child_id);
      if (!child) throw new BackendError('Enfant introuvable.');
      r.household_id = child.household_id;
      if (r.created_by == null) r.created_by = me;
    }
    if (table === 'expected_babies') r.household_id = T('pregnancies').find((p) => p.id === r.pregnancy_id)?.household_id;
    if (table === 'checklist_items') r.household_id = T('checklists').find((p) => p.id === r.checklist_id)?.household_id;
    if (table === 'name_votes') r.household_id = T('name_favorites').find((p) => p.id === r.favorite_id)?.household_id;

    if (table === 'sleeps' && !r.ended_at && T('sleeps').some((s) => s.child_id === r.child_id && !s.ended_at)) {
      throw new BackendError('Un sommeil est déjà en cours pour cet enfant.');
    }
    if (table === 'bottles' && r.prepared_ml != null && r.consumed_ml != null && r.consumed_ml > r.prepared_ml) {
      throw new BackendError('La quantité bue ne peut pas dépasser la quantité préparée.');
    }
    const quota: Record<string, string> = { documents: 'documents_count', checklists: 'checklists_count', children: 'children_count' };
    if (quota[table]) {
      const count = T(table).filter((x) => x.household_id === r.household_id).length;
      if (count >= limit(quota[table])) throw new BackendError('Limite de la version gratuite atteinte.', 'P0001', 'premium_required');
    }
    if (table === 'community_profiles') checkPseudonym(r, true);
    if (table === 'posts' || table === 'comments') {
      const profile = T('community_profiles').find((p) => p.user_id === me);
      if (!profile) throw new BackendError('Choisissez un pseudonyme avant de publier.', 'P0001', 'pseudonym_required');
      if (profile.suspended_until && profile.suspended_until > nowIso()) throw new BackendError('Votre compte communauté est suspendu.', '42501');
      if (table === 'posts' && !T('forums').some((f) => f.id === r.forum_id)) throw new BackendError('Choisissez un espace.');
      const text = `${r.title ?? ''} ${r.body ?? ''}`;
      let status = PERSONAL_DATA.test(text) ? 'pending_review' : 'visible';
      for (const term of DEMO_TERMS) {
        if (!term.pattern.test(text)) continue;
        if (term.action === 'block') throw new BackendError(`Ce contenu ne respecte pas les règles de la communauté (${term.reason}).`);
        status = 'pending_review';
      }
      r.status = status;
      r.report_count = 0;
      if (table === 'posts') Object.assign(r, { like_count: 0, comment_count: 0, edited_at: null });
      if (table === 'comments') {
        const post = T('posts').find((p) => p.id === r.post_id);
        if (!post || post.status !== 'visible') throw new BackendError('Cette publication n’accepte plus de commentaires.', '42501');
        if (blockedBetween(post.author_id, r.author_id)) throw new BackendError('Impossible de répondre à cette publication.', '42501');
        r.parent_id ??= null;
        replyTarget = null;
        if (r.parent_id) {
          const parent = T('comments').find((x) => x.id === r.parent_id);
          if (!parent || parent.post_id !== r.post_id) throw new BackendError('Le commentaire auquel vous répondez est introuvable.');
          if (parent.status !== 'visible' || blockedBetween(parent.author_id, r.author_id)) throw new BackendError('Impossible de répondre à ce commentaire.', '42501');
          replyTarget = parent.author_id;
          // Un seul niveau : une réponse à une réponse est rattachée au commentaire racine
          if (parent.parent_id) r.parent_id = parent.parent_id;
        }
      }
    }
    if (table === 'reports') {
      const dup = T('reports').some((x) => x.reporter_id === me && ((r.post_id && x.post_id === r.post_id) || (r.comment_id && x.comment_id === r.comment_id)));
      if (dup) throw new BackendError('Vous avez déjà signalé ce contenu.');
      r.status = 'open';
    }
    if (table === 'reminders') r.updated_at = nowIso();
    if (table === 'parent_sleep_logs') {
      // Même règles que la base : une entrée par jour, réveil après le coucher
      if (T(table).some((x) => x.user_id === r.user_id && x.log_date === r.log_date)) throw new BackendError('Une nuit est déjà enregistrée pour ce jour : modifiez-la plutôt.');
      if (r.bedtime && r.wake_time && r.wake_time <= r.bedtime) throw new BackendError('Le réveil doit être après le coucher.');
      r.updated_at = nowIso();
    }
    if (table === 'documents') r.private_to_uploader ??= false;
    return r;
  }

  function afterInsert(table: string, r: Row) {
    if (table === 'comments') {
      const post = T('posts').find((p) => p.id === r.post_id);
      if (post) {
        post.comment_count += 1;
        // Mêmes règles que le déclencheur on_comment : réponse → community_reply, sinon community_comment
        if (r.status === 'visible') {
          const who = T('community_profiles').find((p) => p.user_id === r.author_id)?.pseudonym ?? 'Quelqu’un';
          const payload = { post_id: post.id, comment_id: r.id, parent_id: r.parent_id };
          const notified = new Set<string>([r.author_id]);
          if (replyTarget && !notified.has(replyTarget) && !blockedBetween(replyTarget, r.author_id)) {
            notify(replyTarget, { category: 'community_reply', title: `${who} a répondu à votre commentaire`, body: r.body.slice(0, 120), deep_link: `/community/post/${post.id}`, payload });
            notified.add(replyTarget);
          }
          if (!notified.has(post.author_id) && !blockedBetween(post.author_id, r.author_id)) {
            notify(post.author_id, { category: 'community_comment', title: `${who} a commenté votre publication`, body: r.body.slice(0, 120), deep_link: `/community/post/${post.id}`, payload });
          }
        }
      }
      replyTarget = null;
    }
    if (table === 'post_likes') {
      const post = T('posts').find((p) => p.id === r.post_id);
      if (post) post.like_count += 1;
    }
    if (table === 'reports') {
      const target = r.post_id ? T('posts').find((p) => p.id === r.post_id) : T('comments').find((c) => c.id === r.comment_id);
      if (target) {
        target.report_count += 1;
        if (target.report_count >= 3) target.status = 'hidden';
      }
    }
  }

  // ---------------------------------------------------------------- vues
  function view(table: string): Row[] {
    const me = state.session?.userId;
    // Blocage dans les deux sens, comme is_blocked_between côté Supabase
    const blocked = new Set(T('user_blocks').flatMap((b) => (b.blocker_id === me ? [b.blocked_id] : b.blocked_id === me ? [b.blocker_id] : [])));
    const pseudo = (id: string) => T('community_profiles').find((p) => p.user_id === id)?.pseudonym ?? null;
    if (table === 'forum_feed') {
      return T('posts')
        .filter((p) => (p.status === 'visible' && !blocked.has(p.author_id)) || p.author_id === me)
        .map((p) => ({
          id: p.id, forum_id: p.forum_id, title: p.title, body: p.body, area_label: p.area_label, status: p.status,
          like_count: p.like_count, comment_count: p.comment_count, created_at: p.created_at, edited_at: p.edited_at,
          pseudonym: pseudo(p.author_id), is_mine: p.author_id === me,
          liked: T('post_likes').some((l) => l.post_id === p.id && l.user_id === me),
          saved: T('saved_posts').some((l) => l.post_id === p.id && l.user_id === me),
        }));
    }
    if (table === 'comment_feed') {
      return T('comments')
        .filter((c) => (c.status === 'visible' && !blocked.has(c.author_id)) || c.author_id === me)
        .map((c) => ({ id: c.id, post_id: c.post_id, parent_id: c.parent_id, body: c.body, status: c.status, created_at: c.created_at, pseudonym: pseudo(c.author_id), is_mine: c.author_id === me }));
    }
    const rows = T(table);
    const ownerCol = OWNER_TABLES[table];
    // Données personnelles : uniquement celles du compte connecté
    if (ownerCol && !['posts', 'comments'].includes(table)) {
      if (table === 'documents') return rows.filter((d) => !d.private_to_uploader || d.uploaded_by === me);
      if (table === 'notes') return rows.filter((n) => !n.private_to_author || n.author_id === me);
      if (table === 'name_votes') return rows;
      return rows.filter((x) => x[ownerCol] === me);
    }
    if (['profiles', 'privacy_settings', 'subscriptions', 'notifications', 'assistant_usage'].includes(table)) {
      const col = table === 'profiles' ? 'id' : 'user_id';
      return rows.filter((x) => x[col] === me);
    }
    return rows;
  }

  // ---------------------------------------------------------------- fonctions backend simulées
  const rpcs: Record<string, (a: Row) => unknown> = {
    create_household: (a) => {
      const id = uuid();
      T('households').push({ id, name: a.p_name || 'Ma famille', created_by: uid(), created_at: nowIso() });
      T('household_members').push({
        household_id: id, user_id: uid(), role: 'owner', joined_at: nowIso(),
        can_view: ['daily', 'health', 'documents', 'pregnancy', 'lists', 'names', 'profile'],
        can_edit: ['daily', 'health', 'documents', 'pregnancy', 'lists', 'names', 'profile'],
      });
      return id;
    },
    create_household_invitation: (a) => {
      const token = uuid().replace(/-/g, '');
      T('household_invitations').push({ id: uuid(), household_id: a.p_household, token_hash: fnv(token), role: a.p_role ?? 'coparent', can_view: a.p_can_view, can_edit: a.p_can_edit, created_at: nowIso(), expires_at: new Date(Date.now() + 7 * 86400_000).toISOString() });
      return token;
    },
    accept_household_invitation: () => {
      throw new BackendError('En mode démonstration, un seul compte existe sur cet appareil : connectez Supabase pour partager avec un coparent.');
    },
    has_premium: () => isPremium(),
    plan_limit: (a) => limit(a.p_key),
    block_author: (a) => {
      const author = a.p_post ? T('posts').find((p) => p.id === a.p_post)?.author_id : T('comments').find((c) => c.id === a.p_comment)?.author_id;
      if (author && author !== uid() && !T('user_blocks').some((b) => b.blocker_id === uid() && b.blocked_id === author)) {
        T('user_blocks').push({ blocker_id: uid(), blocked_id: author, created_at: nowIso() });
      }
      return null;
    },
    // Recherche : plein texte (français) côté Supabase ; ici, simple « contient » sans casse ni accents
    search_posts: (a) => {
      const q = fold(String(a.p_query ?? '').trim());
      if (q.length < 2) return [];
      return view('forum_feed')
        .filter((p) => p.status === 'visible' && (!a.p_forum || p.forum_id === a.p_forum) && fold(`${p.title} ${p.body}`).includes(q))
        .sort((x, y) => (x.created_at < y.created_at ? 1 : -1))
        .slice(0, Math.min(Math.max(Number(a.p_limit) || 50, 1), 100));
    },
    moderate: (a) => {
      const target = a.p_post ? T('posts').find((p) => p.id === a.p_post) : T('comments').find((c) => c.id === a.p_comment);
      if (target && ['hide', 'restore', 'remove'].includes(a.p_action)) target.status = a.p_action === 'hide' ? 'hidden' : a.p_action === 'remove' ? 'removed' : 'visible';
      T('reports').filter((r) => r.post_id === a.p_post || r.comment_id === a.p_comment).forEach((r) => (r.status = a.p_action === 'dismiss_report' ? 'dismissed' : 'resolved'));
      T('moderation_actions').push({ id: uuid(), moderator_id: uid(), post_id: a.p_post ?? null, comment_id: a.p_comment ?? null, action: a.p_action, reason: a.p_reason ?? null, created_at: nowIso() });
      return null;
    },
    admin_stats: () => ({
      accounts: state.users.length, onboarded: T('profiles').filter((p) => p.onboarding_completed).length,
      active_pregnancies: T('pregnancies').filter((p) => p.status === 'active').length,
      multiple_pregnancies: T('pregnancies').filter((p) => ['twins', 'triplets', 'more'].includes(p.multiplicity)).length,
      children: T('children').length, premium: T('subscriptions').filter((s) => s.status === 'active').length,
      posts_7d: T('posts').length, open_reports: T('reports').filter((r) => r.status === 'open').length, journeys: {},
    }),
    admin_broadcast: (a) => {
      notify(uid(), { category: 'system', title: a.p_title, body: a.p_body, deep_link: a.p_deep_link ?? null });
      return 1;
    },
    export_my_data: () => {
      const me = uid();
      const households = T('household_members').filter((m) => m.user_id === me).map((m) => m.household_id);
      const byHousehold = (t: string) => T(t).filter((r) => households.includes(r.household_id));
      return {
        exported_at: nowIso(), format: 'toi-et-moi-export-v1', mode: 'démonstration locale',
        profile: T('profiles').find((p) => p.id === me) ?? null,
        consents: view('consents'),
        personal: Object.fromEntries(['period_entries', 'symptom_logs', 'ovulation_tests', 'pregnancy_tests', 'maternal_weights', 'mood_checkins', 'reminders', 'assistant_conversations', 'assistant_messages', 'favorites', 'intercourse_logs', 'fertility_observations', 'contraception_methods', 'consultation_questions'].map((t) => [t, view(t)])),
        households: T('households').filter((h) => households.includes(h.id)).map((h) => ({
          household: h,
          ...Object.fromEntries(['pregnancies', 'expected_babies', 'children', 'child_measurements', 'breastfeeds', 'bottles', 'pumpings', 'meals', 'diapers', 'sleeps', 'child_observations', 'appointments', 'checklists', 'checklist_items', 'documents']
            .map((t) => [t, byHousehold(t).filter((r) => r.household_id === h.id)])),
        })),
        community: { posts: T('posts').filter((p) => p.author_id === me), comments: T('comments').filter((c) => c.author_id === me) },
      };
    },
    load_sample_family: () => {
      buildSampleFamily(uid(), T, rpcs.create_household as (a: Row) => string);
      return null;
    },
    set_demo_subscription: (a) => {
      const subs = T('subscriptions');
      const idx = subs.findIndex((s) => s.user_id === uid());
      const row = a.active
        ? { user_id: uid(), status: a.trial ? 'trial' : 'active', product_id: a.product_id ?? 'toietmoi_premium_monthly', store: 'test', period_type: a.trial ? 'trial' : a.period ?? 'monthly', expires_at: new Date(Date.now() + (a.period === 'annual' ? 365 : 30) * 86400_000).toISOString(), will_renew: true }
        : { user_id: uid(), status: 'expired', product_id: null, store: 'test', period_type: null, expires_at: nowIso(), will_renew: false };
      if (idx >= 0) subs[idx] = row;
      else subs.push(row);
      return row;
    },
  };

  const functions: Record<string, (b: Row) => unknown> = {
    assistant: (b) => {
      const message = String(b.message ?? '').trim();
      const safety = assessSafety(message);
      if (safety.level !== 'none') {
        return { conversation_id: b.conversation_id ?? null, answer: crisisMessage(safety.level), safety: safety.level, sources: [], show_emergency_resources: true, stored: false };
      }
      const month = new Date().toISOString().slice(0, 7);
      const usage = T('assistant_usage');
      let u = usage.find((x) => x.user_id === uid() && x.month === month);
      if (!u) usage.push((u = { user_id: uid(), month, questions: 0 }));
      const quota = limit('assistant_questions_per_month');
      if (u.questions >= quota) throw new BackendError(`Vous avez utilisé vos ${quota} questions de ce mois.`, 'quota_reached', 'premium_required', 402);
      u.questions += 1;

      const words = message.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').split(/[^a-z0-9]+/).filter((w) => w.length > 4);
      const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
      const articles = T('articles')
        .map((a) => ({ a, score: words.filter((w) => norm(`${a.title} ${a.summary} ${a.body_md}`).includes(w)).length }))
        .filter((x) => x.score > 0)
        .sort((x, y) => y.score - x.score)
        .slice(0, 3)
        .map((x) => x.a);
      const answer = (articles.length
        ? `**Mode démonstration** — aucun service d’intelligence artificielle n’est connecté : voici les articles de la bibliothèque liés à votre question.\n\n${articles.map((a, i) => `• [${i + 1}] **${a.title}** — ${a.summary}`).join('\n')}\n\nÀ demander à un professionnel : toute question sur votre santé ou celle de votre enfant.`
        : '**Mode démonstration** — aucun service d’intelligence artificielle n’est connecté et aucun article de la bibliothèque ne correspond. Notez votre question pour votre prochain rendez-vous.') + ASSISTANT_FOOTER;
      const sources = articles.map((a, i) => ({ ref: i + 1, title: a.title, slug: a.slug, sources: a.sources }));

      let convId = b.conversation_id as string | null;
      if (!convId) {
        convId = uuid();
        T('assistant_conversations').push({ id: convId, user_id: uid(), title: message.slice(0, 80), created_at: nowIso(), updated_at: nowIso() });
      } else {
        const conv = T('assistant_conversations').find((c) => c.id === convId);
        if (conv) conv.updated_at = nowIso();
      }
      T('assistant_messages').push({ id: uuid(), conversation_id: convId, user_id: uid(), role: 'user', content: message, sources: [], feedback: null, saved: false, created_at: nowIso() });
      const mid = uuid();
      T('assistant_messages').push({ id: mid, conversation_id: convId, user_id: uid(), role: 'assistant', content: answer, sources, feedback: null, saved: false, created_at: new Date(Date.now() + 1).toISOString() });
      return { conversation_id: convId, message_id: mid, answer, sources, safety: 'none', demo: true, quota: { used: u.questions, limit: quota }, stored: true };
    },
    'product-lookup': (b) => {
      const barcode = String(b.barcode ?? '').replace(/\D/g, '');
      const product = T('products').find((p) => p.barcode === barcode) as (ProductData & { id: string }) | undefined;
      const recalls = T('product_recalls').filter((r) => r.barcode === barcode || (product && r.product_id === product.id));
      if (!product) return { found: false, barcode, recalls, message: 'Produit introuvable dans la base de démonstration. Essayez 0000000000024 ou saisissez les ingrédients.' };
      if (b.confirm) T('product_scans').push({ id: uuid(), user_id: uid(), product_id: product.id, barcode, method: 'barcode', confirmed: true, created_at: nowIso() });
      const assessment = assessProduct(product, b.context ?? {});
      return {
        found: true, needs_confirmation: !b.confirm, recalls,
        product: { name: product.name, brand: product.brand, category: product.category, ingredients: product.ingredients, declared_allergens: product.declared_allergens, data_source: product.data_source, data_retrieved_at: product.data_retrieved_at, is_demo: true },
        assessment: isPremium() ? assessment : { ...assessment, findings: assessment.findings.filter((f) => f.level === 'avoid_advised'), limited: true },
      };
    },
    'document-extract': () => ({ fields: null, status: 'unavailable', message: 'La lecture automatique nécessite un service connecté (indisponible en mode démonstration).' }),
    'delete-account': async () => {
      const me = uid();
      state.users = state.users.filter((u) => u.id !== me);
      state.tables = {};
      state.session = null;
      await AsyncStorage.removeItem(KEY);
      loaded = null;
      listeners.forEach((l) => l(null));
      return { ok: true };
    },
  };

  function ensureProfile(userId: string) {
    if (!T('profiles').some((p) => p.id === userId)) {
      T('profiles').push({ id: userId, display_name: null, journeys: [], interests: [], locale: 'fr', timezone: 'Europe/Paris', onboarding_completed: false, home_shortcuts: ['bottle', 'diaper', 'sleep', 'question'], hide_weight_module: false, theme: 'system' });
      T('privacy_settings').push({ user_id: userId, analytics_enabled: false, crash_reports_enabled: false, ai_history_enabled: true, community_visible: true, retention_months: 36 });
    }
  }

  function setSession(s: Session | null) {
    state.session = s;
    persist();
    listeners.forEach((l) => l(s));
  }

  return {
    mode: 'demo',
    auth: {
      async getSession() {
        await load();
        return state.session;
      },
      onChange(cb) {
        listeners.add(cb);
        return () => listeners.delete(cb);
      },
      async signUp(email, password) {
        await load();
        const e = email.trim().toLowerCase();
        if (state.users.some((u) => u.email === e)) throw new BackendError('Un compte existe déjà avec cette adresse sur cet appareil.');
        const id = uuid();
        state.users.push({ id, email: e, pw: fnv(password) });
        ensureProfile(id);
        setSession({ userId: id, email: e });
        return { needsConfirmation: false };
      },
      async signIn(email, password) {
        await load();
        const u = state.users.find((x) => x.email === email.trim().toLowerCase());
        if (!u || u.pw !== fnv(password)) throw new BackendError('Adresse e-mail ou mot de passe incorrect.');
        ensureProfile(u.id);
        setSession({ userId: u.id, email: u.email });
      },
      async signOut() {
        setSession(null);
      },
      async resetPassword() {
        // Aucun e-mail n'est envoyé en mode démonstration
      },
      async updatePassword(password) {
        const u = state.users.find((x) => x.id === uid());
        if (u) u.pw = fnv(password);
        persist();
      },
      async exchangeCode() {
        // pas de lien e-mail en mode démonstration
      },
    },
    storage: {
      async upload(bucket, path, file) {
        T('_files').push({ id: uuid(), bucket, path, uri: file.uri, mime: file.mimeType });
        persist();
      },
      async signedUrl(_bucket, path) {
        return T('_files').find((f) => f.path === path)?.uri ?? '';
      },
      async remove(_bucket, paths) {
        state.tables._files = T('_files').filter((f) => !paths.includes(f.path));
        persist();
      },
    },
    async select<R>(q: Query) {
      await load();
      let rows = view(q.table).filter((r) => (q.filters ?? []).every((f) => matches(r, f)));
      for (const o of [...(q.order ?? [])].reverse()) {
        rows = [...rows].sort((a, b) => {
          const x = a[o.col];
          const y = b[o.col];
          const c = x == null ? 1 : y == null ? -1 : x < y ? -1 : x > y ? 1 : 0;
          return o.asc === false ? -c : c;
        });
      }
      if (q.limit) rows = rows.slice(0, q.limit);
      return JSON.parse(JSON.stringify(rows)) as R[];
    },
    async insert<R>(table: string, input: Row | Row[], opts?: { onConflict?: string; ignoreDuplicates?: boolean }) {
      await load();
      const out: Row[] = [];
      for (const raw of Array.isArray(input) ? input : [input]) {
        const conflictCol = opts?.onConflict;
        if (conflictCol && conflictCol.split(',').every((c) => raw[c] != null)) {
          const existing = T(table).find((r) => conflictCol.split(',').every((c) => r[c] === raw[c]));
          if (existing) {
            if (!opts?.ignoreDuplicates) Object.assign(existing, raw);
            out.push(existing);
            continue;
          }
        }
        const row = beforeInsert(table, { ...raw });
        T(table).push(row);
        afterInsert(table, row);
        out.push(row);
      }
      persist();
      return JSON.parse(JSON.stringify(out)) as R[];
    },
    async update<R>(table: string, patch: Row, filters: Filter[]) {
      await load();
      const rows = T(table).filter((r) => filters.every((f) => matches(r, f)));
      for (const r of rows) {
        if (table === 'community_profiles' && patch.pseudonym != null) checkPseudonym({ ...patch, user_id: r.user_id }, false);
        if (table === 'sleeps' && patch.ended_at && patch.ended_at < r.started_at) throw new BackendError('La fin du sommeil ne peut pas précéder son début.');
        if (table === 'parent_sleep_logs') {
          if (r.user_id !== state.session?.userId) continue;
          if (patch.log_date && T(table).some((x) => x.id !== r.id && x.user_id === r.user_id && x.log_date === patch.log_date)) throw new BackendError('Une nuit est déjà enregistrée pour ce jour : modifiez-la plutôt.');
        }
        Object.assign(r, patch, ['reminders', 'profiles', 'pregnancies', 'children', 'parent_sleep_logs', 'contraception_methods', 'consultation_questions'].includes(table) ? { updated_at: nowIso() } : {});
      }
      persist();
      return JSON.parse(JSON.stringify(rows)) as R[];
    },
    async remove(table, filters) {
      await load();
      const removed = T(table).filter((r) => filters.every((f) => matches(r, f)));
      state.tables[table] = T(table).filter((r) => !removed.includes(r));
      if (table === 'post_likes') removed.forEach((l) => { const p = T('posts').find((x) => x.id === l.post_id); if (p) p.like_count = Math.max(0, p.like_count - 1); });
      if (table === 'comments') {
        // Les réponses d'un commentaire supprimé sont supprimées avec lui
        const replies = T('comments').filter((c) => removed.some((x) => x.id === c.parent_id));
        state.tables.comments = T('comments').filter((c) => !replies.includes(c));
        [...removed, ...replies].forEach((c) => { const p = T('posts').find((x) => x.id === c.post_id); if (p) p.comment_count = Math.max(0, p.comment_count - 1); });
      }
      // Suppressions en cascade principales
      if (table === 'children') for (const t of CHILD_TABLES) state.tables[t] = T(t).filter((r) => !removed.some((c) => c.id === r.child_id));
      if (table === 'checklists') state.tables.checklist_items = T('checklist_items').filter((i) => !removed.some((c) => c.id === i.checklist_id));
      if (table === 'assistant_conversations') state.tables.assistant_messages = T('assistant_messages').filter((m) => !removed.some((c) => c.id === m.conversation_id));
      if (table === 'posts') state.tables.comments = T('comments').filter((c) => !removed.some((p) => p.id === c.post_id));
      persist();
    },
    async rpc<R>(fn: string, args?: Row) {
      await load();
      const impl = rpcs[fn];
      if (!impl) throw new BackendError(`Fonction indisponible en mode démonstration : ${fn}`);
      const out = impl(args ?? {});
      persist();
      return out as R;
    },
    async invoke<R>(fn: string, body: unknown) {
      await load();
      const impl = functions[fn];
      if (!impl) throw new BackendError('Service indisponible en mode démonstration.');
      const out = await impl((body ?? {}) as Row);
      persist();
      return out as R;
    },
  };
}
