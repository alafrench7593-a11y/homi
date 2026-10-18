/**
 * Les 14 allergènes à déclaration obligatoire (règlement (UE) n° 1169/2011, annexe II) :
 * correspondance entre les allergies SAISIES par la famille (en français, texte libre) et
 * les données produit (étiquettes Open Food Facts « en:milk », traces « peut contenir »,
 * liste d'ingrédients). Module pur, partagé par l'application et les fonctions serveur.
 *
 * Trois niveaux, jamais un « sans risque » :
 *  - identified  : l'allergène est déclaré par le fabricant ou figure dans les ingrédients ;
 *  - possible    : traces (« peut contenir ») ou correspondance seulement probable ;
 *  - insufficient: composition ou allergènes déclarés absents → impossible de conclure.
 * Une base collaborative peut être incomplète : l'absence de correspondance ne garantit rien.
 */

export interface MajorAllergen { key: string; label: string; tags: string[]; words: string[]; /** Expressions qui contiennent un mot-clé sans être l'allergène. */ exclude?: RegExp }

export const MAJOR_ALLERGENS: MajorAllergen[] = [
  { key: 'gluten', label: 'Céréales contenant du gluten', tags: ['gluten'], words: ['gluten', 'ble', 'froment', 'seigle', 'orge', 'avoine', 'epeautre', 'kamut', 'wheat', 'barley', 'rye', 'oats', 'spelt'] },
  { key: 'crustaceans', label: 'Crustacés', tags: ['crustaceans'], words: ['crustace', 'crevette', 'crabe', 'homard', 'langouste', 'langoustine', 'ecrevisse', 'shrimp', 'prawn', 'crab', 'lobster'] },
  { key: 'eggs', label: 'Œufs', tags: ['eggs'], words: ['oeuf', 'oeufs', 'albumine', 'ovalbumine', 'lysozyme', 'egg', 'eggs'] },
  { key: 'fish', label: 'Poissons', tags: ['fish'], words: ['poisson', 'anchois', 'thon', 'saumon', 'cabillaud', 'colin', 'sardine', 'maquereau', 'merlu', 'truite', 'fish', 'tuna', 'salmon', 'cod'] },
  { key: 'peanuts', label: 'Arachides', tags: ['peanuts'], words: ['arachide', 'arachides', 'cacahuete', 'cacahuetes', 'peanut', 'peanuts'] },
  { key: 'soybeans', label: 'Soja', tags: ['soybeans'], words: ['soja', 'soya', 'soy', 'soybean'] },
  { key: 'milk', label: 'Lait', tags: ['milk'], words: ['lait', 'lactose', 'lactoserum', 'babeurre', 'beurre', 'creme', 'fromage', 'caseine', 'caseinate', 'yaourt', 'milk', 'whey', 'butter', 'cream', 'cheese', 'casein'], exclude: /\b(beurre|creme|lait) (de |d )?(cacao|cacahuetes?|karite|arachides?|coco|soja|amandes?|avoine|riz|marrons?|noisettes?)\b|\bcocoa butter\b|\bcoconut milk\b/g },
  { key: 'nuts', label: 'Fruits à coque', tags: ['nuts'], words: ['fruits a coque', 'fruit a coque', 'amande', 'amandes', 'noisette', 'noisettes', 'noix', 'cajou', 'pecan', 'pistache', 'pistaches', 'macadamia', 'nut', 'nuts', 'almond', 'hazelnut', 'walnut', 'cashew', 'pistachio'], exclude: /\bnoix de (coco|muscade|saint[- ]jacques)\b|\bcoconut\b|\bnutmeg\b/g },
  { key: 'celery', label: 'Céleri', tags: ['celery'], words: ['celeri', 'celery'] },
  { key: 'mustard', label: 'Moutarde', tags: ['mustard'], words: ['moutarde', 'mustard'] },
  { key: 'sesame', label: 'Sésame', tags: ['sesame-seeds'], words: ['sesame', 'tahini', 'tahin'] },
  { key: 'sulphites', label: 'Sulfites', tags: ['sulphur-dioxide-and-sulphites'], words: ['sulfite', 'sulfites', 'anhydride sulfureux', 'disulfite', 'metabisulfite', 'e220', 'e221', 'e222', 'e223', 'e224', 'e226', 'e227', 'e228', 'sulphite', 'sulphites'] },
  { key: 'lupin', label: 'Lupin', tags: ['lupin'], words: ['lupin'] },
  { key: 'molluscs', label: 'Mollusques', tags: ['molluscs'], words: ['mollusque', 'moule', 'moules', 'huitre', 'huitres', 'calmar', 'calamar', 'encornet', 'poulpe', 'seiche', 'escargot', 'coquille saint-jacques', 'saint-jacques', 'palourde', 'mussel', 'oyster', 'squid', 'octopus'] },
];

