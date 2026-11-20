/**
 * 141 — Modes de garde : page d'aide (types de garde, où chercher). Aucune recherche d'annonces ; liens vers des pages
 * publiques déjà sourcées dans les guides HOMI (OFFICIAL, src/features/childcarePrep/ui.tsx).
 */
import React from 'react';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Banner, Card, Text } from '@/components/ui';
import { t as tr, type TKey } from '@/i18n';
import { CANDIDATE_KINDS } from '@/features/childcarePrep/domain';
import { kindLabel, SourceLinks } from '@/features/childcarePrep/ui';

export default function CareModes() {
  return (
    <Screen back title={tr('gp.tool.modes')} subtitle={tr('gp.modes.intro')} tool={false}
      action={{ label: tr('gp.modes.cta'), icon: 'plus', onPress: () => router.push('/garde/prep/candidats?new=1' as never), testID: 'gp-modes-add' }}>
      {CANDIDATE_KINDS.map((k) => (
        <Card key={k} testID={`gp-mode-${k}`}>
          <Text variant="heading" accessibilityRole="header">{kindLabel(k)}</Text>
          <Text style={{ marginTop: 4 }}>{tr(`gp.modes.${k}.d` as TKey)}</Text>
        </Card>
      ))}
      <Card tone="soft">
        <Text variant="heading" accessibilityRole="header">{tr('gp.modes.where')}</Text>
        <Text style={{ marginTop: 4 }}>{tr('gp.modes.whereBody')}</Text>
      </Card>
      <Banner tone="info" icon="clock">{tr('gp.modes.early')}</Banner>
      <SourceLinks title={tr('gp.modes.sources')} keys={['modes', 'creche', 'garder']} testID="gp-modes-sources" />
    </Screen>
  );
}
