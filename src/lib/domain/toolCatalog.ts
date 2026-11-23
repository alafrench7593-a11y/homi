/**
 * Catalogue du centre d'outils : les outils réels de l'application, depuis le registre central
 * (src/lib/journeys/tools.ts). Un besoin = une entrée, rangée dans l'une des 9 catégories ; chaque entrée porte un
 * nom, une description d'une phrase, ses profils, son statut Premium, une route directe et un identifiant STABLE
 * (favoris, récents). Les « thèmes » restent l'identité visuelle des glyphes (couleur, animation) et le rangement des onglets.
 */
import type { IconName } from '@/components/ui';
import { localeTag, t as tr, tMaybe, type TKey } from '@/i18n';
import { localized } from '@/i18n/localized';
import { isFreeRoute } from '@/lib/premium/access';
import {
  canonicalCategory, canonicalToolId, FEATURED, SCOPES, TOOL_BY_ID, TOOL_CATEGORIES, toolDescKey, toolLabelKey, toolProfiles, toolsFor, toolSubKey,
  type ResolvedTool, type Scope, type ScopeCtx, type ToolCategory, type ToolProfile, type ToolShelf,
} from '@/lib/journeys/tools';
import { searchCatalog } from './toolSearch';

export type ToolTheme =
  | 'feeding' | 'sleep' | 'diapers' | 'teeth' | 'growth' | 'health' | 'mood' | 'pregnancy' | 'cycle'
  | 'scanner' | 'calendar' | 'tasks' | 'relay' | 'metime' | 'prevention' | 'memories' | 'reminders' | 'resources';

