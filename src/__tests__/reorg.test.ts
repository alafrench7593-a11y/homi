/**
 * Réorganisation par profil (mission du 20 octobre 2026) et catégories « Éviter une grossesse » / « Projet bébé » :
 * accueil d'un nouveau-né, parcours grossesse, calendrier du cycle, rappels de vaccins, aide pour la nuit.
 */
import { quickAllowed, quickFor, screenAllowed, toolsFor, TOOLS, type ScopeCtx } from '@/lib/journeys/tools';
import { appointmentRelevant, notificationRelevant, reminderRelevant, type RelevanceCtx } from '@/lib/journeys/relevance';
import { addMonthsISO, byVisit, nextDoses, VACCINE_DOSES, VACCINE_SOURCES, vaccineSchedule } from '@/lib/domain/vaccines';
import { lastNights, nightSummary } from '@/lib/domain/night';
import { dayActions } from '@/lib/domain/cycleCalendar';
import { t as tr } from '@/i18n';
import type { Appointment, Reminder } from '@/lib/types';

const appt = (x: Partial<Appointment>): Appointment => ({ id: 'a', household_id: 'h', pregnancy_id: null, child_id: null, for_parent: false, kind: 'consultation', title: 'Rendez-vous', starts_at: '2026-11-01T10:00:00Z', location_label: null, notes: null, questions: [], ...x });
const rem = (x: Partial<Reminder>): Reminder => ({ id: 'r', user_id: 'u', household_id: 'h', child_id: null, pregnancy_id: null, appointment_id: null, category: 'custom', title: 'Rappel', body: null, schedule: { type: 'once', at: '2026-11-01T09:00:00Z' } as never, timezone: 'Europe/Paris', enabled: true, snoozed_until: null, deep_link: null, created_at: '', updated_at: '', ...x });

