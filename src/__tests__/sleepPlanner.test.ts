import {
  clock, DEFAULT_NOTIFY, estimateBefore, feedbackOffset, inQuiet, lastNightReport, learnRhythm, parseHM, planDay, planLines,
  planningAge, planSleepNotifications, proSheet, referenceFor, resizeWindows, sleepTrends, span, tonightInfo, weekView,
  type SleepFeedback, type SleepProfile, type SleepRecord,
} from '@/lib/domain/sleepPlanner';

const D = (d: number, h: number, m = 0) => new Date(2026, 9, d, h, m);
const iso = (d: number, h: number, m = 0) => D(d, h, m).toISOString();
const BIRTH = '2026-04-15'; // ≈ 6 mois le 21/10/2026
const C = 'lina';
const nap = (d: number, h1: number, m1: number, h2: number, m2: number, child = C, id?: string): SleepRecord => ({ id, child_id: child, kind: 'nap', started_at: iso(d, h1, m1), ended_at: iso(d, h2, m2) });
const night = (d: number, h1: number, m1: number, h2: number | null, m2 = 0, child = C): SleepRecord => ({ child_id: child, kind: 'night', started_at: iso(d, h1, m1), ended_at: h2 === null ? null : iso(d + 1, h2, m2) });
const at = (ms: number | undefined | null) => (ms == null ? null : clock(ms));

describe('outils', () => {
  it('formate heures et durées comme dans l’interface', () => {
    expect(clock(D(21, 14, 40))).toBe('14 h 40');
    expect(clock(D(21, 20, 0))).toBe('20 h');
    expect(span(95)).toBe('1 h 35');
    expect(span(45)).toBe('45 min');
    expect(parseHM('19:45')).toBe(1185);
    expect(parseHM('7h')).toBe(420);
    expect(parseHM('25:00')).toBeNull();
  });
  it('choisit un repère par âge et adapte le nombre de siestes', () => {
    expect(referenceFor(6).key).toBe('5-7');
    expect(referenceFor(40).naps).toBe(0);
    const w = resizeWindows([120, 135, 140, 150], 2);
    expect(w).toHaveLength(3);
    expect(w[0]).toBeGreaterThan(120); // moins de siestes → éveils plus longs
  });
  it('utilise l’âge corrigé seulement si le parent le demande', () => {
    const now = D(21, 12);
    expect(planningAge(BIRTH, null, now).months).toBe(6);
    const p: SleepProfile = { child_id: C, gestational_weeks: 32, use_corrected: true };
    const a = planningAge(BIRTH, p, now);
    expect(a.corrected).toBe(true);
    expect(a.months).toBe(4); // 8 semaines de moins
    expect(planningAge(BIRTH, { ...p, use_corrected: false }, now).corrected).toBe(false);
  });
});

