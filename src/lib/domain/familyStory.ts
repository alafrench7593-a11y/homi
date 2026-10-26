/**
 * « Au fil de nous » — l'histoire d'une femme et de son enfant, de l'avant-grossesse aux dix ans de l'enfant
 * (logique pure, testée). Une seule et même femme, un seul et même enfant d'une étape à l'autre.
 *
 *  1. sceneFor()   : l'étape à montrer pour le profil affiché (cycle → femme seule ; grossesse → ventre selon la
 *                    semaine ; bébé ou enfant → selon SON âge ; jumeaux et fratrie → selon la famille renseignée).
 *  2. poseFor()    : la pose dessinée (positions numériques) pour une étape ; lerpPose() fait les poses
 *                    intermédiaires (transitions douces, défilement de la présentation).
 *  3. drawPose()   : les formes à dessiner (chemins SVG), identiques sur téléphone, sur le web et dans les tests.
 *
 * Repère : boîte 240 × 200, sol à y = 190, une unité ≈ 1,05 cm (la femme mesure 165 cm).
 */
import { childAge } from './child';
import { pregnancyProgress } from './pregnancy';
import type { Child, Pregnancy } from '../types';

// ---------------------------------------------------------------- étapes
export interface StoryKid { id: string; ageYears: number }
export interface StoryScene {
  /** Arrondi du ventre, 0 (pas de grossesse) à 1 (terme) */
  belly: number;
  /** Plusieurs bébés attendus (ventre un peu plus rond) */
  multiple: boolean;
  /** Enfants montrés (âge en années), du plus proche de la mère au plus éloigné ; 3 au plus */
  kids: StoryKid[];
}

export const WOMAN_ALONE: StoryScene = { belly: 0, multiple: false, kids: [] };
export const MAX_KIDS = 3;
export const MAX_AGE = 10;

/** Ventre selon la semaine d'aménorrhée : invisible avant 12 SA, rond à 39 SA. */
export function bellyForWeek(weeksSA: number, multiple = false): number {
  const k = Math.max(0, Math.min(1, (weeksSA - 10) / 29));
  return Math.min(1.12, (k * k * (3 - 2 * k)) * (multiple ? 1.12 : 1));
}

const ageYears = (c: Pick<Child, 'birth_date'>, today?: string) => Math.min(MAX_AGE, childAge(c.birth_date, today).days / 365.25);

export interface SceneInput {
  scope: string;
  pregnancy?: Pick<Pregnancy, 'due_date' | 'multiplicity'> | null;
  /** Enfant du profil affiché (bébé ou enfant) */
  child?: Pick<Child, 'id' | 'birth_date' | 'multiple_group'> | null;
  /** Tous les enfants suivis (jumeaux du même groupe, vue famille) */
  children?: Pick<Child, 'id' | 'birth_date' | 'multiple_group'>[] | null;
  today?: string;
}

/**
 * Étape du profil affiché. Chaque enfant garde son propre suivi : sur le profil d'un enfant, on ne montre que lui
 * (et ses jumeaux s'il en a) ; la vue « famille » montre toute la famille renseignée.
 */
export function sceneFor({ scope, pregnancy, child, children, today }: SceneInput): StoryScene {
  if (scope === 'pregnancy' && pregnancy) {
    const multiple = pregnancy.multiplicity === 'twins' || pregnancy.multiplicity === 'triplets' || pregnancy.multiplicity === 'more';
    return { belly: bellyForWeek(pregnancyProgress(pregnancy.due_date, today).weeksSA, multiple), multiple, kids: [] };
  }
  if ((scope === 'baby' || scope === 'child' || scope === 'postpartum') && child) {
    const twins = child.multiple_group ? (children ?? []).filter((c) => c.id !== child.id && c.multiple_group === child.multiple_group) : [];
    return { belly: 0, multiple: false, kids: [child, ...twins].slice(0, MAX_KIDS).map((c) => ({ id: c.id, ageYears: ageYears(c, today) })) };
  }
  if (scope === 'family') {
    const kids = [...(children ?? [])].sort((a, b) => b.birth_date.localeCompare(a.birth_date)) // le plus jeune près de sa mère
      .slice(0, MAX_KIDS).map((c) => ({ id: c.id, ageYears: ageYears(c, today) }));
    const multiple = !!pregnancy && pregnancy.multiplicity !== 'single' && pregnancy.multiplicity !== 'unknown';
    return { belly: pregnancy ? bellyForWeek(pregnancyProgress(pregnancy.due_date, today).weeksSA, multiple) : 0, multiple, kids };
  }
  // Cycle, désir d'enfant, contraception ou aucun parcours : une femme seule
  return WOMAN_ALONE;
}

