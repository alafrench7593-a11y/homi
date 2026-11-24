/**
 * Visite guidée DANS l'application (moteur pur, testé : src/__tests__/tour.test.ts).
 *
 * Sept étapes déclaratives, chacune sur l'écran RÉEL : l'écran où elle s'affiche (`screens`), l'élément réel qu'elle
 * désigne par écran (`anchors`, ancres posées dans les vrais composants par `useTourAnchor`), l'adresse où l'emmener
 * si elle s'est éloignée (`goTo`), et la condition d'avancée — un ÉVÉNEMENT réel de l'application (profil changé dans
 * le magasin, outil ou catégorie ouvert, favori modifié, formulaire refermé, navigation vers l'agenda, éditeur de
 * l'accueil ouvert). Seule la première étape (« Découvrir l'accueil ») avance au bouton « Suivant ».
 *
 * Progression PAR COMPTE, sur l'appareil (`TourProgress`) : statut, étape courante, étapes faites / passées, favori
 * ajouté pendant la visite (proposé au retrait à la fin), carte de reprise masquée.
 */

export type StepId = 'home' | 'profile' | 'tools' | 'quick' | 'favorite' | 'agenda' | 'customize';
export type GestureHint = 'tap' | 'swipe' | 'drag';

export type TourEvent =
  | { type: 'route'; path: string }
  | { type: 'profileChanged' }
  | { type: 'toolOpened'; id: string }
  | { type: 'categoryOpened'; id: string }
  | { type: 'favoriteChanged'; id: string; on: boolean }
  | { type: 'quickChosen'; key: string }
  | { type: 'quickFormClosed' }
  | { type: 'editorOpened' };

export interface TourStep {
  id: StepId;
  /** Écrans où la bulle se pose sur l'élément (motif exact, ou préfixe terminé par `/*`). */
  screens: string[];
  /** Ancres désignées, par écran (la première trouvée et visible l'emporte ; plusieurs = rectangle englobant). */
  anchors: Record<string, string[]>;
  /** Où emmener la personne si elle est ailleurs (« Y aller »). */
  goTo: string;
  /** `manual` : bouton « Suivant » ; sinon l'événement réel qui fait avancer. */
  advance: 'manual' | ((e: TourEvent) => boolean);
  gesture?: GestureHint;
  /** Zones qui restent TOUCHABLES (assombries) en plus de l'élément : le geste demandé s'y fait (glisser sur l'accueil). */
  touch?: string[];
  /** Étape qui ENREGISTRE quelque chose : consentement explicite, exercice proposé. */
  consent?: boolean;
}

/** Routes des onglets (pages où vivent la barre et le bouton central). */
export const TAB_PATHS = ['/', '/health', '/baby', '/household', '/tools', '/community', '/agenda', '/track', '/ask', '/moi', '/profile'];
export const isTabPath = (p: string) => TAB_PATHS.includes(p);
/** Sur le web, l'accueil de l'application s'affiche à « /app » (« / » est la page publique) : c'est le même écran que « / ». */
export const tourPath = (p: string) => (p === '/app' ? '/' : p);

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'home', screens: ['/'], goTo: '/',
    anchors: { '/': ['home-next', 'home-quick'] },
    advance: 'manual',
  },
  {
    id: 'profile', screens: ['/'], goTo: '/', gesture: 'swipe', touch: ['profile-swipe'],
    anchors: { '/': ['profile-switcher'] },
    advance: (e) => e.type === 'profileChanged',
  },
  {
    id: 'tools', screens: ['/', '/tools'], goTo: '/tools', gesture: 'tap',
    anchors: { '/': ['tools-entry'], '/tools': ['tools-search', 'tools-results'] },
    advance: (e) => e.type === 'toolOpened' || e.type === 'categoryOpened',
  },
  {
    id: 'quick', screens: TAB_PATHS, goTo: '/', gesture: 'tap', consent: true,
    anchors: Object.fromEntries(TAB_PATHS.map((p) => [p, ['quick-add']])),
    advance: (e) => e.type === 'quickFormClosed',
  },
  {
    id: 'favorite', screens: ['/tools/*', '/tools'], goTo: '/tools/family', gesture: 'tap',
    anchors: { '/tools/*': ['tool-star'], '/tools': ['tool-star'] },
    advance: (e) => e.type === 'favoriteChanged',
  },
  {
    id: 'agenda', screens: ['/'], goTo: '/', gesture: 'tap',
    anchors: { '/': ['agenda-link'] },
    advance: (e) => e.type === 'route' && e.path === '/calendar',
  },
  {
    id: 'customize', screens: ['/'], goTo: '/', gesture: 'tap',
    anchors: { '/': ['home-customize'] },
    advance: (e) => e.type === 'editorOpened',
  },
];
export const TOUR_LENGTH = TOUR_STEPS.length;

export const matchPath = (pattern: string, path: string) =>
  pattern.endsWith('/*') ? path.startsWith(pattern.slice(0, -1)) && path.length > pattern.length - 1 : pattern === path;
