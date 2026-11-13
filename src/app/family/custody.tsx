/**
 * Garde alternée : le rythme convenu (une semaine sur deux, 2-2-5-5, 2-2-3 ou personnalisé), « chez qui »
 * aujourd'hui, la prochaine passation (heure, lieu), un calendrier de 4 semaines et les exceptions (vacances,
 * échanges). Partagé dans le foyer (domaine « daily »). L'application reflète l'accord des parents ou la
 * décision du juge ; elle ne tranche rien.
 */
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Screen } from '@/components/Screen';
import { confirm, Sheet, useToast } from '@/components/Overlays';
import { EmptyState } from '@/components/States';
import { Tappable } from '@/components/Tappable';
import { Banner, Button, Card, Chip, Field, ListRow, Loading, Row, SectionTitle, Text } from '@/components/ui';
import { backend, eq } from '@/lib/backend';
import { useChildren, useHouseholdId, useInvalidate } from '@/lib/data/hooks';
import { friendlyError } from '@/lib/data/hooks-settings';
import { useCustodyExceptions, useCustodyPlans, type CustodyPlan } from '@/lib/data/hooks-tools6';
import { custodyDays, isValidCycle, mondayOf, nextHandover, PATTERNS, shareOver, sideOn, type CustodyPattern, type Side } from '@/lib/domain/custody';
import { addDays, frToISO, todayISO } from '@/lib/domain/dates';
import { toFrDate } from '@/lib/validation';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { formatDate, t as tr, type TKey } from '@/i18n';

const PATTERN_KEYS: CustodyPattern[] = ['week', '2255', '223', 'custom'];
const hhmm = (v: string | null) => (v ? v.slice(0, 5) : '');
const normTime = (v: string) => { const m = v.trim().match(/^(\d{1,2})[:h](\d{2})$/); return m && Number(m[1]) < 24 && Number(m[2]) < 60 ? `${m[1].padStart(2, '0')}:${m[2]}` : null; };

function useSideColors() {
  const t = useTheme();
  // deux teintes nettement différentes (chaud / froid) en plus de la lettre A ou B : jamais la couleur seule
  return { A: t.isDark ? 'rgba(238,201,152,0.45)' : 'rgba(223,187,139,0.75)', B: t.isDark ? 'rgba(120,185,255,0.38)' : 'rgba(160,200,255,0.85)' } as Record<Side, string>;
}

