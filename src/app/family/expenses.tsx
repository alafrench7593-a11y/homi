/**
 * 186 — Dépenses familiales : saisie (montant, date, catégorie, qui a payé, part supportée, enfant facultatif, note),
 * historique du mois, totaux par catégorie et par adulte, répartition entre les parents sur une période (« qui doit
 * combien à qui »), export CSV. Parents du foyer seulement (RLS). Aucune connexion bancaire, aucun conseil financier.
 * Garde : une dépense de garde peut être rattachée au mode de garde d'« Avant la garde » ; le budget estimé n'y est
 * affiché qu'à titre de comparaison, jamais recopié en dépense.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorView, Skeleton } from '@/components/States';
import { GlassSheet } from '@/components/glass';
import { confirm, useToast } from '@/components/Overlays';
import { Banner, Button, Chip, Field, haptic, IconButton, ListGroup, ListRow, Row, Segmented, Text } from '@/components/ui';
import { formatDate, formatNumber, getLocale, t as tr, type TKey } from '@/i18n';
import { frToISO, todayISO } from '@/lib/domain/dates';
import { toFrDate } from '@/lib/validation';
import { deliverFile } from '@/lib/deliverFile';
import { useChildren } from '@/lib/data/hooks';
import { usePeople } from '@/lib/data/hooks-family-load';
import { friendlyError } from '@/lib/data/hooks-settings';
import { useCandidates } from '@/lib/data/hooks-childcarePrep';
import { useDeleteExpense, useExpenses, useIsHouseholdParent, useSaveExpense } from '@/lib/data/hooks-foyerTools';
import { monthlyCost } from '@/features/childcarePrep/domain';
import {
  balance, EXPENSE_CATEGORIES, expensesCsv, inRange, monthBounds, monthOf, parseMoney, shiftMonth, totals, type Expense, type ExpenseCategory,
} from '@/features/expenses/domain';
import { spacing } from '@/theme/tokens';

const money = (n: number) => formatNumber(n, { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 });
/** Solde : « +30,00 € » ou « −30,00 € » */
const signedMoney = (n: number) => formatNumber(n, { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, signDisplay: 'exceptZero' });
const catLabel = (c: ExpenseCategory) => tr(`fx.cat.${c}` as TKey);
const CAT_ICON: Record<ExpenseCategory, 'shopping-cart' | 'smile' | 'users' | 'plus-square' | 'home' | 'sun' | 'tag'> = {
  food: 'shopping-cart', children: 'smile', childcare: 'users', health: 'plus-square', housing: 'home', leisure: 'sun', other: 'tag',
};
// date locale à midi : new Date('AAAA-MM-JJ') est lu en UTC et recule d'un jour à l'ouest de Greenwich
const day = (iso: string, opts: Intl.DateTimeFormatOptions) => {
  const [y, m, d] = iso.split('-').map(Number);
  return formatDate(new Date(y, m - 1, d, 12), opts);
};
const monthLabel = (m: string) => day(`${m}-15`, { month: 'long', year: 'numeric' });
type Tab = 'list' | 'totals' | 'split';
type Period = 'month' | 'prev' | 'three' | 'custom';