describe('accueil d’un nouveau-né : seulement ce qui concerne ce profil', () => {
  // La grossesse est terminée (aucune grossesse visible), Lina est née, un post-partum est en cours
  const baby: RelevanceCtx = { scope: 'baby', childId: 'lina', pregnancyId: null, activeScopes: ['none', 'baby', 'postpartum'], trackedChildIds: ['lina'], postpartum: true };
  it('pas d’échographie du 3e trimestre ni de rendez-vous de grossesse', () => {
    expect(appointmentRelevant(appt({ pregnancy_id: 'p-old', kind: 'ultrasound', title: 'Échographie du 3e trimestre' }), baby)).toBe(false);
    expect(appointmentRelevant(appt({ kind: 'ultrasound', title: 'Échographie du 3e trimestre' }), baby)).toBe(false);
    expect(appointmentRelevant(appt({ title: 'Consultation du 8e mois (SA 33)' }), baby)).toBe(false);
    expect(appointmentRelevant(appt({ child_id: 'lina', kind: 'pediatric', title: 'Pédiatre' }), baby)).toBe(true);
    expect(appointmentRelevant(appt({ child_id: 'noe', kind: 'pediatric', title: 'Pédiatre' }), baby)).toBe(false);
    expect(appointmentRelevant(appt({ kind: 'postnatal', for_parent: true, title: 'Visite postnatale' }), baby)).toBe(true);
  });
  it('rappels et notifications d’un parcours terminé masqués', () => {
    expect(reminderRelevant(rem({ pregnancy_id: 'p-old', category: 'ultrasound' }), baby)).toBe(false);
    expect(reminderRelevant(rem({ journey_type: 'pregnancy' }), baby)).toBe(false);
    expect(reminderRelevant(rem({ child_id: 'lina', category: 'bottle' }), baby)).toBe(true);
    expect(notificationRelevant({ deep_link: '/pregnancy/weight', payload: {}, category: 'reminder' }, baby)).toBe(false);
    expect(notificationRelevant({ deep_link: null, payload: { pregnancy_id: 'p-old' }, category: 'reminder' }, baby)).toBe(false);
    expect(notificationRelevant({ deep_link: '/bottle/lina', payload: { child_id: 'lina' }, category: 'reminder' }, baby)).toBe(true);
    // Après un changement de catégorie (projet bébé → éviter une grossesse), plus de notification « projet bébé »
    expect(notificationRelevant({ deep_link: '/fertility/log', payload: {}, category: 'reminder' }, { activeScopes: ['avoid'], pregnancyId: null, trackedChildIds: [] })).toBe(false);
  });
  it('les essentiels du nouveau-né, l’aide pour la nuit et les infos de la mère ; pas de catégorie post-partum indépendante', () => {
    const ids = toolsFor({ scope: 'baby', childId: 'lina', babyId: 'lina', postpartum: true }).map((x) => x.id);
    for (const id of ['baby_breastfeed', 'baby_bottle', 'baby_bottle_timer', 'baby_diaper', 'kid_sleep', 'kid_growth', 'kid_vaccines', 'baby_foods', 'meals', 'scan_food', 'appointments', 'baby_night_help', 'pp_recovery', 'pp_checkin', 'pp_mental']) expect(ids).toContain(id);
    for (const id of ['kid_journal', 'child_school', 'preg_evolution', 'family_tasks', 'kid_needs']) expect(ids).not.toContain(id);
    // Sans post-partum en cours (coparent, adoption…), pas d'informations de récupération de la mère
    expect(toolsFor({ scope: 'baby', childId: 'lina', babyId: 'lina' }).map((x) => x.id)).not.toContain('pp_recovery');
    expect(TOOLS.some((x) => x.id === 'kid_journal' || x.id === 'child_school')).toBe(false);
    expect(quickAllowed('journal', { scope: 'baby', childId: 'lina' })).toBe(false);
    expect(quickAllowed('nighthelp', { scope: 'baby', childId: 'lina' })).toBe(true);
    expect(quickFor({ scope: 'baby' }).length).toBeLessThanOrEqual(4);
  });
  it('les dents uniquement pour un bébé ou un enfant', () => {
    for (const scope of ['ttc', 'pregnancy', 'avoid', 'none'] as const) expect(toolsFor({ scope }).some((x) => x.id === 'kid_teeth')).toBe(false);
    expect(toolsFor({ scope: 'baby', childId: 'lina' }).some((x) => x.id === 'kid_teeth')).toBe(true);
  });
});

describe('parcours grossesse : seulement les outils prévus', () => {
  const ids = toolsFor({ scope: 'pregnancy', pregnancyId: 'p1' }).map((x) => x.id);
  it('développement, rendez-vous, documents, poids facultatif, sommeil, humeur, repas, préparation, prénoms, articles, sexualité', () => {
    for (const id of ['preg_evolution', 'appointments', 'documents', 'preg_weight', 'sleep', 'mood', 'preg_eat', 'preg_birth_prep', 'preg_names', 'preg_articles', 'preg_intimacy']) expect(ids).toContain(id);
  });
  it('rien d’un bébé né, ni organisation familiale, ni cycle', () => {
    for (const id of ['baby_bottle', 'baby_diaper', 'kid_teeth', 'kid_vaccines', 'family_tasks', 'family_routines', 'avoid_cycle', 'ttc_tests', 'pp_recovery', 'baby_night_help']) expect(ids).not.toContain(id);
  });
  it('rendez-vous de la grossesse visibles sur ce profil, pas ceux d’une ancienne grossesse', () => {
    const c: RelevanceCtx = { scope: 'pregnancy', pregnancyId: 'p1', activeScopes: ['none', 'pregnancy'], trackedChildIds: [] };
    expect(appointmentRelevant(appt({ pregnancy_id: 'p1', kind: 'ultrasound', title: 'Échographie du 2e trimestre' }), c)).toBe(true);
    expect(appointmentRelevant(appt({ pregnancy_id: 'p0', kind: 'ultrasound', title: 'Échographie' }), c)).toBe(false);
    expect(appointmentRelevant(appt({ child_id: 'noe', kind: 'pediatric' }), c)).toBe(false);
  });
});

