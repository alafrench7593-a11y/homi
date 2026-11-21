/**
 * Courbes et ressorts nommés du système de mouvement HOMI (Reanimated).
 *
 * Les courbes sont des worklets autonomes (résolution de Bézier cubique) : elles tournent sur le fil UI,
 * sans dépendre de l'implémentation interne d'Easing (identiques sur iOS, Android, web et sous Jest).
 * Mêmes valeurs que src/theme/motion.ts (API Animated historique) : une seule signature de mouvement.
 */
import { duration } from '@/theme/motion';

export type Curve = (t: number) => number;

/** Bézier cubique CSS (0,0)-(x1,y1)-(x2,y2)-(1,1), résolue par Newton puis dichotomie. */
export function bezier(x1: number, y1: number, x2: number, y2: number): Curve {
  return (t: number) => {
    'worklet';
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    const cx = 3 * x1;
    const bx = 3 * (x2 - x1) - cx;
    const ax = 1 - cx - bx;
    const cy = 3 * y1;
    const by = 3 * (y2 - y1) - cy;
    const ay = 1 - cy - by;
    let u = t;
    for (let i = 0; i < 8; i++) {
      const x = ((ax * u + bx) * u + cx) * u - t;
      const dx = (3 * ax * u + 2 * bx) * u + cx;
      if (Math.abs(x) < 1e-5) return ((ay * u + by) * u + cy) * u;
      if (Math.abs(dx) < 1e-6) break;
      u -= x / dx;
    }
    let lo = 0;
    let hi = 1;
    u = t;
    for (let i = 0; i < 24; i++) {
      const x = ((ax * u + bx) * u + cx) * u;
      if (Math.abs(x - t) < 1e-5) break;
      if (x < t) lo = u;
      else hi = u;
      u = (lo + hi) / 2;
    }
    return ((ay * u + by) * u + cy) * u;
  };
}

const linearCurve: Curve = (t: number) => {
  'worklet';
  return t;
};

/** Courbes (mêmes valeurs que `easing` de src/theme/motion.ts). */
export const curves = {
  /** décélération longue, signature de l'app (entrées, apparitions) */
  decelerate: bezier(0.16, 1, 0.3, 1),
  /** changements d'état, chrome précis */
  standard: bezier(0.2, 0, 0, 1),
  /** sorties */
  accelerate: bezier(0.3, 0, 1, 1),
  /** tracés et révélations : départ et arrivée doux, vitesse régulière au milieu */
  reveal: bezier(0.45, 0, 0.25, 1),
  linear: linearCurve,
};
export type CurveName = keyof typeof curves;

/**
 * Ressorts nommés (Reanimated : damping / stiffness / mass).
 * ζ = damping / (2·√(stiffness·mass)) : plus ζ est proche de 1, moins il y a de rebond.
 */
export const springs = {
  /** doux (ζ ≈ 0,85) : panneaux, cartes, retours au repos — aucun rebond perceptible */
  doux: { damping: 20, stiffness: 140, mass: 1 },
  /** vif (ζ ≈ 0,83) : pression, sélection — ferme et immédiat */
  vif: { damping: 34, stiffness: 420, mass: 1 },
  /** rebond léger (ζ ≈ 0,59, dépassement ≈ 10 %) : relâchement, validation */
  rebondLeger: { damping: 19, stiffness: 260, mass: 1 },
  /** panneau (ζ ≈ 0,9) : panneau du bas qui suit le doigt puis se pose sur un cran, indicateur qui glisse (≈ 300 ms) */
  panneau: { damping: 30, stiffness: 280, mass: 1 },
} as const;
export type SpringName = keyof typeof springs;

/** Amortissement relatif d'un ressort (tests et documentation). */
export const dampingRatio = (s: { damping: number; stiffness: number; mass: number }) => s.damping / (2 * Math.sqrt(s.stiffness * s.mass));

/** Durées (ms) : reprises de src/theme/motion.ts. */
export const durations = duration;

/** Cascade : 45 ms par élément, plafonnée à 360 ms (on ne fait jamais attendre). */
export const cascade = { stepMs: 45, maxDelayMs: 360, distance: 10 } as const;

/** Pression : enfoncement léger, relâchement en rebond léger. */
export const press = { scale: 0.97, cardScale: 0.985 } as const;

/** Transition de carte vers un écran détail (élévation + échelle, « shared-element-like »). */
export const cardLift = {
  scale: 1.03,
  lift: -4,
  /** délai entre le début de l'élévation et l'ouverture de l'écran détail (on ne fait pas attendre plus) */
  leadMs: 140,
  /** écran détail : part de cette échelle / décalage, rejoint 1 / 0 en ressort doux */
  targetFromScale: 0.94,
  targetFromY: 14,
} as const;

/** Compteur numérique. */
export const counter = { ms: 700 } as const;

/** Morph d'icônes de module. */
export const morph = { ms: 520, points: 72 } as const;