function ExpenseEditor({ visible, onClose, initial, hid }: { visible: boolean; onClose: () => void; initial: Expense | null; hid: string }) {
  const toast = useToast();
  const save = useSaveExpense();
  const del = useDeleteExpense();
  const { people, me } = usePeople();
  const adults = people.filter((p) => p.role === 'owner' || p.role === 'coparent');
  const kids = (useChildren().data ?? []).filter((c) => c.household_id === hid && !c.archived);
  const candidates = useCandidates(hid).data ?? [];
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [cat, setCat] = useState<ExpenseCategory>('food');
  const [paidBy, setPaidBy] = useState<string | null>(null);
  const [share, setShare] = useState<'50' | '100' | 'custom'>('50');
  const [customShare, setCustomShare] = useState('');
  const [child, setChild] = useState<string | null>(null);
  const [candidate, setCandidate] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    if (!visible) return;
    setAmount(initial ? String(initial.amount.toFixed(2)).replace('.', ',') : '');
    setDate(toFrDate(initial?.spent_on ?? todayISO()));
    setCat(initial?.category ?? 'food');
    setPaidBy(initial ? initial.paid_by : me ?? null);
    const s = initial?.payer_share ?? 50;
    setShare(s === 50 ? '50' : s === 100 ? '100' : 'custom'); setCustomShare(s === 50 || s === 100 ? '' : String(s));
    setChild(initial?.child_id ?? null); setCandidate(initial?.candidate_id ?? null); setNote(initial?.note ?? ''); setErr(null);
  }, [visible, initial, me]);
  async function submit() {
    const a = parseMoney(amount);
    if (a == null || Number.isNaN(a)) return setErr(tr('fx.err.amount'));
    const d = frToISO(date);
    if (!d) return setErr(tr('fx.err.date'));
    const p = share === 'custom' ? Number(customShare) : Number(share);
    if (!Number.isInteger(p) || p < 0 || p > 100) return setErr(tr('fx.err.share'));
    setErr(null);
    try {
      const r = await save.mutateAsync({
        id: initial?.id, household_id: hid, amount: a, currency: 'EUR', spent_on: d, category: cat, paid_by: paidBy, payer_share: p,
        child_id: child, candidate_id: cat === 'childcare' ? candidate : null, note: note.trim() || null,
      });
      haptic('success');
      toast(tr(r.queued ? 'fx.savedOffline' : 'fx.saved'), 'success');
      onClose();
    } catch (e) { haptic('warning'); toast(friendlyError(e), 'error'); }
  }
  async function remove() {
    if (!initial || !(await confirm(tr('common.delete'), tr('fx.deleteQ'), tr('common.delete')))) return;
    try { await del.mutateAsync(initial.id); haptic('success'); toast(tr('fx.deleted'), 'success'); onClose(); } catch (e) { haptic('warning'); toast(friendlyError(e), 'error'); }
  }
  return (
    <GlassSheet visible={visible} onClose={onClose} title={initial ? tr('fx.edit') : tr('fx.add')}>
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <View style={{ flex: 1 }}><Field label={tr('fx.f.amount')} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" suffix="€" testID="fx-f-amount" /></View>
        <View style={{ flex: 1 }}><Field label={tr('fx.f.date')} value={date} onChangeText={setDate} keyboardType="numbers-and-punctuation" hint={tr('fx.f.dateHint')} testID="fx-f-date" /></View>
      </View>
      <Text variant="label">{tr('fx.f.category')}</Text>
      <Row wrap>{EXPENSE_CATEGORIES.map((c) => <Chip key={c} label={catLabel(c)} icon={CAT_ICON[c]} selected={cat === c} onPress={() => setCat(c)} testID={`fx-f-cat-${c}`} />)}</Row>
      <Text variant="label">{tr('fx.f.paidBy')}</Text>
      <Row wrap>
        {adults.map((p) => <Chip key={p.id} label={p.label} selected={paidBy === p.id} onPress={() => setPaidBy(p.id)} testID={`fx-f-payer-${p.isMe ? 'me' : 'other'}`} />)}
        <Chip label={tr('fx.f.payerNone')} selected={!paidBy} onPress={() => setPaidBy(null)} />
      </Row>
      {adults.length > 1 ? (
        <>
          <Text variant="label">{tr('fx.f.share')}</Text>
          <Row wrap>
            <Chip label={tr('fx.f.share50')} selected={share === '50'} onPress={() => setShare('50')} testID="fx-f-share-50" />
            <Chip label={tr('fx.f.share100')} selected={share === '100'} onPress={() => setShare('100')} testID="fx-f-share-100" />
            <Chip label={tr('fx.f.shareCustom')} selected={share === 'custom'} onPress={() => setShare('custom')} testID="fx-f-share-custom" />
          </Row>
          {share === 'custom' ? <Field label={tr('fx.f.sharePct')} value={customShare} onChangeText={setCustomShare} keyboardType="number-pad" suffix="%" hint={tr('fx.f.sharePctHint')} testID="fx-f-share-pct" /> : null}
        </>
      ) : null}
      {kids.length ? (
        <>
          <Text variant="label">{tr('fx.f.child')}</Text>
          <Row wrap>
            <Chip label={tr('fx.f.noChild')} selected={!child} onPress={() => setChild(null)} />
            {kids.map((k) => <Chip key={k.id} label={k.first_name} selected={child === k.id} onPress={() => setChild(k.id)} testID={`fx-f-child-${k.id}`} />)}
          </Row>
        </>
      ) : null}
      {cat === 'childcare' && candidates.length ? (
        <>
          <Text variant="label">{tr('fx.f.candidate')}</Text>
          <Text variant="caption" muted>{tr('fx.f.candidateHint')}</Text>
          <Row wrap>
            <Chip label={tr('fx.f.noCandidate')} selected={!candidate} onPress={() => setCandidate(null)} />
            {candidates.filter((c) => c.status !== 'dismissed').map((c) => <Chip key={c.id} label={c.name} selected={candidate === c.id} onPress={() => setCandidate(c.id)} testID={`fx-f-cand-${c.id}`} />)}
          </Row>
        </>
      ) : null}
      <Field label={tr('fx.f.note')} optional value={note} onChangeText={setNote} maxLength={300} testID="fx-f-note" />
      {err ? <Banner tone="danger">{err}</Banner> : null}
      <Button label={tr('common.save')} icon="check" loading={save.isPending} onPress={() => void submit()} testID="fx-f-save" />
      {initial ? <Button label={tr('common.delete')} icon="trash-2" variant="ghost" onPress={() => void remove()} testID="fx-f-delete" /> : null}
    </GlassSheet>
  );
}