/** Ordre d'affichage et titres des catégories. */
const THEMES_FR: { key: ToolTheme; title: string; short: string }[] = [
  { key: 'feeding', title: 'Alimentation et biberons', short: 'Repas' },
  { key: 'sleep', title: 'Sommeil et réveils', short: 'Sommeil' },
  { key: 'diapers', title: 'Changes et digestion', short: 'Changes' },
  { key: 'teeth', title: 'Dents et hygiène', short: 'Dents' },
  { key: 'growth', title: 'Croissance et développement', short: 'Croissance' },
  { key: 'health', title: 'Santé et rendez-vous', short: 'Santé' },
  { key: 'mood', title: 'Humeur et bien-être', short: 'Humeur' },
  { key: 'pregnancy', title: 'Grossesse', short: 'Grossesse' },
  { key: 'cycle', title: 'Cycle et post-partum', short: 'Cycle' },
  { key: 'scanner', title: 'Scanner et allergènes', short: 'Scanner' },
  { key: 'calendar', title: 'Calendrier familial', short: 'Agenda' },
  { key: 'tasks', title: 'Tâches et partage', short: 'Tâches' },
  { key: 'relay', title: 'Relais de nuit', short: 'Relais' },
  { key: 'metime', title: 'Temps pour soi', short: 'Pour soi' },
  { key: 'prevention', title: 'Prévenir la surcharge', short: 'Surcharge' },
  { key: 'memories', title: 'Souvenirs et étapes', short: 'Souvenirs' },
  { key: 'reminders', title: 'Notifications, rappels et réglages', short: 'Rappels' },
  { key: 'resources', title: 'Questions, lectures et communauté', short: 'Ressources' },
];
const THEMES_EN: { key: ToolTheme; title: string; short: string }[] = [
  { key: 'feeding', title: 'Feeding and bottles', short: 'Meals' },
  { key: 'sleep', title: 'Sleep and wakings', short: 'Sleep' },
  { key: 'diapers', title: 'Nappies and digestion', short: 'Nappies' },
  { key: 'teeth', title: 'Teeth and hygiene', short: 'Teeth' },
  { key: 'growth', title: 'Growth and development', short: 'Growth' },
  { key: 'health', title: 'Health and appointments', short: 'Health' },
  { key: 'mood', title: 'Mood and well-being', short: 'Mood' },
  { key: 'pregnancy', title: 'Pregnancy', short: 'Pregnancy' },
  { key: 'cycle', title: 'Cycle and postpartum', short: 'Cycle' },
  { key: 'scanner', title: 'Scanner and allergens', short: 'Scanner' },
  { key: 'calendar', title: 'Family calendar', short: 'Calendar' },
  { key: 'tasks', title: 'Tasks and sharing', short: 'Tasks' },
  { key: 'relay', title: 'Night shifts', short: 'Shifts' },
  { key: 'metime', title: 'Time for you', short: 'Me time' },
  { key: 'prevention', title: 'Preventing overload', short: 'Overload' },
  { key: 'memories', title: 'Memories and milestones', short: 'Memories' },
  { key: 'reminders', title: 'Notifications, reminders and settings', short: 'Reminders' },
  { key: 'resources', title: 'Questions, reading and community', short: 'Resources' },
];
const THEMES_ES: { key: ToolTheme; title: string; short: string }[] = [
  { key: 'feeding', title: 'Alimentación y biberones', short: 'Comidas' },
  { key: 'sleep', title: 'Sueño y despertares', short: 'Sueño' },
  { key: 'diapers', title: 'Pañales y digestión', short: 'Pañales' },
  { key: 'teeth', title: 'Dientes e higiene', short: 'Dientes' },
  { key: 'growth', title: 'Crecimiento y desarrollo', short: 'Crecimiento' },
  { key: 'health', title: 'Salud y citas', short: 'Salud' },
  { key: 'mood', title: 'Estado de ánimo y bienestar', short: 'Ánimo' },
  { key: 'pregnancy', title: 'Embarazo', short: 'Embarazo' },
  { key: 'cycle', title: 'Ciclo y posparto', short: 'Ciclo' },
  { key: 'scanner', title: 'Escáner y alérgenos', short: 'Escáner' },
  { key: 'calendar', title: 'Calendario familiar', short: 'Agenda' },
  { key: 'tasks', title: 'Tareas y reparto', short: 'Tareas' },
  { key: 'relay', title: 'Relevos de noche', short: 'Relevos' },
  { key: 'metime', title: 'Tiempo para ti', short: 'Para ti' },
  { key: 'prevention', title: 'Prevenir la sobrecarga', short: 'Sobrecarga' },
  { key: 'memories', title: 'Recuerdos y etapas', short: 'Recuerdos' },
  { key: 'reminders', title: 'Notificaciones, recordatorios y ajustes', short: 'Recordatorios' },
  { key: 'resources', title: 'Preguntas, lecturas y comunidad', short: 'Recursos' },
];
const THEMES_DE: { key: ToolTheme; title: string; short: string }[] = [
  { key: 'feeding', title: 'Ernährung und Fläschchen', short: 'Mahlzeiten' },
  { key: 'sleep', title: 'Schlaf und Aufwachen', short: 'Schlaf' },
  { key: 'diapers', title: 'Wickeln und Verdauung', short: 'Wickeln' },
  { key: 'teeth', title: 'Zähne und Hygiene', short: 'Zähne' },
  { key: 'growth', title: 'Wachstum und Entwicklung', short: 'Wachstum' },
  { key: 'health', title: 'Gesundheit und Termine', short: 'Gesundheit' },
  { key: 'mood', title: 'Stimmung und Wohlbefinden', short: 'Stimmung' },
  { key: 'pregnancy', title: 'Schwangerschaft', short: 'Schwangerschaft' },
  { key: 'cycle', title: 'Zyklus und Wochenbett', short: 'Zyklus' },
  { key: 'scanner', title: 'Scanner und Allergene', short: 'Scanner' },
  { key: 'calendar', title: 'Familienkalender', short: 'Kalender' },
  { key: 'tasks', title: 'Aufgaben und Aufteilung', short: 'Aufgaben' },
  { key: 'relay', title: 'Nachtablösung', short: 'Ablösung' },
  { key: 'metime', title: 'Zeit für dich', short: 'Für dich' },
  { key: 'prevention', title: 'Überlastung vorbeugen', short: 'Überlastung' },
  { key: 'memories', title: 'Erinnerungen und Meilensteine', short: 'Erinnerungen' },
  { key: 'reminders', title: 'Benachrichtigungen, Erinnerungen und Einstellungen', short: 'Erinnerungen' },
  { key: 'resources', title: 'Fragen, Lektüre und Community', short: 'Ressourcen' },
];
const THEMES_IT: { key: ToolTheme; title: string; short: string }[] = [
  { key: 'feeding', title: 'Alimentazione e biberon', short: 'Pasti' },
  { key: 'sleep', title: 'Sonno e risvegli', short: 'Sonno' },
  { key: 'diapers', title: 'Cambi e digestione', short: 'Cambi' },
  { key: 'teeth', title: 'Denti e igiene', short: 'Denti' },
  { key: 'growth', title: 'Crescita e sviluppo', short: 'Crescita' },
  { key: 'health', title: 'Salute e appuntamenti', short: 'Salute' },
  { key: 'mood', title: 'Umore e benessere', short: 'Umore' },
  { key: 'pregnancy', title: 'Gravidanza', short: 'Gravidanza' },
  { key: 'cycle', title: 'Ciclo e post-partum', short: 'Ciclo' },
  { key: 'scanner', title: 'Scanner e allergeni', short: 'Scanner' },
  { key: 'calendar', title: 'Calendario familiare', short: 'Agenda' },
  { key: 'tasks', title: 'Compiti e condivisione', short: 'Compiti' },
  { key: 'relay', title: 'Turni di notte', short: 'Turni' },
  { key: 'metime', title: 'Tempo per te', short: 'Per te' },
  { key: 'prevention', title: 'Prevenire il sovraccarico', short: 'Sovraccarico' },
  { key: 'memories', title: 'Ricordi e tappe', short: 'Ricordi' },
  { key: 'reminders', title: 'Notifiche, promemoria e impostazioni', short: 'Promemoria' },
  { key: 'resources', title: 'Domande, letture e community', short: 'Risorse' },
];
export const THEMES: { key: ToolTheme; title: string; short: string }[] = localized(THEMES_FR, THEMES_EN, { es: THEMES_ES, de: THEMES_DE, it: THEMES_IT });
const themeTitles = (l: typeof THEMES_FR) => Object.fromEntries(l.map((x) => [x.key, x.title])) as Record<ToolTheme, string>;
export const THEME_TITLE = localized(themeTitles(THEMES_FR), themeTitles(THEMES_EN), { es: themeTitles(THEMES_ES), de: themeTitles(THEMES_DE), it: themeTitles(THEMES_IT) });

