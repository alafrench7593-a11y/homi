/**
 * Journée difficile : l'application se simplifie. L'essentiel, les événements importants, les infos
 * indispensables de l'enfant, ce qui peut attendre (reporté seulement après validation), les personnes
 * disponibles et une demande d'aide en un seul geste.
 */
import React, { useRef, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { TodaySummary } from '@/components/MiniApp';
import { confirm, useToast } from '@/components/Overlays';
import { Banner, Button, Card, Icon, ListRow, Row, SectionTitle, Text } from '@/components/ui';
import { ChildEssentials, TaskRow, TaskSheet } from '@/features/familyLoad';
import { useAppointments } from '@/lib/data/hooks';
import { useBatchTasks, useCareRequests, useCreateRequest, useFamilyTasks, usePeople } from '@/lib/data/hooks-family-load';
import { useTrustedContacts } from '@/lib/data/hooks-postpartum';
import { friendlyError } from '@/lib/data/hooks-settings';
import { lightenDay, sameLocalDay, type FamilyTask } from '@/lib/domain/familyLoad';
import { todayISO } from '@/lib/domain/dates';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { t as tr, formatDate, formatTime } from '@/i18n';

const hm = (iso: string) => formatTime(iso);

export default function DifficultDay() {
  const t = useTheme();
  const toast = useToast();
  const day = todayISO();
  const { data: tasks } = useFamilyTasks();
  const { data: appointments } = useAppointments({ upcomingOnly: true });
  const { data: requests } = useCareRequests();
  const { data: contacts } = useTrustedContacts();
  const { me, labelOf } = usePeople();
  const ask = useCreateRequest();
  const batch = useBatchTasks();
  const [editing, setEditing] = useState<FamilyTask | null>(null);
  const [asked, setAsked] = useState(false);

  const { essential, plan } = lightenDay(tasks ?? [], day);
  const todayAppointments = (appointments ?? []).filter((a) => sameLocalDay(a.starts_at, day));
  const available = (requests ?? []).filter((r) => r.kind === 'available' && r.status === 'open' && r.from_user !== me && sameLocalDay(r.created_at, day));
  // Demande d'aide déjà envoyée aujourd'hui (même après rechargement) : pas de seconde demande au foyer
  const askedToday = asked || (requests ?? []).some((r) => r.kind === 'help_today' && r.from_user === me && r.status === 'open' && sameLocalDay(r.created_at, day));

  const sending = useRef(false);
  async function askHelp() {
    if (askedToday || sending.current) return;
    sending.current = true;
    try {
      await ask.mutateAsync({ kind: 'help_today', message: tr('u2.difficult.help_message') });
      setAsked(true);
      toast(tr('u2.difficult.help_sent'));
    } catch (e) { toast(friendlyError(e), 'error'); } finally { sending.current = false; }
  }

  async function applyPlan() {
    if (!plan.length) return;
    const lines = plan.map((p) => `• ${p.title} → ${formatDate(p.to, { weekday: 'long', hour: '2-digit', minute: '2-digit' })}`).join('\n');
    if (!(await confirm(tr('u2.difficult.apply_title'), tr('u2.difficult.apply_body', { lines }), tr('u2.difficult.postpone'), false))) return;
    try { await batch.mutateAsync({ postpone: plan.map((p) => ({ id: p.id, to: p.to })) }); toast(tr('u2.difficult.postponed')); } catch (e) { toast(friendlyError(e), 'error'); }
  }

  return (
    <Screen back title={tr('u2.difficult.title')} subtitle={tr('u2.difficult.subtitle')}
      action={{ label: askedToday ? tr('u2.difficult.asked') : tr('u2.difficult.need_help'), icon: askedToday ? 'check' : 'life-buoy', onPress: askHelp, disabled: askedToday || ask.isPending, testID: 'difficult-help' }}>
      <TodaySummary items={[
        { icon: 'star', value: String(essential.length), label: tr('u2.difficult.essential') },
        { icon: 'calendar', value: String(todayAppointments.length), label: tr('u2.difficult.appointments') },
        { icon: 'skip-forward', value: String(plan.length), label: tr('u2.difficult.can_wait') },
      ]} />
      <Card tone="soft">
        <Text weight="bold">{tr('u2.difficult.ask_title')}</Text>
        <Text variant="small" muted>{tr('u2.difficult.ask_body')}</Text>
        <Row wrap style={{ marginTop: spacing.sm }}>
          <Button label={tr('u2.difficult.relay')} variant="secondary" onPress={() => ask.mutateAsync({ kind: 'relay' }).then(() => toast(tr('u2.difficult.relay_sent'))).catch((e) => toast(friendlyError(e), 'error'))} />
        </Row>
      </Card>

      <SectionTitle title={tr('u2.difficult.essential_today')} />
      {essential.length === 0 ? <Text variant="small" muted>{tr('u2.difficult.no_essential')}</Text> : null}
      {essential.map((task) => <TaskRow key={task.id} task={task} onEdit={setEditing} />)}

      {todayAppointments.length ? (
        <>
          <SectionTitle title={tr('u2.difficult.dont_forget')} />
          <Card>{todayAppointments.map((a) => <ListRow key={a.id} icon="calendar" title={a.title} subtitle={`${hm(a.starts_at)}${a.location_label ? ` · ${a.location_label}` : ''}`} />)}</Card>
        </>
      ) : null}

      <SectionTitle title={tr('u2.difficult.can_wait_title')} />
      {plan.length === 0 ? <Text variant="small" muted>{tr('u2.difficult.nothing_postpone')}</Text> : (
        <Card>
          {plan.map((p) => <ListRow key={p.id} icon="skip-forward" title={p.title} subtitle={tr('u2.difficult.proposed', { when: formatDate(p.to, { weekday: 'long', hour: '2-digit', minute: '2-digit' }) })} />)}
          <Button label={tr('u2.difficult.validate')} icon="check" size="sm" style={{ alignSelf: 'flex-start', marginTop: spacing.xs }} onPress={applyPlan} loading={batch.isPending} />
          <Text variant="caption" muted style={{ marginTop: 6 }}>{tr('u2.difficult.no_postpone_without')}</Text>
        </Card>
      )}

      <SectionTitle title={tr('u2.difficult.child_info')} />
      <ChildEssentials />

      <SectionTitle title={tr('u2.difficult.who_helps')} />
      <Card>
        {available.map((r) => <ListRow key={r.id} icon="check-circle" title={tr('u2.difficult.available', { name: labelOf(r.from_user) })} subtitle={r.message ?? undefined} />)}
        {(contacts ?? []).filter((c) => c.kind === 'trusted').slice(0, 4).map((c) => <ListRow key={c.id} icon="user" title={c.name} subtitle={[c.relation, c.phone].filter(Boolean).join(' · ') || undefined} onPress={c.phone ? () => router.push('/postpartum/support') : undefined} />)}
        {!available.length && !(contacts ?? []).some((c) => c.kind === 'trusted') ? <Text variant="small" muted>{tr('u2.difficult.add_trusted')}</Text> : null}
        <ListRow icon="users" title={tr('u2.difficult.my_trusted')} subtitle={tr('u2.difficult.support_plan')} onPress={() => router.push('/postpartum/support')} />
      </Card>

      <Banner tone="info">
        <Row style={{ alignItems: 'flex-start' }}>
          <Icon name="info" size={16} color={t.colors.lavender} />
          <Text variant="small" style={{ flex: 1 }}>{tr('u2.difficult.danger')}</Text>
        </Row>
        <Button label={tr('u2.difficult.emergency_numbers')} size="sm" variant="ghost" icon="life-buoy" onPress={() => router.push('/emergency')} style={{ alignSelf: 'flex-start' }} />
      </Banner>
      <View style={{ height: spacing.md }} />
      <TaskSheet task={editing} open={!!editing} onClose={() => setEditing(null)} />
    </Screen>
  );
}