describe('« Éviter une grossesse » et « Projet bébé » : calendrier du cycle', () => {
  const avoid: ScopeCtx = { scope: 'avoid' };
  const ttc: ScopeCtx = { scope: 'ttc' };
  it('le calendrier est l’outil principal, visible depuis l’accueil', () => {
    expect(quickFor(avoid)[0]).toBe('cyclecal');
    expect(quickFor(ttc)[0]).toBe('cyclecal');
    expect(toolsFor(avoid).map((x) => x.href)).toContain('/cycle/calendar');
    expect(toolsFor(ttc).map((x) => x.href)).toContain('/cycle/calendar');
    expect(screenAllowed('/cycle/calendar', ['avoid'])).toBe(true);
    expect(screenAllowed('/pregnancy', ['ttc'])).toBe(false); // jamais de semaines de grossesse en projet bébé
  });
  it('projet bébé : tests d’ovulation, tests de grossesse, glaire, rappels', () => {
    const ids = toolsFor(ttc).map((x) => x.id);
    for (const id of ['ttc_calendar', 'ttc_tests', 'ttc_mucus', 'ttc_reminders', 'cycle_symptoms']) expect(ids).toContain(id);
    expect(ids).not.toContain('preg_evolution');
  });
  it('toucher un jour : début, fin, correction, suppression', () => {
    const today = '2026-10-20';
    expect(dayActions('2026-10-10', [], today).actions).toEqual([{ kind: 'start' }]);
    const rows = [{ id: 'p1', start_date: '2026-10-10', end_date: null }];
    // Pendant des règles en cours : « fin ce jour » et « supprimer »
    const during = dayActions('2026-10-14', rows, today);
    expect(during.covering?.id).toBe('p1');
    expect(during.actions.map((a) => a.kind)).toEqual(['end', 'delete']);
    // La veille du début noté : corriger le début
    expect(dayActions('2026-10-08', rows, today).actions.map((a) => a.kind)).toContain('moveStart');
    // Un mois plus tard : nouveau début
    expect(dayActions('2026-11-08', [{ id: 'p1', start_date: '2026-10-10', end_date: '2026-10-14' }], '2026-11-10').actions).toEqual([{ kind: 'start' }]);
    // Jamais dans le futur
    expect(dayActions('2026-10-25', rows, today).actions).toEqual([]);
  });
  it('les textes ne présentent jamais un jour comme « sans risque »', () => {
    const txt = [tr('cyc.avoidWarning'), tr('cyc.approx'), tr('cyc.fertile', { from: 'a', to: 'b' }), tr('cycleCard.noteAvoid')].join(' ');
    expect(txt).toMatch(/Aucun jour n’est sans risque|reste possible/);
    expect(txt).toMatch(/approximati/);
    expect(txt).not.toMatch(/jours? sans risque(?! de grossesse, et)/);
  });
});

