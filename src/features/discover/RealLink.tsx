/**
 * Lien vers la VRAIE destination d'un outil. Avec un compte : adresse réelle dans le foyer (profil d'enfant, grossesse…)
 * lue — jamais écrite — depuis les outils du foyer (`useAllToolEntries`) ; sinon adresse générique ou espace hub
 * (`toolLink`). Ce fichier est le SEUL de « Découvrir HOMI » à lire des données du foyer (lecture seule).
 */
import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Button, Text } from '@/components/ui';
import { useAllToolEntries } from '@/features/hubs/ToolSearch';
import { t as tr, type TKey } from '@/i18n';
import { spacing } from '@/theme/tokens';
import { hubRouteOf, toolLink } from './model';
import { toolName } from './texts';

const HUB_LABEL: Record<string, TKey> = { '/health': 'nav.tab.health', '/baby': 'nav.tab.baby', '/household': 'nav.tab.family' };

function LinkButton({ toolKey, realHref, session }: { toolKey: string; realHref?: string | null; session: boolean }) {
  const link = toolLink(toolKey, realHref);
  const hub = hubRouteOf(toolKey);
  const label = link.fallback ? tr('kn.demo.openHub', { hub: tr(HUB_LABEL[hub] ?? 'nav.tab.family') }) : tr('kn.demo.open', { tool: toolName(toolKey) });
  return (
    <View style={{ gap: spacing.xs }}>
      <Button label={label} iconRight="arrow-right" onPress={() => router.push(link.href as never)} full testID="discover-tool-link" />
      {link.fallback ? <Text variant="small" muted>{tr('kn.demo.fallback')}</Text> : null}
      {!session ? <Text variant="small" muted>{tr('kn.demo.noSession')}</Text> : null}
    </View>
  );
}

function HouseholdLink({ toolKey }: { toolKey: string }) {
  const { entries } = useAllToolEntries();
  const real = entries.find((e) => e.tool.key === toolKey)?.tool.href ?? null;
  return <LinkButton toolKey={toolKey} realHref={real} session />;
}

export function RealLink({ toolKey, session }: { toolKey: string; session: boolean }) {
  return session ? <HouseholdLink toolKey={toolKey} /> : <LinkButton toolKey={toolKey} session={false} />;
}