/** Chapitres de la présentation (dans l'ordre du défilement). */
export interface StoryChapter { key: string; title: string; text: string; scene: StoryScene }
const one = (age: number): StoryKid[] => [{ id: 'k', ageYears: age }];
export const STORY_CHAPTERS: StoryChapter[] = [
  { key: 'before', title: 'Avant', text: 'Une femme, son rythme, ses envies. L’histoire commence par elle.', scene: WOMAN_ALONE },
  { key: 'early', title: 'Les premières semaines', text: 'Rien ne se voit encore, et pourtant tout change déjà.', scene: { belly: bellyForWeek(16), multiple: false, kids: [] } },
  { key: 'round', title: 'Un ventre qui s’arrondit', text: 'Semaine après semaine, la vie prend sa place.', scene: { belly: bellyForWeek(28), multiple: false, kids: [] } },
  { key: 'term', title: 'Bientôt', text: 'Les derniers jours d’attente, le ventre bien rond.', scene: { belly: bellyForWeek(39), multiple: false, kids: [] } },
  { key: 'birth', title: 'La rencontre', text: 'Votre bébé dans vos bras, tout contre vous.', scene: { belly: 0, multiple: false, kids: one(0.04) } },
  { key: 'sitting', title: 'Tenir assis', text: 'Votre bébé découvre le monde à hauteur de tapis.', scene: { belly: 0, multiple: false, kids: one(0.7) } },
  { key: 'steps', title: 'Les premiers pas', text: 'Debout, une main dans la vôtre : le premier élan.', scene: { belly: 0, multiple: false, kids: one(1.15) } },
  { key: 'little', title: 'À vos côtés', text: 'Un petit enfant qui marche près de sa mère.', scene: { belly: 0, multiple: false, kids: one(3) } },
  { key: 'growing', title: 'Grandir', text: 'L’école, les amis, les grandes questions.', scene: { belly: 0, multiple: false, kids: one(6) } },
  { key: 'ten', title: 'Dix ans, main dans la main', text: 'Votre enfant a grandi, et votre main est toujours là.', scene: { belly: 0, multiple: false, kids: one(10) } },
];

/**
 * Étape illustrée (image générée, ElevenLabs, 26/10/2026) correspondant à une scène : 0 à 9 dans l'ordre de
 * STORY_CHAPTERS. `null` quand aucune image ne convient (jumeaux ou fratrie déjà nés) : on garde alors
 * le dessin animé, qui sait montrer plusieurs enfants.
 */
export function chapterIndexForScene(scene: StoryScene): number | null {
  // Plusieurs enfants déjà nés : le dessin animé ; grossesse multiple : l'image de grossesse convient (même silhouette)
  if (scene.kids.length > 1) return null;
  if (scene.kids.length === 0) {
    if (scene.belly <= 0.02) return 0;
    if (scene.belly < bellyForWeek(22)) return 1;
    if (scene.belly < bellyForWeek(34)) return 2;
    return 3;
  }
  const age = scene.kids[0].ageYears;
  if (age < 0.33) return 4;
  if (age < 0.95) return 5;
  if (age < 2) return 6;
  if (age < 4.5) return 7;
  if (age < 8) return 8;
  return 9;
}

// ---------------------------------------------------------------- poses
export const GROUND = 190;
type Pt = [number, number];
export interface KidPose {
  id: string;
  /** pieds (debout) ou bassin (assis), en x */
  x: number;
  age: number;
  /** 0 debout, 1 assis */
  sit: number;
  /** 0..1 : emmailloté dans les bras */
  bundle: number;
  /** pas en avant (premiers pas) */
  stride: number;
  opacity: number;
  /** cible de la main côté mère (sinon bras le long du corps) */
  backHand: Pt | null;
  /** cible de la main côté opposé (main donnée au frère ou à la sœur) */
  frontHand: Pt | null;
  /** position du bébé emmailloté (centre) et angle */
  bundleAt: Pt;
  bundleRot: number;
}
export interface Pose {
  belly: number;
  /** main de la mère (bras proche) */
  hand: Pt;
  /** inclinaison de la tête (degrés, + = regarde vers le bas, vers l'enfant) */
  tilt: number;
  kids: KidPose[];
}

/** Taille (unités) d'un enfant selon son âge : repères de croissance moyens (cm), lissés. */
const GROWTH: [number, number][] = [[0, 50], [0.5, 67], [1, 75], [1.5, 81], [2, 87], [3, 96], [4, 103], [5, 110], [6, 116], [7, 122], [8, 128], [9, 133], [10, 138]];
const UNIT = 157.5 / 165;
export function kidHeight(age: number): number {
  const a = Math.max(0, Math.min(MAX_AGE, age));
  for (let i = 1; i < GROWTH.length; i++) {
    if (a <= GROWTH[i][0]) {
      const [a0, h0] = GROWTH[i - 1]; const [a1, h1] = GROWTH[i];
      return (h0 + ((a - a0) / (a1 - a0)) * (h1 - h0)) * UNIT;
    }
  }
  return GROWTH[GROWTH.length - 1][1] * UNIT;
}
/** Rayon de la tête : un quart de la taille chez le nourrisson, environ 1/6,5 à dix ans. */
export const kidHeadR = (age: number) => {
  const k = Math.max(0, Math.min(1, age / MAX_AGE));
  return (kidHeight(age) / (8 + 5 * Math.sqrt(k))) * 1.0;
};

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const lerpPt = (a: Pt, b: Pt, k: number): Pt => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];
const dist = (a: Pt, b: Pt) => Math.hypot(a[0] - b[0], a[1] - b[1]);
export const smooth = (k: number) => { const x = Math.max(0, Math.min(1, k)); return x * x * (3 - 2 * x); };

