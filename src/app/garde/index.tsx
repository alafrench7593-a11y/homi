/**
 * « Mes gardes » : accueil d'une nounou (enfants qui lui sont confiés, dans un ou plusieurs foyers) et entrée de
 * l'Espace Nounou pour les parents (un espace par enfant). Une garde « en attente » ne montre AUCUNE donnée de
 * l'enfant tant qu'un parent n'a pas confirmé l'accès (règle du serveur, my_childcare).
 */
import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorView, Skeleton } from '@/components/States';
import { Button, Card, Field, ListGroup, ListRow, Text } from '@/components/ui';
import { useToast } from '@/components/Overlays';
import { spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';
import { backend } from '@/lib/backend';
import { useInvalidate, useChildren, useMemberships } from '@/lib/data/hooks';
import { useMyChildcare } from '@/lib/data/hooks-nounou';
import { friendlyError } from '@/lib/data/hooks-settings';
import { extractInviteCode } from '@/lib/authFlow';

export default function MyCareScreen() {
  const mine = useMyChildcare();
  const memberships = useMemberships();
  const kids = useChildren();
  const inv = useInvalidate();
  const toast = useToast();
  const [code, setCode] = useState('');
  const [joining, setJoining] = useState(false);
  const parentHouseholds = new Set((memberships.data ?? []).filter((m) => m.role !== 'caregiver').map((m) => m.household_id));
  const myKids = (kids.data ?? []).filter((k) => parentHouseholds.has(k.household_id));
  const active = (mine.data ?? []).filter((l) => l.status === 'active' && l.child);
  const pending = (mine.data ?? []).filter((l) => l.status === 'pending');

  async function join() {
    const c = extractInviteCode(code);
    if (!c) { toast(tr('nn.join.badCode'), 'error'); return; }
    setJoining(true);
    try {
      await backend.rpc('childcare_accept', { p_token: c });
      setCode('');
      toast(tr('nn.join.done'), 'success');
      inv('my_childcare', 'memberships', 'childcare_links');
    } catch (e) { toast(friendlyError(e), 'error'); } finally { setJoining(false); }
  }

  const loading = mine.isLoading && !mine.data;
  // Un parent sans garde à sa charge voit l'espace de ses enfants, pas « les enfants qui vous sont confiés »
  const parentOnly = !active.length && !pending.length && myKids.length > 0;
  return (
    <Screen
      // Un parent sans garde à sa charge voit l'espace de ses enfants, pas « les enfants qui vous sont confiés »
      title={tr(parentOnly ? 'nn.home.parentTitle' : 'nn.home.title')}
      subtitle={tr(parentOnly ? 'nn.home.parentSub' : 'nn.home.sub')} tool={false} account>
      {loading ? <Skeleton rows={3} /> : mine.isError && !mine.data ? (
        <ErrorView error={mine.error} onRetry={() => void mine.refetch()} />
      ) : (
        <>
          {active.map((l) => (
            <Card key={l.link_id} testID={`care-child-${l.child!.id}`}>
              <Text variant="heading">{l.child!.first_name}</Text>
              <Text variant="small" muted>{tr('nn.home.family', { name: l.household_name })}</Text>
              <View style={{ gap: spacing.xs, marginTop: spacing.sm }}>
                <Button label={tr('nn.add.cta')} icon="plus" size="lg" full onPress={() => router.push(`/garde/${l.child!.id}/ajouter` as never)} testID="care-add-event" />
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
                  <Button label={tr('nn.home.journal')} icon="book-open" variant="secondary" onPress={() => router.push(`/garde/${l.child!.id}` as never)} testID="care-open-journal" />
                  {l.photos_allowed ? <Button label={tr('nn.photo.take')} icon="camera" variant="secondary" onPress={() => router.push(`/garde/${l.child!.id}/photo` as never)} testID="care-open-photo" /> : null}
                  <Button label={tr('nn.msg.title')} icon="message-circle" variant="secondary" onPress={() => router.push(`/garde/${l.child!.id}/messages` as never)} testID="care-open-messages" />
                  <Button label={tr('gp.nanny.hours')} icon="clock" variant="secondary" onPress={() => router.push(`/garde/prep/heures?child=${l.child!.id}` as never)} testID="care-open-hours" />
                </View>
              </View>
            </Card>
          ))}
          {pending.map((l) => (
            <Card key={l.link_id} tone="lavender" testID="care-pending">
              <Text weight="bold">{tr('nn.home.pendingTitle')}</Text>
              <Text variant="small" style={{ marginTop: 4 }}>{tr('nn.home.pendingBody', { name: l.household_name })}</Text>
            </Card>
          ))}
          {myKids.length ? (
            <Card>
              {parentOnly ? null : <Text variant="heading">{tr('nn.home.parentTitle')}</Text>}
              {parentOnly ? null : <Text variant="small" muted style={{ marginBottom: spacing.xs }}>{tr('nn.home.parentSub')}</Text>}
              {myKids.map((k) => (
                <Button key={k.id} label={tr('nn.space.of', { name: k.first_name })} icon="home" variant="secondary" full style={{ marginTop: spacing.xs }}
                  onPress={() => router.push(`/garde/${k.id}` as never)} testID={`care-parent-${k.id}`} />
              ))}
            </Card>
          ) : null}
          {myKids.length ? (
            // Parents seulement : outils d'avant la garde (choisir, comparer, budget, planning, heures, absences)
            <ListGroup>
              <ListRow icon="clipboard" title={tr('gp.home.link')} subtitle={tr('gp.home.linkSub')} onPress={() => router.push('/garde/prep' as never)} testID="care-open-prep" />
            </ListGroup>
          ) : null}
          {!active.length && !pending.length && !myKids.length ? (
            <EmptyState icon="users" title={tr('nn.home.emptyTitle')} body={tr('nn.home.emptyBody')} />
          ) : null}
          <Card>
            <Text weight="bold">{tr('nn.join.title')}</Text>
            <Field label={tr('nn.join.code')} value={code} onChangeText={setCode} autoCapitalize="none" autoCorrect={false} hint={tr('nn.join.hint')} testID="care-join-code"
              returnKeyType="go" onSubmitEditing={() => { if (code.trim() && !joining) void join(); }} />
            <Button label={tr('nn.join.cta')} icon="log-in" variant="secondary" loading={joining} disabled={!code.trim()} style={{ marginTop: spacing.sm, alignSelf: 'flex-start' }} onPress={join} testID="care-join" />
          </Card>
        </>
      )}
    </Screen>
  );
}
