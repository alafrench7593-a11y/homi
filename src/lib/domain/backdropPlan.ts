/**
 * Fond vidéo qui change : plusieurs vidéos par ambiance (jour / nuit) jouées l'une après l'autre en fondu enchaîné,
 * dans un ordre tiré au hasard à chaque ouverture, parfois en miroir et à une vitesse légèrement différente,
 * pour ne jamais revoir exactement le même fond.
 */

/** Générateur pseudo-aléatoire reproductible (mulberry32) : même graine → même suite (tests). */
export function seeded(seed: number): () => number {
  let a = Math.floor(seed * 2 ** 31) >>> 0 || 1;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface BackdropPass {
  clip: number; // index de la vidéo dans la liste de l'ambiance
  mirror: boolean; // image retournée horizontalement
  rate: number; // vitesse de lecture (0,8 à 1 : plus lent = plus long et plus calme)
}

/** Durée du fondu enchaîné entre deux vidéos (secondes). */
export const BACKDROP_FADE_S = 1.6;

/**
 * Passages successifs du fond : les vidéos tournent sans répéter deux fois de suite la même (s'il y en a au moins
 * deux), avec miroir et vitesse variables. `n` = nombre de passages à préparer.
 */
export function backdropPlan(clipCount: number, seed: number, n = 12): BackdropPass[] {
  if (clipCount <= 0) return [];
  const rnd = seeded(seed);
  const out: BackdropPass[] = [];
  let last = -1;
  for (let i = 0; i < n; i++) {
    let clip = Math.floor(rnd() * clipCount);
    if (clipCount > 1 && clip === last) clip = (clip + 1 + Math.floor(rnd() * (clipCount - 1))) % clipCount;
    const prev = out[i - 1];
    // Le miroir change d'un passage à l'autre quand la même vidéo revient (une seule vidéo disponible)
    const mirror = clipCount === 1 && prev ? !prev.mirror : rnd() < 0.5;
    const rate = Math.round((0.8 + rnd() * 0.2) * 100) / 100;
    out.push({ clip, mirror, rate });
    last = clip;
  }
  return out;
}
