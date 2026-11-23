/**
 * Assistant du scanner — règles pures (testées) : étapes, retour à l'étape précédente, identité d'un produit confirmé
 * (pour savoir si les précisions saisies le concernent encore), nature d'une erreur de recherche, tuiles de résultat.
 *
 * Aucune donnée inventée : une tuile dont la source ne dit rien est un ÉTAT INCONNU EXPLICITE (`value: null` + raison),
 * jamais « 0 » ni « aucun ».
 */
import { BackendError } from '@/lib/backend/types';
import type { ConfirmedSubject } from '@/lib/domain/scanFlow';
import type { StoredAnalysis } from './components';

// ---------------------------------------------------------------- étapes
export type WizardStep = 'identify' | 'confirm' | 'profile' | 'details';
export const WIZARD_STEPS: readonly WizardStep[] = ['identify', 'confirm', 'profile', 'details'];

export const stepIndex = (s: WizardStep) => WIZARD_STEPS.indexOf(s);
/** Étape précédente (la première reste la première : la flèche de l'en-tête quitte alors l'écran). */
export const previousStep = (s: WizardStep): WizardStep => WIZARD_STEPS[Math.max(0, stepIndex(s) - 1)];
/** Seules les étapes déjà franchies sont accessibles depuis la progression. */
export const canJumpTo = (current: WizardStep, target: WizardStep) => stepIndex(target) < stepIndex(current);

// ---------------------------------------------------------------- identité du produit confirmé
/**
 * Clé d'identité d'un produit confirmé. Même clé ⇒ les précisions déjà saisies (type, usage, ingrédients…) le
 * concernent toujours et sont CONSERVÉES ; clé différente ⇒ elles décrivaient un autre produit et sont effacées
 * (le profil « pour qui » et les allergies, qui décrivent la personne, restent).
 */
export function subjectKey(s: ConfirmedSubject | null | undefined): string | null {
  if (!s) return null;
  if (s.candidate) return `c:${s.candidate.id ?? ''}:${s.candidate.barcode ?? ''}:${(s.candidate.name ?? '').trim().toLowerCase()}`;
  if (s.ciqual) return `q:${s.ciqual.code}`;
  return `m:${s.barcode ?? ''}:${(s.name ?? '').trim().toLowerCase()}:${(s.brand ?? '').trim().toLowerCase()}`;
}

/** Choix en cours à l'étape « Est-ce bien ce produit ? ». */
export type SubjectPick = { kind: 'candidate'; index: number } | { kind: 'ciqual'; index: number } | { kind: 'manual' } | null;

/** Choix proposé d'office : un seul produit trouvé par son code-barres ⇒ il est présélectionné ; sinon rien. */
export function defaultPick(found: { candidates: number; ciqual: number; byBarcode: boolean }): SubjectPick {
  if (found.byBarcode && found.candidates === 1) return { kind: 'candidate', index: 0 };
  return null;
}

// ---------------------------------------------------------------- erreurs
export type FailureKind = 'network' | 'other';
/** Erreur réseau (hors ligne, serveur injoignable) ou autre (refus, format…). */
export function failureKind(e: unknown): FailureKind {
  if (e instanceof BackendError) return e.isNetwork ? 'network' : 'other';
  if (e instanceof TypeError && /fetch|network|load failed/i.test(e.message)) return 'network';
  return 'other';
}

// ---------------------------------------------------------------- tuiles de résultat
export type TileKey = 'allergens' | 'watch' | 'recalls' | 'source';
export type TileTone = 'neutral' | 'warning' | 'danger';
export interface ResultTile {
  key: TileKey;
  /** Nombre réel (null : inconnu) */
  count: number | null;
  /** Éléments réels cités (noms d'allergènes, d'ingrédients, de constats) */
  items: string[];
  /** Date ISO réelle (tuile « source ») */
  date: string | null;
  /** Raison de l'état inconnu */
  unknown: 'no_composition' | 'not_declared' | 'not_checked' | 'no_date' | null;
  tone: TileTone;
}

const uniq = (xs: string[]) => [...new Set(xs.map((x) => x.trim()).filter(Boolean))];

/** Tuiles d'un résultat enregistré : allergènes, ingrédients à surveiller, rappels officiels, date de la source. */
export function resultTiles(a: StoredAnalysis): ResultTile[] {
  const declared = a.declaredAllergens ?? [];
  let allergens: ResultTile;
  let watch: ResultTile;
  if (a.kind === 'product') {
    const known = a.ingredients.length > 0 || declared.length > 0;
    const list = uniq([...a.fragranceAllergens, ...declared]);
    allergens = { key: 'allergens', count: known ? list.length : null, items: list, date: null, unknown: known ? null : 'no_composition', tone: list.length ? 'warning' : 'neutral' };
    const flagged = a.ingredients.filter((i) => i.flags.length > 0);
    watch = {
      key: 'watch', count: a.ingredients.length ? flagged.length : null, items: uniq(flagged.map((i) => i.name)), date: null,
      unknown: a.ingredients.length ? null : 'no_composition',
      tone: flagged.some((i) => i.flags.includes('declared_allergy')) ? 'danger' : flagged.length ? 'warning' : 'neutral',
    };
  } else {
    // Aliment : la base ne renseigne pas toujours les allergènes ; liste vide ≠ « aucun allergène »
    allergens = { key: 'allergens', count: declared.length ? declared.length : null, items: uniq(declared), date: null, unknown: declared.length ? null : 'not_declared', tone: declared.length ? 'warning' : 'neutral' };
    const points = a.findings.filter((f) => f.level !== 'info' && f.level !== 'missing');
    watch = {
      key: 'watch', count: points.length, items: uniq(points.map((f) => f.title)), date: null, unknown: null,
      tone: points.some((f) => f.level === 'avoid') ? 'danger' : points.length ? 'warning' : 'neutral',
    };
  }
  const checked = !!a.recallCheck?.checked;
  const recalls: ResultTile = {
    key: 'recalls', count: a.recalls.length || checked ? a.recalls.length : null, items: uniq(a.recalls.map((r) => r.title)),
    date: checked ? a.recallCheck?.checkedOn ?? null : null, unknown: a.recalls.length || checked ? null : 'not_checked',
    tone: a.recalls.some((r) => r.match === 'gtin') ? 'danger' : a.recalls.length ? 'warning' : 'neutral',
  };
  const retrieved = a.dataSource.retrieved_on ?? null;
  const source: ResultTile = { key: 'source', count: null, items: [a.dataSource.label], date: retrieved, unknown: retrieved ? null : 'no_date', tone: 'neutral' };
  return [allergens, watch, recalls, source];
}
