/**
 * Introduction en 8 scènes (13/11/2026) : une histoire, du cycle à la vie à deux.
 *   1 Bienvenue · 2 Mon cycle · 3 Mon projet bébé · 4 Ma grossesse · 5 Mon bébé · 6 Mon journal ·
 *   7 Notre histoire à deux · 8 Commencer (langue, créer un compte, se connecter, découvrir sans compte).
 * Le fond est la scène de l'application (montée dans _layout, derrière toutes les pages), sous un voile de
 * lecture tiré du fond du thème. Le logo est le PNG transparent, posé directement sur le fond : ni cercle, ni tuile, ni halo.
 * « Passer » mène toujours à la dernière scène ; l'introduction se rejoue depuis l'écran de bienvenue.
 * Animations : transform et opacity uniquement ; « réduire les animations » : états finaux immédiats.
 * Ne présente que des fonctions réellement disponibles.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, PanResponder, ScrollView, useWindowDimensions, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDemoInset } from '@/components/demoInset';
import { LinearGradient } from 'expo-linear-gradient';
import { Appear } from '@/components/Appear';
import { StaggerItem } from '@/components/Motion';
import { tint, ToolGlyph } from '@/components/ToolGlyph';
import { Button, haptic, Icon, type IconName, Text } from '@/components/ui';
import { formatDate, getLocale, isRTL, t as tr, type TKey } from '@/i18n';
import { returnHereAfterLocaleChange } from '@/i18n/I18nProvider';
import { availableLocales } from '@/i18n/locales';
import { startDemoWithoutAccount } from '@/lib/demoMode';
import type { ToolTheme } from '@/lib/domain/toolCatalog';
import { useUiStore } from '@/lib/store';
import { duration, easing, stagger, timeTo } from '@/theme/motion';
import { useReduceMotion, useTheme } from '@/theme/ThemeProvider';
import { alpha, NATIVE_DRIVER, radius, spacing, typography } from '@/theme/tokens';
import { Tappable } from '@/components/Tappable';
import { BrandWordmark } from '@/components/BrandLogo';

type Scene = 'welcome' | 'cycle' | 'project' | 'pregnancy' | 'baby' | 'journal' | 'together' | 'start';
export const INTRO_SCENES: Scene[] = ['welcome', 'cycle', 'project', 'pregnancy', 'baby', 'journal', 'together', 'start'];
const SLIDES = INTRO_SCENES;

type HeroDef = { key: string; hero: ToolTheme; heroIcon: IconName; sats: [ToolTheme, IconName][]; icons: IconName[] };
const UNIVERSES: HeroDef[] = [
  { key: 'project', hero: 'cycle', heroIcon: 'sunrise', sats: [['calendar', 'calendar'], ['health', 'thermometer'], ['reminders', 'bell']], icons: ['sunrise', 'thermometer', 'info'] },
  { key: 'baby', hero: 'growth', heroIcon: 'trending-up', sats: [['feeding', 'coffee'], ['sleep', 'moon'], ['teeth', 'circle']], icons: ['activity', 'bar-chart-2', 'star'] },
];
/** Points clés de chaque scène : des fonctions qui existent (textes d'origine conservés pour cycle, grossesse, enfant). */
const POINTS: Partial<Record<Scene, { keys: [TKey, TKey, TKey]; icons: [IconName, IconName, IconName] }>> = {
  cycle: { keys: ['intro.cycle.p1', 'intro.cycle.p2', 'intro.cycle.p3'], icons: ['calendar', 'edit-3', 'sunrise'] },
  project: { keys: ['intro.s.project.p1', 'intro.s.project.p2', 'intro.s.project.p3'], icons: ['sunrise', 'thermometer', 'info'] },
  pregnancy: { keys: ['intro.pregnancy.p1', 'intro.pregnancy.p2', 'intro.pregnancy.p3'], icons: ['moon', 'calendar', 'briefcase'] },
  baby: { keys: ['intro.child.p1', 'intro.child.p2', 'intro.child.p3'], icons: ['activity', 'bar-chart-2', 'star'] },
  journal: { keys: ['intro.s.journal.p1', 'intro.s.journal.p2', 'intro.s.journal.p3'], icons: ['book-open', 'heart', 'lock'] },
  together: { keys: ['intro.s.together.p1', 'intro.s.together.p2', 'intro.s.together.p3'], icons: ['user-plus', 'calendar', 'sliders'] },
};
const editorial = { fontFamily: typography.editorial.fontFamily, fontSize: typography.editorial.fontSize, lineHeight: typography.editorial.lineHeight, letterSpacing: typography.editorial.letterSpacing };
const ART_H = 190;