describe('planning du jour', () => {
  const base = [night(20, 19, 30, 7, 0), nap(21, 9, 0, 10, 0)];

  it('estime la prochaine sieste, la routine et le coucher (repères généraux)', () => {
    const p = planDay({ childId: C, birthDate: BIRTH, sleeps: base, now: D(21, 11, 0) });
    expect(p.state).toBe('awake');
    expect(p.awakeMinutes).toBe(60);
    expect(p.basis).toBe('learning'); // la nuit d'hier + la sieste du matin sont déjà des relevés
    expect(p.napsDone).toBe(1);
    expect(p.nextNap).not.toBeNull();
    expect(p.nextNap!.routineAt).toBeLessThan(p.nextNap!.at);
    expect(p.bedtime!.from).toBeLessThan(p.bedtime!.to);
    // Planning visuel : nuit, sieste faite, éveil en cours, siestes estimées, routine, coucher
    const kinds = p.items.map((i) => i.kind);
    expect(kinds[0]).toBe('night');
    expect(kinds).toEqual(expect.arrayContaining(['nap', 'awake', 'nap_est', 'routine', 'bedtime']));
    expect(p.daySleepMinutes).toBe(60);
  });

  it('sans aucun relevé personnel : repères généraux uniquement, clairement signalés', () => {
    const p = planDay({ childId: C, birthDate: BIRTH, profile: { child_id: C, usual_wake: '07:00' }, sleeps: [], now: D(21, 8, 0) });
    expect(p.basis).toBe('reference');
    expect(p.assumedWake).toBe(true);
    expect(p.awakeMinutes).toBe(60);
    expect(at(p.nextNap?.at)).toBe('9 h'); // 7 h + 120 min (repère 5-7 mois, 1re fenêtre)
  });

  it('recalcule quand une sieste dure moins ou plus longtemps', () => {
    const short = planDay({ childId: C, birthDate: BIRTH, sleeps: [night(20, 19, 30, 7, 0), nap(21, 9, 0, 9, 25)], now: D(21, 10, 0) });
    const long = planDay({ childId: C, birthDate: BIRTH, sleeps: [night(20, 19, 30, 7, 0), nap(21, 9, 0, 10, 30)], now: D(21, 10, 40) });
    // Sieste courte : prochaine fenêtre raccourcie (facteur < 1) ; sieste longue : fenêtre un peu plus longue
    expect(short.windowMinutes!).toBeLessThan(135);
    expect(long.windowMinutes!).toBeGreaterThan(short.windowMinutes!);
    expect(short.nextNap!.at).toBeLessThan(long.nextNap!.at);
  });

  it('recalcule quand une sieste commence plus tard', () => {
    const early = planDay({ childId: C, birthDate: BIRTH, sleeps: [night(20, 19, 30, 7, 0), nap(21, 9, 0, 10, 0)], now: D(21, 11, 0) });
    const late = planDay({ childId: C, birthDate: BIRTH, sleeps: [night(20, 19, 30, 7, 0), nap(21, 9, 45, 10, 45)], now: D(21, 11, 0) });
    expect(late.nextNap!.at - early.nextNap!.at).toBe(45 * 60_000);
  });

  it('recalcule quand une sieste est supprimée : aucune heure incohérente conservée', () => {
    const withNap = planDay({ childId: C, birthDate: BIRTH, sleeps: base, now: D(21, 10, 30) });
    const deleted = planDay({ childId: C, birthDate: BIRTH, sleeps: [base[0]], now: D(21, 10, 30) });
    expect(withNap.napsDone).toBe(1);
    expect(deleted.napsDone).toBe(0);
    expect(deleted.since).toBe(D(21, 7).getTime());
    // Sans la sieste, l'heure prévue (9 h) est dépassée : l'interface ne l'affiche plus comme « à venir »
    expect(deleted.nextNap!.overdue).toBe(true);
    expect(deleted.nextNap!.at).toBeGreaterThanOrEqual(D(21, 10, 30).getTime());
    expect(at(deleted.nextNap!.initial)).toBe('9 h');
  });

  it('sieste interrompue (en cours) : réveil estimé, puis suite du planning à partir de ce réveil', () => {
    const p = planDay({ childId: C, birthDate: BIRTH, sleeps: [night(20, 19, 30, 7, 0), { child_id: C, kind: 'nap', started_at: iso(21, 9, 0), ended_at: null }], now: D(21, 9, 20) });
    expect(p.state).toBe('asleep_nap');
    expect(p.expectedWake).toBe(D(21, 10, 0).getTime());
    expect(p.nextNap!.at).toBeGreaterThan(p.expectedWake!);
    // Réveil réel plus tôt que prévu : tout se recale
    const woke = planDay({ childId: C, birthDate: BIRTH, sleeps: [night(20, 19, 30, 7, 0), nap(21, 9, 0, 9, 20)], now: D(21, 9, 21) });
    expect(woke.state).toBe('awake');
    expect(woke.nextNap!.at).toBeLessThan(p.nextNap!.at);
  });

  it('ne présente jamais une heure passée comme à venir, quelle que soit l’heure', () => {
    for (let m = 7 * 60 + 5; m < 23 * 60; m += 7) {
      const now = new Date(2026, 9, 21, 0, m);
      const p = planDay({ childId: C, birthDate: BIRTH, sleeps: [night(20, 19, 30, 7, 0)], now });
      if (p.state !== 'awake') continue;
      const N = now.getTime();
      if (p.nextNap) { expect(p.nextNap.at).toBeGreaterThanOrEqual(N - 10 * 60_000); expect(p.nextNap.routineAt).toBeGreaterThanOrEqual(N - 10 * 60_000); }
      if (p.bedtime) { expect(p.bedtime.at).toBeGreaterThanOrEqual(N - 10 * 60_000); expect(p.bedtime.routineAt).toBeGreaterThanOrEqual(N - 10 * 60_000); }
    }
  });

  it('le soir, plus de sieste proposée : prochaine étape = coucher', () => {
    const p = planDay({ childId: C, birthDate: BIRTH, sleeps: [night(20, 19, 30, 7, 0), nap(21, 9, 0, 10, 0), nap(21, 12, 15, 13, 15), nap(21, 15, 30, 16, 30)], now: D(21, 17, 0) });
    expect(p.napsDone).toBe(3);
    expect(p.nextNap).toBeNull();
    expect(p.bedtime!.at).toBeGreaterThan(D(21, 17, 0).getTime());
  });

  it('tient compte du coucher habituel et du nombre de siestes indiqué', () => {
    const profile: SleepProfile = { child_id: C, usual_bedtime: '20:30', nap_count: 2 };
    const p = planDay({ childId: C, birthDate: BIRTH, profile, sleeps: base, now: D(21, 11, 0) });
    expect(p.napsTarget).toBe(2);
    expect(p.bedtime!.at).toBeGreaterThanOrEqual(D(21, 19, 30).getTime());
    expect(p.bedtime!.at).toBeLessThanOrEqual(D(21, 21, 30).getTime());
  });

  it('nuit : pas de sieste prédite ; réveil nocturne suivi séparément', () => {
    const open: SleepRecord = { child_id: C, kind: 'night', started_at: iso(21, 19, 45), ended_at: null, wakeups: 1, wake_events: [{ at: iso(22, 2, 10), open: true }] };
    const p = planDay({ childId: C, birthDate: BIRTH, sleeps: [open], now: D(22, 2, 30) });
    expect(p.state).toBe('night_waking');
    expect(p.awakeMinutes).toBe(20);
    expect(p.nextNap).toBeNull();
    const back = planDay({ childId: C, birthDate: BIRTH, sleeps: [{ ...open, wake_events: [{ at: iso(22, 2, 10), back_at: iso(22, 2, 40), minutes: 30 }] }], now: D(22, 3, 0) });
    expect(back.state).toBe('asleep_night');
  });

  it('relevé oublié (éveil invraisemblable) : pas d’estimation trompeuse', () => {
    const p = planDay({ childId: C, birthDate: BIRTH, sleeps: [night(20, 19, 30, 7, 0)], now: D(21, 18, 0) });
    expect(p.state).toBe('stale');
    expect(p.nextNap).toBeNull();
    expect(p.bedtime).toBeNull();
  });
});

