/**
 * Réglages → Apparence et couleurs (HOMI v6).
 *
 * Deux commandes indépendantes, propres à chaque compte, appliquées immédiatement à toute l'application :
 *  1. Apparence : Système, Clair, Sombre (le mode nuit des soins nocturnes reste interne à l'écran /night).
 *  2. Palette : cinq palettes (chacune en clair et en sombre) ou « Adaptatif » (la palette suit le profil affiché,
 *     correspondance fixe `ADAPTIVE_PALETTE`). Chaque choix montre un APERÇU RÉEL : pastilles de la palette + une
 *     mini-carte et un mini-bouton dessinés avec ses propres jetons, dans l'apparence en cours.
 * « Rétablir par défaut » : Système + Rose poudré et pêche. Changement en fondu sobre (fond : voile de `Backdrop` ;
 * contenu : `ThemeFade`), immédiat avec Réduire les animations. Anciennes préférences migrées (`migratePalette`).
 *
 * C'est le SEUL écran qui manipule des noms de palette (avec src/theme) ; la vitrine en dessous ne lit que le thème :
 * couleurs de la palette (avec le rouge d'alerte, distinct), séries de graphiques, halo et bouton `onHero`, famille
 * de boutons et leurs états, liste groupée, filtres et statuts, sélecteur, interrupteur.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Text as RNText, View } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { Screen } from '@/components/Screen';
import { CoralHalo } from '@/components/CoralHalo';
import { GlowCard } from '@/components/GlowCard';
import { Banner, Button, Card, Chip, Icon, type IconName, ListGroup, ListRow, Row, SectionTitle, Segmented, Text, Toggle } from '@/components/ui';
import { ChoiceGroup, DataTile, SensitiveButton } from '@/components/controls';
import { useToast } from '@/components/Overlays';
import { CompletionCheck, useMotion } from '@/motion';
import { useUiStore, type PalettePreference } from '@/lib/store';
import { useTheme } from '@/theme/ThemeProvider';
import {
  ADAPTIVE_PALETTE, alpha, DEFAULT_PALETTE, fonts, migratePalette, PALETTE_NAMES, PROFILE_KINDS, radius, resolvePalette, spacing, themeFor,
  type PaletteName, type Theme,
} from '@/theme/tokens';
import { formatNumber, t as tr } from '@/i18n';
import { ThemePickerInline } from '@/features/themePicker/ThemePicker';

type Mode = 'system' | 'light' | 'dark';
const MODES: Mode[] = ['system', 'light', 'dark'];

const paletteLabel = (p: PalettePreference) => tr(`v6.palette.${p}` as const);
const paletteDesc = (p: PalettePreference) => tr(`v6.palette.${p}.d` as const);

/** Statut : icône + libellé + couleur (jamais la couleur seule). */
function StatusPill({ icon, label, color }: { icon: IconName; label: string; color: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, minHeight: 30, borderRadius: radius.pill, borderWidth: 1, borderColor: alpha(color, 0.35), backgroundColor: alpha(color, 0.1) }}>
      <Icon name={icon} size={14} color={color} />
      <Text variant="caption" weight="bold" color={color}>{label}</Text>
    </View>
  );
}

/** Pastilles d'une palette : ses trois teintes de décor + l'aplat de son action principale. */
function Dots({ theme, size = 16 }: { theme: Theme; size?: number }) {
  const colors = [...theme.tokens.decor.ring, theme.tokens.action.fill];
  return (
    <View style={{ flexDirection: 'row' }}>
      {colors.map((c, i) => (
        <View key={i} style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: c, marginLeft: i ? -size / 4 : 0, borderWidth: 1.5, borderColor: theme.colors.surface }} />
      ))}
    </View>
  );
}

/**
 * Aperçu RÉEL d'une palette : son fond, une carte (surface, liseré, pastille d'icône, texte et texte secondaire) et
 * son bouton d'action, avec les jetons de CETTE palette dans l'apparence en cours. Décoratif pour les lecteurs
 * d'écran (la tuile porte le libellé).
 */
function PalettePreview({ theme, testID }: { theme: Theme; testID?: string }) {
  const c = theme.colors;
  const k = theme.tokens;
  const small = { fontFamily: fonts.bodyBold, fontSize: 11, lineHeight: 14, color: c.text } as const;
  return (
    <View testID={testID} accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
      style={{ alignSelf: 'stretch', backgroundColor: c.background, borderRadius: radius.sm, borderWidth: 1, borderColor: c.border, padding: 8, gap: 6 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: c.surface, borderRadius: 8, borderWidth: 1, borderColor: c.border, paddingHorizontal: 6, paddingVertical: 5 }}>
        <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: theme.material.lines.iconWell, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.primary }} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <RNText numberOfLines={1} maxFontSizeMultiplier={1.2} style={small}>{tr('v6.palette.previewTitle')}</RNText>
          <RNText numberOfLines={1} maxFontSizeMultiplier={1.2} style={{ ...small, fontFamily: fonts.body, fontSize: 10, lineHeight: 13, color: c.textMuted }}>{tr('v6.palette.previewSub')}</RNText>
        </View>
      </View>
      <View style={{ minHeight: 24, borderRadius: 8, backgroundColor: k.action.fill, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 }}>
        <RNText numberOfLines={1} maxFontSizeMultiplier={1.2} style={{ ...small, color: k.action.text }}>{tr('v6.palette.previewAction')}</RNText>
      </View>
    </View>
  );
}


