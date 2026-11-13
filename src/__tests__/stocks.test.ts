/**
 * Courses et stocks (15/11/2026, phase 6) : logique de seuils (jamais de quantité inventée), fusion de doublons,
 * migration du garde-manger local (sans perte ni doublon), textes neutres dans les 5 langues, et émulation de
 * démonstration des scénarios F (croquettes) et A (étape 8 : couches) avec les mêmes règles que le serveur.
 */
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));
const fs = require('fs') as { readFileSync(p: string, enc: string): string };
const path = require('path') as { join(...p: string[]): string };

import { DICTIONARIES } from '@/i18n/dictionaries';
import { isNeutralText, type Mission } from '@/lib/domain/missions';
import {
  duplicateGroups, findDuplicate, isLow, mergedQty, missionCategoryOf, needsAttention, normalizeLabel, pantryClientId, pantryKeysOf, pantryMigrationRows,
  productLabelOf, quantityAfterPurchase, sortStocks, stableId, stockHub, stockLevel, stockMatch, type Stock,
} from '@/lib/domain/stocks';
import { HOUSEHOLD_CLIENT_ID_TABLES, conflictTarget } from '@/lib/offlineConflicts';
import { HOUSEHOLD_TABLES } from '@/lib/sync';
import { createDemoBackend } from '@/lib/backend/demo';

const SQL = fs.readFileSync(path.join(process.cwd(), 'supabase', 'migrations', '20261115000200_courses_stocks.sql'), 'utf8');
const stock = (p: Partial<Stock>): Stock => ({
  id: 's', household_id: 'h', label: 'Croquettes', category: 'pet_food', brand: null, size: null, qty_estimate: null, unit: null, threshold: null, frequency_days: null,
  responsible_id: null, reminder: true, child_id: null, pet_id: null, ingredient_key: null, source: 'manual', notes: null, restock_state: 'ok', low_since: null,
  restock_task_id: null, restock_item_id: null, last_purchase_at: null, last_validated_by: null, client_id: null, version: 1, created_by: null,
  created_at: '2026-11-15T08:00:00Z', updated_at: '2026-11-15T08:00:00Z', ...p,
});

describe('stocks : seuils (miroir de household_stocks_guard)', () => {
  it('bas seulement si la quantité ET le seuil sont saisis ; jamais devinée', () => {
    expect(stockLevel(stock({}))).toBe('unknown');
    expect(stockLevel(stock({ threshold: 2 }))).toBe('unknown');           // seuil sans quantité : rien d'inventé
    expect(stockLevel(stock({ qty_estimate: 5 }))).toBe('ok');             // quantité sans seuil : rien à proposer
    expect(stockLevel(stock({ qty_estimate: 5, threshold: 2 }))).toBe('ok');
    expect(stockLevel(stock({ qty_estimate: 2, threshold: 2 }))).toBe('low'); // égal au seuil = atteint
    expect(stockLevel(stock({ qty_estimate: '1.50', threshold: '2.00' }))).toBe('low'); // numeric renvoyé en texte par Postgres
    expect(stockLevel(stock({ qty_estimate: 0, threshold: 2 }))).toBe('out');
    expect(isLow(stock({ qty_estimate: null, threshold: 2 }))).toBe(false);
    // même règle que le serveur : « qty_estimate <= threshold »
    expect(SQL).toMatch(/v_low := new\.qty_estimate is not null and new\.threshold is not null and new\.qty_estimate <= new\.threshold;/);
  });
  it('mise en avant sans culpabiliser : suggestion, mission, achat à valider, niveau bas ; « pas maintenant » respecté', () => {
    expect(needsAttention(stock({ restock_state: 'suggested', qty_estimate: 2, threshold: 2 }))).toBe(true);
    expect(needsAttention(stock({ restock_state: 'ordered' }))).toBe(true);
    expect(needsAttention(stock({ restock_state: 'bought' }))).toBe(true);
    expect(needsAttention(stock({ restock_state: 'dismissed', qty_estimate: 1, threshold: 2 }))).toBe(false);
    expect(needsAttention(stock({ qty_estimate: 9, threshold: 2 }))).toBe(false);
    const sorted = sortStocks([stock({ id: 'a', label: 'Lessive', category: 'laundry', qty_estimate: 9, threshold: 1 }), stock({ id: 'b', restock_state: 'bought' }),
      stock({ id: 'c', label: 'Couches', category: 'diapers', restock_state: 'suggested', qty_estimate: 1, threshold: 5 })]);
    expect(sorted.map((s) => s.id)).toEqual(['b', 'c', 'a']);
  });
  it('mission de réapprovisionnement : catégorie, produit, onglet (miroir de stock_restock)', () => {
    expect(missionCategoryOf('pet_food')).toBe('pets');
    expect(missionCategoryOf('diapers')).toBe('diapers');
    expect(missionCategoryOf('laundry')).toBe('shopping');
    expect(productLabelOf(stock({ label: 'Couches', size: 'taille 4' }))).toBe('Couches taille 4');
    expect(stockHub('milk')).toBe('baby');
    expect(stockHub('cleaning')).toBe('family');
    expect(SQL).toContain("when s.category = 'pet_food' then 'pets' when s.category in ('diapers', 'wipes', 'milk') then 'diapers' else 'shopping'");
  });
  it('validation d’achat : ajout ou nouvelle estimation, jamais zéro acheté', () => {
    expect(quantityAfterPurchase(2, 3, 'add')).toBe(5);
    expect(quantityAfterPurchase(null, 3, 'add')).toBe(3);
    expect(quantityAfterPurchase('2.00', 10, 'set')).toBe(10);
    expect(() => quantityAfterPurchase(2, 0, 'add')).toThrow();
    expect(() => quantityAfterPurchase(2, -1, 'set')).toThrow();
  });
});

