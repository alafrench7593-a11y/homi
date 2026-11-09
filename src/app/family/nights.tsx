/**
 * Relais de nuit : qui se lève quelle nuit. Alterné, fixe ou personnalisé — y compris pour une
 * famille monoparentale ou un réseau d'aidants. Aucun score nocturne, aucun compteur par personne.
 */
import React, { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { TodaySummary } from '@/components/MiniApp';
import { EmptyState, ErrorView, Skeleton } from '@/components/States';
import { StaggerItem } from '@/components/Motion';
import { confirm, useToast } from '@/components/Overlays';
import { Banner, Button, Card, Chip, Field, ListRow, Row, SectionTitle, Segmented, Text } from '@/components/ui';
import { RequestSheet } from '@/features/familyLoad';
import { RelayStrip } from '@/features/motionViz';
import { useCareShifts, useDeleteShift, usePeople, useSaveShifts, useUpdateShift } from '@/lib/data/hooks-family-load';
import { friendlyError } from '@/lib/data/hooks-settings';
import { planNights, shiftConflicts, type CareShift, type NightPattern } from '@/lib/domain/familyLoad';
import { frToISO, todayISO } from '@/lib/domain/dates';
import { toFrDate } from '@/lib/validation';
import { spacing } from '@/theme/tokens';
import { GlassSurface } from '@/components/Glass';
import { Icon } from '@/components/ui';
import { tint } from '@/components/ToolGlyph';
import { useTheme } from '@/theme/ThemeProvider';
import { t as tr, formatDate, formatRelative, formatTime } from '@/i18n';

const fmtNight = (s: { starts_at: string; ends_at: string }) => tr('u2.nights.night_of', { date: formatDate(s.starts_at, { weekday: 'long', day: 'numeric', month: 'long' }), from: formatTime(s.starts_at), to: formatTime(s.ends_at) });

/** « dans 20 minutes », « dans 3 heures »… dans la langue courante. */
function startsIn(iso: string) {
  const min = Math.max(1, Math.round((Date.parse(iso) - Date.now()) / 60000));
  if (min < 60) return formatRelative(min, 'minute');
  if (min < 1440) return formatRelative(Math.round(min / 60), 'hour');
  return formatRelative(Math.round(min / 1440), 'day');
}

export default function NightRelay() {
  const toast = useToast();
  const t = useTheme();
  const { people, labelOf, me } = usePeople();
  const shiftsQ = useCareShifts('night');
  const save = useSaveShifts();
  const update = useUpdateShift();
  const del = useDeleteShift();
  const [pattern, setPattern] = useState<NightPattern>('alternate');
  const [order, setOrder] = useState<string[]>([]);
  const [start, setStart] = useState(toFrDate(todayISO()));
  const [nights, setNights] = useState('7');
  const [startHour, setStartHour] = useState('22');
  const [endHour, setEndHour] = useState('6');
  const [custom, setCustom] = useState<Record<number, string>>({});
  const [swap, setSwap] = useState<string | null>(null);

  const chosen = order.length ? order : people.map((p) => p.id);
  const startIso = frToISO(start);
  const n = Math.max(1, Math.min(31, Number(nights) || 0));
  const plan = useMemo(() => (startIso && chosen.length ? planNights({ pattern, people: chosen, startDay: startIso, nights: n, startHour: Number(startHour) || 22, endHour: Number(endHour) || 6, custom: Array.from({ length: n }, (_, i) => custom[i] ?? chosen[i % chosen.length]) }) : []), [pattern, chosen, startIso, n, startHour, endHour, custom]);
  const upcoming = (shiftsQ.data ?? []).filter((s) => s.status !== 'cancelled' && Date.parse(s.ends_at) > Date.now());
  const conflicts = shiftConflicts(plan, upcoming);
  const sortedUp = [...upcoming].sort((a, b) => (a.starts_at < b.starts_at ? -1 : 1));
  // la nuit en cours ou celle de ce soir (commence avant demain midi)
  const tonight = sortedUp.find((x) => Date.parse(x.starts_at) < new Date(new Date().setHours(36, 0, 0, 0)).getTime());
  const myPending = sortedUp.find((x) => x.user_id === me && x.status === 'planned');

  function toggleOrder(id: string) { setOrder((cur) => { const base = cur.length ? cur : []; return base.includes(id) ? base.filter((x) => x !== id) : [...base, id]; }); }

  async function submit() {
    if (!plan.length) return toast(tr('u2.nights.check_start'), 'error');
    const msg = conflicts.length ? tr('u2.nights.conflict_confirm', { count: conflicts.length }) : tr('u2.nights.will_add', { count: plan.length });
    if (!(await confirm(tr('u2.nights.save_title'), msg, tr('u2.nights.save'), false))) return;
    try { await save.mutateAsync(plan); toast(tr('u2.nights.saved')); } catch (e) { toast(friendlyError(e), 'error'); }
  }

  async function setStatus(s: CareShift, status: CareShift['status'], msg: string) {
    try { await update.mutateAsync({ id: s.id, patch: { status } }); toast(msg); } catch (e) { toast(friendlyError(e), 'error'); }
  }
  async function remove(s: CareShift) {
    if (!(await confirm(tr('u2.nights.remove_title'), fmtNight(s), tr('u2.nights.remove')))) return;
    try { await del.mutateAsync(s.id); toast(tr('u2.nights.removed')); } catch (e) { toast(friendlyError(e), 'error'); }
  }

  return (
    <Screen back title={tr('u2.nights.title')} subtitle={tr('u2.nights.subtitle')}
      action={myPending ? { label: tr('u2.nights.confirm_next'), icon: 'check', onPress: () => setStatus(myPending, 'confirmed', tr('u2.nights.confirmed_toast')), testID: 'nights-confirm-next' }
        : plan.length ? { label: tr('u2.nights.save_plan', { count: plan.length }), icon: 'calendar', onPress: submit, disabled: save.isPending, testID: 'nights-save-plan' } : undefined}>
      <TodaySummary items={[
        { icon: 'moon', value: tonight ? labelOf(tonight.user_id) : '—', label: tr('u2.nights.tonight') },
        { icon: 'calendar', value: String(upcoming.filter((x) => x.user_id === me).length), label: tr('u2.nights.my_upcoming') },
        { icon: 'check-circle', value: String(upcoming.filter((x) => x.user_id === me && x.status === 'planned').length), label: tr('u2.nights.to_confirm') },
      ]} />
      {tonight ? (
        // Ce soir, en grand : qui se lève, à quelle heure ; confirmer ou proposer un échange en un geste
        <GlassSurface fill={t.colors.surface} depth={2} radius={26}>
          <View style={{ padding: spacing.lg, gap: spacing.sm }} testID="nights-tonight">
            <Row style={{ alignItems: 'center' }}>
              <View style={{ width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: tint(t.colors.lavender, t.isDark ? 0.25 : 0.15) }}>
                <Icon name="moon" size={24} color={t.colors.lavender} />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="caption" muted style={{ letterSpacing: 1.1, textTransform: 'uppercase' }}>{Date.parse(tonight.starts_at) <= Date.now() ? tr('u2.nights.tonight') : tr('u2.nights.this_evening')}</Text>
                <Text weight="bold" style={{ fontSize: 28, lineHeight: 33 }} testID="nights-tonight-who">{tonight.user_id === me ? tr('u2.nights.you') : labelOf(tonight.user_id)}</Text>
              </View>
            </Row>
            <Text variant="small" muted>
              {`${formatTime(tonight.starts_at)} – ${formatTime(tonight.ends_at)}`}
              {Date.parse(tonight.starts_at) > Date.now() ? ` · ${tr('u2.nights.starts', { when: startsIn(tonight.starts_at) })}` : ''}
              {tonight.status === 'confirmed' ? ` · ${tr('u2.nights.confirmed')}` : tonight.status === 'swapped' ? ` · ${tr('u2.nights.swapped')}` : ` · ${tr('u2.nights.to_confirm_lc')}`}
            </Text>
            {tonight.user_id === me ? (
              <Row wrap>
                {tonight.status === 'planned' ? <Button label={tr('u2.nights.i_confirm')} icon="check" size="sm" onPress={() => setStatus(tonight, 'confirmed', tr('u2.nights.confirmed_toast'))} testID="nights-tonight-confirm" style={{ flexGrow: 1 }} /> : null}
                <Button label={tr('u2.nights.propose_swap')} icon="shuffle" size="sm" variant="secondary" onPress={() => setSwap(tonight.id)} testID="nights-tonight-swap" style={{ flexGrow: 1 }} />
              </Row>
            ) : null}
          </View>
        </GlassSurface>
      ) : null}
      <SectionTitle title={tr('u2.nights.planned')} />
      {upcoming.length ? (
        <Card padded={false} style={{ paddingVertical: spacing.sm }}>
          <ScrollView horizontal keyboardShouldPersistTaps="handled" showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.md }}>
            <RelayStrip nights={upcoming} labelOf={labelOf} />
          </ScrollView>
        </Card>
      ) : null}
      {shiftsQ.isLoading && !shiftsQ.data ? <Skeleton rows={2} /> : null}
      {shiftsQ.isError && !shiftsQ.data ? <ErrorView error={shiftsQ.error} onRetry={() => void shiftsQ.refetch()} title={tr('u2.nights.load_error')} /> : null}
      {shiftsQ.data && upcoming.length === 0 ? <EmptyState icon="moon" title={tr('u2.nights.none_title')} body={tr('u2.nights.none_body')} /> : null}
      {upcoming.map((s, i) => (
        <StaggerItem key={s.id} index={i}>
          <Card>
            <ListRow icon={s.status === 'confirmed' ? 'check-circle' : s.status === 'swapped' ? 'shuffle' : 'moon'} title={labelOf(s.user_id)} subtitle={`${fmtNight(s)}${s.status === 'confirmed' ? ` · ${tr('u2.nights.confirmed')}` : s.status === 'swapped' ? ` · ${tr('u2.nights.swapped')}` : ''}`} />
            <Row wrap style={{ marginTop: spacing.xs }}>
              {s.user_id === me && s.status === 'planned' ? <Button label={tr('u2.nights.i_confirm')} size="sm" icon="check" onPress={() => setStatus(s, 'confirmed', tr('u2.nights.confirmed_toast'))} /> : null}
              {s.user_id === me ? <Button label={tr('u2.nights.propose_swap')} size="sm" variant="secondary" onPress={() => setSwap(s.id)} /> : null}
              <Button label={tr('u2.nights.remove')} size="sm" variant="ghost" onPress={() => remove(s)} />
            </Row>
          </Card>
        </StaggerItem>
      ))}

      <SectionTitle title={tr('u2.nights.prepare')} />
      <Card>
        <View style={{ gap: spacing.sm }}>
          <Segmented label={tr('u2.nights.mode')} value={pattern} onChange={setPattern} options={[{ value: 'alternate', label: tr('u2.nights.m_alternate') }, { value: 'fixed', label: tr('u2.nights.m_fixed') }, { value: 'custom', label: tr('u2.nights.m_custom') }]} />
          <Text variant="label">{pattern === 'fixed' ? tr('u2.nights.who') : tr('u2.nights.who_order')}</Text>
          <Row wrap>{people.map((p) => <Chip key={p.id} label={`${p.label}${order.includes(p.id) ? ` (${order.indexOf(p.id) + 1})` : ''}`} selected={order.includes(p.id)} onPress={() => (pattern === 'fixed' ? setOrder([p.id]) : toggleOrder(p.id))} />)}</Row>
          {people.length === 1 ? <Text variant="caption" muted>{tr('u2.nights.alone')}</Text> : null}
          <Row>
            <View style={{ flex: 2 }}><Field label={tr('u2.nights.from_date')} value={start} onChangeText={setStart} placeholder={tr('u2.nights.date_ph')} keyboardType="numbers-and-punctuation" error={startIso ? undefined : tr('u2.nights.date_error')} /></View>
            <View style={{ flex: 1 }}><Field label={tr('u2.nights.nights')} value={nights} onChangeText={setNights} keyboardType="number-pad" maxLength={2} /></View>
          </Row>
          <Row>
            <View style={{ flex: 1 }}><Field label={tr('u2.nights.from_hour')} value={startHour} onChangeText={setStartHour} keyboardType="number-pad" maxLength={2} /></View>
            <View style={{ flex: 1 }}><Field label={tr('u2.nights.to_hour')} value={endHour} onChangeText={setEndHour} keyboardType="number-pad" maxLength={2} /></View>
          </Row>
        </View>
      </Card>

      {plan.length ? (
        <>
          <SectionTitle title={tr('u2.nights.preview')} />
          <Card>
            {plan.map((p, i) => (
              <View key={p.starts_at} style={{ paddingVertical: 6, gap: 4 }}>
                <Text variant="small" weight="medium">{fmtNight(p)}</Text>
                {pattern === 'custom' ? (
                  <Row wrap>{chosen.map((id) => <Chip key={id} label={labelOf(id)} selected={p.user_id === id} onPress={() => setCustom({ ...custom, [i]: id })} />)}</Row>
                ) : <Text variant="caption" muted>{labelOf(p.user_id)}</Text>}
              </View>
            ))}
          </Card>
          {conflicts.length ? <Banner tone="warning">{tr('u2.nights.conflict_banner', { count: conflicts.length })}</Banner> : null}
          <Button label={tr('u2.nights.save_plan_short')} icon="calendar" full onPress={submit} loading={save.isPending} />
        </>
      ) : null}

      <RequestSheet kind={swap ? 'swap_slot' : null} shiftId={swap} onClose={() => setSwap(null)} />
    </Screen>
  );
}
