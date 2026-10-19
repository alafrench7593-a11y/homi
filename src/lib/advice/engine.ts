/**
 * Moteur de conseils : construit le contexte à partir des données ENREGISTRÉES, applique les règles, regroupe.
 * Pur et déterministe (testé). Les conseils sont RECALCULÉS à chaque changement : un événement supprimé
 * ne laisse aucun conseil derrière lui, une réponse modifiée change le conseil (nouvelle signature).
 */
import { estimateCycle } from '@/lib/domain/cycle';
import { RULES, type CycleEvent } from './rules';
import { rank, type Advice, type AdviceContext, type EventRef, type EventType, type FertileStatus, type Match, type Rule } from './types';

const DAY = 86_400_000;
const dayNum = (iso: string) => Math.floor(Date.parse(`${iso.slice(0, 10)}T00:00:00Z`) / DAY);

export interface AdviceInput {
  now: Date;
  today: string;
  journey: AdviceContext['journey'];
  pregnant: boolean;
  periods: AdviceContext['data']['periods'];
  pain: AdviceContext['data']['pain'];
  sex: AdviceContext['data']['sex'];
  discharge: AdviceContext['data']['discharge'];
  bleeding: AdviceContext['data']['bleeding'];
}

/**
 * Fenêtre fertile ESTIMÉE pour une date passée ou future : à partir du début des règles qui précède et du suivant
 * (enregistré, sinon estimé avec la durée moyenne). Ovulation ≈ 14 jours avant les règles suivantes ; fenêtre J-5 à J+1.
 * « near » : à 2 jours ou moins de la fenêtre (les estimations sont imprécises). Jamais une confirmation d'ovulation.
 */
export function fertileStatusOn(periods: { start_date: string }[], iso: string, averageLength: number | null, reliability: string): { status: FertileStatus; reliable: boolean } {
  const starts = periods.map((p) => p.start_date.slice(0, 10)).sort();
  const before = [...starts].reverse().find((s) => s <= iso);
  if (!before) return { status: 'unknown', reliable: false };
  const after = starts.find((s) => s > before);
  const len = averageLength ?? 28;
  const next = after ? dayNum(after) : dayNum(before) + len;
  const ov = next - 14;
  const d = dayNum(iso);
  const reliable = reliability === 'moderate';
  if (d >= ov - 5 && d <= ov + 1) return { status: 'in', reliable };
  if (d >= ov - 7 && d <= ov + 3) return { status: 'near', reliable };
  if (!after && d > next + 7) return { status: 'unknown', reliable: false }; // règles suivantes non enregistrées : on ne sait pas
  return { status: 'out', reliable };
}

function expectedNext(periods: { start_date: string }[], avg: number | null): string | null {
  const last = periods.map((p) => p.start_date.slice(0, 10)).sort().pop();
  if (!last) return null;
  return new Date((dayNum(last) + Math.round(avg ?? 28)) * DAY).toISOString().slice(0, 10);
}

export function buildContext(input: AdviceInput): AdviceContext {
  const est = estimateCycle(input.periods.map((p) => ({ start_date: p.start_date, end_date: p.end_date })) as never, input.today);
  return {
    now: input.now, today: input.today, journey: input.journey, pregnant: input.pregnant,
    fertileStatusOn: (iso) => fertileStatusOn(input.periods, iso, est.averageLength, est.reliability),
    nearRecordedPeriod: (iso) => input.periods.some((p) => {
      const d = dayNum(iso);
      const s = dayNum(p.start_date);
      const e = p.end_date ? dayNum(p.end_date) : s + 6;
      return d >= s - 2 && d <= e + 3;
    }),
    data: { periods: input.periods, pain: input.pain, sex: input.sex, discharge: input.discharge, bleeding: input.bleeding },
    estimate: { nextPeriod: est.nextPeriod, expectedNext: expectedNext(input.periods, est.averageLength), averageLength: est.averageLength, variability: est.variability, reliability: est.reliability },
  };
}

function make<E>(rule: Rule<E>, m: Match, event: EventRef): Advice {
  const triggers = m.triggers;
  return {
    ruleId: rule.id, group: rule.group, priority: m.priority, event, variant: m.variant, params: m.params ?? {},
    triggers, actions: m.actions, clarify: m.clarify, sources: rule.sources, reviewedOn: rule.reviewedOn,
    signature: [rule.id, m.variant, event.type, event.id, triggers.map((t) => `${t.key}${t.params ? JSON.stringify(t.params) : ''}`).join(',')].join('|'),
  };
}

function run<E>(rules: Rule<E>[], events: E[], ref: (e: E) => EventRef, ctx: AdviceContext): Advice[] {
  const out: Advice[] = [];
  for (const e of events) for (const r of rules) {
    const m = r.evaluate(e, ctx);
    if (m) out.push(make(r, m, ref(e)));
  }
  return out;
}

/** Un seul conseil par (événement, groupe) : le plus prioritaire ; les déclencheurs des autres s'y ajoutent. */
export function group(list: Advice[]): Advice[] {
  const byKey = new Map<string, Advice>();
  for (const a of list) {
    const k = `${a.event.type}:${a.event.id}:${a.group}`;
    const cur = byKey.get(k);
    if (!cur) { byKey.set(k, a); continue; }
    const [hi, lo] = rank(a.priority) > rank(cur.priority) ? [a, cur] : [cur, a];
    const keys = new Set(hi.triggers.map((t) => t.key));
    byKey.set(k, { ...hi, triggers: [...hi.triggers, ...lo.triggers.filter((t) => !keys.has(t.key))] });
  }
  return [...byKey.values()].sort((a, b) => rank(b.priority) - rank(a.priority) || b.event.date.localeCompare(a.event.date));
}

/** Fenêtre de pertinence : les conseils concernent les saisies récentes (les plus anciennes restent dans l'historique de saisie). */
export const ADVICE_WINDOW_DAYS = 45;

export function evaluateAdvice(input: AdviceInput): Advice[] {
  const ctx = buildContext(input);
  const recent = (iso: string) => dayNum(input.today) - dayNum(iso) <= ADVICE_WINDOW_DAYS;
  const all = [
    ...run(RULES.sex, input.sex.filter((e) => recent(e.occurred_on)), (e) => ({ type: 'sex', id: e.id, date: e.occurred_on }), ctx),
    ...run(RULES.pain, input.pain.filter((e) => recent(e.logged_on)), (e) => ({ type: 'pain', id: e.id, date: e.logged_on }), ctx),
    ...run(RULES.discharge, input.discharge.filter((e) => recent(e.observed_at)), (e) => ({ type: 'discharge', id: e.id, date: e.observed_at.slice(0, 10) }), ctx),
    ...run(RULES.bleeding, input.bleeding.filter((e) => recent(e.occurred_on)), (e) => ({ type: 'bleeding', id: e.id, date: e.occurred_on }), ctx),
    ...run<CycleEvent>(RULES.cycle, [{ id: 'current', today: input.today }], () => ({ type: 'cycle', id: 'current', date: input.today }), ctx),
  ];
  return group(all);
}

export const forEvent = (list: Advice[], type: EventType, id: string) => list.filter((a) => a.event.type === type && a.event.id === id);