// ------------------------------------------------------------------ catégories du centre d'outils
/** Pictogramme de chaque catégorie (liste « Mes outils »). */
export const CATEGORY_ICON: Record<ToolCategory, IconName> = {
  feeding: 'coffee', sleep: 'moon', care: 'droplet', health: 'activity', cycle: 'rotate-cw', pregnancy: 'heart',
  school: 'book', couple: 'users', family: 'home', community: 'globe', account: 'settings',
};
/** Thème visuel (couleur du glyphe) prêté à chaque catégorie. */
export const CATEGORY_THEME: Record<ToolCategory, ToolTheme> = {
  feeding: 'feeding', sleep: 'sleep', care: 'diapers', health: 'health', cycle: 'cycle', pregnancy: 'pregnancy',
  school: 'tasks', couple: 'relay', family: 'calendar', community: 'resources', account: 'reminders',
};
export const categoryTitle = (c: ToolCategory) => tr(`th.cat.${c}` as TKey);
export const categoryLead = (c: ToolCategory) => tr(`th.cat.${c}.d` as TKey);
/** Accès nommé à la catégorie complète (« Tous les outils de sommeil ») : jamais « Voir les N autres ». */
export const categoryAllLabel = (c: ToolShelf) => tr(`th.cat.${c}.all` as TKey);
/** Catégorie qui a sa propre liste (`/tools/<catégorie>`) : les 9 rayons et « Mon compte et réglages ». */
export const isToolCategory = (v: unknown): v is Exclude<ToolCategory, 'community'> => typeof v === 'string' && (v === 'account' || (TOOL_CATEGORIES as string[]).includes(v));
/** Catégorie d'un lien (identifiant actuel ou ancien : « growth » → « care ») ; null si inconnue. */
export const categoryFromParam = (v: unknown): ToolCategory | null => (typeof v === 'string' ? canonicalCategory(v) : null);