/** Adaptatif : une ligne pleine largeur, les cinq palettes en pastilles, et la correspondance profil → palette. */
function AdaptiveOption({ selected, onPress }: { selected: boolean; onPress: () => void }) {
  const t = useTheme();
  const profile = useUiStore((s) => s.adaptiveProfile);
  const mode = t.isDark ? 'dark' : 'light';
  return (
    <GlowCard
      active={selected}
      role="radio"
      onPress={onPress}
      testID="palette-adaptive"
      accessibilityLabel={tr('settings.palette.choiceA11y', { name: paletteLabel('adaptive'), desc: paletteDesc('adaptive') })}
      style={{ flexBasis: '100%' }}
      contentStyle={{ padding: spacing.sm }}
      padded={false}
      still
    >
      <View style={{ gap: spacing.xs }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row' }}>
            {PALETTE_NAMES.map((p, i) => (
              <View key={p} style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: themeFor(mode, p).tokens.decor.a, marginLeft: i ? -5 : 0, borderWidth: 1.5, borderColor: t.colors.surface }} />
            ))}
          </View>
          {selected ? <Icon name="check" size={18} /> : null}
        </Row>
        <View>
          <Text weight="bold" variant="small">{paletteLabel('adaptive')}</Text>
          <Text variant="caption" muted>{paletteDesc('adaptive')}</Text>
        </View>
        {selected ? (
          <View style={{ gap: 2 }} testID="adaptive-map">
            <Text variant="caption" testID="adaptive-now">{tr('v6.palette.adaptiveNow', { palette: paletteLabel(ADAPTIVE_PALETTE[profile]), profile: tr(`v6.palette.p.${profile}` as const) })}</Text>
            {PROFILE_KINDS.map((k) => (
              <Text key={k} variant="caption" muted>{tr('v6.palette.adaptiveMap', { profile: tr(`v6.palette.p.${k}` as const), palette: paletteLabel(ADAPTIVE_PALETTE[k]) })}</Text>
            ))}
          </View>
        ) : null}
      </View>
    </GlowCard>
  );
}

/**
 * Fondu sobre du contenu quand le thème change (palette ou apparence) : opacité 0,55 → 1 en 220 ms, courbe standard.
 * Réduire les animations / économie d'énergie : aucun mouvement, l'état final est immédiat.
 */
function ThemeFade({ children }: { children: React.ReactNode }) {
  const t = useTheme();
  const m = useMotion();
  const key = `${t.colors.background}|${t.colors.primary}`;
  const last = useRef(key);
  const o = useSharedValue(1);
  useEffect(() => {
    if (last.current === key) return;
    last.current = key;
    if (m.off) { o.value = 1; return; }
    o.value = 0.55;
    o.value = m.timing(1, 220, 'standard');
  }, [key, m, o]);
  useEffect(() => () => cancelAnimation(o), [o]);
  const style = useAnimatedStyle(() => ({ opacity: o.value }));
  return <Animated.View style={[{ gap: spacing.md }, style]} testID="theme-fade">{children}</Animated.View>;
}

/** Couleurs de la palette affichée : trois teintes (décor) + le rouge d'alerte santé, distinct, avec son icône. */
function IdentitySwatches() {
  const t = useTheme();
  const d = t.tokens.decor;
  const items: { color: string; label: string; icon?: IconName }[] = [
    { color: d.a, label: tr('v6.palette.accent') },
    { color: d.b, label: tr('v6.palette.accent2') },
    { color: d.c, label: tr('v6.palette.third') },
    { color: t.colors.danger, label: tr('v5.identity.alert'), icon: 'alert-octagon' },
  ];
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }} testID="identity-swatches">
      {items.map((i) => (
        <View key={i.label} style={{ alignItems: 'center', gap: 6, minWidth: 64, flexGrow: 1, flexBasis: '20%' }}>
          <View style={{ width: 44, height: 44, borderRadius: radius.control, backgroundColor: i.color, alignItems: 'center', justifyContent: 'center' }}>
            {i.icon ? <Icon name={i.icon} size={20} color={t.isDark ? t.tokens.text.onAccent : t.colors.surface} /> : null}
          </View>
          <Text variant="caption" center>{i.label}</Text>
        </View>
      ))}
    </View>
  );
}

