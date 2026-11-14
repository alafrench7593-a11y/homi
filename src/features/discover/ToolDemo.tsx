/**
 * Scène d'une démo d'outil : panneau de verre (aperçu animé) + légende « Geste / Résultat » toujours affichée
 * (lisible avec Réduire les animations et par les lecteurs d'écran). `token` : changer sa valeur rejoue la démo.
 */
import React from 'react';
import { View } from 'react-native';
import { OpticalGlass } from '@/components/surfaces';
import { Icon, Text } from '@/components/ui';
import { t as tr } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { CustomDemo } from './DemoCustom';
import { GenericDemo } from './DemoKinds';
import { DemoPlayer, useDemo } from './DemoPlayer';
import type { DiscoverTool } from './model';
import { describeDemo, toolName } from './texts';

function WaitingHint() {
  const { waiting } = useDemo();
  if (!waiting) return null;
  return <Text variant="small" muted center testID="demo-wait-hint">{tr('kn.demo.tryIt')}</Text>;
}

export function ToolDemo({ tool, token = 0, caption = true, minHeight = 248, onApplied }: {
  tool: Pick<DiscoverTool, 'key' | 'demo'>;
  token?: number;
  caption?: boolean;
  minHeight?: number;
  onApplied?: () => void;
}) {
  const t = useTheme();
  const desc = describeDemo(tool);
  const label = toolName(tool.key);
  return (
    <DemoPlayer token={token} onApplied={onApplied}>
      <View style={{ gap: spacing.sm }}>
        <OpticalGlass radius={radius.xl} padded={spacing.md} testID={`demo-stage-${tool.key}`} style={{ minHeight, justifyContent: 'center' }} contentStyle={{ alignItems: 'center', gap: spacing.sm }}>
          {tool.demo.kind === 'custom' ? <CustomDemo demo={tool.demo.demo} /> : <GenericDemo demo={tool.demo} label={label} />}
        </OpticalGlass>
        <WaitingHint />
        {caption ? (
          <View style={{ gap: 4 }} testID="demo-caption">
            <View style={{ flexDirection: 'row', gap: spacing.xs, alignItems: 'flex-start' }}>
              <Icon name="mouse-pointer" size={15} color={t.colors.textMuted} />
              <Text variant="small" style={{ flex: 1 }}><Text variant="small" weight="bold">{tr('kn.demo.gesture')} · </Text>{desc.gesture}</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: spacing.xs, alignItems: 'flex-start' }}>
              <Icon name="check" size={15} color={t.colors.textMuted} />
              <Text variant="small" style={{ flex: 1 }} testID="demo-result-text"><Text variant="small" weight="bold">{tr('kn.demo.result')} · </Text>{desc.result}</Text>
            </View>
          </View>
        ) : null}
      </View>
    </DemoPlayer>
  );
}