/** Nom d'un outil du registre (identifiant actuel ou ancien), dans la langue active : la SEULE source des libellés d'outil. */
export const toolName = (id: string) => tr(toolLabelKey(id));
/** Description d'une phrase d'un outil du registre. */
export const toolBlurb = (id: string) => tMaybe(toolDescKey(id)) || '';

export interface CatalogSub {
  /** Identifiant stable `<outil>.<sous-accès>` (favoris, recherche). */
  id: string;
  icon: IconName;
  label: string;
  /** Précision courte (fragment hérité), quand elle existe. */
  hint?: string;
  category: ToolCategory;
  href: string;
  /** Numéro de la liste des 200 : sous-accès NOMMÉ (fonction de l'outil), affiché comme une entrée du catalogue. */
  fn?: number;
}

export interface CatalogTool {
  /** Identifiant STABLE de l'outil dans le registre central (favoris, récents, liens) : ne dépend ni du thème ni de l'adresse. */
  id: string;
  /** Même valeur que `id` (ancien nom du champ, conservé pour les écrans existants). */
  key: string;
  category: ToolCategory;
  theme: ToolTheme;
  icon: IconName;
  label: string;
  /** Description d'UNE phrase : à quoi sert l'outil. */
  sub?: string;
  href: string;
  /** Profils concernés (lisibles : moi, grossesse, post-partum, bébé, enfant, famille). */
  profiles: ToolProfile[];
  /** Ouvert sans abonnement (urgences, sécurité, sources) ; sinon inclus dans Premium. */
  free: boolean;
  /** Outil « pour tout le monde », adapté au profil affiché. */
  universal?: boolean;
  /** Catégories où l'outil est aussi proposé en raccourci contextuel (sa catégorie principale reste `category`). */
  also: ToolShelf[];
  /** Urgences : jamais retardé par une animation. */
  urgent?: boolean;
  /** Sous-accès disponibles pour le profil affiché (onglets, filtres, lectures du même écran). */
  subs: CatalogSub[];
  /**
   * Fonctions de l'outil exposées comme sous-accès NOMMÉS du catalogue (liste des 200, `h200_<n>`) : chacune a son
   * nom, sa phrase et son pictogramme, et ouvre l'outil sur la vue précise. Vide pour une entrée déjà dérivée.
   */
  fns?: CatalogSub[];
  /** Outil d'un profil que le foyer n'a pas encore (catalogue complet) : sa fiche mène à « Modifier mon parcours ». */
  locked?: boolean;
  /** Entrée construite à partir d'un sous-accès (favori ou résultat de recherche) : identifiant de l'outil parent. */
  parent?: string;
}

const routePath = (href: string) => href.replace('/(tabs)', '') || '/';

function toCatalog(it: ResolvedTool): CatalogTool {
  const def = TOOL_BY_ID[it.id];
  const desc = tMaybe(toolDescKey(it.id));
  return {
    id: it.id, key: it.id, category: it.category, theme: it.theme, icon: it.icon, label: tr(toolLabelKey(it.id)), sub: desc || undefined,
    href: it.href, profiles: toolProfiles(def), free: isFreeRoute(routePath(it.href)), universal: it.universal, urgent: it.urgent, also: it.also,
    subs: it.subs.map((s) => ({ id: s.id, icon: s.icon, label: tr(toolLabelKey(s.id)), hint: tMaybe(toolSubKey(s.id)) || undefined, category: s.category, href: s.href })),
    fns: it.fns.map((s) => ({ id: s.id, icon: s.icon, label: tr(toolLabelKey(s.id)), hint: tMaybe(toolSubKey(s.id)) || undefined, category: s.category, href: s.href, fn: s.fn })),
  };
}

