/**
 * Frise de la grossesse (logique pure) : aujourd'hui, les fenêtres d'échographie (périodes indicatives), les vrais
 * rendez-vous notés et le terme, dans l'ordre chronologique. Rien n'est inventé : seules les fenêtres générales
 * officielles (déjà affichées dans le calendrier) et les rendez-vous saisis par la personne sont placés.
 */
export type PregThreadKind = 'today' | 'echo' | 'appt' | 'due';
export type PregThreadState = 'done' | 'now' | 'next' | 'later';

export interface PregThreadItem {
  key: string;
  kind: PregThreadKind;
  /** Date ISO (AAAA-MM-JJ) servant au tri ; pour une fenêtre, son début. */
  date: string;
  /** Fin de fenêtre (échographie). */
  to?: string;
  state: PregThreadState;
  /** Identifiant de la fenêtre (echo_1…) ou du rendez-vous. */
  ref: string;
  /** Rendez-vous réel rattaché à une fenêtre d'échographie. */
  apptId?: string | null;
}

export interface PregThreadInput {
  today: string;
  due: string;
  windows: { key: string; from: string; to: string }[];
  /** Rendez-vous d'échographie rattachés à une fenêtre (clé → id, date ISO du rendez-vous). */
  echoAppts: { key: string; id: string; date: string }[];
  /** Autres rendez-vous de la grossesse. */
  appts: { id: string; date: string }[];
}

const order: Record<PregThreadKind, number> = { today: 1, echo: 0, appt: 0, due: 2 };

export function pregnancyThread({ today, due, windows, echoAppts, appts }: PregThreadInput): PregThreadItem[] {
  const items: PregThreadItem[] = [];
  for (const w of windows) {
    const appt = echoAppts.find((a) => a.key === w.key) ?? null;
    const date = appt ? appt.date : w.from;
    const end = appt ? appt.date : w.to;
    const state: PregThreadState = end < today ? 'done' : date <= today ? 'now' : 'later';
    items.push({ key: `echo-${w.key}`, kind: 'echo', date, to: appt ? undefined : w.to, state, ref: w.key, apptId: appt?.id ?? null });
  }
  for (const a of appts) items.push({ key: `appt-${a.id}`, kind: 'appt', date: a.date, state: a.date < today ? 'done' : a.date === today ? 'now' : 'later', ref: a.id });
  items.push({ key: 'today', kind: 'today', date: today, state: 'now', ref: 'today' });
  if (due >= today) items.push({ key: 'due', kind: 'due', date: due, state: 'later', ref: 'due' });
  items.sort((x, y) => x.date.localeCompare(y.date) || order[x.kind] - order[y.kind]);
  // le premier élément à venir après aujourd'hui (hors terme) devient « le suivant »
  const next = items.find((i) => i.state === 'later' && i.kind !== 'due');
  if (next) next.state = 'next';
  return items;
}

/** Jours entre deux dates ISO (b - a). */
export function daysUntil(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 86_400_000);
}
