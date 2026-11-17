/**
 * HOMI — navigation (refonte du 17/11/2026) : Aujourd'hui · Moi · [action centrale] · Enfant · Famille.
 *
 * Répartition DATA-DRIVEN des outils du catalogue (`toolCatalog`) entre les trois onglets « hub » :
 *  - Santé  : cycle, grossesse, santé et rendez-vous, humeur, repas et sommeil de la mère + lectures et assistant (Questions)
 *  - Bébé   : repas, sommeil, changes, dents, croissance, scanner + résumés et tutos (Suivi du jour en accès direct)
 *  - Famille: agenda, tâches, relais de nuit, temps pour soi, surcharge, souvenirs, rappels + sorties, papiers, parent solo
 * Le thème « resources » (Questions, lectures et communauté) est réparti outil par outil : un outil de ce thème
 * qui n'est pas listé ici tombe dans Famille (jamais perdu). Tout thème inconnu tombe aussi dans Famille.
 * Garde-fou : `src/__tests__/homiNavigation.test.ts` (chaque outil de chaque parcours a un onglet).
 *
 * Les routes d'onglet hors barre (community, agenda, track, tools, ask, moi, profile) restent des routes valides, hors de la barre ;
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
  name: 'index' | 'health' | 'baby' | 'household';
  icon: IconName;
  label: TKey;
  hub?: HubKey;
}
/**
 * Refonte du 17/11/2026 — 5 besoins : Aujourd'hui · Moi · [action centrale] · Enfant · Famille ; « Outils » est une
 * entrée fixe en tête d'Aujourd'hui et dans l'action centrale ; la Communauté s'ouvre par le bouton en haut à droite
 * des écrans d'onglet. Structure retenue après rendu à 320 et 390 pt : 4 onglets + bouton central (5 onglets + bouton
 * centré ne laissaient que 128 pt pour trois onglets à droite du bouton à 320 pt : la barre passait en icônes seules).
 * « Famille » = route `household` (`/family` est déjà l'organisation du foyer). Le bouton central se place après
 * `NAV_CENTER_AFTER` onglets.
 */
export const NAV_TABS: NavTab[] = [
  { name: 'index', icon: 'sun', label: 'nav.tab.today' },
  { name: 'health', icon: 'user', label: 'nav.tab.me', hub: 'health' },
  { name: 'baby', icon: 'smile', label: 'nav.tab.child', hub: 'baby' },
  { name: 'household', icon: 'users', label: 'nav.tab.family', hub: 'family' },
];
export const NAV_CENTER_AFTER = 2;
export const HUB_ROUTE: Record<HubKey, NavTab['name']> = { health: 'health', baby: 'baby', family: 'household' };

/**
 * L'onglet « Enfant » s'adapte au foyer : un enfant suivi → « Enfant » ; une grossesse en cours sans enfant →
 * « Grossesse » ; ni l'un ni l'autre → l'onglet propose d'ajouter un enfant ou une grossesse (jamais un cul-de-sac).
 */
export type ChildTabMode = 'child' | 'pregnancy' | 'empty';
export function childTabMode(o: { children: number; pregnancy: boolean }): ChildTabMode {
  return o.children > 0 ? 'child' : o.pregnancy ? 'pregnancy' : 'empty';
}
export const CHILD_TAB: Record<ChildTabMode, { label: TKey; icon: IconName }> = {
  child: { label: 'nav.tab.child', icon: 'smile' },
  pregnancy: { label: 'nav.tab.pregnancy', icon: 'heart' },
  empty: { label: 'nav.tab.child', icon: 'smile' },
};
/** Libellés possibles d'un onglet (l'onglet Enfant en a deux) : la barre réserve la place du plus long. */
export const tabLabelKeys = (tab: NavTab): TKey[] => (tab.name === 'baby' ? ['nav.tab.child', 'nav.tab.pregnancy'] : [tab.label]);

/** Routes d'onglet hors de la barre (liens profonds, tests) : toujours valides. */
export const HIDDEN_TAB_ROUTES = ['community', 'agenda', 'track', 'tools', 'ask', 'moi', 'profile'] as const;

// ------------------------------------------------------------------ géométrie de la barre (pure, testée)
/** Libellés : 12 px de référence, 11 px minimum à 320 px de large (10 px seulement pour une langue très longue). */
export const TAB_LABEL_MAX = 12;
export const TAB_LABEL_MIN = 11;
const TAB_LABEL_FLOOR = 10;
/** Largeur minimale d'un onglet (cible tactile 44 × 64 px, recommandation iOS) et marge autour du libellé. */
export const TAB_MIN_W = 44;
const TAB_LABEL_PAD = 4;
/** Hauteur de la barre (v5 : barre pleine largeur, posée en bas, fine ligne de séparation). */
export const TAB_BAR_H = 60;

/**
 * Barre pleine largeur, bouton d'action AU CENTRE (entre le 2e et le 3e onglet), à portée du pouce des deux mains.
 * `pad` : marge intérieure gauche et droite ; `gap` : écart de part et d'autre du bouton ; `inner` : place totale des
 * onglets. Le bouton fait 52 pt (48 pt sous 360 pt de large).
 */