// Mère : épaule du bras proche, longueurs du bras, main au repos
export const MOTHER_X = 92;
export const SHOULDER: Pt = [95, 67];
const UPPER = 28, FORE = 27;
const HAND_REST: Pt = [101, 111];
const CRADLE_HAND: Pt = [117, 87];

/** Squelette d'un enfant (debout ou assis), commun aux poses et au dessin. */
export function kidSkeleton(k: Pick<KidPose, 'x' | 'age' | 'sit' | 'stride'>) {
  const h = kidHeight(k.age);
  const r = kidHeadR(k.age);
  const leg = h * lerp(0.36, 0.47, smooth(k.age / MAX_AGE));
  const torso = h * 0.29;
  const s = smooth(k.sit);
  const hipStand: Pt = [k.x, GROUND - leg];
  const hipSit: Pt = [k.x - leg * 0.35, GROUND - 4 - r * 0.15];
  const hip = lerpPt(hipStand, hipSit, s);
  const shoulder: Pt = [hip[0] + 0.8 + (1 - s) * 0.4, hip[1] - torso];
  const head: Pt = [shoulder[0] + 1.2, shoulder[1] - r * 1.02];
  const stride = (1 - s) * k.stride;
  // jambes : debout (verticales, pas en avant) → assis (allongées vers l'avant)
  const footNear = lerpPt([k.x + stride * leg * 0.32, GROUND - 1.5], [hipSit[0] + leg * 0.92, GROUND - 2.5], s);
  const footFar = lerpPt([k.x - stride * leg * 0.22, GROUND - 1.5], [hipSit[0] + leg * 0.86, GROUND - 4.5], s);
  const kneeNear = lerpPt([lerp(hip[0], footNear[0], 0.5) + 1.2, lerp(hip[1], footNear[1], 0.5)], [hipSit[0] + leg * 0.48, GROUND - 6 - leg * 0.1], s);
  const kneeFar = lerpPt([lerp(hip[0], footFar[0], 0.5) + 0.8, lerp(hip[1], footFar[1], 0.5)], [hipSit[0] + leg * 0.45, GROUND - 8 - leg * 0.1], s);
  const arm = h * 0.36;
  return { h, r, leg, torso, hip, shoulder, head, footNear, footFar, kneeNear, kneeFar, arm };
}

/** Position horizontale de chaque enfant selon son âge et sa place dans la fratrie. */
function kidX(age: number, sit: number, index: number, prevX: number | null, prevAge: number): number {
  const width = (a: number) => 11 + Math.min(10, a) * 1.2;
  if (index === 0) return lerp(lerp(118, 127, smooth(age / 4)), 133, sit);
  return (prevX ?? 120) + width(prevAge) * 0.9 + width(age) * 0.9 + 4;
}

/** Pose d'une étape. */
export function poseFor(scene: StoryScene): Pose {
  const kids: KidPose[] = [];
  let hand: Pt = scene.belly > 0.15 ? [96 + 20 * scene.belly, 101] : HAND_REST;
  let tilt = scene.belly > 0.15 ? 8 : 0;
  const babies = scene.kids.filter((c) => c.ageYears < 0.33);
  let prevX: number | null = null; let prevAge = 0;
  scene.kids.forEach((c, i) => {
    const age = c.ageYears;
    // Nourrisson : dans les bras (jusqu'à deux bébés) ; 4 à 9 mois : assis ; ensuite debout
    const bundle = age < 0.33 && babies.indexOf(c) < 2 ? 1 : 0;
    const sit = bundle ? 0 : age < 0.33 ? 1 : age < 0.95 ? 1 : 0;
    const stride = age >= 0.95 && age < 1.6 ? 1 : age >= 1.6 ? 0.35 : 0;
    const x = bundle ? 0 : kidX(age, sit, kids.filter((k) => !k.bundle).length, prevX, prevAge);
    const bi = babies.indexOf(c);
    kids.push({ id: c.id, x, age, sit, bundle, stride, opacity: 1, backHand: null, frontHand: null, bundleAt: bi === 1 ? [104, 91] : [105, 79], bundleRot: bi === 1 ? 6 : 10 });
    if (!bundle) { prevX = x; prevAge = age; }
  });
  if (kids.some((k) => k.bundle)) { hand = CRADLE_HAND; tilt = 14; }
  // Mains données : la mère au plus proche (debout), puis de proche en proche
  const standing = kids.filter((k) => !k.bundle && k.sit < 0.5);
  const seated = kids.filter((k) => !k.bundle && k.sit >= 0.5);
  if (seated.length && !kids.some((k) => k.bundle)) tilt = 16;
  if (standing.length && !kids.some((k) => k.bundle)) {
    const first = standing[0];
    const sk = kidSkeleton(first);
    // Point de rencontre : là où la main de la mère descend le plus naturellement, à portée de l'enfant
    let meet: Pt = [lerp(HAND_REST[0], sk.shoulder[0], 0.45), HAND_REST[1] + 2];
    if (dist(meet, sk.shoulder) > sk.arm * 0.94) {
      const d = dist(meet, sk.shoulder);
      meet = [sk.shoulder[0] + ((meet[0] - sk.shoulder[0]) / d) * sk.arm * 0.94, sk.shoulder[1] + ((meet[1] - sk.shoulder[1]) / d) * sk.arm * 0.94];
    }
    if (dist(meet, SHOULDER) > UPPER + FORE - 1) {
      const d = dist(meet, SHOULDER);
      meet = [SHOULDER[0] + ((meet[0] - SHOULDER[0]) / d) * (UPPER + FORE - 1), SHOULDER[1] + ((meet[1] - SHOULDER[1]) / d) * (UPPER + FORE - 1)];
    }
    hand = meet; first.backHand = meet;
    tilt = lerp(14, 6, smooth(first.age / MAX_AGE));
    for (let i = 1; i < standing.length; i++) {
      const a = kidSkeleton(standing[i - 1]); const b = kidSkeleton(standing[i]);
      const m: Pt = [(a.shoulder[0] + b.shoulder[0]) / 2, Math.max(a.shoulder[1], b.shoulder[1]) + Math.min(a.arm, b.arm) * 0.72];
      standing[i - 1].frontHand = m; standing[i].backHand = m;
    }
  }
  return { belly: scene.belly, hand, tilt, kids };
}