function PlanEditor({ plan, visible, onClose }: { plan?: CustodyPlan; visible: boolean; onClose: (id?: string) => void }) {
  const toast = useToast();
  const inv = useInvalidate();
  const hid = useHouseholdId();
  const children = useChildren().data ?? [];
  const colors = useSideColors();
  const [a, setA] = useState(''); const [b, setB] = useState('');
  const [pattern, setPattern] = useState<CustodyPattern>('week');
  const [cycle, setCycle] = useState(PATTERNS.week);
  const [anchor, setAnchor] = useState(toFrDate(mondayOf(todayISO())));
  const [time, setTime] = useState(''); const [place, setPlace] = useState('');
  const [childId, setChildId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  React.useEffect(() => {
    if (!visible) return;
    setA(plan?.label_a ?? ''); setB(plan?.label_b ?? ''); setPattern(plan?.pattern ?? 'week'); setCycle(plan?.cycle ?? PATTERNS.week);
    setAnchor(toFrDate(plan?.anchor_on ?? mondayOf(todayISO()))); setTime(hhmm(plan?.handover_time ?? null)); setPlace(plan?.handover_place ?? ''); setChildId(plan?.child_id ?? null);
  }, [visible, plan]);
  function pick(p: CustodyPattern) { setPattern(p); if (p !== 'custom') setCycle(PATTERNS[p]); }
  const flip = (i: number) => { setPattern('custom'); setCycle((c) => c.slice(0, i) + (c[i] === 'A' ? 'B' : 'A') + c.slice(i + 1)); };
  async function save() {
    const anchorOn = frToISO(anchor);
    if (!a.trim() || !b.trim()) return toast(tr('cu.errLabels'), 'error');
    if (!anchorOn) return toast(tr('pma.errDate'), 'error');
    if (!isValidCycle(cycle)) return toast(tr('cu.errCycle'), 'error');
    if (time && !normTime(time)) return toast(tr('pma.errTime'), 'error');
    if (!hid) return;
    setBusy(true);
    try {
      const row = { label_a: a.trim().slice(0, 40), label_b: b.trim().slice(0, 40), pattern, cycle, anchor_on: anchorOn, handover_time: time ? normTime(time) : null, handover_place: place.trim() || null, child_id: childId };
      let id = plan?.id;
      if (plan) await backend.update('custody_plans', row, [eq('id', plan.id)]);
      else id = (await backend.insert<CustodyPlan>('custody_plans', { ...row, household_id: hid }))[0]?.id;
      inv('custody_plans');
      toast(tr('cu.saved'));
      onClose(id);
    } catch (e) { toast(friendlyError(e), 'error'); } finally { setBusy(false); }
  }
  async function remove() {
    if (!plan || !(await confirm(tr('common.delete'), tr('cu.deleteQ'), tr('common.delete')))) return;
    try { await backend.remove('custody_plans', [eq('id', plan.id)]); inv('custody_plans', 'custody_exceptions'); onClose(); } catch (e) { toast(friendlyError(e), 'error'); }
  }
  return (
    <Sheet visible={visible} onClose={() => onClose()} title={plan ? tr('cu.edit') : tr('cu.new')}>
      {children.length ? (
        <>
          <Text variant="label">{tr('cu.for')}</Text>
          <Row wrap>
            <Chip label={tr('kr.forAll')} selected={!childId} onPress={() => setChildId(null)} />
            {children.map((c) => <Chip key={c.id} label={c.first_name} selected={childId === c.id} onPress={() => setChildId(c.id)} />)}
          </Row>
        </>
      ) : null}
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <View style={{ flex: 1 }}><Field label={tr('cu.labelA')} value={a} onChangeText={setA} maxLength={40} placeholder={tr('cu.phA')} testID="cu-a" /></View>
        <View style={{ flex: 1 }}><Field label={tr('cu.labelB')} value={b} onChangeText={setB} maxLength={40} placeholder={tr('cu.phB')} testID="cu-b" /></View>
      </View>
      <Text variant="label">{tr('cu.pattern')}</Text>
      <Row wrap>{PATTERN_KEYS.map((p) => <Chip key={p} label={tr(`cu.p.${p}` as TKey)} selected={pattern === p} onPress={() => pick(p)} testID={`cu-pattern-${p}`} />)}</Row>
      <Text variant="small" muted>{tr(`cu.p.${pattern}.d` as TKey)}</Text>
      <Text variant="small" muted>{tr('cu.tapToChange')}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
        {cycle.split('').map((s, i) => (
          <Tappable key={i} accessibilityRole="button" accessibilityLabel={tr('cu.dayA11y', { n: i + 1, side: s === 'A' ? (a || 'A') : (b || 'B') })} onPress={() => flip(i)}
            style={{ width: 38, height: 44, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', backgroundColor: colors[s as Side] }}>
            <Text variant="caption" muted>{tr(`cu.wd.${i % 7}` as TKey)}</Text>
            <Text weight="bold">{s}</Text>
          </Tappable>
        ))}
      </View>
      <Field label={tr('cu.anchor')} value={anchor} onChangeText={setAnchor} keyboardType="numbers-and-punctuation" hint={tr('cu.anchorHint')} />
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <View style={{ flex: 1 }}><Field label={tr('cu.time')} optional value={time} onChangeText={setTime} keyboardType="numbers-and-punctuation" placeholder="18:00" /></View>
        <View style={{ flex: 2 }}><Field label={tr('cu.place')} optional value={place} onChangeText={setPlace} maxLength={120} placeholder={tr('cu.placePh')} /></View>
      </View>
      <Button label={tr('common.save')} loading={busy} onPress={() => void save()} testID="cu-save" />
      {plan ? <Button label={tr('common.delete')} variant="ghost" onPress={() => void remove()} /> : null}
    </Sheet>
  );
}

function ExceptionForm({ plan, visible, onClose }: { plan: CustodyPlan; visible: boolean; onClose: () => void }) {
  const toast = useToast();
  const inv = useInvalidate();
  const [from, setFrom] = useState(''); const [to, setTo] = useState('');
  const [side, setSide] = useState<Side>('A'); const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  React.useEffect(() => { if (visible) { setFrom(toFrDate(todayISO())); setTo(toFrDate(todayISO())); setSide('A'); setNote(''); } }, [visible]);
  async function save() {
    const f = frToISO(from); const t2 = frToISO(to);
    if (!f || !t2) return toast(tr('pma.errDate'), 'error');
    if (t2 < f) return toast(tr('pma.errEnd'), 'error');
    setBusy(true);
    try {
      await backend.insert('custody_exceptions', { household_id: plan.household_id, plan_id: plan.id, from_on: f, to_on: t2, side, note: note.trim() || null });
      inv('custody_exceptions');
      toast(tr('cu.exSaved'));
      onClose();
    } catch (e) { toast(friendlyError(e), 'error'); } finally { setBusy(false); }
  }
  return (
    <Sheet visible={visible} onClose={onClose} title={tr('cu.addException')}>
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <View style={{ flex: 1 }}><Field label={tr('pma.from')} value={from} onChangeText={setFrom} keyboardType="numbers-and-punctuation" /></View>
        <View style={{ flex: 1 }}><Field label={tr('pma.to')} value={to} onChangeText={setTo} keyboardType="numbers-and-punctuation" /></View>
      </View>
      <Text variant="label">{tr('cu.where')}</Text>
      <Row wrap>
        <Chip label={plan.label_a} selected={side === 'A'} onPress={() => setSide('A')} />
        <Chip label={plan.label_b} selected={side === 'B'} onPress={() => setSide('B')} />
      </Row>
      <Field label={tr('cu.exNote')} optional value={note} onChangeText={setNote} maxLength={200} placeholder={tr('cu.exNotePh')} />
      <Button label={tr('common.save')} loading={busy} onPress={() => void save()} testID="cu-ex-save" />
    </Sheet>
  );
}

export default function Custody() {
  const t = useTheme();
  const toast = useToast();
  const inv = useInvalidate();
  const colors = useSideColors();
  const plansQ = useCustodyPlans();
  const children = useChildren().data ?? [];
  const plans = plansQ.data ?? [];
  const [selected, setSelected] = useState<string | null>(null);
  const plan = plans.find((p) => p.id === selected) ?? plans[0] ?? null;
  const today = todayISO();
  const start = mondayOf(today);
  const exQ = useCustodyExceptions(plan?.id, addDays(start, -1));
  const ex = useMemo(() => exQ.data ?? [], [exQ.data]);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<CustodyPlan | undefined>();
  const [exOpen, setExOpen] = useState(false);
  const days = useMemo(() => (plan ? custodyDays(plan, start, 28, ex) : []), [plan, start, ex]);
  const label = (s: Side) => (s === 'A' ? plan!.label_a : plan!.label_b);
  const childName = (p: CustodyPlan) => children.find((c) => c.id === p.child_id)?.first_name;

  async function removeException(id: string) {
    if (!(await confirm(tr('common.delete'), tr('cu.exDeleteQ'), tr('common.delete')))) return;
    try { await backend.remove('custody_exceptions', [eq('id', id)]); inv('custody_exceptions'); } catch (e) { toast(friendlyError(e), 'error'); }
  }

  if (plansQ.isLoading) return <Screen back title={tr('tool.custody')}><Loading /></Screen>;
  const nowSide = plan ? sideOn(plan, today, ex) : null;
  const next = plan ? nextHandover(plan, addDays(today, 1), ex) : null;
  const todayHandover = plan ? days.find((d) => d.date === today)?.handover : false;
  const share = plan ? shareOver(plan, start, 28, ex) : null;

  return (
    <Screen back title={tr('tool.custody')} subtitle={tr('tool.custody.sub')}
      action={plan ? { label: tr('cu.edit'), icon: 'edit-2', onPress: () => { setEditing(plan); setEditOpen(true); }, testID: 'cu-edit' } : undefined}>
      {!plan ? (
        <>
          <Text muted>{tr('cu.intro')}</Text>
          <EmptyState icon="home" title={tr('cu.none')} body={tr('cu.noneD')} action={{ label: tr('cu.new'), onPress: () => { setEditing(undefined); setEditOpen(true); } }} />
        </>
      ) : (
        <>
          {plans.length > 1 ? <Row wrap>{plans.map((p) => <Chip key={p.id} label={childName(p) ?? `${p.label_a} / ${p.label_b}`} selected={p.id === plan.id} onPress={() => setSelected(p.id)} />)}</Row> : null}
          <Card tone="soft" testID="cu-today">
            <Text variant="small" muted>{tr('cu.today', { name: childName(plan) ?? tr('cu.theChildren') })}</Text>
            <Text variant="title">{label(nowSide!)}</Text>
            {todayHandover ? <Text weight="bold">{tr('cu.handoverToday', { time: hhmm(plan.handover_time) || tr('cu.noTime') })}</Text> : null}
            {next ? <Text>{tr('cu.next', { date: formatDate(next.date, { weekday: 'long', day: 'numeric', month: 'long' }), side: label(next.side), time: plan.handover_time ? ` · ${hhmm(plan.handover_time)}` : '' })}</Text> : null}
            {plan.handover_place ? <Text variant="small" muted>{tr('cu.placeIs', { place: plan.handover_place })}</Text> : null}
          </Card>

          <SectionTitle title={tr('cu.calendar')} />
          <Card>
            <View style={{ flexDirection: 'row', gap: 4 }}>
              {[0, 1, 2, 3, 4, 5, 6].map((i) => <Text key={i} variant="caption" muted center style={{ flex: 1 }}>{tr(`cu.wd.${i}` as TKey)}</Text>)}
            </View>
            {[0, 1, 2, 3].map((w) => (
              <View key={w} style={{ flexDirection: 'row', gap: 4, marginTop: 4 }}>
                {days.slice(w * 7, w * 7 + 7).map((d) => (
                  <View key={d.date} testID={`cu-day-${d.date}`} accessibilityLabel={`${formatDate(d.date, { weekday: 'long', day: 'numeric', month: 'long' })} : ${label(d.side)}${d.handover ? `, ${tr('cu.handover')}` : ''}`}
                    style={{ flex: 1, height: 46, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', backgroundColor: colors[d.side],
                      borderWidth: d.date === today ? 2 : d.exception ? 1 : 0, borderColor: d.date === today ? t.colors.primary : t.colors.border, borderStyle: d.exception && d.date !== today ? 'dashed' : 'solid' }}>
                    <Text weight={d.date === today ? 'bold' : undefined}>{Number(d.date.slice(8, 10))}</Text>
                    <Text variant="caption" muted>{d.handover ? '⇄' : d.side}</Text>
                  </View>
                ))}
              </View>
            ))}
            <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm, flexWrap: 'wrap' }}>
              {(['A', 'B'] as Side[]).map((s) => (
                <View key={s} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={{ width: 14, height: 14, borderRadius: 4, backgroundColor: colors[s] }} />
                  <Text variant="small">{s} · {label(s)} · {tr('cu.daysN', { count: share![s] })}</Text>
                </View>
              ))}
              <Text variant="small" muted>⇄ {tr('cu.handover')}</Text>
            </View>
          </Card>

          <SectionTitle title={tr('cu.exceptions')} action={tr('cu.addException')} onAction={() => setExOpen(true)} />
          {!ex.length ? <Card tone="soft"><Text muted>{tr('cu.noExceptions')}</Text></Card> : (
            <Card padded={false}>
              {ex.map((e) => (
                <ListRow key={e.id} icon="shuffle" title={`${label(e.side)}${e.note ? ` · ${e.note}` : ''}`}
                  subtitle={e.from_on === e.to_on ? formatDate(e.from_on, { weekday: 'short', day: 'numeric', month: 'short' }) : tr('cu.range', { from: formatDate(e.from_on, { day: 'numeric', month: 'short' }), to: formatDate(e.to_on, { day: 'numeric', month: 'short' }) })}
                  onPress={() => void removeException(e.id)} />
              ))}
            </Card>
          )}
          <Banner tone="info" icon="users">{tr('cu.help')}</Banner>
          <Button label={tr('cu.new')} icon="plus" variant="ghost" onPress={() => { setEditing(undefined); setEditOpen(true); }} />
          <ExceptionForm plan={plan} visible={exOpen} onClose={() => setExOpen(false)} />
        </>
      )}
      <PlanEditor plan={editing} visible={editOpen} onClose={(id) => { setEditOpen(false); if (id) setSelected(id); }} />
    </Screen>
  );
}
