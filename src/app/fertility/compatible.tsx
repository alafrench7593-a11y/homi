/** Liste des tests compatibles, règles de chaque fabricant et sources. */
import { Tappable } from '@/components/Tappable';
import React from 'react';
import { Linking, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { useToast } from '@/components/Overlays';
import { Banner, Card, Row, SectionTitle, Text } from '@/components/ui';
import { rulesFor, type AnalysisMode } from '@/lib/cycleAnalysis/brands';
import { spacing } from '@/theme/tokens';

const MODE_LABEL: Record<AnalysisMode, string> = {
  lines_auto: 'Analyse automatique des lignes sur le téléphone',
  digital_ocr: 'Lecture du texte de l’écran sur le téléphone (application mobile)',
  manual_only: 'Lecture par vous : l’application note le résultat',
};

export default function CompatibleTestsScreen() {
  const toast = useToast();
  return (
    <Screen back title="Tests compatibles" subtitle="Seuls ces tests sont interprétés selon leur notice">
      <Banner tone="warning" title="À savoir">Les règles ci-dessous sont reprises des notices des fabricants. L’analyse photo n’a pas encore été validée sur un grand nombre de vraies photos de ces tests : le résultat proposé doit toujours être vérifié avec la notice. Pour tout autre test, l’application ne propose pas de résultat.</Banner>
      {(['ovulation', 'pregnancy'] as const).map((kind) => (
        <View key={kind} style={{ gap: spacing.sm }}>
          <SectionTitle title={kind === 'ovulation' ? 'Tests d’ovulation' : 'Tests de grossesse'} />
          {rulesFor(kind).map((r) => (
            <Card key={r.id}>
              <Text weight="bold">{`${r.brand} — ${r.model}`}</Text>
              <Text variant="caption" muted>{MODE_LABEL[r.mode]}</Text>
              {r.readingRules.map((l) => <Text key={l} variant="small" style={{ marginTop: 2 }}>• {l}</Text>)}
              <Row style={{ marginTop: spacing.xs }}>
                <Tappable accessibilityRole="link" onPress={() => void Linking.openURL(r.source.url).catch(() => toast('Impossible d’ouvrir ce lien sur cet appareil.', 'error'))} style={{ flexShrink: 1 }}>
                  <Text variant="caption" color="#7A5CE0" style={{ flexShrink: 1 }}>{`Source : ${r.source.title} (consultée le ${r.source.consultedOn.split('-').reverse().join('/')})`}</Text>
                </Tappable>
              </Row>
              {r.source.note ? <Text variant="caption" muted>{r.source.note}</Text> : null}
            </Card>
          ))}
        </View>
      ))}
    </Screen>
  );
}
