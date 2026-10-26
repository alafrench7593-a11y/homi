/**
 * Introduction immersive (première ouverture, rejouable depuis Réglages › Mon accueil).
 *  1. Logo animé, accueil et choix de la langue (proposée d'après le téléphone, jamais imposée) ;
 *  2. six univers — cycle, grossesse, enfant, santé, outils, communauté — chacun avec sa propre
 *     composition animée (silhouettes des outils), et uniquement des fonctions réellement disponibles ;
 *  3. vie privée, puis création du compte, connexion ou démonstration.
 * « Passer » est toujours visible ; balayage horizontal (sens inversé en droite-à-gauche) ; avec
 * « réduire les animations », tout s'affiche directement.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, PanResponder, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Appear } from '@/components/Appear';
import { GlassSurface } from '@/components/Glass';
import { StaggerItem } from '@/components/Motion';
import { tint, ToolGlyph } from '@/components/ToolGlyph';
import { Button, haptic, Icon, type IconName, Text } from '@/components/ui';
import { BRAND } from '@/config/brand';
import { getLocale, isRTL, t as tr, type TKey } from '@/i18n';
import { returnHereAfterLocaleChange } from '@/i18n/I18nProvider';
import { availableLocales } from '@/i18n/locales';
import { startDemoWithoutAccount } from '@/lib/demoMode';
import type { ToolTheme } from '@/lib/domain/toolCatalog';
import { useUiStore } from '@/lib/store';
import { duration, easing, timeTo } from '@/theme/motion';
import { useReduceMotion, useTheme } from '@/theme/ThemeProvider';
import { NACRE, NATIVE_DRIVER, radius, spacing } from '@/theme/tokens';
import { Tappable } from '@/components/Tappable';
import { BrandLogo } from '@/components/BrandLogo';

type Universe = 'cycle' | 'pregnancy' | 'child' | 'health' | 'tools' | 'community';
const UNIVERSES: { key: Universe; hero: ToolTheme; heroIcon: IconName; sats: [ToolTheme, IconName][]; icons: IconName[] }[] = [
  { key: 'cycle', hero: 'cycle', heroIcon: 'droplet', sats: [['calendar', 'calendar'], ['mood', 'smile'], ['reminders', 'bell']], icons: ['calendar', 'edit-3', 'sunrise'] },
  { key: 'pregnancy', hero: 'pregnancy', heroIcon: 'heart', sats: [['health', 'clipboard'], ['memories', 'star'], ['tasks', 'check-square']], icons: ['moon', 'calendar', 'briefcase'] },
  { key: 'child', hero: 'growth', heroIcon: 'trending-up', sats: [['feeding', 'coffee'], ['sleep', 'moon'], ['teeth', 'circle']], icons: ['activity', 'bar-chart-2', 'star'] },
  { key: 'health', hero: 'health', heroIcon: 'activity', sats: [['scanner', 'maximize'], ['mood', 'sun'], ['reminders', 'shield']], icons: ['thermometer', 'maximize', 'heart'] },
  { key: 'tools', hero: 'calendar', heroIcon: 'calendar', sats: [['tasks', 'check-square'], ['relay', 'moon'], ['metime', 'sun']], icons: ['calendar', 'repeat', 'bell'] },
  { key: 'community', hero: 'resources', heroIcon: 'users', sats: [['mood', 'message-circle'], ['memories', 'book-open'], ['prevention', 'feather']], icons: ['users', 'shield', 'message-circle'] },
];
type Slide = 'hello' | Universe | 'privacy';
const SLIDES: Slide[] = ['hello', ...UNIVERSES.map((u) => u.key), 'privacy'];

/** Logo animé : la tuile « Au fil de nous » pivote et se pose, une lumière respire derrière (pas en boucle si animations réduites). */
function AnimatedMark({ size = 84 }: { size?: number }) {
  const reduce = useReduceMotion();
  const enter = useRef(new Animated.Value(reduce ? 1 : 0)).current;
  const glow = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduce) return;
    Animated.spring(enter, { toValue: 1, tension: 60, friction: 9, useNativeDriver: NATIVE_DRIVER }).start();
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(glow, { toValue: 1, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE_DRIVER }),
      Animated.timing(glow, { toValue: 0, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE_DRIVER }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [enter, glow, reduce]);
  const box = size * 1.9;
  return (
    <View style={{ width: box, height: box, alignItems: 'center', justifyContent: 'center' }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Animated.View style={{ position: 'absolute', width: box, height: box, borderRadius: box / 2, opacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.65] }), transform: [{ scale: glow.interpolate({ inputRange: [0, 1], outputRange: [0.88, 1.06] }) }] }}>
        <LinearGradient colors={NACRE} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, borderRadius: box / 2, opacity: 0.42 }} />
      </Animated.View>
      <Animated.View style={{ opacity: enter, transform: [{ scale: enter.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] }) }, { rotate: enter.interpolate({ inputRange: [0, 1], outputRange: ['-24deg', '0deg'] }) }] }}>
        <BrandLogo size={size} />
      </Animated.View>
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

