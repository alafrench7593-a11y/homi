import { BRAND } from '@/config/brand';
/**
 * Offre Premium : états de l'abonnement (essai, fin d'essai, renouvellement, annulation, grâce, paiement refusé,
 * expiration), webhook RevenueCat, dates affichées, quotas, fonctions réservées vérifiées par le moteur local,
 * lecture conservée après la fin, saisie vocale sans invention, sommeil, résumés, widgets, notifications.
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('react-native-purchases', () => ({ __esModule: true, default: { configure: jest.fn(), logIn: jest.fn(), logOut: jest.fn(), getOfferings: jest.fn(), purchasePackage: jest.fn(), restorePurchases: jest.fn(), showManageSubscriptions: jest.fn() } }));

import { createDemoBackend } from '@/lib/backend/demo';
import { eq } from '@/lib/backend/types';
import { entitlement } from '@/lib/premium/entitlement';
import { ALWAYS_FREE, FEATURES, isPremiumRequired, QUOTA_OF } from '@/lib/premium/features';
import { widgetSnapshot } from '@/lib/premium/widgets';
import { childSuggestions, pregnancySuggestions } from '@/lib/premium/suggestions';
import { billingDates } from '@/lib/purchases';
import { parseQuickEntry } from '@/lib/domain/quickEntry';
import { habitChanges, sleepRhythm, sleepSeries, weeklySleepRecap } from '@/lib/domain/sleepEstimate';
import { childSummary, periodStart } from '@/lib/domain/summary';
import { notificationRoute } from '@/lib/notifications';
import { isStale, mapStatus, subscriptionFromEvent } from '../../supabase/functions/_shared/revenuecat';

const NOW = new Date('2026-10-21T10:00:00Z');
const inDays = (n: number) => new Date(NOW.getTime() + n * 86_400_000).toISOString();

describe('états de l’abonnement (même règle que has_premium)', () => {
  it('essai en cours : Premium, avec la date de fin d’essai', () => {
    const e = entitlement({ status: 'trial', expires_at: inDays(5), will_renew: true }, NOW, 'Europe/Paris');
    expect(e).toMatchObject({ premium: true, state: 'trial' });
    expect(e.message).toMatch(/Essai gratuit jusqu’au 26 octobre 2026/);
  });
  it('fin d’essai sans achat : retour gratuit, données conservées', () => {
    const e = entitlement({ status: 'trial', expires_at: inDays(-1), will_renew: true }, NOW);
    expect(e.premium).toBe(false);
    expect(e.message).toMatch(/données restent consultables/);
  });
  it('renouvellement : Premium avec la date du prochain renouvellement', () => {
    const e = entitlement({ status: 'active', expires_at: inDays(30), will_renew: true }, NOW, 'Europe/Paris');
    expect(e).toMatchObject({ premium: true, state: 'active', renews: true });
    expect(e.message).toMatch(/Renouvellement automatique le 20 novembre 2026/);
  });
  it('annulé : Premium jusqu’à l’échéance, puis expiration', () => {
    expect(entitlement({ status: 'cancelled', expires_at: inDays(3), will_renew: false }, NOW)).toMatchObject({ premium: true, state: 'cancelled', renews: false });
    expect(entitlement({ status: 'cancelled', expires_at: inDays(-1), will_renew: false }, NOW)).toMatchObject({ premium: false, state: 'expired' });
  });
  it('période de grâce puis paiement refusé', () => {
    expect(entitlement({ status: 'grace', expires_at: inDays(2) }, NOW)).toMatchObject({ premium: true, state: 'grace' });
    expect(entitlement({ status: 'billing_issue', expires_at: inDays(2) }, NOW)).toMatchObject({ premium: false, state: 'billing_issue' });
  });
  it('expiré ou jamais abonné : version gratuite', () => {
    expect(entitlement({ status: 'expired', expires_at: inDays(-3) }, NOW).premium).toBe(false);
    expect(entitlement(null, NOW)).toMatchObject({ premium: false, state: 'free' });
  });
});

describe('webhook RevenueCat → abonnement', () => {
  const ev = (type: string, extra: Record<string, unknown> = {}) => ({ type, app_user_id: 'u', event_timestamp_ms: NOW.getTime(), ...extra });
  const now = NOW.getTime();
  it('achat avec essai, puis conversion (renouvellement) en abonnement payant', () => {
    expect(subscriptionFromEvent(ev('INITIAL_PURCHASE', { period_type: 'TRIAL', store: 'APP_STORE' }), now + 3 * 864e5, 'aufildenous_premium_monthly', 'AU_FIL_DE_NOUS_PREMIUM', now))
      .toMatchObject({ status: 'trial', period_type: 'monthly', store: 'app_store', will_renew: true, trial_ends_at: new Date(now + 3 * 864e5).toISOString() });
    expect(subscriptionFromEvent(ev('RENEWAL', { period_type: 'NORMAL' }), now + 33 * 864e5, 'aufildenous_premium_monthly', 'AU_FIL_DE_NOUS_PREMIUM', now))
      .toMatchObject({ status: 'active', period_type: 'monthly', will_renew: true });
  });
  it('annulation : droits jusqu’à l’échéance ; expiration ensuite', () => {
    expect(subscriptionFromEvent(ev('CANCELLATION'), now + 3 * 864e5, 'aufildenous_premium_monthly', 'AU_FIL_DE_NOUS_PREMIUM', now)).toMatchObject({ status: 'cancelled', will_renew: false });
    expect(mapStatus('CANCELLATION', now - 1, now)).toBe('expired');
    expect(subscriptionFromEvent(ev('EXPIRATION'), now - 1, 'x', 'premium', now)).toMatchObject({ status: 'expired', will_renew: false });
  });
  it('problème de paiement : grâce puis pause ; réactivation', () => {
    expect(mapStatus('BILLING_ISSUE', now + 864e5, now)).toBe('grace');
    expect(mapStatus('BILLING_ISSUE', now - 1, now)).toBe('billing_issue');
    expect(subscriptionFromEvent(ev('UNCANCELLATION'), now + 20 * 864e5, 'm', 'premium', now)).toMatchObject({ status: 'active', will_renew: true });
  });
  it('un événement arrivé en retard ne remplace pas un état plus récent', () => {
    expect(isStale(ev('RENEWAL', { event_timestamp_ms: now - 60_000 }), new Date(now).toISOString())).toBe(true);
    expect(isStale(ev('RENEWAL'), new Date(now - 60_000).toISOString())).toBe(false);
  });
});

describe('écran d’abonnement : dates et prix affichés honnêtement', () => {
  it('essai de 3 jours (mensuel) : premier prélèvement et renouvellement ; annuel sans essai', () => {
    const d = billingDates({ period: 'monthly', trialDays: 3 }, NOW);
    expect(d.firstCharge.toISOString().slice(0, 10)).toBe('2026-10-24');
    expect(d.renewal.toISOString().slice(0, 10)).toBe('2026-11-24');
    expect(billingDates({ period: 'annual', trialDays: 0 }, NOW).renewal.toISOString().slice(0, 10)).toBe('2027-10-21');
    expect(billingDates({ period: 'monthly', trialDays: 0 }, NOW).renewal.toISOString().slice(0, 10)).toBe('2026-11-21');
  });
  it('fonctions toujours gratuites', () => {
    const all = ALWAYS_FREE.join(' | ');
    for (const x of ['urgence', 'post-partum', 'rappel de produits', 'Suppression du compte', 'export légal', 'consentements', 'Signalement', 'déjà créées']) expect(all).toContain(x);
  });
  it('chaque fonction Premium a un titre, un bénéfice et ce qui reste gratuit', () => {
    for (const [k, f] of Object.entries(FEATURES)) { expect(f.title.length).toBeGreaterThan(5); expect(f.benefit.length).toBeGreaterThan(20); expect(f.free).toBeTruthy(); expect(k).toMatch(/^[a-z_]+$/); }
    expect(QUOTA_OF.voice_entry).toBe('voice_entries_per_month');
  });
});

describe('moteur local : fonctions réservées, quotas, lecture après la fin', () => {
  const db = createDemoBackend();
  let household = ''; let childId = '';
  it('version gratuite : menu hebdomadaire et routine refusés, essais vocaux comptés', async () => {
    await db.auth.signUp('premium@exemple.test', 'MotDePasse!2026');
    household = (await db.rpc<{ household_id: string }>('ensure_my_account')).household_id;
    childId = (await db.insert<{ id: string }>('children', { household_id: household, first_name: 'Lina', birth_date: '2026-03-01' }))[0].id;
    await expect(db.insert('meal_plans', { household_id: household, title: 'Semaine', days: 7, servings: 2 })).rejects.toMatchObject({ hint: 'premium_required' });
    await expect(db.insert('bedtime_routines', { household_id: household, child_id: childId, steps: ['Bain'] })).rejects.toMatchObject({ hint: 'premium_required' });
    await expect(db.rpc('create_household_invitation', { p_household: household })).rejects.toMatchObject({ hint: 'premium_required' });
    const r = [];
    for (let i = 0; i < 4; i++) r.push((await db.rpc<{ allowed: boolean }[]>('consume_feature_quota', { p_key: 'voice_entries_per_month' }))[0].allowed);
    expect(r).toEqual([true, true, true, false]);
    expect((await db.rpc<{ remaining: number }[]>('feature_quota_status', { p_key: 'voice_entries_per_month' }))[0].remaining).toBe(0);
    for (let i = 0; i < 5; i++) await db.insert('reminders', { user_id: (await db.auth.getSession())!.userId, category: 'custom', title: `R${i}`, schedule: { type: 'daily', hour: 9, minute: 0 }, enabled: true });
    await expect(db.insert('reminders', { category: 'custom', title: 'R6', schedule: { type: 'daily', hour: 9, minute: 0 }, enabled: true })).rejects.toMatchObject({ hint: 'premium_required' });
    await db.insert('reminders', { category: 'medication', title: 'Lina · Traitement prescrit', schedule: { type: 'daily', hour: 17, minute: 0 }, enabled: true });
  });
  it('essai Premium : tout fonctionne ; fin d’essai : lecture conservée, création refusée', async () => {
    await db.rpc('set_demo_subscription', { state: 'trial', expires_in_days: 7, period: 'annual' });
    expect(await db.rpc('has_premium')).toBe(true);
    await db.insert('meal_plans', { household_id: household, title: 'Semaine', days: 7, servings: 2 });
    await db.insert('bedtime_routines', { household_id: household, child_id: childId, steps: ['Bain', 'Histoire'] });
    expect((await db.rpc<{ quota: number }[]>('feature_quota_status', { p_key: 'voice_entries_per_month' }))[0].quota).toBe(1000);
    await db.rpc('set_demo_subscription', { state: 'trial', expires_in_days: -1 });
    expect(await db.rpc('has_premium')).toBe(false);
    expect(await db.select({ table: 'meal_plans' })).toHaveLength(1);
    expect(await db.select({ table: 'bedtime_routines', filters: [eq('child_id', childId)] })).toHaveLength(1);
    await expect(db.insert('meal_plans', { household_id: household, title: 'Nouvelle', days: 7, servings: 2 })).rejects.toMatchObject({ hint: 'premium_required' });
  });
  it('renouvellement, annulation jusqu’à l’échéance, expiration', async () => {
    await db.rpc('set_demo_subscription', { state: 'active', expires_in_days: 30 });
    expect(await db.rpc('has_premium')).toBe(true);
    await db.rpc('set_demo_subscription', { state: 'cancelled', expires_in_days: 2 });
    expect(await db.rpc('has_premium')).toBe(true);
    await db.rpc('set_demo_subscription', { state: 'expired', expires_in_days: -1 });
    expect(await db.rpc('has_premium')).toBe(false);
    expect(await db.select({ table: 'reminders' })).toHaveLength(6);
  });
  it('erreur « Premium requise » reconnue', () => {
    expect(isPremiumRequired({ hint: 'premium_required' })).toBe(true);
    expect(isPremiumRequired(new Error('autre'))).toBe(false);
  });
});

describe('saisie vocale : données structurées, jamais d’invention', () => {
  const kids = [{ id: 'l', first_name: 'Lina' }, { id: 'n', first_name: 'Noé' }];
  const now = new Date('2026-10-21T18:00:00'); // mercredi
  it('« Lina a bu 150 millilitres à 13 h 10 »', () => {
    const r = parseQuickEntry('Lina a bu 150 millilitres à 13 h 10', kids, now);
    expect(r.ok && r.value).toMatchObject({ kind: 'bottle', childId: 'l', ml: 150, timeGiven: true });
    if (r.ok) expect([r.value.at.getHours(), r.value.at.getMinutes()]).toEqual([13, 10]);
  });
  it('« Noé s’est endormi à 20 h 30 » (la veille si l’heure est passée de plus de 30 min dans le futur)', () => {
    const r = parseQuickEntry('Noé s’est endormi à 20 h 30', kids, new Date('2026-10-21T21:00:00'));
    expect(r.ok && r.value).toMatchObject({ kind: 'sleep_start', childId: 'n' });
    if (r.ok) expect([r.value.at.getHours(), r.value.at.getMinutes()]).toEqual([20, 30]);
    expect(parseQuickEntry('Noé s’est réveillé à 6 h', kids, new Date('2026-10-22T07:00:00')).ok).toBe(true);
  });
  it('« Ajouter le rendez-vous du pédiatre mardi à 15 h »', () => {
    const r = parseQuickEntry('Ajouter le rendez-vous du pédiatre mardi à 15 h', kids, now);
    expect(r.ok && r.value).toMatchObject({ kind: 'appointment', title: 'Pédiatre', childId: null });
    if (r.ok) { expect(r.value.at.getDay()).toBe(2); expect(r.value.at.getHours()).toBe(15); expect(r.value.at > now).toBe(true); }
    expect(parseQuickEntry('Ajouter le rendez-vous du pédiatre mardi', kids, now)).toEqual({ ok: false, error: 'time' });
    expect(parseQuickEntry('rendez-vous du pédiatre à 15 h', kids, now)).toEqual({ ok: false, error: 'date' });
  });
  it('« Rappelle-moi le médicament prescrit de Noé à 17 h » : heure seulement, ni nom ni dose inventés', () => {
    const r = parseQuickEntry('Rappelle-moi le médicament prescrit de Noé à 17 h', kids, now);
    expect(r.ok && r.value).toMatchObject({ kind: 'medication', childId: 'n', time: '17:00', ml: null });
    expect(parseQuickEntry('Rappelle-moi le médicament de Noé', kids, now)).toEqual({ ok: false, error: 'time' });
  });
  it('quantité ou heure non dites : jamais inventées', () => {
    const r = parseQuickEntry('Lina a bu un biberon', kids, now);
    expect(r.ok && r.value).toMatchObject({ ml: null, timeGiven: false });
  });
});

describe('sommeil intelligent', () => {
  const at = (d: number, h: number, m = 0) => new Date(2026, 9, d, h, m).toISOString();
  const night = (d: number, start: number, end: number, wake = 0) => ({ started_at: at(d, start), ended_at: at(d + 1, end), wakeups: wake });
  const nap = (d: number, h: number, minutes: number) => ({ started_at: at(d, h), ended_at: new Date(Date.parse(at(d, h)) + minutes * 60000).toISOString() });
  const now = new Date(2026, 9, 21, 12);
  const logs = [
    ...[11, 12, 13, 14, 15, 16, 17].map((d) => night(d, 20, 7, 1)), ...[11, 12, 13, 14, 15, 16, 17].map((d) => nap(d, 13, 90)),
    ...[18, 19, 20].map((d) => night(d, 21, 6, 3)), ...[18, 19, 20].map((d) => nap(d, 13, 90)),
  ];
  it('rythme moyen et récapitulatif hebdomadaire', () => {
    const r = sleepRhythm(logs, now, 7);
    expect(r.days).toBe(7);
    expect(r.naps).toBe(1);
    expect(weeklySleepRecap(logs, now).join(' ')).toMatch(/7 jour\(s\) noté\(s\)/);
    expect(sleepSeries(logs, now, 7)).toHaveLength(7);
  });
  it('changements d’habitude repérés, sans diagnostic', () => {
    const c = habitChanges(logs, now);
    expect(c.map((x) => x.kind)).toEqual(expect.arrayContaining(['more_wakeups']));
    for (const x of c) expect(x.text).not.toMatch(/maladie|trouble|anormal|diagnostic/i);
  });
});

describe('résumés : les faits, sans interprétation', () => {
  it('jour, semaine, avant rendez-vous', () => {
    const now = new Date(2026, 9, 21, 15);
    expect(periodStart('day', now).getDate()).toBe(21);
    expect(periodStart('week', now).getDate()).toBe(15);
    expect(periodStart('appointment', now, new Date(2026, 9, 10).toISOString()).getDate()).toBe(10);
    const s = childSummary({
      bottles: [{ id: 'b', child_id: 'c', household_id: 'h', at: new Date(2026, 9, 21, 13, 10).toISOString(), prepared_ml: 160, consumed_ml: 150, milk_type: null }],
      feeds: [], sleeps: [], diapers: [{ id: 'd', child_id: 'c', household_id: 'h', at: new Date(2026, 9, 21, 9).toISOString(), wet: true, stool: false }], meals: [],
      observations: [{ id: 'o', child_id: 'c', household_id: 'h', at: new Date(2026, 9, 21, 8).toISOString(), kind: 'temperature', value_num: 38.2, label: null }],
      treatments: [{ id: 't', household_id: 'h', child_id: 'c', name: 'Traitement prescrit', dose_text: '1 comprimé', times: ['17:00'], frequency: 'daily', weekdays: [], start_date: '2026-10-01', end_date: null, instructions: null, prescriber: null, active: true }],
      treatmentLogs: [], appointments: [], measurements: [],
    }, periodStart('day', now), now, 'Europe/Paris');
    const text = JSON.stringify(s);
    expect(text).toMatch(/150 ml bus/);
    expect(text).toMatch(/38,2 °C/);
    expect(text).toMatch(/Traitement prescrit · 1 comprimé/);
    expect(text).not.toMatch(/fièvre|diagnostic|anormal|inquiétant/i);
  });
});

describe('widgets : rien de sensible sur l’écran verrouillé sans accord', () => {
  it('grossesse, rendez-vous et prénom masqués par défaut', () => {
    const w = widgetSnapshot({ scope: 'pregnancy', weeksSA: 24, nextAppointment: { title: 'Échographie', at: '2026-10-25T09:00:00Z' } });
    expect(JSON.stringify(w)).not.toMatch(/24 SA|Échographie/);
    expect(w.title).toBe(BRAND.name);
    const ok = widgetSnapshot({ scope: 'pregnancy', weeksSA: 24 }, { lockScreenDetails: true });
    expect(ok.lines[0].value).toBe('24 SA');
  });
  it('bébé : dernier biberon et prochain rappel, action rapide', () => {
    const w = widgetSnapshot({ scope: 'baby', childName: 'Lina', lastBottleAt: '2026-10-21T11:10:00Z', nextBottleAt: '2026-10-21T14:40:00Z' }, { lockScreenDetails: false, tz: 'Europe/Paris' });
    expect(w.lines.map((l) => l.value)).toEqual(['13 h 10', '16 h 40']);
    expect(w.quickAction?.url).toBe('/track/bottle');
  });
});

describe('notifications et suggestions', () => {
  it('rappel biberon : noter, modifier (ouvrent l’écran), reporter et annuler (sans ouvrir)', () => {
    expect(notificationRoute('bottle-record', { childId: 'l', url: '/bottle/l' })).toBe('/track/bottle?child=l');
    expect(notificationRoute('bottle-edit', { childId: 'l' })).toBe('/bottle/l?edit=1');
    expect(notificationRoute('bottle-snooze-15', { childId: 'l', url: '/bottle/l' })).toBeNull();
    expect(notificationRoute('bottle-cancel', { childId: 'l', url: '/bottle/l' })).toBeNull();
    expect(notificationRoute('expo.modules.notifications.actions.DEFAULT', { url: '/bottle/l' })).toBe('/bottle/l');
  });
  it('questions suggérées selon la semaine ou l’âge, jamais de dose', () => {
    expect(pregnancySuggestions(34, true).join(' ')).toMatch(/valise|gémellaire/);
    expect(childSuggestions('Lina', 5)[0]).toMatch(/Lina/);
    for (const q of [...pregnancySuggestions(10, false), ...childSuggestions('Noé', 60)]) expect(q).not.toMatch(/\bmg\b|dose/i);
  });
});
