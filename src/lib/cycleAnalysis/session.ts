/**
 * Enregistrement d'une analyse (test ou glaire) et cycle de vie de la photo.
 * Règle : quoi qu'il arrive (succès, erreur, abandon), l'image locale est supprimée à la fin.
 * Elle n'est conservée (chiffrée) que si l'utilisatrice l'a demandé explicitement.
 * Les dépendances sont injectées : aucune autre destination (galerie, forum, statistiques) n'est possible.
 */
import type { TestFormat, TestKind } from './brands';
import { storedResult, type AnalysisMethod, type ReadWindowAnswer, type TestOutcome } from './interpret';
import type { MucusCategory, MucusSensation, MucusTexture, PhotoSuggestionResult } from './mucus';

export interface PhotoDeps {
  insert(table: string, row: Record<string, unknown>, onConflict?: string): Promise<unknown>;
  keepPhoto(userId: string, uri: string): Promise<string>;
  discard(uri: string | null | undefined): Promise<void>;
}

export interface TestSave {
  userId: string;
  kind: TestKind;
  ruleId: string | null;
  brandLabel: string | null;
  format: TestFormat;
  testedAt: string;
  minutesAfter: number | null;
  withinReadWindow: ReadWindowAnswer;
  expectedPeriodOn?: string | null;
  analysisOutcome: TestOutcome | null;
  analysisConfidence: number | null;
  method: AnalysisMethod;
  /** Résultat CONFIRMÉ par l'utilisatrice. */
  confirmedOutcome: TestOutcome;
  note: string | null;
  photoUri: string | null;
  keepPhoto: boolean;
}

export function testTable(kind: TestKind) {
  return kind === 'ovulation' ? 'ovulation_tests' : 'pregnancy_tests';
}

export function buildTestRow(s: TestSave, photoPath: string | null): Record<string, unknown> {
  const row: Record<string, unknown> = {
    user_id: s.userId,
    tested_at: s.testedAt,
    result: storedResult(s.kind, s.confirmedOutcome),
    note: s.note?.slice(0, 500) || null,
    brand_id: s.ruleId,
    brand_label: s.brandLabel?.slice(0, 80) ?? null,
    format: s.format,
    minutes_after: s.minutesAfter,
    within_read_window: s.withinReadWindow,
    analysis_outcome: s.analysisOutcome,
    analysis_confidence: s.analysisConfidence,
    analysis_method: s.method,
    user_confirmed: true,
    photo_path: photoPath,
  };
  if (s.kind === 'pregnancy') row.expected_period_on = s.expectedPeriodOn ?? null;
  return row;
}

export async function saveTest(s: TestSave, deps: PhotoDeps): Promise<{ photoPath: string | null }> {
  let photoPath: string | null = null;
  try {
    if (s.keepPhoto && s.photoUri) photoPath = await deps.keepPhoto(s.userId, s.photoUri);
    await deps.insert(testTable(s.kind), buildTestRow(s, photoPath));
    return { photoPath };
  } finally {
    await deps.discard(s.photoUri);
  }
}

export interface MucusSave {
  userId: string;
  observedOn: string;
  category: MucusCategory | null;
  texture: MucusTexture | null;
  sensation: MucusSensation | null;
  note: string | null;
  suggestion: PhotoSuggestionResult | null;
  photoUri: string | null;
  keepPhoto: boolean;
}

export async function saveMucus(s: MucusSave, deps: PhotoDeps): Promise<{ photoPath: string | null }> {
  let photoPath: string | null = null;
  try {
    if (s.keepPhoto && s.photoUri) photoPath = await deps.keepPhoto(s.userId, s.photoUri);
    const row: Record<string, unknown> = {
      user_id: s.userId,
      observed_on: s.observedOn,
      cervical_mucus: s.category,
      mucus_texture: s.texture,
      mucus_sensation: s.sensation,
      note: s.note?.slice(0, 500) || null,
      photo_suggestion: s.suggestion ? s.suggestion.category : null,
      photo_confidence: s.suggestion ? Math.min(1, Math.max(0, s.suggestion.confidence)) : null,
    };
    if (photoPath) row.photo_path = photoPath;
    await deps.insert('fertility_observations', row, 'user_id,observed_on');
    return { photoPath };
  } finally {
    await deps.discard(s.photoUri);
  }
}

/** Abandon (bouton « Supprimer la photo maintenant » ou retour) : suppression immédiate de l'image locale. */
export async function abandonPhoto(uri: string | null | undefined, deps: Pick<PhotoDeps, 'discard'>): Promise<void> {
  await deps.discard(uri);
}
