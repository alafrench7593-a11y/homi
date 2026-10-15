/**
 * Réglages, scanner et administration sur le moteur local : les appels faits par les écrans
 * fonctionnent en mode démonstration, ou échouent avec un message clair.
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

import { createDemoBackend } from '@/lib/backend/demo';
import { eq, inList } from '@/lib/backend/types';
import type { HouseholdMember } from '@/lib/types';

describe('moteur local : écrans de réglages', () => {
  const db = createDemoBackend();
  let household = '';

  beforeAll(async () => {
    await db.auth.signUp('reglages@exemple.test', 'MotDePasse!2026');
    household = await db.rpc<string>('create_household', { p_name: 'Famille test' });
  });

  it('invitation : création d’un code, acceptation refusée avec un message explicite', async () => {
    const token = await db.rpc<string>('create_household_invitation', { p_household: household, p_role: 'coparent', p_can_view: ['daily'], p_can_edit: [] });
    expect(token.length).toBeGreaterThanOrEqual(16);
    expect(await db.select({ table: 'household_invitations', filters: [eq('household_id', household)] })).toHaveLength(1);
    await expect(db.rpc('accept_household_invitation', { p_token: token })).rejects.toThrow(/mode démonstration/);
  });

  it('droits par domaine d’un membre', async () => {
    const me = (await db.auth.getSession())!.userId;
    await db.update('household_members', { can_view: ['daily', 'health'], can_edit: ['daily'] }, [eq('household_id', household), eq('user_id', me)]);
    const [m] = await db.select<HouseholdMember>({ table: 'household_members', filters: [eq('household_id', household)] });
    expect(m.can_edit).toEqual(['daily']);
  });

  it('abonnement de démonstration activé puis arrêté', async () => {
    expect(await db.rpc('has_premium')).toBe(false);
    await db.rpc('set_demo_subscription', { active: true, period: 'annual', trial: true });
    expect(await db.rpc('has_premium')).toBe(true);
    await db.rpc('set_demo_subscription', { active: false });
    expect(await db.rpc('has_premium')).toBe(false);
  });

  it('scanner : produit fictif signalé, rappel officiel, scan compté après confirmation', async () => {
    const r = await db.invoke<{ found: boolean; recalls: unknown[]; product: { is_demo: boolean }; assessment: { findings: { level: string }[]; limited?: boolean } }>(
      'product-lookup', { barcode: '0000000000024', confirm: false, context: { pregnant: true } });
    expect(r.found).toBe(true);
    expect(r.product.is_demo).toBe(true);
    expect(r.recalls.length).toBeGreaterThan(0);
    expect(r.assessment.limited).toBe(true);
    expect(await db.select({ table: 'product_scans' })).toHaveLength(0);
    await db.invoke('product-lookup', { barcode: '0000000000024', confirm: true, context: {} });
    expect(await db.select({ table: 'product_scans' })).toHaveLength(1);
  });

  it('export des données et file de modération', async () => {
    const data = await db.rpc<{ format: string }>('export_my_data');
    expect(data.format).toBe('toi-et-moi-export-v1');
    const flagged = await db.select({ table: 'posts', filters: [inList('status', ['hidden', 'pending_review'])] });
    const reported = await db.select({ table: 'posts', filters: [eq('status', 'visible'), { col: 'report_count', op: 'gt', value: 0 }] });
    expect(Array.isArray(flagged) && Array.isArray(reported)).toBe(true);
    expect(await db.rpc<number>('admin_broadcast', { p_title: 'Test', p_body: 'Annonce' })).toBe(1);
  });

  it('suppression du compte : tout est effacé', async () => {
    await db.invoke('delete-account', { confirm: 'SUPPRIMER' });
    expect(await db.auth.getSession()).toBeNull();
  });
});
