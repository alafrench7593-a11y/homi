/**
 * Préparation de la demande d'explication IA à partir d'une analyse déjà calculée par les règles.
 * Aucune donnée nominative n'est transmise (pas de prénom, pas de photo) : seulement le profil
 * générique, le produit, les constats et les sources numérotées.
 */
import type { ExplainPayload } from '../../../supabase/functions/_shared/scan-explain';
import { CERTAINTY_LABEL } from './scanCommon';
import { frDate } from './scanSources';
import type { FoodAnalysis } from './scanFood';
import type { ProductAnalysis } from './scanProduct';

export type ScanAnalysis = ProductAnalysis | FoodAnalysis;

export function buildExplainPayload(a: ScanAnalysis): ExplainPayload {
  const index = new Map(a.sources.map((s, i) => [s.id, i + 1]));
  const subject = a.kind === 'product' ? a.product : a.food;
  return {
    kind: a.kind,
    verdict: a.verdict,
    verdictReason: a.verdictReason,
    certainty: CERTAINTY_LABEL[a.certainty],
    profileLabel: a.profileLabel,
    subject: { name: subject.name, brand: subject.brand },
    findings: a.findings.map((f) => ({ level: f.level, title: f.title, explanation: f.explanation, sources: f.sourceIds.map((id) => index.get(id)).filter((n): n is number => !!n) })),
    missing: a.missing,
    sources: a.sources.map((s, i) => ({ n: i + 1, label: s.label, publisher: s.publisher, date: frDate(s.published_on ?? s.consulted_on), url: s.url })),
    demo: a.demo,
  };
}

/** Explication « règles » affichée quand l'IA n'est pas configurée ou indisponible (jamais présentée comme IA). */
export function ruleExplanation(a: ScanAnalysis): { summary: string; points: string[] } {
  const points = a.findings.filter((f) => f.level !== 'info').map((f) => `${f.title} : ${f.explanation}`);
  return {
    summary: `${a.verdict}. ${a.verdictReason}`,
    points: points.length ? points : a.findings.map((f) => `${f.title} : ${f.explanation}`),
  };
}
