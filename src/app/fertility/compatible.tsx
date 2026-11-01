/** Liste des tests compatibles, règles de chaque fabricant et sources. */
import { Tappable } from '@/components/Tappable';
import React from 'react';
import { Linking, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { useToast } from '@/components/Overlays';
import { Banner, Card, Row, SectionTitle, Text } from '@/components/ui';
import { rulesFor, type AnalysisMode } from '@/lib/cycleAnalysis/brands';
import { spacing } from '@/theme/tokens';
import type { TKey } from '@/i18n';
import { t as tr } from '@/i18n';

const MODE_LABEL: Record<AnalysisMode, TKey> = {
  lines_auto: 'u3.fertCompat.m1',
  digital_ocr: 'u3.fertCompat.m2',
  manual_only: 'u3.fertCompat.m3',
};

export default function CompatibleTestsScreen() {
  const toast = useToast();
  return (
    <Screen back title={tr('u3.fertCompat.title')} subtitle={tr('u3.fertCompat.subtitle')}>
      <Banner tone="warning" title={tr('u3.fertCompat.know')}>{tr('u3.fertCompat.warn')}</Banner>
      {(['ovulation', 'pregnancy'] as const).map((kind) => (
        <View key={kind} style={{ gap: spacing.sm }}>
          <SectionTitle title={kind === 'ovulation' ? tr('u3.fertCompat.ovT') : tr('u3.fertCompat.pregT')} />
          {rulesFor(kind).map((r) => (
            <Card key={r.id}>
              <Text weight="bold">{`${r.brand} — ${r.model}`}</Text>
              <Text variant="caption" muted>{tr(MODE_LABEL[r.mode])}</Text>
              {r.readingRules.map((l) => <Text key={l} variant="small" style={{ marginTop: 2 }}>• {l}</Text>)}
              <Row style={{ marginTop: spacing.xs }}>
                <Tappable accessibilityRole="link" onPress={() => void Linking.openURL(r.source.url).catch(() => toast(tr('u3.fertCompat.linkErr'), 'error'))} style={{ flexShrink: 1 }}>
                  <Text variant="caption" color="#7A5CE0" style={{ flexShrink: 1 }}>{tr('u3.fertCompat.source', { title: r.source.title, date: r.source.consultedOn.split('-').reverse().join('/') })}</Text>
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
