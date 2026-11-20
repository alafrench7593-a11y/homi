/**
 * 42 — Suivi des analyses médicales : logique pure (testée).
 *
 * Les valeurs sont SAISIES par la personne (nom, valeur, unité, date) ; la « référence du laboratoire » est recopiée
 * telle qu'elle figure sur le compte rendu (« 11,5 – 16 », « < 5 »…) et affichée telle quelle. L'application ne
 * compare jamais une valeur à une norme, ne la qualifie jamais (« basse », « normale »…) et n'en tire aucune
 * conclusion : la lecture d'un résultat appartient au professionnel de santé.
 */
export interface LabResult {
  id: string; user_id: string; pregnancy_id: string | null; document_id: string | null;
  name: string; value: number; unit: string | null; measured_on: string; lab_reference: string | null; note: string | null;
  created_at?: string; updated_at?: string; _pending?: boolean;
}

/** « 12,4 » ou « 12.4 » → 12.4 ; jusqu'à 4 décimales ; rien d'autre (pas d'unité collée, pas de « < 5 »). */
export function parseLabValue(raw: string): number | null {
  const s = raw.trim().replace(/\s/g, '').replace(',', '.');
  if (!/^-?\d{1,9}(\.\d{1,4})?$/.test(s)) return null;
  const v = Number(s);
  return Number.isFinite(v) ? v : null;
}

/** Valeur affichée dans la langue (virgule décimale sauf en anglais), sans zéros inutiles. */
export function formatLabValue(v: number, decimalComma = true): string {
  const s = String(Math.round(v * 10_000) / 10_000);
  return decimalComma ? s.replace('.', ',') : s;
}

export const cleanName = (s: string) => s.trim().replace(/\s+/g, ' ');
/** Clé de regroupement : casse, accents et espaces ignorés (« hémoglobine » = « Hémoglobine  »). */
export const analysisKey = (s: string) => cleanName(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export type LabError = 'lab.err.name' | 'lab.err.value' | 'lab.err.date' | 'lab.err.future' | 'lab.err.unit' | 'lab.err.reference';
export function validateLab(d: { name: string; value: number | null; date: string | null; unit: string; reference: string }, today: string): LabError | null {
  const n = cleanName(d.name);
  if (!n || n.length > 80) return 'lab.err.name';
  if (d.value == null) return 'lab.err.value';
  if (!d.date) return 'lab.err.date';
  if (d.date > today) return 'lab.err.future';
  if (d.unit.trim().length > 24) return 'lab.err.unit';
  if (d.reference.trim().length > 80) return 'lab.err.reference';
  return null;
}

export interface AnalysisGroup {
  key: string; name: string; unit: string | null;
  /** du plus ancien au plus récent */
  entries: LabResult[];
  last: LabResult;
  /** valeurs notées avec une autre unité que la dernière (jamais converties ni mélangées dans la courbe) */
  otherUnits: number;
}

/** Regroupe les valeurs par analyse ; les analyses les plus récemment notées d'abord. */
export function groupByAnalysis(list: LabResult[]): AnalysisGroup[] {
  const map = new Map<string, LabResult[]>();
  for (const r of list) {
    const k = analysisKey(r.name);
    map.set(k, [...(map.get(k) ?? []), r]);
  }
  const out: AnalysisGroup[] = [];
  for (const [key, rows] of map) {
    const entries = [...rows].sort((a, b) => a.measured_on.localeCompare(b.measured_on) || (a.created_at ?? '').localeCompare(b.created_at ?? ''));
    const last = entries[entries.length - 1];
    const unit = last.unit?.trim() || null;
    out.push({ key, name: cleanName(last.name), unit, entries, last, otherUnits: entries.filter((e) => (e.unit?.trim() || null) !== unit).length });
  }
  return out.sort((a, b) => b.last.measured_on.localeCompare(a.last.measured_on) || a.name.localeCompare(b.name));
}

/** Points de la courbe d'une analyse : seulement les valeurs de la même unité que la dernière. */
export function curvePoints(g: AnalysisGroup): { x: number; y: number }[] {
  return g.entries
    .filter((e) => (e.unit?.trim() || null) === g.unit)
    .map((e) => ({ x: Date.parse(`${e.measured_on}T12:00:00Z`), y: e.value }));
}

/** Noms déjà utilisés (pour proposer le même nom et garder une seule courbe par analyse). */
export function knownNames(list: LabResult[]): string[] {
  return groupByAnalysis(list).map((g) => g.name);
}
