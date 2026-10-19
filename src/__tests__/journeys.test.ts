/**
 * Parcours : les 14 scénarios demandés, exécutés sur le vrai code (planificateurs purs + exécution sur le
 * backend de démonstration, qui reproduit les contraintes et déclencheurs SQL — voir aussi supabase/tests/sql/50_parcours.sql).
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('expo-localization', () => ({ getLocales: () => [{ languageTag: 'fr-FR', languageCode: 'fr', regionCode: 'FR' }] }));
jest.mock('@/lib/notifications', () => ({ syncLocalReminders: jest.fn(async () => ({ scheduled: 0, skipped: 0 })) }));
jest.mock('@/lib/backend', () => {
  const { createDemoBackend } = jest.requireActual('@/lib/backend/demo');
  const types = jest.requireActual('@/lib/backend/types');
  return { ...types, backend: createDemoBackend(), isDemo: true };
});

import { backend, eq } from '@/lib/backend';
import { CHILD_TABS } from '@/lib/domain/childTabs';
import { addDays, todayISO } from '@/lib/domain/dates';
import { pregnancyProgress } from '@/lib/domain/pregnancy';
import { runOps } from '@/lib/journeys/manager';
import { activeOf, computeDue, deleteOps, isEstimatedDue, planChange, planEndPregnancy, planStartPregnancy, visiblePregnancy, type JourneyRow } from '@/lib/journeys/model';
import { quickAllowed, quickFor, screenAllowed, toolsFor, type ScopeCtx } from '@/lib/journeys/tools';
import type { Child, Pregnancy, Reminder } from '@/lib/types';
import { uuid } from '@/lib/uuid';

const today = todayISO();
let userId = '';
let hid = '';
const rows = () => backend.select<JourneyRow>({ table: 'user_journeys' });
const pregnancies = () => backend.select<Pregnancy>({ table: 'pregnancies' });
const ids = (c: ScopeCtx) => toolsFor(c).map((x) => x.id);
const FEEDING_DIAPERS = ['baby_breastfeed', 'baby_bottle_timer', 'baby_bottle', 'baby_bottle_history', 'baby_diaper', 'baby_foods', 'pp_feeding', 'pp_bottle'];

beforeAll(async () => {
  await backend.auth.signUp('parcours@exemple.test', 'MotDePasse!2026');
  userId = (await backend.auth.getSession())!.userId;
  hid = await backend.rpc<string>('create_household', { p_name: 'Foyer test' });
});

describe('les 14 scénarios de parcours', () => {
  let pid = '';

  it('1. Projet bébé : aucune semaine de grossesse affichée, même si une ancienne grossesse est restée « active »', async () => {
    await runOps(planChange(await rows(), userId, { type: 'ttc' }, 'archive', today));
    // Projet bébé commencé il y a deux mois
    await backend.update('user_journeys', { started_on: addDays(today, -60) }, [eq('type', 'ttc')]);
    // Donnée héritée : une grossesse « active » sans parcours (c'est ce qui affichait « 26 SA + 1 j »)
    await backend.insert('pregnancies', { household_id: hid, carrier_user_id: userId, status: 'active', due_date: addDays(today, 105), due_date_source: 'due_date', multiplicity: 'twins', topics: [] });
    expect(visiblePregnancy(await pregnancies(), await rows())).toBeNull();
    expect(ids({ scope: 'ttc' })).not.toContain('preg_evolution');
    expect(ids({ scope: 'ttc' })).toEqual(expect.arrayContaining(['ttc_cycle', 'ttc_tests', 'ttc_mucus', 'ttc_temperature', 'ttc_intimacy', 'ttc_start_pregnancy', 'community']));
    for (const k of FEEDING_DIAPERS) expect(ids({ scope: 'ttc' })).not.toContain(k);
    const [profile] = await backend.select<{ journeys: string[] }>({ table: 'profiles', filters: [eq('id', userId)] });
    expect(profile.journeys).toEqual(['ttc']);
    // Nettoyage de la donnée héritée pour la suite
    for (const p of await pregnancies()) await backend.remove('pregnancies', [eq('id', p.id)]);
  });

  it('2 et 3. Projet bébé → grossesse (un bébé) : terme calculé avec les seules dates saisies, projet bébé archivé', async () => {
    await backend.insert('period_entries', { start_date: addDays(today, -40) });
    await backend.insert('reminders', { user_id: userId, household_id: hid, category: 'tracking', title: 'Test d’ovulation', schedule: { type: 'daily', hour: 8, minute: 0 }, enabled: true, deep_link: '/fertility/log' });
    pid = uuid();
    const lmp = addDays(today, -35);
    await runOps(planStartPregnancy(await rows(), userId, hid, { lmp, positiveTest: addDays(today, -5), multiplicity: 'single', nicknames: ['Petit pois'] }, 'archive', today, { pregnancy: pid }));
    const all = await rows();
    expect(all.find((r) => r.type === 'ttc')).toMatchObject({ status: 'archived', end_reason: 'pregnancy' });
    const p = visiblePregnancy(await pregnancies(), all)!;
    expect(p.id).toBe(pid);
    expect(p.due_date).toBe(addDays(lmp, 287));
    expect(isEstimatedDue(p)).toBe(false);
    expect(pregnancyProgress(p.due_date).weeksSA).toBe(5);
    const babies = await backend.select<{ nickname: string }>({ table: 'expected_babies', filters: [eq('pregnancy_id', pid)] });
    expect(babies.map((b) => b.nickname)).toEqual(['Petit pois']);
  });

  it('12. Les notifications de l’ancien parcours sont arrêtées après le changement', async () => {
    const [r] = await backend.select<Reminder>({ table: 'reminders', filters: [eq('title', 'Test d’ovulation')] });
    expect(r.journey_type).toBe('ttc');
    expect(r.enabled).toBe(false);
  });

  it('13. Les données archivées sont conservées', async () => {
    const periods = await backend.select({ table: 'period_entries' });
    expect(periods).toHaveLength(1);
    expect((await rows()).filter((r) => r.status === 'archived')).toHaveLength(1);
  });

  it('9. Parcours grossesse : ni biberons, ni tétées, ni couches, ni minuteur, ni diversification', () => {
    const preg = ids({ scope: 'pregnancy', pregnancyId: pid });
    for (const k of FEEDING_DIAPERS) expect(preg).not.toContain(k);
    expect(preg).toEqual(expect.arrayContaining(['preg_evolution', 'preg_weight', 'preg_birth_prep', 'preg_names', 'preg_lists', 'appointments', 'documents', 'scan_food', 'meals', 'ask', 'community']));
    for (const k of ['bottle', 'breastfeed', 'diaper']) expect(quickAllowed(k, { scope: 'pregnancy' })).toBe(false);
    expect(quickFor({ scope: 'pregnancy' })).not.toContain('bottle');
    expect(screenAllowed('/bottle/abc', ['pregnancy', 'none'])).toBe(false);
    expect(screenAllowed('/track/bottle', ['pregnancy', 'none'])).toBe(false);
    expect(screenAllowed('/track', ['pregnancy', 'none'])).toBe(true); // l'onglet Suivi reste accessible
    expect(toolsFor({ scope: 'pregnancy' }).find((t) => t.id === 'community')?.href).toContain('space=grossesse');
  });

  it('4. Nouvelle grossesse avec des jumeaux : deux bébés attendus, terme estimé si seule la date du test est connue', () => {
    const due = computeDue({ positiveTest: today, multiplicity: 'twins', nicknames: [] })!;
    expect(due.estimated).toBe(true);
    expect(due.source).toBe('positive_test');
    const ops = planStartPregnancy([], 'u', 'h', { positiveTest: today, multiplicity: 'twins', nicknames: ['A', ''] }, 'archive', today, { pregnancy: 'p2' });
    const babies = ops.find((o) => o.kind === 'insert' && o.table === 'expected_babies');
    expect((babies as unknown as { row: { __many: { nickname: string | null }[] } }).row.__many.map((b) => b.nickname)).toEqual(['A', null]);
    expect(() => planStartPregnancy([], 'u', 'h', { multiplicity: 'single', nicknames: [] }, 'archive', today, { pregnancy: 'p3' })).toThrow('missing_dates');
  });

  it('7. Enceinte avec un enfant déjà né : les deux parcours coexistent, chacun avec ses outils', async () => {
    const [noe] = await backend.insert<Child>('children', { household_id: hid, first_name: 'Noé', birth_date: addDays(today, -6 * 365) });
    await runOps(planChange(await rows(), userId, { type: 'child', childId: noe.id, householdId: hid }, 'archive', today));
    const act = activeOf(await rows(), userId);
    expect(act.map((r) => r.type).sort()).toEqual(['child', 'pregnancy']);
    expect(visiblePregnancy(await pregnancies(), await rows())?.id).toBe(pid);
    expect(ids({ scope: 'child', childId: noe.id })).toEqual(expect.arrayContaining(['kid_growth', 'kid_needs', 'kid_treatments', 'kid_teeth', 'meals']));
  });

  it('5. Fin de grossesse : un profil par bébé, post-partum ouvert, plus de semaine d’aménorrhée ni de rappel de grossesse', async () => {
    await backend.insert('reminders', { user_id: userId, household_id: hid, category: 'tracking', title: 'Mon poids', schedule: { type: 'weekly', weekdays: [1], hour: 8, minute: 0 }, enabled: true, deep_link: '/pregnancy/weight' });
    const kids = [uuid(), uuid()];
    await runOps(planEndPregnancy(await rows(), userId, pid, hid, 'born', [
      { first_name: 'Lina', birth_date: today, birth_time: '08:42', weight_g: 2650, length_cm: 46.5, term_weeks: 37, sex: 'female' },
      { first_name: 'Adam', birth_date: today, weight_g: 2810, sex: 'male' },
    ], today, { children: kids, group: uuid() }));
    const children = await backend.select<Child>({ table: 'children', filters: [eq('from_pregnancy_id', pid)] });
    expect(children.map((c) => c.first_name).sort()).toEqual(['Adam', 'Lina']);
    expect(children.find((c) => c.first_name === 'Lina')).toMatchObject({ birth_time: '08:42', birth_weight_g: 2650, birth_length_cm: 46.5, birth_term_weeks: 37 });
    expect(visiblePregnancy(await pregnancies(), await rows())).toBeNull();
    const act = activeOf(await rows(), userId).map((r) => r.type).sort();
    expect(act).toEqual(['baby', 'baby', 'child', 'postpartum']);
    const [w] = await backend.select<Reminder>({ table: 'reminders', filters: [eq('title', 'Mon poids')] });
    expect(w.enabled).toBe(false);
    const ppTools = ids({ scope: 'postpartum', babyId: kids[0] });
    expect(ppTools).toEqual(expect.arrayContaining(['pp_recovery', 'pp_body', 'pp_mental', 'pp_feeding']));
    expect(ids({ scope: 'postpartum' })).not.toContain('pp_feeding'); // allaitement ou biberon seulement si un bébé est suivi
  });

  it('10. Le minuteur de biberon est présent dans le profil bébé (et seulement là)', async () => {
    const [lina] = await backend.select<Child>({ table: 'children', filters: [eq('first_name', 'Lina')] });
    const t = toolsFor({ scope: 'baby', childId: lina.id }).find((x) => x.id === 'baby_bottle_timer');
    expect(t?.href).toBe(`/bottle/${lina.id}`);
    expect(quickFor({ scope: 'baby', childId: lina.id })).toEqual(['bottle', 'breastfeed', 'diaper', 'sleep']);
    expect(ids({ scope: 'child', childId: 'x' })).not.toContain('baby_bottle_timer');
  });

  it('8. Changer d’enfant : outils et actions rapides suivent l’enfant affiché', async () => {
    const [lina] = await backend.select<Child>({ table: 'children', filters: [eq('first_name', 'Lina')] });
    const [noe] = await backend.select<Child>({ table: 'children', filters: [eq('first_name', 'Noé')] });
    const a = toolsFor({ scope: 'baby', childId: lina.id });
    const b = toolsFor({ scope: 'child', childId: noe.id });
    expect(a.find((x) => x.id === 'kid_growth')?.href).toBe(`/child/${lina.id}/growth`);
    expect(b.find((x) => x.id === 'kid_growth')?.href).toBe(`/child/${noe.id}/growth`);
    expect(b.some((x) => x.id === 'baby_bottle')).toBe(false);
    expect(quickFor({ scope: 'child', childId: noe.id })).toEqual(['meal', 'sleep', 'growth', 'treatment']);
  });

  it('11. La catégorie neurodéveloppement est dans la fiche enfant et dans « Tous mes outils »', async () => {
    expect(CHILD_TABS.some((x) => x.value === 'besoins')).toBe(true);
    const [noe] = await backend.select<Child>({ table: 'children', filters: [eq('first_name', 'Noé')] });
    expect(toolsFor({ scope: 'child', childId: noe.id }).find((x) => x.id === 'kid_needs')?.href).toBe(`/child/${noe.id}/needs`);
    // Traitement recopié de l'ordonnance : jamais de dose calculée
    const [t] = await backend.insert<{ id: string; dose_text: string }>('child_treatments', { child_id: noe.id, name: 'Traitement prescrit', dose_text: '1 comprimé (ordonnance)', times: ['08:00'], start_date: today });
    expect(t.dose_text).toBe('1 comprimé (ordonnance)');
  });

  it('6. Retour volontaire vers Projet bébé (depuis une grossesse) : la grossesse est fermée sans précision', async () => {
    const p2 = uuid();
    // Nouvelle grossesse : jamais de données de l'ancienne (pas de bébés, pas de poids repris)
    await runOps(planStartPregnancy(await rows(), userId, hid, { positiveTest: today, multiplicity: 'single', nicknames: [] }, 'archive', today, { pregnancy: p2 }));
    expect(await backend.select({ table: 'expected_babies', filters: [eq('pregnancy_id', p2)] })).toHaveLength(1);
    expect(isEstimatedDue(visiblePregnancy(await pregnancies(), await rows())!)).toBe(true);
    await runOps(planChange(await rows(), userId, { type: 'ttc' }, 'archive', today, [p2]));
    const [p] = await backend.select<Pregnancy>({ table: 'pregnancies', filters: [eq('id', p2)] });
    expect(p).toMatchObject({ status: 'ended', end_reason: 'unspecified' });
    expect(visiblePregnancy(await pregnancies(), await rows())).toBeNull();
    expect(activeOf(await rows(), userId).find((r) => ['avoid', 'ttc', 'cycle', 'pregnancy'].includes(r.type))?.type).toBe('ttc');
  });

  it('14. Suppression définitive demandée : seul le parcours choisi et ses données datées sont effacés', async () => {
    const first = (await rows()).find((r) => r.type === 'ttc' && r.status === 'archived')!;
    await runOps(deleteOps(first));
    const after = await rows();
    expect(after.some((r) => r.id === first.id)).toBe(false);
    expect(await backend.select({ table: 'period_entries' })).toHaveLength(0);
    // Le parcours projet bébé actuel et les enfants ne sont pas touchés
    expect(after.some((r) => r.type === 'ttc' && r.status === 'active')).toBe(true);
    expect((await backend.select({ table: 'children' })).length).toBe(3);
  });
});

describe('corrections après relecture', () => {
  it('changer de parcours avec suppression : l’ancien est archivé, le nouveau créé, puis seulement la suppression', () => {
    const cur: JourneyRow = { id: 'j1', user_id: 'u', household_id: null, type: 'ttc', status: 'active', started_on: '2026-01-01', ended_on: null, end_reason: null, pregnancy_id: null, child_id: null };
    const ops = planChange([cur], 'u', { type: 'avoid' }, 'delete', today);
    expect(ops.map((o) => o.kind)).toEqual(['update', 'insert', 'rpc']);
    const start = planStartPregnancy([cur], 'u', 'h', { lmp: addDays(today, -30), multiplicity: 'single', nicknames: [] }, 'delete', today, { pregnancy: 'p9' });
    expect(start.map((o) => (o.kind === 'insert' || o.kind === 'update' ? `${o.kind}:${o.table}` : o.kind))).toEqual(['insert:pregnancies', 'insert:expected_babies', 'update:user_journeys', 'insert:user_journeys', 'rpc']);
  });
  it('fin de grossesse : les profils des bébés sont créés avant de clore la grossesse ; le post-partum n’est pas rattaché à la grossesse', () => {
    const j: JourneyRow = { id: 'jp', user_id: 'u', household_id: 'h', type: 'pregnancy', status: 'active', started_on: '2026-03-01', ended_on: null, end_reason: null, pregnancy_id: 'p', child_id: null };
    const ops = planEndPregnancy([j], 'u', 'p', 'h', 'born', [{ first_name: 'A', birth_date: today }], today, { children: ['c'], group: null });
    expect(ops[0]).toMatchObject({ kind: 'insert', table: 'children' });
    const pp = ops.find((o) => o.kind === 'insert' && o.table === 'user_journeys' && (o.row as { type: string }).type === 'postpartum') as { row: Record<string, unknown> };
    expect(pp.row.pregnancy_id).toBeUndefined();
  });
});