const CAT_ORDER = new Map<ToolCategory, number>([...TOOL_CATEGORIES, 'community' as const, 'account' as const].map((c, i) => [c, i]));
const byCategory = (list: CatalogTool[]) =>
  list.map((x, i) => ({ x, i })).sort((a, b) => CAT_ORDER.get(a.x.category)! - CAT_ORDER.get(b.x.category)! || a.i - b.i).map((r) => r.x);

/**
 * Outils AUTORISÉS pour le profil affiché, depuis le registre central (src/lib/journeys/tools.ts), rangés dans
 * l'ordre des 9 catégories, suivis de l'espace Communauté (catégorie « community » : ouvrable, favori possible,
 * mais jamais compté dans une catégorie). Un besoin = une entrée ; les entrées « Mon compte et réglages » n'y
 * figurent pas (voir `accountEntries`). Libellés dans la langue active.
 */
export function toolCatalog(ctx: ScopeCtx): CatalogTool[] {
  return byCategory(toolsFor(ctx).filter((x) => x.category !== 'account').map(toCatalog));
}

/** Réglages, notifications, parcours : accessibles depuis « Mes outils », jamais comptés comme outils. */
export function accountEntries(ctx: ScopeCtx): CatalogTool[] {
  return toolsFor(ctx).filter((x) => x.category === 'account').map(toCatalog);
}

/** Entrée de liste pour un sous-accès (favori, résultat de recherche, « à lire ») : s'ouvre comme un outil. */
export function subAsTool(tool: CatalogTool, sub: CatalogSub): CatalogTool {
  return { ...tool, id: sub.id, key: sub.id, category: sub.category, icon: sub.icon, label: sub.label, sub: sub.hint, href: sub.href, subs: [], fns: [], also: [], parent: tool.id, urgent: false };
}

/** Retrouve une entrée (outil ou sous-accès) par son identifiant stable. */
export function findEntry(tools: CatalogTool[], id: string): CatalogTool | null {
  for (const x of tools) {
    if (x.id === id) return x;
    const s = x.subs.find((y) => y.id === id) ?? x.fns?.find((y) => y.id === id);
    if (s) return subAsTool(x, s);
  }
  return null;
}

/**
 * Contenu d'une catégorie : ses outils (catégorie principale), les raccourcis contextuels (« Aussi utile ici » :
 * outils d'une autre catégorie, même identifiant et même favori) et les lectures (guides rangés dans cette catégorie).
 */
export function categoryContent(tools: CatalogTool[], category: ToolCategory) {
  return {
    tools: tools.filter((x) => x.category === category),
    shortcuts: tools.filter((x) => x.category !== category && (x.also as ToolCategory[]).includes(category)),
    readings: tools.flatMap((x) => x.subs.filter((s) => s.category === category && x.category !== category).map((s) => subAsTool(x, s))),
  };
}

/** Les plus utiles pour le profil affiché (6 au plus) : sélection du registre, complétée dans l'ordre du catalogue. */
export function featuredTools(tools: CatalogTool[], scope: Scope, max = 6): CatalogTool[] {
  const byId = new Map(tools.map((x) => [x.id, x]));
  const picked = FEATURED[scope].map((id) => byId.get(id)).filter((x): x is CatalogTool => !!x && !x.urgent);
  for (const x of tools) {
    if (picked.length >= max) break;
    if (!x.urgent && !picked.includes(x)) picked.push(x);
  }
  return picked.slice(0, max);
}

/** Regroupe par thème visuel (thèmes vides omis) : onglets hub. */
export function groupByTheme(tools: CatalogTool[]) {
  return THEMES.map((th) => ({ ...th, items: tools.filter((x) => x.theme === th.key) })).filter((g) => g.items.length);
}

/** L'espace Communauté du profil affiché (un seul identifiant, hors catégories) ; null s'il n'est pas proposé. */
export const communityEntry = (tools: CatalogTool[]) => tools.find((x) => x.category === 'community') ?? null;

/** Regroupe par catégorie (les 9, dans l'ordre ; catégories vides gardées avec une liste vide). */
export function groupByCategory(tools: CatalogTool[]) {
  return TOOL_CATEGORIES.map((key) => ({ key, title: categoryTitle(key), items: tools.filter((x) => x.category === key) }));
}

