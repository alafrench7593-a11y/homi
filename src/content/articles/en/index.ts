/**
 * Version anglaise des articles (traductions à relire, comme les textes français « à vérifier »).
 * Un fichier par fichier source français ; clé = identifiant lisible (slug) de l'article.
 * Un article absent d'ici s'affiche en français.
 */
export interface ArticleEn { title: string; summary: string; body_md: string }
export const ARTICLES_EN: Record<string, ArticleEn> = {};
export { CATEGORIES_EN } from './categories';
