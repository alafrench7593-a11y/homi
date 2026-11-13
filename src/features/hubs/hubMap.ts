/**
 * HOMI — navigation à 5 onglets : Accueil · Santé · Bébé · Famille · Communauté.
 *
 * Répartition DATA-DRIVEN des outils du catalogue (`toolCatalog`) entre les trois onglets « hub » :
 *  - Santé  : cycle, grossesse, santé et rendez-vous, humeur, repas et sommeil de la mère + lectures et assistant (Questions)
 *  - Bébé   : repas, sommeil, changes, dents, croissance, scanner + résumés et tutos (Suivi du jour en accès direct)
 *  - Famille: agenda, tâches, relais de nuit, temps pour soi, surcharge, souvenirs, rappels + sorties, papiers, parent solo
 * Le thème « resources » (Questions, lectures et communauté) est réparti outil par outil : un outil de ce thème
 * qui n'est pas listé ici tombe dans Famille (jamais perdu). Tout thème inconnu tombe aussi dans Famille.
 * Garde-fou : `src/__tests__/homiNavigation.test.ts` (chaque outil de chaque parcours a un onglet).
 *
 * Les anciens onglets (agenda, track, tools, ask, moi, profile) restent des routes valides, hors de la barre ;
 * quand on y est, l'onglet « parent » reste allumé (ACTIVE_ALIAS).
 */
import type { IconName } from '@/components/ui';
import type { TKey } from '@/i18n';
import type { CatalogTool, ToolTheme } from '@/lib/domain/toolCatalog';
import { TOOL_BY_ID, type Scope } from '@/lib/journeys/tools';

export type HubKey = 'health' | 'baby' | 'family';
export const HUB_KEYS: HubKey[] = ['health', 'baby', 'family'];

/** Thèmes affichés par chaque hub, dans l'ordre d'affichage. */
export const HUB_THEMES: Record<HubKey, ToolTheme[]> = {
  // repas et sommeil de la mère (grossesse, cycle, « moi ») : rangés dans Santé, pas dans Bébé
  health: ['health', 'cycle', 'pregnancy', 'mood', 'feeding', 'sleep', 'resources'],
  baby: ['feeding', 'sleep', 'diapers', 'teeth', 'growth', 'scanner', 'resources'],
  family: ['calendar', 'tasks', 'relay', 'metime', 'prevention', 'memories', 'reminders', 'resources'],
};

/** Hub principal de chaque thème (hors « resources », rangé outil par outil). */
const THEME_HUB: Partial<Record<ToolTheme, HubKey>> = {
  health: 'health', cycle: 'health', pregnancy: 'health', mood: 'health',
  feeding: 'baby', sleep: 'baby', diapers: 'baby', teeth: 'baby', growth: 'baby', scanner: 'baby',
  calendar: 'family', tasks: 'family', relay: 'family', metime: 'family', prevention: 'family', memories: 'family', reminders: 'family',
};

/** Portées « adulte seulement » : un outil repas/sommeil réservé à ces portées concerne la mère, pas l'enfant. */
const ME_AND_PREGNANCY: Scope[] = ['avoid', 'ttc', 'cycle', 'none', 'pregnancy'];
/** Sommeil : le post-partum compte comme adulte (sommeil de la mère) ; repas : non (allaitement, biberons = bébé). */
const ADULT_ONLY: Partial<Record<ToolTheme, Set<Scope>>> = { sleep: new Set([...ME_AND_PREGNANCY, 'postpartum']), feeding: new Set(ME_AND_PREGNANCY) };

/** Thème « resources » : rangement outil par outil (clé du registre central). */
export const RESOURCE_HUB: Record<string, HubKey> = {
  ask: 'health', local_ai: 'health', library: 'health', sources: 'health', official_videos: 'health',
  cycle_guides: 'health', ttc_articles: 'health', preg_articles: 'health', preg_intimacy: 'health',
  summary: 'baby', video_tutos: 'baby',
  nearby: 'family', community: 'family', solo_parent: 'family', family_papers: 'family', guide_work: 'family',
};

/** Onglet hub d'un outil du catalogue (toujours défini : aucun outil sans onglet). */
export function hubOf(tool: Pick<CatalogTool, 'theme' | 'key'>): HubKey {
  if (tool.theme === 'resources') return RESOURCE_HUB[tool.key] ?? 'family';
  const scopes = TOOL_BY_ID[tool.key]?.scopes;
  const adult = ADULT_ONLY[tool.theme];
  if (adult && scopes?.length && scopes.every((x) => adult.has(x))) return 'health';
  return THEME_HUB[tool.theme] ?? 'family';
}

/** Outils d'un hub, dans l'ordre du catalogue. */
export function hubTools(catalog: CatalogTool[], hub: HubKey): CatalogTool[] {
  return catalog.filter((x) => hubOf(x) === hub);
}

/** Regroupe les outils d'un hub par thème, dans l'ordre du hub (thèmes vides omis). */
export function hubGroups<T extends { theme: ToolTheme }>(tools: T[], hub: HubKey): { theme: ToolTheme; items: T[] }[] {
  return HUB_THEMES[hub].map((theme) => ({ theme, items: tools.filter((x) => x.theme === theme) })).filter((g) => g.items.length);
}

/** Icône d'en-tête de chaque thème (glyphe de section). */
export const THEME_ICON: Record<ToolTheme, IconName> = {
  feeding: 'coffee', sleep: 'moon', diapers: 'wind', teeth: 'circle', growth: 'trending-up', health: 'activity', mood: 'smile', pregnancy: 'heart',
  cycle: 'refresh-cw', scanner: 'maximize', calendar: 'calendar', tasks: 'check-square', relay: 'moon', metime: 'sun', prevention: 'feather',
  memories: 'book', reminders: 'bell', resources: 'book-open',
};

