/** Grossesse et post-partum — fonctions pures du suivi (src/lib/domain/pregTrack.ts). */
import {
  answered, changedFields, checkinsByDay, checklistSplit, countPlan, daysAhead, entriesByDay, KICK, kickSeconds, kickSessions, kicksByDay,
  lastDays, nextAppt, ongoingKick, proposedRange, type KickRow,
} from '@/lib/domain/pregTrack';

const L = (y: number, mo: number, d: number, h = 12, mi = 0) => new Date(y, mo - 1, d, h, mi, 0, 0);
const iso = (d: Date) => d.toISOString();
let n = 0;
const header = (start: Date, end: Date | null, extra: Partial<KickRow> = {}): KickRow => ({
  id: `h${++n}`, symptom: KICK, started_at: iso(start), logged_at: iso(end ?? start), frequency: end ? 'several' : 'continuous', note: null, ...extra,
});
const tap = (start: Date, at: Date): KickRow => ({ id: `t${++n}`, symptom: KICK, started_at: iso(start), logged_at: iso(at), frequency: 'once', note: null });

describe('séances de comptage des mouvements', () => {
  const s1 = L(2026, 11, 22, 14, 0); const s2 = L(2026, 11, 21, 9, 30);
  const rows: KickRow[] = [
    header(s1, null), tap(s1, L(2026, 11, 22, 14, 3)), tap(s1, L(2026, 11, 22, 14, 1)),
    header(s2, L(2026, 11, 21, 9, 50)), tap(s2, L(2026, 11, 21, 9, 35)),
    // mouvement orphelin (séance supprimée ailleurs) et autre symptôme : ignorés
    tap(L(2026, 11, 20, 8, 0), L(2026, 11, 20, 8, 1)), { ...header(s2, null), symptom: 'nausea' },
  ];
  const sessions = kickSessions(rows);

  it('regroupe par début, la plus récente d’abord ; compte = mouvements réellement notés, triés dans le temps', () => {
    expect(sessions.map((s) => s.count)).toEqual([2, 1]);
    expect(sessions[0].ongoing).toBe(true);
    expect(sessions[0].end).toBeNull();
    expect(Date.parse(sessions[0].taps[0].logged_at)).toBeLessThan(Date.parse(sessions[0].taps[1].logged_at));
    expect(sessions[1].ongoing).toBe(false);
    expect(ongoingKick(sessions)?.id).toBe(sessions[0].id);
  });

  it('le minuteur se lit dans la donnée : maintenant − début (en cours), fin − début (terminée), jamais négatif', () => {
    expect(kickSeconds(sessions[0], L(2026, 11, 22, 14, 8))).toBe(8 * 60);
    expect(kickSeconds(sessions[1], L(2026, 11, 22, 23, 0))).toBe(20 * 60);
    expect(kickSeconds(sessions[0], L(2026, 11, 22, 13, 0))).toBe(0);
  });

  it('sept jours : jour sans séance = null (rien de noté), séance sans mouvement = 0', () => {
    const empty = header(L(2026, 11, 19, 10), L(2026, 11, 19, 10, 15));
    const days = kicksByDay(kickSessions([...rows, empty]), L(2026, 11, 22, 15), 7);
    expect(days.map((d) => d.day)).toEqual(['2026-11-16', '2026-11-17', '2026-11-18', '2026-11-19', '2026-11-20', '2026-11-21', '2026-11-22']);
    expect(days.map((d) => d.value)).toEqual([null, null, null, 0, null, 1, 2]);
  });

  it('correction du compte : retire les plus récents ou ajoute à la fin', () => {
    const taps = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
    expect(countPlan(taps, 1)).toEqual({ remove: ['b', 'c'], add: 0 });
    expect(countPlan(taps, 5)).toEqual({ remove: [], add: 2 });
    expect(countPlan(taps, 3)).toEqual({ remove: [], add: 0 });
    expect(countPlan(taps, -2)).toEqual({ remove: ['a', 'b', 'c'], add: 0 });
  });

  it('heures proposées : même minute = secondes d’origine, autour de minuit, futur et plus de 12 h refusés', () => {
    const orig = new Date(2026, 10, 21, 23, 40, 17).toISOString();
    const now = L(2026, 11, 22, 9);
    const same = proposedRange(orig, '23:40', '00:10', now)!;
    expect(same.start.toISOString()).toBe(orig);
    expect(same.end!.getDate()).toBe(22);
    expect(same.end!.getHours()).toBe(0);
    expect(proposedRange(orig, '23:40', null, now)!.end).toBeNull();
    expect(proposedRange(orig, '25:00', null, now)).toBeNull();
    expect(proposedRange(orig, '23:40', '23:30', now)).toBeNull(); // passerait au lendemain 23 h 30 : futur
    expect(proposedRange(new Date(2026, 10, 20, 8).toISOString(), '08:00', '21:00', now)).toBeNull(); // 13 h
  });
});