/** Pose intermédiaire entre deux poses (k de 0 à 1) : les enfants qui apparaissent arrivent en fondu. */
export function lerpPose(a: Pose, b: Pose, k: number): Pose {
  const ids = [...new Set([...a.kids.map((x) => x.id), ...b.kids.map((x) => x.id)])];
  const kids: KidPose[] = [];
  for (const id of ids) {
    const ka = a.kids.find((x) => x.id === id); const kb = b.kids.find((x) => x.id === id);
    if (ka && kb) {
      kids.push({
        id, x: ka.bundle && !kb.bundle ? kb.x : !ka.bundle && kb.bundle ? ka.x : lerp(ka.x, kb.x, k),
        age: lerp(ka.age, kb.age, k), sit: lerp(ka.sit, kb.sit, k), bundle: lerp(ka.bundle, kb.bundle, k), stride: lerp(ka.stride, kb.stride, k),
        opacity: lerp(ka.opacity, kb.opacity, k),
        backHand: kb.backHand && ka.backHand ? lerpPt(ka.backHand, kb.backHand, k) : k < 0.5 ? ka.backHand : kb.backHand,
        frontHand: kb.frontHand && ka.frontHand ? lerpPt(ka.frontHand, kb.frontHand, k) : k < 0.5 ? ka.frontHand : kb.frontHand,
        bundleAt: lerpPt(ka.bundleAt, kb.bundleAt, k), bundleRot: lerp(ka.bundleRot, kb.bundleRot, k),
      });
    } else {
      const only = (ka ?? kb)!;
      kids.push({ ...only, opacity: only.opacity * (ka ? 1 - k : k) });
    }
  }
  return { belly: lerp(a.belly, b.belly, k), hand: lerpPt(a.hand, b.hand, k), tilt: lerp(a.tilt, b.tilt, k), kids };
}

/** Pose le long de la présentation : progress de 0 (avant) à STORY_CHAPTERS.length - 1 (dix ans). */
export function storyPoseAt(progress: number): Pose {
  const n = STORY_CHAPTERS.length - 1;
  const p = Math.max(0, Math.min(n, progress));
  const i = Math.min(n - 1, Math.floor(p));
  // On marque une pause sur chaque étape : la transition se fait au milieu de l'intervalle
  const k = smooth((p - i - 0.18) / 0.64);
  return lerpPose(poseFor(STORY_CHAPTERS[i].scene), poseFor(STORY_CHAPTERS[i + 1].scene), k);
}

// ---------------------------------------------------------------- dessin
export interface StoryPalette {
  id: 'day' | 'night';
  /** reflet clair de la robe (dégradé doux pour le volume) */
  dressLight: string;
  line: string; // traits brun chaud
  skin: string;
  hair: string;
  dress: string;
  dressShade: string;
  sleeve: string;
  kidTop: string;
  kidBottom: string;
  swaddle: string;
  shoe: string;
  shadow: string;
}
export const DAY_PALETTE: StoryPalette = {
  id: 'day', dressLight: '#F0CBC4',
  line: '#7A5546', skin: '#E7C9B8', hair: '#6E4A3A', dress: '#E3B3AE', dressShade: '#D59F9A', sleeve: '#E3B3AE',
  kidTop: '#F6E8DC', kidBottom: '#B89C8C', swaddle: '#FBF1EA', shoe: '#7A5546', shadow: 'rgba(122,85,70,0.16)',
};
export const NIGHT_PALETTE: StoryPalette = {
  id: 'night', dressLight: '#A97CA2',
  line: '#F0D9CF', skin: '#C9A6A4', hair: '#5A3E52', dress: '#8E6488', dressShade: '#7B5577', sleeve: '#8E6488',
  kidTop: '#D9C6D6', kidBottom: '#6F6489', swaddle: '#E7DCE6', shoe: '#3E3557', shadow: 'rgba(10,12,30,0.35)',
};