/** Valeur 0 → 1 jouée une fois à l'arrivée de la scène (état final immédiat si animations réduites). */
function useEnter(ms: number, delay = 0) {
  const reduce = useReduceMotion();
  const v = useRef(new Animated.Value(reduce ? 1 : 0)).current;
  useEffect(() => {
    if (reduce) { v.setValue(1); return; }
    const a = Animated.timing(v, { toValue: 1, duration: ms, delay, easing: easing.decelerate, useNativeDriver: NATIVE_DRIVER });
    a.start();
    return () => a.stop();
  }, [v, reduce, ms, delay]);
  return v;
}
const rise = (v: Animated.Value, from = 10) => ({ opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [from, 0] }) }] });

/** Mot-symbole HOMI (logotype v4) : opacité progressive, très légère translation, puis stabilisation. */
function LogoMark({ size }: { size: number }) {
  const v = useEnter(900, 120);
  return (
    <Animated.View testID="intro-logo" style={{ opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }, { scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1] }) }] }}>
      <BrandWordmark height={Math.round(size * 0.36)} />
    </Animated.View>
  );
}

/** Scène 2 : un mois de calendrier ; les jours de règles puis la fenêtre fertile estimée se posent un à un. */
function CalendarArt() {
  const t = useTheme();
  const v = useEnter(1500, 150);
  const cell = 26;
  const kind = (d: number) => (d < 5 ? 'period' : d >= 11 && d <= 16 ? 'fertile' : 'plain');
  return (
    <View style={{ height: ART_H, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: cell * 7 + 6 * 6, flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {Array.from({ length: 28 }, (_, d) => {
          const k = kind(d);
          const at = 0.1 + (d / 28) * 0.6;
          const on = v.interpolate({ inputRange: [0, at, Math.min(1, at + 0.2), 1], outputRange: [0, 0, 1, 1] });
          return (
            <View key={d} style={{ width: cell, height: cell, borderRadius: cell / 2, borderWidth: 1, borderColor: tint(t.colors.text, 0.22), alignItems: 'center', justifyContent: 'center' }}>
              {k !== 'plain' ? <Animated.View style={{ position: 'absolute', width: cell, height: cell, borderRadius: cell / 2, backgroundColor: k === 'period' ? t.colors.heart : t.colors.gold, opacity: on.interpolate({ inputRange: [0, 1], outputRange: [0, k === 'period' ? 0.9 : 0.55] }), transform: [{ scale: on.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }] }} /> : null}
            </View>
          );
        })}
      </View>
    </View>
  );
}

/** Scène 4 : le fil de la grossesse avance le long de trois repères. */
function ProgressArt() {
  const t = useTheme();
  const v = useEnter(1600, 200);
  const W = 240;
  const progress = 0.6;
  return (
    <View style={{ height: ART_H, alignItems: 'center', justifyContent: 'center', gap: spacing.md }}>
      <ToolGlyph theme="pregnancy" icon="heart" size={84} play={1} />
      <View style={{ width: W, height: 26, justifyContent: 'center' }}>
        <View style={{ height: 3, borderRadius: 2, backgroundColor: tint(t.colors.text, 0.18), overflow: 'hidden' }}>
          <Animated.View style={{ width: W, height: 3, transform: [{ translateX: v.interpolate({ inputRange: [0, 1], outputRange: [-W, -W * (1 - progress)] }) }] }}>
            <LinearGradient colors={t.material.primaryGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: 1 }} />
          </Animated.View>
        </View>
        {[0, 0.33, 0.66, 1].map((x) => <View key={x} style={{ position: 'absolute', left: x * (W - 10), width: 10, height: 10, borderRadius: 5, backgroundColor: x <= progress ? t.colors.gold : t.colors.background, borderWidth: 1, borderColor: t.colors.gold }} />)}
      </View>
      <Animated.View style={rise(v, 6)}><Text variant="small" weight="medium" color={t.colors.gold}>{tr('intro.s.pregnancy.week', { n: 24 })}</Text></Animated.View>
    </View>
  );
}

/** Scène 6 : une page de journal se pose, la date puis les lignes s'écrivent. */
function JournalArt() {
  const t = useTheme();
  const v = useEnter(700, 100);
  const lines = [0.92, 0.78, 0.86, 0.5];
  return (
    <View style={{ height: ART_H, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={[{ width: 230, padding: spacing.md, borderRadius: radius.lg, backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.colors.border, gap: 9 }, { opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }, { scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) }] }]}>
        <Text numberOfLines={1} style={{ fontFamily: typography.editorialS.fontFamily, fontSize: typography.editorialS.fontSize, lineHeight: typography.editorialS.lineHeight, color: t.colors.gold }}>{formatDate(new Date(), { weekday: 'long', day: 'numeric', month: 'long' }).replace(/^./, (c) => c.toUpperCase())}</Text>
        {lines.map((w, k) => <StaggerItem key={k} index={k + 3}><View style={{ height: 7, borderRadius: 4, width: `${w * 100}%`, backgroundColor: tint(t.colors.text, 0.3) }} /></StaggerItem>)}
      </Animated.View>
    </View>
  );
}

