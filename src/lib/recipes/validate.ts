/**
 * Contrôles automatiques avant publication (exécutés par les tests et l'écran d'administration) :
 * quantités, chaque ingrédient utilisé dans les étapes, temps de cuisson cohérents, allergènes déduits du
 * dictionnaire, précautions grossesse et âge, sources, licence de l'image, doublons.
 * Ces contrôles ne remplacent pas une relecture humaine : ils ne changent jamais le statut en « Relu » ou « Validé ».
 */
import { INGREDIENTS } from './ingredients';
import { RECIPE_SOURCES } from './sources';
import { ALLERGENS, type Allergen, type Recipe } from './types';

export const fold = (s: string) => s.toLowerCase().replace(/œ/g, 'oe').replace(/æ/g, 'ae').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’']/g, ' ');

export function derivedAllergens(r: Pick<Recipe, 'ingredients'>): Allergen[] {
  const s = new Set<Allergen>();
  for (const x of r.ingredients) for (const a of INGREDIENTS[x.key]?.allergens ?? []) s.add(a);
  return ALLERGENS.filter((a) => s.has(a));
}
export const isVegetarian = (r: Pick<Recipe, 'ingredients'>) => r.ingredients.every((x) => !INGREDIENTS[x.key]?.meat && !INGREDIENTS[x.key]?.fish);
export const hasPork = (r: Pick<Recipe, 'ingredients'>) => r.ingredients.some((x) => INGREDIENTS[x.key]?.pork);

const COOK_WORDS = /(cui(re|t|s|son)|enfourn|grill|mijot|revenir|chauff|gratin|dor(er|ee)|frem|bouill|saut)/;

/** Espèces à limiter pour les femmes enceintes ou allaitantes et les enfants de moins de 3 ans (ANSES 2022). */
export const LIMITED_FISH = ['tuna'];