describe('rappels de vaccins : calendrier officiel daté et sourcé', () => {
  const birth = '2026-08-15';
  it('dates calculées à partir de la date de naissance', () => {
    const s = vaccineSchedule(birth, '2026-10-10');
    expect(s.find((d) => d.key === 'hexa_1')!.date).toBe('2026-10-15');
    expect(s.find((d) => d.key === 'menb_1')!.date).toBe('2026-11-15');
    expect(s.find((d) => d.key === 'ror_1')!.date).toBe('2027-08-15');
    expect(s.find((d) => d.key === 'ror_2')!.dateTo).toBe('2028-02-15');
    expect(addMonthsISO('2026-01-31', 1)).toBe('2026-02-28');
  });
  it('obligatoire ou recommandé selon l’année de naissance ; source et date affichées', () => {
    expect(vaccineSchedule('2026-01-01', '2026-02-01').find((d) => d.key === 'menb_1')!.status).toBe('mandatory');
    expect(vaccineSchedule('2021-01-01', '2026-02-01').find((d) => d.key === 'menb_1')!.status).toBe('recommended');
    expect(vaccineSchedule(birth, '2026-10-10').find((d) => d.key === 'rota_1')!.status).toBe('recommended');
    for (const d of VACCINE_DOSES) { expect(VACCINE_SOURCES[d.source]).toBeDefined(); expect(VACCINE_SOURCES[d.source].published).toMatch(/^\d{4}-\d{2}-\d{2}$/); }
  });
  it('prochaines échéances, fait, prévu, et jamais « en retard »', () => {
    const s = vaccineSchedule(birth, '2026-10-10', { hexa_1: '2026-10-15' }, ['pneumo_1']);
    expect(s.find((d) => d.key === 'hexa_1')!.state).toBe('done');
    expect(s.find((d) => d.key === 'pneumo_1')!.state).toBe('planned');
    expect(s.find((d) => d.key === 'rota_1')!.state).toBe('upcoming');
    const n = nextDoses(s, 3).map((d) => d.key);
    expect(n).toContain('rota_1');
    const old = vaccineSchedule('2025-01-01', '2026-10-10');
    expect(old.find((d) => d.key === 'hexa_1')!.state).toBe('check');
    expect(tr('vx.state.check')).not.toMatch(/retard/i);
    expect(byVisit(s)[0].doses.map((d) => d.key)).toEqual(['hexa_1', 'pneumo_1', 'rota_1']);
  });
});

describe('aide pour la nuit : résumé simple de ce qui a été noté', () => {
  const sleeps = [
    { id: 's1', child_id: 'c', started_at: new Date(2026, 9, 19, 20, 0).toISOString(), ended_at: new Date(2026, 9, 20, 0, 30).toISOString(), wakeups: 0, wake_events: [] },
    { id: 's2', child_id: 'c', started_at: new Date(2026, 9, 20, 1, 0).toISOString(), ended_at: new Date(2026, 9, 20, 6, 0).toISOString(), wakeups: 1 },
    { id: 's3', child_id: 'c', started_at: new Date(2026, 9, 19, 14, 0).toISOString(), ended_at: new Date(2026, 9, 19, 15, 0).toISOString(), wakeups: 0 },
  ] as never[];
  const feeds = [{ id: 'f1', child_id: 'c', side: 'left', started_at: new Date(2026, 9, 20, 0, 40).toISOString(), ended_at: null }] as never[];
  const bottles = [{ id: 'b1', child_id: 'c', at: new Date(2026, 9, 20, 4, 0).toISOString(), prepared_ml: 120, consumed_ml: 100, milk_type: null }] as never[];
  it('sommeil, périodes, réveils et repas de la nuit (pas la sieste)', () => {
    const n = nightSummary('2026-10-19', { sleeps, breastfeeds: feeds, bottles }, new Date(2026, 9, 20, 9, 0));
    expect(n.sleepMinutes).toBe(270 + 300);
    expect(n.periods).toBe(2);
    expect(n.wakings).toBe(2);
    expect(n.feeds).toBe(2);
    expect(n.longestMinutes).toBe(300);
    expect(lastNights(3, { sleeps, breastfeeds: feeds, bottles }, new Date(2026, 9, 20, 9, 0))[0].evening).toBe('2026-10-19');
  });
  it('aucune promesse ni culpabilisation dans les textes', () => {
    const txt = [tr('nh.intro'), tr('nh.summaryNote'), tr('nh.status')].join(' ');
    expect(txt).not.toMatch(/fera ses nuits|faire ses nuits|devrait dormir|mauvais|votre faute/i);
    expect(txt).toMatch(/fréquents/);
  });
});
