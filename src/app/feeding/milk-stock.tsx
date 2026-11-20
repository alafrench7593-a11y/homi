/**
 * 73 — Gestion du stock de lait maternel et 74 — rappels de conservation. Contenants datés (sachets, biberons), lieu
 * (réfrigérateur, congélateur, température ambiante), quantité ; le plus ancien est proposé en premier ; alerte et
 * rappel avant la date limite. Relié au suivi du tire-lait (71/72) : une séance notée se range sans être ressaisie.
 * Date limite : préremplie avec les durées déjà publiées et sourcées dans le guide HOMI (mpedia, d'après l'Anses),
 * toujours modifiable, « selon les consignes de votre professionnel de santé ou de votre maternité ».
 */
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { EmptyState, Skeleton } from '@/components/States';
import { GlassSheet } from '@/components/glass';
import { confirm, useToast } from '@/components/Overlays';
import { Banner, Button, Card, Chip, Field, ListGroup, ListRow, Row, Text } from '@/components/ui';
import { BriefStrip } from '@/features/day5/DayParts';
import { SwitchRow } from '@/features/couple/CoupleKit';
import { WhenFields, whenOf, whenToIso, type WhenValue } from '@/components/CareInputs';
import { spacing } from '@/theme/tokens';
import { formatDate, t as tr, type TKey } from '@/i18n';
import { openLink } from '@/lib/links';
import { friendlyError } from '@/lib/data/hooks-settings';
import { useDeleteMilk, useMilkReminders, useMilkStock, useRecentPumpings, useSaveMilk } from '@/lib/data/hooks-feeding';
import { FeedingChildPicker, useFeedingChild } from '@/features/feeding/ui';
import {
  alertAt, defaultUseBy, fifo, freshness, KEEP_SOURCE, thaw, totals, unstoredPumpings, validateMilk, type MilkItem, type MilkLocation,
} from '@/features/feeding/milkStock';

