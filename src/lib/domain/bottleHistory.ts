/**
 * Historique des biberons — logique pure et DESCRIPTIVE.
 * Aucune appréciation (« suffisant », « trop peu »…), aucune norme, aucun diagnostic :
 * uniquement ce qui a été saisi, regroupé par jour.
 */
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

const WEEKDAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

/** « jeudi 15 octobre » à partir d'une clé AAAA-MM-JJ. */
export function dayLabel(key: string): string {
  const [y, m, d] = key.split('-').map(Number);
  const wd = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return `${WEEKDAYS[wd]} ${d} ${MONTHS[m - 1]}`;
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
    b.prepared_ml != null ? `préparé ${b.prepared_ml} ml` : null,
    b.consumed_ml != null ? `bu ${b.consumed_ml} ml` : null,
    b.milk_type ? b.milk_type : null,
    b.interval_minutes != null ? `${formatHM(b.interval_minutes)} après le précédent` : null,
    b.planned_next_ml != null ? `prévu ensuite : ${b.planned_next_ml} ml` : null,
    opts.recordedBy ? `noté par ${opts.recordedBy}` : null,
  ].filter(Boolean);
  const note = b.note?.trim() ? ` — « ${b.note.trim()} »` : '';
  return `${formatClock(b.at, opts.timeZone)} : ${parts.join(' · ') || 'biberon'}${note}`;
}

const fmtMl = (n: number) => `${n.toLocaleString('fr-FR').replace(/ | /g, ' ')} ml`;

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
    `Biberons de ${opts.childName} — ${days} derniers jours (du ${fr(oldest)} au ${fr(keys[0])})`,
    'Relevé des saisies de la famille, sans interprétation. Ne remplace pas l’avis d’un professionnel de santé.',
    '',
  ];
  for (const s of dailySummaries(inRange, days, now, opts.timeZone)) {
    const list = groups.get(s.key) ?? [];
    const head = s.count
      ? `${s.label[0].toUpperCase()}${s.label.slice(1)} : ${s.count} biberon${s.count > 1 ? 's' : ''}`
        + (s.consumedCount ? ` · bu : ${fmtMl(s.consumedTotal)}${s.consumedCount < s.count ? ` (renseigné pour ${s.consumedCount})` : ''}` : '')
        + (s.preparedCount ? ` · préparé : ${fmtMl(s.preparedTotal)}` : '')
      : `${s.label[0].toUpperCase()}${s.label.slice(1)} : aucun biberon enregistré`;
    lines.push(head);
    for (const b of list) lines.push(`  ${describeBottle(b, { recordedBy: opts.recordedBy?.(b.created_by) ?? null, timeZone: opts.timeZone })}`);
  }
  const consumed = inRange.filter((b) => b.consumed_ml != null);
  lines.push('');
  lines.push(`Sur la période : ${inRange.length} biberon${inRange.length > 1 ? 's' : ''} enregistré${inRange.length > 1 ? 's' : ''}` + (consumed.length ? ` ; quantité bue renseignée : ${fmtMl(consumed.reduce((s, b) => s + (b.consumed_ml ?? 0), 0))}.` : '.'));
  lines.push(`Généré par Au fil de nous le ${String(p.day).padStart(2, '0')}/${String(p.month).padStart(2, '0')}/${p.year} à ${formatClock(now, opts.timeZone)}.`);
  return lines.join('\n');
}