export default function Intro() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const reduce = useReduceMotion();
  const setIntroSeen = useUiStore((s) => s.setIntroSeen);
  const setLocalePref = useUiStore((s) => s.setLocalePref);
  const [i, setI] = useState(0);
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
    returnHereAfterLocaleChange('/intro');
    setLocalePref(code);
  }

  const slide = SLIDES[i];
  const universe = UNIVERSES.find((u) => u.key === slide);
  const shift = 28 * dir.current * (rtl ? -1 : 1);
  const enter = { opacity: v, transform: [{ translateX: v.interpolate({ inputRange: [0, 1], outputRange: [shift, 0] }) }] };
  const last = i === SLIDES.length - 1;

  return (
    <View style={{ flex: 1, paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + spacing.md, paddingHorizontal: spacing.lg }} {...pan.panHandlers}>
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

      <Animated.View key={`${slide}-${locale}`} style={[{ flex: 1, justifyContent: 'center', gap: spacing.md }, enter]}>
        {slide === 'hello' ? (
          <View style={{ alignItems: 'center', gap: spacing.md }}>
            <AnimatedMark size={112} />
            <Appear kind="mask" delay={0.45}><Text variant="title" center accessibilityRole="header">{BRAND.name}</Text></Appear>
            <Appear kind="soft" delay={0.65}><Text center muted style={{ maxWidth: 340 }}>{tr('intro.mission')}</Text></Appear>
            <Appear kind="soft" delay={0.85} style={{ alignSelf: 'stretch', gap: spacing.xs, marginTop: spacing.sm }}>
              <Text weight="bold" center>{tr('intro.languageQ')}</Text>
              <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.xs }}>
                {availableLocales().map((l) => {
                  const on = l.code === locale;
                  return (
                    <Tappable key={l.code} accessibilityRole="radio" accessibilityState={{ checked: on }} aria-checked={on} accessibilityLabel={l.native} onPress={() => chooseLanguage(l.code)}
                      style={({ pressed }) => ({ minHeight: 48, minWidth: 120, paddingHorizontal: spacing.md, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6,
                        backgroundColor: on ? t.colors.primary : t.colors.surface, borderWidth: 1, borderColor: on ? t.colors.primary : t.colors.border, opacity: pressed ? 0.85 : 1 })}>
                      {on ? <Icon name="check" size={16} color={t.colors.primaryText} /> : null}
                      <Text weight="bold" color={on ? t.colors.primaryText : t.colors.text}>{l.native}</Text>
                    </Tappable>
                  );
                })}
              </View>
              <Text variant="caption" muted center>{tr('intro.languageHint')}</Text>
            </Appear>
          </View>
        ) : null}

        {universe ? (
          <View style={{ gap: spacing.sm }}>
            <UniverseHero u={universe} />
            <Appear kind="mask" delay={0.15}><Text variant="title" accessibilityRole="header">{tr(`intro.${universe.key}.title` as TKey)}</Text></Appear>
            <Appear kind="soft" delay={0.3}><Text muted>{tr(`intro.${universe.key}.body` as TKey)}</Text></Appear>
            <View style={{ gap: 6, marginTop: spacing.xs }}>
              {[1, 2, 3].map((n, k) => (
                <StaggerItem key={n} index={k + 2}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                    <Icon name={universe.icons[k]} size={18} color={t.colors.primary} />
                    <Text style={{ flex: 1 }}>{tr(`intro.${universe.key}.p${n}` as TKey)}</Text>
                  </View>
                </StaggerItem>
              ))}
            </View>
          </View>
        ) : null}

        {slide === 'privacy' ? (
          <View style={{ gap: spacing.md }}>
            <View style={{ alignItems: 'center' }}><ToolGlyph theme="health" icon="lock" size={110} play={1} /></View>
            <Appear kind="mask" delay={0.1}><Text variant="title" accessibilityRole="header">{tr('intro.privacy.title')}</Text></Appear>
            <Appear kind="soft" delay={0.25}>
              <GlassSurface fill={t.colors.surface} depth={2} padded={spacing.md}><Text>{tr('intro.privacy.body')}</Text></GlassSurface>
            </Appear>
            <Appear kind="soft" delay={0.4}><Text variant="small" muted>{tr('intro.privacy.next')}</Text></Appear>
          </View>
        ) : null}
      </Animated.View>

      {last ? (
        <View style={{ gap: spacing.xs }}>
          <Button label={tr('intro.privacy.create')} icon="arrow-right" full onPress={() => leave('/auth/sign-up')} />
          <Button label={tr('intro.privacy.signIn')} variant="secondary" full onPress={() => leave('/auth/sign-in')} />
          <Button label={tr('intro.privacy.demo')} variant="ghost" icon="eye" full onPress={() => leave('demo')} />
        </View>
      ) : (
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          {i > 0 ? <Button label={tr('common.back')} variant="secondary" onPress={() => go(i - 1)} style={{ flex: 1 }} /> : null}
          <Button label={i === 0 ? tr('intro.start') : tr('intro.next')} icon={rtl ? 'arrow-left' : 'arrow-right'} onPress={() => go(i + 1)} style={{ flex: 2 }} />
        </View>
      )}
    </View>
  );
}