/** Recherche par besoin (voir toolSearch.ts) : outils classés par pertinence ; requête vide → tous les outils. */
export function searchTools(tools: CatalogTool[], q: string): CatalogTool[] {
  if (!q.trim()) return tools;
  return searchCatalog(tools, q).results.map((r) => r.tool);
}

// ------------------------------------------------------------------ favoris (identifiant stable de l'outil)
/** Favoris : garde l'ordre choisi, ignore les identifiants qui ne correspondent plus à un outil du profil affiché. */
export function favoriteTools(tools: CatalogTool[], favIds: string[]) {
  const seen = new Set<string>();
  const out: CatalogTool[] = [];
  for (const raw of favIds) {
    const id = canonicalToolId(raw) ?? raw;
    if (seen.has(id)) continue;
    const e = findEntry(tools, id);
    if (e) { seen.add(id); out.push(e); }
  }
  return out;
}
export function toggleFavorite(favIds: string[], id: string) {
  return favIds.includes(id) ? favIds.filter((x) => x !== id) : [...favIds, id];
}

export { migrateToolIds } from './toolFavorites';

// ------------------------------------------------------------------ état utile sur les cartes
/** Données réelles déjà chargées par l'application ; rien n'est inventé pour remplir une carte. */
export interface StatusInput {
  now: Date;
  bottleRunningSince?: string | null;
  reminderDueAt?: string | null;
  lastBottleAt?: string | null;
  openSleepSince?: string | null;
  lastDiaperAt?: string | null;
  tasksTodayLeft?: number;
  nextNight?: { starts_at: string; who: string } | null;
  nextMeTime?: string | null;
  nextAppointment?: string | null;
  unreadNotifications?: number;
  activeReminders?: number;
}
export interface ToolStatus { text: string; active?: boolean; tone?: 'muted' | 'accent' }
export type StatusKey = 'bottleTimer' | 'feeding' | 'sleep' | 'diapers' | 'family' | 'nights' | 'metime' | 'appointments' | 'calendar' | 'notifications' | 'reminders';

/** Quelle carte affiche quel état (par adresse, indépendamment de l'enfant). */
export function statusKeyFor(tool: Pick<CatalogTool, 'href' | 'theme'>): StatusKey | null {
  const h = tool.href;
  if (h.startsWith('/bottle/') && !h.startsWith('/bottle/history') && !h.startsWith('/bottle/scoops')) return 'bottleTimer';
  if (h === '/bottle') return 'bottleTimer';
  if (h === '/(tabs)/track') return tool.theme === 'diapers' ? 'diapers' : 'feeding';
  if (h === '/night') return 'sleep';
  if (h === '/family') return 'family';
  if (h === '/family/nights') return 'nights';
  if (h === '/family/me-time') return 'metime';
  if (h === '/appointments') return 'appointments';
  if (h === '/calendar') return 'calendar';
  if (h === '/notifications') return 'notifications';
  if (h === '/settings/reminders') return 'reminders';
  return null;
}

const ago = (iso: string, now: Date, since = false) => {
  const min = (now.getTime() - Date.parse(iso)) / 60000;
  if (min < 1) return tr('l2.ago.now');
  const m = Math.round(min);
  const k = since ? 'l2.since' : 'l2.ago';
  if (m < 60) return tr(`${k}.min` as const, { m });
  const h = Math.floor(m / 60);
  if (h < 24) return m % 60 ? tr(`${k}.hm` as const, { h, r: String(m % 60).padStart(2, '0') }) : tr(`${k}.h` as const, { h });
  const d = Math.floor(h / 24);
  return d === 1 ? tr('l2.ago.yesterday') : tr(`${k}.days` as const, { count: d });
};
const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const when = (iso: string, now: Date) => {
  const d = new Date(iso);
  const hm = d.toLocaleTimeString(localeTag(), { hour: '2-digit', minute: '2-digit' });
  if (sameDay(d, now)) return tr('l2.tc.at', { hm });
  const tomorrow = new Date(now); tomorrow.setDate(now.getDate() + 1);
  if (sameDay(d, tomorrow)) return tr('l2.tc.tomorrow', { hm });
  return d.toLocaleDateString(localeTag(), { weekday: 'short', day: 'numeric', month: 'short' });
};

