/**
 * Démonstration (sans serveur) : courses et stocks, mêmes règles que 20261115000200_courses_stocks.sql.
 *  - household_stocks : colonnes du serveur protégées, niveau (stockLevel), « stock.low » → suggestion (AUCUNE mission) ;
 *  - stock_restock (confirmer / écarter), stock_validate_purchase (quantité mise à jour ici seulement), merge_shopping_items ;
 *  - article coché → « shopping.item_checked » : mission liée terminée si c'est son destinataire qui coche (sinon
 *    proposition neutre), stock lié « acheté, à valider » ; mission terminée → article coché → rien ne se rejoue.
 * Les faits sont tracés dans household_events (clé d'idempotence unique), comme sur le serveur.
 */
import { BackendError } from './types';
import { t as tr } from '@/i18n';
import { isLow, missionCategoryOf, mergedQty, normalizeLabel, productLabelOf, quantityAfterPurchase, type StockCategory } from '../domain/stocks';
import { MISSION_DOMAIN_OF } from '../domain/missions';

type Row = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

export interface StocksCtx {
  T: (name: string) => Row[];
  me: () => string | undefined;
  nowIso: () => string;
  uuid: () => string;
  /** RPC des missions (create_mission, mission_respond), mêmes règles que le serveur. */
  missionRpc: (name: 'create_mission' | 'mission_respond', a: Row) => unknown;
}

const fail = (msg: string, code = '22023') => new BackendError(msg, code);
const SERVER_COLS = ['restock_state', 'low_since', 'restock_task_id', 'restock_item_id', 'last_purchase_at', 'last_validated_by'];
const OPEN_MISSION = ['pending', 'accepted', 'in_progress', 'postponed'];

