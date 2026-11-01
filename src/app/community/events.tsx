/**
 * Ateliers et rencontres en visio, programmés par l'équipe (inscription Premium pour ceux qui sont réservés).
 * Le lien de connexion n'est transmis qu'aux personnes inscrites. Aucun atelier n'est inventé : la liste vient de la base.
 */
import React from 'react';
import { View } from 'react-native';
import * as Linking from 'expo-linking';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorView, Skeleton } from '@/components/States';
import { useToast } from '@/components/Overlays';
import { Button, Card, Icon, Row, Text } from '@/components/ui';
import { PremiumBadge } from '@/features/communitySocial';
import { backend } from '@/lib/backend';
import { usePremiumAccess } from '@/lib/data/hooks-premium';
import { useEventAction, useEventRegistrations, useEvents } from '@/lib/data/hooks-social';
import { friendlyError } from '@/lib/data/hooks-settings';
import { isPremiumRequired } from '@/lib/premium/features';
import { localeTag, t as tr } from '@/i18n';
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
    try { await act.mutateAsync({ eventId: id, register: on }); toast(on ? tr('cm3.events.registered') : tr('cm3.events.cancelled')); }
    catch (e) { if (isPremiumRequired(e)) access.showPreview(); else toast(friendlyError(e), 'error'); }
  }
  async function join(id: string) {
    const url = await backend.rpc<string | null>('event_join_link', { p_event: id }).catch(() => null);
    if (url) void Linking.openURL(url); else toast(tr('cm3.events.linkLater'));
  }

  return (
    <Screen back title={tr('cm3.events.title')} subtitle={tr('cm3.events.subtitle')}>
      {events.isLoading && !events.data ? <Skeleton kind="card" rows={2} /> : events.isError && !events.data ? (
        <ErrorView error={events.error} onRetry={() => void events.refetch()} />
      ) : upcoming.length ? (
        <View style={{ gap: spacing.sm }}>
          {upcoming.map((e) => (
            <Card key={e.id} testID={`event-${e.id}`}>
              <Row><Icon name={e.kind === 'atelier' ? 'video' : 'users'} size={18} color={t.colors.primary} /><Text weight="bold" style={{ flex: 1 }}>{e.title}</Text>{e.premium_only ? <PremiumBadge /> : null}</Row>
              <Text variant="small" muted style={{ marginTop: 4 }}>{new Date(e.starts_at).toLocaleString(localeTag(), { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</Text>
              {e.description ? <Text variant="small" style={{ marginTop: 4 }}>{e.description}</Text> : null}
              {/* Atelier déjà commencé : l'inscription n'est plus possible (le serveur la refuse) */}
              <Row gap={6} style={{ marginTop: spacing.xs }}>
                {registered.has(e.id) ? (
                  <>
                    <Button label={tr('cm3.events.join')} size="sm" icon="video" onPress={() => void join(e.id)} />
                    <Button label={tr('cm3.events.cancel')} size="sm" variant="ghost" onPress={() => void toggle(e.id, false, e.premium_only)} />
                  </>
                ) : Date.parse(e.starts_at) <= Date.now() ? null : <Button label={tr('cm3.events.register')} size="sm" icon="check" onPress={() => void toggle(e.id, true, e.premium_only)} testID={`event-register-${e.id}`} />}
              </Row>
            </Card>
          ))}
        </View>
      ) : (
        <EmptyState icon="calendar" title={tr('cm3.events.emptyTitle')} body={tr('cm3.events.emptyBody')} />
      )}
    </Screen>
  );
}