const LOCS: MilkLocation[] = ['fridge', 'freezer', 'room'];
const SHORT = { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' } as const;
const DAY = { day: 'numeric', month: 'short', year: 'numeric' } as const;
const fmtBy = (i: Pick<MilkItem, 'use_by' | 'location'>) => formatDate(i.use_by, i.location === 'freezer' ? DAY : SHORT);

function ItemSheet({ item, visible, onClose, householdId, childId, fromPumping, onAct }: {
  item: MilkItem | null; visible: boolean; onClose: () => void; householdId: string; childId: string | null; fromPumping: { id: string; at: string; amount_ml: number } | null;
  onAct: (it: MilkItem, a: 'used' | 'discarded' | 'thaw') => Promise<void>;
}) {
  const toast = useToast();
  const save = useSaveMilk();
  const reminders = useMilkReminders().data ?? [];
  const [amount, setAmount] = useState('');
  const [when, setWhen] = useState<WhenValue>(whenOf());
  const [loc, setLoc] = useState<MilkLocation>('fridge');
  const [useBy, setUseBy] = useState<WhenValue>(whenOf());
  const [touched, setTouched] = useState(false);
  const [remind, setRemind] = useState(true);
  const [note, setNote] = useState('');
  const [err, setErr] = useState<string | null>(null);
  React.useEffect(() => {
    if (!visible) return;
    const at = item?.expressed_at ?? fromPumping?.at ?? new Date().toISOString();
    const l = item?.location ?? 'fridge';
    setAmount(item ? String(item.amount_ml) : fromPumping ? String(fromPumping.amount_ml) : '');
    setWhen(whenOf(at)); setLoc(l); setUseBy(whenOf(item?.use_by ?? defaultUseBy(at, l))); setTouched(!!item);
    setNote(item?.note ?? ''); setErr(null); setRemind(true);
  }, [visible, item?.id, fromPumping?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!visible) return null;
  const expressedAt = whenToIso(when);
  // Date limite préremplie qui suit la date et le lieu tant qu'elle n'a pas été modifiée à la main
  const refill = (at: string | null, l: MilkLocation) => { if (!touched && at) setUseBy(whenOf(defaultUseBy(at, l))); };
  async function submit() {
    const ml = /^\d{1,4}$/.test(amount.trim()) ? Number(amount.trim()) : null;
    const by = whenToIso(useBy);
    const e = validateMilk({ amount: ml, expressedAt, useBy: by });
    if (e) return setErr(tr(e));
    const previous = item ? reminders.find((r) => r.deep_link === `/feeding/milk-stock?item=${item.id}`)?.id ?? null : null;
    const row: Partial<MilkItem> & { household_id: string } = {
      ...(item ?? {}), household_id: householdId, child_id: item?.child_id ?? childId, pumping_id: item?.pumping_id ?? fromPumping?.id ?? null,
      expressed_at: expressedAt!, amount_ml: ml!, location: loc, use_by: by!, note: note.trim() || null,
    };
    try {
      const r = await save.mutateAsync({ row, reminder: { at: remind ? alertAt({ use_by: by!, location: loc }) : null, title: tr('milk.reminderTitle', { ml: ml! }), previousId: previous } });
      toast(r.queued ? tr('milk.savedOffline') : tr('milk.saved'), 'success'); onClose();
    } catch (x) { toast(friendlyError(x), 'error'); }
  }
  return (
    <GlassSheet visible onClose={onClose} title={item ? tr('milk.edit') : tr('milk.add')}>
      {item && item.status === 'stored' ? (
        <Row wrap gap={spacing.xs}>
          <Button label={tr('milk.act.used')} icon="check" size="sm" onPress={() => void onAct(item, 'used').then(onClose)} testID="milk-act-used" />
          <Button label={tr('milk.act.discard')} icon="x" size="sm" variant="secondary" onPress={() => void onAct(item, 'discarded').then(onClose)} testID="milk-act-discard" />
          {item.location === 'freezer' ? <Button label={tr('milk.act.thaw')} icon="thermometer" size="sm" variant="ghost" onPress={() => void onAct(item, 'thaw').then(onClose)} testID="milk-act-thaw" /> : null}
        </Row>
      ) : null}
      {fromPumping ? <Banner tone="info" icon="link">{tr('milk.fromPumping', { ml: fromPumping.amount_ml, time: formatDate(fromPumping.at, SHORT) })}</Banner> : null}
      <Field label={tr('milk.amount')} value={amount} onChangeText={setAmount} keyboardType="number-pad" suffix="ml" testID="milk-f-amount" />
      <WhenFields value={when} onChange={(v) => { setWhen(v); refill(whenToIso(v), loc); }} days="past" dateLabel={tr('milk.expressedOn')} testID="milk-f-when" />
      <Text variant="label">{tr('milk.location')}</Text>
      <Row wrap>{LOCS.map((l) => <Chip key={l} label={tr(`milk.loc.${l}` as TKey)} selected={loc === l} onPress={() => { setLoc(l); refill(expressedAt, l); }} testID={`milk-f-loc-${l}`} />)}</Row>
      <WhenFields value={useBy} onChange={(v) => { setUseBy(v); setTouched(true); }} dateLabel={tr('milk.useBy')} timeLabel={tr('milk.useByTime')} testID="milk-f-useby" />
      <Text variant="caption" muted testID="milk-f-advice">{tr('milk.useByAdvice')}</Text>
      <SwitchRow label={tr('milk.remind')} value={remind} onChange={setRemind} testID="milk-f-remind" />
      <Field label={tr('milk.note')} optional value={note} onChangeText={setNote} maxLength={300} testID="milk-f-note" />
      {err ? <Banner tone="danger">{err}</Banner> : null}
      <Button label={tr('common.save')} icon="check" loading={save.isPending} onPress={() => void submit()} testID="milk-f-save" />
    </GlassSheet>
  );
}

export default function MilkStock() {
  const toast = useToast();
  const params = useLocalSearchParams<{ item?: string; pumping?: string }>();
  const { children, child, setChild, loading } = useFeedingChild();
  const hid = child?.household_id ?? null;
  const q = useMilkStock(hid);
  const save = useSaveMilk();
  const del = useDeleteMilk();
  const pumpings = useRecentPumpings(child?.id ?? null).data ?? [];
  const [sheet, setSheet] = useState<{ item: MilkItem | null; pumping: { id: string; at: string; amount_ml: number } | null } | null>(null);
  const all = useMemo(() => q.data ?? [], [q.data]);
  const stored = useMemo(() => fifo(all.filter((x) => !child || !x.child_id || x.child_id === child.id)), [all, child]);
  const closed = all.filter((x) => x.status !== 'stored').sort((a, b) => (b.closed_at ?? '').localeCompare(a.closed_at ?? ''));
  const tot = totals(stored);
  const waiting = unstoredPumpings(pumpings, all);
  const now = new Date();
  const expired = stored.filter((x) => freshness(x, now) === 'expired');
  const soon = stored.filter((x) => freshness(x, now) === 'soon');
  React.useEffect(() => {
    if (params.item && all.length && !sheet) { const it = all.find((x) => x.id === params.item); if (it) setSheet({ item: it, pumping: null }); }
    else if (params.pumping && pumpings.length && !sheet) { const p = pumpings.find((x) => x.id === params.pumping); if (p && waiting.includes(p)) setSheet({ item: null, pumping: p }); }
  }, [params.item, params.pumping, all.length, pumpings.length]); // eslint-disable-line react-hooks/exhaustive-deps

  async function close(it: MilkItem, status: 'used' | 'discarded') {
    try {
      const r = await save.mutateAsync({ row: { ...it, status, closed_at: new Date().toISOString() } });
      toast(r.queued ? tr('milk.savedOffline') : tr(`milk.closed.${status}` as TKey), 'success');
    } catch (x) { toast(friendlyError(x), 'error'); }
  }
  async function doThaw(it: MilkItem) {
    try { await save.mutateAsync({ row: { ...it, ...thaw(it) } }); toast(tr('milk.thawed'), 'success'); } catch (x) { toast(friendlyError(x), 'error'); }
  }
  async function remove(it: MilkItem) {
    if (!(await confirm(tr('milk.delete'), tr('milk.deleteQ'), tr('milk.delete')))) return;
    try { await del.mutateAsync(it.id); toast(tr('milk.deleted'), 'success'); } catch (x) { toast(friendlyError(x), 'error'); }
  }
  const label = (it: MilkItem) => tr('milk.rowTitle', { ml: it.amount_ml, loc: tr(`milk.loc.${it.location}` as TKey) });
  const sub = (it: MilkItem) => {
    const f = freshness(it, now);
    return [tr('milk.expressed', { date: formatDate(it.expressed_at, SHORT) }), it.thawed_at ? tr('milk.thawedTag') : null,
      f === 'expired' ? tr('milk.expiredOn', { date: fmtBy(it) }) : f === 'soon' ? tr('milk.soonOn', { date: fmtBy(it) }) : tr('milk.until', { date: fmtBy(it) }),
      it.pumping_id ? tr('milk.linked') : null, it._pending ? tr('milk.pending') : null].filter(Boolean).join(' · ');
  };
  const first = stored.find((x) => freshness(x, now) !== 'expired') ?? null;

  if (loading || (q.isLoading && !q.data && hid)) return <Screen back title={tr('milk.title')} tool={false}><Skeleton rows={4} /></Screen>;
  if (!child || !hid) return <Screen back title={tr('milk.title')} tool={false}><EmptyState icon="droplet" title={tr('milk.title')} body={tr('milk.noChild')} /></Screen>;
  return (
    <Screen back title={tr('milk.title')} subtitle={tr('milk.subtitle', { name: child.first_name })} tool={false}
      action={{ label: tr('milk.add'), icon: 'plus', onPress: () => setSheet({ item: null, pumping: null }), testID: 'milk-add' }}>
      <FeedingChildPicker list={children} value={child.id} onChange={setChild} />
      <BriefStrip testID="milk-totals" items={LOCS.filter((l) => l !== 'room' || tot.room.count).map((l) => ({ value: tot[l].ml ? `${tot[l].ml} ml` : '—', label: tr('milk.totalLabel', { loc: tr(`milk.loc.${l}` as TKey), count: tot[l].count }) }))} />
      {expired.length ? <Banner tone="warning" icon="alert-triangle">{tr('milk.alertExpired', { count: expired.length })}</Banner> : null}
      {soon.length ? <Banner tone="info" icon="bell">{tr('milk.alertSoon', { count: soon.length })}</Banner> : null}
      {first ? (
        <Card testID="milk-first">
          <Text variant="caption" muted>{tr('milk.useFirst')}</Text>
          <Text weight="bold">{label(first)}</Text>
          <Text variant="small" muted>{sub(first)}</Text>
          <Row wrap gap={spacing.xs}>
            <Button label={tr('milk.act.used')} icon="check" size="sm" onPress={() => void close(first, 'used')} testID="milk-first-used" />
            {first.location === 'freezer' ? <Button label={tr('milk.act.thaw')} icon="thermometer" size="sm" variant="secondary" onPress={() => void doThaw(first)} testID="milk-first-thaw" /> : null}
          </Row>
        </Card>
      ) : null}
      {waiting.length ? (
        <ListGroup title={tr('milk.fromPumpingTitle')} footer={tr('milk.fromPumpingFooter')} testID="milk-pumpings">
          {waiting.slice(0, 5).map((p) => (
            <ListRow key={p.id} icon="droplet" title={tr('milk.pumpingRow', { ml: p.amount_ml })} subtitle={formatDate(p.at, SHORT)}
              right={<Button label={tr('milk.store')} size="sm" variant="secondary" onPress={() => setSheet({ item: null, pumping: p })} testID={`milk-store-${p.amount_ml}`} />} />
          ))}
        </ListGroup>
      ) : null}
      {stored.length ? (
        <ListGroup title={tr('milk.stockTitle')} testID="milk-list">
          {stored.map((it, i) => (
            <ListRow key={it.id} icon={it.location === 'freezer' ? 'box' : it.location === 'room' ? 'home' : 'archive'} title={label(it)} subtitle={sub(it)}
              onPress={() => setSheet({ item: it, pumping: null })} testID={`milk-row-${i}`} />
          ))}
        </ListGroup>
      ) : <EmptyState icon="droplet" title={tr('milk.emptyTitle')} body={tr('milk.emptyBody')} action={{ label: tr('milk.add'), onPress: () => setSheet({ item: null, pumping: null }) }} />}
      {closed.length ? (
        <ListGroup title={tr('milk.history')} testID="milk-history">
          {closed.slice(0, 20).map((it) => (
            <ListRow key={it.id} icon={it.status === 'used' ? 'check-circle' : 'x-circle'} title={label(it)}
              subtitle={[tr(`milk.status.${it.status}` as TKey), it.closed_at ? formatDate(it.closed_at, SHORT) : null].filter(Boolean).join(' · ')}
              onPress={() => void remove(it)} />
          ))}
        </ListGroup>
      ) : null}
      <View style={{ gap: spacing.xs }}>
        <Text variant="caption" muted testID="milk-source">{tr('milk.sourceNote')}</Text>
        <Row wrap gap={spacing.xs}>
          <Button label={tr('milk.sourceArticle')} size="sm" variant="ghost" icon="book-open" onPress={() => router.push(`/article/${KEEP_SOURCE.article}`)} />
          <Button label={tr('milk.sourceLink')} size="sm" variant="ghost" icon="external-link" onPress={() => openLink(KEEP_SOURCE.url, toast)} />
          <Button label={tr('milk.pumpingLink')} size="sm" variant="ghost" icon="droplet" onPress={() => router.push({ pathname: '/track/[kind]', params: { kind: 'pumping', child: child.id } })} testID="milk-pumping-link" />
        </Row>
      </View>
      <ItemSheet item={sheet?.item ?? null} visible={!!sheet} onClose={() => setSheet(null)} householdId={hid} childId={child.id} fromPumping={sheet?.pumping ?? null}
        onAct={(it, a) => (a === 'thaw' ? doThaw(it) : close(it, a))} />
    </Screen>
  );
}
