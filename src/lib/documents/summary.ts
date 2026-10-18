/**
 * Résumé FIDÈLE d'un document, construit sur l'appareil à partir du texte lu (et corrigé) :
 *  - « document » : phrase ou valeur recopiée telle qu'écrite ;
 *  - « détecté » : élément repéré automatiquement (type, date, auteur) — à vérifier ;
 *  - « explication » : définition générale d'un terme, jamais une interprétation du résultat ;
 *  - « incertain » : passage illisible ou ambigu.
 * Rien n'est ajouté qui ne figure pas dans le texte ; aucun résultat n'est qualifié de normal ou d'anormal ;
 * aucune recommandation de traitement n'est formulée.
 */
import { formatDate, formatList, t as tr } from '@/i18n';
import { categoryLabel } from './taxonomy';
import { glossaryFor } from './glossary';
import { parseDocumentText, type ParsedDocument } from './textParse';

export type SummaryLevel = 'quick' | 'detailed' | 'simple';
export type Origin = 'document' | 'detected' | 'explanation' | 'uncertain' | 'confirmed';
export interface SummaryItem { text: string; origin: Origin; line?: number }
export type SectionKey = 'type' | 'date' | 'author' | 'general' | 'important' | 'values' | 'recommendations' | 'dates' | 'clarify' | 'questions' | 'glossary';
export interface SummarySection { key: SectionKey; items: SummaryItem[] }
export interface DocSummary { level: SummaryLevel; sections: SummarySection[]; unreadable: boolean; parsed: ParsedDocument }

export interface SummaryInput {
  text: string;
  title: string;
  category: string | null;
  customCategory?: string | null;
  /** Date confirmée par l'utilisatrice (fiche du document), sinon null. */
  confirmedDate?: string | null;
}

/** Le texte est-il exploitable ? (sinon : nouvelle numérisation ou saisie manuelle) */
export function isUnreadable(text: string, parsed: ParsedDocument): boolean {
  const letters = (text.match(/[A-Za-zÀ-ÿ]/g) ?? []).length;
  const nonEmpty = text.split('\n').filter((l) => l.trim()).length;
  return letters < 25 || (nonEmpty > 0 && parsed.uncertain.length / nonEmpty > 0.5);
}

const valueText = (v: ParsedDocument['values'][number]) =>
  [`${v.name} : ${v.value}${v.unit ? ` ${v.unit}` : ''}`, v.range ? tr('docs.sum.range', { range: v.range }) : tr('docs.sum.noRange')].join(' — ');

