/**
 * 58 — Rééducation périnéale prescrite : les séances prévues par le ou la professionnelle (date, heure, lieu ou
 * praticien·ne), marquées faites ou manquées, avec un rappel facultatif (rappels existants, notifications locales).
 * Données de la personne seulement. HOMI ne propose aucun exercice et ne donne aucun conseil médical.
 */
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Screen } from '@/components/Screen';
import { EmptyState, Skeleton } from '@/components/States';
import { GlassSheet } from '@/components/glass';
import { confirm, useToast } from '@/components/Overlays';
import { Banner, Button, Field, ListGroup, ListRow, Row, Text } from '@/components/ui';
import { BriefStrip } from '@/features/day5/DayParts';
import { SwitchRow } from '@/features/couple/CoupleKit';
import { WhenFields, whenOf, whenToIso, type WhenValue } from '@/components/CareInputs';
import { spacing } from '@/theme/tokens';
import { formatDate, t as tr, type TKey } from '@/i18n';
import { friendlyError } from '@/lib/data/hooks-settings';
import { useCareLogs, useDeleteCareLog, useSaveCareLog } from '@/lib/data/hooks-birthCare';
import { reminderAt, sessionCounts, splitSessions, type CareLog, type SessionStatus } from '@/features/postpartumCare/domain';

const LONG = { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' } as const;

function SessionSheet({ log, visible, onClose }: { log: CareLog | null; visible: boolean; onClose: () => void }) {
  const toast = useToast();
  const save = useSaveCareLog();
  const del = useDeleteCareLog();
  const [when, setWhen] = useState<WhenValue>(whenOf());
  const [who, setWho] = useState('');
  const [remind, setRemind] = useState(true);
  React.useEffect(() => {
    if (!visible) return;
    setWhen(log ? whenOf(log.at) : { ...whenOf(), time: '10:00' }); setWho(log?.practitioner ?? ''); setRemind(log ? !!log.reminder_id : true);
  }, [visible, log?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!visible) return null;
  async function submit() {
    const at = whenToIso(when);
    if (!at) return toast(tr('ppc.err.date'), 'error');
    const status: SessionStatus = log?.status ?? (Date.parse(at) < Date.now() - 3600_000 ? 'done' : 'planned');
    try {
      const r = await save.mutateAsync({
        row: { ...(log ?? {}), kind: 'pelvic_session', at, status, practitioner: who.trim() || null, feeling: null, pain: null, note: log?.note ?? null },
        reminder: { at: remind && status === 'planned' ? reminderAt(at) : null, title: tr('ppc.reminderTitle'), link: '/postpartum/pelvic' },
      });
      toast(r.queued ? tr('ppc.savedOffline') : tr('ppc.saved'), 'success'); onClose();
    } catch (x) { toast(friendlyError(x), 'error'); }
  }
  async function remove() {
    if (!log || !(await confirm(tr('ppc.delete'), tr('ppc.deleteQ'), tr('ppc.delete')))) return;
    try { await del.mutateAsync(log); onClose(); } catch (x) { toast(friendlyError(x), 'error'); }
  }
  return (
    <GlassSheet visible onClose={onClose} title={log ? tr('ppc.edit') : tr('ppc.add')}>
      <WhenFields value={when} onChange={setWhen} testID="ppc-when" />
      <Field label={tr('ppc.practitioner')} optional value={who} onChangeText={setWho} maxLength={80} placeholder={tr('ppc.practitionerPh')} testID="ppc-who" />
      <SwitchRow label={tr('ppc.remind')} value={remind} onChange={setRemind} testID="ppc-remind" />
      <Button label={tr('common.save')} icon="check" loading={save.isPending} onPress={() => void submit()} testID="ppc-save" />
      {log ? <Button label={tr('ppc.delete')} variant="ghost" icon="trash-2" onPress={() => void remove()} testID="ppc-delete" /> : null}
    </GlassSheet>
  );
}

export default function PelvicSessions() {
  const toast = useToast();
  const q = useCareLogs('pelvic_session');
  const save = useSaveCareLog();
  const [sheet, setSheet] = useState<{ log: CareLog | null } | null>(null);
  const list = useMemo(() => q.data ?? [], [q.data]);
  const split = useMemo(() => splitSessions(list), [list]);
  const counts = sessionCounts(list);

  async function mark(log: CareLog, status: SessionStatus) {
    try {
      const r = await save.mutateAsync({ row: { ...log, status }, reminder: log.reminder_id ? { at: null, title: '', link: '' } : undefined });
      toast(r.queued ? tr('ppc.savedOffline') : tr(`ppc.marked.${status}` as TKey), 'success');
    } catch (x) { toast(friendlyError(x), 'error'); }
  }
  const row = (l: CareLog, actions: boolean) => (
    <ListRow key={l.id} icon={l.status === 'done' ? 'check-circle' : l.status === 'missed' ? 'minus-circle' : 'calendar'}
      title={formatDate(l.at, LONG)} subtitle={[l.practitioner, tr(`ppc.status.${l.status ?? 'planned'}` as TKey), l.reminder_id && l.status === 'planned' ? tr('ppc.withReminder') : null, l._pending ? tr('ppc.pending') : null].filter(Boolean).join(' · ')}
      onPress={() => setSheet({ log: l })} testID={`ppc-row-${l.status}`}
      right={actions ? <Row gap={spacing.xs}>
        <Button label={tr('ppc.act.done')} size="sm" onPress={() => void mark(l, 'done')} testID="ppc-mark-done" />
        <Button label={tr('ppc.act.missed')} size="sm" variant="ghost" onPress={() => void mark(l, 'missed')} testID="ppc-mark-missed" />
      </Row> : undefined} />
  );

  if (q.isLoading && !q.data) return <Screen back title={tr('ppc.title')} tool={false}><Skeleton rows={4} /></Screen>;
  return (
    <Screen back title={tr('ppc.title')} subtitle={tr('ppc.subtitle')} tool={false}
      action={{ label: tr('ppc.add'), icon: 'plus', onPress: () => setSheet({ log: null }), testID: 'ppc-add' }}>
      <Text muted>{tr('ppc.intro')}</Text>
      <BriefStrip testID="ppc-counts" items={[{ value: String(counts.done), label: tr('ppc.count.done') }, { value: String(counts.planned), label: tr('ppc.count.planned') }]} />
      {split.toConfirm.length ? <ListGroup title={tr('ppc.toConfirm')} testID="ppc-confirm">{split.toConfirm.map((l) => row(l, true))}</ListGroup> : null}
      {split.upcoming.length ? <ListGroup title={tr('ppc.upcoming')} testID="ppc-upcoming">{split.upcoming.map((l) => row(l, false))}</ListGroup> : null}
      {!list.length ? <EmptyState icon="calendar" title={tr('ppc.emptyTitle')} body={tr('ppc.emptyBody')} action={{ label: tr('ppc.add'), onPress: () => setSheet({ log: null }) }} /> : null}
      {split.past.length ? <ListGroup title={tr('ppc.past')} testID="ppc-past">{split.past.map((l) => row(l, false))}</ListGroup> : null}
      <View style={{ gap: spacing.xs }}>
        <Banner tone="info" icon="heart">{tr('ppc.consult')}</Banner>
        <Text variant="caption" muted>{tr('ppc.private')}</Text>
      </View>
      <SessionSheet log={sheet?.log ?? null} visible={!!sheet} onClose={() => setSheet(null)} />
    </Screen>
  );
}