export function createStocks(c: StocksCtx) {
  const { T } = c;
  let serverAction = 0; // > 0 : écriture faite par une fonction du serveur (colonnes protégées autorisées)
  const member = (h: unknown, u: unknown) => T('household_members').find((m) => m.household_id === h && m.user_id === u);
  const canView = (h: unknown) => { const m = member(h, c.me()); return !!m && (m.role === 'owner' || (m.can_view ?? []).includes('lists')); };
  const canEdit = (h: unknown) => { const m = member(h, c.me()); return !!m && (m.role === 'owner' || (m.can_edit ?? []).includes('lists')); };
  const childOk = (h: unknown, child: unknown) => {
    if (!child) return true;
    const m = member(h, c.me());
    return !!m && (m.role === 'owner' || (m.child_scope == null ? m.role !== 'caregiver' : (m.child_scope as unknown[]).includes(child)));
  };
  const canReceive = (h: unknown, u: unknown) => { const m = member(h, u); return !!m && (m.role === 'owner' || (m.can_view ?? []).includes('lists')); };
  const bump = (r: Row) => { r.version = Number(r.version ?? 1) + 1; r.updated_at = c.nowIso(); };

  /** Émission idempotente (miroir de _emit_household_event) : même clé = même fait, rien de neuf. */
  function emit(h: unknown, type: string, table: string, id: unknown, payload: Row, key: string, status = 'done'): boolean {
    if (T('household_events').some((e) => e.idempotency_key === key)) return false;
    T('household_events').push({ id: c.uuid(), household_id: h, type, actor_id: c.me() ?? null, entity_table: table, entity_id: String(id), payload, idempotency_key: key,
      status, attempts: status === 'done' ? 1 : 0, depth: 0, created_at: c.nowIso(), processed_at: status === 'done' ? c.nowIso() : null });
    return true;
  }
  const notify = (userId: string, title: string, body: string, link: string, payload: Row) =>
    T('notifications').push({ id: c.uuid(), user_id: userId, category: 'family', title, body, deep_link: link, payload, read_at: null, created_at: c.nowIso() });

  /** Garde (miroir de household_stocks_guard) : colonnes du serveur, niveau. */
  function guardStock(r: Row, before?: Row) {
    if (r.child_id && !T('children').some((k) => k.id === r.child_id && k.household_id === r.household_id)) throw fail(tr('l2.dm.forbidden'));
    if (r.responsible_id && r.responsible_id !== before?.responsible_id && !canReceive(r.household_id, r.responsible_id)) throw fail(tr('l2.dm.forbidden'));
    if (!serverAction) {
      if (!before) { for (const k of SERVER_COLS) r[k] = null; r.restock_state = 'ok'; r.created_by = c.me() ?? null; }
      else for (const k of SERVER_COLS) r[k] = before[k];
    }
    if (before) { r.created_by = before.created_by; r.created_at = before.created_at; r.household_id = before.household_id; }
    r.reminder ??= true; r.source ??= 'manual'; r.category ??= 'other';
    for (const k of ['brand', 'size', 'qty_estimate', 'unit', 'threshold', 'frequency_days', 'responsible_id', 'child_id', 'pet_id', 'ingredient_key', 'notes']) r[k] ??= null;
    if (!isLow(r as never)) { r.low_since = null; if (['suggested', 'dismissed'].includes(r.restock_state)) r.restock_state = 'ok'; }
    else if (!r.low_since) r.low_since = c.nowIso();
  }

  /** « stock.low » (miroir de household_stocks_emit_events + _consume_stock_event) : suggestion seulement. */
  function afterStock(before: Row | undefined, s: Row) {
    if (!s.low_since || s.restock_state !== 'ok' || (before && before.low_since === s.low_since)) return;
    if (!emit(s.household_id, 'stock.low', 'household_stocks', s.id, { stock_id: s.id, label: s.label, qty_estimate: s.qty_estimate, threshold: s.threshold }, `stock.low:${s.id}:${s.low_since}`)) return;
    s.restock_state = 'suggested'; bump(s);
    const to = s.responsible_id ?? T('family_domains').find((d) => d.household_id === s.household_id && d.key === 'shopping')?.owner_id;
    if (to && to !== c.me() && s.reminder && canReceive(s.household_id, to)) notify(to, tr('stk.notif.low', { label: s.label }), tr('stk.notif.lowBody'), `/family/stocks/${s.id}`, { stock_id: s.id, stock: 'low' });
  }

  /** « shopping.item_checked » (miroir de _consume_stock_event) : jamais de transition forcée, jamais de quantité changée. */
  function itemChecked(item: Row) {
    if (!emit(item.household_id, 'shopping.item_checked', 'shopping_items', item.id, { item_id: item.id, label: item.label, stock_id: item.stock_id ?? null },
      `shopping.item_checked:${item.id}:${item.version ?? 1}`)) return;
    const actor = c.me();
    for (const t of T('family_tasks').filter((x) => x.shopping_item_id === item.id && OPEN_MISSION.includes(x.mission_state))) {
      if (t.assignee_id && t.assignee_id === actor) {
        try { c.missionRpc('mission_respond', { p_task: t.id, p_action: 'complete' }); } catch { /* règle non remplie : rien de forcé */ }
      } else if (t.assignee_id && canReceive(t.household_id, t.assignee_id)) {
        notify(t.assignee_id, tr('stk.notif.checked', { label: item.label }), tr('stk.notif.checkedBody'), `/family/missions/${t.id}`, { task_id: t.id, mission: 'item_checked' });
      }
    }
    const s = item.stock_id ? T('household_stocks').find((x) => x.id === item.stock_id) : null;
    if (s && s.restock_state !== 'bought') { s.restock_state = 'bought'; s.restock_item_id = item.id; bump(s); }
  }

  /** Après une écriture (insertion ou modification) sur les tables du module. */
  function beforeWrite(table: string, r: Row, before?: Row) {
    if (table === 'household_stocks') guardStock(r, before);
    if (table === 'shopping_items') {
      if (r.stock_id && !T('household_stocks').some((s) => s.id === r.stock_id && s.household_id === r.household_id)) throw fail(tr('l2.dm.forbidden'));
      if (r.assignee_id && r.assignee_id !== before?.assignee_id && !canReceive(r.household_id, r.assignee_id)) throw fail(tr('l2.dm.forbidden'));
      if (!before) { r.created_by ??= c.me() ?? null; r.created_at ??= c.nowIso(); }
      if (c.me() && (!before || before.checked !== r.checked)) { r.checked_by = r.checked ? c.me() : null; r.checked_at = r.checked ? c.nowIso() : null; }
    }
  }
  function afterWrite(table: string, before: Row | undefined, r: Row) {
    if (table === 'household_stocks') afterStock(before, r);
    if (table === 'shopping_items' && r.checked && before && !before.checked) itemChecked(r);
  }

  function stockFor(id: unknown, write: boolean) {
    const s = T('household_stocks').find((x) => x.id === id);
    if (!s || !canView(s.household_id) || !childOk(s.household_id, s.child_id)) return null;
    if (write && !canEdit(s.household_id)) throw fail(tr('l2.dm.forbidden'), '42501');
    return s;
  }

  const rpcs: Record<string, (a: Row) => unknown> = {
    stock_restock: (a) => {
      const me = c.me();
      if (!me) throw fail(tr('l2.dm.forbidden'), '42501');
      const action = String(a.p_action ?? 'confirm');
      const s = stockFor(a.p_stock, true);
      if (!s) return { status: 'not_found' };
      if (a.p_expected_version != null && Number(a.p_expected_version) !== Number(s.version ?? 1)) return { status: 'conflict', row: { ...s } };
      const period = s.low_since ?? s.created_at;
      if (action === 'dismiss') {
        if (s.restock_state !== 'suggested') return { status: 'ok', unchanged: true, row: { ...s } };
        emit(s.household_id, 'stock.restock_dismissed', 'household_stocks', s.id, { stock_id: s.id }, `stock.restock_dismissed:${s.id}:${period}`);
        s.restock_state = 'dismissed'; bump(s);
        return { status: 'ok', row: { ...s } };
      }
      if (['ordered', 'bought'].includes(s.restock_state) && s.restock_task_id) {
        return { status: 'ok', unchanged: true, task: { ...T('family_tasks').find((t) => t.id === s.restock_task_id) }, row: { ...s } };
      }
      const category = missionCategoryOf(s.category as StockCategory);
      const product = productLabelOf(s as never);
      let assignee: string | null = a.p_assignee ?? null;
      if (!assignee) {
        const domain = MISSION_DOMAIN_OF[category];
        const owner = T('family_domains').find((d) => d.household_id === s.household_id && d.key === domain)?.owner_id;
        if (!(owner && owner !== me && canReceive(s.household_id, owner)) && s.responsible_id && s.responsible_id !== me) assignee = s.responsible_id;
      }
      const created = c.missionRpc('create_mission', {
        p_household: s.household_id, p_title: String(a.p_title ?? '').trim() || tr('stk.mission.title', { product }).slice(0, 120), p_assignee: assignee, p_category: category,
        p_due_at: a.p_due_at ?? null, p_child_id: s.child_id ?? null, p_pet_id: s.pet_id ?? null, p_product_label: product, p_client_id: `restock:${s.id}:${period}`,
      }) as Row;
      const task = T('family_tasks').find((t) => t.id === created.id)!;
      emit(s.household_id, 'stock.restock_confirmed', 'household_stocks', s.id, { stock_id: s.id, task_id: task.id }, `stock.restock_confirmed:${s.id}:${task.id}`);
      serverAction++;
      try { s.restock_state = 'ordered'; s.restock_task_id = task.id; bump(s); task.stock_id ??= s.id; } finally { serverAction--; }
      return { status: 'ok', task: { ...task }, row: { ...s } };
    },
    stock_validate_purchase: (a) => {
      const me = c.me();
      if (!me) throw fail(tr('l2.dm.forbidden'), '42501');
      const mode = a.p_mode === 'set' ? 'set' : 'add';
      const qty = Number(a.p_qty);
      if (!Number.isFinite(qty) || qty < 0 || (mode === 'add' && qty === 0) || qty > 100000) throw fail(tr('stk.err.qty'));
      const s = stockFor(a.p_stock, true);
      if (!s) return { status: 'not_found' };
      if (a.p_expected_version != null && Number(a.p_expected_version) !== Number(s.version ?? 1)) return { status: 'conflict', row: { ...s } };
      const before = { ...s };
      serverAction++;
      try {
        Object.assign(s, { qty_estimate: quantityAfterPurchase(s.qty_estimate, qty, mode), low_since: null, restock_state: 'ok', restock_task_id: null, restock_item_id: null,
          last_purchase_at: c.nowIso(), last_validated_by: me });
        bump(s);
        guardStock(s, before);
      } finally { serverAction--; }
      emit(s.household_id, 'stock.purchase_confirmed', 'household_stocks', s.id, { stock_id: s.id, label: s.label, category: s.category, mode,
        qty_added: mode === 'add' ? qty : null, qty_before: before.qty_estimate, qty_after: s.qty_estimate, unit: s.unit, task_id: before.restock_task_id,
        item_id: before.restock_item_id, validated_by: me, validated_at: s.last_purchase_at }, `stock.purchase_confirmed:${s.id}:${s.version}`, 'pending');
      afterStock({ ...s, low_since: null }, s);
      return { status: 'ok', row: { ...s } };
    },
    merge_shopping_items: (a) => {
      const k = T('shopping_items').find((x) => x.id === a.p_keep);
      const d = T('shopping_items').find((x) => x.id === a.p_drop);
      if (!k || !d || k === d || k.household_id !== d.household_id || !canEdit(k.household_id)) return { status: 'not_found' };
      if (k.checked || d.checked) throw fail(tr('stk.err.mergeChecked'));
      for (const t of T('family_tasks')) if (t.shopping_item_id === d.id) t.shopping_item_id = k.id;
      for (const s of T('household_stocks')) if (s.restock_item_id === d.id) s.restock_item_id = k.id;
      Object.assign(k, { qty: mergedQty(k as never, d as never), unit: k.unit ?? d.unit, brand: k.brand ?? d.brand ?? null, size: k.size ?? d.size ?? null,
        category: k.category ?? d.category ?? null, stock_id: k.stock_id ?? d.stock_id ?? null, assignee_id: k.assignee_id ?? d.assignee_id ?? null });
      bump(k);
      const list = T('shopping_items');
      list.splice(list.indexOf(d), 1);
      return { status: 'ok', row: { ...k } };
    },
  };

  /** Stock du même produit (miroir de _stock_match), pour relier l'article d'une mission d'achat. */
  const matchStock = (household: unknown, label: string) => {
    const n = normalizeLabel(label);
    return T('household_stocks').filter((s) => s.household_id === household)
      .sort((x, y) => String(x.created_at).localeCompare(String(y.created_at)))
      .find((s) => normalizeLabel(s.label) === n || normalizeLabel(`${s.label} ${s.size ?? ''}`) === n) ?? null;
  };

  return { rpcs, beforeWrite, afterWrite, itemChecked, matchStock };
}
