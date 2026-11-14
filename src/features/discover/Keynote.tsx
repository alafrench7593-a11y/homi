/**
 * « Découvrir HOMI » — présentation façon keynote : ouverture (la maison HOMI s'illumine → s'ouvre en premier panneau de verre → scènes),
 * huit chapitres (cycle, grossesse, bébé, enfant, santé, organisation familiale, communauté, autres espaces) avec
 * des démos concrètes, puis la fin « La vie de famille, dès les premiers battements. ».
 *
 * Mouvement : la « caméra » (avancée en profondeur + glissement latéral, 450 ms `decelerate`) est réservée à
 * l'ouverture et aux changements de chapitre. Geste horizontal (gesture-handler) qui suit le doigt et reste
 * interruptible ; « Précédent », « Suivant », « Passer » et « Voir tous les outils » toujours disponibles.
 * Réduire les animations : changements directs, ouverture affichée dans son état final ; nuit : fondus seuls.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, ScrollView, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { scheduleOnRN } from 'react-native-worklets';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTopInset } from '@/components/demoInset';
import { BrandLogo } from '@/components/BrandLogo';
import { Button, Chip, Icon, Text } from '@/components/ui';
import { isRTL, t as tr } from '@/i18n';
import { motionSpring, useMotion } from '@/motion';
import { useTheme } from '@/theme/ThemeProvider';
import { alpha, MIN_TOUCH, spacing } from '@/theme/tokens';
import { clampStep, KEYNOTE_STEPS, LAST_STEP, swipeStep } from './flow';
import { CHAPTERS, DISCOVER_BY_KEY, DISCOVER_TOOLS, toolsOfChapter, type ChapterKey } from './model';
import { OpeningScene, type DiscoverLogo } from './opening';
import { ToolDemo } from './ToolDemo';
import { chapterExample, chapterLead, chapterTitle, toolName } from './texts';

/** Caméra entre deux étapes (ms, testé). */
export const CAMERA = { ms: 450, shift: 70, depth: 0.06 } as const;

function ChapterSlide({ chapter, onOpenTool }: { chapter: ChapterKey; onOpenTool: (key: string) => void }) {
  const t = useTheme();
  const def = CHAPTERS.find((c) => c.key === chapter)!;
  const [pick, setPick] = useState(def.featured[0]);
  const [token, setToken] = useState(0);
  const tools = toolsOfChapter(chapter);
  const tool = DISCOVER_BY_KEY[pick];
  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, gap: spacing.md }} testID={`discover-chapter-${chapter}`}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <View style={{ width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: alpha(t.tokens.accent.glow[0], t.isDark ? 0.18 : 0.16) }}>
          <Icon name={def.icon} size={22} color={t.tokens.accent.glow[0]} />
        </View>
        <Text variant="title" accessibilityRole="header" style={{ flex: 1 }}>{chapterTitle(chapter)}</Text>
      </View>
      <Text muted>{chapterLead(chapter)}</Text>
      <View style={{ borderLeftWidth: 3, borderLeftColor: t.tokens.accent.glow[0], paddingLeft: spacing.sm }}>
        <Text italic>{chapterExample(chapter)}</Text>
      </View>
      <Text variant="label" muted>{tr('kn.ch.try')}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
        {def.featured.map((k) => (
          <Chip key={k} label={toolName(k)} selected={k === pick} onPress={() => { setPick(k); setToken((n) => n + 1); }} accessibilityLabel={tr('kn.ch.pick', { tool: toolName(k) })} testID={`discover-featured-${k}`} />
        ))}
      </View>
      <ToolDemo key={pick} tool={tool} token={token} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
        <Button label={tr('kn.demo.replay')} accessibilityLabel={tr('kn.demo.replayA11y', { tool: toolName(pick) })} icon="rotate-ccw" variant="secondary" size="sm" onPress={() => setToken((n) => n + 1)} testID="discover-chapter-replay" />
        <Button label={toolName(pick)} iconRight="chevron-right" variant="ghost" size="sm" onPress={() => onOpenTool(pick)} />
      </View>
      <Text variant="label" muted>{tr('kn.ch.tools', { count: tools.length })}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
        {tools.map((x) => <Chip key={x.key} label={toolName(x.key)} icon={x.icon} onPress={() => onOpenTool(x.key)} testID={`discover-chip-${x.key}`} />)}
      </View>
    </ScrollView>
  );
}

function EndSlide({ onStart, onCatalog, onRestart }: { onStart: () => void; onCatalog: () => void; onRestart: () => void }) {
  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg, gap: spacing.md }} testID="discover-end">
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants"><BrandLogo size={72} /></View>
      <Text variant="title" center accessibilityRole="header" style={{ maxWidth: 360 }}>{tr('kn.end.line')}</Text>
      <Text muted center>{tr('kn.end.sub', { count: DISCOVER_TOOLS.length })}</Text>
      <View style={{ alignSelf: 'stretch', gap: spacing.sm, marginTop: spacing.md, maxWidth: 420, width: '100%', alignItems: 'stretch' }}>
        <Button label={tr('kn.start')} icon="arrow-right" onPress={onStart} full testID="discover-end-start" />
        <Button label={tr('kn.allTools')} icon="grid" variant="secondary" onPress={onCatalog} full testID="discover-end-catalog" />
        <Button label={tr('kn.restart')} icon="rotate-ccw" variant="ghost" onPress={onRestart} full testID="discover-restart" />
      </View>
    </ScrollView>
  );
}