export default function Expenses() {
  const toast = useToast();
  // petit écran (320 pt) : le montant passe dans la ligne de détail, le titre garde toute la largeur
  const narrow = useWindowDimensions().width < 360;
  const { hid, parent, loading } = useIsHouseholdParent();
  const q = useExpenses(parent ? hid : null);
  const { people, nameOf } = usePeople();
  const kids = useChildren().data ?? [];
  const candidates = useCandidates(parent ? hid : null).data ?? [];
  const adults = useMemo(() => people.filter((p) => p.role === 'owner' || p.role === 'coparent'), [people]);
  const [tab, setTab] = useState<Tab>('list');
  const [month, setMonth] = useState(monthOf(todayISO()));
  const [period, setPeriod] = useState<Period>('month');
  const [from, setFrom] = useState(toFrDate(monthBounds(monthOf(todayISO())).from));
  const [to, setTo] = useState(toFrDate(todayISO()));
  const [editing, setEditing] = useState<Expense | null>(null);
  const [open, setOpen] = useState(false);

  const all = useMemo(() => q.data ?? [], [q.data]);
  const mb = monthBounds(month);
  const inMonth = useMemo(() => all.filter((e) => inRange(e, mb.from, mb.to)), [all, mb.from, mb.to]);
  const monthTotals = useMemo(() => totals(inMonth), [inMonth]);
  const range = useMemo(() => {
    const cur = monthOf(todayISO());
    if (period === 'month') return monthBounds(cur);
    if (period === 'prev') return monthBounds(shiftMonth(cur, -1));
    if (period === 'three') return { from: monthBounds(shiftMonth(cur, -2)).from, to: monthBounds(cur).to };
    const f = frToISO(from); const t2 = frToISO(to);
    return f && t2 && f <= t2 ? { from: f, to: t2 } : null;
  }, [period, from, to]);
  const split = useMemo(() => (range ? balance(all.filter((e) => inRange(e, range.from, range.to)), adults.map((a) => a.id)) : null), [all, range, adults]);
  const childName = (id: string | null) => (id ? kids.find((k) => k.id === id)?.first_name ?? '' : '');

  if (loading || (parent && q.isLoading && !q.data)) return <Screen back title={tr('fx.title')}><Skeleton rows={5} /></Screen>;
  if (!parent || !hid) return <Screen back title={tr('fx.title')}><EmptyState icon="lock" title={tr('fx.title')} body={tr('fx.parentsOnly')} /></Screen>;
  if (q.isError && !q.data) return <Screen back title={tr('fx.title')}><ErrorView error={q.error} onRetry={() => void q.refetch()} /></Screen>;

  async function exportCsv(list: Expense[], suffix: string) {
    if (!list.length) { toast(tr('fx.export.empty'), 'info'); return; }
    const csv = expensesCsv(list, {
      date: tr('fx.csv.date'), category: tr('fx.csv.category'), amount: tr('fx.csv.amount'), paidBy: tr('fx.csv.paidBy'), payerShare: tr('fx.csv.share'),
      child: tr('fx.csv.child'), note: tr('fx.csv.note'), total: tr('fx.csv.total'), decimalComma: getLocale() !== 'en',
      categories: Object.fromEntries(EXPENSE_CATEGORIES.map((c) => [c, catLabel(c)])) as Record<ExpenseCategory, string>,
      nameOf: (id) => (id ? nameOf(id) : ''), childOf: childName,
    });
    try {
      await deliverFile(new TextEncoder().encode(csv), `depenses-${suffix}.csv`, 'text/csv', tr('fx.export.title'));
      toast(tr('fx.export.done'), 'success');
    } catch (e) { toast(friendlyError(e), 'error'); }
  }
  const edit = (e: Expense | null) => { setEditing(e); setOpen(true); };
  const row = (e: Expense) => (
    <ListRow key={e.id} icon={CAT_ICON[e.category]} title={e.note || catLabel(e.category)} value={narrow ? undefined : money(e.amount)}
      subtitle={[narrow ? money(e.amount) : null, day(e.spent_on, { day: 'numeric', month: 'short' }), catLabel(e.category), e.paid_by ? tr('fx.paidByX', { name: nameOf(e.paid_by) }) : null,
        e.payer_share === 100 ? tr('fx.notShared') : null, childName(e.child_id) || null, e._pending ? tr('fx.pending') : null].filter(Boolean).join(' · ')}
      onPress={e._pending ? undefined : () => edit(e)} testID={`fx-row-${e.id}`} />
  );
  const linked = candidates.find((c) => inMonth.some((e) => e.candidate_id === c.id));

  return (
    <Screen back title={tr('fx.title')} subtitle={tr('fx.sub')} action={{ label: tr('fx.add'), icon: 'plus', onPress: () => edit(null), testID: 'fx-add' }}>
      <Segmented label={tr('fx.title')} value={tab} onChange={setTab}
        options={[{ value: 'list', label: tr('fx.tab.list'), testID: 'fx-tab-list' }, { value: 'totals', label: tr('fx.tab.totals'), testID: 'fx-tab-totals' }, { value: 'split', label: tr('fx.tab.split'), testID: 'fx-tab-split' }]} />
      {tab !== 'split' ? (
        <Row style={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <IconButton icon="chevron-left" label={tr('fx.prevMonth')} tone="filled" onPress={() => setMonth(shiftMonth(month, -1))} testID="fx-prev" />
          <Text weight="bold" center style={{ flex: 1 }} testID="fx-month">{monthLabel(month)}</Text>
          <IconButton icon="chevron-right" label={tr('fx.nextMonth')} tone="filled" onPress={() => setMonth(shiftMonth(month, 1))} disabled={month >= monthOf(todayISO())} testID="fx-next" />
        </Row>
      ) : null}

      {tab === 'list' ? (
        <>
          <Text weight="bold" style={{ fontVariant: ['tabular-nums'] }} testID="fx-month-total">{tr('fx.monthTotal', { amount: money(monthTotals.total), count: monthTotals.count })}</Text>
          {inMonth.length ? <ListGroup testID="fx-list">{inMonth.map(row)}</ListGroup>
            : <EmptyState icon="credit-card" title={tr('fx.empty.title')} body={tr('fx.empty.body')} action={{ label: tr('fx.add'), icon: 'plus', onPress: () => edit(null) }} />}
          {inMonth.length ? <Button label={tr('fx.export.month')} icon="download" variant="ghost" size="sm" onPress={() => void exportCsv(inMonth, month)} testID="fx-export-month" /> : null}
        </>
      ) : null}

      {tab === 'totals' ? (
        <>
          <ListGroup title={tr('fx.byCategory')} footer={tr('fx.monthTotal', { amount: money(monthTotals.total), count: monthTotals.count })} testID="fx-by-cat">
            {EXPENSE_CATEGORIES.filter((c) => monthTotals.byCategory[c]).map((c) => (
              <ListRow key={c} icon={CAT_ICON[c]} title={catLabel(c)} value={money(monthTotals.byCategory[c]!)} testID={`fx-cat-total-${c}`} />
            ))}
            {!monthTotals.count ? <ListRow icon="info" title={tr('fx.empty.title')} /> : null}
          </ListGroup>
          <ListGroup title={tr('fx.byAdult')} testID="fx-by-adult">
            {Object.entries(monthTotals.byPayer).map(([id, v]) => (
              <ListRow key={id} icon="user" title={id === 'none' ? tr('fx.f.payerNone') : nameOf(id)} value={money(v)} testID={`fx-adult-total-${id === 'none' ? 'none' : people.find((p) => p.id === id)?.isMe ? 'me' : 'other'}`} />
            ))}
          </ListGroup>
          {linked ? (
            <Banner tone="info" icon="users" title={tr('fx.childcare.title')}>
              <Text variant="small">{tr('fx.childcare.body', { name: linked.name, estimate: money(monthlyCost(linked).total), real: money(inMonth.filter((e) => e.candidate_id === linked.id).reduce((s, e) => s + e.amount, 0)) })}</Text>
            </Banner>
          ) : null}
          <Button label={tr('fx.childcare.open')} icon="clipboard" variant="ghost" size="sm" onPress={() => router.push('/garde/prep/budget' as never)} testID="fx-open-childcare-budget" />
        </>
      ) : null}

      {tab === 'split' ? (
        <>
          <Row wrap>
            {(['month', 'prev', 'three', 'custom'] as Period[]).map((p) => <Chip key={p} label={tr(`fx.period.${p}` as TKey)} selected={period === p} onPress={() => setPeriod(p)} testID={`fx-period-${p}`} />)}
          </Row>
          {period === 'custom' ? (
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <View style={{ flex: 1 }}><Field label={tr('fx.from')} value={from} onChangeText={setFrom} keyboardType="numbers-and-punctuation" testID="fx-from" /></View>
              <View style={{ flex: 1 }}><Field label={tr('fx.to')} value={to} onChangeText={setTo} keyboardType="numbers-and-punctuation" testID="fx-to" /></View>
            </View>
          ) : null}
          {adults.length < 2 ? <Banner tone="info" icon="user-plus">{tr('fx.split.alone')}</Banner> : null}
          {!range ? <Banner tone="warning">{tr('fx.err.period')}</Banner> : null}
          {range && split ? (
            <>
              <Text variant="small" muted>{tr('fx.split.range', { from: day(range.from, { day: 'numeric', month: 'short' }), to: day(range.to, { day: 'numeric', month: 'short', year: 'numeric' }) })}</Text>
              <ListGroup title={tr('fx.split.who')} footer={tr('fx.split.rule')} testID="fx-split">
                {adults.map((a) => (
                  <ListRow key={a.id} icon="user" title={a.label} subtitle={tr('fx.split.line', { paid: money(split.paid[a.id] ?? 0), borne: money(split.borne[a.id] ?? 0) })}
                    value={signedMoney(split.net[a.id] ?? 0)} testID={`fx-net-${a.isMe ? 'me' : 'other'}`} />
                ))}
              </ListGroup>
              <View testID="fx-transfers" style={{ gap: spacing.xs }}>
                {split.transfers.length ? split.transfers.map((tf) => (
                  <Banner key={`${tf.from}-${tf.to}`} tone="info" icon="repeat">{tr('fx.split.transfer', { from: nameOf(tf.from), to: nameOf(tf.to), amount: money(tf.amount) })}</Banner>
                )) : <Banner tone="success" icon="check-circle">{tr('fx.split.even')}</Banner>}
              </View>
              {split.ignored ? <Text variant="caption" muted>{tr('fx.split.ignored', { amount: money(split.ignored) })}</Text> : null}
              <Button label={tr('fx.export.period')} icon="download" variant="ghost" size="sm" onPress={() => void exportCsv(all.filter((e) => inRange(e, range.from, range.to)), `${range.from}_${range.to}`)} testID="fx-export-period" />
            </>
          ) : null}
        </>
      ) : null}
      <Text variant="caption" muted>{tr('fx.notice')}</Text>
      <ExpenseEditor visible={open} onClose={() => setOpen(false)} initial={editing} hid={hid} />
    </Screen>
  );
}