/** Séries de graphiques de la palette (barres d'exemple). */
function ChartSwatches() {
  const t = useTheme();
  const heights = [26, 40, 32, 46, 22, 36];
  return (
    <View testID="chart-swatches" accessible accessibilityRole="image" accessibilityLabel={tr('v6.palette.chartsA11y')}
      style={{ flexDirection: 'row', alignItems: 'flex-end', gap: spacing.xs, height: 60, paddingTop: spacing.xs, paddingHorizontal: spacing.sm, borderRadius: radius.md, overflow: 'hidden', backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.colors.border }}>
      {t.tokens.chart.map((c, i) => <View key={c} style={{ flex: 1, height: heights[i % heights.length], borderTopLeftRadius: 6, borderTopRightRadius: 6, backgroundColor: c }} />)}
    </View>
  );
}

function ComponentsPreview() {
  const toast = useToast();
  const [filter, setFilter] = useState<'all' | 'mine' | 'done'>('all');
  const [duration, setDuration] = useState<'15' | '30' | '60'>('30');
  const [toggle, setToggle] = useState(true);
  const [done, setDone] = useState(false);
  const [deleted, setDeleted] = useState(false);
  return (
    <View style={{ gap: spacing.md }} testID="controls-preview">
      <Text variant="label">{tr('v5.ds.buttons')}</Text>
      <Button label={tr('settings.ds.save')} full testID="ds-primary" onPress={() => new Promise<void>((r) => setTimeout(() => { r(); toast(tr('settings.ds.saved')); }, 900))} />
      <Row wrap>
        <Button label={tr('settings.ds.cancel')} variant="secondary" testID="ds-secondary" onPress={() => undefined} />
        <Button label={tr('v5.ds.link')} variant="link" testID="ds-link" onPress={() => undefined} />
      </Row>
      <Row wrap>
        <Button label={tr('v5.ds.share')} variant="icon" icon="share-2" testID="ds-icon" onPress={() => undefined} />
        <Button label={tr('settings.ds.add')} variant="icon" icon="plus" onPress={() => undefined} />
        <Button label={tr('settings.ds.disabled')} size="sm" disabled onPress={() => undefined} testID="ds-disabled" />
        <Button label={tr('v5.ds.loading')} size="sm" variant="secondary" loading testID="ds-loading" />
      </Row>
      <Button label={tr('settings.ds.fail')} variant="outline" icon="alert-triangle" size="sm" style={{ alignSelf: 'flex-start' }} testID="ds-fail"
        onPress={() => new Promise<void>((_r, reject) => setTimeout(() => reject(new Error(tr('settings.ds.failMsg'))), 700))} />
      {!deleted ? (
        <SensitiveButton label={tr('settings.ds.delete')} icon="trash-2" confirmMessage={tr('settings.ds.deleteMsg')} size="sm" style={{ alignSelf: 'flex-start' }} testID="ds-sensitive"
          onPress={() => { setDeleted(true); toast(tr('settings.ds.deleted')); }} />
      ) : null}

      <ListGroup title={tr('v5.ds.list')} testID="ds-list">
        <ListRow icon="calendar" title={tr('v5.ds.rowAgenda')} subtitle={tr('v5.ds.rowAgendaSub')} onPress={() => undefined} />
        <ListRow icon="shopping-cart" title={tr('v5.ds.rowShopping')} value={tr('v5.ds.rowShoppingSub')} onPress={() => undefined} />
        <ListRow icon="bell" title={tr('v5.ds.rowReminders')} right={<Toggle label={tr('v5.ds.rowReminders')} value={toggle} onChange={setToggle} />} />
      </ListGroup>

      <Text variant="label">{tr('v5.ds.filters')}</Text>
      <Row wrap gap={spacing.xs}>
        <Chip label={tr('v5.ds.filterAll')} selected={filter === 'all'} onPress={() => setFilter('all')} testID="ds-filter-all" />
        <Chip label={tr('v5.ds.filterMine')} selected={filter === 'mine'} onPress={() => setFilter('mine')} />
        <Chip label={tr('v5.ds.filterDone')} selected={filter === 'done'} onPress={() => setFilter('done')} />
      </Row>
      <ChoiceGroup label={tr('settings.ds.duration')} value={duration} onChange={setDuration} testID="ds-duration"
        options={[{ value: '15', label: tr('settings.ds.d15'), testID: 'ds-d15' }, { value: '30', label: tr('settings.ds.d30'), testID: 'ds-d30' }, { value: '60', label: tr('settings.ds.d60'), testID: 'ds-d60' }]} />
      <Card>
        <Row>
          <CompletionCheck done={done} onToggle={setDone} label={tr('settings.preview.taskA11y', { task: tr('settings.preview.task') })} testID="preview-task" />
          <Text style={{ flex: 1, textDecorationLine: done ? 'line-through' : 'none' }} muted={done}>{tr('settings.preview.task')}</Text>
        </Row>
      </Card>
      <DataTile label={tr('settings.ds.tileSleep')} icon="moon" value={formatNumber(7.4, { maximumFractionDigits: 1 })} unit={tr('settings.ds.tileSleepUnit')}
        context={tr('settings.ds.tileWeek')} series={[6.8, 7.1, 6.5, 7.6, 7.2, 7.9, 7.4]} trendLabel={tr('settings.ds.tileTrend')} testID="ds-tile-sleep" />
    </View>
  );
}