export function DiscoverKeynote({ onExit, onCatalog, onOpenTool, logo, initialStep = 0 }: {
  onExit: () => void;
  onCatalog: () => void;
  onOpenTool: (key: string) => void;
  /** Logotype animé définitif (sinon celui injecté par `setDiscoverOpening`, sinon l'ouverture provisoire). */
  logo?: DiscoverLogo | null;
  initialStep?: number;
}) {
  const t = useTheme();
  const m = useMotion();
  const insets = useSafeAreaInsets();
  const top = useTopInset();
  const rtl = isRTL();
  const [step, setStep] = useState(() => clampStep(initialStep));
  const [openings, setOpenings] = useState(0);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const enter = useSharedValue(0);
  const drag = useSharedValue(0);
  const stepRef = useRef(step);
  stepRef.current = step;

  const go = useCallback((n: number) => {
    const next = clampStep(n);
    const cur = stepRef.current;
    if (next === cur) return;
    stepRef.current = next;
    // caméra : la nouvelle étape arrive du côté du mouvement, depuis un peu plus loin (interruptible)
    enter.value = next > cur ? 1 : -1;
    enter.value = m.timing(0, CAMERA.ms, 'decelerate');
    if (next === 0) setOpenings((x) => x + 1);
    setStep(next);
  }, [enter, m]);

  const s = KEYNOTE_STEPS[step];
  useEffect(() => {
    const title = s.kind === 'chapter' ? chapterTitle(s.chapter) : s.kind === 'end' ? tr('kn.end.line') : tr('kn.title');
    AccessibilityInfo.announceForAccessibility?.(title);
  }, [s]);

  const level = m.level;
  const pan = Gesture.Pan()
    .activeOffsetX([-24, 24])
    .failOffsetY([-14, 14])
    .onUpdate((e) => { drag.value = e.translationX * (level === 'full' ? 0.35 : 0); })
    .onEnd((e) => {
      drag.value = motionSpring(level, 0, 'doux');
      scheduleOnRN(goFromSwipe, e.translationX, e.velocityX);
    });
  function goFromSwipe(dx: number, vx: number) { go(swipeStep(stepRef.current, dx, vx, rtl)); }

  const camera = useAnimatedStyle(() => {
    const k = enter.value;
    const a = Math.abs(k);
    const move = level === 'full' ? 1 : 0;
    return {
      opacity: 1 - 0.9 * a,
      transform: [{ translateX: (k * CAMERA.shift * (rtl ? -1 : 1) + drag.value) * move }, { scale: 1 + CAMERA.depth * a * move }],
    };
  });

  const first = step === 0;
  const last = step === LAST_STEP;
  return (
    <View style={{ flex: 1, paddingTop: top + spacing.xs }} testID="discover-keynote" accessibilityLabel={tr('kn.a11y.stage')}>
      {/* haut : catalogue et « Passer » toujours disponibles */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.sm, minHeight: MIN_TOUCH }}>
        <Button label={tr('kn.allTools')} icon="grid" variant="ghost" size="sm" onPress={onCatalog} testID="discover-catalog" />
        <Button label={tr('kn.skip')} accessibilityLabel={tr('kn.skipA11y')} iconRight="chevron-right" variant="ghost" size="sm" onPress={onExit} testID="discover-skip" />
      </View>
      {/* progression */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, paddingVertical: spacing.xs }} accessible accessibilityRole="progressbar"
        accessibilityLabel={tr('kn.progress', { n: step + 1, total: KEYNOTE_STEPS.length })} accessibilityValue={{ min: 1, max: KEYNOTE_STEPS.length, now: step + 1 }} testID="discover-progress">
        {KEYNOTE_STEPS.map((_, i) => (
          <View key={i} style={{ width: i === step ? 18 : 6, height: 6, borderRadius: 3, backgroundColor: i === step ? t.tokens.accent.glow[0] : alpha(t.colors.text, 0.22) }} />
        ))}
      </View>
      <GestureDetector gesture={pan}>
        <View testID="discover-stage" style={{ flex: 1, overflow: 'hidden' }} onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })} collapsable={false}>
          <Animated.View key={step} style={[{ flex: 1 }, camera]} testID={`discover-step-${step}`}>
            {s.kind === 'opening' ? (box.h > 0 ? <OpeningScene token={openings} width={box.w} height={box.h} logo={logo} /> : null)
              : s.kind === 'chapter' ? <ChapterSlide chapter={s.chapter} onOpenTool={onOpenTool} />
              : <EndSlide onStart={onExit} onCatalog={onCatalog} onRestart={() => go(0)} />}
          </Animated.View>
        </View>
      </GestureDetector>
      {/* bas : Précédent / Suivant (ou Commencer), à portée de pouce */}
      <View style={{ flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: insets.bottom + spacing.sm }}>
        <Button label={tr('kn.prev')} icon="chevron-left" variant="secondary" disabled={first} onPress={() => go(step - 1)} style={{ flex: 1 }} testID="discover-prev" />
        {last
          ? <Button label={tr('kn.start')} iconRight="arrow-right" onPress={onExit} style={{ flex: 1 }} testID="discover-start" />
          : <Button label={tr('kn.next')} iconRight="chevron-right" onPress={() => go(step + 1)} style={{ flex: 1 }} testID="discover-next" />}
      </View>
    </View>
  );
}
