/**
 * Recettes de la bibliothèque en anglais (QA D-10, 02/11/2026).
 * Les recettes arrivent de la base (ou de sa copie de démonstration) en français ; la version anglaise est rangée
 * dans la recette embarquée (champ `en` des fichiers de src/content/recipes). Un texte n'est remplacé que s'il est
 * resté identique au français embarqué : une correction faite dans l'administration reste affichée telle quelle
 * (en français) plutôt qu'une traduction devenue fausse. Les contrôles automatiques portent toujours sur le français.
 */
import { getLocale, t as tr } from '@/i18n';
import { generatedPhoto, generatedPhotoEn } from './build';
import { AI_PHOTOS, AI_PHOTOS_EN } from './photoCredits';
import type { Recipe, RecipeEnglish } from './types';

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const pick = (cur: string, ref: string | undefined, en: string | undefined) => (en && ref != null && cur === ref ? en : cur);
const pickList = (cur: string[], ref: string[] | undefined, en: string[] | undefined) =>
  (en && ref && cur.length === ref.length && en.length === ref.length ? cur.map((x, k) => (x === ref[k] ? en[k] : x)) : cur);

/** Historique éditorial : libellés connus de la bibliothèque → texte de la langue en cours. */
const HISTORY: Record<string, Parameters<typeof tr>[0]> = {
  'Rédaction par une IA (Claude, Anthropic)': 'rc.hist.ai',
  'Contrôles automatiques de l’application': 'rc.hist.checks',
  'Nouveau catalogue de recettes familiales classiques ; contrôles automatiques réussis, relecture humaine à faire.': 'rc.hist.noteV2',
  'Quantités, ingrédients cités, allergènes, précautions et doublons vérifiés par programme ; relecture humaine à faire.': 'rc.hist.notePhoto',
};
const history = (s: string) => (HISTORY[s] ? tr(HISTORY[s]) : s);

function photoEn(r: Recipe, ref: Recipe, title: string): Recipe['photo'] {
  const p = r.photo;
  const fixed = AI_PHOTOS[ref.slug];
  if (fixed && AI_PHOTOS_EN[ref.slug] && p.author === fixed.author && p.license === fixed.license) return { ...p, ...AI_PHOTOS_EN[ref.slug] };
  const gen = generatedPhoto(ref.title);
  if (p.kind === 'generated' && p.author === gen.author && p.license === gen.license) return { ...p, ...generatedPhotoEn(title) };
  return p;
}

/**
 * Recette affichée dans la langue en cours. `ref` : la recette embarquée de même identifiant (slug), qui porte le
 * champ `en` ; sans elle (recette personnelle, recette ajoutée par l'administration), la recette reste en français.
 */
export function localizeRecipe(r: Recipe, ref: Recipe | undefined, lang: string = getLocale()): Recipe {
  if (lang !== 'en') return r;
  const statusHistory = r.statusHistory.map((h) => ({ ...h, by: history(h.by), ...(h.note ? { note: history(h.note) } : {}) }));
  const en: RecipeEnglish | undefined = ref?.en;
  if (!ref || !en || r.personal) return { ...r, statusHistory };
  const title = pick(r.title, ref.title, en.title);
  const fa = r.familyAdaptations;
  return {
    ...r,
    title,
    summary: pick(r.summary, ref.summary, en.summary),
    ...(r.servingLabel ? { servingLabel: pick(r.servingLabel, ref.servingLabel, en.servingLabel) } : {}),
    ingredients: r.ingredients.map((x, k) => {
      const base = ref.ingredients[k];
      const note = en.notes?.[k];
      return x.note && note && base && base.key === x.key && base.note === x.note ? { ...x, note } : x;
    }),
    steps: pickList(r.steps, ref.steps, en.steps),
    adaptations: pickList(r.adaptations, ref.adaptations, en.adaptations),
    storage: pick(r.storage, ref.storage, en.storage),
    ...(r.freezing ? { freezing: pick(r.freezing, ref.freezing, en.freezing) } : {}),
    precautions: pickList(r.precautions, ref.precautions, en.precautions),
    nutrition: pick(r.nutrition, ref.nutrition, en.nutrition),
    ...(fa ? { familyAdaptations: {
      ...(fa.baby ? { baby: pick(fa.baby, ref.familyAdaptations?.baby, en.familyAdaptations?.baby) } : {}),
      ...(fa.child ? { child: pick(fa.child, ref.familyAdaptations?.child, en.familyAdaptations?.child) } : {}),
    } } : {}),
    photo: photoEn(r, ref, title),
    statusHistory,
  };
}

/** Liste de recettes dans la langue en cours (référence : bibliothèque embarquée, indexée par slug). */
export function localizeRecipes(list: Recipe[], library: Recipe[], lang: string = getLocale()): Recipe[] {
  if (lang !== 'en') return list;
  const bySlug = new Map(library.map((x) => [x.slug, x]));
  return list.map((r) => localizeRecipe(r, r.personal ? undefined : bySlug.get(r.slug), lang));
}

/** Pour les tests : une recette embarquée a-t-elle une version anglaise complète et de même forme ? */
export function englishShapeErrors(r: Recipe): string[] {
  const e = r.en;
  if (!e) return ['version anglaise absente'];
  const out: string[] = [];
  for (const k of ['steps', 'adaptations', 'precautions'] as const) if (e[k].length !== r[k].length) out.push(`${k} : ${e[k].length} au lieu de ${r[k].length}`);
  if (!!r.freezing !== !!e.freezing) out.push('congélation');
  if (!!r.servingLabel !== !!e.servingLabel) out.push('portions');
  if (e.notes && e.notes.length !== r.ingredients.length) out.push('précisions des ingrédients');
  if (r.ingredients.some((x, k) => x.note && !e.notes?.[k])) out.push('précision d’ingrédient non traduite');
  if (r.familyAdaptations && !same(Object.keys(r.familyAdaptations).sort(), Object.keys(e.familyAdaptations ?? {}).sort())) out.push('adaptations familiales');
  return out;
}