/** Scène 7 : deux personnes, chacune son espace, reliées par un fil doré qui se déroule du centre. */
function TogetherArt() {
  const t = useTheme();
  const v = useEnter(1300, 250);
  const W = 120;
  const dot = (icon: IconName, from: number) => (
    <Animated.View style={{ width: 68, height: 68, borderRadius: 34, borderWidth: 1.2, borderColor: t.colors.gold, backgroundColor: t.colors.surface, alignItems: 'center', justifyContent: 'center', opacity: v.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 1, 1] }), transform: [{ translateX: v.interpolate({ inputRange: [0, 0.5, 1], outputRange: [from, 0, 0] }) }] }}>
      <Icon name={icon} size={28} color={t.colors.gold} />
    </Animated.View>
  );
  return (
    <View style={{ height: ART_H, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
      {dot('user', -14)}
      <View style={{ width: W, height: 3, alignItems: 'center' }}>
        <Animated.View style={{ width: W, height: 2, borderRadius: 1, opacity: v, transform: [{ scaleX: v.interpolate({ inputRange: [0, 0.45, 1], outputRange: [0, 0, 1] }) }] }}>
          <LinearGradient colors={t.material.primaryGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: 1, borderRadius: 1 }} />
        </Animated.View>
      </View>
      {dot('user', 14)}
    </View>
  );
}

/** Composition propre à chaque univers : grande silhouette au centre, trois satellites qui se posent sur une orbite. */
function UniverseHero({ u }: { u: (typeof UNIVERSES)[number] }) {
  const t = useTheme();
  const reduce = useReduceMotion();
  const orbit = useRef(new Animated.Value(reduce ? 1 : 0)).current;
  const [play, setPlay] = useState(0);
  useEffect(() => {
    if (reduce) return;
    Animated.timing(orbit, { toValue: 1, duration: 900, easing: easing.decelerate, useNativeDriver: NATIVE_DRIVER }).start();
    const id = setTimeout(() => setPlay(1), 350);
    return () => clearTimeout(id);
  }, [orbit, reduce]);
  const R = 96;
  return (
    <View style={{ height: 250, alignItems: 'center', justifyContent: 'center' }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={{ position: 'absolute', width: R * 2 + 20, height: R * 2 + 20, borderRadius: R + 10, borderWidth: 1, borderColor: tint(t.colors.lavender, 0.35), borderStyle: 'dashed' }} />
      <ToolGlyph theme={u.hero} icon={u.heroIcon} size={128} play={play} />
      {u.sats.map(([theme, icon], k) => {
        const angle = (-90 + k * 120) * (Math.PI / 180);
        return (
          <Animated.View key={theme + k} style={{ position: 'absolute', opacity: orbit,
            transform: [
              { translateX: orbit.interpolate({ inputRange: [0, 1], outputRange: [Math.cos(angle - 0.7) * R, Math.cos(angle) * R] }) },
              { translateY: orbit.interpolate({ inputRange: [0, 1], outputRange: [Math.sin(angle - 0.7) * R, Math.sin(angle) * R] }) },
              { scale: orbit.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) },
            ] }}>
            <ToolGlyph theme={theme} icon={icon} size={46} play={play} />
          </Animated.View>
        );
      })}
    </View>
  );
}

/** Hauteur de fenêtre (les écrans courts reçoivent un logo plus petit pour garder les boutons visibles). */
function useWindowHeight() { return useWindowDimensions().height; }

