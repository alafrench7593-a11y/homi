/** Dents de lait : noter la date d'apparition de chaque dent, sans comparaison ni « retard ». */
import { insertOrQueue } from '@/lib/offline';
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/Screen';
import { TodaySummary } from '@/components/MiniApp';
import { confirm, Sheet, useToast } from '@/components/Overlays';
import { EmptyState, ErrorView, Skeleton } from '@/components/States';
import { Banner, Button, Card, Chip, Field, haptic, Icon, Row, Text } from '@/components/ui';
import { ToothChart } from '@/features/childCare';
import { useSaveReminder } from '@/lib/data/hooks-settings';
import { toFrDate } from '@/lib/validation';
import { backend, eq } from '@/lib/backend';
import { useActiveSubject, useTrackedChildren, useInvalidate } from '@/lib/data/hooks';
import { useMilestones } from '@/lib/data/hooks-family';
import { friendlyError } from '@/lib/data/hooks-settings';
import { addDays, frToISO, todayISO } from '@/lib/domain/dates';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { Tappable } from '@/components/Tappable';
import { formatDate, t as tr } from '@/i18n';


export default function Teeth() {
  const t = useTheme();
  const toast = useToast();
  const inv = useInvalidate();
  const params = useLocalSearchParams<{ child?: string }>();
  const { subject } = useActiveSubject();
  const childrenQ = useTrackedChildren();
  const { data: children } = childrenQ;
  const [busy, setBusy] = useState<string | null>(null);
  const childId = (typeof params.child === 'string' && params.child) || (subject.type === 'child' ? subject.id : children?.[0]?.id);
  const child = children?.find((c) => c.id === childId);
  const milestonesQ = useMilestones(childId);
  const { data: milestones } = milestonesQ;
  const teeth = useMemo(() => (milestones ?? []).filter((m) => m.kind === 'tooth'), [milestones]);

  const [picked, setPicked] = useState<string | null>(null);
  const [date, setDate] = useState(toFrDate(todayISO()));
  const [note, setNote] = useState('');
  const pickedRow = picked ? teeth.find((m) => m.title === picked) : undefined;
  const saveReminder = useSaveReminder();

  const open = (label: string) => {
    if (!child || busy) return;
    haptic('selection');
    const existing = teeth.find((m) => m.title === label);
    setDate(toFrDate(existing?.happened_on ?? todayISO()));
    setNote(existing?.note ?? '');
    setPicked(label);
  };

  async function save() {
    if (!child || !picked) return;
    const iso = frToISO(date);
    if (!iso || iso > todayISO()) return toast(tr('u5.teeth.date_bad'), 'error');
    setBusy(picked);
    try {
      if (pickedRow) await backend.update('child_milestones', { happened_on: iso, note: note.trim() || null }, [eq('id', pickedRow.id)]);
      else await insertOrQueue('child_milestones', { child_id: child.id, household_id: child.household_id, kind: 'tooth', title: picked, happened_on: iso, note: note.trim() || null, domain: null });
      inv('child_milestones');
      haptic('success');
      toast(pickedRow ? tr('u5.teeth.updated') : tr('u5.teeth.noted'), 'success');
      setPicked(null);
    } catch (e) {
      toast(friendlyError(e, tr('u5.pp_checkin.save_failed')), 'error');
    } finally { setBusy(null); }
  }

  async function removeTooth() {
    if (!pickedRow || !(await confirm(tr('u5.teeth.rm_t'), `${pickedRow.title} (${pickedRow.happened_on ?? tr('u5.teeth.no_date')})`, tr('u5.teeth.rm_ok')))) return;
    try { await backend.remove('child_milestones', [eq('id', pickedRow.id)]); inv('child_milestones'); toast(tr('u5.teeth.removed')); setPicked(null); } catch (e) { toast(friendlyError(e), 'error'); }
  }

  async function hygieneReminder() {
    try {
      await saveReminder.mutateAsync({ draft: { title: tr('u5.teeth.rem_t'), body: tr('u5.teeth.rem_b'), category: 'custom', schedule: { type: 'daily', hour: 19, minute: 45 }, enabled: true, deep_link: '/teeth', child_id: child?.id ?? null } });
      toast(tr('u5.teeth.rem_ok'));
    } catch (e) { toast(friendlyError(e), 'error'); }
  }

  return (
    <Screen back title={tr('u5.teeth.title')} subtitle={child ? child.first_name : tr('u5.teeth.add_first')}>
      <Banner tone="info">{tr('u5.teeth.banner')}</Banner>
      {childrenQ.isLoading && !children ? <Skeleton rows={4} /> : childrenQ.isError && !children ? (
        <ErrorView error={childrenQ.error} onRetry={() => void childrenQ.refetch()} />
      ) : !child ? (
        <EmptyState icon="smile" title={tr('u5.teeth.no_child')} body={tr('u5.teeth.no_child_b')} action={{ label: tr('u5.teeth.add_child'), onPress: () => router.push('/profiles/new?kind=child' as never) }} />
      ) : milestonesQ.isLoading && !milestones ? <Skeleton kind="detail" rows={6} /> : milestonesQ.isError && !milestones ? (
        <ErrorView error={milestonesQ.error} onRetry={() => void milestonesQ.refetch()} title={tr('u5.teeth.err')} />
      ) : (
        <>
          {(() => {
            const dated = teeth.filter((m) => m.happened_on).sort((x, y) => (y.happened_on ?? '').localeCompare(x.happened_on ?? ''));
            return (
              <TodaySummary title={tr('u5.teeth.brief')} testID="teeth-summary" items={[
                { icon: 'smile', value: `${teeth.length}/20`, label: tr('u5.teeth.count') },
                { icon: 'calendar', value: dated[0]?.happened_on ? formatDate(dated[0].happened_on, { day: 'numeric', month: 'short' }) : '—', label: tr('u5.teeth.last') },
              ]} />
            );
          })()}
          <Card>
            <ToothChart present={new Set(teeth.map((m) => m.title))} onPick={open} />
            <Text variant="caption" muted center>{tr('u5.teeth.tap')}</Text>
          </Card>
          {teeth.length ? (
            <Card>
              {[...teeth].sort((x, y) => (x.happened_on ?? '').localeCompare(y.happened_on ?? '')).map((m) => (
                <Tappable key={m.id} accessibilityRole="button" onPress={() => open(m.title)} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 48 }}>
                  <Icon name="check-circle" size={18} color={t.colors.primary} />
                  <View style={{ flex: 1 }}>
                    <Text>{m.title}</Text>
                    {m.note ? <Text variant="caption" muted>{m.note}</Text> : null}
                  </View>
                  {m.happened_on ? <Text variant="caption" muted>{formatDate(m.happened_on, { day: '2-digit', month: '2-digit', year: 'numeric' })}</Text> : null}
                </Tappable>
              ))}
            </Card>
          ) : null}
          <Card tone="soft">
            <Text weight="bold">{tr('u5.teeth.care')}</Text>
            <Row wrap style={{ marginTop: spacing.xs }}>
              <Button label={tr('u5.teeth.b_rem')} icon="bell" size="sm" variant="secondary" onPress={hygieneReminder} loading={saveReminder.isPending} />
              <Button label={tr('u5.teeth.b_dentist')} icon="calendar" size="sm" variant="secondary" onPress={() => router.push('/appointments')} />
            </Row>
          </Card>
          <Text variant="caption" muted>{tr('u5.teeth.warn')}</Text>
        </>
      )}

      <Sheet visible={!!picked} onClose={() => setPicked(null)} title={picked ?? ''}>
        {/* date en un geste (modifiable dans le champ juste en dessous) */}
        <Row wrap testID="teeth-date-quick">
          {[{ label: tr('u5.teeth.q_today'), d: 0 }, { label: tr('u5.teeth.q_yest'), d: 1 }, { label: tr('u5.teeth.q_3'), d: 3 }, { label: tr('u5.teeth.q_7'), d: 7 }].map((o) => {
            const iso = addDays(todayISO(), -o.d);
            return <Chip key={o.d} label={o.label} selected={frToISO(date) === iso} onPress={() => { haptic('selection'); setDate(toFrDate(iso)); }} />;
          })}
        </Row>
        <Field label={tr('u5.teeth.date_lbl')} value={date} onChangeText={setDate} placeholder={tr('u5.fert.date_ph')} keyboardType="numbers-and-punctuation" />
        <Field label={tr('u5.teeth.obs')} optional multiline value={note} onChangeText={setNote} maxLength={4000} placeholder={tr('u5.teeth.obs_ph')} />
        <Button label={pickedRow ? tr('u5.pp_checkin.save') : tr('u5.teeth.note_tooth')} onPress={save} loading={!!busy} />
        {pickedRow ? <Button label={tr('u5.teeth.rm_t')} variant="ghost" onPress={removeTooth} /> : null}
      </Sheet>
    </Screen>
  );
}