// ------------------------------------------------------------------ Primitives « Liquid Glass » (17/11/2026)
/** Transition de contenu partagée (changement de profil / d'onglet) : sortie courte, entrée un peu plus longue. */
export const swap = { outMs: 110, inMs: 220, distance: 10 } as const;

/** Micro-animation de favori : l'étoile saute, une onde part du centre. */
export const favorite = { pop: 1.28, ringMs: 420, ringScale: 1.7 } as const;

/** Secousse d'erreur de champ : amplitudes décroissantes (px), un pas toutes les 55 ms (≈ 275 ms). */
export const shake = { steps: [7, -6, 4, -2, 0], stepMs: 55 } as const;

/** Coche de succès : le disque se pose, la coche se trace. */
export const successCheck = { fillMs: 180, drawMs: 240, drawDelayMs: 60 } as const;

/** Squelettes de chargement : respiration lente de l'opacité (jamais de balayage lumineux). */
export const skeleton = { ms: 900, min: 0.45 } as const;

/**
 * Glisser-déposer d'une liste verticale : appui long, la carte se soulève, les voisines se rangent, défilement
 * automatique quand le doigt approche d'un bord (zone `edge`, vitesse proportionnelle, plafonnée).
 */
export const reorder = { longPressMs: 220, liftScale: 1.03, edge: 72, maxSpeed: 720 } as const;

// ------------------------------------------------------------------ Direction « Liquid Glass » (20/11/2026, docs/DA_LIQUID_GLASS.md)
/**
 * Logos d'outils animés (`ToolLogo`) : une animation PAR FAMILLE, jouée lors d'une interaction réelle (ouverture,
 * démarrage, confirmation, ajout), courte, interruptible, qui revient toujours à l'état stable du logo.
 */
export const logoMotion = {
  /** ouverture d'un outil : le glyphe se pose (lune : rotation de −28° → 0, glint : soulèvement de 2 px) */
  openMs: 420,
  moonTurnDeg: -28,
  moonDrop: 3,
  /** minuteur en cours : un tour d'anneau (linéaire, en boucle TANT QUE le minuteur tourne) */
  ringPeriodMs: 1600,
  /** part de l'anneau tracée (arc lumineux) */
  ringArc: 0.28,
  /** courbe de croissance : tracé, pause, retour à l'état stable */
  curveDrawMs: 520,
  holdMs: 650,
  fadeMs: 260,
  /** coche de confirmation (pastille) */
  checkDrawMs: 260,
  /** repas : réaction à l'ajout */
  mealPop: 1.16,
  /** reflet qui traverse la plaque (glint) */
  glintMs: 560,
  /** pression : la plaque s'enfonce légèrement */
  pressScale: 0.94,
} as const;

/**
 * Indicateur « liquide » de la barre d'onglets : il glisse (ressort `panneau`) et s'ÉTIRE dans le sens du trajet
 * pendant le déplacement (comme une goutte), puis reprend sa forme. Étirement proportionnel à la distance restante,
 * plafonné ; aucun étirement avec « Réduire les animations ».
 */
export const liquidIndicator = { maxStretch: 0.22, squash: 0.08, perPx: 0.0016 } as const;

/** Aura : respiration du symbole pendant la préparation d'une réponse, rotation lente des teintes, ouverture. */
export const auraMotion = { breathMs: 1100, spinMs: 9000, thinkingScale: 1.06, openMs: 480 } as const;

/**
 * Robot compagnon d'Aura (`AuraBot`, src/features/aura/AuraBot.tsx). Distances en unités de la grille 120 du dessin.
 * Boucles douces (flottement, clignement, cœur) seulement en mouvement complet ; ponctuations courtes (coucou, sursaut)
 * qui reviennent toujours à la pose de l'état.
 */
export const auraBotMotion = {
  /** flottement : demi-période et amplitude */
  floatMs: 1900,
  float: 2.4,
  /** clignement : un toutes les `blinkEveryMs`, paupière fermée `blinkMs` */
  blinkEveryMs: 3600,
  blinkMs: 80,
  /** cœur : pulsation (demi-période), échelle maximale */
  heartMs: 1500,
  heartScale: 1.14,
  /** réflexion : balancement, anneau du cœur, défilement des trois points */
  swayMs: 1300,
  swayDeg: 3,
  orbitMs: 1500,
  dotsMs: 1250,
  /** écoute : tête penchée, regard qui suit légèrement */
  tiltDeg: 9,
  lookMs: 1400,
  look: 1.6,
  /** coucou : bras levé (degrés), va-et-vient, nombre d'allers-retours */
  raiseDeg: -110,
  waveFromDeg: -96,
  waveToDeg: -126,
  waveMs: 200,
  waves: 3,
  /** réponse : petit sursaut */
  hop: 7,
  hopMs: 150,
  /** durées des états passagers avant le retour au repos (useAuraBot) */
  greetMs: 2300,
  answerMs: 1400,
} as const;