export function toolStatuses(i: StatusInput): Partial<Record<StatusKey, ToolStatus>> {
  const { now } = i;
  const out: Partial<Record<StatusKey, ToolStatus>> = {};
  if (i.bottleRunningSince) out.bottleTimer = { text: tr('l2.tc.running', { t: ago(i.bottleRunningSince, now, true) }), active: true, tone: 'accent' };
  else if (i.reminderDueAt) out.bottleTimer = { text: Date.parse(i.reminderDueAt) <= now.getTime() ? tr('l2.tc.dueNow') : tr('l2.tc.reminder', { when: when(i.reminderDueAt, now) }), active: true, tone: 'accent' };
  else if (i.lastBottleAt) out.bottleTimer = { text: tr('l2.tc.last', { t: ago(i.lastBottleAt, now) }) };
  if (i.lastBottleAt) out.feeding = { text: tr('l2.tc.last', { t: ago(i.lastBottleAt, now) }) };
  if (i.openSleepSince) out.sleep = { text: tr('l2.tc.asleep', { t: ago(i.openSleepSince, now, true) }), active: true, tone: 'accent' };
  if (i.lastDiaperAt) out.diapers = { text: tr('l2.tc.change', { t: ago(i.lastDiaperAt, now) }) };
  if (i.tasksTodayLeft != null) out.family = { text: i.tasksTodayLeft ? tr('l2.tc.tasks', { count: i.tasksTodayLeft }) : tr('l2.tc.tasksNone') };
  if (i.nextNight) {
    const tonight = Date.parse(i.nextNight.starts_at) <= now.getTime() || sameDay(new Date(i.nextNight.starts_at), now);
    out.nights = { text: `${i.nextNight.who} · ${when(i.nextNight.starts_at, now)}`, active: tonight };
  }
  if (i.nextMeTime) out.metime = { text: tr('l2.tc.reserved', { when: when(i.nextMeTime, now) }) };
  if (i.nextAppointment) out.appointments = { text: tr('l2.tc.next', { when: when(i.nextAppointment, now) }) };
  const cal = [i.nextAppointment, i.nextNight?.starts_at, i.nextMeTime].filter((x): x is string => !!x).sort()[0];
  if (cal) out.calendar = { text: tr('l2.tc.next', { when: when(cal, now) }) };
  if (i.unreadNotifications) out.notifications = { text: tr('l2.tc.unread', { count: i.unreadNotifications }), tone: 'accent' };
  if (i.activeReminders != null) out.reminders = { text: i.activeReminders ? tr('l2.tc.active', { count: i.activeReminders }) : tr('l2.tc.noReminders') };
  return out;
}

/**
 * Outils hors du profil (23/11/2026, demande de la propriétaire) : tout le catalogue reste VISIBLE, grisé, et
 * déblocable en ajoutant le parcours qui le porte (« Modifier mon parcours »). Rend les outils d'aucun profil du foyer,
 * hors compte et communauté, sans doublon, dans l'ordre des catégories, avec les parcours qui les débloquent.
 */
export function lockedTools(reachable: ReadonlySet<string>): { tool: CatalogTool; scopes: Scope[] }[] {
  const seen = new Map<string, { tool: CatalogTool; scopes: Scope[] }>();
  for (const scope of SCOPES) {
    for (const tool of toolCatalog({ scope, childId: 'x', pregnancyId: 'x', babyId: 'x', postpartum: scope === 'postpartum' })) {
      if (reachable.has(tool.id) || tool.category === 'community' || tool.category === 'account') continue;
      const cur = seen.get(tool.id);
      if (cur) { if (!cur.scopes.includes(scope)) cur.scopes.push(scope); } else seen.set(tool.id, { tool, scopes: [scope] });
    }
  }
  return byCategory([...seen.values()].map((x) => x.tool)).map((tool) => seen.get(tool.id)!);
}
