/**
 * Catalogue « Outils » : tous les outils réels de l'application, rangés par thème.
 * Source unique = `toolCategories` (rangement par parcours, conservé tel quel) + quelques outils
 * qui existaient sans y figurer. Aucun outil n'est retiré : un même écran n'apparaît qu'une fois
 * par thème. Les thèmes donnent à chaque outil sa propre identité visuelle et animée.
 */
import type { IconName } from '@/components/ui';
import { localeTag, t as tr, tMaybe } from '@/i18n';
import { localized } from '@/i18n/localized';
import { toolLabelKey, toolsFor, toolSubKey, type ScopeCtx } from '@/lib/journeys/tools';

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
export const THEMES: { key: ToolTheme; title: string; short: string }[] = localized(THEMES_FR, THEMES_EN);
const themeTitles = (l: typeof THEMES_FR) => Object.fromEntries(l.map((x) => [x.key, x.title])) as Record<ToolTheme, string>;
export const THEME_TITLE = localized(themeTitles(THEMES_FR), themeTitles(THEMES_EN));

export interface CatalogTool {
  /** Identifiant stable (favoris) : dérivé de l'adresse sans l'identifiant d'enfant. */
  id: string;
  /** Identifiant de l'outil dans le registre central. */
  key: string;
  theme: ToolTheme;
  icon: IconName;
  label: string;
  sub?: string;
  href: string;
  /** Outil « pour tout le monde », adapté au profil affiché. */
  universal?: boolean;
  /** Urgences : jamais retardé par une animation. */
  urgent?: boolean;
}

/** Identifiant stable : l'adresse sans identifiant d'enfant, plus le thème. */
export function toolId(theme: ToolTheme, href: string) {
  const clean = href.replace(/\/child\/[^/?]+/, '/child/:id').replace(/\/bottle\/[^/?]+$/, '/bottle/:id').replace(/([?&])child=[^&]+/, '$1child=:id');
  return `${theme}:${clean}`;
}

/**
 * Outils AUTORISÉS pour le profil affiché, depuis le registre central (src/lib/journeys/tools.ts),
 * dédoublonnés et rangés dans l'ordre des thèmes. Libellés dans la langue active.
 */
export function toolCatalog(ctx: ScopeCtx): CatalogTool[] {
  const seen = new Set<string>();
  const out: CatalogTool[] = [];
  for (const it of toolsFor(ctx)) {
    const id = toolId(it.theme, it.href);
    if (seen.has(id)) continue;
    seen.add(id);
    const sub = tMaybe(toolSubKey(it.id));
    out.push({ id, key: it.id, theme: it.theme, icon: it.icon, label: tr(toolLabelKey(it.id)), sub: sub || undefined, href: it.href, universal: it.universal, urgent: it.urgent });
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
