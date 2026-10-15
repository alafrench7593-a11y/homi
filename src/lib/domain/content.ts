/** Sélection des contenus adaptés au parcours, à la semaine de grossesse et à l'âge. */
import type { Article, Journey } from '../types';

export interface ContentContext {
  journeys: Journey[];
  weekSA?: number | null;
  childAgesMonths?: number[];
  postpartum?: boolean;
  multiple?: boolean;
  premium?: boolean;
}

export function articleScore(a: Article, ctx: ContentContext): number {
  let s = 0;
  if (a.journeys.length && !a.journeys.some((j) => ctx.journeys.includes(j))) return -1;
  if (a.journeys.some((j) => ctx.journeys.includes(j))) s += 2;
  if (ctx.weekSA != null && a.min_week != null && a.max_week != null) {
    if (ctx.weekSA >= a.min_week && ctx.weekSA <= a.max_week) s += 3;
    else if (!ctx.childAgesMonths?.length) s -= 2;
  }
  if (a.min_age_months != null && a.max_age_months != null && ctx.childAgesMonths?.length) {
    if (ctx.childAgesMonths.some((m) => m >= a.min_age_months! && m <= a.max_age_months!)) s += 3;
  }
  if (a.postpartum && ctx.postpartum) s += 2;
  if (ctx.multiple && a.tags.includes('jumeaux')) s += 3;
  if (a.is_safety_critical) s += 0.5;
  return s;
}

export function suggestArticles(all: Article[], ctx: ContentContext, n = 3): Article[] {
  return all
    .map((a) => ({ a, s: articleScore(a, ctx) }))
    .filter((x) => x.s >= 0)
    .sort((x, y) => y.s - x.s || y.a.updated_on.localeCompare(x.a.updated_on))
    .slice(0, n)
    .map((x) => x.a);
}

/** Un contenu de sécurité n'est jamais verrouillé, même s'il est marqué premium par erreur. */
export function isLocked(a: Article, premium: boolean): boolean {
  return a.is_premium && !a.is_safety_critical && !premium;
}
