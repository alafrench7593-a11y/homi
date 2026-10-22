/**
 * Grossesse et vaccins (logique pure) : symptômes et sécurité, calendrier des échographies, changement de terme,
 * rendez-vous confirmés jamais déplacés, rappels, calendrier vaccinal versionné, plusieurs enfants, séparation des
 * profils, « Mes actions du jour ».
 */
import { SYMPTOM_CARE, SYMPTOMS, EAT_AVOID, EAT_HYGIENE, EAT_INTERESTING, NUTRIENTS, SUPPLEMENT_NOTICE } from '@/content/pregnancyCare';
import { FR_2026 } from '@/content/vaccineCalendars/fr-2026';
import { confirmedOutsideWindow, FORBIDDEN_PHRASES, frequentAt, pregnancySummary, reminderDates, safetyLevel, symptomCard, symptomsFor, ultrasoundWindows, windowState, windowToShow } from '@/lib/domain/pregnancyCare';
import { calendarFromRow, nextDoses, scheduleFor, selectCalendar, vaccineNotice, type VaccineCalendar } from '@/lib/domain/vaccineRules';
import { actionAllowed, actionProfile, availableActions, CHILD_ONLY, CYCLE_ONLY, PREGNANCY_ONLY, shownActions } from '@/lib/domain/dailyActions';
import { appointmentRelevant, reminderRelevant, type RelevanceCtx } from '@/lib/journeys/relevance';
import { addDays } from '@/lib/domain/dates';
import { dueDateFromLmp } from '@/lib/domain/pregnancy';
import { FR } from '@/i18n/dictionaries';
const fr = FR as Record<string, string>;

const LMP = '2026-01-05';
const DUE = dueDateFromLmp(LMP); // 41 SA

describe('calendrier automatique de grossesse', () => {
  it('SA, SG, trimestre, terme', () => {
    const s = pregnancySummary(DUE, addDays(LMP, 12 * 7 + 3));
    expect(s).toMatchObject({ weeksSA: 12, extraDays: 3, weeksSG: 10, trimester: 1, lmp: LMP, due: DUE });
    expect(pregnancySummary(DUE, addDays(LMP, 22 * 7)).trimester).toBe(2);
    expect(pregnancySummary(DUE, addDays(LMP, 31 * 7)).trimester).toBe(3);
  });
  it('fenêtres des trois échographies converties en dates', () => {
    const [e1, e2, e3] = ultrasoundWindows(DUE);
    expect(e1).toMatchObject({ key: 'echo_1', from: addDays(LMP, 77), to: addDays(LMP, 97) }); // 11 SA → 13 SA + 6 j
    expect(e2).toMatchObject({ key: 'echo_2', from: addDays(LMP, 140), to: addDays(LMP, 174) }); // 20 → 24 SA
    expect(e3).toMatchObject({ key: 'echo_3', from: addDays(LMP, 210), to: addDays(LMP, 251) }); // 30 → 35 SA
  });
  it('terme corrigé après une échographie : toutes les fenêtres sont recalculées', () => {
    const later = addDays(DUE, 7);
    const a = ultrasoundWindows(DUE); const b = ultrasoundWindows(later);
    b.forEach((w, i) => expect(w.from).toBe(addDays(a[i].from, 7)));
  });
  it('un rendez-vous confirmé n’est jamais déplacé : seulement signalé s’il sort de la nouvelle fenêtre', () => {
    const appt = { id: 'a1', starts_at: new Date(`${addDays(LMP, 12 * 7)}T10:00:00`).toISOString(), calendar_keys: ['echo_1'] };
    expect(confirmedOutsideWindow([appt], DUE)).toEqual([]);
    const moved = confirmedOutsideWindow([appt], addDays(DUE, -21));
    expect(moved.map((m) => m.id)).toEqual(['a1']);
    expect(appt.starts_at).toBe(new Date(`${addDays(LMP, 12 * 7)}T10:00:00`).toISOString()); // inchangé
  });
  it('accueil : jamais l’échographie du 3e trimestre au début de la grossesse', () => {
    expect(windowToShow(DUE, addDays(LMP, 8 * 7))?.key).toBe('echo_1');
    expect(windowToShow(DUE, addDays(LMP, 15 * 7))?.key).toBe('echo_2');
    expect(windowToShow(DUE, addDays(LMP, 26 * 7))?.key).toBe('echo_3');
    expect(windowState(ultrasoundWindows(DUE)[2], addDays(LMP, 8 * 7))).toBe('later');
  });
  it('rappels : un mois, deux semaines, une semaine avant, la veille, quelques heures avant ; jamais dans le passé', () => {
    const target = new Date(2026, 11, 15, 15, 30);
    const now = new Date(2026, 10, 1, 8, 0);
    const d = reminderDates(target, ['month', 'two_weeks', 'week', 'eve', 'hours'], now);
    expect(d.map((x) => [x.getMonth(), x.getDate(), x.getHours()])).toEqual([[10, 15, 9], [11, 1, 9], [11, 8, 9], [11, 14, 18], [11, 15, 12]]);
    expect(reminderDates(target, ['month'], new Date(2026, 11, 1))).toEqual([]);
    expect(reminderDates(target, ['hours'], now, null, true)).toEqual([]); // heure non précisée : pas de rappel « quelques heures avant »
    const custom = new Date(2026, 11, 10, 20, 0);
    expect(reminderDates(target, ['custom'], now, custom)).toEqual([custom]);
  });
});

