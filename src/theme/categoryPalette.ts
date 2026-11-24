/**
 * Couleurs des CATÉGORIES de « Mes outils » (ticket 3, 21/11/2026) — une couleur STABLE par catégorie, la même dans
 * les 8 thèmes (c'est une couleur SÉMANTIQUE : elle dit « où l'outil est rangé », comme les lumières par public des
 * logos d'outils, src/theme/toolLogo.ts). Seule son intensité suit l'apparence : en sombre, la teinte est éclaircie
 * pour rester lisible sur un fond foncé ; la nuit, elle est atténuée.
 *
 * Cohérence avec les logos : cycle → rose (outils de la femme), couple → pêche-corail, famille / foyer → ambre,
 * soins → menthe (enfant), alimentation → bleu (bébé). Les autres prennent une teinte libre, toutes distinctes.
 * Usages : pastille + liseré + aplat très léger des cartes de catégorie, pictogramme de la catégorie, légende
 * « Couleurs des catégories ». Le texte reste à l'encre du thème (contraste garanti par le thème, jamais par la teinte).
 * Garde-fou : src/__tests__/toolsCategories.test.tsx (couleurs distinctes, contraste ≥ 3:1 sur la surface des 8 thèmes).
 */
import { contrastRatio } from './contrast';
import { mixHex } from './toolLogo';
import type { Theme } from './tokens';

export type CategoryKey = 'feeding' | 'sleep' | 'care' | 'health' | 'cycle' | 'pregnancy' | 'school' | 'couple' | 'family';

/** Teinte de référence (fond clair) de chaque catégorie. */
// 24/11/2026 (demande de la propriétaire : « remettre un système de couleur ») : mêmes teintes que la lumière des logos
// par famille (src/theme/toolLogo.ts, CATEGORY_LIGHT), un peu plus soutenues si besoin pour le contraste 3:1.
// Le nom et le pictogramme restent sur chaque carte : la couleur n'est jamais le seul repère.
export const CATEGORY_HUE: Record<CategoryKey, string> = {
  feeding: '#AE5420', // pêche-orangé : repas de bébé
  sleep: '#6C5CE0', // violet : nuits et sommeil
  care: '#1A74A4', // bleu ciel : soins et croissance
  health: '#C83650', // rouge rosé : santé
  cycle: '#C24685', // rose : cycle
  pregnancy: '#9450B8', // orchidée : grossesse
  school: '#23855B', // menthe : école et activités
  couple: '#C9533F', // corail : couple
  family: '#A06E12', // ambre : foyer
};

export interface CategoryColors { accent: string; soft: string; edge: string }

/** Couleurs d'une catégorie dans le thème courant : accent (pastille, pictogramme), aplat léger, liseré. */
export function categoryColors(t: Pick<Theme, 'isDark' | 'name' | 'colors'>, key: CategoryKey): CategoryColors {
  const hue = CATEGORY_HUE[key];
  const accent = t.isDark ? mixHex(hue, '#FFFFFF', t.name === 'night' ? 0.25 : 0.38) : hue;
  const surface = /^#[0-9A-Fa-f]{6}$/.test(t.colors.surface) ? t.colors.surface : t.isDark ? '#24262B' : '#FFFFFF';
  return { accent, soft: mixHex(surface, accent, t.isDark ? 0.16 : 0.1), edge: mixHex(surface, accent, t.isDark ? 0.45 : 0.35) };
}

/** Contraste de l'accent sur l'aplat de sa carte (élément graphique : ≥ 3:1 exigé). */
export function categoryContrast(t: Pick<Theme, 'isDark' | 'name' | 'colors'>, key: CategoryKey): number {
  const c = categoryColors(t, key);
  return contrastRatio(c.accent, c.soft);
}
