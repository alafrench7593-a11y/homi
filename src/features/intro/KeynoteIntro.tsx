/**
 * Présentation de première ouverture façon Keynote (24/11/2026, demande de la propriétaire) : HOMI en 7 tableaux —
 * positionnement, grossesse et parentalité, suivi de l'enfant, organisation, communauté, Aura, personnalisation — puis
 * « Commencer ». Chaque tableau : un numéro, un GRAND titre, une phrase, une vraie scène de l'application (exemple).
 *
 * Même moteur que l'introduction « Je suis… » (src/features/intro/IntroFlow.tsx) : UNE valeur partagée `pos` pilote le
 * glissement, le fondu, la parallaxe (`Layer`) et la progression qui suit le doigt ; balayage au doigt avec ressort ;
 * « Passer » à tout moment ; Précédent / Suivant ; Réduire les animations : pages posées, aucune parallaxe.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo, ScrollView, View, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, ReduceMotion } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { scheduleOnRN } from 'react-native-worklets';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BrandWordmark } from '@/components/BrandLogo';
import { useTopInset } from '@/components/demoInset';
import { Tappable } from '@/components/Tappable';
import { Button, haptic, Icon, Text } from '@/components/ui';
import { AuraBot } from '@/features/aura/AuraBot';
import { isRTL, t as tr, type TKey } from '@/i18n';
import { ExampleBadge } from '@/features/onboarding/kit';
import { NO_HYPHENS } from '@/features/firstWin/kit';
import { useMotion } from '@/motion';
import { useTheme } from '@/theme/ThemeProvider';
import { glassEdge } from '@/components/glass/GlassRim';
import { MIN_TOUCH, radius, spacing, typography } from '@/theme/tokens';
import { Layer, SceneView } from './IntroScenes';
import { EndPage, Page } from './IntroFlow';
import { clampPage, KEYNOTE_LAST, KEYNOTE_PAGES, KEYNOTE_SLIDES, swipeTarget, type IntroScene, type KeynoteSlide } from './model';

const SPRING = { damping: 30, stiffness: 280, mass: 1 } as const;
/** Progression : une barre par tableau, celle du tableau vu se remplit (elle suit le doigt). */
const BAR = 22;
const GAP = 4;

/** Scène réelle de chaque tableau (les autres tableaux ont leur propre petite scène, ci-dessous). */
const SCENE: Partial<Record<KeynoteSlide, IntroScene>> = { parenting: 'pregTools', child: 'feedTimer', organize: 'split', yours: 'categories' };

export interface KeynoteIntroProps {
  initialPage?: number;
  onLeave: (to: 'start' | 'sign-in' | 'demo') => void;
  onLanguage: (code: string) => void;
  demoBusy?: boolean;
}