describe('séparation des enfants (jumeaux)', () => {
  it('les relevés, le profil et les retours d’un autre enfant ne changent rien', () => {
    const lina = [night(20, 19, 30, 7, 0), nap(21, 9, 0, 10, 0)];
    const twin = [night(20, 20, 30, 6, 0, 'noe'), nap(21, 8, 0, 8, 30, 'noe'), { child_id: 'noe', kind: 'nap' as const, started_at: iso(21, 10, 45), ended_at: null }];
    const fb: SleepFeedback[] = [1, 2, 3].map((i) => ({ child_id: 'noe', target: 'nap', verdict: 'late', estimated_for: iso(20, 12), created_at: iso(20, 12, i) }));
    const alone = planDay({ childId: C, birthDate: BIRTH, sleeps: lina, now: D(21, 11) });
    const mixed = planDay({ childId: C, birthDate: BIRTH, sleeps: [...lina, ...twin], profile: { child_id: 'noe', nap_count: 1 }, feedback: fb, now: D(21, 11) });
    expect(mixed).toEqual(alone);
    const noe = planDay({ childId: 'noe', birthDate: BIRTH, sleeps: [...lina, ...twin], now: D(21, 11) });
    expect(noe.state).toBe('asleep_nap');
  });
});

describe('apprentissage', () => {
  // 7 jours où Lina fait sa 1re sieste 3 h après le réveil (au lieu des 2 h du repère)
  const history: SleepRecord[] = [];
  for (let d = 13; d <= 20; d++) {
    history.push(night(d - 1, 19, 30, 7, 0));
    history.push(nap(d, 10, 0, 11, 0), nap(d, 14, 0, 15, 0));
  }
  history.push(night(20, 19, 30, 7, 0));

  it('apprend les temps d’éveil propres à l’enfant', () => {
    const l = learnRhythm(history.filter((s) => s.child_id === C), D(21, 8));
    expect(l.byIndex[0].length).toBeGreaterThanOrEqual(7);
    expect(Math.round(l.byIndex[0][0])).toBe(180);
    expect(l.napsPerDay.every((n) => n === 2)).toBe(true);
  });

  it('les estimations se rapprochent de son rythme réel', () => {
    const ref = planDay({ childId: C, birthDate: BIRTH, sleeps: [night(20, 19, 30, 7, 0)], now: D(21, 8) });
    const learned = planDay({ childId: C, birthDate: BIRTH, sleeps: history, now: D(21, 8) });
    expect(learned.basis).toBe('personal');
    expect(learned.napsTarget).toBe(2); // habitude observée
    expect(learned.nextNap!.at).toBeGreaterThan(ref.nextNap!.at);
    expect(learned.nextNap!.at).toBeLessThanOrEqual(D(21, 10).getTime());
  });

  it('« trop tôt » / « trop tard » décalent les prochaines propositions (plafonné)', () => {
    const fb = (verdict: SleepFeedback['verdict'], n: number): SleepFeedback[] => Array.from({ length: n }, (_, i) => ({ child_id: C, target: 'nap', verdict, estimated_for: iso(20, 12), created_at: iso(20, 12, i) }));
    expect(feedbackOffset(fb('early', 2), C, 'nap', D(21, 8))).toBe(20);
    expect(feedbackOffset(fb('late', 5), C, 'nap', D(21, 8))).toBe(-30);
    expect(feedbackOffset([...fb('late', 1), ...fb('right', 3)], C, 'nap', D(21, 8))).toBe(-10);
    expect(feedbackOffset(fb('late', 2), C, 'bedtime', D(21, 8))).toBe(0);
    const p0 = planDay({ childId: C, birthDate: BIRTH, sleeps: [night(20, 19, 30, 7, 0)], now: D(21, 7, 30) });
    const p1 = planDay({ childId: C, birthDate: BIRTH, sleeps: [night(20, 19, 30, 7, 0)], feedback: fb('late', 2), now: D(21, 7, 30) });
    expect(p0.nextNap!.at - p1.nextNap!.at).toBe(20 * 60_000);
  });

  it('retrouve l’estimation affichée avant une sieste pour recueillir l’avis', () => {
    const sleeps = [night(20, 19, 30, 7, 0), nap(21, 9, 30, 10, 30)];
    const e = estimateBefore({ childId: C, birthDate: BIRTH, sleeps }, sleeps[1]);
    expect(e).toEqual({ target: 'nap', at: D(21, 9).getTime() });
  });
});

