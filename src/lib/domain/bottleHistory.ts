/**
 * Historique des biberons — logique pure et DESCRIPTIVE.
 * Aucune appréciation (« suffisant », « trop peu »…), aucune norme, aucun diagnostic :
 * uniquement ce qui a été saisi, regroupé par jour.
 */
import { t as tr, formatDate, formatNumber } from '@/i18n';
import { dayKey, formatClock, formatHM, zonedParts } from './bottleTimer';

export interface BottleLike {
  id: string;
  at: string;
  prepared_ml: number | null;
  consumed_ml: number | null;
  planned_next_ml?: number | null;
  milk_type: string | null;
  note?: string | null;
  created_by?: string | null;
}

export type WithInterval<T> = T & { interval_minutes: number | null };

/** Trie du plus récent au plus ancien et ajoute l'intervalle depuis le biberon précédent. */
export function withIntervals<T extends BottleLike>(bottles: T[]): WithInterval<T>[] {
  const asc = [...bottles].sort((a, b) => a.at.localeCompare(b.at));
  const out = asc.map((b, i) => ({
    ...b,
    interval_minutes: i === 0 ? null : Math.round((Date.parse(b.at) - Date.parse(asc[i - 1].at)) / 60_000),
  }));
  return out.reverse();
}

/** « jeudi 15 octobre » à partir d'une clé AAAA-MM-JJ. */
export function dayLabel(key: string): string {
  const [y, m, d] = key.split('-').map(Number);
  return formatDate(new Date(Date.UTC(y, m - 1, d)), { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).replace(/,/g, '');
}

/** Clés des N derniers jours (le plus récent en premier). */
export function lastDays(n: number, now: Date = new Date(), timeZone?: string): string[] {
  const today = dayKey(now, timeZone);
  const [y, m, d] = today.split('-').map(Number);
  return Array.from({ length: n }, (_, i) => new Date(Date.UTC(y, m - 1, d - i)).toISOString().slice(0, 10));
}

export interface DaySummary { key: string; label: string; count: number; consumedTotal: number; consumedCount: number; preparedTotal: number; preparedCount: number }

/** Regroupement par jour (dans le fuseau de l'appareil, ou celui fourni). */
export function groupByDay<T extends BottleLike>(bottles: T[], timeZone?: string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const b of [...bottles].sort((a, c) => c.at.localeCompare(a.at))) {
    const k = dayKey(b.at, timeZone);
    map.set(k, [...(map.get(k) ?? []), b]);
  }
  return map;
}

/** Totaux par jour sur N jours (jours sans saisie inclus, à zéro). */
export function dailySummaries(bottles: BottleLike[], days = 7, now: Date = new Date(), timeZone?: string): DaySummary[] {
  const groups = groupByDay(bottles, timeZone);
  return lastDays(days, now, timeZone).map((key) => {
    const list = groups.get(key) ?? [];
    const consumed = list.filter((b) => b.consumed_ml != null);
    const prepared = list.filter((b) => b.prepared_ml != null);
    return {
      key, label: dayLabel(key), count: list.length,
      consumedTotal: consumed.reduce((s, b) => s + (b.consumed_ml ?? 0), 0), consumedCount: consumed.length,
      preparedTotal: prepared.reduce((s, b) => s + (b.prepared_ml ?? 0), 0), preparedCount: prepared.length,
    };
  });
}

/** Description d'une prise, sans jugement. */
export function describeBottle(b: WithInterval<BottleLike>, opts: { recordedBy?: string | null; timeZone?: string } = {}): string {
  const parts = [
    b.prepared_ml != null ? tr('l6.bottle.prepared', { ml: String(b.prepared_ml) }) : null,
    b.consumed_ml != null ? tr('l6.bottle.drunk', { ml: String(b.consumed_ml) }) : null,
    b.milk_type ? b.milk_type : null,
    b.interval_minutes != null ? tr('l6.bottle.afterPrevious', { duration: formatHM(b.interval_minutes) }) : null,
    b.planned_next_ml != null ? tr('l6.bottle.plannedNext', { ml: String(b.planned_next_ml) }) : null,
    opts.recordedBy ? tr('l6.bottle.notedBy', { name: opts.recordedBy }) : null,
  ].filter(Boolean);
  const note = b.note?.trim() ? tr('l6.bottle.noteQuoted', { note: b.note.trim() }) : '';
  return `${formatClock(b.at, opts.timeZone)} : ${parts.join(' · ') || tr('l6.bottle.bottle')}${note}`;
}

const cap = (x: string) => `${x[0].toUpperCase()}${x.slice(1)}`;
const fmtMl = (n: number) => tr('l6.bottle.ml', { ml: formatNumber(n).replace(/[\u202f\u00a0]/g, ' ') });

/**
 * Résumé en texte brut des N derniers jours, à partager avec un professionnel.
 * Purement descriptif : ce qui a été saisi, jour par jour.
 */
export function consultationSummary(opts: {
  childName: string;
  bottles: BottleLike[];
  now?: Date;
  days?: number;
  timeZone?: string;
  recordedBy?: (userId: string | null | undefined) => string | null;
}): string {
  const now = opts.now ?? new Date();
  const days = opts.days ?? 7;
  const keys = lastDays(days, now, opts.timeZone);
  const oldest = keys[keys.length - 1];
  // Intervalles calculés sur toutes les saisies fournies (le premier biberon de la période garde son écart avec la veille)
  const enriched = withIntervals(opts.bottles).filter((b) => dayKey(b.at, opts.timeZone) >= oldest && dayKey(b.at, opts.timeZone) <= keys[0]);
  const inRange = enriched;
  const groups = groupByDay(enriched, opts.timeZone);
  const p = zonedParts(now, opts.timeZone);
  const fr = (k: string) => `${k.slice(8, 10)}/${k.slice(5, 7)}`;
  const lines: string[] = [
    tr('l6.bottle.summaryTitle', { name: opts.childName, days: String(days), from: fr(oldest), to: fr(keys[0]) }),
    tr('l6.bottle.summaryDisclaimer'),
    '',
  ];
  for (const s of dailySummaries(inRange, days, now, opts.timeZone)) {
    const list = groups.get(s.key) ?? [];
    const head = s.count
      ? tr('l6.bottle.dayHead', { day: cap(s.label), count: s.count })
        + (s.consumedCount ? tr('l6.bottle.dayDrunk', { total: fmtMl(s.consumedTotal) }) + (s.consumedCount < s.count ? tr('l6.bottle.dayFilledFor', { n: String(s.consumedCount) }) : '') : '')
        + (s.preparedCount ? tr('l6.bottle.dayPrepared', { total: fmtMl(s.preparedTotal) }) : '')
      : tr('l6.bottle.dayNone', { day: cap(s.label) });
    lines.push(head);
    for (const b of list) lines.push(`  ${describeBottle(b, { recordedBy: opts.recordedBy?.(b.created_by) ?? null, timeZone: opts.timeZone })}`);
  }
  const consumed = inRange.filter((b) => b.consumed_ml != null);
  lines.push('');
  lines.push(tr('l6.bottle.period', { count: inRange.length }) + (consumed.length ? tr('l6.bottle.periodDrunk', { total: fmtMl(consumed.reduce((s, b) => s + (b.consumed_ml ?? 0), 0)) }) : '.'));
  lines.push(tr('l6.bottle.generated', { date: `${String(p.day).padStart(2, '0')}/${String(p.month).padStart(2, '0')}/${p.year}`, time: formatClock(now, opts.timeZone) }));
  return lines.join('\n');
}
