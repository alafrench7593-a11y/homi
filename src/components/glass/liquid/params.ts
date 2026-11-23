/**
 * Verre liquide HOMI — réglages (purs, testés : src/__tests__/liquidLens.test.ts).
 *
 * Un réglage = un nombre borné. Le JSON copié depuis le laboratoire (`serializeLens`) se recolle tel quel
 * (`parseLens`) : clés inconnues ignorées, valeurs bornées, clés absentes = préréglage HOMI. C'est ce JSON qui fixe
 * exactement le rendu du composant de l'app.
 */
export interface LensParams {
  /** Largeur de la lèvre arrondie, en pt : la zone du bord où la lumière se courbe. */
  bezel: number;
  /** Épaisseur optique 0–1 : jusqu'où, vers l'intérieur de la lèvre, la courbure se fait sentir. */
  thickness: number;
  /** Force de réfraction, en pt de déplacement maximal au bord (0 = verre plat). */
  refraction: number;
  /** Frange colorée 0–1 (écart rouge / bleu au bord) ; 0 = aucune. */
  fringe: number;
  /** Dépoli, en pt de flou (0 = verre parfaitement clair). */
  frost: number;
  /** Voile du thème posé sur le verre 0–1 (lisibilité des icônes sur une carte chargée). */
  tint: number;
  /** Intensité du reflet 0–1. */
  highlight: number;
  /** Angle de la source lumineuse, en degrés (0 = lumière venant de la droite, 90 = du haut, sens trigonométrique). */
  lightAngle: number;
  /** Ombre portée 0–1. */
  shadow: number;
}

export interface LensParamSpec { key: keyof LensParams; min: number; max: number; step: number; unit?: string }

export const LENS_SPECS: LensParamSpec[] = [
  { key: 'bezel', min: 4, max: 34, step: 1, unit: 'pt' },
  { key: 'thickness', min: 0, max: 1, step: 0.05 },
  { key: 'refraction', min: 0, max: 60, step: 1, unit: 'pt' },
  { key: 'fringe', min: 0, max: 1, step: 0.05 },
  { key: 'frost', min: 0, max: 12, step: 0.5, unit: 'pt' },
  { key: 'tint', min: 0, max: 0.8, step: 0.02 },
  { key: 'highlight', min: 0, max: 1, step: 0.05 },
  { key: 'lightAngle', min: 0, max: 360, step: 5, unit: '°' },
  { key: 'shadow', min: 0, max: 1, step: 0.05 },
];

/**
 * Préréglage HOMI : verre clair et léger (blanc perlé / graphite), lèvre perceptible sans déformer la lecture des
 * cartes, lumière haut-gauche comme les reflets du reste de l'app, frange presque nulle, ombre discrète.
 */
export const LENS_HOMI: LensParams = {
  bezel: 18, thickness: 0.55, refraction: 22, fringe: 0.1, frost: 1.5, tint: 0.24, highlight: 0.6, lightAngle: 125, shadow: 0.35,
};

export const LENS_VERSION = 1;

const clamp = (v: number, s: LensParamSpec) => Math.min(s.max, Math.max(s.min, Math.round(v / s.step) * s.step));
const round = (v: number) => Math.round(v * 1000) / 1000;

/** Bornes et pas appliqués ; toute clé absente ou invalide reprend le préréglage HOMI. */
export function normalizeLens(p: Partial<Record<keyof LensParams, unknown>>): LensParams {
  const out = { ...LENS_HOMI };
  for (const s of LENS_SPECS) {
    const v = p[s.key];
    if (typeof v === 'number' && Number.isFinite(v)) out[s.key] = round(clamp(v, s));
  }
  return out;
}

/** JSON lisible du laboratoire (version + réglages). */
export function serializeLens(p: LensParams): string {
  return JSON.stringify({ homiLiquidGlass: LENS_VERSION, ...normalizeLens(p) }, null, 2);
}

/** Relit un JSON du laboratoire. `null` si ce n'est pas un objet JSON. */
export function parseLens(text: string): LensParams | null {
  try {
    const v: unknown = JSON.parse(text.trim());
    if (!v || typeof v !== 'object' || Array.isArray(v)) return null;
    return normalizeLens(v as Record<string, unknown>);
  } catch { return null; }
}

/**
 * Plancher de LISIBILITÉ pour un verre qui porte du texte (barre d'onglets, boutons, recherche, feuilles) — audit du
 * 23/11/2026 : avec le préréglage (flou 1,5, voile 24 %), le contenu qui défile dessous restait presque net et les
 * libellés se lisaient mal (« Moi » mesuré à 2,6:1) ; sur iOS 26, ce flou choisissait le style `clear`, qu'Apple réserve
 * aux fonds de type photo. La lèvre, la réfraction des bords et le reflet restent ceux du laboratoire.
 */
export const LEGIBLE_FROST = 14;
export const LEGIBLE_TINT = 0.72;
export function legibleLens(p: LensParams): LensParams {
  return { ...p, frost: Math.max(p.frost, LEGIBLE_FROST), tint: Math.max(p.tint, LEGIBLE_TINT) };
}
