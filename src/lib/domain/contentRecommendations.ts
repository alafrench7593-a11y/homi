/**
 * 199 — Recommandations de contenus personnalisées : articles de la bibliothèque choisis à partir des outils que le
 * moteur DÉTERMINISTE recommande (src/lib/personalization, appelé en lecture seule : `recommend` / `buildFacts`
 * ne sont pas modifiés) et des articles de chaque outil (toolArticles.ts). Chaque article garde la RAISON lisible de
 * l'outil qui l'a amené (« Parce que Lina a 8 mois »). Complété, si besoin, par la sélection par profil existante
 * (suggestArticles). Testé : partiels2.test.ts.
 *  - aucun article enregistré (favori) par la personne n’est reproposé ;
 *  - un même article n'apparaît qu'une fois ; au plus `perTool` articles par outil (diversité) ;
 *  - aucune donnée de santé n'est déduite : seules les recommandations d'outils (déjà filtrées par consentement pour
 *    le cycle, la fertilité, la santé mentale) servent de point de départ.
 */
import type { ArticleSummary, Category } from '@/lib/types';
import type { Recommendation, Reason } from '@/lib/personalization';
import { articlesForTool } from './toolArticles';
import { suggestArticles, type ContentContext } from './content';

export interface ContentPick<T> { article: T; reason: Reason | null; toolId: string | null }

export function recommendArticles<T extends ArticleSummary>(o: {
  recommendations: Recommendation[]; articles: T[]; categories?: Category[]; ctx: ContentContext;
  exclude?: Iterable<string>; n?: number; perTool?: number;
}): ContentPick<T>[] {
  const n = o.n ?? 6;
  const perTool = o.perTool ?? 2;
  const skip = new Set(o.exclude ?? []);
  const out: ContentPick<T>[] = [];
  const taken = new Set<string>();
  for (const rec of o.recommendations) {
    if (out.length >= n) break;
    let k = 0;
    for (const a of articlesForTool(rec.id, o.articles, o.categories, perTool + 3)) {
      if (k >= perTool || out.length >= n) break;
      if (taken.has(a.id) || skip.has(a.id)) continue;
      taken.add(a.id); k += 1;
      out.push({ article: a, reason: rec.reason, toolId: rec.id });
    }
  }
  if (out.length < n) {
    for (const a of suggestArticles(o.articles.filter((x) => !taken.has(x.id) && !skip.has(x.id)), o.ctx, n - out.length)) {
      taken.add(a.id);
      out.push({ article: a, reason: null, toolId: null });
    }
  }
  return out;
}