export type Shape =
  | { k: 'path'; d: string; fill?: string; stroke?: string; sw?: number; op?: number; cap?: 'round' }
  | { k: 'ellipse'; cx: number; cy: number; rx: number; ry: number; fill?: string; stroke?: string; sw?: number; op?: number; rot?: number };

const f = (n: number) => Math.round(n * 10) / 10;
const P = (p: Pt) => `${f(p[0])} ${f(p[1])}`;

/** Coude d'un bras (cinématique inverse à deux segments) ; le coude part vers le bas et l'arrière. */
export function elbow(s: Pt, t: Pt, l1: number, l2: number, side: 1 | -1 = 1): { e: Pt; h: Pt } {
  let d = dist(s, t);
  const max = l1 + l2 - 0.3; const min = Math.abs(l1 - l2) + 0.5;
  let h = t;
  if (d > max) { h = [s[0] + ((t[0] - s[0]) / d) * max, s[1] + ((t[1] - s[1]) / d) * max]; d = max; }
  if (d < min) d = min;
  const a = Math.acos(Math.max(-1, Math.min(1, (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d))));
  const base = Math.atan2(h[1] - s[1], h[0] - s[0]);
  const c1: Pt = [s[0] + l1 * Math.cos(base + a), s[1] + l1 * Math.sin(base + a)];
  const c2: Pt = [s[0] + l1 * Math.cos(base - a), s[1] + l1 * Math.sin(base - a)];
  // côté du coude : 1 = vers le bas/arrière (gauche), -1 = vers l'avant
  const pick = side === 1 ? (c1[0] < c2[0] ? c1 : c2) : (c1[0] > c2[0] ? c1 : c2);
  return { e: pick, h };
}

/** Membre arrondi (contour brun puis remplissage), pour des volumes doux. */
function limb(pts: Pt[], w: number, fill: string, pal: StoryPalette, op = 1, outline = true): Shape[] {
  const d = `M${P(pts[0])}${pts.slice(1).map((p) => ` L${P(p)}`).join('')}`;
  return [
    ...(outline ? [{ k: 'path' as const, d, stroke: pal.line, sw: w + 1.6, cap: 'round' as const, op }] : []),
    { k: 'path', d, stroke: fill, sw: w, cap: 'round', op },
  ];
}

function rotate(p: Pt, c: Pt, deg: number): Pt {
  const a = (deg * Math.PI) / 180;
  const x = p[0] - c[0]; const y = p[1] - c[1];
  return [c[0] + x * Math.cos(a) - y * Math.sin(a), c[1] + x * Math.sin(a) + y * Math.cos(a)];
}

