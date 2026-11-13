/**
 * Réglages → Apparence et couleurs (HOMI v2).
 *
 * Deux commandes indépendantes :
 *  1. Apparence : Système, Clair, Sombre (sélecteur capsule). Le mode nuit des soins nocturnes reste interne
 *     (écran /night) et n'est pas proposé ici.
 *  2. Palette : Auto (selon l'heure locale, transition douce), Aurore, Crépuscule, Menthe, Iris. Une palette choisie
 *     reste fixe jusqu'au retour en Auto.
 * Aperçu immédiat (l'écran entier change, plus la carte d'aperçu en tête) ; choix persistants (store de l'appareil)
 * et propres à chaque compte (`appearanceByUser`).
 */
import React, { useState } from 'react';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Screen } from '@/components/Screen';
import { GlowCard } from '@/components/GlowCard';
import { Banner, Button, Chip, Icon, type IconName, Row, SectionTitle, Segmented, Text, Toggle } from '@/components/ui';
import { CompletionCheck, CompletionGlow } from '@/motion';
import { useUiStore, type PalettePreference } from '@/lib/store';
import { useTheme } from '@/theme/ThemeProvider';
import {
  alpha, AUTO_PREVIEW_PHASE, AUTO_SCHEDULE, autoPaletteAt, buildTheme, PALETTE_NAMES, PALETTES, previewTime, spacing,
  type PaletteName, type SkyPhase,
} from '@/theme/tokens';
import { formatTime, t as tr } from '@/i18n';

type Mode = 'system' | 'light' | 'dark';
const MODES: Mode[] = ['system', 'light', 'dark'];
const CHOICES: PalettePreference[] = ['auto', ...PALETTE_NAMES];
const PHASES: SkyPhase[] = ['dawn', 'day', 'dusk', 'night'];

const paletteLabel = (p: PalettePreference) => tr(`settings.palette.${p}` as const);
const paletteDesc = (p: PalettePreference) => tr(`settings.palette.${p}.d` as const);

/** Pastille de palette : les deux accents en dégradé (Auto : les quatre palettes de la journée). */
function Swatch({ choice, size = 40 }: { choice: PalettePreference; size?: number }) {
  const t = useTheme();
  const colorsOf = (p: PaletteName) => (t.isDark ? PALETTES[p].glow : PALETTES[p].ink);
  if (choice === 'auto') {
    const all = AUTO_SCHEDULE.map((s) => colorsOf(s.palette)[0]);
    return (
      <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden', borderWidth: 1, borderColor: t.tokens.border.rest }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {all.map((c, i) => <View key={i} style={{ position: 'absolute', width: size / 2, height: size / 2, left: i % 2 ? size / 2 : 0, top: i < 2 ? 0 : size / 2, backgroundColor: c }} />)}
      </View>
    );
  }
  const [a, b] = colorsOf(choice);
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)', boxShadow: [{ offsetX: 0, offsetY: 4, blurRadius: 12, spreadDistance: -3, color: alpha(PALETTES[choice].glow[1], t.isDark ? 0.35 : 0.45) }] }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <LinearGradient colors={[a, b]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1 }} />
    </View>
  );
}

function PaletteOption({ choice, selected, onPress, wide }: { choice: PalettePreference; selected: boolean; onPress: () => void; wide?: boolean }) {
  return (
    <GlowCard
      active={selected}
      role="radio"
      onPress={onPress}
      testID={`palette-${choice}`}
      accessibilityLabel={tr('settings.palette.choiceA11y', { name: paletteLabel(choice), desc: paletteDesc(choice) })}
      style={{ flexBasis: wide ? '100%' : '47%', flexGrow: 1, minWidth: 128 }}
      contentStyle={{ paddingHorizontal: spacing.sm, paddingVertical: spacing.sm }}
      padded={false}
    >
      {/* Auto : ligne (pleine largeur) ; palettes : tuile verticale (le nom garde toute la largeur, même à 320 px) */}
      <View style={{ flexDirection: wide ? 'row' : 'column', alignItems: wide ? 'center' : 'flex-start', gap: wide ? spacing.sm : spacing.xs, minHeight: 44 }}>
        <Swatch choice={choice} size={wide ? 40 : 34} />
        <View style={{ flex: wide ? 1 : undefined, alignSelf: 'stretch', minWidth: 0 }}>
          <Text weight="bold" numberOfLines={1}>{paletteLabel(choice)}</Text>
          <Text variant="caption" muted>{paletteDesc(choice)}</Text>
        </View>
        {selected ? <View style={wide ? null : { position: 'absolute', top: 0, right: 0 }}><Icon name="check" size={18} /></View> : null}
      </View>
    </GlowCard>
  );
}