// ------------------------------------------------------------------ barre d'onglets
export interface NavTab {
  /** Nom de la route dans src/app/(tabs). */
  name: 'index' | 'health' | 'baby' | 'household' | 'community';
  icon: IconName;
  label: TKey;
  hub?: HubKey;
}
/** Les 5 onglets visibles, dans l'ordre. « Famille » = route `household` (`/family` est déjà l'organisation du foyer). */
export const NAV_TABS: NavTab[] = [
  { name: 'index', icon: 'home', label: 'tab.home' },
  { name: 'health', icon: 'heart', label: 'nav.tab.health', hub: 'health' },
  { name: 'baby', icon: 'smile', label: 'nav.tab.baby', hub: 'baby' },
  { name: 'household', icon: 'users', label: 'nav.tab.family', hub: 'family' },
  { name: 'community', icon: 'message-circle', label: 'tab.community' },
];
export const HUB_ROUTE: Record<HubKey, NavTab['name']> = { health: 'health', baby: 'baby', family: 'household' };

/** Routes d'onglet hors de la barre (liens profonds, tests) : toujours valides. */
export const HIDDEN_TAB_ROUTES = ['agenda', 'track', 'tools', 'ask', 'moi', 'profile'] as const;

// ------------------------------------------------------------------ géométrie de la barre (pure, testée)
/** Libellés : 12 px de référence, 11 px minimum à 320 px de large (10 px seulement pour une langue très longue). */
export const TAB_LABEL_MAX = 12;
export const TAB_LABEL_MIN = 11;
const TAB_LABEL_FLOOR = 10;
/** Largeur minimale d'un onglet (cible tactile 44 × 64 px, recommandation iOS) et marge autour du libellé. */
export const TAB_MIN_W = 44;
const TAB_LABEL_PAD = 4;
/** Hauteur de la capsule. */
export const TAB_BAR_H = 64;

/**
 * Ligne du bas : marges latérales, bouton d'action rond (à droite de la capsule, même ligne) et capsule des onglets
 * (`pad` : marge intérieure, pour que les libellés des extrémités ne touchent pas l'arrondi).
 * Petit écran (< 360 px) : marges et bouton réduits pour laisser la place aux libellés.
 */
export function dockGeometry(width: number) {
  const narrow = width < 360;
  const side = narrow ? 4 : 12;
  const action = narrow ? 44 : 56;
  const gap = narrow ? 5 : 8;
  const pad = narrow ? 4 : 10;
  const row = Math.min(width - side * 2, 600);
  const barW = row - action - gap;
  return { side, action, gap, pad, row, barW, inner: barW - pad * 2 };
}

/**
 * Largeur de chaque onglet et taille commune des libellés : chaque onglet reçoit la largeur de son libellé (+ marge,
 * au moins TAB_MIN_W), le reste est partagé à parts égales ; la taille descend par quarts de pixel seulement si la
 * somme dépasse. `natural` = largeurs mesurées (ou estimées) des libellés à TAB_LABEL_MAX. Jamais d'ellipse en français.
 */
export function tabLayout(inner: number, natural: number[]): { fontSize: number; widths: number[] } {
  const n = Math.max(natural.length, 1);
  const base = (size: number) => natural.map((w) => Math.max(TAB_MIN_W, (w * size) / TAB_LABEL_MAX + TAB_LABEL_PAD));
  const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);
  let size = TAB_LABEL_MAX;
  while (size > TAB_LABEL_FLOOR && sum(base(size)) > inner) size -= 0.25;
  let b = base(size);
  // Langue très longue (allemand…) : au plancher, on renonce d'abord à la largeur minimale (les onglets restent
  // contigus : la cible tactile garde 64 px de haut), puis, en dernier recours, on réduit tout proportionnellement
  if (sum(b) > inner) b = natural.map((w) => (w * size) / TAB_LABEL_MAX + TAB_LABEL_PAD);
  if (sum(b) > inner) { const k = inner / sum(b); b = b.map((w) => w * k); }
  const extra = Math.max(0, inner - sum(b)) / n;
  return { fontSize: size, widths: b.map((w) => w + extra) };
}

/** Estimation prudente de la largeur d'un libellé avant la première mesure (Manrope gras mesuré : 0,57 à 0,65 em par caractère ; 0,66 retenu). */
export const estimateLabelWidth = (label: string, size = TAB_LABEL_MAX) => label.length * size * 0.66;

/** Onglet allumé quand on est sur une ancienne route d'onglet. */
export const ACTIVE_ALIAS: Record<string, NavTab['name']> = { ask: 'health', track: 'baby', agenda: 'household', tools: 'index', moi: 'community' };

/** Accès directs en tête de chaque hub : les pages des anciens onglets. */
export const HUB_ENTRIES: Record<HubKey, { href: string; icon: IconName; title: TKey; sub: TKey; testID: string }[]> = {
  health: [{ href: '/ask', icon: 'message-circle', title: 'nav.hub.ask', sub: 'nav.hub.askSub', testID: 'hub-entry-ask' }],
  baby: [{ href: '/track', icon: 'activity', title: 'nav.hub.track', sub: 'nav.hub.trackSub', testID: 'hub-entry-track' }],
  family: [
    { href: '/family/missions', icon: 'send', title: 'nav.hub.missions', sub: 'nav.hub.missionsSub', testID: 'hub-entry-missions' },
    { href: '/agenda', icon: 'calendar', title: 'nav.hub.agenda', sub: 'nav.hub.agendaSub', testID: 'hub-entry-agenda' },
  ],
};