describe('courses : doublons et fusion (miroir de merge_shopping_items)', () => {
  const items = [
    { id: '1', label: 'Lait', checked: false, qty: 1, unit: 'bouteille' },
    { id: '2', label: ' lait  ', checked: false, qty: 2, unit: 'bouteille' },
    { id: '3', label: 'Lait', checked: true },
    { id: '4', label: 'Couches', size: 'taille 4', checked: false },
  ];
  it('même produit non coché = doublon (casse et espaces ignorés) ; un article coché n’en est pas un', () => {
    expect(normalizeLabel('  Lait   demi-écrémé ')).toBe('lait demi-écrémé');
    expect(findDuplicate(items, { label: 'LAIT' })?.id).toBe('1');
    expect(findDuplicate([items[2]], { label: 'Lait' })).toBeNull();
    expect(findDuplicate(items, { label: 'Couches', size: 'taille 5' })).toBeNull(); // autre taille : pas le même produit
    expect(findDuplicate(items, { label: 'couches', size: 'Taille 4' })?.id).toBe('4');
  });
  it('groupes de doublons déjà présents (deux téléphones) et quantité fusionnée', () => {
    expect(duplicateGroups(items).map((g) => g.map((i) => i.id))).toEqual([['1', '2']]);
    expect(mergedQty({ qty: 1, unit: 'bouteille' }, { qty: 2, unit: 'bouteille' })).toBe(3);
    expect(mergedQty({ qty: 1, unit: 'bouteille' }, { qty: 500, unit: 'ml' })).toBe(1); // unités différentes : on garde
    expect(mergedQty({ qty: null }, { qty: 2 })).toBe(2);
  });
  it('stock du même produit (miroir de _stock_match) : libellé, ou libellé + taille', () => {
    const list = [stock({ id: 'c', label: 'Couches', size: 'taille 4' }), stock({ id: 'f', label: 'Croquettes' })];
    expect(stockMatch(list, 'Couches taille 4')?.id).toBe('c');
    expect(stockMatch(list, 'croquettes')?.id).toBe('f');
    expect(stockMatch(list, 'Lessive')).toBeNull();
  });
});

