/**
 * Catalogue « Outils » : tous les outils réels de l'application, rangés par thème.
 * Source unique = `toolCategories` (rangement par parcours, conservé tel quel) + quelques outils
 * qui existaient sans y figurer. Aucun outil n'est retiré : un même écran n'apparaît qu'une fois
 * par thème. Les thèmes donnent à chaque outil sa propre identité visuelle et animée.
 */
import type { IconName } from '@/components/ui';
import type { Journey } from '@/lib/types';
import { mainJourneys, toolCategories } from './journeys';

export type ToolTheme =
  | 'feeding' | 'sleep' | 'diapers' | 'teeth' | 'growth' | 'health' | 'mood' | 'pregnancy' | 'cycle'
  | 'scanner' | 'calendar' | 'tasks' | 'relay' | 'metime' | 'prevention' | 'memories' | 'reminders' | 'resources';

/** Ordre d'affichage et titres des catégories. */
export const THEMES: { key: ToolTheme; title: string; short: string }[] = [
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
export const THEME_TITLE = Object.fromEntries(THEMES.map((x) => [x.key, x.title])) as Record<ToolTheme, string>;

export interface CatalogTool {
  /** Identifiant stable (favoris) : dérivé de l'adresse sans l'identifiant d'enfant. */
  id: string;
  theme: ToolTheme;
  icon: IconName;
  label: string;
  sub?: string;
  href: string;
  /** L'outil a besoin d'un profil enfant : l'adresse mène d'abord à sa création. */
  needsChild?: boolean;
  /** Urgences : jamais retardé par une animation. */
  urgent?: boolean;
}

/** Thème de chaque outil historique, par libellé (les libellés viennent de `toolCategories`). */
const THEME_BY_LABEL: Record<string, ToolTheme> = {
  'Scanner un produit': 'scanner', 'Scanner un aliment': 'scanner', 'Historique et favoris': 'scanner', 'Comparer deux produits': 'scanner',
  'Cycle et période fertile': 'cycle', 'Comprendre mon cycle et mes tests': 'cycle', Tests: 'cycle', 'Mon cycle': 'cycle', Contraception: 'cycle',
  'Contraception d’urgence': 'cycle', 'Préparer une consultation': 'cycle', 'Après la naissance': 'cycle', 'Soutenir ma partenaire': 'cycle',
  Rappels: 'reminders',
  'Articles sur la conception': 'resources', 'Communauté Projet bébé': 'resources', Communauté: 'resources', 'Communauté grossesse': 'resources',
  'Communauté parents': 'resources', Questions: 'resources', 'Préparation à l’accouchement': 'resources', Bibliothèque: 'resources', Rééducation: 'resources',
  'Évolution du bébé': 'pregnancy', 'Mon poids': 'pregnancy', 'Échographies et documents': 'pregnancy', Prénoms: 'pregnancy', Listes: 'pregnancy',
  'Mon corps': 'health', 'Rendez-vous et examens': 'health', 'Rendez-vous': 'health', Documents: 'health', 'Récupération physique': 'health', Urgences: 'health',
  'Mon sommeil': 'sleep', 'Mon propre sommeil': 'sleep', 'Sommeil du bébé': 'sleep',
  'Mon humeur': 'mood', 'Santé mentale': 'mood',
  'Mes enfants': 'growth', 'Mon bébé ou mon enfant': 'growth', Croissance: 'growth',
  'Minuteur biberon': 'feeding', 'Biberons et allaitement': 'feeding', 'Historique des biberons': 'feeding', 'Repas et diversification': 'feeding',
  Couches: 'diapers', Dents: 'teeth',
  'Organisation familiale': 'tasks', 'Agenda familial': 'calendar', 'Journée difficile': 'prevention',
};

interface Ctx { journeys: Journey[]; hasPregnancy: boolean; childId?: string; childCount: number }

/** Outils qui existaient sans figurer dans « Tous mes outils ». */
function extraTools(ctx: Ctx): Omit<CatalogTool, 'id'>[] {
  const m = mainJourneys(ctx.journeys);
  const kid = (path: string) => (ctx.childId ? `/child/${ctx.childId}/${path}` : '/profiles/new?kind=child');
  const out: Omit<CatalogTool, 'id'>[] = [
    { theme: 'scanner', icon: 'slash', label: 'Produits à éviter', sub: 'Allergies, ingrédients signalés', href: '/scanner/avoid' },
    { theme: 'tasks', icon: 'list', label: 'Routines', sub: 'Sac, coucher, courses…', href: '/family/routines' },
    { theme: 'tasks', icon: 'clock', label: 'Historique des tâches', href: '/family/history' },
    { theme: 'relay', icon: 'moon', label: 'Relais de nuit', sub: 'Qui se lève, quelle nuit', href: '/family/nights' },
    { theme: 'metime', icon: 'sun', label: 'Temps pour soi', sub: 'Réserver un moment', href: '/family/me-time' },
    { theme: 'prevention', icon: 'zap', label: 'Mode urgence organisation', sub: 'Gros boutons, l’essentiel', href: '/family/urgent' },
    { theme: 'prevention', icon: 'bar-chart-2', label: 'Bilan de la semaine', sub: 'Par catégorie, sans classement', href: '/family/review' },
    { theme: 'memories', icon: 'book', label: 'Journal et souvenirs', sub: 'Étapes, moments, notes', href: '/journal' },
    { theme: 'reminders', icon: 'inbox', label: 'Notifications', href: '/notifications' },
    { theme: 'reminders', icon: 'layout', label: 'Personnaliser l’accueil', href: '/settings/home' },
    { theme: 'reminders', icon: 'settings', label: 'Réglages', href: '/settings' },
  ];
  if (m.includes('mother') || ctx.childCount > 0) {
    out.push(
      { theme: 'mood', icon: 'sun', label: 'Bien-être de l’enfant', sub: 'Humeur, signaux observés', href: kid('wellbeing') },
      { theme: 'health', icon: 'thermometer', label: 'Suivi santé de l’enfant', sub: 'Température, traitements notés', href: kid('health-tracking') },
      { theme: 'health', icon: 'shield', label: 'Vaccins', sub: 'Carnet à vérifier', href: kid('vaccines') },
    );
  }
  return out;
}

/** Identifiant stable : l'adresse sans identifiant d'enfant, plus le thème. */
export function toolId(theme: ToolTheme, href: string) {
  const clean = href.replace(/\/child\/[^/?]+/, '/child/:id').replace(/\/bottle\/[^/?]+$/, '/bottle/:id').replace(/([?&])child=[^&]+/, '$1child=:id');
  return `${theme}:${clean}`;
}

/** Tous les outils de la personne, dédoublonnés (même écran, même thème), dans l'ordre des thèmes. */
export function toolCatalog(ctx: Ctx): CatalogTool[] {
  const raw: Omit<CatalogTool, 'id'>[] = [];
  for (const c of toolCategories(ctx)) {
    for (const it of c.items) raw.push({ ...it, theme: THEME_BY_LABEL[it.label] ?? 'resources' });
  }
  raw.push(...extraTools(ctx));
  const seen = new Set<string>();
  const out: CatalogTool[] = [];
  for (const it of raw) {
    const id = toolId(it.theme, it.href);
    if (seen.has(id)) continue;
    seen.add(id);
    out.push({ ...it, id, needsChild: it.href.startsWith('/profiles/new'), urgent: it.href === '/emergency' });
  }
  const order = new Map(THEMES.map((x, i) => [x.key, i]));
  return out.map((x, i) => ({ x, i })).sort((a, b) => order.get(a.x.theme)! - order.get(b.x.theme)! || a.i - b.i).map((r) => r.x);
}

/** Regroupe par thème (thèmes vides omis). */
export function groupByTheme(tools: CatalogTool[]) {
  return THEMES.map((th) => ({ ...th, items: tools.filter((x) => x.theme === th.key) })).filter((g) => g.items.length);
}

const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[’']/g, ' ');

/** Recherche tolérante (accents, casse) sur le libellé, la description et la catégorie. */
export function searchTools(tools: CatalogTool[], q: string) {
  const words = fold(q).split(/\s+/).filter(Boolean);
  if (!words.length) return tools;
  return tools.filter((x) => {
    const hay = fold(`${x.label} ${x.sub ?? ''} ${THEME_TITLE[x.theme]}`);
    return words.every((w) => hay.includes(w));
  });
}

/** Favoris : garde l'ordre choisi, ignore les identifiants qui ne correspondent plus à un outil. */
export function favoriteTools(tools: CatalogTool[], favIds: string[]) {
  const byId = new Map(tools.map((x) => [x.id, x]));
  return favIds.map((id) => byId.get(id)).filter((x): x is CatalogTool => !!x);
}
export function toggleFavorite(favIds: string[], id: string) {
  return favIds.includes(id) ? favIds.filter((x) => x !== id) : [...favIds, id];
}

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
  if (h.startsWith('/bottle/') && !h.startsWith('/bottle/history')) return 'bottleTimer';
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

const ago = (iso: string, now: Date) => {
  const min = (now.getTime() - Date.parse(iso)) / 60000;
  if (min < 1) return 'à l’instant';
  const m = Math.round(min);
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h} h${m % 60 ? ` ${String(m % 60).padStart(2, '0')}` : ''}`;
  const d = Math.floor(h / 24);
  return d === 1 ? 'hier' : `il y a ${d} jours`;
};
const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const when = (iso: string, now: Date) => {
  const d = new Date(iso);
  const hm = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  if (sameDay(d, now)) return `à ${hm}`;
  const tomorrow = new Date(now); tomorrow.setDate(now.getDate() + 1);
  if (sameDay(d, tomorrow)) return `demain ${hm}`;
  return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
};

export function toolStatuses(i: StatusInput): Partial<Record<StatusKey, ToolStatus>> {
  const { now } = i;
  const out: Partial<Record<StatusKey, ToolStatus>> = {};
  if (i.bottleRunningSince) out.bottleTimer = { text: `En cours ${ago(i.bottleRunningSince, now).replace('il y a ', 'depuis ')}`, active: true, tone: 'accent' };
  else if (i.reminderDueAt) out.bottleTimer = { text: Date.parse(i.reminderDueAt) <= now.getTime() ? 'C’est l’heure prévue' : `Rappel ${when(i.reminderDueAt, now)}`, active: true, tone: 'accent' };
  else if (i.lastBottleAt) out.bottleTimer = { text: `Dernier ${ago(i.lastBottleAt, now)}` };
  if (i.lastBottleAt) out.feeding = { text: `Dernier ${ago(i.lastBottleAt, now)}` };
  if (i.openSleepSince) out.sleep = { text: `Endormi ${ago(i.openSleepSince, now).replace('il y a ', 'depuis ')}`, active: true, tone: 'accent' };
  if (i.lastDiaperAt) out.diapers = { text: `Change ${ago(i.lastDiaperAt, now)}` };
  if (i.tasksTodayLeft != null) out.family = { text: i.tasksTodayLeft ? `${i.tasksTodayLeft} tâche${i.tasksTodayLeft > 1 ? 's' : ''} aujourd’hui` : 'Rien d’autre aujourd’hui' };
  if (i.nextNight) {
    const tonight = Date.parse(i.nextNight.starts_at) <= now.getTime() || sameDay(new Date(i.nextNight.starts_at), now);
    out.nights = { text: `${i.nextNight.who} · ${when(i.nextNight.starts_at, now)}`, active: tonight };
  }
  if (i.nextMeTime) out.metime = { text: `Réservé ${when(i.nextMeTime, now)}` };
  if (i.nextAppointment) out.appointments = { text: `Prochain ${when(i.nextAppointment, now)}` };
  const cal = [i.nextAppointment, i.nextNight?.starts_at, i.nextMeTime].filter((x): x is string => !!x).sort()[0];
  if (cal) out.calendar = { text: `Prochain ${when(cal, now)}` };
  if (i.unreadNotifications) out.notifications = { text: `${i.unreadNotifications} non lue${i.unreadNotifications > 1 ? 's' : ''}`, tone: 'accent' };
  if (i.activeReminders != null) out.reminders = { text: i.activeReminders ? `${i.activeReminders} actif${i.activeReminders > 1 ? 's' : ''}` : 'Aucun rappel actif' };
  return out;
}