export function dockGeometry(width: number) {
  const narrow = width < 360;
  const side = 0;
  const action = narrow ? 48 : 52;
  const gap = narrow ? 4 : 8;
  const pad = narrow ? 4 : 8;
  const row = Math.min(width, 600);
  const barW = row;
  return { side, action, gap, pad, row, barW, inner: barW - pad * 2 - action - gap * 2 };
}

/**
 * Largeur de chaque onglet et taille commune des libellés : chaque onglet reçoit la largeur de son libellé (+ marge,
 * au moins TAB_MIN_W), le reste est partagé à parts égales ; la taille descend par quarts de pixel seulement si la
 * somme dépasse. `natural` = largeurs mesurées (ou estimées) des libellés à TAB_LABEL_MAX (taille de texte du
 * téléphone comprise). Jamais d'ellipse, jamais d'onglet de moins de TAB_MIN_W.
 *
 * Seuil (audit 09, décision du 13/11/2026) : si, à la taille plancher (10 px), les cinq libellés ne tiennent pas
 * avec 44 px par onglet (320 px de large + texte agrandi, langue longue sur petit écran), la barre passe en
 * ICÔNES SEULES (`iconsOnly`) : onglets de largeur égale (≥ 44 px), libellés masqués à l'écran mais toujours
 * annoncés (nom accessible = libellé complet). Plutôt qu'un libellé abrégé (« Commu. ») ou une cible de 35 px.
 */
export function tabLayout(inner: number, natural: number[]): { fontSize: number; widths: number[]; iconsOnly: boolean } {
  const n = Math.max(natural.length, 1);
  const base = (size: number) => natural.map((w) => Math.max(TAB_MIN_W, (w * size) / TAB_LABEL_MAX + TAB_LABEL_PAD));
  const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);
  let size = TAB_LABEL_MAX;
  while (size > TAB_LABEL_FLOOR && sum(base(size)) > inner) size -= 0.25;
  const b = base(size);
  if (sum(b) > inner) return { fontSize: size, widths: natural.map(() => inner / n), iconsOnly: true };
  const extra = Math.max(0, inner - sum(b)) / n;
  return { fontSize: size, widths: b.map((w) => w + extra), iconsOnly: false };
}

/**
 * Barre à action centrale : le bouton doit rester EXACTEMENT au milieu de l'écran. Chaque moitié (onglets de gauche,
 * onglets de droite) reçoit la même largeur et répartit ses onglets avec `tabLayout` ; la taille des libellés est
 * commune (la plus petite des deux moitiés) ; si une moitié ne peut pas afficher ses libellés, toute la barre passe en
 * icônes seules.
 */
export function dockLayout(inner: number, natural: number[], centerAfter: number = NAV_CENTER_AFTER): { fontSize: number; widths: number[]; iconsOnly: boolean } {
  const half = inner / 2;
  const left = natural.slice(0, centerAfter);
  const right = natural.slice(centerAfter);
  const l = tabLayout(half, left);
  const r = tabLayout(half, right);
  const fontSize = Math.min(l.fontSize, r.fontSize);
  if (l.iconsOnly || r.iconsOnly) return { fontSize, iconsOnly: true, widths: [...left.map(() => half / Math.max(left.length, 1)), ...right.map(() => half / Math.max(right.length, 1))] };
  return { fontSize, iconsOnly: false, widths: [...l.widths, ...r.widths] };
}

/** Estimation prudente de la largeur d'un libellé avant la première mesure (Manrope gras mesuré : 0,57 à 0,65 em par caractère ; 0,66 retenu). */
export const estimateLabelWidth = (label: string, size = TAB_LABEL_MAX) => label.length * size * 0.66;

/** Onglet allumé quand on est sur une ancienne route d'onglet. */
export const ACTIVE_ALIAS: Record<string, NavTab['name']> = { ask: 'health', track: 'baby', agenda: 'household', tools: 'index', community: 'index', moi: 'index' };

/** Accès directs en tête de chaque hub : les pages des anciens onglets. */
export const HUB_ENTRIES: Record<HubKey, { href: string; icon: IconName; title: TKey; sub: TKey; testID: string }[]> = {
  health: [{ href: '/ask', icon: 'message-circle', title: 'nav.hub.ask', sub: 'nav.hub.askSub', testID: 'hub-entry-ask' }],
  baby: [
    { href: '/track', icon: 'activity', title: 'nav.hub.track', sub: 'nav.hub.trackSub', testID: 'hub-entry-track' },
    // Couches, lingettes, lait : les stocks « bébé » du foyer (15/11/2026)
    { href: '/family/stocks/baby', icon: 'package', title: 'nav.hub.babyStocks', sub: 'nav.hub.babyStocksSub', testID: 'hub-entry-baby-stocks' },
  ],
  family: [
    { href: '/family/missions', icon: 'send', title: 'nav.hub.missions', sub: 'nav.hub.missionsSub', testID: 'hub-entry-missions' },
    // Courses et stocks du foyer (15/11/2026)
    { href: '/meals/shopping', icon: 'shopping-cart', title: 'nav.hub.shopping', sub: 'nav.hub.shoppingSub', testID: 'hub-entry-shopping' },
    { href: '/family/stocks', icon: 'package', title: 'nav.hub.stocks', sub: 'nav.hub.stocksSub', testID: 'hub-entry-stocks' },
    { href: '/agenda', icon: 'calendar', title: 'nav.hub.agenda', sub: 'nav.hub.agendaSub', testID: 'hub-entry-agenda' },
  ],
};
