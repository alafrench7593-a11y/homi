/**
 * Moteur LOCAL de démonstration (aucun serveur). Les données restent sur l'appareil.
 * Il reproduit les règles métier essentielles de la base Supabase afin que
 * l'application se comporte de la même façon ; la sécurité multi-utilisateur
 * (RLS) n'a pas de sens ici puisqu'un seul compte local existe par appareil.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { EXTERNAL_RESOURCES } from '@/content/resources';
// Contenus lourds (catalogues, articles FR et EN, recettes) : chargés à l'ouverture de la démonstration (QA E-06)
import { loadDemoCatalog, loadEmbeddedRecipesModule, type DemoCatalog, type EmbeddedRecipesModule } from '../lazyContent';
import { legacyJourneys, type JourneyRow } from '../journeys/model';
import { getLocale, t as tr } from '@/i18n';
import { lib2 as frDict } from '@/i18n/fr/lib2';
import { lib2 as enDict } from '@/i18n/en/lib2';
import { uuid } from '../uuid';
import { BackendError, type Backend, type Filter, type Query, type Session } from './types';
import { STEP_BY_KEY } from '@/content/discoveries/steps';
import { assessSafety, auditAnswer, crisisMessage, urgentContacts } from '../../../supabase/functions/_shared/safety';
import { assessProduct, type ProductData } from '../../../supabase/functions/_shared/product-rules';
import { ASSISTANT_FOOTER } from '../../../supabase/functions/_shared/assistant-prompt';
import {
  DEV_MODE_LABEL, INJECTION_REFUSAL, MAX_QUESTION_LENGTH, devModeAnswer, isEmptyAnswer, looksLikePromptInjection,
  parseStructuredAnswer, structuredToMarkdown, todayIso,
} from '../../../supabase/functions/_shared/assistant-format';
import { buildSampleFamily } from './demoSample';
import { createSocial } from './demoSocial';
import { createOutings } from './demoOutings';
import { extractiveSummary, MIN_COMMENTS_FOR_SUMMARY } from '../../../supabase/functions/_shared/community-ai';
import { handleBase, handleError, normalizeHandle, textNeedsReview } from '../domain/communityRules';
import { fromProductRow } from '../../../supabase/functions/_shared/open-facts';
import { matchRecalls, type RecallRecord } from '../../../supabase/functions/_shared/rappelconso';
import { sanitizePayload } from '../../../supabase/functions/_shared/scan-explain';
import { DEMO_CIQUAL, DEMO_COSING, DEMO_SCANNER_PRODUCTS, DEMO_SCANNER_RECALLS } from '@/content/scanner-demo';
import { SCAN_SOURCES } from '../domain/scanSources';
import { PRODUCT_VERDICTS } from '../domain/scanProduct';
import { FOOD_VERDICTS } from '../domain/scanFood';

type Row = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
type Tables = Record<string, Row[]>;

const KEY = 'toietmoi.demo.v1';
/** Version des exemples de la communauté : l'augmenter ajoute les nouveaux exemples aux appareils existants. */
const COMMUNITY_SEED_VERSION = 3;
/** Anciens espaces fusionnés (migration 20261022000100) → catégorie d'accueil. */
const MERGED_FORUMS: Record<string, string> = {
  'a55ded38-392a-42ab-ba7c-477e9ee68563': '22c21383-2f1a-4e4f-bb09-676f4924c059', // fertilité → projet bébé
  '7485a2f7-0dc9-40ca-8bfc-19c67f473951': '5add4f3a-9ef7-41aa-a4f8-5acf7c40ed8d', // accouchement → grossesse
  '0b593782-4d84-4e18-bbbc-56a498fec134': '8b3e4c6a-0d5f-4a71-9c32-4d5e6f708192', // parents d'enfants → questions générales
  '9f5651f6-fc01-49a0-aadf-831a5f2b2520': '8b3e4c6a-0d5f-4a71-9c32-4d5e6f708192', // rencontres locales → questions générales
};
/**
 * Bibliothèque de recettes de la démonstration : reconstruite à chaque ouverture depuis l'application (identifiants
 * stables « lib-<slug> »), sans l'enregistrer dans le stockage de l'appareil (environ 150 recettes). Seules les
 * corrections et les changements de statut faits dans l'administration sont conservés (table recipe_overrides).
 */
const LIB_TABLES = ['recipes', 'recipe_ingredients', 'recipe_steps', 'recipe_photos', 'recipe_source_links'];
const isLibRow = (table: string, r: Row) => (table === 'recipes' ? !r.owner_id && String(r.id).startsWith('lib-') : String(r.recipe_id ?? '').startsWith('lib-'));

const CATALOG_TABLES = ['content_categories', 'articles', 'forums', 'emergency_resources', 'foods', 'baby_names', 'products', 'product_recalls', 'plan_limits', 'scan_sources', 'cosing_ingredients', 'ciqual_foods'] as const;
const SCAN_METHODS = ['barcode', 'photo', 'photo_barcode', 'import', 'ingredients_photo', 'manual', 'search'];
/** Message honnête : en démonstration, la base officielle RappelConso n'est jamais interrogée. */
const demoRecallMessage = () => tr('l2.dm.recallCheck');
const CHILD_TABLES = ['child_needs', 'child_need_entries', 'child_treatments', 'child_measurements', 'child_milestones', 'child_health_items', 'breastfeeds', 'pumpings', 'bottles', 'meals', 'food_introductions', 'diapers', 'sleeps', 'child_observations', 'bottle_timers', 'child_wellbeing', 'child_health_trackers', 'child_health_entries', 'child_vaccinations', 'sleep_profiles', 'sleep_feedback', 'child_vaccine_postponements', 'food_tastings', 'child_steps'];

/** Mêmes contrôles que la table bottle_timers (bornes, statut, un seul minuteur actif par enfant). */
function checkBottleTimer(all: Row[], r: Row) {
  if (!Number.isInteger(r.interval_minutes) || r.interval_minutes < 10 || r.interval_minutes > 720) throw new BackendError(tr('l2.dm.timerRange'));
  if (!r.last_bottle_at || !r.due_at || r.due_at <= r.last_bottle_at) throw new BackendError(tr('l2.dm.timerAfter'));
  if (Date.parse(r.due_at) - Date.parse(r.last_bottle_at) > 2 * 86400_000) throw new BackendError(tr('l2.dm.timerFar'));
  if (r.planned_ml != null && (!Number.isInteger(r.planned_ml) || r.planned_ml < 0 || r.planned_ml > 500)) throw new BackendError(tr('l2.dm.timerMl'));
  if (!['active', 'cancelled', 'done'].includes(r.status)) throw new BackendError(tr('l2.dm.timerStatus'));
  if (r.status === 'active' && all.some((x) => x !== r && x.id !== r.id && x.child_id === r.child_id && x.status === 'active')) {
    throw new BackendError(tr('l2.dm.timerActive'), '23505');
  }
}
const OWNER_TABLES: Record<string, string> = {
  period_entries: 'user_id', symptom_logs: 'user_id', ovulation_tests: 'user_id', pregnancy_tests: 'user_id', maternal_weights: 'user_id',
  mood_checkins: 'user_id', reminders: 'user_id', favorites: 'user_id', product_scans: 'user_id', push_devices: 'user_id',
  assistant_conversations: 'user_id', assistant_messages: 'user_id', assistant_feedback: 'user_id', consents: 'user_id', posts: 'author_id', comments: 'author_id', post_photos: 'author_id', community_notification_prefs: 'user_id',
  post_likes: 'user_id', saved_posts: 'user_id', reports: 'reporter_id', user_blocks: 'blocker_id', notes: 'author_id',
  documents: 'uploaded_by', name_votes: 'user_id',
  // Album photo d'un enfant : l'autrice est toujours la personne connectée
  child_photos: 'created_by',
  // Scanner : historique, résultats et favoris strictement personnels
  scan_results: 'user_id', scan_favorites: 'user_id',
  parent_sleep_logs: 'user_id',
  // Grossesse : « Comment je me sens aujourd'hui ? » (jamais visible du foyer)
  pregnancy_symptom_logs: 'user_id',
  // Près de chez moi : favoris et signalements strictement personnels (aucune position enregistrée)
  place_favorites: 'user_id', place_reports: 'user_id',
  // Parcours fertilité : données intimes, strictement personnelles
  intercourse_logs: 'user_id', fertility_observations: 'user_id', contraception_methods: 'user_id', consultation_questions: 'user_id',
  cycle_preferences: 'user_id', discharge_logs: 'user_id', bleeding_logs: 'user_id', cycle_journal: 'user_id',
  contraception_logs: 'user_id', cycle_custom_items: 'user_id', cycle_insight_feedback: 'user_id', cycle_shares: 'owner_id',
  // Parcours : gérés par la personne (le foyer ne les modifie jamais)
  user_journeys: 'user_id',
  recipe_favorites: 'user_id', recipe_dislikes: 'user_id',
  // Post-partum : strictement personnel ; seule la ligne de partage est lisible par le foyer (côté serveur)
  postpartum_settings: 'user_id', postpartum_checkins: 'user_id', trusted_contacts: 'user_id', postpartum_actions: 'user_id', postpartum_shared_status: 'user_id',
};

/** Même filtre que le déclencheur serveur postpartum_filter_shared. */
function filterPostpartumShared(settings: Row | undefined, r: Row) {
  if (!settings || !settings.share_household_id || settings.share_household_id !== r.household_id) {
    throw new BackendError(tr('l2.dm.shareDenied'), '42501');
  }
  if (!settings.share_rest_need) r.rest_need = null;
  if (!settings.share_availability) r.availability = null;
  if (!settings.share_relay_requests) { r.relay_requested = false; r.relay_note = null; }
  if (!settings.share_summary) r.summary = null;
  r.updated_at = new Date().toISOString();
}

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