describe('« Comment je me sens aujourd’hui ? »', () => {
  it('les mouvements du bébé seulement quand le terme est concerné', () => {
    expect(symptomsFor(10)).not.toContain('movements');
    expect(symptomsFor(22)).toContain('movements');
    expect(symptomsFor(10)).toHaveLength(SYMPTOMS.length - 1);
  });
  it('« Fréquent à ce stade ? » adapté à la semaine', () => {
    expect(frequentAt('nausea', 9)).toBe('frequent');
    expect(frequentAt('nausea', 30)).toBe('unusual');
    expect(frequentAt('headache', 12)).toBe('possible');
    expect(frequentAt('bleeding', 12)).toBe('unusual');
  });
  it('sécurité : saignement au 2e trimestre → maternité ; maux de tête après 20 SA → maternité ; essoufflement intense → urgences', () => {
    expect(safetyLevel({ symptom: 'bleeding', weekSA: 22 })).toBe('maternity');
    expect(safetyLevel({ symptom: 'bleeding', weekSA: 8, intensity: 3 })).toBe('emergency');
    expect(safetyLevel({ symptom: 'headache', weekSA: 30, intensity: 2 })).toBe('maternity');
    expect(safetyLevel({ symptom: 'headache', weekSA: 10, intensity: 1 })).toBeNull();
    expect(safetyLevel({ symptom: 'breathless', weekSA: 30, intensity: 3 })).toBe('emergency');
    expect(safetyLevel({ symptom: 'contractions', weekSA: 30, intensity: 2 })).toBe('maternity');
    expect(safetyLevel({ symptom: 'movements', weekSA: 30 })).toBe('maternity');
    expect(safetyLevel({ symptom: 'discharge', weekSA: 36, frequency: 'continuous' })).toBe('maternity');
  });
  it('intense, inhabituel ou inquiétant : jamais sans information de sécurité', () => {
    for (const s of SYMPTOMS) {
      expect(safetyLevel({ symptom: s.key, weekSA: 20, intensity: 3 })).not.toBeNull();
      expect(safetyLevel({ symptom: s.key, weekSA: 20, worried: true })).not.toBeNull();
    }
  });
  it('trois parties, sources officielles datées, jamais « c’est normal », « aucun danger » ni « inutile de consulter »', () => {
    for (const s of SYMPTOMS) {
      const c = symptomCard({ symptom: s.key, weekSA: 20 });
      expect(c.help.length).toBeGreaterThan(0);
      expect(c.ask.length).toBeGreaterThan(0);
      expect(c.sources.length).toBeGreaterThan(0);
      for (const src of c.sources) { expect(src.url).toMatch(/^https:\/\//); expect(src.consulted_on).toMatch(/^\d{4}-\d{2}-\d{2}$/); }
      const all = [...SYMPTOM_CARE[s.key].help, ...SYMPTOM_CARE[s.key].ask].join(' ');
      for (const f of FORBIDDEN_PHRASES) expect(all).not.toMatch(f);
    }
    for (const k of ['care.feel.freq_frequent', 'care.feel.freq_possible', 'care.feel.freq_unusual', 'care.safety.soon.body', 'care.safety.maternity.body']) for (const f of FORBIDDEN_PHRASES) expect(fr[k]).not.toMatch(f);
    expect(fr['care.feel.freq_frequent']).toBe('Ce symptôme peut être fréquent à ce stade, mais d’autres causes sont possibles.');
  });
});

describe('« Bien manger enceinte »', () => {
  it('jamais de complément recommandé ; B9 : suivre le professionnel', () => {
    expect(SUPPLEMENT_NOTICE).toMatch(/ne recommande aucun complément/);
    const b9 = NUTRIENTS.find((n) => n.key === 'b9')!;
    expect(b9.professional).toMatch(/médecin ou votre sage-femme/);
    for (const n of NUTRIENTS) expect(`${n.why} ${n.where} ${n.professional}`).not.toMatch(/prenez (un|du|de la) (complément|supplément)|\d+\s*(mg|µg)/i);
  });
  it('aliments à éviter, hygiène, repères : sources officielles françaises datées', () => {
    for (const s of [EAT_INTERESTING, EAT_AVOID, EAT_HYGIENE]) {
      expect(s.items.length).toBeGreaterThan(3);
      for (const src of s.sources) expect(src.url).toMatch(/^https:\/\/(www\.)?(ameli\.fr|sante\.fr)/);
    }
    expect(EAT_AVOID.items.map((i) => i.title).join(' ')).toMatch(/Alcool/);
  });
});

describe('calendrier vaccinal versionné', () => {
  const birth = '2026-06-01';
  it('chaque règle : vaccin, âge, dose, population, statut, source datée, version', () => {
    expect(FR_2026).toMatchObject({ country: 'FR', version: '2026' });
    for (const r of FR_2026.rules) {
      expect(r.population).toBeTruthy();
      expect(FR_2026.sources[r.source]?.published).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
  it('dose suivante : écart du calendrier respecté après la dose précédente réellement notée', () => {
    const s = scheduleFor(FR_2026, birth, '2026-09-01', { done: { hexa_1: '2026-08-20' } });
    const h2 = s.find((d) => d.key === 'hexa_2')!;
    expect(h2.date).toBe('2026-10-20'); // 2 mois après la 1re injection, faite plus tard que prévu
    expect(h2.shifted).toBe(true);
    expect(h2).toMatchObject({ index: 2, series: 3 });
    const p2 = s.find((d) => d.key === 'pneumo_2')!;
    expect(p2.date).toBe('2026-10-01'); // dose précédente non notée : date indicative de l’âge
  });
  it('vaccin reporté : état « reporté », jamais compté comme à faire', () => {
    const s = scheduleFor(FR_2026, birth, '2026-08-05', { postponed: { hexa_1: '2026-08-20', pneumo_1: null } });
    expect(s.find((d) => d.key === 'hexa_1')).toMatchObject({ state: 'postponed', postponedTo: '2026-08-20' });
    expect(nextDoses(s).map((d) => d.key)).not.toContain('hexa_1');
  });
  it('plusieurs enfants : calculs séparés, jamais mélangés', () => {
    const lina = scheduleFor(FR_2026, '2026-03-01', '2026-10-22', { done: { hexa_1: '2026-05-01' } });
    const noe = scheduleFor(FR_2026, '2020-09-01', '2026-10-22', {});
    expect(lina.find((d) => d.key === 'hexa_1')!.state).toBe('done');
    expect(noe.find((d) => d.key === 'hexa_1')!.state).not.toBe('done');
    expect(noe.find((d) => d.key === 'menb_1')!.status).toBe('recommended'); // né avant 2023
    expect(lina.find((d) => d.key === 'menb_1')!.status).toBe('mandatory');
  });
  it('mise à jour annuelle : la version publiée en vigueur remplace l’intégrée ; une version future ou invalide est ignorée', () => {
    const next: VaccineCalendar = { ...FR_2026, version: '2027', label: 'Calendrier des vaccinations 2027', effectiveFrom: '2027-04-01', rules: FR_2026.rules.map((r) => (r.key === 'ror_2' ? { ...r, months: 15 } : r)) };
    expect(selectCalendar([FR_2026, next], 'FR', '2026-12-01')!.version).toBe('2026');
    expect(selectCalendar([FR_2026, next], 'FR', '2027-05-01')!.version).toBe('2027');
    expect(selectCalendar([FR_2026], 'BE', '2027-05-01')).toBeNull();
    const row = { country: 'FR', version: '2027', label: 'Calendrier 2027', effective_from: '2027-04-01', updated_on: '2027-04-01', source_url: 'https://exemple.test/2027', rules: next.rules };
    expect(calendarFromRow(row, FR_2026)?.rules).toHaveLength(FR_2026.rules.length);
    expect(calendarFromRow({ ...row, rules: [{ key: 'Bad Key!' }] }, FR_2026)).toBeNull();
    expect(scheduleFor(next, '2026-06-01', '2026-06-02').find((d) => d.key === 'ror_2')!.date).toBe('2027-09-01');
  });
  it('notification : formulation demandée, aucune affirmation qu’un vaccin a été fait', () => {
    expect(vaccineNotice(FR_2026, 'Lina')).toBe('Selon le calendrier vaccinal français 2026, une vaccination est à vérifier prochainement pour Lina. Consultez son carnet de santé ou demandez conseil à un professionnel.');
  });
});

describe('séparation des profils', () => {
  const base: RelevanceCtx = { scope: 'pregnancy', pregnancyId: 'p1', activeScopes: ['pregnancy', 'baby'], trackedChildIds: ['c1'], pregnancyWeek: 10 };
  it('aucun rappel de brossage des dents sur l’accueil grossesse', () => {
    const teeth = { pregnancy_id: null, child_id: null, category: 'custom' as const, deep_link: '/teeth', journey_type: null };
    expect(reminderRelevant(teeth, base)).toBe(false);
    expect(reminderRelevant(teeth, { ...base, scope: 'baby', childId: 'c1' })).toBe(true);
    expect(reminderRelevant({ ...teeth, child_id: 'c1' }, base)).toBe(false);
  });
  it('aucune échographie du 3e trimestre au début de la grossesse', () => {
    const e3 = { pregnancy_id: 'p1', child_id: null, for_parent: false, kind: 'ultrasound' as const, title: 'Échographie du 3e trimestre' };
    expect(appointmentRelevant(e3, base)).toBe(false);
    expect(appointmentRelevant(e3, { ...base, pregnancyWeek: 28 })).toBe(true);
    expect(appointmentRelevant({ ...e3, title: 'Échographie', calendar_keys: ['echo_3'] }, base)).toBe(false);
  });
  it('rappels du cycle jamais sur la grossesse, rappels de grossesse jamais ailleurs', () => {
    const pill = { pregnancy_id: null, child_id: null, category: 'medication' as const, deep_link: '/contraception/reminders', journey_type: null };
    expect(reminderRelevant(pill, { ...base, activeScopes: ['pregnancy', 'avoid'] })).toBe(false);
    expect(reminderRelevant(pill, { ...base, scope: 'avoid', activeScopes: ['pregnancy', 'avoid'] })).toBe(true);
    const echo = { pregnancy_id: null, child_id: null, category: 'ultrasound' as const, deep_link: '/pregnancy/calendar', journey_type: null };
    expect(reminderRelevant(echo, { ...base, scope: 'baby', childId: 'c1' })).toBe(false);
  });
});

describe('« Mes actions du jour »', () => {
  it('quatre raccourcis par défaut, propres à chaque profil', () => {
    expect(shownActions({ profile: 'cycle' }).shown).toEqual(['period', 'cycle_symptom', 'mood', 'contraception']);
    expect(shownActions({ profile: 'ttc' }).shown).toEqual(['ovulation_test', 'mucus', 'temperature', 'appointment']);
    expect(shownActions({ profile: 'pregnancy' }).shown).toEqual(['feel', 'mother_sleep', 'mood', 'eat']);
    expect(availableActions({ profile: 'pregnancy' })).toEqual(expect.arrayContaining(['appointment', 'weight']));
    expect(shownActions({ profile: 'newborn', enabled: ['bottle', 'breastfeed', 'diaper', 'sleep'], ageMonths: 1 }).shown).toEqual(['bottle', 'breastfeed', 'diaper', 'sleep']);
    expect(shownActions({ profile: 'diversification', enabled: ['bottle', 'diaper', 'sleep', 'meal'], ageMonths: 8 }).shown).toEqual(['meal', 'sleep', 'bottle', 'diaper']);
    expect(shownActions({ profile: 'child', enabled: ['sleep', 'meal'], ageMonths: 60 }).shown).toEqual(['meal', 'sleep', 'medication', 'appointment']);
  });
  it('jamais un outil sans rapport avec le profil', () => {
    for (const k of CHILD_ONLY) expect(actionAllowed(k, { profile: 'pregnancy' })).toBe(false);
    for (const k of CYCLE_ONLY) { expect(actionAllowed(k, { profile: 'pregnancy' })).toBe(false); expect(actionAllowed(k, { profile: 'child', enabled: ['sleep', 'meal'], ageMonths: 40 })).toBe(false); }
    for (const k of PREGNANCY_ONLY) expect(actionAllowed(k, { profile: 'cycle' })).toBe(false);
    expect(actionAllowed('weight', { profile: 'pregnancy', hideWeight: true })).toBe(false);
    expect(actionAllowed('bottle', { profile: 'child', enabled: ['bottle', 'sleep'], ageMonths: 40 })).toBe(false);
    expect(actionAllowed('diaper', { profile: 'newborn', enabled: ['bottle', 'sleep'], ageMonths: 1 })).toBe(false);
  });
  it('personnalisation : quatre au plus, un choix devenu impossible est ignoré', () => {
    expect(shownActions({ profile: 'pregnancy' }, ['appointment', 'weight', 'feel']).shown).toEqual(['appointment', 'weight', 'feel']);
    expect(shownActions({ profile: 'pregnancy' }, ['bottle', 'feel']).shown).toEqual(['feel']);
    expect(shownActions({ profile: 'pregnancy' }, ['period']).shown).toEqual(['feel', 'mother_sleep', 'mood', 'eat']);
  });
  it('profil d’actions d’après la portée affichée', () => {
    expect(actionProfile('baby', { ageMonths: 1, enabled: ['bottle'] }, 'baby')).toBe('newborn');
    expect(actionProfile('baby', { ageMonths: 8, enabled: ['meal'] }, 'baby')).toBe('diversification');
    expect(actionProfile('child', { ageMonths: 60, enabled: ['meal'] }, 'child')).toBe('child');
    expect(actionProfile('family')).toBe('none');
  });
});
