/**
 * Journée difficile : l'application se simplifie. L'essentiel, les événements importants, les infos
 * indispensables de l'enfant, ce qui peut attendre (reporté seulement après validation), les personnes
 * disponibles et une demande d'aide en un seul geste.
 */
import React, { useState } from 'react';
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

const hm = (iso: string) => new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

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

  async function askHelp() {
    try {
      await ask.mutateAsync({ kind: 'help_today', message: 'Journée difficile : j’ai besoin d’aide aujourd’hui.' });
      setAsked(true);
      toast('Demande d’aide envoyée à votre foyer.');
    } catch (e) { toast(friendlyError(e), 'error'); }
  }

  async function applyPlan() {
    if (!plan.length) return;
    const lines = plan.map((p) => `• ${p.title} → ${new Date(p.to).toLocaleString('fr-FR', { weekday: 'long', hour: '2-digit', minute: '2-digit' })}`).join('\n');
    if (!(await confirm('Appliquer le planning allégé ?', `Ces tâches seront reportées :\n${lines}`, 'Reporter', false))) return;
    try { await batch.mutateAsync({ postpone: plan.map((p) => ({ id: p.id, to: p.to })) }); toast('C’est reporté. Une chose à la fois.'); } catch (e) { toast(friendlyError(e), 'error'); }
  }

  return (
    <Screen back title="Journée difficile" subtitle="Juste l’essentiel. Le reste peut attendre."
      action={{ label: asked ? 'Demande envoyée' : 'J’ai besoin d’aide aujourd’hui', icon: asked ? 'check' : 'life-buoy', onPress: askHelp, disabled: asked || ask.isPending, testID: 'difficult-help' }}>
      <TodaySummary items={[
        { icon: 'star', value: String(essential.length), label: 'Essentiel' },
        { icon: 'calendar', value: String(todayAppointments.length), label: 'Rendez-vous' },
        { icon: 'skip-forward', value: String(plan.length), label: 'Peut attendre' },
      ]} />
      <Card tone="soft">
        <Text weight="bold">Demander de l’aide, en un geste</Text>
        <Text variant="small" muted>Votre foyer reçoit « Besoin d’aide aujourd’hui » (bouton en bas).</Text>
        <Row wrap style={{ marginTop: spacing.sm }}>
          <Button label="Demander un relais" variant="secondary" onPress={() => ask.mutateAsync({ kind: 'relay' }).then(() => toast('Demande de relais envoyée.')).catch((e) => toast(friendlyError(e), 'error'))} />
        </Row>
      </Card>

      <SectionTitle title="L’essentiel aujourd’hui" />
      {essential.length === 0 ? <Text variant="small" muted>Aucune tâche marquée essentielle ou importante. Vous pouvez en marquer une comme « essentielle » dans la tâche.</Text> : null}
      {essential.map((task) => <TaskRow key={task.id} task={task} onEdit={setEditing} />)}

      {todayAppointments.length ? (
        <>
          <SectionTitle title="À ne pas oublier" />
          <Card>{todayAppointments.map((a) => <ListRow key={a.id} icon="calendar" title={a.title} subtitle={`${hm(a.starts_at)}${a.location_label ? ` · ${a.location_label}` : ''}`} />)}</Card>
        </>
      ) : null}

      <SectionTitle title="Ce qui peut attendre" />
      {plan.length === 0 ? <Text variant="small" muted>Rien à reporter aujourd’hui.</Text> : (
        <Card>
          {plan.map((p) => <ListRow key={p.id} icon="skip-forward" title={p.title} subtitle={`Proposé : ${new Date(p.to).toLocaleString('fr-FR', { weekday: 'long', hour: '2-digit', minute: '2-digit' })}`} />)}
          <Button label="Valider ce planning allégé" icon="check" size="sm" style={{ alignSelf: 'flex-start', marginTop: spacing.xs }} onPress={applyPlan} loading={batch.isPending} />
          <Text variant="caption" muted style={{ marginTop: 6 }}>Rien n’est reporté sans votre validation.</Text>
        </Card>
      )}

      <SectionTitle title="Infos indispensables des enfants" />
      <ChildEssentials />

      <SectionTitle title="Qui peut aider" />
      <Card>
        {available.map((r) => <ListRow key={r.id} icon="check-circle" title={`${labelOf(r.from_user)} est disponible`} subtitle={r.message ?? undefined} />)}
        {(contacts ?? []).filter((c) => c.kind === 'trusted').slice(0, 4).map((c) => <ListRow key={c.id} icon="user" title={c.name} subtitle={[c.relation, c.phone].filter(Boolean).join(' · ') || undefined} onPress={c.phone ? () => router.push('/postpartum/support') : undefined} />)}
        {!available.length && !(contacts ?? []).some((c) => c.kind === 'trusted') ? <Text variant="small" muted>Ajoutez des personnes de confiance dans votre plan de soutien pour les retrouver ici.</Text> : null}
        <ListRow icon="users" title="Mes personnes de confiance" subtitle="Plan de soutien" onPress={() => router.push('/postpartum/support')} />
      </Card>

      <Banner tone="info">
        <Row style={{ alignItems: 'flex-start' }}>
          <Icon name="info" size={16} color={t.colors.lavender} />
          <Text variant="small" style={{ flex: 1 }}>Si vous vous sentez en danger, ou votre enfant : 15, 112, ou 3114 pour la prévention du suicide.</Text>
        </Row>
        <Button label="Numéros d’urgence" size="sm" variant="ghost" icon="life-buoy" onPress={() => router.push('/emergency')} style={{ alignSelf: 'flex-start' }} />
      </Banner>
      <View style={{ height: spacing.md }} />
      <TaskSheet task={editing} open={!!editing} onClose={() => setEditing(null)} />
    </Screen>
  );
}