/** Statut d'aperçu : icône + libellé + couleur (jamais la couleur seule). */
function StatusPill({ icon, label, color }: { icon: IconName; label: string; color: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, minHeight: 30, borderRadius: 999, borderWidth: 1, borderColor: alpha(color, 0.35), backgroundColor: alpha(color, 0.1) }}>
      <Icon name={icon} size={14} color={color} />
      <Text variant="caption" weight="bold" color={color}>{label}</Text>
    </View>
  );
}

export default function AppearanceScreen() {
  const t = useTheme();
  const preference = useUiStore((s) => s.themePreference);
  const setTheme = useUiStore((s) => s.setTheme);
  const palette = useUiStore((s) => s.palettePreference) ?? 'auto';
  const setPalette = useUiStore((s) => s.setPalette);
  const skyOverride = useUiStore((s) => s.skyOverride);
  const setSkyOverride = useUiStore((s) => s.setSkyOverride);
  const [taskDone, setTaskDone] = useState(false);
  const [toggle, setToggle] = useState(true);

  const mode: Mode = preference === 'light' || preference === 'dark' ? preference : 'system';
  const auto = palette === 'auto';
  const now = autoPaletteAt(skyOverride ? previewTime(skyOverride) : new Date());
  const status = t.tokens.status;

  const choosePalette = (p: PalettePreference) => {
    setPalette(p);
    if (p !== 'auto') setSkyOverride(null);
  };

  return (
    <Screen back title={tr('settings.appearance.row')}>
      {/* Aperçu immédiat : tout l'écran suit déjà le choix ; cette carte montre les éléments clés réunis */}
      <SectionTitle title={tr('settings.preview.title')} />
      <View testID="appearance-preview">
        <CompletionGlow done={taskDone} radius={24}>
          <GlowCard active emphasis={taskDone ? 'success' : 'selected'}>
            <View style={{ gap: spacing.sm }}>
              <View style={{ gap: 2 }}>
                <Text variant="heading">{tr('settings.preview.card')}</Text>
                <Text variant="small" muted>{tr('settings.preview.cardSub')}</Text>
              </View>
              <Row>
                <CompletionCheck done={taskDone} onToggle={setTaskDone} label={tr('settings.preview.taskA11y', { task: tr('settings.preview.task') })} testID="preview-task" />
                <Text style={{ flex: 1, textDecorationLine: taskDone ? 'line-through' : 'none' }} muted={taskDone}>{tr('settings.preview.task')}</Text>
              </Row>
              <Row wrap>
                <Button label={tr('settings.preview.button')} size="sm" onPress={() => setTaskDone((d) => !d)} testID="preview-primary" />
                <Button label={tr('settings.preview.secondary')} size="sm" variant="secondary" onPress={() => undefined} />
              </Row>
              <Row style={{ justifyContent: 'space-between' }}>
                <Text style={{ flex: 1 }}>{tr('settings.preview.toggle')}</Text>
                <Toggle label={tr('settings.preview.toggle')} value={toggle} onChange={setToggle} />
              </Row>
              <Row wrap gap={spacing.xs}>
                <StatusPill icon="check-circle" label={tr('settings.preview.ok')} color={status.success} />
                <StatusPill icon="alert-triangle" label={tr('settings.preview.warn')} color={status.warning} />
                <StatusPill icon="alert-octagon" label={tr('settings.preview.err')} color={status.danger} />
                <StatusPill icon="info" label={tr('settings.preview.info')} color={status.info} />
              </Row>
            </View>
          </GlowCard>
        </CompletionGlow>
      </View>

      <SectionTitle title={tr('settings.appearance')} />
      <Segmented
        label={tr('settings.appearance.label')}
        value={mode}
        onChange={(v) => setTheme(v)}
        options={MODES.map((m) => ({ value: m, label: tr(`settings.appearance.${m}` as const), testID: `appearance-${m}` }))}
      />
      <Text variant="small" muted>{tr(`settings.appearance.${mode}Hint` as const)}</Text>

      <SectionTitle title={tr('settings.palette.title')} />
      <View accessibilityRole="radiogroup" accessibilityLabel={tr('settings.palette.title')} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {CHOICES.map((c) => <PaletteOption key={c} choice={c} wide={c === 'auto'} selected={palette === c} onPress={() => choosePalette(c)} />)}
      </View>

      {auto ? (
        <View style={{ gap: spacing.sm }} testID="palette-auto-info">
          <Text variant="small" muted>{tr('settings.palette.autoHint')}</Text>
          <Text variant="small" weight="medium" accessibilityLiveRegion="polite">
            {tr('settings.palette.autoNow', { palette: paletteLabel(now.dominant), next: paletteLabel(now.upcoming.palette), time: formatTime(now.upcoming.at) })}
          </Text>
          {/* Programme de l'Auto : une ligne par plage, avec la couleur ET le nom */}
          <View style={{ gap: spacing.xs }}>
            {AUTO_SCHEDULE.map((s) => {
              const d = new Date(); d.setHours(s.from, 0, 0, 0);
              const th = buildTheme(t.isDark ? 'dark' : 'light', PALETTES[s.palette], s.palette);
              return (
                <Row key={s.palette} gap={spacing.sm}>
                  <View style={{ width: 28, height: 6, borderRadius: 3, overflow: 'hidden' }}>
                    <LinearGradient colors={th.tokens.accent.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: 1 }} />
                  </View>
                  <Text variant="small" style={{ flex: 1 }} weight={now.dominant === s.palette ? 'bold' : 'regular'}>{paletteLabel(s.palette)}</Text>
                  <Text variant="small" muted>{formatTime(d)}</Text>
                </Row>
              );
            })}
          </View>
          <Text weight="medium">{tr('settings.sky.title')}</Text>
          <Text variant="small" muted>{tr('settings.sky.hint')}</Text>
          <Row wrap>
            {PHASES.map((p) => {
              const pal = (Object.keys(AUTO_PREVIEW_PHASE) as PaletteName[]).find((k) => AUTO_PREVIEW_PHASE[k] === p)!;
              return (
                <Chip key={p} testID={`auto-preview-${p}`} label={`${tr(`settings.sky.${p}` as const)} · ${formatTime(previewTime(p))}`} accessibilityLabel={`${tr(`settings.sky.${p}` as const)}, ${paletteLabel(pal)}`}
                  selected={skyOverride === p} onPress={() => setSkyOverride(skyOverride === p ? null : p)} />
              );
            })}
          </Row>
          {skyOverride ? <Button label={tr('settings.sky.reset')} icon="rotate-ccw" size="sm" variant="ghost" style={{ alignSelf: 'flex-start' }} onPress={() => setSkyOverride(null)} /> : null}
        </View>
      ) : (
        <View style={{ gap: spacing.sm }}>
          <Text variant="small" muted>{tr('settings.palette.fixedHint')}</Text>
          <Button label={tr('settings.palette.backToAuto')} icon="clock" size="sm" variant="secondary" style={{ alignSelf: 'flex-start' }} onPress={() => choosePalette('auto')} testID="palette-back-auto" />
        </View>
      )}

      <Banner tone="info">{tr('settings.appearance.private')}</Banner>
      <Text variant="caption" muted>{tr('settings.appearance.nightNote')}</Text>
    </Screen>
  );
}
