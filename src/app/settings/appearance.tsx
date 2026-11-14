/**
 * Réglages → Apparence et couleurs (HOMI v4 « lumière minérale »).
 *
 * Deux commandes indépendantes :
 *  1. Apparence : Système, Clair, Sombre (sélecteur à lentille). Le mode nuit des soins nocturnes reste interne
 *     (écran /night) et n'est pas proposé ici.
 *  2. Palette : Auto (selon l'heure locale, transition douce), Brume pêche (signature), Aurore lilas, Lagune turquoise,
 *     Ambre minéral. Une palette choisie reste fixe jusqu'au retour en Auto ; le changement interpole lumière, reflets,
 *     accents et scène ensemble (le contenu ne bouge pas).
 * Aperçu immédiat (l'écran entier change, plus la carte d'aperçu en tête) ; choix persistants (store de l'appareil)
 * et propres à chaque compte (`appearanceByUser`) ; une préférence v3 est lue comme la palette v4 la plus proche.
 *
 * Écran de vérification du design system v4 : trois matières + la lentille, famille de commandes et leurs états
 * (chargement, succès, erreur, désactivé), panneau du bas gestuel, scène de chaque espace (immersive / calme).
 */
import React, { useState } from 'react';
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Screen } from '@/components/Screen';
import { GlowCard } from '@/components/GlowCard';
import { Banner, Button, Chip, Field, Icon, type IconName, Row, SectionTitle, Segmented, Text, Toggle } from '@/components/ui';
import { FrostedGlass, MatteSurface, OpticalGlass } from '@/components/surfaces';
import { ChoiceGroup, DataTile, IconOrb, PrimaryButton, SecondaryButton, SensitiveButton } from '@/components/controls';
import { SpaceScene, type SceneVariant } from '@/components/scene/SpaceScene';
import { Lens, LENS, useLensSlide } from '@/components/controls/Lens';
import { SPACE_KEYS, type SpaceKey } from '@/theme/ambiance';
import { Sheet, useToast } from '@/components/Overlays';
import { CompletionCheck, CompletionGlow } from '@/motion';
import { useUiStore, type PalettePreference } from '@/lib/store';
import { useTheme } from '@/theme/ThemeProvider';
import {
  alpha, AUTO_SCHEDULE, autoPaletteAt, buildTheme, migratePalette, PALETTE_NAMES, PALETTES, PHASE_PALETTE, previewTime, radius, spacing,
  type PaletteName, type SkyPhase,
} from '@/theme/tokens';
import { formatNumber, formatTime, t as tr } from '@/i18n';

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
    <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)', boxShadow: [{ offsetX: 0, offsetY: 4, blurRadius: 12, spreadDistance: -3, color: alpha(PALETTES[choice].glow[0], t.isDark ? 0.4 : 0.45) }] }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <LinearGradient colors={[a, b]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1 }} />
      <LinearGradient colors={['rgba(255,255,255,0.4)', 'rgba(255,255,255,0)']} start={{ x: 0.2, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} />
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
      still
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

/** Démonstration des trois matières côte à côte, posées sur un extrait de la scène. */
function MaterialsPreview() {
  const items: { C: typeof OpticalGlass; title: string; sub: string; id: string }[] = [
    { C: OpticalGlass, title: tr('settings.ds.optical'), sub: tr('settings.ds.opticalSub'), id: 'optical' },
    { C: FrostedGlass, title: tr('settings.ds.frosted'), sub: tr('settings.ds.frostedSub'), id: 'frosted' },
    { C: MatteSurface, title: tr('settings.ds.matte'), sub: tr('settings.ds.matteSub'), id: 'matte' },
  ];
  return (
    <View style={{ borderRadius: radius.xl, overflow: 'hidden', minHeight: 200 }} testID="materials-preview">
      <SpaceScene space="settings" variant="immersive" testID="scene-materials" />
      <View style={{ padding: spacing.sm, gap: spacing.sm }}>
        {items.map(({ C, title, sub, id }) => (
          <C key={id} radius={radius.lg} padded={spacing.md} testID={`surface-${id}`}>
            <Text weight="bold">{title}</Text>
            <Text variant="small" muted>{sub}</Text>
          </C>
        ))}
        <LensSample />
      </View>
    </View>
  );
}

/** La lentille seule, posée dans un rail en creux (même matière que la sélection des sélecteurs et des onglets). */
function LensSample() {
  const t = useTheme();
  const [w, setW] = useState(0);
  const slide = useLensSlide(LENS.inset, Math.max(0, w * 0.5 - LENS.inset));
  const g = t.material.glass.inset;
  return (
    <View testID="surface-lens" onLayout={(e) => setW(Math.round(e.nativeEvent.layout.width))}
      style={{ minHeight: 64, borderRadius: radius.pill, borderWidth: 1, borderColor: g.edge, backgroundColor: t.material.surfaces.matte.fill, flexDirection: 'row', alignItems: 'center' }}>
      <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, borderRadius: radius.pill, backgroundColor: g.fill }} />
      {w > 0 ? <Lens slide={slide} top={LENS.inset} height={62 - LENS.inset * 2} /> : null}
      <View style={{ width: '50%', paddingHorizontal: spacing.md, paddingVertical: spacing.xs }}>
        <Text weight="bold">{tr('settings.ds.lens')}</Text>
      </View>
      <View style={{ width: '50%', paddingHorizontal: spacing.sm, paddingVertical: spacing.xs }}>
        <Text variant="caption" muted>{tr('settings.ds.lensSub')}</Text>
      </View>
    </View>
  );
}