/** L'étape s'affiche-t-elle sur cet écran ? */
export const stepOnScreen = (step: TourStep, path: string) => step.screens.some((s) => matchPath(s, path));
/** Ancres de l'étape pour cet écran (motif le plus précis d'abord : adresse exacte avant préfixe). */
export function stepAnchors(step: TourStep, path: string): string[] {
  const keys = Object.keys(step.anchors).sort((a, b) => Number(a.endsWith('/*')) - Number(b.endsWith('/*')));
  const k = keys.find((x) => matchPath(x, path));
  return k ? step.anchors[k] : [];
}

// ------------------------------------------------------------------------------------------------ progression
export type TourStatus = 'new' | 'offered' | 'running' | 'paused' | 'done' | 'skipped';
export interface TourProgress {
  status: TourStatus;
  /** Étape courante (0 à 6). */
  step: number;
  completed: StepId[];
  skipped: StepId[];
  /** Outil mis en favori PENDANT la visite (proposé au retrait à la fin), sinon null. */
  favoriteAdded: string | null;
  /** Carte « Reprendre la visite » masquée par la personne. */
  resumeHidden: boolean;
  updatedAt: string;
}
export const freshProgress = (): TourProgress => ({ status: 'new', step: 0, completed: [], skipped: [], favoriteAdded: null, resumeHidden: false, updatedAt: '' });

export type TourAction =
  | { type: 'start' }
  | { type: 'event'; event: TourEvent }
  | { type: 'next' }
  | { type: 'skipStep' }
  | { type: 'back' }
  /** `auto` : pause décidée par l'application (urgence, écran verrouillé, sortie de l'étape) — un « masquer » reste respecté. */
  | { type: 'later'; auto?: boolean }
  | { type: 'quit' }
  | { type: 'offer' }
  | { type: 'hideResume' }
  | { type: 'forgetFavorite' };

const stamp = (p: TourProgress): TourProgress => ({ ...p, updatedAt: new Date().toISOString() });
const uniq = <T,>(l: T[]) => [...new Set(l)];

/** Étape suivante (ou fin de visite). */
function forward(p: TourProgress, mark: 'completed' | 'skipped'): TourProgress {
  const id = TOUR_STEPS[p.step]?.id;
  const marked = id ? { ...p, [mark]: uniq([...p[mark], id]) } : p;
  if (p.step + 1 >= TOUR_LENGTH) return { ...marked, status: 'done', step: TOUR_LENGTH - 1 };
  return { ...marked, step: p.step + 1 };
}

/** Réducteur unique : toute la logique d'enchaînement, sans effet de bord. */
export function tourReducer(p: TourProgress, a: TourAction): TourProgress {
  switch (a.type) {
    case 'start':
      // « Plus tard » : on reprend à l'étape en cours ; sinon on recommence au début
      if (p.status === 'paused' || p.status === 'running') return stamp({ ...p, status: 'running', resumeHidden: false });
      return stamp({ ...freshProgress(), status: 'running' });
    case 'offer':
      return p.status === 'new' ? stamp({ ...p, status: 'offered' }) : p;
    case 'event': {
      if (p.status !== 'running') return p;
      const e = a.event;
      const fav = e.type === 'favoriteChanged' ? { ...p, favoriteAdded: e.on ? e.id : p.favoriteAdded === e.id ? null : p.favoriteAdded } : p;
      const step = TOUR_STEPS[p.step];
      if (!step || step.advance === 'manual' || !step.advance(e)) return fav === p ? p : stamp(fav);
      return stamp(forward(fav, 'completed'));
    }
    case 'next':
      return p.status === 'running' ? stamp(forward(p, 'completed')) : p;
    case 'skipStep':
      return p.status === 'running' ? stamp(forward(p, 'skipped')) : p;
    case 'back':
      return p.status === 'running' && p.step > 0 ? stamp({ ...p, step: p.step - 1 }) : p;
    case 'later':
      return p.status === 'running' || p.status === 'offered' ? stamp({ ...p, status: 'paused', resumeHidden: a.auto ? p.resumeHidden : false }) : p;
    case 'quit':
      return p.status === 'done' ? p : stamp({ ...p, status: 'skipped' });
    case 'hideResume':
      return stamp({ ...p, resumeHidden: true });
    case 'forgetFavorite':
      return stamp({ ...p, favoriteAdded: null });
  }
}

// ------------------------------------------------------------------------------------------------ quand proposer
export interface OfferCtx { caregiverOnly: boolean; emergency: boolean }
/** Proposition de fin d'onboarding (« Faire la visite (2 min) ») : jamais à une nounou ni pendant une urgence. */
export const canOfferTour = (c: OfferCtx) => !c.caregiverOnly && !c.emergency;
/** Carte discrète de l'accueil : visite interrompue (ou proposée puis remise), non masquée. */
export const showResumeCard = (p: TourProgress, c: OfferCtx) =>
  canOfferTour(c) && (p.status === 'paused' || p.status === 'offered') && !p.resumeHidden;