export default function Intro() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  // Haut : zone sûre + place de la pastille « Démonstration » (0 hors démo)
  const topInset = insets.top + useDemoInset();
  const reduce = useReduceMotion();
  const setIntroSeen = useUiStore((s) => s.setIntroSeen);
  const setLocalePref = useUiStore((s) => s.setLocalePref);
  // Après un changement de langue (dernière scène), on revient sur cette scène, pas au début
  const { scene } = useLocalSearchParams<{ scene?: string }>();
  const [i, setI] = useState(() => Math.max(0, SLIDES.indexOf(scene as Scene)));
  const v = useRef(new Animated.Value(1)).current;
  const dir = useRef(1);
  const rtl = isRTL();
  const locale = getLocale();

  function go(n: number) {
    if (n < 0 || n >= SLIDES.length) return;
    haptic('selection');
    dir.current = n > i ? 1 : -1;
    v.setValue(0);
    setI(n);
    timeTo(v, 1, duration.slow, reduce, easing.decelerate).start();
    // filet de sécurité : si l'animation est ralentie (appareil chargé), le contenu s'affiche quand même
    setTimeout(() => v.setValue(1), duration.slow + 250);
  }
  const goRef = useRef(go);
  goRef.current = go;
  const pan = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 18 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
    onPanResponderRelease: (_, g) => {
      const forward = rtl ? g.dx > 50 : g.dx < -50;
      const backward = rtl ? g.dx < -50 : g.dx > 50;
      if (forward) goRef.current(iRef.current + 1);
      else if (backward) goRef.current(iRef.current - 1);
    },
  }), [rtl]);
  const iRef = useRef(i);
  iRef.current = i;

  function leave(to: '/' | '/auth/sign-up' | '/auth/sign-in' | 'demo') {
    setIntroSeen(true);
    if (to === 'demo') { void startDemoWithoutAccount().then(() => router.replace('/(tabs)')); return; }
    router.replace(to);
  }
  function chooseLanguage(code: string) {
    if (code === locale) return;
    haptic('selection');
    returnHereAfterLocaleChange('/intro?scene=start');
    setLocalePref(code);
  }

  const slide = SLIDES[i];
  const universe = UNIVERSES.find((u) => u.key === slide);
  const points = POINTS[slide];
  const shift = 28 * dir.current * (rtl ? -1 : 1);
  const enter = { opacity: v, transform: [{ translateX: v.interpolate({ inputRange: [0, 1], outputRange: [shift, 0] }) }] };
  const last = i === SLIDES.length - 1;
  const shortScreen = useWindowHeight() < 640;

  return (
    <View style={{ flex: 1 }}>
      {/* Fond : la scène de l'application reste visible (elle est derrière toutes les pages) ; simple voile de lecture */}
      <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} testID="intro-backdrop">
        <LinearGradient colors={[alpha(t.colors.background, 0.5), alpha(t.colors.background, 0.2), alpha(t.colors.background, 0.7)]}
          locations={[0, 0.45, 1]} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
      </View>
    <View style={{ flex: 1, paddingTop: topInset + spacing.sm, paddingBottom: insets.bottom + spacing.md, paddingHorizontal: spacing.lg }} {...pan.panHandlers}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 44 }}>
        <View accessibilityRole="progressbar" accessibilityLabel={tr('intro.progress', { step: i + 1, total: SLIDES.length })} style={{ flexDirection: 'row', gap: 5 }}>
          {SLIDES.map((s, k) => <View key={s} style={{ width: k === i ? 22 : 7, height: 7, borderRadius: 4, backgroundColor: k <= i ? t.colors.primary : t.colors.border }} />)}
        </View>
        {!last ? (
          <Tappable accessibilityRole="button" accessibilityLabel={tr('intro.skipA11y')} onPress={() => go(SLIDES.length - 1)} style={{ minHeight: 44, paddingHorizontal: spacing.sm, justifyContent: 'center' }}>
            <Text weight="bold" color={t.colors.primary}>{tr('intro.skip')}</Text>
          </Tappable>
        ) : <View style={{ minHeight: 44 }} />}
      </View>

      <Animated.View key={`${slide}-${locale}`} style={[{ flex: 1 }, enter]}>
        {/* Petit écran (320×568) : la diapositive défile au lieu de passer sous « Passer » et sous le bouton du bas */}
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', gap: spacing.md, paddingVertical: spacing.xs }} showsVerticalScrollIndicator={false}>
        {slide === 'welcome' ? (
          <View style={{ alignItems: 'center', gap: spacing.md }} testID="intro-scene-welcome">
            <LogoMark size={shortScreen ? 150 : 190} />
            <Appear kind="soft" delay={0.7}><Text center style={[editorial, { maxWidth: 340 }]}>{tr('intro.s.welcome.h')}</Text></Appear>
            <Appear kind="soft" delay={0.9}><Text center muted style={{ maxWidth: 340 }}>{tr('intro.mission')}</Text></Appear>
          </View>
        ) : null}

        {points ? (
          <View style={{ gap: spacing.sm }} testID={`intro-scene-${slide}`}>
            {/* écran court : l'illustration se resserre pour garder le texte et les boutons au premier écran */}
            <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={shortScreen ? { height: universe ? 170 : 140, justifyContent: 'center', transform: [{ scale: universe ? 0.68 : 0.8 }] } : undefined}>
              {slide === 'cycle' ? <CalendarArt /> : slide === 'pregnancy' ? <ProgressArt /> : slide === 'journal' ? <JournalArt /> : slide === 'together' ? <TogetherArt /> : universe ? <UniverseHero u={universe} /> : null}
            </View>
            <Appear kind="soft" delay={0.1}><Text variant="label" color={t.colors.gold}>{tr(`intro.s.${slide}.k` as TKey)}</Text></Appear>
            <Appear kind="mask" delay={0.2}><Text accessibilityRole="header" style={[editorial, { fontSize: 30, lineHeight: 36 }]}>{tr(`intro.s.${slide}.h` as TKey)}</Text></Appear>
            <View style={{ gap: 8, marginTop: spacing.xs }}>
              {points.keys.map((k, n) => (
                <StaggerItem key={k} index={n + 3}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                    <Icon name={points.icons[n]} size={18} color={t.colors.primary} />
                    <Text style={{ flex: 1 }}>{tr(k)}</Text>
                  </View>
                </StaggerItem>
              ))}
            </View>
          </View>
        ) : null}

        {slide === 'start' ? (
          <View style={{ alignItems: 'center', gap: shortScreen ? spacing.sm : spacing.md }} testID="intro-scene-start">
            <LogoMark size={shortScreen ? 76 : 132} />
            <Appear kind="mask" delay={0.35}><Text center accessibilityRole="header" style={[editorial, { fontSize: 30, lineHeight: 36 }]}>{tr('intro.s.start.h')}</Text></Appear>
            <Appear kind="soft" delay={0.5} style={{ alignSelf: 'stretch', gap: spacing.xs }}>
              <Text weight="bold" center>{tr('intro.languageQ')}</Text>
              <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.xs }}>
                {availableLocales().map((l) => {
                  const on = l.code === locale;
                  return (
                    <Tappable key={l.code} accessibilityRole="radio" accessibilityState={{ checked: on }} aria-checked={on} accessibilityLabel={l.native} onPress={() => chooseLanguage(l.code)}
                      style={({ pressed }) => ({ minHeight: 48, minWidth: 104, paddingHorizontal: spacing.md, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6,
                        backgroundColor: on ? t.colors.primary : t.colors.surface, borderWidth: 1, borderColor: on ? t.colors.primary : t.colors.border, opacity: pressed ? 0.85 : 1 })}>
                      {on ? <Icon name="check" size={16} color={t.colors.primaryText} /> : null}
                      <Text weight="bold" color={on ? t.colors.primaryText : t.colors.text}>{l.native}</Text>
                    </Tappable>
                  );
                })}
              </View>
            </Appear>
            <Appear kind="soft" delay={0.65}><Text variant="caption" muted center style={{ maxWidth: 340 }}>{tr('intro.privacy.body')}</Text></Appear>
          </View>
        ) : null}
        </ScrollView>
      </Animated.View>

      {last ? (
        <View style={{ gap: spacing.xs }}>
          <Button label={tr('intro.privacy.create')} size="lg" icon="arrow-right" full onPress={() => leave('/auth/sign-up')} />
          <Button label={tr('intro.privacy.signIn')} variant="ghost" full onPress={() => leave('/auth/sign-in')} />
          <Button label={tr('intro.privacy.demo')} variant="ghost" icon="eye" full onPress={() => leave('demo')} />
        </View>
      ) : (
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          {/* largeur du texte, jamais réduite : « Zurück » se coupait en deux lignes à 320 px */}
          {i > 0 ? <Button label={tr('common.back')} variant="secondary" onPress={() => go(i - 1)} style={{ flexGrow: 0, flexShrink: 0 }} /> : null}
          <Button label={i === 0 ? tr('intro.start') : tr('intro.next')} icon={rtl ? 'arrow-left' : 'arrow-right'} onPress={() => go(i + 1)} style={{ flex: 1 }} />
        </View>
      )}
    </View>
    </View>
  );
}
