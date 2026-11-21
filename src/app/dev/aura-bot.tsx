/**
 * Galerie du robot d'Aura (QA visuelle) : les six états animés en grand et en petit, toutes les tailles (32 → 160),
 * les trois apparences (clair, sombre, nuit), les poses statiques de « Réduire les animations » et un scénario qui
 * enchaîne coucou → écoute → réflexion → réponse. Accessible comme /dev/icons : mode développeur ou démonstration ;
 * ailleurs, retour à l'accueil.
 */
import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Redirect, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { GlassIconButton } from '@/components/glass';
import { Button, Text } from '@/components/ui';
import { useDemoInset } from '@/components/demoInset';
import { AuraBot } from '@/features/aura/AuraBot';
import { AURA_BOT_STATES, type AuraBotState } from '@/features/aura/useAuraBot';
import { B } from '@/features/dev/auraBotGalleryData';
import { isDemo } from '@/lib/backend';
import { useDeveloperMode } from '@/lib/devMode';
import { auraBotMotion } from '@/motion';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing, themeFor } from '@/theme/tokens';

const SIZES = [32, 48, 64, 96, 128, 160];
const SCENE: [AuraBotState, number][] = [['greet', auraBotMotion.greetMs], ['listening', 2200], ['thinking', 2600], ['answer', auraBotMotion.answerMs], ['idle', 0]];

export default function AuraBotGallery() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const top = insets.top + useDemoInset();
  const dev = useDeveloperMode();
  const [grace, setGrace] = useState(true);
  const [scene, setScene] = useState<AuraBotState>('idle');
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => { const id = setTimeout(() => setGrace(false), 800); return () => clearTimeout(id); }, []);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const play = () => {
    timers.current.forEach(clearTimeout);
    let at = 0;
    timers.current = SCENE.map(([st, ms]) => { const id = setTimeout(() => setScene(st), at); at += ms; return id; });
  };
  if (!dev && !isDemo) return grace ? <View style={{ flex: 1, backgroundColor: t.colors.background }} /> : <Redirect href="/" />;
  const card = { backgroundColor: t.colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: t.colors.border, padding: spacing.sm } as const;
  return (
    <View style={{ flex: 1, backgroundColor: t.colors.background }} testID="aura-bot-gallery">
      <StatusBar style={t.isDark ? 'light' : 'dark'} />
      <ScrollView contentContainerStyle={{ paddingTop: top + spacing.sm, paddingHorizontal: spacing.md, paddingBottom: insets.bottom + spacing.xl, gap: spacing.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
          <GlassIconButton icon="arrow-left" label={B.back} onPress={() => (router.canGoBack() ? router.back() : router.replace('/settings'))} testID="aura-bot-back" />
          <Text variant="title" accessibilityRole="header" style={{ flex: 1 }}>{B.title}</Text>
        </View>
        <Text variant="small" muted>{B.lead}</Text>

        <Text variant="label" muted>{B.states}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }} testID="aura-bot-states">
          {AURA_BOT_STATES.map((st) => (
            <View key={st} style={[card, { width: 170, alignItems: 'center', gap: 4 }]} testID={`aura-bot-state-${st}`}>
              <AuraBot size={140} state={st} testID={`bot-${st}`} />
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm }}>
                <AuraBot size={64} state={st} />
                <AuraBot size={32} state={st} />
              </View>
              <Text variant="small" weight="bold">{B.names[st]}</Text>
            </View>
          ))}
        </View>

        <Text variant="label" muted>{B.sizes}</Text>
        <View style={[card, { flexDirection: 'row', alignItems: 'flex-end', flexWrap: 'wrap', gap: spacing.md }]} testID="aura-bot-sizes">
          {SIZES.map((n) => (
            <View key={n} style={{ alignItems: 'center', gap: 2 }}>
              <AuraBot size={n} still />
              <Text variant="caption" muted>{`${n}`}</Text>
            </View>
          ))}
        </View>

        <Text variant="label" muted>{B.appearances}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }} testID="aura-bot-appearances">
          {(['light', 'dark', 'night'] as const).map((mode) => {
            const th = themeFor(mode);
            return (
              <View key={mode} style={{ backgroundColor: th.colors.background, borderRadius: radius.lg, borderWidth: 1, borderColor: th.colors.border, padding: spacing.sm, alignItems: 'center', gap: 4 }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: spacing.xs }}>
                  <AuraBot size={96} appearance={mode} still />
                  <AuraBot size={32} appearance={mode} still />
                </View>
                <Text variant="caption" color={th.colors.text}>{B[mode]}</Text>
              </View>
            );
          })}
        </View>

        <Text variant="label" muted>{B.still}</Text>
        <View style={[card, { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }]} testID="aura-bot-still">
          {AURA_BOT_STATES.map((st) => (
            <View key={st} style={{ alignItems: 'center', gap: 2 }}>
              <AuraBot size={80} state={st} still />
              <Text variant="caption" muted>{B.names[st]}</Text>
            </View>
          ))}
        </View>

        <Text variant="label" muted>{B.scene}</Text>
        <View style={[card, { alignItems: 'center', gap: spacing.sm }]} testID="aura-bot-scene">
          <AuraBot size={160} state={scene} decorative={false} testID="aura-bot-scene-bot" />
          <Text variant="small" weight="bold" testID="aura-bot-scene-state">{B.names[scene]}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, justifyContent: 'center' }}>
            {AURA_BOT_STATES.map((st) => <Button key={st} label={B.names[st]} size="sm" variant={st === scene ? 'primary' : 'secondary'} onPress={() => setScene(st)} testID={`aura-bot-set-${st}`} />)}
          </View>
          <Button label={B.play} icon="play" variant="secondary" full onPress={play} testID="aura-bot-play" />
        </View>
      </ScrollView>
    </View>
  );
}