export function validateRecipe(r: Recipe): string[] {
  const e: string[] = [];
  const steps = fold(r.steps.join(' \n '));
  if (!r.title.trim() || r.title.length < 8) e.push('titre trop court ou générique');
  if (r.servings <= 0) e.push('portions');
  if (r.steps.length < 2) e.push('au moins deux étapes');
  if (r.prepMin <= 0) e.push('temps de préparation');
  for (const x of r.ingredients) {
    const d = INGREDIENTS[x.key];
    if (!d) { e.push(`ingrédient inconnu ${x.key}`); continue; }
    if (x.qty == null || !(x.qty > 0)) e.push(`quantité manquante : ${d.name}`);
    if (!x.unit) e.push(`unité manquante : ${d.name}`);
    // mot entier (début de mot ; mot exact pour les mots courts comme « ail » ou « maïs »)
    if (!d.stem.split('|').some((st) => new RegExp(`(^|[^a-z])${fold(st)}${fold(st).length <= 4 ? 's?(?![a-z])' : ''}`).test(steps))) e.push(`ingrédient absent des étapes : ${d.name}`);
  }
  // Temps : la plus longue durée citée tient dans le temps de cuisson ; pas de cuisson annoncée à 0 min
  const durations = r.steps.filter((s) => !/repos/i.test(s)).flatMap((s) => [...fold(s).matchAll(/(\d+)\s*(?:a\s*\d+\s*)?minutes?/g)].map((m) => Number(m[1])));
  const ranges = r.steps.filter((s) => !/repos/i.test(s)).flatMap((s) => [...fold(s).matchAll(/\d+\s*a\s*(\d+)\s*minutes?/g)].map((m) => Number(m[1])));
  const longest = Math.max(0, ...durations, ...ranges);
  if (longest > r.cookMin + r.prepMin) e.push(`durée citée (${longest} min) supérieure aux temps annoncés`);
  if (r.cookMin === 0 && COOK_WORDS.test(steps.replace(/cuites?|cuits?/g, ''))) e.push('cuisson décrite mais temps de cuisson nul');
  // Allergènes déclarés = allergènes déduits des ingrédients
  const der = derivedAllergens(r);
  const decl = [...r.allergens].sort();
  if (JSON.stringify(der.slice().sort()) !== JSON.stringify(decl)) e.push(`allergènes déclarés ${decl.join(',') || '∅'} ≠ déduits ${der.join(',') || '∅'}`);
  // Sources existantes, image avec licence
  if (!r.sources.length) e.push('aucune source');
  for (const s of r.sources) if (!RECIPE_SOURCES[s]) e.push(`source inconnue ${s}`);
  if (!r.photo.license || !r.photo.rights || !r.photo.author || !r.photo.source) e.push('licence de l’image incomplète');
  if (!r.verifiedOn) e.push('date de vérification');
  if (r.tags.includes('vegetarian') && !isVegetarian(r)) e.push('étiquetée végétarienne mais contient viande ou poisson');
  // Poissons (ANSES, « Manger du poisson : pourquoi ? comment ? », 30/06/2022 ; Santé.fr, méthylmercure) :
  // espèces prédatrices sauvages à limiter (thon…) jamais proposées pendant la grossesse ni avant 3 ans
  const limitedFish = r.ingredients.filter((x) => LIMITED_FISH.includes(x.key));
  if (limitedFish.length && (r.audiences.includes('pregnancy') || r.audiences.includes('baby') || (r.minMonths ?? 999) < 36)) e.push('poisson prédateur à limiter (thon) : pas pour la grossesse ni avant 3 ans');
  // Grossesse
  if (r.audiences.includes('pregnancy')) {
    for (const x of r.ingredients) if (INGREDIENTS[x.key].pregnancyAvoid) e.push(`grossesse : ${INGREDIENTS[x.key].name} à éviter`);
    if (!r.sources.includes('santefr_listeria') || !r.sources.includes('santefr_toxo')) e.push('grossesse : sources listériose et toxoplasmose attendues');
    const needCook = r.ingredients.some((x) => INGREDIENTS[x.key].mustCook);
    const txt = fold([...r.precautions, ...r.steps].join(' '));
    if (needCook && !/(cuit|coeur|ferme|opaque|pris)/.test(txt)) e.push('grossesse : cuisson à cœur non précisée');
    if (/(promet|guerit|traite|soigne|garanti)/.test(fold([r.nutrition, r.summary].join(' ')))) e.push('grossesse : formulation qui ressemble à une promesse de santé');
  }
  // Bébé et jeunes enfants
  const min = r.minMonths ?? (r.audiences.includes('baby') ? 4 : 216);
  if (r.audiences.includes('baby') && !r.stages?.length) e.push('bébé : étape indicative manquante');
  if (r.audiences.includes('baby') && !r.sources.includes('spf_diversification')) e.push('bébé : source diversification attendue');
  for (const x of r.ingredients) {
    const d = INGREDIENTS[x.key];
    if (d.minMonths && min < d.minMonths) e.push(`âge : ${d.name} déconseillé avant ${d.minMonths} mois`);
    if (min < 12 && d.addedSaltSugar) e.push(`bébé : ${d.name} ajouté avant 1 an`);
    if (d.choking && min < 48 && !/(etouff|rap|surveill|4 ans|ecras|tendre|cuire|cuisson|mijot|mix|compote)/.test(fold([...r.precautions, ...r.steps, ...r.adaptations].join(' ')))) e.push(`étouffement : préparation de ${d.name} non précisée`);
  }
  if (min < 48 && r.ingredients.some((x) => x.key === 'walnuts')) e.push('noix entières avant 4 ans');
  return e;
}

/** Doublons : même titre normalisé, même identifiant, ou ingrédients presque identiques pour le même public. */
export function findDuplicates(all: Recipe[]): string[] {
  const out: string[] = [];
  const seenT = new Map<string, string>();
  const seenS = new Set<string>();
  for (const r of all) {
    const t = fold(r.title).replace(/[^a-z0-9]+/g, ' ').trim();
    if (seenT.has(t)) out.push(`titre en double : ${r.title}`);
    seenT.set(t, r.slug);
    if (seenS.has(r.slug)) out.push(`identifiant en double : ${r.slug}`);
    seenS.add(r.slug);
  }
  for (let a = 0; a < all.length; a++) {
    for (let b = a + 1; b < all.length; b++) {
      const A = new Set(all[a].ingredients.map((x) => x.key)); const B = new Set(all[b].ingredients.map((x) => x.key));
      const inter = [...A].filter((k) => B.has(k)).length;
      const jac = inter / (A.size + B.size - inter);
      const sameAud = all[a].audiences.some((x) => all[b].audiences.includes(x));
      if (jac >= 0.9 && sameAud) out.push(`recettes presque identiques : ${all[a].slug} / ${all[b].slug}`);
    }
  }
  return out;
}