export function KeynoteIntro({ initialPage = 0, onLeave, onLanguage, demoBusy }: KeynoteIntroProps) {
  const t = useTheme();
  const m = useMotion();
  const insets = useSafeAreaInsets();
  const top = useTopInset();
  const win = useWindowDimensions();
  const rtl = isRTL();
  const dir = rtl ? -1 : 1;
  const short = win.height < 640;
  const [page, setPage] = useState(() => clampPage(initialPage, KEYNOTE_LAST));
  const [width, setWidth] = useState(win.width);
  const pos = useSharedValue(m.off ? page : page - 0.3);
  useEffect(() => { pos.value = m.off ? page : withSpring(page, { ...SPRING, reduceMotion: ReduceMotion.Never }); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const settle = useCallback((n: number) => { setPage((cur) => (cur === n ? cur : n)); }, []);
  const go = useCallback((n: number) => {
    const next = clampPage(n, KEYNOTE_LAST);
    haptic('selection');
    if (!m.off && Math.abs(next - page) > 1) pos.value = next - 0.35 * Math.sign(next - page);
    pos.value = m.off ? next : withSpring(next, { ...SPRING, reduceMotion: ReduceMotion.Never });
    settle(next);
  }, [m.off, pos, settle, page]);

  const slide = KEYNOTE_SLIDES[page];
  const title = slide ? tr(`kn2.${slide}.title` as TKey) : tr('intro6.end.title');
  useEffect(() => { AccessibilityInfo.announceForAccessibility?.(title); }, [title]);

  const off = m.off;
  const start = useSharedValue(0);
  const pan = useMemo(() => Gesture.Pan()
    .activeOffsetX([-14, 14])
    .failOffsetY([-12, 12])
    .onBegin(() => { start.value = pos.value; })
    .onUpdate((e) => {
      if (off) return;
      const raw = start.value - (e.translationX * dir) / Math.max(1, width);
      pos.value = raw < 0 ? raw * 0.25 : raw > KEYNOTE_LAST ? KEYNOTE_LAST + (raw - KEYNOTE_LAST) * 0.25 : raw;
    })
    .onEnd((e) => {
      const from = Math.round(start.value);
      const target = swipeTarget({ page: from, dx: e.translationX, vx: e.velocityX, width, rtl, hasProfile: true, last: KEYNOTE_LAST });
      pos.value = off ? target : withSpring(target, { ...SPRING, velocity: (-e.velocityX * dir) / Math.max(1, width), reduceMotion: ReduceMotion.Never });
      scheduleOnRN(settle, target);
    }), [off, dir, width, rtl, pos, start, settle]);

  const footer = (
    <View style={{ paddingHorizontal: spacing.lg, paddingBottom: insets.bottom + spacing.sm, paddingTop: spacing.xs, gap: spacing.xs }}>
      {page === KEYNOTE_LAST ? (
        <>
          <Button label={tr('welcome.start')} size="lg" full iconRight={rtl ? 'arrow-left' : 'arrow-right'} onPress={() => onLeave('start')} testID="intro-start" />
          <Button label={tr('e5.welcome.haveAccount')} variant="secondary" full onPress={() => onLeave('sign-in')} testID="intro-sign-in" />
          <Button label={tr('welcome.demo')} variant="ghost" full loading={demoBusy} onPress={() => onLeave('demo')} testID="intro-demo" />
        </>
      ) : (
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          {page > 0 ? <Button label="" accessibilityLabel={tr('common.back')} icon={rtl ? 'arrow-right' : 'arrow-left'} variant="secondary" onPress={() => go(page - 1)} style={{ width: 56, flexGrow: 0, flexShrink: 0 }} testID="intro-prev" /> : null}
          <Button label={page === 0 ? tr('kn2.discover') : tr('common.next')} size="lg" iconRight={rtl ? 'arrow-left' : 'arrow-right'} onPress={() => go(page + 1)} style={{ flex: 1 }} testID="intro-next" />
        </View>
      )}
    </View>
  );

  const pages = Array.from({ length: KEYNOTE_PAGES }, (_, i) => i).filter((i) => Math.abs(i - page) <= 1);
  return (
    <View style={{ flex: 1 }} testID="intro">
      <View style={{ paddingTop: top + spacing.xs, paddingHorizontal: spacing.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: MIN_TOUCH + top }}>
        <Progress pos={pos} page={page} rtl={rtl} />
        {page < KEYNOTE_LAST ? (
          <Tappable accessibilityRole="button" accessibilityLabel={tr('intro.skipA11y')} onPress={() => go(KEYNOTE_LAST)} testID="intro-skip"
            style={{ minHeight: MIN_TOUCH, minWidth: MIN_TOUCH, paddingHorizontal: spacing.xs, alignItems: 'center', justifyContent: 'center' }}>
            <Text weight="bold" color={t.colors.text}>{tr('intro.skip')}</Text>
          </Tappable>
        ) : <View style={{ minHeight: MIN_TOUCH }} />}
      </View>
      <GestureDetector gesture={pan}>
        <View style={{ flex: 1, overflow: 'hidden' }} collapsable={false} onLayout={(e) => { const w = Math.round(e.nativeEvent.layout.width); if (w > 0 && w !== width) setWidth(w); }} testID="intro-stage">
          {pages.map((i) => (
            <Page key={i} index={i} width={width} dir={dir} off={m.off} pos={pos}>
              {i === KEYNOTE_LAST ? <EndPage onLanguage={onLanguage} short={short} /> : <SlidePage slide={KEYNOTE_SLIDES[i]} n={i} active={i === page} short={short} />}
            </Page>
          ))}
        </View>
      </GestureDetector>
      {footer}
    </View>
  );
}

/** Barres de progression : celle du tableau vu se remplit en suivant `pos` (et donc le doigt). */
function Progress({ pos, page, rtl }: { pos: ReturnType<typeof useSharedValue<number>>; page: number; rtl: boolean }) {
  const t = useTheme();
  return (
    <View accessible accessibilityRole="progressbar" accessibilityLabel={tr('intro.progress', { step: page + 1, total: KEYNOTE_PAGES })}
      accessibilityValue={{ min: 1, max: KEYNOTE_PAGES, now: page + 1 }} testID="intro-progress" style={{ flexDirection: rtl ? 'row-reverse' : 'row', gap: GAP }}>
      {Array.from({ length: KEYNOTE_PAGES }, (_, i) => <Bar key={i} i={i} pos={pos} track={t.material.lines.track} fill={t.colors.text} />)}
    </View>
  );
}
function Bar({ i, pos, track, fill }: { i: number; pos: ReturnType<typeof useSharedValue<number>>; track: string; fill: string }) {
  const a = useAnimatedStyle(() => ({ width: Math.max(0, Math.min(1, pos.value - i + 1)) * BAR }));
  return (
    <View style={{ width: BAR, height: 4, borderRadius: 2, backgroundColor: track, overflow: 'hidden' }}>
      <Animated.View style={[{ height: 4, borderRadius: 2, backgroundColor: fill }, a]} />
    </View>
  );
}

/** Un tableau : numéro, grand titre, phrase, scène. */
function SlidePage({ slide, n, active, short }: { slide: KeynoteSlide; n: number; active: boolean; short: boolean }) {
  const t = useTheme();
  const narrow = useWindowDimensions().width < 360;
  const big = short || narrow ? 30 : 38;
  const scene = SCENE[slide];
  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, gap: short ? spacing.sm : spacing.md }}
      showsVerticalScrollIndicator={false} testID={`intro-slide-${slide}`}>
      {slide === 'brand' ? <Layer depth={0}><BrandWordmark height={short ? 30 : 40} testID="intro-brand" /></Layer> : (
        <Layer depth={0}><Text variant="label" muted testID="intro-eyebrow">{tr('kn2.eyebrow', { n, total: KEYNOTE_SLIDES.length - 1 })}</Text></Layer>
      )}
      <Layer depth={0.4}>
        <Text accessibilityRole="header" style={[typography.display, { fontSize: big, lineHeight: big + 6, letterSpacing: -1, color: t.colors.text }, NO_HYPHENS]} testID="intro-title">{tr(`kn2.${slide}.title` as TKey)}</Text>
        <Text muted style={[{ marginTop: spacing.xs, fontSize: 17, lineHeight: 24 }, NO_HYPHENS]}>{tr(`kn2.${slide}.body` as TKey)}</Text>
      </Layer>
      {slide === 'brand' ? null : <Layer depth={0.7}><ExampleBadge label={tr('o2.example')} /></Layer>}
      <View pointerEvents="none">
        {scene ? <SceneView scene={scene} active={active} />
          : slide === 'relay' ? <RelayScene />
          : slide === 'community' ? <CommunityScene />
            : slide === 'aura' ? <AuraScene />
              : <BrandScene />}
      </View>
    </ScrollView>
  );
}