export function buildSummary(input: SummaryInput, level: SummaryLevel): DocSummary {
  const p = parseDocumentText(input.text, input.title);
  const unreadable = isUnreadable(input.text, p);
  const sections: SummarySection[] = [];
  const push = (key: SectionKey, items: SummaryItem[]) => { if (items.length) sections.push({ key, items }); };
  const cat = input.category && input.category !== 'other' ? input.category : p.category;

  // 1. Type
  push('type', [cat
    ? { text: categoryLabel(cat, input.customCategory), origin: input.category && input.category !== 'other' ? 'confirmed' : 'detected' }
    : { text: tr('docs.sum.typeUnknown'), origin: 'uncertain' }]);
  // 2. Date
  if (input.confirmedDate) push('date', [{ text: formatDate(input.confirmedDate), origin: 'confirmed' }]);
  else if (p.documentDate?.iso) push('date', [{ text: `${formatDate(p.documentDate.iso)} (${p.documentDate.raw})`, origin: p.documentDate.ambiguous ? 'uncertain' : 'detected', line: p.documentDate.line }]);
  else push('date', [{ text: tr('docs.sum.noDate'), origin: 'uncertain' }]);
  // 3. Auteur / établissement (seulement s'ils sont écrits)
  push('author', [p.author, p.establishment].filter(Boolean).map((m) => ({ text: m!.text, origin: 'detected' as const, line: m!.line })));

  // 4. Résumé général (description factuelle de ce qui a été repéré)
  const parts: string[] = [];
  if (p.values.length) parts.push(tr('docs.sum.nValues', { count: p.values.length }));
  if (p.medications.length) parts.push(tr('docs.sum.nMeds', { count: p.medications.length }));
  if (p.vaccines.length) parts.push(tr('docs.sum.nVaccines', { count: p.vaccines.length }));
  if (p.deadlines.length) parts.push(tr('docs.sum.nDeadlines', { count: p.deadlines.length }));
  const kind = cat ? categoryLabel(cat, input.customCategory).toLowerCase() : tr('docs.sum.aDocument');
  push('general', [{ text: parts.length ? tr('docs.sum.generalWith', { kind, list: formatList(parts) }) : tr('docs.sum.generalPlain', { kind }), origin: 'detected' }]);

  // 5. Informations importantes : conclusions recopiées
  push('important', p.conclusions.map((c) => ({ text: c.text, origin: 'document' as const, line: c.line })));

  // 6. Valeurs chiffrées (exactes) / ordonnance
  const values: SummaryItem[] = p.values.map((v) => ({ text: valueText(v), origin: v.confidence === 'low' ? 'uncertain' : 'document', line: v.line }));
  for (const m of p.medications) {
    const bits = [m.name, m.dose, m.form, m.instructions, m.duration].filter(Boolean).join(' · ');
    values.push({ text: m.missing.length ? `${bits} — ${tr('docs.sum.medMissing', { list: formatList(m.missing.map((x) => tr(`docs.sum.missing.${x}` as const))) })}` : bits, origin: m.confidence === 'low' || m.missing.includes('dose') ? 'uncertain' : 'document', line: m.line });
  }
  if (p.renewal) values.push({ text: p.renewal, origin: 'document' });
  for (const v of p.vaccines) values.push({ text: v.text, origin: 'document', line: v.line });
  push('values', values);

  // 7. Recommandations écrites dans le document (recopiées)
  push('recommendations', p.recommendations.map((r) => ({ text: r.text, origin: 'document' as const, line: r.line })));
  // 8. Dates et échéances
  push('dates', p.deadlines.map((d) => ({ text: d.text, origin: 'document' as const, line: d.line })));

  // 9. Points à clarifier
  const clarify: SummaryItem[] = p.uncertain.map((u) => ({ text: tr(`docs.sum.unc.${u.reason}` as const, { text: u.text }), origin: 'uncertain' as const, line: u.line }));
  for (const d of p.dates) if (d.ambiguous) clarify.push({ text: tr('docs.sum.ambiguousDate', { date: d.raw }), origin: 'uncertain', line: d.line });
  for (const v of p.values) if (!v.unit) clarify.push({ text: tr('docs.sum.noUnit', { name: v.name }), origin: 'uncertain', line: v.line });
  push('clarify', clarify);

  // 10. Questions à poser (neutres, sans diagnostic)
  const q: SummaryItem[] = [];
  for (const v of p.values.slice(0, 4)) q.push({ text: tr('docs.q.value', { name: v.name }), origin: 'explanation' });
  for (const m of p.medications) {
    if (m.missing.includes('instructions')) q.push({ text: tr('docs.q.howToTake', { name: m.name }), origin: 'explanation' });
    if (m.missing.includes('duration')) q.push({ text: tr('docs.q.howLong', { name: m.name }), origin: 'explanation' });
  }
  if (p.deadlines.length) q.push({ text: tr('docs.q.followUp'), origin: 'explanation' });
  if (p.uncertain.length) q.push({ text: tr('docs.q.illegible'), origin: 'explanation' });
  if (p.vaccines.length) q.push({ text: tr('docs.q.vaccines'), origin: 'explanation' });
  push('questions', q);

  // Explication simple : termes du document définis de façon générale
  if (level === 'simple') push('glossary', glossaryFor(input.text).map((g) => ({ text: `${g.term} — ${g.explanation}`, origin: 'explanation' as const })));

  if (level === 'quick') {
    const keep = new Set<SectionKey>(['type', 'date', 'general', 'important', 'clarify']);
    const quick = sections.filter((s) => keep.has(s.key)).map((s) => (s.key === 'important' || s.key === 'clarify' ? { ...s, items: s.items.slice(0, 3) } : s));
    return { level, sections: quick, unreadable, parsed: p };
  }
  return { level, sections, unreadable, parsed: p };
}
