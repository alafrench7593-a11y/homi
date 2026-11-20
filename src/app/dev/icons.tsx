/**
 * Galerie des pictogrammes HOMI (QA visuelle) : toute la famille `HomiIcon` (barre du bas, en-tête, bouton central,
 * 9 catégories, outils de l'introduction), inactif et actif, en CLAIR et en SOMBRE sur les CINQ palettes, plus la main
 * de la visite guidée. Accessible comme /dev/glass : mode développeur ou démonstration ; ailleurs, retour à l'accueil.
 */
import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Redirect, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { HomiIcon, ICON_CATEGORIES, ICON_GROUPS, categoryTone, type HomiIconName, type IconCategory } from '@/brand/icons';
import { GlassIconButton } from '@/components/glass';
import { Text } from '@/components/ui';
import { useDemoInset } from '@/components/demoInset';
import { HandGlyph } from '@/features/tour/TourHand';
import { I } from '@/features/dev/iconGalleryData';
import { isDemo } from '@/lib/backend';
import { useDeveloperMode } from '@/lib/devMode';
import { useTheme } from '@/theme/ThemeProvider';
import { PALETTE_NAMES, radius, spacing, themeFor, type PaletteName, type Theme } from '@/theme/tokens';

const isCategory = (n: HomiIconName): n is IconCategory => (ICON_CATEGORIES as string[]).includes(n);
const ALL: HomiIconName[] = [...new Set(ICON_GROUPS.flatMap((g) => g.names))];

/** Une case : inactif puis actif, nom dessous (couleurs prises dans le thème donné). */
function Cell({ name, th, size = 26 }: { name: HomiIconName; th: Theme; size?: number }) {
  const tone = isCategory(name) ? categoryTone(th, name) : th.colors.primary;
  return (
    <View style={{ width: 76, alignItems: 'center', gap: 4 }} testID={`icon-cell-${name}`}>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        <HomiIcon name={name} size={size} color={th.colors.textMuted} tone={tone} />
        <HomiIcon name={name} size={size} color={th.colors.text} tone={tone} active />
      </View>
      <Text variant="caption" numberOfLines={1} color={th.colors.textMuted} style={{ fontSize: 10 }}>{I.names[name]}</Text>
    </View>
  );
}

function PalettePanel({ mode, palette }: { mode: 'light' | 'dark'; palette: PaletteName }) {
  const th = themeFor(mode, palette);
  return (
    <View testID={`icons-${mode}-${palette}`} style={{ backgroundColor: th.colors.background, borderRadius: radius.lg, borderWidth: 1, borderColor: th.colors.border, padding: spacing.sm, gap: spacing.xs }}>
      <Text variant="small" weight="bold" color={th.colors.text}>{`${I.palettes[palette]} · ${mode === 'light' ? I.light : I.dark}`}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: spacing.sm }}>
        {ALL.map((n) => <Cell key={n} name={n} th={th} />)}
      </View>
      {/* le bouton central : « + » sur l'aplat de l'action */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <View style={{ width: 52, height: 52, borderRadius: radius.control, backgroundColor: th.tokens.action.fill, alignItems: 'center', justifyContent: 'center' }}>
          <HomiIcon name="add" size={26} color={th.tokens.action.text} tone={null} />
        </View>
        <View style={{ height: 52, paddingHorizontal: spacing.sm, borderRadius: radius.pill, backgroundColor: th.colors.surface, flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          {(['today', 'me', 'child', 'family'] as const).map((n, i) => <HomiIcon key={n} name={n} size={24} color={i === 0 ? th.colors.text : th.colors.textMuted} tone={th.colors.primary} active={i === 0} />)}
        </View>
      </View>
    </View>
  );
}

export default function IconGallery() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const top = insets.top + useDemoInset();
  const dev = useDeveloperMode();
  const [grace, setGrace] = useState(true);
  useEffect(() => { const id = setTimeout(() => setGrace(false), 800); return () => clearTimeout(id); }, []);
  if (!dev && !isDemo) return grace ? <View style={{ flex: 1, backgroundColor: t.colors.background }} /> : <Redirect href="/" />;
  return (
    <View style={{ flex: 1, backgroundColor: t.colors.background }} testID="icon-gallery">
      <StatusBar style={t.isDark ? 'light' : 'dark'} />
      <ScrollView contentContainerStyle={{ paddingTop: top + spacing.sm, paddingHorizontal: spacing.md, paddingBottom: insets.bottom + spacing.xl, gap: spacing.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
          <GlassIconButton icon="arrow-left" label={I.back} onPress={() => (router.canGoBack() ? router.back() : router.replace('/settings'))} testID="icons-back" />
          <Text variant="title" accessibilityRole="header" style={{ flex: 1 }}>{I.title}</Text>
        </View>
        <Text variant="small" muted>{I.lead}</Text>
        {/* thème courant, grand format : la tenue du trait */}
        {ICON_GROUPS.map((g) => (
          <View key={g.key} style={{ gap: spacing.xs }} testID={`icons-group-${g.key}`}>
            <Text variant="label" muted>{I.groups[g.key]}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
              {g.names.map((n) => (
                <View key={n} style={{ alignItems: 'center', gap: 4, width: 64 }}>
                  <HomiIcon name={n} size={40} tone={isCategory(n) ? categoryTone(t, n) : t.colors.primary} active />
                  <Text variant="caption" muted numberOfLines={1} style={{ fontSize: 10 }}>{I.names[n]}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}
        <View style={{ gap: spacing.xs }} testID="icons-hand">
          <Text variant="label" muted>{I.hand}</Text>
          <View style={{ flexDirection: 'row', gap: spacing.lg, alignItems: 'flex-end' }}>
            <HandGlyph size={40} />
            <HandGlyph size={64} />
          </View>
        </View>
        {(['light', 'dark'] as const).map((mode) => PALETTE_NAMES.map((p) => <PalettePanel key={`${mode}-${p}`} mode={mode} palette={p} />))}
      </ScrollView>
    </View>
  );
}