/** Petite carte de verre (scènes propres à la présentation). */
function GlassCard({ children, depth }: { children: React.ReactNode; depth: number }) {
  const t = useTheme();
  return (
    <Layer depth={depth}>
      <View style={{ ...glassEdge(t), backgroundColor: t.colors.surface, borderRadius: radius.lg, padding: spacing.md, gap: 6 }}>{children}</View>
    </Layer>
  );
}

function BrandScene() {
  return (
    <View style={{ gap: spacing.sm }}>
      {(['pregnancy', 'baby', 'family'] as const).map((k, i) => (
        <GlassCard key={k} depth={1 + i * 0.4}>
          <Text weight="bold">{tr(`kn2.brand.c.${k}` as TKey)}</Text>
          <Text variant="small" muted>{tr(`kn2.brand.c.${k}.d` as TKey)}</Text>
        </GlassCard>
      ))}
    </View>
  );
}

/** Relais entre parents : résumé envoyé à l'autre parent (dernier biberon, sieste, suite). */
function RelayScene() {
  const t = useTheme();
  const row = (k: 1 | 2 | 3) => (
    <View key={k} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm }}>
      <Text variant="small" muted>{tr(`kn2.relay.l${k}` as TKey)}</Text>
      <Text variant="small" weight="bold" style={{ flexShrink: 1, textAlign: 'right' }}>{tr(`kn2.relay.v${k}` as TKey)}</Text>
    </View>
  );
  return (
    <View style={{ gap: spacing.sm }}>
      <GlassCard depth={1}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Icon name="repeat" size={16} color={t.colors.text} />
          <Text weight="bold" style={{ flex: 1 }}>{tr('kn2.relay.head')}</Text>
        </View>
        {row(1)}{row(2)}{row(3)}
      </GlassCard>
      <Layer depth={1.6}>
        <View style={{ alignSelf: 'flex-end', flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: t.colors.text, borderRadius: 999, paddingVertical: 6, paddingHorizontal: spacing.md }}>
          <Icon name="check" size={14} color={t.colors.background} />
          <Text variant="caption" weight="bold" color={t.colors.background}>{tr('kn2.relay.sent')}</Text>
        </View>
      </Layer>
    </View>
  );
}