function ControlsPreview() {
  const t = useTheme();
  const toast = useToast();
  const [duration, setDuration] = useState<'15' | '30' | '60'>('30');
  const [mood, setMood] = useState<'calm' | 'good' | 'tired' | 'tense' | null>('good');
  const [fav, setFav] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [note, setNote] = useState('');
  const [deleted, setDeleted] = useState(false);
  return (
    <View style={{ gap: spacing.md }} testID="controls-preview">
      <Row wrap>
        <PrimaryButton label={tr('settings.ds.save')} icon="check" testID="ds-primary" onPress={() => new Promise<void>((r) => setTimeout(() => { r(); toast(tr('settings.ds.saved')); }, 900))} />
        <SecondaryButton label={tr('settings.ds.cancel')} testID="ds-secondary" onPress={() => undefined} />
      </Row>
      <Text variant="small" weight="medium">{tr('settings.ds.states')}</Text>
      <Row wrap>
        <PrimaryButton label={tr('settings.ds.disabled')} size="sm" disabled onPress={() => undefined} testID="ds-disabled" />
        <SecondaryButton label={tr('settings.ds.fail')} size="sm" icon="alert-triangle" testID="ds-fail"
          onPress={() => new Promise<void>((_r, reject) => setTimeout(() => reject(new Error(tr('settings.ds.failMsg'))), 700))} />
      </Row>
      <Row gap={spacing.sm}>
        <IconOrb icon="plus" label={tr('settings.ds.add')} tone="accent" onPress={() => setSheet(true)} testID="ds-orb-add" />
        <IconOrb icon="star" label={tr('settings.ds.favorite')} selected={fav} onPress={() => setFav((f) => !f)} testID="ds-orb-fav" />
        <IconOrb icon="more-horizontal" label={tr('settings.ds.options')} onPress={() => undefined} />
        <IconOrb icon="x" label={tr('common.close')} size="sm" onPress={() => undefined} />
      </Row>
      <ChoiceGroup label={tr('settings.ds.duration')} value={duration} onChange={setDuration} testID="ds-duration"
        options={[{ value: '15', label: tr('settings.ds.d15'), testID: 'ds-d15' }, { value: '30', label: tr('settings.ds.d30'), testID: 'ds-d30' }, { value: '60', label: tr('settings.ds.d60'), testID: 'ds-d60' }]} />
      <Text variant="small" weight="medium">{tr('settings.ds.mood')}</Text>
      <ChoiceGroup variant="orbs" label={tr('settings.ds.mood')} value={mood} onChange={setMood} testID="ds-mood"
        options={[
          { value: 'calm', label: tr('settings.ds.moodCalm'), icon: 'feather' },
          { value: 'good', label: tr('settings.ds.moodGood'), icon: 'sun' },
          { value: 'tired', label: tr('settings.ds.moodTired'), icon: 'moon' },
          { value: 'tense', label: tr('settings.ds.moodTense'), icon: 'zap' },
        ]} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        <DataTile style={{ flexBasis: '47%', flexGrow: 1 }} label={tr('settings.ds.tileSleep')} icon="moon" value={formatNumber(7.4, { maximumFractionDigits: 1 })} unit={tr('settings.ds.tileSleepUnit')}
          context={tr('settings.ds.tileWeek')} series={[6.8, 7.1, 6.5, 7.6, 7.2, 7.9, 7.4]} trendLabel={tr('settings.ds.tileTrend')} testID="ds-tile-sleep" />
        <DataTile style={{ flexBasis: '47%', flexGrow: 1 }} label={tr('settings.ds.tileDone')} icon="check-circle" tint="success" value={formatNumber(12)} context={tr('settings.ds.tileToday')} testID="ds-tile-done" />
        <DataTile style={{ flexBasis: '100%' }} label={tr('settings.ds.tileEmpty')} icon="shopping-cart" value={null} emptyText={tr('settings.ds.tileEmptyText')} testID="ds-tile-empty" />
      </View>
      {!deleted ? (
        <SensitiveButton label={tr('settings.ds.delete')} icon="trash-2" confirmMessage={tr('settings.ds.deleteMsg')} size="sm" style={{ alignSelf: 'flex-start' }} testID="ds-sensitive"
          onPress={() => { setDeleted(true); toast(tr('settings.ds.deleted')); }} />
      ) : null}
      <Button label={tr('settings.ds.sheet')} icon="chevrons-up" variant="secondary" onPress={() => setSheet(true)} testID="demo-sheet-open" />
      <Sheet visible={sheet} onClose={() => setSheet(false)} title={tr('settings.ds.sheetTitle')}>
        <Text muted>{tr('settings.ds.sheetBody')}</Text>
        <Field label={tr('settings.ds.sheetField')} value={note} onChangeText={setNote} testID="demo-sheet-field" />
        <PrimaryButton label={tr('settings.ds.save')} full onPress={() => setSheet(false)} testID="demo-sheet-save" />
        <View style={{ height: 6, borderRadius: 3, backgroundColor: t.material.lines.separator }} />
      </Sheet>
    </View>
  );
}