export default function AppearanceScreen() {
  const t = useTheme();
  const toast = useToast();
  const preference = useUiStore((s) => s.themePreference);
  const setTheme = useUiStore((s) => s.setTheme);
  const choice = migratePalette(useUiStore((s) => s.palettePreference));
  const setPalette = useUiStore((s) => s.setPalette);
  const resetAppearance = useUiStore((s) => s.resetAppearance);
  const profile = useUiStore((s) => s.adaptiveProfile);
  const mode: Mode = preference === 'light' || preference === 'dark' ? preference : 'system';
  const status = t.tokens.status;
  const hint = mode === 'light' ? tr('v6.palette.lightHint') : mode === 'dark' ? tr('v6.palette.darkHint') : tr('settings.appearance.systemHint');
  const isDefault = mode === 'system' && choice === DEFAULT_PALETTE;
  const shown = resolvePalette(choice, profile);

  return (
    <Screen back title={tr('settings.appearance.row')}>
      <SectionTitle title={tr('settings.appearance')} />
      <Segmented
        label={tr('settings.appearance.label')}
        value={mode}
        onChange={(v) => setTheme(v)}
        options={MODES.map((m) => ({ value: m, label: tr(`settings.appearance.${m}` as const), testID: `appearance-${m}` }))}
      />
      <Text variant="small" muted>{hint}</Text>

      <SectionTitle title={tr('v6.palette.title')} />
      <Text variant="small" muted>{tr('v6.palette.intro')}</Text>
      {/* Ticket 6 : LE MÊME sélecteur que le bouton palette de l'accueil (aperçu, Appliquer / Annuler), même source */}
      <ThemePickerInline />
      <View accessibilityRole="radiogroup" accessibilityLabel={tr('v6.palette.title')} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }} testID="palette-choices">
        <AdaptiveOption selected={choice === 'adaptive'} onPress={() => setPalette('adaptive')} />
      </View>
      <Text variant="caption" muted testID="palette-current">{`${tr('v6.palette.current')} : ${paletteLabel(shown)}. ${tr('v6.palette.animNote')}`}</Text>
      <Button label={tr('v6.palette.reset')} variant="secondary" icon="rotate-ccw" size="sm" disabled={isDefault} style={{ alignSelf: 'flex-start' }} testID="appearance-reset"
        onPress={() => { resetAppearance(); toast(tr('v6.palette.resetDone')); }} />

      <ThemeFade>
        <SectionTitle title={tr('v6.palette.colors')} />
        <Text variant="small" muted>{tr('v6.palette.colorsBody')}</Text>
        <IdentitySwatches />
        <Row wrap gap={spacing.xs}>
          <StatusPill icon="check-circle" label={tr('settings.preview.ok')} color={status.success} />
          <StatusPill icon="alert-triangle" label={tr('settings.preview.warn')} color={status.warning} />
          <StatusPill icon="alert-octagon" label={tr('settings.preview.err')} color={status.danger} />
          <StatusPill icon="info" label={tr('settings.preview.info')} color={status.info} />
        </Row>
        <Text variant="label">{tr('v6.palette.charts')}</Text>
        <ChartSwatches />

        {/* Halo : réservé à l'accueil, à l'entrée et à l'onboarding ; ici, aperçu avec le bouton « sur le halo » */}
        <View testID="appearance-preview" style={{ alignItems: 'center', justifyContent: 'center', minHeight: 220, borderRadius: radius.xl, overflow: 'hidden', backgroundColor: t.colors.background, borderWidth: 1, borderColor: t.colors.border }}>
          <CoralHalo size={260} style={{ position: 'absolute' }} testID="appearance-halo" />
          <Button label={tr('v5.ds.onHero')} variant="onHero" testID="preview-primary" onPress={() => undefined} />
        </View>

        <SectionTitle title={tr('v5.ds.title')} />
        <ComponentsPreview />
      </ThemeFade>

      <Banner tone="info">{tr('settings.appearance.private')}</Banner>
      <Text variant="caption" muted>{tr('settings.appearance.nightNote')}</Text>
    </Screen>
  );
}