function CommunityScene() {
  const t = useTheme();
  return (
    <View style={{ gap: spacing.sm }}>
      <GlassCard depth={1}>
        <Text variant="caption" muted>{tr('kn2.community.q.who')}</Text>
        <Text weight="bold">{tr('kn2.community.q')}</Text>
      </GlassCard>
      <GlassCard depth={1.5}>
        <Text variant="caption" muted>{tr('kn2.community.a.who')}</Text>
        <Text>{tr('kn2.community.a')}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Icon name="heart" size={14} color={t.colors.textMuted} /><Text variant="caption" muted>12</Text>
        </View>
      </GlassCard>
    </View>
  );
}

function AuraScene() {
  const t = useTheme();
  return (
    <View style={{ gap: spacing.sm }}>
      <Layer depth={1}>
        <View style={{ alignSelf: 'flex-end', maxWidth: '85%', backgroundColor: t.colors.text, borderRadius: radius.lg, borderBottomRightRadius: 6, paddingVertical: spacing.sm, paddingHorizontal: spacing.md }}>
          <Text color={t.colors.background}>{tr('kn2.aura.ask')}</Text>
        </View>
      </Layer>
      <GlassCard depth={1.5}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
          <AuraBot size={28} />
          <Text variant="caption" weight="bold" muted>{tr('kn2.aura.confirm')}</Text>
        </View>
        <Text style={[typography.display, { fontSize: 30, lineHeight: 34, color: t.colors.text }]}>1 h 10</Text>
        <Text variant="small" muted>{tr('kn2.aura.detail')}</Text>
      </GlassCard>
    </View>
  );
}