/** Scène de chaque espace, immersive ou calme (aperçu sans quitter les réglages). */
function ScenePreview() {
  const [variant, setVariant] = useState<SceneVariant>('immersive');
  const [space, setSpace] = useState<SpaceKey>('home');
  return (
    <View style={{ gap: spacing.sm }}>
      <Row wrap gap={spacing.xs}>
        {SPACE_KEYS.map((k) => (
          <Chip key={k} label={tr(`settings.space.${k}` as const)} selected={space === k} onPress={() => setSpace(k)} testID={`scene-space-pick-${k}`} />
        ))}
      </Row>
      <Segmented label={tr('settings.scene.title')} value={variant} onChange={setVariant}
        options={[{ value: 'immersive', label: tr('settings.scene.immersive'), testID: 'scene-pick-immersive' }, { value: 'calm', label: tr('settings.scene.calm'), testID: 'scene-pick-calm' }]} />
      <View style={{ height: 300, borderRadius: radius.xl, overflow: 'hidden' }} testID="scene-preview">
        <SpaceScene space={space} variant={variant} />
      </View>
      <Text variant="small" muted>{tr('settings.space.hint')}</Text>
      <Text variant="small" muted>{tr('settings.scene.hint')}</Text>
    </View>
  );
}

export default function AppearanceScreen() {
  const t = useTheme();
  const preference = useUiStore((s) => s.themePreference);
  const setTheme = useUiStore((s) => s.setTheme);
  const palette = migratePalette(useUiStore((s) => s.palettePreference));
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
        <CompletionGlow done={taskDone} radius={26}>
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
            {PHASES.map((p) => (
              <Chip key={p} testID={`auto-preview-${p}`} label={`${tr(`settings.sky.${p}` as const)} · ${formatTime(previewTime(p))}`} accessibilityLabel={`${tr(`settings.sky.${p}` as const)}, ${paletteLabel(PHASE_PALETTE[p])}`}
                selected={skyOverride === p} onPress={() => setSkyOverride(skyOverride === p ? null : p)} />
            ))}
          </Row>
          {skyOverride ? <Button label={tr('settings.sky.reset')} icon="rotate-ccw" size="sm" variant="ghost" style={{ alignSelf: 'flex-start' }} onPress={() => setSkyOverride(null)} /> : null}
        </View>
      ) : (
        <View style={{ gap: spacing.sm }}>
          <Text variant="small" muted>{tr('settings.palette.fixedHint')}</Text>
          <Button label={tr('settings.palette.backToAuto')} icon="clock" size="sm" variant="secondary" style={{ alignSelf: 'flex-start' }} onPress={() => choosePalette('auto')} testID="palette-back-auto" />
        </View>
      )}

      <SectionTitle title={tr('settings.ds.title')} />
      <MaterialsPreview />
      <ControlsPreview />

      <SectionTitle title={tr('settings.space.title')} />
      <ScenePreview />

      <Banner tone="info">{tr('settings.appearance.private')}</Banner>
      <Text variant="caption" muted>{tr('settings.appearance.nightNote')}</Text>
    </Screen>
  );
}
