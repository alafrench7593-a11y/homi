/**
 * Galerie des pictogrammes HOMI (QA visuelle) : toute la famille `HomiIcon` (barre du bas, en-tête, bouton central,
 * 9 catégories, outils de l'introduction), inactif et actif, en CLAIR et en SOMBRE sur les CINQ palettes, plus la main
 * de la visite guidée ET les pictogrammes de CHAQUE outil du catalogue (outils, sous-accès, fonctions de la liste des
 * 200), rangés par catégorie avec leur identifiant, à 20 et 28 pt. Accessible comme /dev/glass : mode développeur ou démonstration ; ailleurs, retour à l'accueil.
 */
import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Redirect, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { HomiIcon, ICON_CATEGORIES, ICON_GROUPS, categoryTone, type HomiIconName, type IconCategory } from '@/brand/icons';
import { toolIconCategory, toolIconName } from '@/brand/icons/resolve';
import { GlassButton, GlassIconButton } from '@/components/glass';
import { LOGO_MOTIONS, ToolLogo, type LogoMotion } from '@/brand/toolLogo';
import { Text } from '@/components/ui';
import { useDemoInset } from '@/components/demoInset';
import { HandGlyph } from '@/features/tour/TourHand';
import { I } from '@/features/dev/iconGalleryData';
import { isDemo } from '@/lib/backend';
import { H200_VIEWS } from '@/lib/journeys/homi200';
import { subRef, TOOL_CATEGORIES, TOOLS, type ToolCategory } from '@/lib/journeys/tools';
import { useDeveloperMode } from '@/lib/devMode';
import { useTheme } from '@/theme/ThemeProvider';
import { PALETTE_NAMES, radius, spacing, themeFor, type PaletteName, type Theme } from '@/theme/tokens';

const isCategory = (n: HomiIconName): n is IconCategory => (ICON_CATEGORIES as string[]).includes(n);
const ALL: HomiIconName[] = [...new Set(ICON_GROUPS.flatMap((g) => g.names))];

/** Chaque entrée du catalogue, rangée par catégorie d'affichage : outils, sous-accès, fonctions de la liste des 200. */
const SHELVES: ToolCategory[] = [...TOOL_CATEGORIES, 'community', 'account'];
const ENTRIES: { id: string; cat: ToolCategory; tool: boolean }[] = [
  ...TOOLS.map((d) => ({ id: d.id, cat: d.category, tool: true })),
  ...TOOLS.flatMap((d) => (d.subs ?? []).map((s) => ({ id: subRef(d.id, s.id), cat: s.category ?? d.category, tool: false }))),
  ...H200_VIEWS.map((e) => ({ id: e.id, cat: (e.category ?? TOOLS.find((d) => d.id === e.target)?.category ?? 'health') as ToolCategory, tool: false })),
];
/** Un outil représentatif de chaque famille d'animation. */
const FAMILY_SAMPLE: Record<LogoMotion, string> = { moon: 'kid_sleep', ring: 'baby_breastfeed', curve: 'kid_grow', check: 'family_tasks', meal: 'meals', glint: 'appointments' };
const toneOf = (th: Theme, id: string) => { const c = toolIconCategory(id); return c ? categoryTone(th, c) : th.colors.primary; };

/** Une entrée du catalogue : son pictogramme à 28 et 20 pt, son identifiant. */
function ToolCell({ id, play = 0 }: { id: string; play?: number }) {
  const t = useTheme();
  const name = toolIconName(id);
  return (
    <View style={{ width: 92, alignItems: 'center', gap: 2 }} testID={`tool-icon-cell-${id}`}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 48 }}>
        {name ? <ToolLogo id={id} size={44} variant="detailed" play={play} /> : <Text variant="caption" color={t.colors.danger}>{I.none}</Text>}
        {name ? <ToolLogo id={id} size={28} variant="compact" /> : null}
      </View>
      <Text variant="caption" muted numberOfLines={2} center style={{ fontSize: 9, lineHeight: 11 }}>{id}</Text>
      {name ? <Text variant="caption" numberOfLines={1} center color={t.colors.textMuted} style={{ fontSize: 8, lineHeight: 10, opacity: 0.7 }}>{name}</Text> : null}
    </View>
  );
}

/** Les pictogrammes des outils (sans libellé) sur une palette donnée. */
function ToolStrip({ th }: { th: Theme }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {ENTRIES.filter((e) => e.tool).map((e) => {
        const name = toolIconName(e.id);
        return name ? <HomiIcon key={e.id} name={name} size={22} color={th.colors.text} tone={toneOf(th, e.id)} /> : null;
      })}
    </View>
  );
}

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
      <ToolStrip th={th} />
    </View>
  );
}

export default function IconGallery() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const top = insets.top + useDemoInset();
  const dev = useDeveloperMode();
  const [grace, setGrace] = useState(true);
  const [play, setPlay] = useState(0);
  const [running, setRunning] = useState(false);
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
        {/* logos d'outils : les six familles d'animation, puis chaque entrée du catalogue */}
        <View style={{ gap: spacing.xs }} testID="logos-families">
          <Text variant="label" muted>{I.families}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
            {LOGO_MOTIONS.map((f) => (
              <View key={f} style={{ alignItems: 'center', gap: 4 }} testID={`logo-family-${f}`}>
                <ToolLogo id={FAMILY_SAMPLE[f]} size={64} variant="detailed" play={play} running={f === 'ring' && running} />
                <Text variant="caption" muted style={{ fontSize: 10 }}>{f}</Text>
              </View>
            ))}
          </View>
          <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
            <GlassButton label={I.replay} size="sm" variant="secondary" onPress={() => setPlay((n) => n + 1)} testID="logos-replay" />
            <GlassButton label={I.timer} size="sm" variant="secondary" onPress={() => setRunning((r) => !r)} testID="logos-timer" />
          </View>
          <Text variant="small" muted testID="logos-coverage">{I.coverage(ENTRIES.filter((e) => toolIconName(e.id)).length, ENTRIES.length)}</Text>
        </View>
        {/* logos de chaque outil, par catégorie, avec leur identifiant */}
        {SHELVES.map((cat) => (
          <View key={cat} style={{ gap: spacing.xs }} testID={`icons-tools-${cat}`}>
            <Text variant="label" muted>{`${I.tools} · ${cat} (${ENTRIES.filter((e) => e.cat === cat).length})`}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: spacing.sm }}>
              {ENTRIES.filter((e) => e.cat === cat).map((e) => <ToolCell key={e.id} id={e.id} play={play} />)}
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