describe('garde-manger local → inventaire du foyer (migration douce)', () => {
  it('identifiant déterministe : même foyer + même ingrédient = même client_id (deux appareils, rejouée)', () => {
    expect(pantryClientId('h1', 'riz')).toBe(pantryClientId('h1', 'riz'));
    expect(pantryClientId('h1', 'riz')).not.toBe(pantryClientId('h2', 'riz'));
    expect(pantryClientId('h1', 'riz')).not.toBe(pantryClientId('h1', 'pates'));
    expect(stableId('x')).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });
  it('une ligne par ingrédient absent du serveur, sans quantité inventée, sans doublon ni perte', () => {
    const rows = pantryMigrationRows(['riz', 'pates', 'riz', 'Bad Key', 'oeuf'], 'h1', [{ ingredient_key: 'oeuf' }], (k) => ({ riz: 'Riz', pates: 'Pâtes' } as Record<string, string>)[k] ?? k);
    expect(rows.map((r) => r.ingredient_key)).toEqual(['riz', 'pates']);
    expect(rows.every((r) => r.qty_estimate === null && r.threshold === null && r.source === 'pantry' && r.category === 'food')).toBe(true);
    expect(rows[0]).toMatchObject({ household_id: 'h1', label: 'Riz', client_id: pantryClientId('h1', 'riz') });
    // deuxième passage (déjà migré) : rien à refaire
    expect(pantryMigrationRows(['riz', 'pates'], 'h1', rows, (k) => k)).toEqual([]);
    expect(pantryKeysOf([{ ingredient_key: 'riz', qty_estimate: null }, { ingredient_key: 'pates', qty_estimate: 0 }, { ingredient_key: null, qty_estimate: 3 }])).toEqual(['riz']);
  });
  it('envoi idempotent : (household_id, client_id) pour les stocks ; stocks et courses en temps réel', () => {
    expect(HOUSEHOLD_CLIENT_ID_TABLES).toContain('household_stocks');
    expect(conflictTarget('household_stocks', { client_id: 'c', household_id: 'h' })).toBe('household_id,client_id');
    expect(HOUSEHOLD_TABLES).toEqual(expect.arrayContaining(['shopping_lists', 'shopping_items', 'household_stocks']));
    expect(SQL).toContain("foreach t in array array['shopping_lists', 'shopping_items', 'household_stocks'] loop");
  });
});

describe('courses et stocks : textes neutres (5 langues)', () => {
  it('chaque clé est traduite et aucun texte ne culpabilise', () => {
    const fr = DICTIONARIES.fr as Record<string, unknown>;
    const keys = Object.keys(fr).filter((k) => /^(stk|shp)\./.test(k) || k === 'mis.toYou' || k === 'mis.fromYou');
    expect(keys.length).toBeGreaterThan(150);
    for (const lang of ['en', 'es', 'de', 'it'] as const) {
      const d = DICTIONARIES[lang] as Record<string, unknown>;
      expect(keys.filter((k) => d[k] == null)).toEqual([]);
    }
    for (const lang of ['fr', 'en', 'es', 'de', 'it'] as const) {
      const d = DICTIONARIES[lang] as Record<string, unknown>;
      for (const k of keys.filter((x) => /^stk\.(level|state|suggest|notif|sum|section)/.test(x))) {
        const v = d[k];
        for (const text of typeof v === 'string' ? [v] : Object.values(v as Record<string, string>)) expect([lang, k, isNeutralText(text)]).toEqual([lang, k, true]);
      }
    }
  });
  it('« Pour vous » : « vous » en minuscule dans le détail de mission (5 langues)', () => {
    expect((DICTIONARIES.fr as Record<string, string>)['mis.toYou']).toBe('Pour vous');
    for (const lang of ['fr', 'en', 'es', 'de', 'it'] as const) {
      const v = (DICTIONARIES[lang] as Record<string, string>)['mis.toYou'];
      expect(v.split(' ').slice(1).join(' ')).toBe(v.split(' ').slice(1).join(' ').toLowerCase());
    }
  });
});