function drawMother(p: Pose, pal: StoryPalette): { back: Shape[]; body: Shape[]; arm: Shape[] } {
  const b = Math.max(0, p.belly);
  const back: Shape[] = [];
  // bras arrière (presque caché par la robe)
  back.push(...limb([[83, 67], [79, 89], [78, 109]], 5.6, pal.skin, pal));
  back.push(...limb([[83, 67], [80.5, 80]], 7, pal.sleeve, pal));
  const body: Shape[] = [];
  const bx = 98 + 22 * b;
  // Robe longue en A, ventre selon b
  const dress = [
    'M81 63', 'C86 60.5 94 60.5 99 64', 'C103 70 104 77 99 83',
    `C${f(100 + 3 * b)} ${f(86 + b)} ${f(bx)} ${f(90 - 2 * b)} ${f(bx)} ${f(102)}`,
    `C${f(bx)} ${f(112 + 3 * b)} ${f(100 + 9 * b)} 118 ${f(98 + 3 * b)} 122`,
    'C101 141 109 168 116 187', 'Q100 191.5 83 188.5', 'Q74 187.5 66 188',
    'C70 160 78 131 79 108', 'C80 92 76 79 78 70', 'Z',
  ].join(' ');
  body.push({ k: 'path', d: dress, fill: `url(#${dressGradientId(pal)})`, stroke: pal.line, sw: 1.1 });
  // pli de lumière et ombre douce sur la robe (volume)
  body.push({ k: 'path', d: `M${f(90 + 6 * b)} 90 C${f(92 + 10 * b)} 120 ${f(96 + 6 * b)} 150 103 184`, stroke: pal.dressShade, sw: 1.2, op: 0.9 });
  body.push({ k: 'path', d: 'M84 96 C82 130 78 160 74 185', stroke: pal.dressShade, sw: 1, op: 0.7 });
  // ceinture fine sous la poitrine
  body.push({ k: 'path', d: `M79.5 84 C86 85.5 93 85.5 ${f(98.5 + 2 * b)} 84`, stroke: pal.line, sw: 0.7, op: 0.55 });
  // cou et tête (inclinée vers l'enfant)
  const neck: Pt = [91, 57];
  body.push(...limb([[91.5, 54], [90.5, 61]], 5, pal.skin, pal));
  const tilt = p.tilt;
  const R = (q: Pt) => rotate(q, neck, tilt);
  const hc = R([93, 44]);
  body.push({ k: 'ellipse', cx: hc[0], cy: hc[1], rx: 9.3, ry: 11.4, fill: pal.skin, stroke: pal.line, sw: 1, rot: tilt });
  // profil : nez léger et œil clos
  const n1 = R([101.6, 42]); const n2 = R([103.6, 46.5]); const n3 = R([101.4, 48]);
  body.push({ k: 'path', d: `M${P(n1)} Q${P(n2)} ${P(n3)}`, stroke: pal.line, sw: 0.9, fill: pal.skin });
  const e1 = R([96.8, 42.6]); const e2 = R([98.2, 43.6]); const e3 = R([99.6, 42.8]);
  body.push({ k: 'path', d: `M${P(e1)} Q${P(e2)} ${P(e3)}`, stroke: pal.line, sw: 0.8 });
  // cheveux et chignon bas
  const hair = [R([101, 36]), R([98, 30]), R([88, 29.5]), R([83, 35]), R([82, 44]), R([84, 52]), R([87, 50]), R([88, 42]), R([94, 37.5])];
  body.push({ k: 'path', d: `M${P(hair[0])} C${P(hair[1])} ${P(hair[2])} ${P(hair[3])} C${P(hair[4])} ${P(hair[5])} ${P(hair[6])} C${P(hair[7])} ${P(hair[8])} ${P(hair[0])} Z`, fill: pal.hair, stroke: pal.line, sw: 0.9 });
  const bun = R([81.5, 46]);
  body.push({ k: 'ellipse', cx: bun[0], cy: bun[1], rx: 6.2, ry: 5.6, fill: pal.hair, stroke: pal.line, sw: 0.9 });
  // bras proche : manche puis avant-bras, main
  const { e, h } = elbow(SHOULDER, p.hand, UPPER, FORE, 1);
  const arm: Shape[] = [];
  arm.push(...limb([SHOULDER, e, h], 6, pal.skin, pal));
  arm.push(...limb([SHOULDER, lerpPt(SHOULDER, e, 0.55)], 7.8, pal.sleeve, pal));
  arm.push({ k: 'ellipse', cx: h[0], cy: h[1], rx: 3, ry: 2.6, fill: pal.skin, stroke: pal.line, sw: 0.8 });
  return { back, body, arm };
}

function drawBundle(k: KidPose, pal: StoryPalette, op: number): Shape[] {
  const [cx, cy] = k.bundleAt;
  const out: Shape[] = [];
  out.push({ k: 'ellipse', cx: cx + 2, cy, rx: 15, ry: 7.6, rot: k.bundleRot, fill: pal.swaddle, stroke: pal.line, sw: 1, op });
  const head = rotate([cx + 13.5, cy - 3.4], [cx, cy], k.bundleRot);
  out.push({ k: 'ellipse', cx: head[0], cy: head[1], rx: 5.3, ry: 5, fill: pal.skin, stroke: pal.line, sw: 0.9, op });
  out.push({ k: 'path', d: `M${P([head[0] - 3.4, head[1] - 2])} Q${P([head[0], head[1] - 6])} ${P([head[0] + 3.2, head[1] - 2.4])}`, stroke: pal.hair, sw: 1.6, cap: 'round', op });
  // pli de la couverture
  const a = rotate([cx + 7, cy - 6], [cx, cy], k.bundleRot); const c = rotate([cx - 2, cy + 5], [cx, cy], k.bundleRot);
  out.push({ k: 'path', d: `M${P(a)} Q${P([cx + 1, cy - 1])} ${P(c)}`, stroke: pal.line, sw: 0.7, op: op * 0.6 });
  return out;
}

