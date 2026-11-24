/**
 * Paywall « histoire » (24/11/2026, variante B du test `paywall_story_v1`) : trois slides SANS PRIX avant les offres.
 *   1. Transformation : avant / avec HOMI (titre selon le besoin choisi) — jamais de promesse de résultat ;
 *   2. Confiance : note du programme de test (source validée : `TESTER_PROOF`), étoiles et compteur animés ;
 *   3. Histoire des fondateurs : texte VALIDÉ (`FOUNDER_STORY`), juste avant les prix.
 * Les boutons font seulement avancer ; aucun achat ici. La croix reste visible dès la première slide.
 * Slide masquée si sa source est désactivée (`enabled: false`). « Réduire les animations » : états finaux immédiats.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Image, ScrollView, View, useWindowDimensions, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTopInset } from '@/components/demoInset';
import { Button, Icon, Text } from '@/components/ui';
import { GlassIconButton } from '@/components/glass';
import { FOUNDER_STORY, TESTER_PROOF } from '@/config/socialProof';
import { HeroArt } from '@/features/entry/HeroArt';
import { Cascade, useMotion } from '@/motion';
import { ThemeScope, useTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH, NEUTRALS, radius, spacing } from '@/theme/tokens';
import { formatNumber, t as tr, type TKey } from '@/i18n';
import { NO_HYPHENS } from './kit';
import type { NeedId } from './model';

type SlideId = 'transform' | 'trust' | 'founders';

/** Slides affichées : la confiance et l'histoire seulement si leur source est validée. */
export function storySlides(): SlideId[] {
  return ['transform', ...(TESTER_PROOF.enabled ? (['trust'] as const) : []), ...(FOUNDER_STORY.enabled ? (['founders'] as const) : [])];
}

const TRANSFORM_TITLE: Record<NeedId, TKey> = {
  feed_sleep: 'pw4.t.title.feed_sleep', relay: 'pw4.t.title.relay', prepare_birth: 'pw4.t.title.prepare_birth', mornings: 'pw4.t.title.mornings',
};
export const transformTitleKey = (need: NeedId | null): TKey => (need ? TRANSFORM_TITLE[need] : 'pw4.t.title.generic');

export function PaywallStory(props: { need: NeedId | null; onDone: () => void; onClose: () => void; onSlide?: (index: number, id: string) => void }) {
  return <ThemeScope mode="light" palette="nacre"><StoryBody {...props} /></ThemeScope>;
}

function StoryBody({ need, onDone, onClose, onSlide }: { need: NeedId | null; onDone: () => void; onClose: () => void; onSlide?: (index: number, id: string) => void }) {
  const th = useTheme();
  const top = useTopInset();
  const bottom = useSafeAreaInsets().bottom;
  const { width } = useWindowDimensions();
  const slides = storySlides();
  const [index, setIndex] = useState(0);
  const pager = useRef<ScrollView>(null);
  const seen = useRef(new Set<number>());
  useEffect(() => { if (!seen.current.has(index)) { seen.current.add(index); onSlide?.(index, slides[index]); } }, [index]); // eslint-disable-line react-hooks/exhaustive-deps
  const last = index >= slides.length - 1;
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / Math.max(1, width));
    if (i !== index && i >= 0 && i < slides.length) setIndex(i);
  };
  const next = () => {
    if (last) { onDone(); return; }
    pager.current?.scrollTo({ x: (index + 1) * width, animated: true });
    setIndex(index + 1);
  };
  return (
    <View style={{ flex: 1, backgroundColor: NEUTRALS.white, paddingTop: top }} testID="fw-story-paywall">
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.sm, minHeight: MIN_TOUCH }}>
        <View style={{ width: MIN_TOUCH }} />
        <View style={{ flexDirection: 'row', gap: 6 }} accessible accessibilityLabel={tr('pw4.step', { n: index + 1, total: slides.length + 1 })} testID="fw-story-dots">
          {[...slides, 'offers'].map((s, i) => (
            <View key={s} style={{ width: i === index ? 18 : 6, height: 6, borderRadius: 3, backgroundColor: i === index ? th.colors.text : th.colors.border }} />
          ))}
        </View>
        <GlassIconButton icon="x" label={tr('fw.pw.close')} onPress={onClose} testID="fw-story-close" />
      </View>
      <ScrollView ref={pager} horizontal pagingEnabled showsHorizontalScrollIndicator={false} onScroll={onScroll} scrollEventThrottle={32} style={{ flex: 1 }}>
        {slides.map((s, i) => (
          <ScrollView key={s} style={{ width }} contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.md, maxWidth: 560, width: '100%', alignSelf: 'center' }}
            testID={`fw-story-slide-${s}`}>
            {s === 'transform' ? <TransformSlide need={need} active={i === index} /> : s === 'trust' ? <TrustSlide active={i === index} /> : <FoundersSlide active={i === index} />}
          </ScrollView>
        ))}
      </ScrollView>
      <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: bottom + spacing.sm, maxWidth: 560, width: '100%', alignSelf: 'center' }}>
        <Button label={tr(last ? 'pw4.cta.offers' : 'pw4.cta.next')} icon={last ? 'heart' : 'arrow-right'} size="lg" full onPress={next} testID="fw-story-next" />
      </View>
    </View>
  );
}