describe('notifications', () => {
  const sleeps = [night(20, 19, 30, 7, 0), nap(21, 9, 0, 10, 0)];
  const now = D(21, 10, 30);
  const plan = planDay({ childId: C, birthDate: BIRTH, sleeps, now });
  const on = { ...DEFAULT_NOTIFY, enabled: true, quiet_from: null, quiet_to: null };

  it('textes bienveillants, conformes et sans obligation', () => {
    const list = planSleepNotifications(plan, on, 'Lina', 'female', now);
    expect(list.map((n) => n.kind)).toEqual(['signs', 'nap', 'routine']);
    expect(list[0].body).toMatch(/^Lina est éveillée depuis \d h \d\d\. Vous pouvez commencer à observer ses signes de fatigue\.$/);
    expect(list[1].body).toBe(`La prochaine sieste de Lina est estimée autour de ${clock(plan.nextNap!.at)}.`);
    expect(list[2].body).toBe('La routine du soir peut commencer dans 20 minutes.');
    for (const n of list) expect(n.body).not.toMatch(/doit|absolument|il faut/i);
    expect(list[1].at).toBe(plan.nextNap!.at - 20 * 60_000);
    expect(list[2].at).toBe(plan.bedtime!.routineAt - 20 * 60_000);
  });
  it('délai, choix des notifications, jours, plage silencieuse et arrêt complet', () => {
    const lead5 = planSleepNotifications(plan, { ...on, lead: 5 }, 'Lina', 'female', now);
    expect(lead5.find((n) => n.kind === 'nap')!.at).toBe(plan.nextNap!.at - 5 * 60_000);
    expect(planSleepNotifications(plan, { ...on, signs: false, routine: false }, 'Lina', 'female', now).map((n) => n.kind)).toEqual(['nap']);
    expect(planSleepNotifications(plan, { ...on, days: [1, 2] }, 'Lina', 'female', now)).toEqual([]); // le 21/10/2026 est un mercredi
    expect(planSleepNotifications(plan, { ...on, quiet_from: '11:00', quiet_to: '23:00' }, 'Lina', 'female', now)).toEqual([]);
    expect(planSleepNotifications(plan, { ...on, enabled: false }, 'Lina', 'female', now)).toEqual([]);
  });
  it('rien pendant le sommeil ni pour une heure passée ; une notification par enfant', () => {
    const asleep = planDay({ childId: C, birthDate: BIRTH, sleeps: [night(20, 19, 30, null)], now: D(21, 2) });
    expect(planSleepNotifications(asleep, on, 'Lina', 'female', D(21, 2))).toEqual([]);
    const late = planSleepNotifications(plan, on, 'Lina', 'female', D(21, 18));
    expect(late.every((n) => n.at > D(21, 18).getTime())).toBe(true);
    const noe = planDay({ childId: 'noe', birthDate: BIRTH, sleeps: [night(20, 19, 30, 7, 0, 'noe')], now });
    const ids = [...planSleepNotifications(plan, on, 'Lina', 'female', now), ...planSleepNotifications(noe, on, 'Noé', 'male', now)].map((n) => n.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it('plage silencieuse qui passe minuit', () => {
    expect(inQuiet(D(21, 23).getTime(), '21:30', '07:00')).toBe(true);
    expect(inQuiet(D(21, 6).getTime(), '21:30', '07:00')).toBe(true);
    expect(inQuiet(D(21, 12).getTime(), '21:30', '07:00')).toBe(false);
  });
});

describe('textes affichés', () => {
  it('présente des estimations, jamais des obligations', () => {
    const now = D(21, 12, 55);
    const p = planDay({ childId: C, birthDate: BIRTH, sleeps: [night(20, 19, 30, 7, 0), nap(21, 9, 0, 10, 0), nap(21, 11, 20, 11, 20 + 0)].slice(0, 2).concat([nap(21, 11, 0, 11, 20)]), now });
    const lines = planLines(p, 'Lina', 'female', now).map((l) => l.text);
    expect(lines[0]).toMatch(/^Éveillée depuis 1 h 35$/);
    expect(lines.join(' ')).toMatch(/Commencez tranquillement la routine vers \d+ h/);
    expect(lines.join(' ')).toMatch(/Prochaine sieste estimée autour de \d+ h/);
    expect(lines.join(' ')).toMatch(/Coucher du soir estimé entre \d+ h( \d\d)? et \d+ h/);
    expect(lines.join(' ')).not.toMatch(/doit|absolument/i);
  });
});

describe('résumés et tendances', () => {
  const sleeps: SleepRecord[] = [];
  for (let d = 12; d <= 20; d++) {
    sleeps.push({ ...night(d, d < 18 ? 19 : 20, 0, 7, 0), wakeups: d < 18 ? 1 : 3 });
    sleeps.push(nap(d + 1, 10, 0, 11, 0), nap(d + 1, 14, 0, 15, 30));
  }
  it('moyennes de coucher, réveil, siestes et réveils', () => {
    const tr = sleepTrends(sleeps, C, D(21, 12));
    expect(tr.days).toBe(7);
    expect(Math.round(tr.avgWake!)).toBe(420);
    expect(tr.avgNapMinutes).toBe(75);
    expect(tr.avgNaps).toBe(2);
    expect(tr.avgBedtime!).toBeGreaterThan(19 * 60);
    expect(tr.changes.join(' ')).toMatch(/coucher noté .* plus tard/);
    expect(tr.changes.join(' ')).toMatch(/réveil\(s\) de plus par nuit/);
  });
  it('vue sur 7 jours et dernière nuit (réveils, repas nocturnes)', () => {
    const v = weekView(sleeps, C, D(21, 12));
    expect(v).toHaveLength(7);
    expect(v[6].naps).toBe(2);
    const r = lastNightReport(sleeps, C, [{ at: iso(20, 23, 30) }, { at: iso(21, 3, 10) }, { at: iso(21, 9) }], D(21, 12));
    expect(r!.wakings).toBe(3);
    expect(r!.feeds).toBe(2);
    expect(clock(r!.lastFeed!)).toBe('3 h 10');
    expect(r!.sleptMinutes).toBe(11 * 60);
  });
  it('fiche pour un professionnel : uniquement les relevés, sans diagnostic', () => {
    const txt = proSheet('Lina', '6 mois', { child_id: C, difficulties: ['night_wakings'] }, sleeps, C, D(21, 12), 'Réveils vers 3 h');
    expect(txt).toMatch(/Réveils fréquents/);
    expect(txt).toMatch(/Réveils vers 3 h/);
    expect(txt).toMatch(/pas un diagnostic/);
  });
});

describe('aide pour cette nuit', () => {
  it('dernier réveil, dernier repas, sommeil précédent, réveils', () => {
    const n: SleepRecord = { child_id: C, kind: 'night', started_at: iso(21, 20, 0), ended_at: null, wakeups: 2, wake_events: [{ at: iso(21, 23, 30), back_at: iso(21, 23, 50), minutes: 20 }, { at: iso(22, 2, 40), open: true }] };
    const info = tonightInfo([nap(21, 14, 0, 15, 0), n, nap(21, 14, 0, 15, 0, 'noe')], C, [{ at: iso(21, 23, 35) }, { at: iso(21, 18, 0) }], D(22, 2, 50));
    expect(clock(info.lastWake!)).toBe('2 h 40');
    expect(clock(info.lastFeed!)).toBe('23 h 35');
    expect(info.previousSleepMinutes).toBe(170); // 23 h 50 → 2 h 40
    expect(info.wakings).toBe(2);
    // Endormi sans réveil : le sommeil précédent est la dernière sieste
    const calm = tonightInfo([nap(21, 14, 0, 15, 0), { child_id: C, kind: 'night', started_at: iso(21, 20, 0), ended_at: null }], C, [], D(21, 22));
    expect(calm.previousSleepMinutes).toBe(60);
    expect(clock(calm.lastWake!)).toBe('15 h');
  });
});