export function createDemoBackend(opts: { streamDelayMs?: number } = {}): Backend {
  const streamDelayMs = opts.streamDelayMs ?? 14;
  let state: DemoState = { users: [], session: null, tables: {} };
  let loaded: Promise<void> | null = null;
  const listeners = new Set<(s: Session | null) => void>();
  let saveTimer: ReturnType<typeof setTimeout> | null = null;

  let catalog: DemoCatalog | null = null;
  let recipeLibrary: EmbeddedRecipesModule['ALL_RECIPES'] = [];

  async function load() {
    if (!loaded) {
      loaded = (async () => {
        // Web : morceau séparé, téléchargé ici seulement ; iOS et Android : déjà embarqué dans l'application.
        // Téléchargement échoué (réseau coupé sur le web) : on pourra réessayer au prochain appel.
        const [cat, recipesModule] = await Promise.all([loadDemoCatalog(), loadEmbeddedRecipesModule()]).catch((err: unknown) => { loaded = null; throw err; });
        catalog = cat;
        recipeLibrary = recipesModule.ALL_RECIPES;
        const { catalogs, EXTRA_CATEGORIES, libraryArticleRows, ARTICLES_EN, CATEGORIES_EN } = cat;
        try {
          const raw = await AsyncStorage.getItem(KEY);
          if (raw) state = JSON.parse(raw);
        } catch {
          // stockage illisible : on repart d'un état vide
        }
        for (const t of CATALOG_TABLES) state.tables[t] = JSON.parse(JSON.stringify(catalogs[t] ?? []));
        // Bibliothèque : nouvelles catégories et articles par parcours (statut éditorial « À vérifier »)
        for (const c of EXTRA_CATEGORIES) if (!state.tables.content_categories.some((x) => x.slug === c.slug)) state.tables.content_categories.push({ id: `cat-${c.slug}`, ...c });
        for (const x of state.tables.articles) x.editorial_status ??= 'to_review';
        const seenArticles = new Set(state.tables.articles.map((x) => x.slug));
        for (const r of libraryArticleRows(state.tables.content_categories as never)) if (!seenArticles.has(r.slug)) state.tables.articles.push(r as unknown as Row);
        // Versions anglaises (articles et thèmes), comme les colonnes *_en du serveur
        for (const x of state.tables.articles) { const en = ARTICLES_EN[String(x.slug)]; if (en) { x.title_en = en.title; x.summary_en = en.summary; x.body_md_en = en.body_md; } }
        for (const c of state.tables.content_categories) { const l = CATEGORIES_EN[String(c.slug)]; if (l) c.label_en = l; }
        // Scanner : données de démonstration (fictives, is_demo = true), mêmes que la section « Scanner » de supabase/seed.sql
        for (const p of DEMO_SCANNER_PRODUCTS) if (!state.tables.products.some((x) => x.barcode === p.barcode)) state.tables.products.push(JSON.parse(JSON.stringify(p)));
        for (const r of DEMO_SCANNER_RECALLS) if (!state.tables.product_recalls.some((x) => x.id === r.id)) state.tables.product_recalls.push(JSON.parse(JSON.stringify(r)));
        state.tables.scan_sources = Object.values(SCAN_SOURCES).map((x) => ({ ...x }));
        state.tables.cosing_ingredients = JSON.parse(JSON.stringify(DEMO_COSING));
        state.tables.ciqual_foods = JSON.parse(JSON.stringify(DEMO_CIQUAL));
        // Recettes : copie de la bibliothèque (mêmes lignes que la migration générée) ; conservée pour garder les validations faites dans l'administration
        seedRecipes();
        // Sources et lectures : mêmes lignes que la migration 0700 (pages réellement consultées)
        for (const r of EXTERNAL_RESOURCES) if (!T('external_resources').some((x) => x.slug === r.slug)) T('external_resources').push({ id: `res-${r.slug}`, status: 'published', created_at: `${r.consulted_on}T12:00:00Z`, ...r });
        // Communauté v2 : publications des espaces fusionnés rattachées à leur nouvelle catégorie, identifiants « @ »
        for (const post of T('posts')) if (MERGED_FORUMS[post.forum_id]) post.forum_id = MERGED_FORUMS[post.forum_id];
        for (const cp of T('community_profiles')) if (!cp.handle) cp.handle = uniqueHandle(handleBase(cp.pseudonym), cp.user_id);
        if ((state.tables._community_seed?.[0]?.version ?? 0) < COMMUNITY_SEED_VERSION) seedCommunity();
        social.seed();
      })();
    }
    return loaded;
  }

  function persist() {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      for (const id of dirtyLib) {
        const row = T('recipes').find((r) => r.id === id);
        if (!row) continue;
        const steps = T('recipe_steps').filter((x) => x.recipe_id === id).sort((a, b) => Number(a.position) - Number(b.position)).map((x) => x.body);
        state.tables.recipe_overrides = [...T('recipe_overrides').filter((o) => o.recipe_id !== id), { recipe_id: id, row: { title: row.title, summary: row.summary, storage: row.storage, nutrition: row.nutrition, status: row.status, verified_on: row.verified_on }, steps }];
      }
      dirtyLib.clear();
      const tables: Tables = {};
      for (const [k, v] of Object.entries(state.tables)) {
        if ((CATALOG_TABLES as readonly string[]).includes(k)) continue;
        tables[k] = LIB_TABLES.includes(k) ? v.filter((r) => !isLibRow(k, r)) : k === 'recipe_reviews' ? v.filter((r) => !String(r.id).startsWith('seed-')) : k === 'recipe_sources' ? [] : v;
      }
      AsyncStorage.setItem(KEY, JSON.stringify({ ...state, tables })).catch(() => undefined);
    }, 150);
  }

  const T = (name: string) => (state.tables[name] ??= []);
  const uid = () => {
    if (!state.session) throw new BackendError(tr('l2.dm.signinDot'), '42501');
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
  /** « Je grandis » : étapes du catalogue, statuts sans jugement, suivi complet Premium (« ne pas suivre » toujours possible). */
  function checkChildStep(r: Row) {
    const step = STEP_BY_KEY[r.step_key as string];
    if (!step) throw new BackendError(tr('l2.dm.stepUnknown'));
    if (!['observed', 'in_progress', 'not_yet', 'not_tracked'].includes(r.status as string)) throw new BackendError(tr('l2.dm.stepStatus'));
    if (r.status !== 'not_tracked' && !step.main && !isPremium()) throw new BackendError('Fonction Premium (development_full)', 'P0001', 'premium_required');
    r.updated_at = nowIso();
  }
  /** Cycle (miroir de 20261024000100_cycle_v3.sql) : étiquettes, suivi intime volontaire, préférences Premium. */
  const CYCLE_MOODS = ['happy', 'calm', 'energetic', 'sensitive', 'irritable', 'anxious', 'sad', 'stressed', 'low', 'stable'];
  const CYCLE_HABITS = ['sport', 'walk', 'hydration', 'alcohol', 'tobacco', 'stress_day', 'travel', 'night_work', 'illness', 'event'];
  function checkSymptomRow(r: Row) {
    const tags = (r.tags as string[] | undefined) ?? [];
    if (tags.length > 10 || tags.some((t) => typeof t !== 'string' || t.trim().length < 1 || t.length > 30 || /[<>]/.test(t))) throw new BackendError(tr('l2.dm.tagsInvalid'), '23514');
    if (((r.moods as string[] | undefined) ?? []).some((m) => !CYCLE_MOODS.includes(m))) throw new BackendError(tr('l2.dm.moodUnknown'), '23514');
    if (((r.habits as string[] | undefined) ?? []).some((m) => !CYCLE_HABITS.includes(m))) throw new BackendError(tr('l2.dm.habitUnknown'), '23514');
    if (tags.length && !isPremium()) {
      const others = new Set(T('symptom_logs').filter((x) => x.user_id === r.user_id && x.id !== r.id).flatMap((x) => (x.tags as string[] | undefined) ?? []));
      const all = new Set([...others, ...tags]);
      if (all.size > 3 && tags.some((t) => !others.has(t))) throw new BackendError('Fonction Premium (cycle_tags)', 'P0001', 'premium_required');
    }
  }
  function checkCyclePrefs(next: Row, prev?: Row) {
    if (next.favorites && (next.favorites as unknown[]).length > 5) throw new BackendError(tr('l2.dm.shortcutsMax'), '23514');
    if (next.lock_mode && !['off', 'intimate', 'cycle'].includes(next.lock_mode as string)) throw new BackendError(tr('l2.dm.lockUnknown'), '23514');
    if (next.anticipation && !prev?.anticipation && !isPremium()) throw new BackendError('Fonction Premium (cycle_anticipation)', 'P0001', 'premium_required');
  }
  const sameHousehold = (a: string, b: string) => T('household_members').some((x) => x.user_id === a && T('household_members').some((y) => y.user_id === b && y.household_id === x.household_id));
  /** Abonnement d'une autre personne (pause du partage du cycle) ; en démonstration, l'abonnement est celui de la ligne. */
  const premiumOf = (id: string) => T('subscriptions').some((s2) => s2.user_id === id && ['trial', 'active', 'grace', 'cancelled'].includes(s2.status) && (!s2.expires_at || s2.expires_at > nowIso()));
  let replyTarget: string | null = null;
  const isModerator = () => T('user_roles').some((x) => x.user_id === state.session?.userId && ['moderator', 'admin'].includes(x.role as string));
  const blockedBetween = (a: string, b: string) => T('user_blocks').some((x) => (x.blocker_id === a && x.blocked_id === b) || (x.blocker_id === b && x.blocked_id === a));
  /** Pseudonyme : format, unicité, jamais le prénom du profil ni l'identifiant de l'e-mail. */
  function checkPseudonym(r: Row, creating: boolean) {
    if (r.pseudonym == null) return;
    r.pseudonym = String(r.pseudonym).trim();
    if (!PSEUDONYM.test(r.pseudonym)) throw new BackendError(tr('l2.dm.pseudoInvalid'));
    const owner = r.user_id ?? state.session?.userId;
    if (T('community_profiles').some((p) => p.pseudonym === r.pseudonym && (creating || p.user_id !== owner))) throw new BackendError(tr('l2.dm.pseudoTaken'), '23505');
    const name = T('profiles').find((p) => p.id === owner)?.display_name;
    const email = state.users.find((u) => u.id === owner)?.email.split('@')[0];
    const lower = r.pseudonym.toLowerCase();
    if ((name && lower === String(name).trim().toLowerCase()) || (email && lower === email.toLowerCase())) {
      throw new BackendError(tr('l2.dm.pseudoPersonal'), 'P0001', 'pseudonym_identifying');
    }
  }
  const notify = (userId: string, n: Row) => T('notifications').push({ id: uuid(), user_id: userId, payload: {}, read_at: null, created_at: nowIso(), ...n });
  /** Même règle que community_notify : chaque type se désactive séparément. */
  const PREF_OF: Record<string, string> = { community_comment: 'post_comment', community_reply: 'comment_reply', community_like: 'reaction', community_saved: 'saved_reply', community_moderation: 'moderation' };
  const communityNotify = (userId: string | null | undefined, n: Row) => {
    if (!userId) return;
    const prefs = T('community_notification_prefs').find((x) => x.user_id === userId);
    if (prefs && prefs[PREF_OF[n.category]] === false) return;
    notify(userId, n);
  };
  /** Jamais l'identité de l'auteur d'une publication anonyme. */
  const actorLabel = (userId: string, postId: string) => {
    const post = T('posts').find((x) => x.id === postId);
    if (post?.anonymous && post.author_id === userId) return tr('l2.dm.authorAnon');
    return T('community_profiles').find((x) => x.user_id === userId)?.pseudonym ?? tr('l2.soc.someone');
  };
  function uniqueHandle(base: string, owner: string) {
    let h = base; let n = 0;
    while (T('community_profiles').some((x) => x.handle === h && x.user_id !== owner)) { n += 1; h = `${base.slice(0, 15)}_${100 + Math.floor(Math.random() * 900)}`; if (n > 50) h = `membre_${uuid().slice(0, 8)}`; }
    return h;
  }
  /** Identifiant « @ », avatar, présentation : mêmes contrôles que community_profile_guard. */
  function checkCommunityProfile(r: Row, existing?: Row) {
    const owner = existing?.user_id ?? r.user_id ?? state.session?.userId;
    if (r.handle == null || String(r.handle).trim() === '') {
      if (!existing) r.handle = uniqueHandle(handleBase(String(r.pseudonym ?? 'membre')), owner);
      else if ('handle' in r) r.handle = existing.handle;
    } else {
      const err = handleError(String(r.handle));
      if (err) throw new BackendError(err, 'P0001', 'handle_invalid');
      r.handle = normalizeHandle(String(r.handle));
      if (T('community_profiles').some((x) => x.handle === r.handle && x.user_id !== owner)) throw new BackendError(tr('l2.dm.handleTaken'), '23505');
    }
    if (r.avatar_path && String(r.avatar_path).split('/')[0] !== owner) throw new BackendError(tr('l2.dm.avatarInvalid'), '42501');
    if (r.bio != null) { r.bio = String(r.bio).trim() || null; if (r.bio && r.bio.length > 280) throw new BackendError(tr('l2.dm.bioMax')); }
    if (r.visibility != null && !['members', 'minimal'].includes(r.visibility)) throw new BackendError(tr('l2.dm.visibilityInvalid'));
    r.updated_at = nowIso();
  }
  /** Masquage ou rétablissement par la modération : l'autrice est informée (on_moderated). */
  function moderationNotice(kind: 'post' | 'comment', target: Row, before: string) {
    if (target.status === before) return;
    const postId = kind === 'post' ? target.id : target.post_id;
    const link = kind === 'post' ? `/community/post/${postId}` : `/community/post/${postId}?comment=${target.id}`;
    const what = kind === 'post' ? tr('l2.dm.whatPost') : tr('l2.dm.whatComment');
    if (['hidden', 'removed'].includes(target.status) && ['visible', 'pending_review'].includes(before)) {
      communityNotify(target.author_id, { category: 'community_moderation', title: tr(target.status === 'removed' ? 'l2.dm.modRemoved' : 'l2.dm.modHidden', { what }), body: tr('l2.dm.modBody'), deep_link: link, payload: { post_id: postId, status: target.status } });
    } else if (target.status === 'visible' && ['pending_review', 'hidden'].includes(before)) {
      communityNotify(target.author_id, { category: 'community_moderation', title: tr('l2.dm.modVisible', { what }), body: null, deep_link: link, payload: { post_id: postId, status: target.status } });
    }
  }

  /** Reconstruit la bibliothèque (hors stockage), garde les recettes personnelles et applique les corrections enregistrées. */
  // Mini-réseau social (mêmes règles que 20261023000100_community_social.sql)
  const social = createSocial({ T, me: () => state.session?.userId, uid, uuid, nowIso, limit, isModerator, blockedBetween, notify, actorLabel });
  // Sorties & rencontres (mêmes règles que 20261028000100_outings_meetups.sql)
  const outings = createOutings({ T, me: () => state.session?.userId, nowIso, isModerator, blockedBetween,
    needsReview: (text) => PERSONAL_DATA.test(text) || textNeedsReview(text) || DEMO_TERMS.some((x) => x.pattern.test(text)) });

  function seedRecipes() {
    const rows = catalog!.recipeSeedRows(recipeLibrary);
    // Conservées : recettes personnelles et recettes importées par l'équipe (identifiant hors « lib- »)
    const libSlugs = new Set(rows.recipes.map((r) => r.slug));
    const personalIds = new Set(T('recipes').filter((r) => !isLibRow('recipes', r) && (r.owner_id || !libSlugs.has(r.slug))).map((r) => r.id));
    for (const [t, list] of Object.entries(rows)) {
      const keep = (state.tables[t] ?? []).filter((r) => (t === 'recipes' ? personalIds.has(r.id) : t === 'recipe_sources' ? false : t === 'recipe_reviews' ? !String(r.id).startsWith('seed-') && (personalIds.has(r.recipe_id) || String(r.recipe_id).startsWith('lib-')) : personalIds.has(r.recipe_id)));
      state.tables[t] = [...keep, ...list];
    }
    for (const o of T('recipe_overrides')) {
      const row = T('recipes').find((r) => r.id === o.recipe_id);
      if (!row) continue;
      Object.assign(row, o.row);
      if (Array.isArray(o.steps)) state.tables.recipe_steps = [...T('recipe_steps').filter((x) => x.recipe_id !== o.recipe_id), ...(o.steps as string[]).map((body, n) => ({ recipe_id: o.recipe_id, position: n + 1, body }))];
    }
  }
  const dirtyLib = new Set<string>();
  function markLib(table: string, rows: Row[]) {
    if (!LIB_TABLES.includes(table)) return;
    for (const r of rows) if (isLibRow(table, r)) dirtyLib.add(String(table === 'recipes' ? r.id : r.recipe_id));
  }
  function seedCommunity() {
    const forum = (slug: string) => T('forums').find((f) => f.slug === slug)?.id;
    const others = [
      { user_id: 'demo-voisine-1', pseudonym: 'Maïa_et_Sohan', handle: 'maia_et_sohan', area_label: 'Lyon', bio: tr('l2.dm.bioMaia'), avatar_preset: 'flower', journey_label: 'bebe', visibility: 'members' },
      { user_id: 'demo-voisin-2', pseudonym: 'PapaDeNour', handle: 'papadenour', area_label: 'Lille', bio: tr('l2.dm.bioPapa'), avatar_preset: 'whale', journey_label: 'jumeaux', visibility: 'members' },
      { user_id: 'demo-voisine-3', pseudonym: 'Clem.2026', handle: 'clem_2026', area_label: 'Nantes', bio: null, avatar_preset: 'moon', journey_label: null, visibility: 'minimal' },
    ];
    // Amorçage additif : un appareil qui avait déjà la démo reçoit les nouveaux exemples sans perdre ses données
    for (const o of others) {
      const existing = T('community_profiles').find((x) => x.user_id === o.user_id);
      if (existing) { for (const [k, v] of Object.entries(o)) if (existing[k] == null) existing[k] = v; existing.handle = o.handle; }
      else T('community_profiles').push({ ...o, suspended_until: null, created_at: new Date(Date.now() - 200 * 86_400_000).toISOString() });
    }
    const p = (slugF: string, author: string, title: string | null, body: string, hoursAgo: number, likes = 0) => ({
      id: uuid(), forum_id: forum(slugF), author_id: author, title, body, area_label: null as string | null, kind: 'question', anonymous: false, status: 'visible', report_count: 0,
      like_count: likes, comment_count: 0, created_at: new Date(Date.now() - hoursAgo * 3600_000).toISOString(), edited_at: null,
    });
    const samples = [
      p('post-partum', 'demo-voisine-1', tr('l2.dm.sp0t'), tr('l2.dm.sp0b'), 5, 12),
      p('jumeaux-triples', 'demo-voisin-2', tr('l2.dm.sp1t'), tr('l2.dm.sp1b'), 20, 31),
      p('grossesse', 'demo-voisine-3', tr('l2.dm.sp2t'), tr('l2.dm.sp2b'), 30, 7),
      p('plusieurs-enfants', 'demo-voisin-2', tr('l2.dm.sp3t'), tr('l2.dm.sp3b'), 52, 18),
      p('sommeil', 'demo-voisine-1', tr('l2.dm.sp4t'), tr('l2.dm.sp4b'), 8, 9),
      p('diversification', 'demo-voisine-3', tr('l2.dm.sp5t'), tr('l2.dm.sp5b'), 26, 14),
      p('projet-bebe', 'demo-voisine-1', tr('l2.dm.sp6t'), tr('l2.dm.sp6b'), 40, 22),
      p('projet-bebe', 'demo-voisine-3', tr('l2.dm.sp7t'), tr('l2.dm.sp7b'), 70, 6),
      p('biberon', 'demo-voisin-2', tr('l2.dm.sp8t'), tr('l2.dm.sp8b'), 12, 5),
      { ...p('questions-generales', 'demo-voisine-1', tr('l2.dm.sp9t'), tr('l2.dm.sp9b'), 16, 3), area_label: 'Lyon' },
      { ...p('nouveau-ne', 'demo-voisin-2', null, tr('l2.dm.sp10b'), 3, 25), kind: 'testimony' },
      { ...p('post-partum', 'demo-voisine-3', null, tr('l2.dm.sp11b'), 10, 16), kind: 'testimony', anonymous: true },
    ];
    const added = new Set<number>();
    samples.forEach((s, i) => {
      const alt = (getLocale() === 'en' ? frDict : enDict) as Record<string, string>; // la même publication dans l'autre langue : jamais de doublon
      const altTitle = s.title ? alt[`l2.dm.sp${i}t`] : null;
      const altBody = alt[`l2.dm.sp${i}b`];
      if (!s.forum_id || T('posts').some((x) => (s.title ? x.title === s.title || x.title === altTitle : x.body === s.body || x.body === altBody))) return;
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
    const first = c(0, 'demo-voisine-3', tr('l2.dm.sc0'));
    if (first) c(0, 'demo-voisine-1', tr('l2.dm.sc1'), first.id);
    c(1, 'demo-voisine-1', tr('l2.dm.sc2'));
    c(4, 'demo-voisin-2', tr('l2.dm.sc3'));
    const anonReply = c(12, 'demo-voisine-1', tr('l2.dm.sc4'));
    if (anonReply) c(12, 'demo-voisine-3', tr('l2.dm.sc5'), anonReply.id);
    state.tables._community_seed = [{ version: COMMUNITY_SEED_VERSION }];
  }

  // ---------------------------------------------------------------- scanner (mêmes règles que 20261016000600_scanner.sql)
  const monthKey = () => new Date().toISOString().slice(0, 7);
  function scanUsed(userId: string) {
    return T('scan_usage').find((u) => u.user_id === userId && u.month === monthKey())?.analyses ?? 0;
  }
  function checkScan(r: Row) {
    r.kind ??= 'product';
    r.confirmed ??= false;
    r.product_snapshot ??= {};
    r.answers ??= {};
    r.sources ??= [];
    r.is_demo ??= false;
    r.verdict ??= null;
    r.analysed_at ??= null;
    if (!['product', 'food'].includes(r.kind)) throw new BackendError(tr('l2.dm.scanType'));
    if (!SCAN_METHODS.includes(r.method)) throw new BackendError(tr('l2.dm.scanMethod'));
    const allowed: readonly string[] = r.kind === 'product' ? PRODUCT_VERDICTS : FOOD_VERDICTS;
    if (r.verdict != null && !allowed.includes(r.verdict)) throw new BackendError(tr('l2.dm.scanVerdict'));
    if ((r.verdict == null) !== (r.analysed_at == null)) throw new BackendError(tr('l2.dm.scanDate'));
    if (r.analysed_at) {
      // Quota mensuel des analyses : compteur non remboursé par la suppression de l'historique
      const used = scanUsed(r.user_id);
      if (used >= limit('product_scans_per_month')) throw new BackendError('Limite de la version gratuite atteinte (product_scans_per_month)', 'P0001', 'premium_required');
      const row = T('scan_usage').find((u) => u.user_id === r.user_id && u.month === monthKey());
      if (row) row.analyses += 1;
      else T('scan_usage').push({ user_id: r.user_id, month: monthKey(), analyses: 1 });
    }
  }
  const scanMatchesRecall = (s: Row, rc: Row) =>
    (rc.product_id && s.product_id === rc.product_id) || (s.barcode && (s.barcode === rc.barcode || (rc.gtins ?? []).includes(s.barcode)));
  /** Notifie une personne d'un rappel concernant un produit de son historique (une seule fois par rappel). */
  function notifyRecall(rc: Row, userId: string): number {
    if (T('scan_recall_alerts').some((a) => a.user_id === userId && a.recall_id === rc.id)) return 0;
    const scan = T('product_scans').filter((s) => s.user_id === userId && scanMatchesRecall(s, rc)).sort((a, b) => (a.created_at < b.created_at ? 1 : -1))[0];
    if (!scan) return 0;
    T('scan_recall_alerts').push({ user_id: userId, recall_id: rc.id, created_at: nowIso() });
    notify(userId, {
      category: 'product_recall', title: tr(rc.is_demo ? 'l2.dm.recallDemo' : 'l2.dm.recallOfficial', { title: String(rc.title) }), body: String(rc.reason ?? '').slice(0, 240),
      deep_link: `/scanner/result/${scan.id}`, payload: { recall_id: rc.id, scan_id: scan.id, is_demo: !!rc.is_demo },
    });
    return 1;
  }
  function recallsFor(p: { barcode?: string | null; brand?: string | null; name?: string | null }): Row[] {
    const out = new Map<string, Row>();
    if (p.barcode) for (const r of T('product_recalls')) if (r.barcode === p.barcode || (r.gtins ?? []).includes(p.barcode)) out.set(r.id, { ...r, match: 'gtin' });
    if (p.brand && p.name) {
      const records: (RecallRecord & { row: Row })[] = T('product_recalls').map((r) => ({
        key: r.id, gtins: r.gtins ?? [], title: r.title, brand: r.brand ?? null, product_name: r.product_name ?? null, reason: r.reason, risks: r.risks ?? null,
        recommended_action: r.recommended_action, official_url: r.official_url, image_url: null, published_on: r.published_on, lot_numbers: r.lot_numbers ?? [], category: null, row: r,
      }));
      for (const m of matchRecalls(records, { brand: p.brand, name: p.name })) {
        const row = (m.record as RecallRecord & { row: Row }).row;
        if (!out.has(row.id)) out.set(row.id, { ...row, match: m.match });
      }
    }
    return [...out.values()];
  }
  const demoRecallCheck = () => ({ checked: false, source: 'RappelConso', error: demoRecallMessage(), checkedOn: new Date().toISOString().slice(0, 10) });

  // ---------------------------------------------------------------- charge familiale (mêmes règles que les déclencheurs SQL)
  function taskEvent(t: Row, kind: string, detail: Row = {}) {
    T('family_task_events').push({ id: uuid(), task_id: t.id, household_id: t.household_id, actor_id: state.session?.userId ?? null, kind, detail, created_at: nowIso() });
  }
  function nextOccurrence(t: Row) {
    if (t.status !== 'done' || !t.recurrence || !t.due_at) return;
    const every = Number(t.recurrence.every ?? 1);
    const d = new Date(t.due_at);
    if (t.recurrence.type === 'daily') d.setUTCDate(d.getUTCDate() + every);
    else if (t.recurrence.type === 'weekly') d.setUTCDate(d.getUTCDate() + 7 * every);
    else d.setUTCMonth(d.getUTCMonth() + every);
    const due = d.toISOString();
    if (T('family_tasks').some((x) => x.household_id === t.household_id && x.title === t.title && x.due_at === due && x.status === 'todo')) return;
    const next = { ...t, id: uuid(), due_at: due, status: 'todo', done_at: null, done_by: null, created_at: nowIso(), updated_at: nowIso() };
    T('family_tasks').push(next);
    taskEvent(next, 'created');
  }

  // ---------------------------------------------------------------- règles d'insertion
  function beforeInsert(table: string, r: Row): Row {
    social.beforeInsert(table, r);
    outings.beforeInsert(table, r);
    const me = state.session?.userId;
    const ownerCol = OWNER_TABLES[table];
    if (ownerCol && r[ownerCol] == null && me) r[ownerCol] = me;
    r.id ??= uuid();
    r.created_at ??= nowIso();
    // Catalogue de produits : mêmes règles que la base (code-barres unique, prix datés et sourcés, jamais dans le futur)
    if (table === 'kid_products') {
      if (!/^[0-9]{8,14}$/.test(String(r.barcode ?? ''))) throw new BackendError(tr('l2.dm.barcodeInvalid'));
      if (T('kid_products').some((p) => p.barcode === r.barcode)) throw new BackendError(tr('l2.dm.productExists'), '23505');
      r.status ??= 'draft'; r.benefits ??= []; r.precautions ??= []; r.updated_at ??= nowIso();
    }
    if (table === 'external_resources') {
      if (!/^https:\/\//.test(String(r.url ?? ''))) throw new BackendError(tr('l2.dm.httpsRequired'));
      if (String(r.description ?? '').length > 400) throw new BackendError(tr('l2.dm.summaryLong'));
      if (T('external_resources').some((x) => x.slug === r.slug)) throw new BackendError(tr('l2.dm.idExists'), '23505');
      r.status ??= 'draft'; r.topics ??= [];
    }
    if (table === 'product_prices' || table === 'ingredient_prices') {
      const day = String(r.observed_on ?? r.checked_on ?? '');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || day > nowIso().slice(0, 10)) throw new BackendError(tr('l2.dm.priceDate'));
      if (r.source === 'open_prices' && !r.source_url) throw new BackendError(tr('l2.dm.priceSource'));
      if (table === 'product_prices' && !(Number(r.price) > 0)) throw new BackendError(tr('l2.dm.priceInvalid'));
    }

    if (CHILD_TABLES.includes(table)) {
      const child = T('children').find((c) => c.id === r.child_id);
      if (!child) throw new BackendError(tr('l2.dm.childNotFound'));
      r.household_id = child.household_id;
      if (r.created_by == null) r.created_by = me;
    }
    // Valeurs par défaut de la table children (comme en SQL) : sinon un profil créé n'apparaîtrait pas (filtre archived = false)
    if (table === 'children') {
      r.archived ??= false; r.allergies_declared ??= []; r.photo_path ??= null; r.habits ??= null;
      r.enabled_tracking ??= ['breastfeed', 'bottle', 'diaper', 'sleep', 'meal', 'growth'];
    }
    // Miroir du déclencheur reminders_journey_type : chaque rappel appartient à un parcours
    if (table === 'reminders' && r.journey_type == null) {
      const link = String(r.deep_link ?? '');
      const body = T('user_journeys').find((j) => j.user_id === r.user_id && j.status === 'active' && ['avoid', 'ttc', 'cycle'].includes(j.type as string));
      r.journey_type = r.pregnancy_id || link.startsWith('/pregnancy') ? 'pregnancy' : link.startsWith('/fertility') ? 'ttc' : link.startsWith('/contraception') ? 'avoid'
        : link.startsWith('/cycle') ? (body?.type ?? 'cycle') : link.startsWith('/postpartum') ? 'postpartum' : r.child_id && (link.startsWith('/bottle') || link.startsWith('/track')) ? 'baby' : null;
    }
    if (table === 'expected_babies') r.household_id = T('pregnancies').find((p) => p.id === r.pregnancy_id)?.household_id;
    if (table === 'checklist_items') r.household_id = T('checklists').find((p) => p.id === r.checklist_id)?.household_id;
    if (table === 'name_votes') r.household_id = T('name_favorites').find((p) => p.id === r.favorite_id)?.household_id;

    if (table === 'assistant_feedback') {
      const m = T('assistant_messages').find((x) => x.id === r.message_id);
      if (!m || m.user_id !== me || m.role !== 'assistant') throw new BackendError(tr('l2.dm.forbidden'), '42501');
      if (![1, -1].includes(r.value)) throw new BackendError(tr('l2.dm.valueInvalid'));
      r.updated_at = nowIso();
    }
    // Planificateur de sommeil : un profil par enfant, un avis par estimation (mêmes contraintes qu'en SQL)
    if (table === 'sleep_profiles') {
      if (T('sleep_profiles').some((x) => x.child_id === r.child_id)) throw new BackendError(tr('l2.dm.sleepProfile'), '23505');
      r.use_corrected ??= false; r.routine_minutes ??= 20; r.difficulties ??= []; r.notify ??= { enabled: false }; r.updated_at = nowIso();
    }
    if (table === 'sleep_feedback') {
      if (!['nap', 'bedtime'].includes(r.target) || !['right', 'early', 'late'].includes(r.verdict)) throw new BackendError(tr('l2.dm.opinionInvalid'));
      if (T('sleep_feedback').some((x) => x.child_id === r.child_id && x.target === r.target && x.estimated_for === r.estimated_for)) throw new BackendError(tr('l2.dm.opinionExists'), '23505');
      r.created_at ??= nowIso();
    }
    if (table === 'sleeps' && !r.ended_at && T('sleeps').some((s) => s.child_id === r.child_id && !s.ended_at)) {
      throw new BackendError(tr('l2.dm.sleepOngoing'));
    }
    if (table === 'bottles' && r.in_progress && T('bottles').some((b) => b.child_id === r.child_id && b.in_progress)) {
      throw new BackendError(tr('l2.dm.bottleOngoing'), '23505');
    }
    if (table === 'child_health_trackers' && (r.low_threshold != null || r.high_threshold != null) && !(r.thresholds_from_plan && r.plan_by)) {
      throw new BackendError(tr('l2.dm.thresholdPlan'));
    }
    if (table === 'bottles' && r.prepared_ml != null && r.consumed_ml != null && r.consumed_ml > r.prepared_ml) {
      throw new BackendError(tr('l2.dm.bottleDrunk'));
    }
    const quota: Record<string, string> = { documents: 'documents_count', checklists: 'checklists_count', children: 'children_count' };
    if (quota[table]) {
      const count = T(table).filter((x) => x.household_id === r.household_id).length;
      if (count >= limit(quota[table])) throw new BackendError('Limite de la version gratuite atteinte.', 'P0001', 'premium_required');
    }
    if (table === 'product_scans') checkScan(r);
    // Fonctions Premium : mêmes règles que les déclencheurs serveur (20261021000500_premium.sql)
    const PREMIUM_INSERT: Record<string, string> = { meal_plans: 'weekly_menu', bedtime_routines: 'bedtime_routine', sleep_feedback: 'sleep_insights' };
    if (PREMIUM_INSERT[table] && !isPremium()) throw new BackendError(`Fonction Premium (${PREMIUM_INSERT[table]})`, 'P0001', 'premium_required');
    // « Ses découvertes » : quelques aliments gratuits par enfant (20261027000100_discoveries_grow_nearby.sql)
    if (table === 'food_introductions') {
      r.status ??= 'tasted'; r.reaction ??= false; r.favorite ??= false; r.created_at ??= nowIso(); r.updated_at = nowIso();
      if (!['not_yet', 'tasted', 'liked', 'refused'].includes(r.status as string)) throw new BackendError(tr('l2.dm.foodStatus'));
      if (r.status !== 'not_yet' && !r.first_tried_on) throw new BackendError(tr('l2.dm.foodDate'));
      if (r.food_key && T('food_introductions').some((x) => x.child_id === r.child_id && x.food_key === r.food_key)) throw new BackendError(tr('l2.dm.foodExists'), '23505');
      // Comme la base (unique child_id, food_name) : F-02, la démo ne doit pas accepter ce que la base refuse
      if (T('food_introductions').some((x) => x.child_id === r.child_id && x.food_name === r.food_name)) throw new BackendError(tr('l2.dm.foodExists'), '23505');
      const n = T('food_introductions').filter((x) => x.child_id === r.child_id).length;
      if (n >= limit('food_discoveries_per_child')) throw new BackendError('Limite de la version gratuite atteinte (food_discoveries_per_child)', 'P0001', 'premium_required');
    }
    if (table === 'food_tastings' && !['tasted', 'liked', 'refused'].includes(r.status as string)) throw new BackendError(tr('l2.dm.statusInvalid'));
    if (table === 'child_steps') checkChildStep(r);
    if (table === 'reminders' && r.category === 'custom' && !r.treatment_id) {
      const active = T('reminders').filter((x) => x.user_id === (r.user_id ?? me) && x.category === 'custom' && !x.treatment_id && x.enabled !== false).length;
      if (active >= limit('custom_reminders_count')) throw new BackendError('Limite de la version gratuite atteinte (custom_reminders_count)', 'P0001', 'premium_required');
    }
    if (table === 'family_tasks') {
      r.status ??= 'todo'; r.priority ??= 'normal'; r.category ??= 'other'; r.essential ??= false; r.created_by ??= me; r.updated_at = nowIso();
      if (r.status === 'done') { r.done_at ??= nowIso(); r.done_by ??= me; }
    }
    if (table === 'care_requests') {
      if (r.kind === 'take_task' && !r.task_id) throw new BackendError(tr('l2.dm.taskChoose'));
      r.from_user = me; r.status = 'open'; r.responded_by = null; r.responded_at = null;
    }
    if (table === 'care_shifts') {
      if (Date.parse(r.ends_at) <= Date.parse(r.starts_at) || Date.parse(r.ends_at) - Date.parse(r.starts_at) > 86400000) throw new BackendError(tr('l2.dm.slotMax'));
      if (r.kind === 'me_time' && r.user_id !== me) throw new BackendError(tr('l2.dm.ownTime'), '42501');
      r.status ??= 'planned'; r.created_by ??= me;
    }
    if (table === 'routines' && (!Array.isArray(r.items) || r.items.length === 0)) throw new BackendError(tr('l2.dm.stepAtLeast'));
    if (table === 'postpartum_shared_status') filterPostpartumShared(T('postpartum_settings').find((x) => x.user_id === r.user_id), r);
    if (table === 'postpartum_checkins' && T(table).some((x) => x.user_id === r.user_id && x.checkin_date === r.checkin_date)) {
      throw new BackendError(tr('l2.dm.pointExists'), '23505');
    }
    if (table === 'scan_results' || table === 'scan_favorites') {
      const scan = T('product_scans').find((x) => x.id === r.scan_id);
      if (!scan || scan.user_id !== me) throw new BackendError(tr('l2.dm.forbidden'), '42501');
      if (table === 'scan_results' && T('scan_results').some((x) => x.scan_id === r.scan_id)) throw new BackendError(tr('l2.dm.resultExists'), '23505');
      if (table === 'scan_favorites' && T('scan_favorites').some((x) => x.scan_id === r.scan_id && x.user_id === me)) throw new BackendError(tr('l2.dm.alreadyFav'), '23505');
      if (table === 'scan_results') r.explanation ??= null;
    }
    if (table === 'community_profiles') {
      checkPseudonym(r, true);
      checkCommunityProfile(r);
      r.visibility ??= 'members'; r.bio ??= null; r.avatar_path ??= null; r.avatar_preset ??= null; r.journey_label ??= null; r.suspended_until = null; r.created_at ??= nowIso();
    }
    if (table === 'post_photos') {
      const post = T('posts').find((x) => x.id === r.post_id);
      if (!post || post.author_id !== me || String(r.path ?? '').split('/')[0] !== me) throw new BackendError(tr('l2.dm.forbidden'), '42501');
      if (T('post_photos').filter((x) => x.post_id === r.post_id).length >= 4) throw new BackendError(tr('l2.dm.photosMax'));
      r.position ??= 0; r.created_at = nowIso();
    }
    if (table === 'community_notification_prefs') {
      delete r.id;
      if (T(table).some((x) => x.user_id === r.user_id)) throw new BackendError(tr('l2.dm.prefsExist'), '23505');
      for (const k of ['post_comment', 'comment_reply', 'reaction', 'saved_reply', 'moderation']) r[k] ??= true;
    }
    if (table === 'posts' || table === 'comments') {
      const profile = T('community_profiles').find((p) => p.user_id === me);
      if (!profile) throw new BackendError(tr('l2.dm.pseudoFirst'), 'P0001', 'pseudonym_required');
      if (profile.suspended_until && profile.suspended_until > nowIso()) throw new BackendError(tr('l2.dm.suspended'), '42501');
      if (table === 'posts' && !T('forums').some((f) => f.id === r.forum_id && !f.archived)) throw new BackendError(tr('l2.dm.chooseCategory'));
      if (table === 'posts' && T('posts').some((x) => x.author_id === me && x.body === r.body && Date.now() - Date.parse(x.created_at) < 86_400_000)) throw new BackendError(tr('l2.dm.postDup'), 'P0001', 'duplicate');
      if (table === 'comments' && T('comments').some((x) => x.author_id === me && x.post_id === r.post_id && x.body === r.body && Date.now() - Date.parse(x.created_at) < 600_000)) throw new BackendError(tr('l2.dm.commentDup'), 'P0001', 'duplicate');
      const text = `${r.title ?? ''} ${r.body ?? ''}`;
      let status = PERSONAL_DATA.test(text) || textNeedsReview(text) ? 'pending_review' : 'visible';
      for (const term of DEMO_TERMS) {
        if (!term.pattern.test(text)) continue;
        if (term.action === 'block') throw new BackendError(tr('l2.dm.reasonSpam', { reason: term.reason }));
        status = 'pending_review';
      }
      r.status = status;
      r.report_count = 0;
      if (table === 'posts') { Object.assign(r, { like_count: 0, comment_count: 0, edited_at: null }); r.title = r.title?.trim() || null; r.kind ??= 'question'; r.anonymous = !!r.anonymous; r.area_label ??= null; }
      if (table === 'comments') r.edited_at = null;
      if (table === 'comments') {
        const post = T('posts').find((p) => p.id === r.post_id);
        if (!post || post.status !== 'visible') throw new BackendError(tr('l2.dm.commentsClosed'), '42501');
        if (blockedBetween(post.author_id, r.author_id)) throw new BackendError(tr('l2.dm.cannotReplyPost'), '42501');
        r.parent_id ??= null;
        replyTarget = null;
        if (r.parent_id) {
          const parent = T('comments').find((x) => x.id === r.parent_id);
          if (!parent || parent.post_id !== r.post_id) throw new BackendError(tr('l2.dm.parentGone'));
          if (parent.status !== 'visible' || blockedBetween(parent.author_id, r.author_id)) throw new BackendError(tr('l2.dm.cannotReplyComment'), '42501');
          replyTarget = parent.author_id;
          // Un seul niveau : une réponse à une réponse est rattachée au commentaire racine
          if (parent.parent_id) r.parent_id = parent.parent_id;
        }
      }
    }
    if (table === 'reports') {
      const dup = T('reports').some((x) => x.reporter_id === me && ((r.post_id && x.post_id === r.post_id) || (r.comment_id && x.comment_id === r.comment_id)));
      if (dup) throw new BackendError(tr('l2.dm.reportedContent'));
      r.status = 'open';
    }
    if (table === 'reminders') r.updated_at = nowIso();
    if (table === 'user_journeys') {
      // Mêmes règles que la base : un seul parcours « corps » actif, un post-partum, un parcours par enfant
      r.status ??= 'active'; r.started_on ??= todayIso(); r.ended_on ??= null; r.end_reason ??= null; r.pregnancy_id ??= null; r.child_id ??= null; r.household_id ??= null;
      if (r.type === 'pregnancy' && !r.pregnancy_id) throw new BackendError(tr('l2.dm.pregnancyNeeded'));
      if (r.status === 'active') checkJourney(r);
    }
    if (table === 'cycle_preferences') {
      // Comme la base : clé primaire = user_id (une seule ligne par personne)
      delete r.id;
      if (T(table).some((x) => x.user_id === r.user_id)) throw new BackendError(tr('l2.dm.prefsExistEdit'), '23505');
      r.track_intercourse ??= false;
      r.hide_on_home ??= false;
      r.advice_enabled ??= true;
      r.detailed_notifications ??= false;
      r.favorites ??= null; r.favorites_set_at ??= null; r.show_intimacy_icons ??= true; r.lock_mode ??= 'off'; r.anticipation ??= false;
      checkCyclePrefs(r);
      r.updated_at = nowIso();
    }
    if (table === 'symptom_logs') {
      r.symptom_keys ??= []; r.intensities ??= {}; r.pain_locations ??= []; r.pain_impact ??= []; r.pain_associated ??= [];
      r.moods ??= []; r.habits ??= []; r.tags ??= []; r.sleep_tags ??= []; r.custom_items ??= [];
      checkSymptomRow(r);
    }
    if (table === 'intercourse_logs') {
      // Suivi intime : uniquement après activation volontaire (consentement) dans la confidentialité du cycle
      const prefs = T('cycle_preferences').find((x) => x.user_id === (r.user_id ?? me));
      if (!prefs?.track_intercourse) throw new BackendError(tr('l2.dm.sexTracking'), 'P0001', 'intimate_optin_required');
    }
    if (table === 'contraception_logs') {
      r.logged_on ??= todayIso(); r.label ??= null; r.note ??= null;
      const KINDS = ['pill_taken', 'pill_missed', 'patch_changed', 'ring_inserted', 'ring_removed', 'condom', 'device_declared', 'emergency_taken', 'treatment'];
      if (!KINDS.includes(r.kind as string)) throw new BackendError(tr('l2.dm.entryUnknown'), '23514');
      if (r.kind !== 'treatment' && T(table).some((x) => x.user_id === (r.user_id ?? me) && x.logged_on === r.logged_on && x.kind === r.kind)) throw new BackendError(tr('l2.dm.alreadyNoted'), '23505');
    }
    if (table === 'cycle_custom_items') {
      if (!isPremium()) throw new BackendError('Fonction Premium (cycle_custom)', 'P0001', 'premium_required');
      const label = String(r.label ?? '').trim();
      if (label.length < 1 || label.length > 30) throw new BackendError(tr('l2.dm.nameLen'), '23514');
      if (T(table).filter((x) => x.user_id === (r.user_id ?? me)).length >= 30) throw new BackendError(tr('l2.dm.customMax'), 'P0001');
      r.icon ??= null;
    }
    if (table === 'cycle_shares') {
      // Miroir de cycle_share_check : même foyer, création Premium ; une ligne par partenaire
      delete r.id;
      r.owner_id ??= me;
      if (r.owner_id === r.partner_id) throw new BackendError(tr('l2.dm.shareSelf'), '23514');
      if (!sameHousehold(r.owner_id as string, r.partner_id as string)) throw new BackendError(tr('l2.dm.shareHousehold'), 'P0001');
      if (!isPremium()) throw new BackendError('Fonction Premium (cycle_share)', 'P0001', 'premium_required');
      if (T(table).some((x) => x.owner_id === r.owner_id && x.partner_id === r.partner_id)) throw new BackendError(tr('l2.dm.alreadyShared'), '23505');
      r.share_period ??= true; r.share_fertile ??= false; r.share_mood ??= false; r.share_symptoms ??= false; r.updated_at = nowIso();
    }
    if (table === 'cycle_insight_feedback') {
      delete r.id;
      const prev = T(table).find((x) => x.user_id === (r.user_id ?? me) && x.insight_key === r.insight_key);
      if (prev) throw new BackendError(tr('l2.dm.feedbackExists'), '23505');
    }
    if (table === 'discharge_logs') { r.textures ??= []; r.symptoms ??= []; }
    if (table === 'bottle_timers') {
      r.status ??= 'active';
      r.planned_ml ??= null;
      r.bottle_id ??= null;
      r.updated_at = nowIso();
      checkBottleTimer(T('bottle_timers'), r);
    }
    if (table === 'bottles') r.planned_next_ml ??= null;
    if (table === 'parent_sleep_logs') {
      // Même règles que la base : une entrée par jour, réveil après le coucher
      if (T(table).some((x) => x.user_id === r.user_id && x.log_date === r.log_date)) throw new BackendError(tr('l2.dm.nightExists'));
      if (r.bedtime && r.wake_time && r.wake_time <= r.bedtime) throw new BackendError(tr('l2.dm.wakeAfterBed'));
      r.updated_at = nowIso();
    }
    if (table === 'documents') {
      // Même règles que la base (documents v2) : privé par défaut
      r.private_to_uploader ??= true;
      r.favorite ??= false; r.archived ??= false; r.page_count ??= 1; r.review_status ??= 'none';
      r.ocr_text ??= null; r.ocr_source ??= null; r.custom_category ??= null; r.updated_at = nowIso();
      if (r.category === 'custom' && !r.custom_category) throw new BackendError(tr('l2.dm.nameCustom'));
    }
    if (table === 'document_extractions') {
      r.household_id ??= T('documents').find((d) => d.id === r.document_id)?.household_id ?? null;
      r.kind ??= 'fields'; r.level ??= null; r.source ??= null; r.status ??= 'to_verify'; r.professional_note ??= null;
      r.verified_by = r.status === 'verified' || r.status === 'professional' ? state.session?.userId ?? null : null; r.verified_at = r.verified_by ? nowIso() : null;
      if (r.status === 'professional' && !r.professional_note) throw new BackendError(tr('l2.dm.sourceDoc'));
    }
    return r;
  }

  /** Contraintes d'unicité des parcours actifs (index partiels de la base). */
  function checkJourney(r: Row) {
    const body = ['avoid', 'ttc', 'cycle', 'pregnancy'];
    const clash = T('user_journeys').some((x) => x.id !== r.id && x.user_id === r.user_id && x.status === 'active' && (
      (body.includes(r.type) && body.includes(x.type)) || (r.type === 'postpartum' && x.type === 'postpartum')
      || (['baby', 'child'].includes(r.type) && ['baby', 'child'].includes(x.type) && r.child_id && x.child_id === r.child_id)));
    if (clash) throw new BackendError(tr('l2.dm.journeyActive'), '23505');
  }
  /** Déclencheur user_journeys_after : profiles.journeys recalculé ; rappels de l'ancien parcours désactivés. */
  function afterJourney(before: Row | null, after: Row | null) {
    const old = before;
    if (old && old.status === 'active' && (!after || after.status === 'archived')) {
      for (const rm of T('reminders')) {
        if (rm.user_id !== old.user_id || !rm.enabled) continue;
        const t = old.type as string;
        const hit = (['baby', 'child'].includes(t) && old.child_id && rm.child_id === old.child_id && rm.journey_type === t)
          || (t === 'pregnancy' && (rm.pregnancy_id === old.pregnancy_id || (rm.journey_type === 'pregnancy' && !rm.pregnancy_id)))
          || (['avoid', 'ttc', 'cycle', 'postpartum'].includes(t) && rm.journey_type === t);
        if (hit) rm.enabled = false;
      }
    }
    const userId = (after ?? before)?.user_id;
    const prof = T('profiles').find((p) => p.id === userId);
    if (prof) prof.journeys = legacyJourneys(T('user_journeys') as JourneyRow[], userId);
  }
  function afterInsert(table: string, r: Row) {
    social.afterInsert(table, r);
    outings.afterInsert(table, r);
    if (table === 'user_journeys') afterJourney(null, r);
    if (table === 'family_tasks') { taskEvent(r, 'created', { assignee: r.assignee_id }); nextOccurrence(r); }
    if (table === 'product_scans' && (r.barcode || r.product_id)) {
      for (const rc of T('product_recalls')) if (scanMatchesRecall(r, rc)) notifyRecall(rc, r.user_id);
    }
    if (table === 'comments') {
      const post = T('posts').find((p) => p.id === r.post_id);
      if (post) {
        post.comment_count += 1;
        // Mêmes règles que on_comment / comment_thread_guard : réponse, commentaire, publication enregistrée
        if (r.status === 'visible') {
          const who = actorLabel(r.author_id, post.id);
          const link = `/community/post/${post.id}?comment=${r.id}`;
          const body = r.body.slice(0, 120);
          const payload = { post_id: post.id, comment_id: r.id, parent_id: r.parent_id };
          const done = new Set<string>([r.author_id]);
          const rootAuthor = r.parent_id ? T('comments').find((x) => x.id === r.parent_id)?.author_id : null;
          for (const target of [replyTarget, rootAuthor]) {
            if (target && !done.has(target) && !blockedBetween(target, r.author_id)) communityNotify(target, { category: 'community_reply', title: tr('l2.dm.replied', { who }), body, deep_link: link, payload });
            if (target) done.add(target);
          }
          if (!done.has(post.author_id) && !blockedBetween(post.author_id, r.author_id)) communityNotify(post.author_id, { category: 'community_comment', title: tr('l2.dm.commented', { who }), body, deep_link: link, payload });
          done.add(post.author_id);
          for (const s2 of T('saved_posts').filter((x) => x.post_id === post.id)) {
            if (!done.has(s2.user_id) && !blockedBetween(s2.user_id, r.author_id)) communityNotify(s2.user_id, { category: 'community_saved', title: tr('l2.dm.savedReply'), body, deep_link: link, payload });
            done.add(s2.user_id);
          }
        }
      }
      replyTarget = null;
    }
    if (table === 'post_likes') {
      const post = T('posts').find((p) => p.id === r.post_id);
      if (post) {
        post.like_count += 1;
        const recent = T('notifications').some((n) => n.user_id === post.author_id && n.category === 'community_like' && n.payload?.post_id === post.id && Date.now() - Date.parse(n.created_at) < 86_400_000);
        if (post.author_id !== r.user_id && !blockedBetween(post.author_id, r.user_id) && !recent) {
          const who = T('community_profiles').find((x) => x.user_id === r.user_id)?.pseudonym ?? tr('l2.soc.someone');
          communityNotify(post.author_id, { category: 'community_like', title: tr('l2.dm.liked', { who }), body: null, deep_link: `/community/post/${post.id}`, payload: { post_id: post.id } });
        }
      }
    }
    if (table === 'reports') {
      const target = r.post_id ? T('posts').find((p) => p.id === r.post_id) : T('comments').find((c) => c.id === r.comment_id);
      if (target) {
        target.report_count += 1;
        const before = target.status;
        if (target.report_count >= 3 && target.status === 'visible') {
          target.status = 'hidden';
          T('moderation_actions').push({ id: uuid(), moderator_id: null, post_id: r.post_id ?? null, comment_id: r.comment_id ?? null, action: 'auto_hide', reason: '3 signalements', created_at: nowIso() });
          moderationNotice(r.post_id ? 'post' : 'comment', target, before);
        }
      }
    }
  }

  /** Plus récents d'abord (dates égales : identifiant décroissant, comme le serveur), limite 1 à 100, copie indépendante. */
  function newestFirst(rows: Row[], limit: unknown): Row[] {
    const n = Math.min(Math.max(Number(limit) || 100, 1), 100);
    const sorted = [...rows].sort((x, y) => (x.created_at < y.created_at ? 1 : x.created_at > y.created_at ? -1 : x.id < y.id ? 1 : x.id > y.id ? -1 : 0));
    return JSON.parse(JSON.stringify(sorted.slice(0, n))) as Row[];
  }

  // ---------------------------------------------------------------- vues
  function view(table: string): Row[] {
    const me = state.session?.userId;
    const sv = social.view(table) ?? outings.view(table);
    if (sv) return sv;
    // Blocage dans les deux sens, comme is_blocked_between côté Supabase
    const blocked = new Set(T('user_blocks').flatMap((b) => (b.blocker_id === me ? [b.blocked_id] : b.blocked_id === me ? [b.blocker_id] : [])));
    const prof = (id: string) => T('community_profiles').find((p) => p.user_id === id);
    const mod = isModerator();
    // Même condition que la vue forum_feed (droits du propriétaire + règles de la RLS)
    const readablePost = (p: Row) => social.postInGroupVisible(p) && ((p.status === 'visible' && !blocked.has(p.author_id)) || p.author_id === me || mod);
    if (table === 'forum_feed') {
      if (!me) return [];
      return T('posts')
        .filter(readablePost)
        .map((p) => {
          const cp = p.anonymous ? null : prof(p.author_id);
          return {
            id: p.id, forum_id: p.forum_id, forum_slug: T('forums').find((f) => f.id === p.forum_id)?.slug ?? null, title: p.title ?? null, body: p.body,
            kind: p.kind ?? 'question', anonymous: !!p.anonymous, area_label: p.area_label ?? null, status: p.status,
            like_count: p.like_count, comment_count: p.comment_count, created_at: p.created_at, edited_at: p.edited_at ?? null,
            pseudonym: cp?.pseudonym ?? null, author_handle: cp?.handle ?? null, avatar_path: cp?.avatar_path ?? null, avatar_preset: cp?.avatar_preset ?? null,
            is_mine: p.author_id === me,
            liked: T('post_likes').some((l) => l.post_id === p.id && l.user_id === me),
            saved: T('saved_posts').some((l) => l.post_id === p.id && l.user_id === me),
            photos: T('post_photos').filter((ph) => ph.post_id === p.id).sort((x, y) => x.position - y.position).map((ph) => ({ path: ph.path, width: ph.width ?? null, height: ph.height ?? null })),
            ...social.feedExtras(p),
          };
        });
    }
    if (table === 'comment_feed') {
      if (!me) return [];
      return T('comments')
        .filter((c) => {
          const post = T('posts').find((x) => x.id === c.post_id);
          return !!post && (((c.status === 'visible' && !blocked.has(c.author_id)) && readablePost(post)) || c.author_id === me || mod) && (social.postInGroupVisible(post) || c.author_id === me);
        })
        .map((c) => {
          const post = T('posts').find((x) => x.id === c.post_id)!;
          const anon = !!post.anonymous && c.author_id === post.author_id;
          const cp = anon ? null : prof(c.author_id);
          return {
            id: c.id, post_id: c.post_id, parent_id: c.parent_id, body: c.body, status: c.status, created_at: c.created_at, edited_at: c.edited_at ?? null,
            is_op: c.author_id === post.author_id, anonymous: anon, pseudonym: cp?.pseudonym ?? null, author_handle: cp?.handle ?? null,
            avatar_path: cp?.avatar_path ?? null, avatar_preset: cp?.avatar_preset ?? null, is_mine: c.author_id === me,
            post_title: post.title ?? null, post_excerpt: String(post.body).slice(0, 140),
            ...social.commentExtras(c, post),
          };
        });
    }
    if (table === 'post_photos') {
      return T('post_photos').filter((ph) => { const post = T('posts').find((x) => x.id === ph.post_id); return !!post && readablePost(post); })
        .map(({ author_id: _a, ...rest }) => rest); // eslint-disable-line @typescript-eslint/no-unused-vars
    }
    if (table === 'community_profiles') {
      // Lecture directe : seulement les colonnes publiques (le reste via my_community_profile / community_member)
      return T('community_profiles').map((p) => ({ user_id: p.user_id, pseudonym: p.pseudonym, handle: p.handle, avatar_path: p.avatar_path ?? null, avatar_preset: p.avatar_preset ?? null, created_at: p.created_at }));
    }
    const rows = T(table);
    const ownerCol = OWNER_TABLES[table];
    // Données personnelles : uniquement celles du compte connecté
    if (ownerCol && !['posts', 'comments', 'post_photos'].includes(table)) {
      if (table === 'documents') return rows.filter((d) => !d.private_to_uploader || d.uploaded_by === me);
      if (table === 'notes') return rows.filter((n) => !n.private_to_author || n.author_id === me);
      if (table === 'name_votes') return rows;
      if (table === 'cycle_shares') return rows.filter((x) => x.owner_id === me || x.partner_id === me);
      return rows.filter((x) => x[ownerCol] === me);
    }
    // Rendez-vous privés : réservés à la personne qui les a créés
    if (table === 'appointments') return rows.filter((a) => !a.private_to_creator || a.created_by === me);
    if (['profiles', 'privacy_settings', 'subscriptions', 'notifications', 'assistant_usage'].includes(table)) {
      const col = table === 'profiles' ? 'id' : 'user_id';
      return rows.filter((x) => x[col] === me);
    }
    return rows;
  }

  // ---------------------------------------------------------------- assistant (même logique que la fonction serveur)
  function syncFeedback(f: Row) {
    const m = T('assistant_messages').find((x) => x.id === f.message_id);
    if (m) m.feedback = f.value;
  }

  function assistantCore(b: Row): { result: Row; raw: string | null } {
    const message = String(b.message ?? '').trim();
    if (message.length < 2 || message.length > MAX_QUESTION_LENGTH) {
      throw new BackendError(tr('l2.dm.questionLen', { max: String(MAX_QUESTION_LENGTH) }), 'bad_request', undefined, 400);
    }
    const me = uid();
    const useContext = b.use_context === true;
    const ps = T('privacy_settings').find((p) => p.user_id === me);
    const keepHistory = ps?.ai_history_enabled === true && !!ps?.ai_history_consented_at;
    const consent = T('consents')
      .filter((c) => c.user_id === me && c.purpose === 'ai_assistant')
      .sort((x, y) => (x.created_at < y.created_at ? 1 : x.created_at > y.created_at ? -1 : 0))[0];
    const consented = consent?.granted === true;
    let convId = (b.conversation_id as string | null) ?? null;
    if (convId && !T('assistant_conversations').some((c) => c.id === convId && c.user_id === me)) {
      throw new BackendError(tr('l2.dm.convNotFound'), 'not_found', undefined, 404);
    }

    const store = (answer: string, extra: Row): string | null => {
      if (!keepHistory || !consented) return null;
      if (!convId) {
        convId = uuid();
        T('assistant_conversations').push({ id: convId, user_id: me, title: message.slice(0, 80), context_enabled: useContext, context_snapshot: {}, created_at: nowIso(), updated_at: nowIso() });
      } else {
        const conv = T('assistant_conversations').find((c) => c.id === convId);
        if (conv) Object.assign(conv, { updated_at: nowIso(), context_enabled: useContext });
      }
      T('assistant_messages').push({ id: uuid(), conversation_id: convId, user_id: me, role: 'user', content: message, sources: [], structured: null, safety_level: 'none', feedback: null, saved: false, created_at: nowIso() });
      const mid = uuid();
      T('assistant_messages').push({
        id: mid, conversation_id: convId, user_id: me, role: 'assistant', content: answer, sources: extra.sources ?? [], structured: extra.structured ?? null,
        safety_flags: extra.flags ?? [], safety_level: extra.safety ?? 'none', feedback: null, saved: false, created_at: new Date(Date.now() + 1).toISOString(),
      });
      return mid;
    };

    // 1) Urgence : orientation immédiate, sans IA ni quota
    const safety = assessSafety(message);
    if (safety.level !== 'none') {
      const answer = crisisMessage(safety.level);
      const mid = store(answer, { safety: safety.level, flags: safety.reasons });
      return {
        raw: null,
        result: {
          conversation_id: convId, message_id: mid, answer, safety: safety.level, reasons: safety.reasons, urgent_contacts: urgentContacts(safety.level),
          sources: [], structured: null, show_emergency_resources: true, stored: !!mid,
        },
      };
    }
    if (!consented) throw new BackendError(tr('l2.dm.assistantTerms'), 'consent_required', undefined, 403);

    // 2) Tentative de détournement : refus poli, sans quota
    if (looksLikePromptInjection(message)) {
      const structured = { ...INJECTION_REFUSAL, updated_on: todayIso() };
      return { raw: null, result: { conversation_id: convId, message_id: null, answer: structured.short, structured, safety: 'none', sources: [], stored: false, refused: true } };
    }

    // 3) Pas d'IA sans serveur : on le dit clairement, sans réponse simulée ni question décomptée.
    // Pas d'IA sans serveur : erreur discrète (l'état détaillé est dans Réglages › État des services)
    throw new BackendError(tr('l2.dm.assistantDown'), 'ai_not_configured', undefined, 503);
  }

  // ---------------------------------------------------------------- fonctions backend simulées
  const rpcs: Record<string, (a: Row) => unknown> = {
    ...social.rpcs,
    // Effacer toutes ses données du cycle (le compte reste)
    delete_my_cycle_data: () => {
      const me = uid();
      for (const t of ['period_entries', 'symptom_logs', 'discharge_logs', 'bleeding_logs', 'cycle_journal', 'fertility_observations', 'ovulation_tests', 'pregnancy_tests', 'intercourse_logs', 'contraception_logs', 'cycle_custom_items', 'cycle_insight_feedback']) state.tables[t] = T(t).filter((r) => r.user_id !== me);
      state.tables.cycle_shares = T('cycle_shares').filter((r) => r.owner_id !== me);
      persist();
      return null;
    },
    // Partage du cycle : cycles partagés avec moi, puis les seules données partagées (miroir de partner_cycle)
    cycle_shared_with_me: () => {
      const me = uid();
      return T('cycle_shares').filter((x) => x.partner_id === me).map((x) => ({
        owner_id: x.owner_id, display_name: (T('profiles').find((p) => p.id === x.owner_id)?.display_name as string) || tr('l2.dm.partner'),
        share_period: x.share_period, share_fertile: x.share_fertile, share_mood: x.share_mood, share_symptoms: x.share_symptoms,
        paused: !premiumOf(x.owner_id as string) || !sameHousehold(x.owner_id as string, me),
      }));
    },
    partner_cycle: (a) => {
      const me = uid();
      const sh = T('cycle_shares').find((x) => x.owner_id === a?.p_owner && x.partner_id === me);
      if (!sh) throw new BackendError(tr('l2.dm.noShare'), 'P0002');
      const owner = sh.owner_id as string;
      if (!premiumOf(owner) || !sameHousehold(owner, me)) return { paused: true };
      const since = new Date(Date.now() - 13 * 86400000).toISOString().slice(0, 10);
      const logs = T('symptom_logs').filter((l) => l.user_id === owner && String(l.logged_on) >= since).sort((x, y) => String(x.logged_on).localeCompare(String(y.logged_on)));
      const INTIMATE = ['libido_up', 'libido_down', 'dyspareunia', 'discomfort'];
      return {
        paused: false, share_period: sh.share_period, share_fertile: sh.share_fertile, share_mood: sh.share_mood, share_symptoms: sh.share_symptoms,
        periods: sh.share_period || sh.share_fertile ? T('period_entries').filter((p) => p.user_id === owner).sort((x, y) => String(y.start_date).localeCompare(String(x.start_date))).slice(0, 12).reverse().map((p) => ({ start_date: p.start_date, end_date: p.end_date ?? null })) : [],
        moods: sh.share_mood ? logs.filter((l) => ((l.moods as string[] | undefined) ?? []).length).map((l) => ({ date: l.logged_on, moods: l.moods })) : [],
        symptoms: sh.share_symptoms ? logs.map((l) => ({ date: l.logged_on, keys: ((l.symptom_keys as string[] | undefined) ?? []).filter((k) => !INTIMATE.includes(k)) })) : [],
      };
    },
    // Effacer ses données de vie sexuelle (miroir de delete_my_intimate_data)
    delete_my_intimate_data: () => {
      const me = uid();
      const INTIMATE = ['libido_up', 'libido_down', 'dyspareunia', 'discomfort'];
      state.tables.intercourse_logs = T('intercourse_logs').filter((r) => r.user_id !== me);
      state.tables.contraception_logs = T('contraception_logs').filter((r) => !(r.user_id === me && r.kind === 'condom'));
      T('symptom_logs').forEach((r) => { if (r.user_id === me) r.symptom_keys = ((r.symptom_keys as string[] | undefined) ?? []).filter((k) => !INTIMATE.includes(k)); });
      persist();
      return null;
    },
    // Statut éditorial d'une recette (miroir de set_recipe_status : rôle « editor » ou « admin », journalisé)
    set_recipe_status: (a) => {
      const me = uid();
      if (!T('user_roles').some((x) => x.user_id === me && ['editor', 'admin'].includes(x.role as string))) throw new BackendError(tr('l2.dm.editorsOnly'), '42501');
      const r = T('recipes').find((x) => x.slug === a?.p_slug && !x.owner_id);
      if (!r) throw new BackendError(tr('l2.dm.recipeGone'), 'P0002');
      r.status = a?.p_status;
      if (['reviewed', 'validated'].includes(a?.p_status as string)) r.verified_on = new Date().toISOString().slice(0, 10);
      T('recipe_reviews').push({ id: uuid(), recipe_id: r.id, status: a?.p_status, by_user: me, by_label: tr('l2.dm.editorial'), note: a?.p_note ?? null, created_at: new Date().toISOString() });
      markLib('recipes', [r]);
      persist();
      return null;
    },
    // Démonstration uniquement : s'attribuer le rôle « editor » sur cet appareil pour essayer la relecture des recettes.
    // N'existe pas côté Supabase (les rôles y sont attribués par l'administrateur).
    demo_grant_editor: () => {
      const me = uid();
      if (!T('user_roles').some((x) => x.user_id === me && x.role === 'editor')) T('user_roles').push({ user_id: me, role: 'editor', created_at: new Date().toISOString() });
      persist();
      return null;
    },
    // Suppression définitive d'un parcours : uniquement les données datées de sa période (miroir de la fonction SQL)
    delete_journey: (a) => {
      const me = uid();
      const j = T('user_journeys').find((r) => r.id === a?.p_id && r.user_id === me);
      if (!j) throw new BackendError(tr('l2.dm.journeyGone'), 'P0002');
      const today = new Date().toISOString().slice(0, 10);
      const from = j.started_on as string; const to = (j.ended_on as string | null) ?? today;
      const cycleTypes = ['avoid', 'ttc', 'cycle'];
      const others = T('user_journeys').filter((o) => o.user_id === me && o.id !== j.id && cycleTypes.includes(o.type as string));
      const kept = (d: string) => others.some((o) => (o.started_on as string) <= d && d <= ((o.ended_on as string | null) ?? today));
      const inRange = (d: unknown) => { const s = String(d ?? '').slice(0, 10); return s >= from && s <= to; };
      if (cycleTypes.includes(j.type as string)) {
        const cols: Record<string, string> = { period_entries: 'start_date', symptom_logs: 'logged_on', discharge_logs: 'observed_at', bleeding_logs: 'occurred_on', cycle_journal: 'entry_on', fertility_observations: 'observed_on', ovulation_tests: 'tested_at', pregnancy_tests: 'tested_at', intercourse_logs: 'occurred_on', contraception_logs: 'logged_on' };
        for (const [t, c] of Object.entries(cols)) state.tables[t] = T(t).filter((r) => !(r.user_id === me && inRange(r[c]) && !kept(String(r[c]).slice(0, 10))));
        if (!T('user_journeys').some((o) => o.user_id === me && o.id !== j.id && o.type === j.type && o.status === 'active')) T('reminders').forEach((r) => { if (r.user_id === me && r.journey_type === j.type) r.enabled = false; });
      } else if (j.type === 'pregnancy' && j.pregnancy_id && !T('user_journeys').some((o) => o.pregnancy_id === j.pregnancy_id && o.id !== j.id && o.status === 'active')) {
        state.tables.maternal_weights = T('maternal_weights').filter((r) => r.pregnancy_id !== j.pregnancy_id);
        const gone = (r: Row) => r.pregnancy_id === j.pregnancy_id;
        const lists = T('checklists').filter(gone).map((c) => c.id);
        state.tables.checklist_items = T('checklist_items').filter((i) => !lists.includes(i.checklist_id));
        for (const t of ['expected_babies', 'checklists', 'appointments', 'reminders']) state.tables[t] = T(t).filter((r) => !gone(r));
        state.tables.pregnancies = T('pregnancies').filter((r) => r.id !== j.pregnancy_id);
      } else if (j.type === 'postpartum') {
        state.tables.postpartum_checkins = T('postpartum_checkins').filter((r) => !(r.user_id === me && inRange(r.checkin_date)));
        state.tables.postpartum_actions = T('postpartum_actions').filter((r) => !(r.user_id === me && inRange(r.done_on)));
        if (j.status === 'active' || !T('user_journeys').some((o) => o.user_id === me && o.id !== j.id && o.type === 'postpartum' && o.status === 'active')) {
          state.tables.postpartum_shared_status = T('postpartum_shared_status').filter((r) => r.user_id !== me);
          T('postpartum_settings').forEach((r) => { if (r.user_id === me) r.active = false; });
        }
      }
      if (j.status === 'active') afterJourney(j, null); // supprimer un parcours actif arrête aussi ses rappels
      state.tables.user_journeys = T('user_journeys').filter((r) => r.id !== j.id);
      const prof = T('profiles').find((p) => p.id === me);
      if (prof) prof.journeys = legacyJourneys(T('user_journeys') as JourneyRow[], me);
      persist();
      return null;
    },
    create_household: (a) => {
      const id = uuid();
      T('households').push({ id, name: a.p_name || tr('l2.dm.family'), created_by: uid(), created_at: nowIso() });
      T('household_members').push({
        household_id: id, user_id: uid(), role: 'owner', joined_at: nowIso(),
        can_view: ['daily', 'health', 'documents', 'pregnancy', 'lists', 'names', 'profile'],
        can_edit: ['daily', 'health', 'documents', 'pregnancy', 'lists', 'names', 'profile'],
      });
      return id;
    },
    create_household_invitation: (a) => {
      if (!isPremium()) throw new BackendError('Fonction Premium (coparent_invite)', 'P0001', 'premium_required');
      const token = uuid().replace(/-/g, '');
      T('household_invitations').push({ id: uuid(), household_id: a.p_household, token_hash: fnv(token), role: a.p_role ?? 'coparent', can_view: a.p_can_view, can_edit: a.p_can_edit, child_scope: a.p_child_scope ?? null, pregnancy_access: a.p_pregnancy_access ?? true, created_at: nowIso(), expires_at: new Date(Date.now() + 7 * 86400_000).toISOString() });
      return token;
    },
    accept_household_invitation: () => {
      throw new BackendError(tr('l2.dm.coparentDemo'));
    },
    has_premium: () => isPremium(),
    scan_quota_status: () => {
      const used = scanUsed(uid());
      const quota = limit('product_scans_per_month');
      return [{ used, quota, remaining: Math.max(0, quota - used) }];
    },
    cosing_lookup: (a) => {
      const names = new Set(((a.p_names as string[]) ?? []).slice(0, 200).map((n) => String(n).trim().toLowerCase()));
      return T('cosing_ingredients').filter((c) => names.has(String(c.inci_name).toLowerCase()));
    },
    notify_my_recalls: () => {
      const me = uid();
      return T('product_recalls').reduce((n, rc) => n + notifyRecall(rc, me), 0);
    },
    assistant_quota_status: () => {
      const month = new Date().toISOString().slice(0, 7);
      const used = T('assistant_usage').find((x) => x.user_id === uid() && x.month === month)?.questions ?? 0;
      const quota = limit('assistant_questions_per_month');
      return [{ used, quota, remaining: Math.max(0, quota - used) }];
    },
    plan_limit: (a) => limit(a.p_key),
    feature_quota_status: (a) => {
      const month = new Date().toISOString().slice(0, 7);
      const used = T('feature_usage').find((x) => x.user_id === uid() && x.feature === a.p_key && x.month === month)?.used ?? 0;
      const quota = limit(String(a.p_key));
      return [{ used, quota, remaining: Math.max(0, quota - used) }];
    },
    consume_feature_quota: (a) => {
      if (!['voice_entries_per_month', 'summary_exports_per_month'].includes(String(a.p_key))) throw new BackendError(tr('l2.dm.quotaUnknown'), '22023');
      const month = new Date().toISOString().slice(0, 7);
      let row = T('feature_usage').find((x) => x.user_id === uid() && x.feature === a.p_key && x.month === month);
      if (!row) { row = { user_id: uid(), feature: a.p_key, month, used: 0 }; T('feature_usage').push(row); }
      const quota = limit(String(a.p_key));
      if (row.used >= quota) return [{ allowed: false, used: row.used, quota }];
      row.used += 1;
      return [{ allowed: true, used: row.used, quota }];
    },
    set_member_scope: (a) => {
      const m = T('household_members').find((x) => x.household_id === a.p_household && x.user_id === a.p_user && x.role !== 'owner');
      if (m) { m.child_scope = a.p_child_scope ?? null; m.pregnancy_access = a.p_pregnancy_access ?? true; }
      return null;
    },
    premium_article_teasers: () => T('articles').filter((x) => x.status === 'published' && x.is_premium && !x.is_safety_critical).map((x) => ({ id: x.id, slug: x.slug, title: x.title, summary: x.summary, category_id: x.category_id, journeys: x.journeys, is_premium: true })),
    my_community_profile: () => {
      const me = uid();
      const v = T('community_profiles').find((p) => p.user_id === me);
      if (!v) return null;
      return {
        ...v,
        posts_count: T('posts').filter((p) => p.author_id === me && p.status !== 'removed').length,
        comments_count: T('comments').filter((c) => c.author_id === me && c.status !== 'removed').length,
        photos_count: T('post_photos').filter((ph) => ph.author_id === me).length,
        likes_count: T('post_likes').filter((l) => l.user_id === me).length,
        saved_count: T('saved_posts').filter((x) => x.user_id === me).length,
        ...social.myProfileExtras(me),
      };
    },
    community_member: (a) => {
      const me = uid();
      const v = T('community_profiles').find((p) => p.handle === normalizeHandle(String(a.p_handle ?? '')));
      if (!v) return null;
      if (v.user_id !== me && T('user_blocks').some((b) => b.blocker_id === v.user_id && b.blocked_id === me)) return { handle: v.handle, pseudonym: v.pseudonym, unavailable: true, is_me: false, blocked: false };
      const out: Row = { handle: v.handle, pseudonym: v.pseudonym, avatar_path: v.avatar_path ?? null, avatar_preset: v.avatar_preset ?? null, is_me: v.user_id === me,
        blocked: T('user_blocks').some((b) => b.blocker_id === me && b.blocked_id === v.user_id), visibility: v.visibility ?? 'members', unavailable: false,
        ...social.memberExtras(v.user_id, (v.visibility ?? 'members') === 'members' || v.user_id === me) };
      if ((v.visibility ?? 'members') === 'members' || v.user_id === me) {
        const posts = T('posts').filter((p) => p.author_id === v.user_id && p.status === 'visible' && !p.anonymous && social.postInGroupVisible(p));
        Object.assign(out, {
          bio: v.bio ?? null, journey_label: v.journey_label ?? null, joined_month: String(v.created_at ?? nowIso()).slice(0, 7),
          posts_count: posts.length,
          comments_count: T('comments').filter((c) => { const post = T('posts').find((x) => x.id === c.post_id); return c.author_id === v.user_id && c.status === 'visible' && !(post?.anonymous && post.author_id === c.author_id); }).length,
          photos_count: T('post_photos').filter((ph) => posts.some((p) => p.id === ph.post_id)).length,
        });
      }
      return out;
    },
    block_member: (a) => {
      const me = uid();
      const v = T('community_profiles').find((p) => p.handle === normalizeHandle(String(a.p_handle ?? '')));
      if (!v || v.user_id === me) throw new BackendError(tr('l2.dm.memberGone'));
      if (!T('user_blocks').some((b) => b.blocker_id === me && b.blocked_id === v.user_id)) {
        const row = { blocker_id: me, blocked_id: v.user_id, created_at: nowIso() };
        T('user_blocks').push(row);
        social.afterInsert('user_blocks', row);
      }
      return null;
    },
    report_member: (a) => {
      const me = uid();
      const v = T('community_profiles').find((p) => p.handle === normalizeHandle(String(a.p_handle ?? '')));
      if (!v || v.user_id === me) throw new BackendError(tr('l2.dm.memberGone'));
      if (T('reports').some((r) => r.reporter_id === me && r.reported_user === v.user_id && r.status === 'open')) throw new BackendError(tr('l2.dm.memberReported'));
      T('reports').push({ id: uuid(), reporter_id: me, post_id: null, comment_id: null, reported_user: v.user_id, reason: a.p_reason, details: a.p_details ?? null, status: 'open', created_at: nowIso() });
      return null;
    },
    moderation_queue: () => {
      const flagged = (x: Row) => ['hidden', 'pending_review'].includes(x.status) || (x.status === 'visible' && x.report_count > 0);
      return {
        posts: T('posts').filter(flagged).map((p) => ({ id: p.id, title: p.title, body: p.body, status: p.status, report_count: p.report_count, created_at: p.created_at, author_id: p.author_id, anonymous: !!p.anonymous })),
        comments: T('comments').filter(flagged).map((c) => ({ id: c.id, post_id: c.post_id, body: c.body, status: c.status, report_count: c.report_count, created_at: c.created_at, author_id: c.author_id })),
        members: T('reports').filter((r) => r.reported_user && r.status === 'open').map((r) => { const cp = T('community_profiles').find((x) => x.user_id === r.reported_user); return { report_id: r.id, handle: cp?.handle ?? null, pseudonym: cp?.pseudonym ?? null, user_id: r.reported_user, reason: r.reason, details: r.details, created_at: r.created_at }; }),
        history: [...T('moderation_actions')].reverse().slice(0, 100).map((m) => ({ action: m.action, reason: m.reason, post_id: m.post_id, comment_id: m.comment_id, created_at: m.created_at, automatic: !m.moderator_id })),
      };
    },
    block_author: (a) => {
      const author = a.p_post ? T('posts').find((p) => p.id === a.p_post)?.author_id : T('comments').find((c) => c.id === a.p_comment)?.author_id;
      if (author && author !== uid() && !T('user_blocks').some((b) => b.blocker_id === uid() && b.blocked_id === author)) {
        const row = { blocker_id: uid(), blocked_id: author, created_at: nowIso() };
        T('user_blocks').push(row);
        social.afterInsert('user_blocks', row);
      }
      return null;
    },
    // Recherche : plein texte (français) côté Supabase ; ici, simple « contient » sans casse ni accents
    search_posts: (a) => {
      const q = fold(String(a.p_query ?? '').trim());
      if (q.length < 2) return [];
      return view('forum_feed')
        .filter((p) => p.status === 'visible' && p.group_kind !== 'private' && (!a.p_forum || p.forum_id === a.p_forum) && fold(`${p.title ?? ""} ${p.body}`).includes(q))
        .sort((x, y) => (x.created_at < y.created_at ? 1 : -1))
        .slice(0, Math.min(Math.max(Number(a.p_limit) || 50, 1), 100));
    },
    // Fil et profil d'un membre (comme 20261104001000) : vues forum_feed / comment_feed, 100 plus récents
    community_feed: (a) => newestFirst(view('forum_feed').filter((p) => !a.p_forum || p.forum_id === a.p_forum), a.p_limit),
    member_posts: (a) => (a.p_handle ? newestFirst(view('forum_feed').filter((p) => p.author_handle === a.p_handle), a.p_limit) : []),
    member_comments: (a) => (a.p_handle ? newestFirst(view('comment_feed').filter((c) => c.author_handle === a.p_handle), a.p_limit) : []),
    // Recherche avancée (Premium) : catégories, type, photos, période, sans réponse, membre, groupe
    search_posts_advanced: (a) => {
      if (!isPremium()) throw new BackendError('Fonction Premium (community_search)', 'P0001', 'premium_required');
      const q = fold(String(a.p_query ?? '').trim());
      const forums: string[] = Array.isArray(a.p_forums) ? a.p_forums : [];
      const handle = a.p_handle ? normalizeHandle(String(a.p_handle)) : null;
      return view('forum_feed')
        .filter((p) => p.status === 'visible'
          && (a.p_group ? p.group_id === a.p_group : p.group_kind !== 'private')
          && (!forums.length || forums.includes(p.forum_id))
          && (!a.p_kind || (a.p_kind === 'poll' ? !!p.poll : p.kind === a.p_kind && !p.poll))
          && (!a.p_with_photos || p.photos.length > 0)
          && (!a.p_since || p.created_at >= a.p_since)
          && (!a.p_unanswered || p.comment_count === 0)
          && (!handle || p.author_handle === handle)
          && (q.length < 2 || fold(`${p.title ?? ''} ${p.body}`).includes(q)))
        .sort((x, y) => (x.created_at < y.created_at ? 1 : -1))
        .slice(0, Math.min(Math.max(Number(a.p_limit) || 50, 1), 100));
    },
    moderate: (a) => {
      const target = a.p_post ? T('posts').find((p) => p.id === a.p_post) : T('comments').find((c) => c.id === a.p_comment);
      if (target && ['hide', 'restore', 'remove'].includes(a.p_action)) {
        const before = target.status;
        target.status = a.p_action === 'hide' ? 'hidden' : a.p_action === 'remove' ? 'removed' : 'visible';
        moderationNotice(a.p_post ? 'post' : 'comment', target, before);
      }
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
        exported_at: nowIso(), format: 'toi-et-moi-export-v1', mode: tr('l2.dm.exportMode'),
        profile: T('profiles').find((p) => p.id === me) ?? null,
        consents: view('consents'),
        personal: Object.fromEntries(['period_entries', 'symptom_logs', 'ovulation_tests', 'pregnancy_tests', 'maternal_weights', 'mood_checkins', 'reminders', 'assistant_conversations', 'assistant_messages', 'assistant_feedback', 'favorites', 'intercourse_logs', 'fertility_observations', 'contraception_methods', 'consultation_questions', 'parent_sleep_logs', 'product_scans', 'scan_results', 'scan_favorites', 'cycle_preferences', 'contraception_logs', 'cycle_custom_items', 'cycle_insight_feedback', 'cycle_shares', 'postpartum_settings', 'postpartum_checkins', 'trusted_contacts', 'postpartum_actions', 'postpartum_shared_status', 'pregnancy_symptom_logs', 'place_favorites', 'place_reports'].map((t) => [t, view(t)])),
        community_meetups: T('community_meetups').filter((m) => m.organizer_id === uid()), meetup_participations: T('meetup_participants').filter((x) => x.user_id === uid()),
        place_suggestions: T('place_suggestions').filter((x) => x.user_id === uid()),
        households: T('households').filter((h) => households.includes(h.id)).map((h) => ({
          household: h,
          ...Object.fromEntries(['pregnancies', 'expected_babies', 'children', 'child_measurements', 'breastfeeds', 'bottles', 'pumpings', 'meals', 'diapers', 'sleeps', 'child_observations', 'appointments', 'checklists', 'checklist_items', 'documents', 'sleep_profiles', 'sleep_feedback', 'bedtime_routines', 'food_introductions', 'food_tastings', 'child_steps']
            .map((t) => [t, byHousehold(t).filter((r) => r.household_id === h.id)])),
        })),
        community: {
          posts: T('posts').filter((p) => p.author_id === me), comments: T('comments').filter((c) => c.author_id === me),
          following: rpcs.my_follows({}), forum_subscriptions: view('forum_subscriptions'), groups: view('group_members'), poll_votes: view('poll_votes'),
          albums: T('community_albums').filter((a) => a.owner_id === me), saved_folders: view('saved_folders'), topic_views: view('community_topic_views'),
          daily_digest_prefs: view('daily_digest_prefs')[0] ?? null, event_registrations: view('event_registrations'),
        },
      };
    },
    ensure_my_account: () => {
      if (!state.session) throw new BackendError(tr('l2.dm.signinNoDot'), '42501');
      return ensureAccount(uid());
    },
    record_signup_consents: (a) => {
      if (!state.session) throw new BackendError(tr('l2.dm.signinNoDot'), '42501');
      if (a.p_is_adult !== true) throw new BackendError(tr('l2.dm.age18'), '22023');
      const at = nowIso();
      for (const [purpose, version] of [['terms', a.p_terms_version], ['privacy_policy', a.p_privacy_version], ['adult_confirmation', a.p_terms_version]] as const) {
        T('consents').push({ id: uuid(), user_id: uid(), purpose, granted: true, version: String(version), created_at: at });
      }
      return at;
    },
    load_sample_family: () => {
      buildSampleFamily(uid(), T, rpcs.create_household as (a: Row) => string);
      return null;
    },
    set_demo_subscription: (a) => {
      const subs = T('subscriptions');
      const idx = subs.findIndex((s) => s.user_id === uid());
      // Simulation des états (démonstration et tests) : essai, actif, annulé, grâce, problème de paiement, expiré
      if (typeof a.state === 'string') {
        const days = Number(a.expires_in_days ?? 30);
        const st = String(a.state);
        const row = { user_id: uid(), status: st, product_id: a.product_id ?? (a.period === 'annual' ? 'toietmoi_premium_annual' : 'toietmoi_premium_monthly'), store: 'test',
          period_type: st === 'trial' ? 'trial' : a.period ?? 'monthly', expires_at: new Date(Date.now() + days * 86400_000).toISOString(), will_renew: st === 'trial' || st === 'active' || st === 'grace' };
        if (idx >= 0) subs[idx] = row; else subs.push(row);
        return row;
      }
      const row = a.active
        ? { user_id: uid(), status: a.trial ? 'trial' : 'active', product_id: a.product_id ?? 'toietmoi_premium_monthly', store: 'test', period_type: a.trial ? 'trial' : a.period ?? 'monthly', expires_at: new Date(Date.now() + (a.period === 'annual' ? 365 : 30) * 86400_000).toISOString(), will_renew: true }
        : { user_id: uid(), status: 'expired', product_id: null, store: 'test', period_type: null, expires_at: nowIso(), will_renew: false };
      if (idx >= 0) subs[idx] = row;
      else subs.push(row);
      return row;
    },
  };

  const functions: Record<string, (b: Row) => unknown> = {
    assistant: (b) => assistantCore(b).result,
    // Communauté (Premium) : en démonstration, pas d'IA — des extraits des réponses, présentés comme tels
    'community-ai': (b) => {
      if (!isPremium()) throw new BackendError('Fonction Premium (community_ai)', 'P0001', 'premium_required');
      const post = view('forum_feed').find((p) => p.id === b.post_id && p.status === 'visible');
      if (!post) throw new BackendError(tr('l2.dm.postGone'));
      if (b.action === 'translate') return { ai: 'not_configured', message: tr('l2.dm.translateDemo') };
      const comments = view('comment_feed').filter((c) => c.post_id === post.id && c.status === 'visible').sort((x, y) => (x.created_at < y.created_at ? -1 : 1));
      if (comments.length < MIN_COMMENTS_FOR_SUMMARY) throw new BackendError(tr('l2.dm.summaryMin'));
      return { ai: 'demo', kind: 'summary', points: extractiveSummary(comments as { body: string }[]), caution: null, message: tr('l2.dm.summaryDemo') };
    },
    // Démonstration : aucun service serveur n'est branché
    'service-status': () => ({ status: 'demo', services: { gemini: false, resend: false, auth_email_hook: false, push: false, revenuecat_webhook: false, open_food_facts: false, google_places: false }, checked_at: nowIso() }),
    // Google Places : jamais simulé (aucun faux établissement) ; la recherche reste sur OpenStreetMap
    places: () => ({ google: 'not_configured' }),
    'product-lookup': (b) => {
      const action = typeof b.action === 'string' ? b.action : 'lookup';
      if (action === 'search') {
        const query = String(b.query ?? '').trim();
        if (query.length < 2) throw new BackendError(tr('l2.dm.typeTwo'));
        const code = query.replace(/\D/g, '');
        const q = fold(query);
        const rows = T('products').filter((p) => (/^\d{8,14}$/.test(code) ? p.barcode === code : fold(String(p.name ?? '')).includes(q)))
          .filter((p) => (b.kind === 'food' ? ['food', 'drink'].includes(p.category) : b.kind === 'product' ? !['food', 'drink'].includes(p.category) : true));
        return {
          candidates: rows.slice(0, 12).map((p) => fromProductRow(p)), database: 'demo',
          message: tr('l2.dm.searchDemo'),
        };
      }
      if (action === 'recalls') {
        const barcode = b.barcode ? String(b.barcode).replace(/\D/g, '') : null;
        return { recalls: recallsFor({ barcode, brand: b.brand ?? null, name: b.name ?? null }), recall_check: demoRecallCheck() };
      }
      if (action === 'prices') {
        return { prices: [], source: 'Open Prices (Open Food Facts)', status: 'demo', message: tr('l2.dm.pricesDemo') };
      }
      if (action === 'recall_watch') {
        const me = uid();
        return { checked: T('product_scans').filter((s) => s.user_id === me && s.barcode).length, notified: T('product_recalls').reduce((n, rc) => n + notifyRecall(rc, me), 0) };
      }
      const barcode = String(b.barcode ?? '').replace(/\D/g, '');
      if (barcode.length < 8 || barcode.length > 14) throw new BackendError(tr('l2.dm.barcodeUnknown'));
      const product = T('products').find((p) => p.barcode === barcode) as (ProductData & { id: string; barcode: string }) | undefined;
      const recalls = recallsFor({ barcode, brand: product?.brand ?? null, name: product?.name ?? null });
      if (!product) {
        return {
          found: false, barcode, recalls, recall_check: demoRecallCheck(), database: 'demo',
          message: tr('l2.dm.productDemo'),
        };
      }
      if (b.confirm) T('product_scans').push({ id: uuid(), user_id: uid(), kind: 'product', product_id: product.id, barcode, method: 'barcode', confirmed: true, product_snapshot: { name: product.name, brand: product.brand }, answers: {}, sources: [], verdict: null, analysed_at: null, is_demo: true, created_at: nowIso() });
      // Évaluation historique conservée pour compatibilité ; le nouveau scanner utilise les moteurs de règles de l'application
      const assessment = assessProduct({ ...product, ingredients: product.ingredients ?? (((product as Row).ingredients_text as string | null)?.split(/,\s*/) ?? null) }, b.context ?? {});
      return {
        found: true, needs_confirmation: !b.confirm, recalls, recall_check: demoRecallCheck(), database: 'demo',
        product: { ...fromProductRow(product), category: product.category, ingredients: product.ingredients, declared_allergens: product.declared_allergens, is_demo: true },
        assessment: isPremium() ? assessment : { ...assessment, findings: assessment.findings.filter((f) => f.level === 'avoid_advised'), limited: true },
      };
    },
    // Pas d'IA sans serveur : on le dit, l'application affiche l'explication des règles (jamais un faux texte IA)
    'scan-explain': (b) => {
      if (!sanitizePayload(b)) throw new BackendError(tr('l2.dm.analysisInvalid'));
      return { ai: 'not_configured', message: tr('l2.dm.aiExplain') };
    },
    // Analyse de photo de glaire : aucune image ne quitte l'appareil en démonstration
    'cycle-photo': (b) => {
      if (b.consent !== true) throw new BackendError(tr('l2.dm.photoConsent'), 'consent_required', undefined, 400);
      throw new BackendError(tr('l2.dm.photoDemo'), 'ai_not_configured', undefined, 503);
    },
    // Démonstration : aucun document n'est envoyé à un service de lecture
    'document-read': () => ({ status: 'demo' }),
    'document-extract': () => ({ fields: null, status: 'unavailable', message: tr('l2.dm.ocrDemo') }),
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

  /** Comme le déclencheur Supabase : profil, réglages ET foyer, créés ensemble à l'inscription. */
  function ensureProfile(userId: string) {
    ensureAccount(userId);
  }

  function ensureAccount(userId: string): { profile_created: boolean; household_created: boolean; household_id: string } {
    let profileCreated = false;
    if (!T('profiles').some((p) => p.id === userId)) {
      profileCreated = true;
      T('profiles').push({ id: userId, display_name: null, journeys: [], interests: [], locale: 'fr', timezone: 'Europe/Paris', onboarding_completed: false, home_shortcuts: ['bottle', 'diaper', 'sleep', 'question'], hide_weight_module: false, theme: 'system' });
      T('privacy_settings').push({ user_id: userId, analytics_enabled: false, crash_reports_enabled: false, ai_history_enabled: false, ai_history_consented_at: null, community_visible: true, retention_months: 36 });
    }
    const member = T('household_members').find((m) => m.user_id === userId);
    if (member) return { profile_created: profileCreated, household_created: false, household_id: String(member.household_id) };
    const id = uuid();
    T('households').push({ id, name: tr('l2.dm.family'), created_by: userId, created_at: nowIso(), auto_created: true });
    T('household_members').push({
      household_id: id, user_id: userId, role: 'owner', joined_at: nowIso(),
      can_view: ['daily', 'health', 'documents', 'pregnancy', 'lists', 'names', 'profile'],
      can_edit: ['daily', 'health', 'documents', 'pregnancy', 'lists', 'names', 'profile'],
    });
    return { profile_created: profileCreated, household_created: true, household_id: id };
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
      async resendConfirmation() {
        // Aucun e-mail en mode démonstration : le compte est actif tout de suite
      },
      async signInWithProvider(provider) {
        throw new BackendError(tr(provider === 'apple' ? 'l2.dm.signinApple' : 'l2.dm.signinGoogle'));
      },
      async signUp(email, password) {
        await load();
        const e = email.trim().toLowerCase();
        if (state.users.some((u) => u.email === e)) throw new BackendError(tr('l2.dm.accountExists'));
        const id = uuid();
        state.users.push({ id, email: e, pw: fnv(password) });
        ensureProfile(id);
        setSession({ userId: id, email: e });
        return { needsConfirmation: false };
      },
      async signIn(email, password) {
        await load();
        const u = state.users.find((x) => x.email === email.trim().toLowerCase());
        if (!u || u.pw !== fnv(password)) throw new BackendError(tr('l2.dm.badLogin'));
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
        // Démonstration : le fichier reste sur l'appareil (adresse data: pour survivre au rechargement)
        let uri = file.uri;
        if (file.bytes) {
          let bin = '';
          for (let i = 0; i < file.bytes.length; i += 0x8000) bin += String.fromCharCode(...file.bytes.subarray(i, i + 0x8000));
          uri = `data:${file.mimeType};base64,${globalThis.btoa(bin)}`;
        } else if (uri.startsWith('blob:')) {
          try {
            const blob = await (await fetch(uri)).blob();
            uri = await new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = rej; r.readAsDataURL(blob); });
          } catch { /* garde l'adresse temporaire */ }
        }
        T('_files').push({ id: uuid(), bucket, path, uri, mime: file.mimeType });
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
      // Contenus de référence (articles, aliments, prénoms…) : jamais modifiés par l'écran → copie légère, bien plus rapide
      // (la bibliothèque compte plus de 1 000 articles longs) ; données de l'utilisateur : copie complète.
      if ((CATALOG_TABLES as readonly string[]).includes(q.table)) return rows.map((r) => ({ ...r })) as unknown as R[];
      return JSON.parse(JSON.stringify(rows)) as R[];
    },
    async insert<R>(table: string, input: Row | Row[], opts?: { onConflict?: string; ignoreDuplicates?: boolean; returning?: string }) {
      await load();
      const out: Row[] = [];
      for (let raw of Array.isArray(input) ? input : [input]) {
        const conflictCol = opts?.onConflict;
        // Valeur par défaut user_id = auth.uid() appliquée avant la détection de conflit (comme la base)
        const owner = OWNER_TABLES[table];
        if (conflictCol && owner && conflictCol === owner && raw[owner] == null && state.session) raw = { ...raw, [owner]: state.session.userId };
        if (conflictCol && conflictCol.split(',').every((c) => raw[c] != null)) {
          const existing = T(table).find((r) => conflictCol.split(',').every((c) => r[c] === raw[c]));
          if (existing) {
            if (table === 'cycle_preferences' && !opts?.ignoreDuplicates) checkCyclePrefs({ ...existing, ...raw }, existing);
            if (!opts?.ignoreDuplicates) Object.assign(existing, raw, table === 'cycle_preferences' ? { updated_at: nowIso() } : {});
            out.push(existing);
            continue;
          }
        }
        const row = beforeInsert(table, { ...raw });
        T(table).push(row);
        afterInsert(table, row);
        markLib(table, [row]);
        out.push(row);
      }
      if (table === 'assistant_feedback') out.forEach(syncFeedback);
      persist();
      return JSON.parse(JSON.stringify(out)) as R[];
    },
    async update<R>(table: string, patch: Row, filters: Filter[]) {
      await load();
      let rows = T(table).filter((r) => filters.every((f) => matches(r, f)));
      // Comme 20261029000200 : activer l'historique de l'assistant = accord daté ; le désactiver l'efface
      if (table === 'privacy_settings' && 'ai_history_enabled' in patch) patch = { ...patch, ai_history_consented_at: patch.ai_history_enabled === true ? nowIso() : null };
      // « Je grandis » / « Ses découvertes » : mêmes contrôles qu'à la création
      if (table === 'child_steps' && 'status' in patch) for (const r of rows) checkChildStep({ ...r, ...patch });
      if (table === 'food_introductions') {
        for (const r of rows) {
          const next = { ...r, ...patch };
          if (!['not_yet', 'tasted', 'liked', 'refused'].includes(next.status as string)) throw new BackendError(tr('l2.dm.foodStatus'));
          if (next.status !== 'not_yet' && !next.first_tried_on) throw new BackendError(tr('l2.dm.foodDate'));
        }
        patch = { ...patch, updated_at: nowIso() };
      }
      // Communauté : chacun ne modifie que ses propres contenus (RLS), sans changer statut, anonymat ni compteurs
      if (['posts', 'comments', 'community_profiles', 'post_photos'].includes(table) && !isModerator()) {
        const me = state.session?.userId;
        rows = rows.filter((r) => (table === 'community_profiles' ? r.user_id : r.author_id) === me);
        if (table === 'posts' || table === 'comments') {
          if (patch.status != null && rows.some((r) => patch.status !== r.status && patch.status !== 'removed')) throw new BackendError(tr('l2.dm.statusLocked'), '42501');
          for (const r of rows) {
            const before = { ...r };
            for (const k of ['title', 'body', 'kind', 'forum_id', 'status']) if (k in patch && (table === 'posts' || ['body', 'status'].includes(k))) r[k] = k === 'title' ? (String(patch.title ?? '').trim() || null) : patch[k];
            if (table === 'posts' && !T('forums').some((f) => f.id === r.forum_id && !f.archived)) r.forum_id = before.forum_id;
            if (r.body !== before.body || r.title !== before.title) {
              r.edited_at = nowIso();
              const text = `${r.title ?? ''} ${r.body}`;
              if (r.status === 'visible' && (PERSONAL_DATA.test(text) || textNeedsReview(text) || DEMO_TERMS.some((x) => x.pattern.test(text)))) r.status = 'pending_review';
              if (DEMO_TERMS.some((x) => x.action === 'block' && x.pattern.test(text))) { Object.assign(r, before); throw new BackendError(tr('l2.dm.contentRules')); }
            }
          }
          persist();
          return JSON.parse(JSON.stringify(rows)) as R[];
        }
        if (table === 'community_profiles') {
          for (const r of rows) {
            const next: Row = { ...patch };
            delete next.suspended_until; delete next.user_id; delete next.created_at;
            if (next.pseudonym != null) checkPseudonym({ ...next, user_id: r.user_id }, false);
            checkCommunityProfile(next, r);
            social.checkProfilePremium(next, r);
            Object.assign(r, next);
          }
          persist();
          return JSON.parse(JSON.stringify(rows)) as R[];
        }
      }
      rows = rows.filter((r) => social.beforeUpdate(table, r, patch) && outings.beforeUpdate(table, r, patch));
      markLib(table, rows);
      if (table === 'assistant_messages' && Object.keys(patch).some((k) => k !== 'saved')) throw new BackendError(tr('l2.dm.forbidden'), '42501');
      if (table === 'assistant_messages' && patch.saved === true && rows.some((r) => !r.saved) && !isPremium()) throw new BackendError('Fonction Premium (assistant_saved)', 'P0001', 'premium_required');
      // Un scan analysé ne se réécrit pas ; seul le champ « explication IA » d'un résultat est modifiable
      if (table === 'product_scans' || (table === 'scan_results' && Object.keys(patch).some((k) => k !== 'explanation'))) throw new BackendError(tr('l2.dm.forbidden'), '42501');
      for (const r of rows) {
        if (table === 'community_profiles' && patch.pseudonym != null) checkPseudonym({ ...patch, user_id: r.user_id }, false);
        if (table === 'sleeps' && patch.ended_at && Date.parse(patch.ended_at) < Date.parse(patch.started_at ?? r.started_at)) throw new BackendError(tr('l2.dm.sleepEnd'));
        if (table === 'bottle_timers') checkBottleTimer(T(table), { ...r, ...patch, id: r.id });
        if (table === 'bottles') {
          const next = { ...r, ...patch };
          if (next.prepared_ml != null && next.consumed_ml != null && next.consumed_ml > next.prepared_ml) throw new BackendError(tr('l2.dm.bottleDrunk'));
        }
        if (table === 'documents') {
          const next = { ...r, ...patch };
          if (next.category === 'custom' && !next.custom_category) throw new BackendError(tr('l2.dm.nameCustom'));
          Object.assign(r, patch, { updated_at: nowIso() });
          continue;
        }
        if (table === 'document_extractions') {
          const next = { ...r, ...patch };
          if (next.status === 'professional' && !next.professional_note) throw new BackendError(tr('l2.dm.sourceDoc'));
          const stamp = (next.status === 'verified' || next.status === 'professional') && next.status !== r.status;
          Object.assign(r, patch);
          if (stamp) { r.verified_by = state.session?.userId ?? null; r.verified_at = nowIso(); }
          if (r.status === 'to_verify' || r.status === 'rejected') { r.verified_by = null; r.verified_at = null; }
          continue;
        }
        if (table === 'family_tasks') {
          const before = { ...r };
          Object.assign(r, patch, { updated_at: nowIso(), updated_by: state.session?.userId ?? null });
          if (r.status === 'done' && before.status !== 'done') { r.done_at = nowIso(); r.done_by = state.session?.userId ?? null; }
          if (r.status !== 'done') { r.done_at = null; r.done_by = null; }
          if (r.assignee_id !== before.assignee_id) taskEvent(r, r.assignee_id ? 'assigned' : 'unassigned', { from: before.assignee_id, to: r.assignee_id });
          if (r.status !== before.status) { taskEvent(r, r.status === 'done' ? 'done' : r.status === 'cancelled' ? 'cancelled' : 'reopened'); nextOccurrence(r); }
          else if (before.due_at && r.due_at && r.due_at > before.due_at) taskEvent(r, 'postponed', { from: before.due_at, to: r.due_at });
          continue;
        }
        if (table === 'care_requests') {
          const me = state.session?.userId;
          if (r.from_user === me && patch.status && !['open', 'cancelled', 'done'].includes(String(patch.status))) throw new BackendError(tr('l2.dm.ownRequest'), '42501');
          Object.assign(r, patch);
          continue;
        }
        if (table === 'postpartum_shared_status') {
          const next = { ...r, ...patch };
          filterPostpartumShared(T('postpartum_settings').find((x) => x.user_id === r.user_id), next);
          Object.assign(r, next);
          continue;
        }
        if (table === 'postpartum_settings') {
          const next = { ...r, ...patch };
          Object.assign(r, next, { updated_at: nowIso() });
          // Révocation immédiate (déclencheur postpartum_apply_revocation)
          const shared = T('postpartum_shared_status').find((x) => x.user_id === r.user_id);
          if (shared) {
            if (next.share_household_id !== shared.household_id || !(next.share_rest_need || next.share_availability || next.share_relay_requests || next.share_summary)) {
              state.tables.postpartum_shared_status = T('postpartum_shared_status').filter((x) => x !== shared);
            } else filterPostpartumShared(next, shared);
          }
          continue;
        }
        if (table === 'user_journeys') {
          const before = { ...r };
          const next = { ...r, ...patch };
          if (next.status === 'active') checkJourney(next);
          Object.assign(r, patch, { updated_at: nowIso() });
          afterJourney(before, r);
          continue;
        }
        if (table === 'symptom_logs' && ('tags' in patch || 'moods' in patch || 'habits' in patch)) checkSymptomRow({ ...r, ...patch });
        if (table === 'cycle_preferences') checkCyclePrefs({ ...r, ...patch }, r);
        if (table === 'parent_sleep_logs') {
          if (r.user_id !== state.session?.userId) continue;
          if (patch.log_date && T(table).some((x) => x.id !== r.id && x.user_id === r.user_id && x.log_date === patch.log_date)) throw new BackendError(tr('l2.dm.nightExists'));
        }
        Object.assign(r, patch, ['reminders', 'profiles', 'pregnancies', 'children', 'parent_sleep_logs', 'contraception_methods', 'consultation_questions', 'bottle_timers', 'cycle_preferences', 'postpartum_checkins'].includes(table) ? { updated_at: nowIso() } : {});
      }
      persist();
      return JSON.parse(JSON.stringify(rows)) as R[];
    },
    async remove(table, filters) {
      await load();
      let removed = T(table).filter((r) => filters.every((f) => matches(r, f)));
      if (['posts', 'comments', 'post_photos'].includes(table) && !isModerator()) removed = removed.filter((r) => r.author_id === state.session?.userId);
      removed = outings.filterRemove(table, social.filterRemove(table, removed));
      markLib(table, removed);
      state.tables[table] = T(table).filter((r) => !removed.includes(r));
      social.afterRemove(table, removed, state.tables);
      outings.afterRemove(table, removed);
      if (table === 'post_likes') removed.forEach((l) => { const p = T('posts').find((x) => x.id === l.post_id); if (p) p.like_count = Math.max(0, p.like_count - 1); });
      if (table === 'comments') {
        // Les réponses d'un commentaire supprimé sont supprimées avec lui
        const replies = T('comments').filter((c) => removed.some((x) => x.id === c.parent_id));
        state.tables.comments = T('comments').filter((c) => !replies.includes(c));
        [...removed, ...replies].forEach((c) => { const p = T('posts').find((x) => x.id === c.post_id); if (p) p.comment_count = Math.max(0, p.comment_count - 1); });
      }
      // Suppressions en cascade principales
      if (table === 'children') {
        const goneTreatments = T('child_treatments').filter((x) => removed.some((c) => c.id === x.child_id)).map((x) => x.id);
        state.tables.treatment_logs = T('treatment_logs').filter((x) => !goneTreatments.includes(x.treatment_id));
        state.tables.reminders = T('reminders').filter((x) => !removed.some((c) => c.id === x.child_id) && !goneTreatments.includes(x.treatment_id));
        for (const t of [...CHILD_TABLES, 'user_journeys']) state.tables[t] = T(t).filter((r) => !removed.some((c) => c.id === r.child_id));
      }
      if (table === 'child_treatments') {
        state.tables.treatment_logs = T('treatment_logs').filter((x) => !removed.some((c) => c.id === x.treatment_id));
        state.tables.reminders = T('reminders').filter((x) => !removed.some((c) => c.id === x.treatment_id));
      }
      // Grossesse supprimée : bébés attendus, listes, rendez-vous, rappels et parcours liés (cascade) ; poids : lien retiré
      if (table === 'pregnancies') {
        const gone = (r: Row) => removed.some((p) => p.id === r.pregnancy_id);
        const lists = T('checklists').filter(gone).map((c) => c.id);
        state.tables.checklist_items = T('checklist_items').filter((i) => !lists.includes(i.checklist_id));
        for (const t of ['expected_babies', 'checklists', 'appointments', 'reminders', 'user_journeys']) state.tables[t] = T(t).filter((r) => !gone(r));
        T('maternal_weights').forEach((w) => { if (gone(w)) w.pregnancy_id = null; });
      }
      if (table === 'user_journeys' || table === 'pregnancies' || table === 'children') {
        const users = new Set([...removed.map((r) => r.user_id), state.session?.userId].filter(Boolean));
        for (const u of users) { const prof = T('profiles').find((p) => p.id === u); if (prof) prof.journeys = legacyJourneys(T('user_journeys') as JourneyRow[], u); }
      }
      // bottle_timers.bottle_id : on delete set null
      if (table === 'bottles') T('bottle_timers').forEach((x) => { if (removed.some((b) => b.id === x.bottle_id)) x.bottle_id = null; });
      // Documents : texte lu, champs, résumés et rappels liés disparaissent avec le document
      if (table === 'documents') {
        state.tables.document_extractions = T('document_extractions').filter((x) => !removed.some((d) => d.id === x.document_id));
        state.tables.reminders = T('reminders').filter((x) => !removed.some((d) => x.deep_link === `/documents/${d.id}`));
      }
      if (table === 'checklists') state.tables.checklist_items = T('checklist_items').filter((i) => !removed.some((c) => c.id === i.checklist_id));
      if (table === 'assistant_conversations') {
        const gone = new Set(T('assistant_messages').filter((m) => removed.some((c) => c.id === m.conversation_id)).map((m) => m.id));
        state.tables.assistant_messages = T('assistant_messages').filter((m) => !gone.has(m.id));
        state.tables.assistant_feedback = T('assistant_feedback').filter((f) => !gone.has(f.message_id));
      }
      if (table === 'assistant_feedback') removed.forEach((f) => { const m = T('assistant_messages').find((x) => x.id === f.message_id); if (m) m.feedback = null; });
      if (table === 'posts') {
        state.tables.comments = T('comments').filter((c) => !removed.some((p) => p.id === c.post_id));
        state.tables.post_photos = T('post_photos').filter((ph) => !removed.some((p) => p.id === ph.post_id));
        for (const t of ['post_likes', 'saved_posts', 'reports']) state.tables[t] = T(t).filter((x) => !removed.some((p) => p.id === x.post_id));
      }
      if (table === 'product_scans') {
        state.tables.scan_results = T('scan_results').filter((x) => !removed.some((s) => s.id === x.scan_id));
        state.tables.scan_favorites = T('scan_favorites').filter((x) => !removed.some((s) => s.id === x.scan_id));
      }
      persist();
    },
    async rpc<R>(fn: string, args?: Row) {
      await load();
      const impl = rpcs[fn];
      if (!impl) throw new BackendError(tr('l2.dm.fnUnavailable', { fn }));
      const out = impl(args ?? {});
      persist();
      return out as R;
    },
    async invokeStream<R>(fn: string, body: Record<string, unknown>, onEvent: (event: string, data: unknown) => void, opts?: { signal?: AbortSignal }) {
      await load();
      if (fn !== 'assistant') return this.invoke<R>(fn, body);
      const { result, raw } = assistantCore(body ?? {});
      persist();
      if (raw) {
        // Diffusion simulée : le texte arrive par petits morceaux, comme avec le vrai service
        onEvent('meta', { conversation_id: result.conversation_id, quota: result.quota, demo: true });
        for (const piece of raw.match(/[\s\S]{1,22}/g) ?? []) {
          if (opts?.signal?.aborted) throw new BackendError(tr('l2.sb.stopped'), 'aborted');
          onEvent('delta', { text: piece });
          if (streamDelayMs > 0) await new Promise((r) => setTimeout(r, streamDelayMs));
        }
      }
      return JSON.parse(JSON.stringify(result)) as R;
    },
    async invoke<R>(fn: string, body: unknown) {
      await load();
      const impl = functions[fn];
      if (!impl) throw new BackendError(tr('l2.dm.serviceDemo'));
      const out = await impl((body ?? {}) as Row);
      persist();
      return out as R;
    },
  };
}