/** Superposition active : visite en cours, hors urgence, jamais pour une nounou. */
export const overlayActive = (p: TourProgress, c: OfferCtx) => canOfferTour(c) && p.status === 'running';

/** Écrans d'urgence : ni visite, ni aide contextuelle. */
export const isEmergencyPath = (path: string) => path === '/emergency' || path.startsWith('/emergency/');

/** Fenêtre après le lancement d'un appel d'urgence pendant laquelle rien n'est proposé (15 min). */
export const EMERGENCY_QUIET_MS = 15 * 60 * 1000;
export const emergencyRecent = (lastCallAt: number | null, now: number) => lastCallAt != null && now - lastCallAt < EMERGENCY_QUIET_MS;

// ------------------------------------------------------------------------------------------------ aides contextuelles
/** Aide de première ouverture d'un outil : une fois par outil, jamais sur une urgence, désactivable. */
export function shouldHint(o: { id: string; urgent?: boolean; seen: string[]; off: boolean; touring: boolean; emergency: boolean }) {
  return !o.off && !o.urgent && !o.touring && !o.emergency && !o.seen.includes(o.id);
}

// ------------------------------------------------------------------------------------------------ géométrie
export interface Rect { x: number; y: number; width: number; height: number }
export const unionRect = (rects: Rect[]): Rect | null => {
  if (!rects.length) return null;
  const x = Math.min(...rects.map((r) => r.x));
  const y = Math.min(...rects.map((r) => r.y));
  const r = Math.max(...rects.map((q) => q.x + q.width));
  const b = Math.max(...rects.map((q) => q.y + q.height));
  return { x, y, width: r - x, height: b - y };
};

/** L'élément est-il assez visible pour être désigné (au moins 24 pt dans la zone utile) ? */
export function rectVisible(r: Rect, view: { top: number; bottom: number; width: number }) {
  if (r.width <= 0 || r.height <= 0) return false;
  const top = Math.max(r.y, view.top);
  const bottom = Math.min(r.y + r.height, view.bottom);
  return bottom - top >= Math.min(24, r.height) && r.x < view.width && r.x + r.width > 0;
}

/**
 * Place de la bulle : sous l'élément s'il y a la place, sinon au-dessus, sinon le côté le plus grand (la bulle défile
 * alors). Jamais SUR l'élément désigné : c'est lui qu'on doit toucher.
 */
export function bubblePlacement(o: { hole: Rect | null; bubbleH: number; top: number; bottom: number; gap: number }): { side: 'below' | 'above' | 'center'; y: number; maxH: number } {
  const { hole, bubbleH, top, bottom, gap } = o;
  if (!hole) {
    const maxH = bottom - top;
    return { side: 'center', y: top + Math.max(0, (maxH - bubbleH) / 2), maxH };
  }
  const below = bottom - (hole.y + hole.height + gap);
  const above = hole.y - gap - top;
  if (below >= bubbleH) return { side: 'below', y: hole.y + hole.height + gap, maxH: below };
  if (above >= bubbleH) return { side: 'above', y: hole.y - gap - bubbleH, maxH: above };
  if (below >= above) return { side: 'below', y: hole.y + hole.height + gap, maxH: Math.max(0, below) };
  const h = Math.max(0, above);
  return { side: 'above', y: hole.y - gap - Math.min(bubbleH, h), maxH: h };
}

/** Découpe : l'élément + une marge, bornée à l'écran. */
export function holeFor(r: Rect, pad: number, screen: { width: number; height: number }): Rect {
  const x = Math.max(2, r.x - pad);
  const y = Math.max(2, r.y - pad);
  const right = Math.min(screen.width - 2, r.x + r.width + pad);
  const bottom = Math.min(screen.height - 2, r.y + r.height + pad);
  return { x, y, width: Math.max(0, right - x), height: Math.max(0, bottom - y) };
}

// ------------------------------------------------------------------------------------------------ sortie de l'étape
/**
 * La personne a QUITTÉ l'écran de l'étape (elle y était, l'adresse a changé, l'étape n'a pas avancé) : la visite se met
 * en pause au lieu de la suivre partout (cause des « visites aléatoires » : une visite en cours réapparaissait sur chaque
 * onglet, sur le paywall et sur Aura jusqu'à la fermeture de l'application). Exception : le formulaire ouvert depuis
 * l'étape « Enregistrer une action ». Lancée depuis un autre écran (Réglages), la visite n'est pas encore « arrivée » :
 * la pastille « Reprendre » reste jusqu'à l'écran de l'étape.
 */
export function leftStep(o: { stepIndex: number; arrivedAt: number | null; path: string; formOpen: boolean }): boolean {
  const step = TOUR_STEPS[o.stepIndex];
  if (!step || o.formOpen || o.arrivedAt !== o.stepIndex) return false;
  return !stepOnScreen(step, o.path);
}