// ------------------------------------------------------------------ 1. transformation
const BEFORE = ['scattered', 'tired', 'forgotten', 'complicated', 'talk'] as const;
const AFTER = ['central', 'shared', 'routines', 'history', 'aura'] as const;

function TransformSlide({ need, active }: { need: NeedId | null; active: boolean }) {
  const th = useTheme();
  const { width } = useWindowDimensions();
  const shot = Math.min(170, Math.round(width * 0.42));
  return (
    <View style={{ gap: spacing.md }}>
      <Text variant="title" center accessibilityRole="header" style={NO_HYPHENS} testID="fw-story-t-title">{tr(transformTitleKey(need))}</Text>
      {active ? (
        <>
          <Cascade index={0}>
            <View style={{ borderRadius: radius.lg, padding: spacing.md, gap: spacing.xs, backgroundColor: th.colors.surfaceAlt }} testID="fw-story-before">
              <Text variant="small" weight="bold" muted>{tr('pw4.t.before')}</Text>
              {BEFORE.map((k) => (
                <View key={k} style={{ flexDirection: 'row', gap: spacing.xs, alignItems: 'center' }}>
                  <Icon name="minus-circle" size={16} color={th.colors.textMuted} />
                  <Text variant="small" muted style={[{ flex: 1 }, NO_HYPHENS]}>{tr(`pw4.t.b.${k}` as TKey)}</Text>
                </View>
              ))}
            </View>
          </Cascade>
          <Cascade index={1}>
            <View style={{ borderRadius: radius.lg, padding: spacing.md, gap: spacing.xs, borderWidth: 2, borderColor: th.colors.primary }} testID="fw-story-after">
              <Text variant="small" weight="bold" color={th.colors.primary}>{tr('pw4.t.after')}</Text>
              {AFTER.map((k) => (
                <View key={k} style={{ flexDirection: 'row', gap: spacing.xs, alignItems: 'center' }}>
                  <Icon name="check-circle" size={16} color={th.colors.primary} />
                  <Text variant="small" style={[{ flex: 1 }, NO_HYPHENS]}>{tr(`pw4.t.a.${k}` as TKey)}</Text>
                </View>
              ))}
            </View>
          </Cascade>
          {/* Vraie capture de l'app (relais de nuit), sous la liste : jamais à l'étroit à côté du texte */}
          <Cascade index={2}>
            <View style={{ alignSelf: 'center', width: shot, height: Math.round(shot * 2.08), borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: th.colors.border }}
              accessible accessibilityRole="image" accessibilityLabel={tr('pw3.show.relais')} testID="fw-story-shot">
              <Image source={require('../../../assets/paywall/relais-nuit.webp')} style={{ width: shot, height: Math.round(shot * 2.08) }} resizeMode="cover" />
            </View>
          </Cascade>
          <Cascade index={3}>
            <Text variant="caption" muted center style={NO_HYPHENS}>{tr('pw4.t.honest')}</Text>
          </Cascade>
        </>
      ) : null}
    </View>
  );
}

