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
export const CATEGORY_HUE: Record<CategoryKey, string> = {
  feeding: '#2F6FD6', // bleu : repas de bébé (lumière « bébé » des logos)
  sleep: '#5B55C9', // indigo : nuits et sommeil
  care: '#108A6C', // menthe : soins et croissance (lumière « enfant »)
  health: '#C8364B', // framboise : santé
  cycle: '#C93A78', // rose : cycle (lumière « femme »)
  pregnancy: '#9A4CB8', // mauve : grossesse
  school: '#1F7F9C', // bleu canard : école et activités
  couple: '#C8532F', // pêche-corail : couple (lumière « couple »)
  family: '#A86108', // ambre : foyer (lumière « famille »)
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