describe('journaux datés et bilans', () => {
  it('lastDays : du plus ancien à aujourd’hui, y compris au changement de mois', () => {
    expect(lastDays(L(2026, 12, 2), 3)).toEqual(['2026-11-30', '2026-12-01', '2026-12-02']);
  });

  it('entriesByDay : nombre de notes ou null, les plus récentes d’abord', () => {
    const rows = [{ at: iso(L(2026, 11, 22, 8)) }, { at: iso(L(2026, 11, 22, 18)) }, { at: iso(L(2026, 11, 20, 8)) }];
    const d = entriesByDay(rows, (r) => r.at, L(2026, 11, 22, 20), 3);
    expect(d.map((x) => x.value)).toEqual([1, null, 2]);
    expect(d[2].rows[0].at).toBe(rows[1].at);
  });

  it('checkinsByDay et answered : un bilan par jour, réponses comptées sans score', () => {
    const list = [{ checkin_date: '2026-11-22', feeling: 3, fatigue: null, stress: 4, sleep_quality: null }];
    const days = checkinsByDay(list, L(2026, 11, 22), 2);
    expect(days.map((d) => !!d.checkin)).toEqual([false, true]);
    expect(answered(list[0])).toBe(2);
    expect(answered({})).toBe(0);
  });

  it('changedFields : seulement ce qui a bougé', () => {
    expect(changedFields({ a: 1, b: null as number | null }, { a: 1, b: 3 })).toEqual({ b: 3 });
    expect(changedFields({ a: 1 }, { a: 1 })).toEqual({});
  });
});

describe('rendez-vous et listes', () => {
  const now = L(2026, 11, 22, 15);
  it('nextAppt : le plus proche à venir, ni réalisé ni passé de plus d’une heure', () => {
    const list = [
      { id: 'past', starts_at: iso(L(2026, 11, 22, 13)) },
      { id: 'done', starts_at: iso(L(2026, 11, 23, 9)), completed_at: iso(now) },
      { id: 'late', starts_at: iso(L(2026, 11, 30, 9)) },
      { id: 'soon', starts_at: iso(L(2026, 11, 22, 14, 30)) },
    ];
    expect(nextAppt(list, now)?.id).toBe('soon');
    expect(nextAppt([], now)).toBeNull();
  });

  it('daysAhead : jours calendaires', () => {
    expect(daysAhead(iso(L(2026, 11, 22, 23)), now)).toBe(0);
    expect(daysAhead(iso(L(2026, 11, 23, 0, 30)), now)).toBe(1);
    expect(daysAhead(iso(L(2026, 12, 1, 9)), now)).toBe(9);
  });

  it('checklistSplit : restant dans l’ordre, fait ensuite, progression lisible', () => {
    const s = checklistSplit([{ id: 1, position: 2, done: true }, { id: 2, position: 0 }, { id: 3, position: 1, done: false }]);
    expect(s.left.map((x) => x.id)).toEqual([2, 3]);
    expect(s.done.map((x) => x.id)).toEqual([1]);
    expect(s.pct).toBe(33);
    expect(checklistSplit([]).pct).toBe(0);
  });
});