// ------------------------------------------------------------------ 2. confiance
function TrustSlide({ active }: { active: boolean }) {
  const th = useTheme();
  const motion = useMotion();
  const target = TESTER_PROOF.rating;
  const [shown, setShown] = useState(motion.off ? target : 0);
  const [count, setCount] = useState(motion.off ? TESTER_PROOF.ratingCount : 0);
  const fill = useSharedValue(motion.off ? target / 5 : 0);
  useEffect(() => {
    if (!active) return;
    fill.value = motion.timing(target / 5, 1100);
    if (motion.off) { setShown(target); setCount(TESTER_PROOF.ratingCount); return; }
    const t0 = Date.now();
    let raf = 0;
    const tick = () => {
      const k = Math.min(1, (Date.now() - t0) / 1100);
      const e = 1 - (1 - k) ** 3;
      setShown(Math.round(target * e * 10) / 10);
      setCount(Math.round(TESTER_PROOF.ratingCount * e));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active]); // eslint-disable-line react-hooks/exhaustive-deps
  const bar = useAnimatedStyle(() => ({ width: `${fill.value * 100}%` }));
  const rating = formatNumber(shown, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const STAR = 30;
  return (
    <View style={{ gap: spacing.md, alignItems: 'center' }}>
      <Text variant="title" center accessibilityRole="header" style={NO_HYPHENS}>{tr('pw4.trust.title')}</Text>
      <View style={{ alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.md, paddingHorizontal: spacing.lg, borderRadius: radius.xl, backgroundColor: th.colors.surface, borderWidth: 1, borderColor: th.colors.border, alignSelf: 'stretch' }}
        accessible accessibilityLabel={tr('fw.pw.proof.a11y', { rating: formatNumber(target, { minimumFractionDigits: 1 }), count: TESTER_PROOF.ratingCount })} testID="fw-story-trust">
        <Text style={{ fontSize: 52, lineHeight: 60 }} weight="bold" testID="fw-story-score">{rating}<Text style={{ fontSize: 22 }} muted>/5</Text></Text>
        {/* Étoiles remplies EXACTEMENT à la note (4,8 → 96 %) : contour gris, remplissage par-dessus, coupé à la note */}
        <View style={{ width: STAR * 5 + 16, height: STAR }}>
          <View style={{ position: 'absolute', flexDirection: 'row', gap: 4 }}>
            {[0, 1, 2, 3, 4].map((i) => <MaterialCommunityIcons key={i} name="star" size={STAR} color={th.colors.border} />)}
          </View>
          <Animated.View style={[{ position: 'absolute', height: STAR, overflow: 'hidden' }, bar]}>
            <View style={{ flexDirection: 'row', gap: 4, width: STAR * 5 + 16 }}>
              {[0, 1, 2, 3, 4].map((i) => <MaterialCommunityIcons key={i} name="star" size={STAR} color={th.colors.gold} />)}
            </View>
          </Animated.View>
        </View>
        <Text variant="small" center weight="bold" testID="fw-story-count">{tr('pw4.trust.count', { count: formatNumber(count) })}</Text>
      </View>
      <Text center style={NO_HYPHENS}>{tr('fw.pw.proof.body')}</Text>
      <View style={{ flexDirection: 'row', gap: spacing.xs, alignItems: 'center' }}>
        <Icon name="shield" size={14} color={th.colors.textMuted} />
        <Text variant="caption" muted style={NO_HYPHENS}>{tr('pw4.trust.source')}</Text>
      </View>
    </View>
  );
}

// ------------------------------------------------------------------ 3. fondateurs
function FoundersSlide({ active }: { active: boolean }) {
  return (
    <View style={{ gap: spacing.md }}>
      <View style={{ alignItems: 'center' }}><HeroArt name="famille" size={150} testID="fw-story-art" /></View>
      <Text variant="title" center accessibilityRole="header" style={NO_HYPHENS} testID="fw-story-f-title">{tr('pw4.f.title')}</Text>
      {active ? tr('fw.pw.story.body').split('\n\n').map((para, i) => (
        <Cascade key={i} index={i}><Text style={NO_HYPHENS}>{para}</Text></Cascade>
      )) : null}
      <Text weight="bold">{tr('fw.pw.story.sign')}</Text>
      <Text variant="small" center muted style={[{ fontStyle: 'italic' }, NO_HYPHENS]} testID="fw-story-tagline">{tr('pw4.tagline')}</Text>
    </View>
  );
}