/** Minuscule, sans accents ni ligature (œ → oe), espaces simples. */
export function foldText(s: string): string {
  return s.toLowerCase().replace(/œ/g, 'oe').replace(/æ/g, 'ae').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’']/g, ' ').replace(/\s+/g, ' ').trim();
}

const wordRe = (w: string) => new RegExp(`(^|[^a-z0-9])${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(s|x)?($|[^a-z0-9])`);

/** Allergène majeur correspondant à une allergie saisie (« arachide », « APLV », « lait de vache »…), sinon null. */
export function resolveAllergy(text: string): MajorAllergen | null {
  const t = foldText(text);
  if (!t) return null;
  if (/\baplv\b|proteines? de lait|lait de vache/.test(t)) return MAJOR_ALLERGENS.find((a) => a.key === 'milk')!;
  for (const a of MAJOR_ALLERGENS) {
    if (foldText(a.label) === t || a.key === t) return a;
    if (a.words.some((w) => wordRe(w).test(t))) return a;
  }
  return null;
}

const stripTag = (tag: string) => foldText(String(tag).replace(/^[a-z]{2}:/, ''));

export interface AllergyCheckInput {
  /** Allergies déclarées par la famille (texte libre). */
  allergies: string[];
  /** Allergènes déclarés (étiquettes, ex. « en:milk » ou « milk ») ; null = information absente de la base. */
  declaredTags?: string[] | null;
  /** Traces (« peut contenir ») ; null = information absente. */
  tracesTags?: string[] | null;
  ingredientsText?: string | null;
  /** Nom du produit : une correspondance y compte (« pâte à tartiner noisette »), mais ne remplace pas la composition. */
  nameText?: string | null;
}

export interface AllergyMatch { allergy: string; allergen: string | null; via: 'declared' | 'ingredients' | 'traces' | 'may_contain_text' }
export interface AllergyCheck {
  identified: AllergyMatch[];
  possible: AllergyMatch[];
  /** Raisons pour lesquelles on ne peut pas conclure (vide si les données sont présentes). */
  insufficient: string[];
  /** Phrase à afficher quand rien n'a été trouvé : jamais « sans risque ». */
  noMatchNote: string | null;
}

export function checkAllergies(i: AllergyCheckInput): AllergyCheck {
  const allergies = [...new Set(i.allergies.map((a) => a.trim()).filter((a) => a.length >= 2))];
  const identified: AllergyMatch[] = [];
  const possible: AllergyMatch[] = [];
  const insufficient: string[] = [];
  if (!allergies.length) return { identified, possible, insufficient, noMatchNote: null };

  const declared = (i.declaredTags ?? []).map(stripTag);
  const traces = (i.tracesTags ?? []).map(stripTag);
  const text = foldText(i.ingredientsText ?? '');
  // « peut contenir … » / « traces de … » écrits dans la liste d'ingrédients
  const mayContain = (text.match(/(peut contenir|traces? (eventuelles? )?de|may contain)[^.;]*/g) ?? []).join(' ');
  const mainText = `${foldText(i.nameText ?? '')} , ${mayContain ? text.replace(/(peut contenir|traces? (eventuelles? )?de|may contain)[^.;]*/g, ' ') : text}`;

  for (const allergy of allergies) {
    const major = resolveAllergy(allergy);
    const words = major ? major.words : [foldText(allergy)];
    const clean = (t: string) => (major?.exclude ? t.replace(major.exclude, ' ') : t);
    const inText = (t: string) => { const c = clean(t); return words.some((w) => w.length >= 3 && wordRe(w).test(c)); };
    const label = major?.label ?? null;
    if (major && major.tags.some((tg) => declared.includes(tg))) identified.push({ allergy, allergen: label, via: 'declared' });
    else if (inText(mainText)) identified.push({ allergy, allergen: label, via: 'ingredients' });
    else if (major && major.tags.some((tg) => traces.includes(tg))) possible.push({ allergy, allergen: label, via: 'traces' });
    else if (inText(mayContain)) possible.push({ allergy, allergen: label, via: 'may_contain_text' });
  }

  if (!text) insufficient.push('Liste des ingrédients absente');
  if (i.declaredTags == null) insufficient.push('Allergènes déclarés non renseignés dans la base');
  if (i.tracesTags == null) insufficient.push('Mentions « peut contenir » non renseignées');

  const noMatchNote = identified.length || possible.length ? null
    : insufficient.length
      ? 'Impossible de vérifier vos allergies avec ces données : elles sont incomplètes. Lisez l’emballage avant de donner ou d’utiliser ce produit.'
      : 'Aucune correspondance trouvée avec vos allergies dans les données disponibles. Cela ne garantit pas l’absence de l’allergène (base collaborative, recette modifiée) : vérifiez toujours l’emballage.';
  return { identified, possible, insufficient, noMatchNote };
}
