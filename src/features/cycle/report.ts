/**
 * Contenu du rapport de cycle (export PDF) : uniquement les rubriques cochées et la période choisie.
 * Les estimations sont signalées comme telles ; le journal intime n'est inclus que s'il est explicitement coché.
 * Fonction pure (testée) : la fabrication du PDF et son partage sont faits ailleurs, sur l'appareil.
 */
import { formatNumber, t as tr, type TKey } from '@/i18n';
import { estimateCycle } from '@/lib/domain/cycle';
import { cycleStats, symptomKeysOf } from '@/lib/domain/cycleV2';
import type { TextSection } from '@/lib/documents/pdf';
import type { PeriodEntry } from '@/lib/types';
import type { SymptomLog } from '@/lib/data/hooks-me';
import type { BleedingLog, DischargeLog, JournalEntry } from '@/lib/data/hooks-cycle2';
import { dl } from './discharge';
import { fmtDayYear } from './format';

export const REPORT_PARTS = ['summary', 'periods', 'symptoms', 'discharge', 'bleeding', 'tests', 'journal'] as const;
export type ReportPart = (typeof REPORT_PARTS)[number];

export interface ReportData {
  periods: PeriodEntry[]; symptoms: SymptomLog[]; discharge: DischargeLog[]; bleeding: BleedingLog[]; journal: JournalEntry[];
  tests: { kind: 'ovulation' | 'pregnancy'; tested_at: string; result: string }[];
}

const daysBetween = (a: string, b: string) => Math.round((Date.parse(`${b.slice(0, 10)}T00:00:00Z`) - Date.parse(`${a.slice(0, 10)}T00:00:00Z`)) / 86_400_000);

export function buildCycleReport(data: ReportData, parts: ReportPart[], fromIso: string | null, todayIso: string): TextSection[] {
  const inRange = (iso: string | null | undefined) => !!iso && (!fromIso || iso.slice(0, 10) >= fromIso) && iso.slice(0, 10) <= todayIso;
  const has = (p: ReportPart) => parts.includes(p);
  const sections: TextSection[] = [];
  const periods = data.periods.filter((p) => inRange(p.start_date)).sort((a, b) => a.start_date.localeCompare(b.start_date));
  const symptoms = data.symptoms.filter((s) => inRange(s.logged_on)).sort((a, b) => a.logged_on.localeCompare(b.logged_on));

  if (has('summary')) {
    const s = cycleStats(periods, symptoms);
    const est = estimateCycle(data.periods);
    const lines = [
      tr('cy.ex.r.cycles', { count: s.cycles.length }),
      s.averageLength != null ? tr('cy.ex.r.avgCycle', { n: formatNumber(s.averageLength), min: formatNumber(s.shortest!), max: formatNumber(s.longest!) }) : tr('cy.st.needTwo'),
      s.averagePeriod != null ? tr('cy.ex.r.avgPeriod', { n: formatNumber(s.averagePeriod) }) : null,
      est.nextPeriod ? tr('cy.ex.r.nextEstimate', { date: fmtDayYear(est.nextPeriod) }) : null,
    ].filter((x): x is string => !!x);
    sections.push({ heading: tr('cy.ex.part.summary'), lines });
  }
  if (has('periods')) {
    sections.push({ heading: tr('cy.ex.part.periods'), lines: periods.length ? periods.map((p) => [
      p.end_date ? tr('cy.history.range', { from: fmtDayYear(p.start_date), to: fmtDayYear(p.end_date) }) : tr('cy.history.since', { from: fmtDayYear(p.start_date) }),
      p.end_date ? tr('cy.history.days', { count: daysBetween(p.start_date, p.end_date) + 1 }) : null,
      p.flow ? tr(`cy.flow.${p.flow}` as TKey) : null,
      p.note,
    ].filter(Boolean).join(' · ')) : [tr('cy.ex.r.none')] });
  }
  if (has('symptoms')) {
    sections.push({ heading: tr('cy.ex.part.symptoms'), lines: symptoms.length ? symptoms.map((s) => {
      const keys = symptomKeysOf(s);
      const wb = (['mood', 'energy', 'sleep', 'stress'] as const).filter((k) => s[k] != null).map((k) => `${tr(`cy.sym.${k}` as TKey)} ${s[k]}/5`);
      return [fmtDayYear(s.logged_on), keys.map((k) => tr(`cy.sym.${k}` as TKey)).join(', ') || null, wb.join(', ') || null, s.note].filter(Boolean).join(' · ');
    }) : [tr('cy.ex.r.none')] });
  }
  if (has('discharge')) {
    const list = data.discharge.filter((d) => inRange(d.observed_at)).sort((a, b) => a.observed_at.localeCompare(b.observed_at));
    sections.push({ heading: tr('cy.ex.part.discharge'), lines: list.length ? list.map((d) => [
      fmtDayYear(d.observed_at),
      d.amount ? dl('amount', d.amount) : null, d.color ? dl('color', d.color) : null,
      ...(d.textures ?? []).map((x) => dl('textures', x)), d.odor ? dl('odor', d.odor) : null,
      ...(d.symptoms ?? []).filter((x) => x !== 'none').map((x) => dl('symptoms', x)), d.note,
    ].filter(Boolean).join(' · ')) : [tr('cy.ex.r.none')] });
  }
  if (has('bleeding')) {
    const list = data.bleeding.filter((b) => inRange(b.occurred_on)).sort((a, b) => a.occurred_on.localeCompare(b.occurred_on));
    sections.push({ heading: tr('cy.ex.part.bleeding'), lines: list.length ? list.map((b) => [
      fmtDayYear(b.occurred_on), tr(`cy.bl.kind.${b.kind}` as TKey), b.amount ? tr(`cy.bl.amount.${b.amount}` as TKey) : null, b.pain ? tr('cy.bl.withPain') : null, b.note,
    ].filter(Boolean).join(' · ')) : [tr('cy.ex.r.none')] });
  }
  if (has('tests')) {
    const list = data.tests.filter((x) => inRange(x.tested_at)).sort((a, b) => a.tested_at.localeCompare(b.tested_at));
    sections.push({ heading: tr('cy.ex.part.tests'), lines: list.length ? list.map((x) => `${fmtDayYear(x.tested_at)} · ${tr(`cy.test.${x.kind}` as TKey)} · ${tr(`cy.test.r.${x.result}` as TKey)}`) : [tr('cy.ex.r.none')] });
  }
  if (has('journal')) {
    const list = data.journal.filter((j) => inRange(j.entry_on)).sort((a, b) => a.entry_on.localeCompare(b.entry_on));
    sections.push({ heading: tr('cy.ex.part.journal'), lines: list.length ? list.map((j) => `${fmtDayYear(j.entry_on)} — ${j.body}`) : [tr('cy.ex.r.none')] });
  }
  return sections;
}