function drawKid(k: KidPose, pal: StoryPalette): Shape[] {
  const op = k.opacity * (1 - smooth(k.bundle));
  if (op <= 0.01) return [];
  const s = kidSkeleton(k);
  const out: Shape[] = [];
  const legW = Math.max(4, s.h * 0.088);
  const armW = Math.max(3.2, s.h * 0.062);
  // jambe et bras éloignés (derrière le corps)
  out.push(...limb([s.hip, s.kneeFar, s.footFar], legW, pal.kidBottom, pal, op));
  // épaule arrière : un peu en retrait, pour que le bras levé vers la mère passe derrière la tête sans la couvrir
  const bs: Pt = [s.shoulder[0] - s.h * 0.05, s.shoulder[1] + 1.5];
  const backT = k.backHand ?? [bs[0] - 2, bs[1] + s.arm * 0.95];
  const ba = elbow(bs, backT, s.arm * 0.5, s.arm * 0.5, k.backHand ? -1 : 1);
  out.push(...limb([bs, ba.e, ba.h], armW, pal.skin, pal, op));
  out.push(...limb([bs, lerpPt(bs, ba.e, 0.6)], armW + 1.3, pal.kidTop, pal, op));
  out.push({ k: 'ellipse', cx: ba.h[0], cy: ba.h[1], rx: armW * 0.55, ry: armW * 0.5, fill: pal.skin, stroke: pal.line, sw: 0.7, op });
  // jambe proche
  out.push(...limb([s.hip, s.kneeNear, s.footNear], legW, pal.kidBottom, pal, op));
  for (const ft of [s.footFar, s.footNear]) out.push({ k: 'ellipse', cx: ft[0] + legW * 0.35, cy: ft[1] - 0.2, rx: legW * 0.62, ry: legW * 0.38, fill: pal.shoe, op });
  // buste (tunique)
  const w = s.h * 0.085;
  const top = [
    `M${P([s.shoulder[0] - w, s.shoulder[1] + 1])}`,
    `C${P([s.shoulder[0] - w * 0.4, s.shoulder[1] - 2])} ${P([s.shoulder[0] + w * 0.6, s.shoulder[1] - 2])} ${P([s.shoulder[0] + w, s.shoulder[1] + 1])}`,
    `C${P([s.shoulder[0] + w * 1.15, s.shoulder[1] + s.torso * 0.5])} ${P([s.hip[0] + w * 1.25, s.hip[1] - 2])} ${P([s.hip[0] + w * 1.1, s.hip[1] + w * 0.35])}`,
    `Q${P([s.hip[0], s.hip[1] + w * 0.65])} ${P([s.hip[0] - w * 1.1, s.hip[1] + w * 0.35])}`,
    `C${P([s.hip[0] - w * 1.2, s.hip[1] - 3])} ${P([s.shoulder[0] - w * 1.15, s.shoulder[1] + s.torso * 0.5])} ${P([s.shoulder[0] - w, s.shoulder[1] + 1])} Z`,
  ].join(' ');
  out.push({ k: 'path', d: top, fill: pal.kidTop, stroke: pal.line, sw: 0.9, op });
  // bras proche
  const frontT = k.frontHand ?? [s.shoulder[0] + 2 + (k.stride > 0.6 ? s.arm * 0.3 : 0), s.shoulder[1] + s.arm * (k.stride > 0.6 ? 0.78 : 0.94)];
  const fa = elbow(s.shoulder, frontT, s.arm * 0.5, s.arm * 0.5, 1);
  out.push(...limb([s.shoulder, fa.e, fa.h], armW, pal.skin, pal, op));
  out.push(...limb([s.shoulder, lerpPt(s.shoulder, fa.e, 0.6)], armW + 1.3, pal.kidTop, pal, op));
  out.push({ k: 'ellipse', cx: fa.h[0], cy: fa.h[1], rx: armW * 0.55, ry: armW * 0.5, fill: pal.skin, stroke: pal.line, sw: 0.7, op });
  // tête, cheveux (plus fournis avec l'âge), profil
  const [hx, hy] = s.head;
  out.push(...limb([[s.shoulder[0] + 0.6, s.shoulder[1] + 0.5], [hx - 0.3, hy + s.r * 0.7]], s.r * 0.55, pal.skin, pal, op));
  out.push({ k: 'ellipse', cx: hx, cy: hy, rx: s.r * 0.92, ry: s.r, fill: pal.skin, stroke: pal.line, sw: 0.9, op });
  const fuller = smooth(k.age / 5);
  out.push({
    k: 'path',
    d: `M${P([hx + s.r * 0.75, hy - s.r * 0.45])} C${P([hx + s.r * 0.5, hy - s.r * 1.25])} ${P([hx - s.r * 0.9, hy - s.r * 1.25])} ${P([hx - s.r * 0.95, hy - s.r * (0.1 - 0.35 * fuller)])} C${P([hx - s.r * 0.75, hy + s.r * (0.1 + 0.3 * fuller)])} ${P([hx - s.r * 0.45, hy - s.r * 0.2])} ${P([hx - s.r * 0.2, hy - s.r * 0.55])} C${P([hx + s.r * 0.1, hy - s.r * 0.75])} ${P([hx + s.r * 0.55, hy - s.r * 0.6])} ${P([hx + s.r * 0.75, hy - s.r * 0.45])} Z`,
    fill: pal.hair, stroke: pal.line, sw: 0.8, op,
  });
  out.push({ k: 'path', d: `M${P([hx + s.r * 0.88, hy - s.r * 0.1])} Q${P([hx + s.r * 1.12, hy + s.r * 0.18])} ${P([hx + s.r * 0.86, hy + s.r * 0.3])}`, stroke: pal.line, sw: 0.7, fill: pal.skin, op });
  return out;
}

