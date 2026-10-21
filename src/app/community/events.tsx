/**
 * Ateliers et rencontres en visio, programmés par l'équipe (inscription Premium pour ceux qui sont réservés).
 * Le lien de connexion n'est transmis qu'aux personnes inscrites. Aucun atelier n'est inventé : la liste vient de la base.
 */
import React from 'react';
import { View } from 'react-native';
import * as Linking from 'expo-linking';
import { Screen } from '@/components/Screen';
import { EmptyState, Skeleton } from '@/components/States';
import { useToast } from '@/components/Overlays';
import { Button, Card, Icon, Row, Text } from '@/components/ui';
import { PremiumBadge } from '@/features/communitySocial';
import { backend } from '@/lib/backend';
import { usePremiumAccess } from '@/lib/data/hooks-premium';
import { useEventAction, useEventRegistrations, useEvents } from '@/lib/data/hooks-social';
import { friendlyError } from '@/lib/data/hooks-settings';
import { isPremiumRequired } from '@/lib/premium/features';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';

export default function Events() {
  const t = useTheme();
  const toast = useToast();
  const events = useEvents();
  const regs = useEventRegistrations();
  const act = useEventAction();
  const access = usePremiumAccess('community_events');
  const upcoming = (events.data ?? []).filter((e) => Date.parse(e.ends_at ?? e.starts_at) > Date.now());
  const registered = new Set((regs.data ?? []).map((r) => r.event_id));

  async function toggle(id: string, on: boolean, premiumOnly: boolean) {
    if (on && premiumOnly && !access.require()) return;
    try { await act.mutateAsync({ eventId: id, register: on }); toast(on ? 'Inscription enregistrée.' : 'Inscription annulée.'); }
    catch (e) { if (isPremiumRequired(e)) access.showPreview(); else toast(friendlyError(e), 'error'); }
  }
  async function join(id: string) {
    const url = await backend.rpc<string | null>('event_join_link', { p_event: id }).catch(() => null);
    if (url) void Linking.openURL(url); else toast('Le lien sera disponible avant le début de l’atelier.');
  }

  return (
    <Screen back title="Ateliers et rencontres" subtitle="En visio, animés par des professionnels ou l’équipe">
      {events.isLoading && !events.data ? <Skeleton kind="card" rows={2} /> : upcoming.length ? (
        <View style={{ gap: spacing.sm }}>
          {upcoming.map((e) => (
            <Card key={e.id} testID={`event-${e.id}`}>
              <Row><Icon name={e.kind === 'atelier' ? 'video' : 'users'} size={18} color={t.colors.primary} /><Text weight="bold" style={{ flex: 1 }}>{e.title}</Text>{e.premium_only ? <PremiumBadge /> : null}</Row>
              <Text variant="small" muted style={{ marginTop: 4 }}>{new Date(e.starts_at).toLocaleString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</Text>
              {e.description ? <Text variant="small" style={{ marginTop: 4 }}>{e.description}</Text> : null}
              <Row gap={6} style={{ marginTop: spacing.xs }}>
                {registered.has(e.id) ? (
                  <>
                    <Button label="Rejoindre" size="sm" icon="video" onPress={() => void join(e.id)} />
                    <Button label="Annuler l’inscription" size="sm" variant="ghost" onPress={() => void toggle(e.id, false, e.premium_only)} />
                  </>
                ) : <Button label="S’inscrire" size="sm" icon="check" onPress={() => void toggle(e.id, true, e.premium_only)} testID={`event-register-${e.id}`} />}
              </Row>
            </Card>
          ))}
        </View>
      ) : (
        <EmptyState icon="calendar" title="Aucun atelier programmé pour l’instant" body="Les prochains ateliers et rencontres apparaîtront ici dès qu’ils seront annoncés." />
      )}
    </Screen>
  );
}