describe('démonstration : scénarios F et A (mêmes règles que le serveur)', () => {
  async function setup() {
    const b = createDemoBackend({ strictPremium: false });
    await b.auth.signUp('maman@exemple.test', 'MotDePasse!2026');
    await b.auth.signIn('maman@exemple.test', 'MotDePasse!2026');
    const me = (await b.auth.getSession())!.userId;
    const { household_id: hid } = await b.rpc<{ household_id: string }>('ensure_my_account');
    const { user_id: partner } = await b.rpc<{ user_id: string }>('demo_mission_partner');
    const byId = (id: string) => [{ col: 'id', op: 'eq' as const, value: id }];
    const getStock = async (id: string) => (await b.select<Stock>({ table: 'household_stocks', filters: byId(id) }))[0];
    return { b, me, hid, partner, byId, getStock };
  }

  it('scénario F : seuil → suggestion (aucune mission) → confirmation → mission → article → coche du destinataire → validation → stock mis à jour', async () => {
    const { b, me, hid, partner, byId, getStock } = await setup();
    const [s] = await b.insert<Stock>('household_stocks', { household_id: hid, client_id: 'cli-f', label: 'Croquettes', category: 'pet_food', qty_estimate: 5, unit: 'sac', threshold: 2, responsible_id: partner });
    expect(s.restock_state).toBe('ok');
    await b.update('household_stocks', { restock_state: 'bought' }, byId(s.id));                       // colonne du serveur : ignorée
    expect((await getStock(s.id)).restock_state).toBe('ok');
    const v = (await getStock(s.id)).version;
    expect((await b.rpc<{ status: string }>('update_if_version', { p_table: 'household_stocks', p_id: s.id, p_expected_version: v, p_patch: { qty_estimate: 2 } })).status).toBe('ok');
    expect((await getStock(s.id)).restock_state).toBe('suggested');
    expect(await b.select({ table: 'family_tasks', filters: [{ col: 'product_label', op: 'eq', value: 'Croquettes' }] })).toHaveLength(0); // HOMI suggère seulement
    const conf = await b.rpc<{ task: Mission }>('stock_restock', { p_stock: s.id, p_action: 'confirm' });
    expect(conf.task).toMatchObject({ assignee_id: partner, category: 'pets', product_label: 'Croquettes', mission_state: 'pending' });
    expect((await b.rpc<{ unchanged?: boolean; task: Mission }>('stock_restock', { p_stock: s.id, p_action: 'confirm' })).task.id).toBe(conf.task.id); // rejeu
    expect(await b.select({ table: 'family_tasks', filters: [{ col: 'product_label', op: 'eq', value: 'Croquettes' }] })).toHaveLength(1);
    await b.rpc('demo_switch_person', { p_user: partner });
    await b.rpc('mission_respond', { p_task: conf.task.id, p_action: 'accept' });
    const items = await b.select<{ id: string; label: string; stock_id: string; checked: boolean }>({ table: 'shopping_items', filters: [{ col: 'household_id', op: 'eq', value: hid }] });
    const item = items.find((i) => i.label === 'Croquettes')!;
    expect(items.filter((i) => i.label === 'Croquettes')).toHaveLength(1);
    expect(item.stock_id).toBe(s.id);
    await b.update('shopping_items', { checked: true }, byId(item.id));                                  // coche par le destinataire
    const task = (await b.select<Mission>({ table: 'family_tasks', filters: byId(conf.task.id) }))[0];
    expect(task.mission_state).toBe('done');
    const after = await getStock(s.id);
    expect(after.restock_state).toBe('bought');
    expect(Number(after.qty_estimate)).toBe(2);                                                          // pas au simple cochage
    const events = await b.select<{ type: string }>({ table: 'household_events', filters: [{ col: 'household_id', op: 'eq', value: hid }] });
    expect(events.filter((e) => e.type === 'shopping.item_checked')).toHaveLength(1);                    // anti-boucle
    await b.rpc('demo_switch_person', { p_user: me });
    await b.rpc('stock_validate_purchase', { p_stock: s.id, p_qty: 3, p_mode: 'add', p_expected_version: after.version });
    const done = await getStock(s.id);
    expect(Number(done.qty_estimate)).toBe(5);
    expect(done.restock_state).toBe('ok');
    expect((await b.rpc<{ status: string }>('stock_validate_purchase', { p_stock: s.id, p_qty: 3, p_mode: 'add', p_expected_version: after.version })).status).toBe('conflict');
    const purchase = (await b.select<{ type: string; status: string; payload: Record<string, unknown> }>({ table: 'household_events', filters: [{ col: 'household_id', op: 'eq', value: hid }] }))
      .filter((e) => e.type === 'stock.purchase_confirmed');
    expect(purchase).toHaveLength(1);
    expect(purchase[0].status).toBe('pending');                                                           // pour le futur module Budget
    expect(purchase[0].payload).toMatchObject({ qty_added: 3, qty_after: 5 });
  });

  it('garde-manger : migration envoyée deux fois (deux appareils, rejeu de la file) → aucune perte, aucun doublon', async () => {
    const { b, hid } = await setup();
    const rows = pantryMigrationRows(['riz', 'pates'], hid, [], (k) => k);
    for (let n = 0; n < 2; n++) for (const r of rows) await b.insert('household_stocks', { ...r }, { onConflict: 'household_id,client_id', ignoreDuplicates: true });
    const all = await b.select<Stock>({ table: 'household_stocks', filters: [{ col: 'household_id', op: 'eq', value: hid }] });
    expect(all.map((x) => x.ingredient_key).sort()).toEqual(['pates', 'riz']);
    expect(all.every((x) => x.qty_estimate === null && x.restock_state === 'ok')).toBe(true);
    expect(pantryMigrationRows(['riz', 'pates', 'oeuf'], hid, all, (k) => k).map((r) => r.ingredient_key)).toEqual(['oeuf']);
  });

  it('coche par une autre personne : pas de transition forcée, proposition au destinataire ; scénario A étape 8', async () => {
    const { b, hid, partner, byId, getStock } = await setup();
    const [c] = await b.insert<Stock>('household_stocks', { household_id: hid, client_id: 'cli-c', label: 'Couches', size: 'taille 4', category: 'diapers', qty_estimate: 8, unit: 'u', threshold: 10 });
    const m = await b.rpc<Mission>('create_mission', { p_household: hid, p_title: 'Acheter des couches taille 4 aujourd’hui', p_assignee: partner, p_category: 'shopping', p_product_label: 'Couches taille 4' });
    await b.rpc('demo_switch_person', { p_user: partner });
    await b.rpc('mission_respond', { p_task: m.id, p_action: 'accept' });
    const item = (await b.select<{ id: string; label: string; stock_id: string }>({ table: 'shopping_items', filters: [{ col: 'household_id', op: 'eq', value: hid }] })).find((i) => i.label === 'Couches taille 4')!;
    expect(item.stock_id).toBe(c.id);
    const { user_id: mother } = await b.rpc<{ user_id: string }>('demo_mission_partner');
    await b.rpc('demo_switch_person', { p_user: mother });
    await b.update('shopping_items', { checked: true }, byId(item.id));                                  // la mère coche
    expect((await b.select<Mission>({ table: 'family_tasks', filters: byId(m.id) }))[0].mission_state).toBe('accepted');
    expect((await getStock(c.id)).restock_state).toBe('bought');
    await b.rpc('demo_switch_person', { p_user: partner });
    const notes = await b.select<{ title: string; user_id: string }>({ table: 'notifications', filters: [{ col: 'user_id', op: 'eq', value: partner }] });
    expect(notes.map((n) => n.title)).toContain('Article coché : Couches taille 4');
    await b.rpc('stock_validate_purchase', { p_stock: c.id, p_qty: 52, p_mode: 'add' });
    expect(Number((await getStock(c.id)).qty_estimate)).toBe(60);
  });
});