/** Dégradé de la robe (lumière douce venant du haut à droite). */
export const dressGradientId = (pal: StoryPalette) => `afdn-dress-${pal.id}`;
export function dressGradient(pal: StoryPalette) {
  return { id: dressGradientId(pal), x1: 0.85, y1: 0.05, x2: 0.2, y2: 1, stops: [{ o: 0, c: pal.dressLight }, { o: 0.55, c: pal.dress }, { o: 1, c: pal.dressShade }] };
}

/** Formes à dessiner pour une pose (de l'arrière vers l'avant). */
export function drawPose(p: Pose, pal: StoryPalette): Shape[] {
  const out: Shape[] = [];
  // ombres au sol
  out.push({ k: 'ellipse', cx: MOTHER_X - 1, cy: GROUND + 0.5, rx: 30, ry: 3.2, fill: pal.shadow });
  for (const k of p.kids) if (k.bundle < 0.99 && k.opacity > 0.05) {
    const s = kidSkeleton(k);
    out.push({ k: 'ellipse', cx: k.x + (k.sit > 0.5 ? s.leg * 0.2 : 0), cy: GROUND + 0.5, rx: 8 + s.h * 0.1, ry: 2.4, fill: pal.shadow, op: k.opacity * (1 - k.bundle) });
  }
  const m = drawMother(p, pal);
  out.push(...m.back, ...m.body);
  // bébés dans les bras : entre la robe et le bras proche (qui les entoure)
  for (const k of p.kids) if (k.bundle > 0.01) out.push(...drawBundle(k, pal, k.opacity * smooth(k.bundle)));
  out.push(...m.arm);
  // enfants à côté de leur mère : le plus proche en dernier pour que les mains se rejoignent devant
  for (const k of [...p.kids].reverse()) out.push(...drawKid(k, pal));
  return out;
}

/** SVG complet (aperçus, tests, partage) : même dessin que dans l'application. */
export function poseSvg(p: Pose, pal: StoryPalette, w = 240, h = 200): string {
  const body = drawPose(p, pal).map((s) => {
    const common = `${s.fill ? `fill="${s.fill}"` : 'fill="none"'}${s.stroke ? ` stroke="${s.stroke}" stroke-width="${s.sw ?? 1}"` : ''}${s.op != null && s.op < 1 ? ` opacity="${f(s.op * 100) / 100}"` : ''}`;
    if (s.k === 'path') return `<path d="${s.d}" ${common}${s.cap ? ' stroke-linecap="round" stroke-linejoin="round"' : ' stroke-linejoin="round"'}/>`;
    return `<ellipse cx="${f(s.cx)}" cy="${f(s.cy)}" rx="${f(s.rx)}" ry="${f(s.ry)}" ${common}${s.rot ? ` transform="rotate(${f(s.rot)} ${f(s.cx)} ${f(s.cy)})"` : ''}/>`;
  }).join('');
  const g = dressGradient(pal);
  const defs = `<defs><linearGradient id="${g.id}" x1="${g.x1}" y1="${g.y1}" x2="${g.x2}" y2="${g.y2}">${g.stops.map((st) => `<stop offset="${st.o}" stop-color="${st.c}"/>`).join('')}</linearGradient></defs>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 200" width="${w}" height="${h}">${defs}${body}</svg>`;
}

/** Légende courte de l'étape (accueil). */
export function storyCaption(input: SceneInput & { childName?: string | null; twinNames?: string[]; childAgeLabel?: string | null; weeksLabel?: string | null }): string {
  const { scope } = input;
  if (scope === 'pregnancy') return input.weeksLabel ? `Le ventre s’arrondit · ${input.weeksLabel}` : 'Le ventre s’arrondit';
  if ((scope === 'baby' || scope === 'child' || scope === 'postpartum') && input.childName) {
    const twins = (input.twinNames ?? []).slice(0, MAX_KIDS - 1);
    return `${[input.childName, ...twins].join(' et ')}${input.childAgeLabel ? `, ${input.childAgeLabel}` : ''}`;
  }
  if (scope === 'family') return (input.children?.length ?? 0) > 1 ? 'Toute la famille' : 'Votre famille';
  return 'Votre histoire, à votre rythme';
}

/** Description pour les lecteurs d'écran. */
export function storyA11y(scene: StoryScene): string {
  if (!scene.kids.length) return scene.belly > 0.05 ? 'Illustration : une femme enceinte, la main sur son ventre.' : 'Illustration : une femme seule, sereine.';
  const babies = scene.kids.filter((k) => k.ageYears < 0.33).length;
  if (babies && babies === scene.kids.length) return babies > 1 ? 'Illustration : une mère tenant ses deux nouveau-nés dans ses bras.' : 'Illustration : une mère tenant son nouveau-né dans ses bras.';
  if (scene.kids.every((k) => k.ageYears < 0.95)) return 'Illustration : une mère auprès de son bébé assis.';
  return scene.kids.length > 1 ? 'Illustration : une mère et ses enfants, main dans la main.' : 'Illustration : une mère et son enfant, main dans la main.';
}
