/**
 * Premium strict (08/11/2026) : écrans libres / réservés, offre IA, outils achetés à vie, droit inconnu,
 * tables verrouillées identiques à la migration, moteur local (démonstration) qui applique la même règle,
 * bouton d'achat adaptatif, nouvelle grille de démonstration.
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('react-native-purchases', () => ({ __esModule: true, default: { configure: jest.fn(), logIn: jest.fn(), logOut: jest.fn(), getOfferings: jest.fn(), purchasePackage: jest.fn(), restorePurchases: jest.fn(), showManageSubscriptions: jest.fn() } }));

import { createDemoBackend } from '@/lib/backend/demo';
import { AI_TABLES, gateFor, isFreeRoute, STRICT_TABLES } from '@/lib/premium/access';
import { demoPlans } from '@/lib/premium/plans';
import type { AccessInfo } from '@/lib/premium/offers';

const access = (over: Partial<AccessInfo> = {}): AccessInfo => ({ premium: false, ai: false, trial_until: null, strict: true, tools: [], ...over });

describe('écrans libres et réservés', () => {
  it('compte, réglages, données, urgences et onboarding restent libres', () => {
    for (const p of ['/welcome', '/auth/sign-in', '/onboarding', '/profile', '/moi', '/settings', '/settings/privacy', '/settings/account',
      '/settings/language', '/settings/subscription', '/settings/family', '/emergency', '/cycle/emergency', '/contraception/emergency',
      '/postpartum/support', '/scanner/recalls', '/legal/terms', '/feedback', '/journeys', '/settings?x=1']) {
      expect([p, gateFor(p, false, access())]).toEqual([p, 'open']);
    }
  });
  it('tout le reste est réservé sans Premium', () => {
    for (const p of ['/', '/track', '/tools', '/community', '/cycle', '/bottle', '/child/abc/vaccines', '/medications', '/settings/reminders', '/family/custody', '/ask']) {
      expect([p, gateFor(p, false, access())]).toEqual([p, 'locked']);
    }
    expect(isFreeRoute('/settingsx')).toBe(false);
  });
  it('Premium (personnel ou partagé par le co-parent) ouvre tout', () => {
    expect(gateFor('/cycle', true, access({ premium: true }))).toBe('open');
  });
  it('droit encore inconnu : vérification, jamais d’ouverture par défaut', () => {
    expect(gateFor('/cycle', undefined, null)).toBe('checking');
    expect(gateFor('/settings', undefined, null)).toBe('open');
  });
  it('offre Assistant IA : l’assistant seulement', () => {
    const a = access({ ai: true });
    expect(gateFor('/ask', false, a)).toBe('open');
    expect(gateFor('/assistant/chat', false, a)).toBe('open');
    expect(gateFor('/cycle', false, a)).toBe('locked');
  });
  it('outil acheté à vie : son écran reste ouvert, pas les autres', () => {
    const a = access({ tools: [{ key: 'custody', product_id: 'aufildenous_tool_custody', owned: true, allowed: true }, { key: 'pma_tracker', product_id: 'x', owned: false, allowed: false }] });
    expect(gateFor('/family/custody', false, a)).toBe('open');
    expect(gateFor('/fertility/pma', false, a)).toBe('locked');
  });
  it('verrouillage désactivé côté serveur (premium_policy) : ancien modèle', () => {
    expect(gateFor('/cycle', false, access({ strict: false }))).toBe('open');
  });
});

const fs = require('fs') as { readFileSync(p: string, e: 'utf8'): string };
const path = require('path') as { resolve(p: string): string };

describe('mêmes tables que la migration', () => {
  it('STRICT_TABLES et AI_TABLES = listes de 20261108000300_premium_strict.sql', () => {
    const sql = fs.readFileSync(path.resolve('supabase/migrations/20261108000300_premium_strict.sql'), 'utf8');
    const list = (name: string) => {
      const start = sql.indexOf(`${name} text[] := array[`);
      return [...sql.slice(start, sql.indexOf('];', start)).matchAll(/'([a-z_]+)'/g)].map((m) => m[1]);
    };
    expect([...STRICT_TABLES]).toEqual(list('tracked'));
    expect([...AI_TABLES]).toEqual(list('ai'));
    // jamais verrouillés : profil, consentements, confidentialité, foyer, parcours, enfants, signalements, avis
    for (const t of ['profiles', 'consents', 'privacy_settings', 'households', 'household_members', 'user_journeys', 'children', 'reports', 'user_blocks', 'app_feedback', 'subscriptions']) {
      expect(STRICT_TABLES).not.toContain(t);
    }
  });
});

describe('moteur local : même règle que le serveur', () => {
  it('sans Premium : nouvelle saisie refusée, lecture et suppression possibles ; avec Premium : acceptée', async () => {
    const db = createDemoBackend({ strictPremium: true });
    await db.auth.signUp('strict@exemple.test', 'MotDePasse!2026');
    await db.rpc('ensure_my_account');
    await db.update('profiles', { display_name: 'Clara' }, [{ col: 'id', op: 'eq', value: (await db.auth.getSession())!.userId }]);
    await expect(db.insert('mood_checkins', { mood: 3 })).rejects.toMatchObject({ hint: 'premium_required' });
    await expect(db.insert('assistant_conversations', { title: 'Q' })).rejects.toMatchObject({ hint: 'premium_required' });
    expect((await db.rpc<AccessInfo>('my_access')).trial_until).toBeNull();
    await db.rpc('set_demo_subscription', { state: 'active', expires_in_days: 30 });
    await db.insert('mood_checkins', { mood: 3 });
    await db.rpc('set_demo_subscription', { state: 'expired', expires_in_days: -1 });
    expect(await db.select({ table: 'mood_checkins' })).toHaveLength(1);
    await expect(db.insert('mood_checkins', { mood: 4 })).rejects.toMatchObject({ hint: 'premium_required' });
  });
});

describe('formules', () => {
  it('grille de démonstration 10,99 / 49,99 / 79,99, essai sur le mensuel seulement, économies calculées', () => {
    const plans = demoPlans('fr-FR');
    expect(plans.map((p) => [p.period, p.price.replace(/\s/g, ' '), p.trialDays])).toEqual([['annual', '79,99 €', 0], ['six_months', '49,99 €', 0], ['monthly', '10,99 €', 3]]);
    expect(plans.map((p) => p.savingsPct)).toEqual([39, 24, null]);
  });
});
