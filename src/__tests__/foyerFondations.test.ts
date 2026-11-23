/**
 * Fondations du foyer (13/11/2026) — miroir côté application des migrations 20261113000100 à 000600 :
 *  A. nounou (caregiver) jamais bloquée par le Premium strict pour ses saisies dans le foyer qui l'emploie ;
 *  B. enfants autorisés : nounou sans choix = aucun enfant (fiche de sécurité refusée) ;
 *  E. client_id unique par foyer pour la file hors ligne, mise à jour conditionnelle (conflit visible) ;
 *  F. réglages de notification recopiés pour le serveur.
 * Les règles font foi côté serveur (supabase/tests/sql/95 à 98) ; ici : l'application et la démo s'y alignent.
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
jest.mock('react-native-purchases', () => ({ __esModule: true, default: { configure: jest.fn(), logIn: jest.fn(), logOut: jest.fn(), getOfferings: jest.fn(), purchasePackage: jest.fn(), restorePurchases: jest.fn(), showManageSubscriptions: jest.fn() } }));

import { createDemoBackend } from '@/lib/backend/demo';
import { CAREGIVER_ROUTES, gateFor } from '@/lib/premium/access';
import type { AccessInfo } from '@/lib/premium/offers';
import { conflictTarget, conflictingFields, HOUSEHOLD_CLIENT_ID_TABLES } from '@/lib/offlineConflicts';
import { DEFAULT_AUTO_PREFS, serverNotificationSettings } from '@/lib/domain/autoNotifs';

const access = (over: Partial<AccessInfo> = {}): AccessInfo => ({ premium: false, ai: false, trial_until: null, strict: true, tools: [], ...over });

describe('A. nounou et Premium strict (écrans)', () => {
  it('ouvre les écrans de garde à une nounou sans Premium', () => {
    for (const p of ['/', '/family', '/family/history', '/child/abc', '/bottle', '/meals/shopping', '/calendar', '/documents', '/lists']) {
      expect([p, gateFor(p, false, access({ caregiver: true }))]).toEqual([p, 'open']);
    }
  });
  it('garde fermés ses propres outils Premium (cycle, communauté, assistant)', () => {
    for (const p of ['/cycle', '/community', '/assistant', '/fertility/pma', '/postpartum']) {
      expect([p, gateFor(p, false, access({ caregiver: true }))]).toEqual([p, 'locked']);
    }
  });
  it('n’ouvre rien de plus à un compte qui n’est pas nounou', () => {
    expect(gateFor('/family', false, access())).toBe('locked');
    expect(CAREGIVER_ROUTES.length).toBeGreaterThan(5);
  });
});

describe('A + B. démonstration alignée sur le serveur', () => {
  async function caregiverSetup() {
    const db = createDemoBackend({ strictPremium: true });
    await db.auth.signUp('nounou@exemple.test', 'MotDePasse!2026');
    await db.rpc('ensure_my_account');
    const me = (await db.auth.getSession())!.userId;
    // Foyer d'une famille qui emploie la nounou (écrit directement dans la démo : pas d'invitation entre comptes)
    await db.insert('households', { id: 'h-famille', name: 'Famille Martin', created_by: 'parent' });
    await db.insert('household_members', { household_id: 'h-famille', user_id: me, role: 'caregiver', can_view: ['daily', 'lists'], can_edit: ['daily', 'lists'], child_scope: null });
    await db.insert('children', { id: 'k-lou', household_id: 'h-famille', first_name: 'Lou', birth_date: '2025-06-01', allergies_declared: ['arachide'] });
    return { db, me };
  }

  it('la nounou enregistre une tâche du foyer sans Premium, pas une donnée personnelle', async () => {
    const { db } = await caregiverSetup();
    expect((await db.rpc<AccessInfo>('my_access')).caregiver).toBe(true);
    expect((await db.rpc<AccessInfo>('my_access')).premium).toBe(false);
    await db.insert('family_tasks', { household_id: 'h-famille', title: 'Goûter de Lou', client_id: 'c-1' }, { onConflict: 'household_id,client_id', ignoreDuplicates: true });
    await db.insert('family_tasks', { household_id: 'h-famille', title: 'Goûter de Lou', client_id: 'c-1' }, { onConflict: 'household_id,client_id', ignoreDuplicates: true });
    expect(await db.select({ table: 'family_tasks' })).toHaveLength(1);
    await expect(db.insert('mood_checkins', { mood: 3 })).rejects.toMatchObject({ hint: 'premium_required' });
  });

  it('nounou sans enfant choisi : fiche de sécurité refusée ; enfant confié : allergies lisibles', async () => {
    const { db, me } = await caregiverSetup();
    await expect(db.rpc('child_safety_card', { p_child: 'k-lou' })).rejects.toBeTruthy();
    await db.update('household_members', { child_scope: ['k-lou'] }, [{ col: 'user_id', op: 'eq', value: me }]);
    const card = await db.rpc<{ allergies_declared: string[] }>('child_safety_card', { p_child: 'k-lou' });
    expect(card.allergies_declared).toEqual(['arachide']);
  });

  it('mise à jour conditionnelle : conflit si la tâche a changé depuis la lecture', async () => {
    const { db } = await caregiverSetup();
    const [t] = await db.insert<{ id: string; version: number }>('family_tasks', { household_id: 'h-famille', title: 'Sac de Lou', client_id: 'c-2' });
    expect(t.version).toBe(1);
    expect(await db.rpc('update_if_version', { p_table: 'family_tasks', p_id: t.id, p_expected_version: 1, p_patch: { title: 'Sac de Lou (piscine)' } })).toMatchObject({ status: 'ok', row: { version: 2 } });
    expect(await db.rpc('update_if_version', { p_table: 'family_tasks', p_id: t.id, p_expected_version: 1, p_patch: { title: 'Autre' } })).toMatchObject({ status: 'conflict', row: { title: 'Sac de Lou (piscine)' } });
    await expect(db.rpc('update_if_version', { p_table: 'family_tasks', p_id: t.id, p_expected_version: 2, p_patch: { household_id: 'x' } })).rejects.toBeTruthy();
    expect(await db.rpc('update_if_version', { p_table: 'family_tasks', p_id: 'inconnue', p_expected_version: 1, p_patch: { title: 'x' } })).toEqual({ status: 'not_found' });
  });
});

describe('E. file hors ligne', () => {
  it('envoie les tâches, demandes et articles avec l’unicité (foyer, client_id)', () => {
    for (const t of HOUSEHOLD_CLIENT_ID_TABLES) expect(conflictTarget(t, { client_id: 'c', household_id: 'h' })).toBe('household_id,client_id');
    expect(conflictTarget('bottles', { client_id: 'c', household_id: 'h' })).toBe('client_id');
    expect(conflictTarget('notes', { id: 'x' })).toBe('id');
  });
  it('décrit un conflit champ par champ', () => {
    expect(conflictingFields({ title: 'A', checked: true }, { title: 'B', checked: true })).toEqual({ title: ['A', 'B'] });
  });
});

describe('F. réglages recopiés pour le serveur', () => {
  it('heures calmes en heures pleines, fuseau, écran verrouillé discret par défaut', () => {
    expect(serverNotificationSettings(DEFAULT_AUTO_PREFS, 'Europe/Paris')).toEqual({ quiet_enabled: true, quiet_start: '22:00', quiet_end: '07:00', time_zone: 'Europe/Paris', lockscreen_details: false });
    expect(serverNotificationSettings({ ...DEFAULT_AUTO_PREFS, quietFrom: 21, quietTo: 8, lockscreenDetails: true }, undefined)).toMatchObject({ quiet_start: '21:00', quiet_end: '08:00', time_zone: 'Europe/Paris', lockscreen_details: true });
  });
});
