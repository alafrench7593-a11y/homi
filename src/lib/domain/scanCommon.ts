/**
 * Types et outils communs aux deux moteurs du scanner (produits et aliments).
 * Modules purs : aucune dépendance à React, au réseau ou à la base. Testés par Jest.
 *
 * Principes :
 *  - le verdict est TOUJOURS calculé par des règles déterministes et sourcées ;
 *  - aucune règle ne conclut à l'absence de risque : au mieux « selon les informations disponibles » ;
 *  - toute information manquante est listée et fait baisser le niveau de certitude ;
 *  - une identification non confirmée par la personne ⇒ « Informations insuffisantes » / « Impossible à confirmer ».
 */
import { collectSources, type ScanSource } from './scanSources';

export type ScanProfileKind = 'pregnant' | 'breastfeeding' | 'newborn' | 'baby' | 'child' | 'adult';

export interface ScanProfile {
  kind: ScanProfileKind;
  /** Âge exact en mois (nouveau-né : 0, bébé : 0–35, enfant : ≥ 36). Obligatoire pour bébé et enfant. */
  ageMonths?: number | null;
  /** Allergies déclarées (par la personne ou un professionnel) — jamais déduites par l'application. */
  allergies?: string[];
}

export const PROFILE_LABEL: Record<ScanProfileKind, string> = {
  pregnant: 'Personne enceinte',
  breastfeeding: 'Personne qui allaite',
  newborn: 'Nouveau-né',
  baby: 'Bébé',
  child: 'Enfant',
  adult: 'Adulte',
};

export function profileLabel(p: ScanProfile): string {
  const base = PROFILE_LABEL[p.kind];
  if ((p.kind === 'baby' || p.kind === 'child') && p.ageMonths != null) return `${base} (${ageLabel(p.ageMonths)})`;
  return base;
}

export function ageLabel(months: number): string {
  if (months < 24) return `${months} mois`;
  const y = Math.floor(months / 12);
  const m = months % 12;
  return m ? `${y} ans et ${m} mois` : `${y} ans`;
}

/** Âge en mois retenu pour les règles (null si inconnu). */
export function profileAgeMonths(p: ScanProfile): number | null {
  if (p.kind === 'newborn') return 0;
  if (p.kind === 'baby' || p.kind === 'child') return typeof p.ageMonths === 'number' && p.ageMonths >= 0 ? Math.floor(p.ageMonths) : null;
  return null;
}

export const isChildProfile = (p: ScanProfile) => p.kind === 'newborn' || p.kind === 'baby' || p.kind === 'child';

export type Certainty = 'high' | 'medium' | 'low';
export const CERTAINTY_LABEL: Record<Certainty, string> = { high: 'Élevé', medium: 'Moyen', low: 'Faible' };

/** Niveau d'un constat. « professional » : la règle renvoie vers un professionnel de santé. */
/** « prepare » : l'aliment peut convenir s'il est préparé autrement (cuisson, découpe, texture). */
export type FindingLevel = 'info' | 'precaution' | 'prepare' | 'avoid' | 'professional' | 'missing';

export interface Finding {
  id: string;
  level: FindingLevel;
  title: string;
  /** Pourquoi : critère appliqué, exposition, zone, informations manquantes. */
  explanation: string;
  sourceIds: string[];
}

export interface RecallInfo {
  id: string;
  title: string;
  reason: string | null;
  risks?: string | null;
  recommended_action: string | null;
  official_url: string | null;
  source: string;
  published_on: string | null;
  lot_numbers?: string[];
  /** 'gtin' : code-barres identique ; 'brand_name' : correspondance marque + nom, à vérifier. */
  match: 'gtin' | 'brand_name';
  is_demo: boolean;
}

/** État de la vérification des rappels officiels (RappelConso) pour ce produit. */
export interface RecallCheck {
  /** true : la base officielle a bien été interrogée ; false : vérification impossible (hors ligne, démonstration…). */
  checked: boolean;
  source: string;
  error: string | null;
  checkedOn: string;
}

export interface DataSourceInfo {
  label: string;
  url?: string | null;
  retrieved_on?: string | null;
  is_demo: boolean;
}

export { RECALL_DISCLAIMER, FORBIDDEN_PATTERNS, containsForbiddenPhrase } from '../../../supabase/functions/_shared/scan-explain';
export const DEMO_LABEL = 'Données de démonstration';
export const GENERAL_DISCLAIMER =
  'Cette analyse s’appuie uniquement sur les informations disponibles et les sources citées, à leur date. Elle ne remplace pas l’avis d’un professionnel de santé et ne pose aucun diagnostic.';

export const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’']/g, "'").replace(/\s+/g, ' ').trim();

/** Découpe une liste d'ingrédients (INCI ou étiquette alimentaire) en éléments, en respectant les parenthèses. */
export function splitIngredients(text: string | null | undefined): string[] {
  if (!text) return [];
  const cleaned = text
    .replace(/^\s*(ingr[ée]dients?|ingredients?|composition|inci)\s*[:：-]\s*/i, '')
    .replace(/\r?\n+/g, ', ')
    .replace(/\.\s*$/, '');
  const out: string[] = [];
  let depth = 0;
  let cur = '';
  for (const ch of cleaned) {
    if (ch === '(' || ch === '[') depth++;
    if (ch === ')' || ch === ']') depth = Math.max(0, depth - 1);
    if ((ch === ',' || ch === ';' || ch === '•') && depth === 0) {
      if (cur.trim()) out.push(cur.trim());
      cur = '';
    } else cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out.map((s) => s.replace(/\s*\*+$/, '').replace(/^[-–•\s]+/, '').trim()).filter((s) => s.length > 0 && s.length < 160);
}

/** Ordre de gravité des niveaux, du plus au moins contraignant. */
export const LEVEL_ORDER: FindingLevel[] = ['avoid', 'missing', 'prepare', 'professional', 'precaution', 'info'];

export function sortFindings(f: Finding[]): Finding[] {
  return [...f].sort((a, b) => LEVEL_ORDER.indexOf(a.level) - LEVEL_ORDER.indexOf(b.level));
}

export function findingSources(findings: Finding[], extra: string[] = []): ScanSource[] {
  return collectSources([...findings.flatMap((f) => f.sourceIds), ...extra]);
}

/** Texte complet d'une analyse, pour les contrôles de formulation. */
export function analysisText(a: { verdictReason: string; findings: Finding[]; missing: string[]; notes?: string[] }): string {
  return [a.verdictReason, ...a.findings.flatMap((f) => [f.title, f.explanation]), ...a.missing, ...(a.notes ?? [])].join('\n');
}

export const ENGINE_VERSION = 'scanner-rules-2026-10-16';

export function todayIso(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}
