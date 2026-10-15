/**
 * Post-traitement PUR du texte lu localement sur le téléphone (Google ML Kit) :
 * repérage de la liste des ingrédients, des précautions, d'un code-barres imprimé,
 * et indice de lisibilité estimé (ML Kit ne fournit pas de score de confiance par texte).
 * La personne relit et corrige toujours le texte avant l'analyse.
 */
import { norm } from './scanCommon';

const START = /(ingr[ée]dients?|ingredients?|composition|inci)\s*[:：.-]?/i;
const STOP = /(à conserver|a conserver|conservation|pr[ée]cautions?|mode d'emploi|mode d’emploi|conseils? d'utilisation|fabriqu[ée]|distribu[ée]|valeurs nutritionnelles|pour 100 ?g|n° de lot|\blot\b|\bdluo\b|\bdlc\b|à consommer|a consommer|ne pas avaler|warning|usage externe)/i;

/** Extrait la partie « Ingrédients : … » d'un texte lu sur un emballage ; null si aucun repère. */
export function extractIngredientSection(text: string): string | null {
  if (!text) return null;
  const flat = text.replace(/\r/g, '').replace(/-\n(?=[a-zà-ÿ])/gi, '').replace(/\n+/g, ' ').replace(/\s+/g, ' ').trim();
  const m = flat.match(START);
  if (!m || m.index == null) return null;
  let rest = flat.slice(m.index + m[0].length).trim();
  const stop = rest.search(STOP);
  if (stop > 0) rest = rest.slice(0, stop);
  rest = rest.replace(/^[:\s.-]+/, '').replace(/[\s.;,]+$/, '').trim();
  return rest.length >= 3 ? rest : null;
}

/** Lignes de précautions d'emploi repérées sur l'emballage. */
export function extractPrecautions(text: string): string | null {
  if (!text) return null;
  const lines = text.split(/\n+|(?<=\.)\s+/).map((l) => l.trim()).filter(Boolean);
  const keep = lines.filter((l) => /(pr[ée]caution|attention|avertissement|tenir hors de (la )?port[ée]e|ne pas (avaler|appliquer|utiliser|ingérer)|usage externe|[ée]viter (le )?contact|en cas de contact|danger|nocif|irritant)/i.test(l));
  const out = [...new Set(keep)].join(' ').slice(0, 800).trim();
  return out || null;
}

/** Code-barres imprimé en chiffres sous les barres (EAN-8/13, UPC-A). */
export function extractPrintedBarcode(text: string): string | null {
  const m = (text ?? '').replace(/(\d)[  ](?=\d)/g, '$1').match(/\b(\d{13}|\d{12}|\d{8})\b/);
  return m ? m[1] : null;
}

/**
 * Indice de lisibilité estimé (0 à 1) : part de « mots » plausibles parmi les éléments lus.
 * Ce n'est PAS une probabilité d'exactitude : il sert seulement à prévenir que la relecture est importante.
 */
export function estimateReadability(text: string): number {
  const tokens = (text ?? '').split(/[\s,;()]+/).filter(Boolean);
  if (tokens.length === 0) return 0;
  const good = tokens.filter((t) => /^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ'’\-/.%0-9]*$/.test(t) && !/(.)\1{3,}/.test(t) && !/[0-9][A-Za-z][0-9]/.test(t));
  const ratio = good.length / tokens.length;
  const lengthFactor = Math.min(1, tokens.length / 4);
  return Math.round(ratio * lengthFactor * 100) / 100;
}

/** Requête de recherche à partir de la face avant d'un emballage : les lignes les plus « nominales ». */
export function frontTextToQuery(text: string): string {
  const lines = (text ?? '').split(/\n+/).map((l) => l.trim()).filter((l) => l.length >= 3 && l.length <= 40 && !/\d{5,}/.test(l) && !/^(ingr|nutri|valeur|poids|net|e ?\d)/i.test(norm(l)));
  return lines.slice(0, 3).join(' ').replace(/\s+/g, ' ').slice(0, 80).trim();
}
