/**
 * Paywall « histoire » (24/11/2026, variante B du test `paywall_story_v1`) : trois slides SANS PRIX avant les offres.
 *   1. Transformation : avant / avec HOMI (titre selon le besoin choisi) — jamais de promesse de résultat ;
 *   2. Confiance : note du programme de test (source validée : `TESTER_PROOF`), étoiles et compteur animés ;
 *   3. Histoire des fondateurs : texte VALIDÉ (`FOUNDER_STORY`), juste avant les prix.
 * Les boutons font seulement avancer ; aucun achat ici. La croix reste visible dès la première slide.
 * Slide masquée si sa source est désactivée (`enabled: false`). « Réduire les animations » : états finaux immédiats.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Image, Pressable, ScrollView, View, useWindowDimensions, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTopInset } from '@/components/demoInset';
import { Button, Icon, Text } from '@/components/ui';
import { GlassIconButton } from '@/components/glass';
import { FOUNDER_STORY, TESTER_PROOF } from '@/config/socialProof';
import { AuraOrb } from '@/features/aura/AuraMark';
import { HeroArt } from '@/features/entry/HeroArt';
import { SHOTS } from './PaywallExtras';
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
/** Ordre des captures selon le besoin choisi : la plus parlante d'abord. */
const SHOT_ORDER: Record<NeedId | 'generic', string[]> = {
  feed_sleep: ['biberon', 'allaitement', 'accueil', 'relais', 'croissance', 'aura'],
  relay: ['relais', 'accueil', 'biberon', 'aura', 'allaitement', 'croissance'],
  prepare_birth: ['accueil', 'aura', 'relais', 'biberon', 'allaitement', 'croissance'],
  mornings: ['accueil', 'relais', 'aura', 'biberon', 'croissance', 'allaitement'],
  generic: ['accueil', 'biberon', 'relais', 'allaitement', 'croissance', 'aura'],
};

/**
 * Ce qu'on peut faire avec HOMI : VRAIES captures de l'app, et le robot d'Aura qui explique chacune en une phrase
 * (24/11/2026, demande de la propriétaire : des captures et le robot plutôt que des listes de texte). Changement
 * d'écran aux flèches ou en touchant la capture (pas de glissement : il ferait changer de slide), aucune lecture auto.
 */
function TransformSlide({ need, active }: { need: NeedId | null; active: boolean }) {
  const th = useTheme();
  const { width, height } = useWindowDimensions();
  const order = SHOT_ORDER[need ?? 'generic'];
  const shots = order.map((k) => SHOTS.find((s) => s.key === k)!).filter(Boolean);
  const [i, setI] = useState(0);
  const shot = shots[i];
  // Capture dimensionnée pour que titre, bulle, capture et bouton tiennent sans défiler (iPhone SE compris)
  const w = Math.max(110, Math.min(230, Math.round(width * 0.56), Math.round((height - 390) / 2.08)));
  const h = Math.round(w * 2.08);
  const go = (d: number) => setI((x) => (x + d + shots.length) % shots.length);
  return (
    <View style={{ gap: spacing.sm }}>
      <Text variant="heading" center accessibilityRole="header" style={NO_HYPHENS} testID="fw-story-t-title">{tr(transformTitleKey(need))}</Text>
      {active ? (
        <>
          {/* Le robot d'Aura explique l'écran affiché (bulle) AU-DESSUS de la capture : lisible sans défiler */}
          <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' }} testID="fw-story-robot">
            <AuraOrb key={shot.key} size={44} gather />
            <View style={{ flex: 1, minWidth: 0, borderRadius: radius.lg, borderTopLeftRadius: 4, padding: spacing.sm, backgroundColor: th.colors.surfaceAlt }}>
              <Text variant="caption" weight="bold" muted>{tr('fw.aura')}</Text>
              <Cascade key={shot.key} index={1}>
                <Text variant="small" style={NO_HYPHENS} accessibilityLiveRegion="polite" testID="fw-story-robot-text">{tr(`pw4.shot.${shot.key}` as TKey)}</Text>
              </Cascade>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs }}>
            <GlassIconButton icon="chevron-left" label={tr('pw4.shot.prev')} onPress={() => go(-1)} testID="fw-story-shot-prev" />
            <Pressable onPress={() => go(1)} accessibilityRole="image" accessibilityLabel={tr(`pw3.show.${shot.key}` as TKey)} testID={`fw-story-shot-${shot.key}`}>
              <Cascade key={shot.key} index={0}>
                <View style={{ width: w, height: h, borderRadius: radius.xl, overflow: 'hidden', borderWidth: 1, borderColor: th.colors.border, backgroundColor: th.colors.surface }}>
                  <Image source={shot.src} style={{ width: w, height: h }} resizeMode="cover" accessibilityIgnoresInvertColors />
                </View>
              </Cascade>
            </Pressable>
            <GlassIconButton icon="chevron-right" label={tr('pw4.shot.next')} onPress={() => go(1)} testID="fw-story-shot-next" />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6 }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            {shots.map((s, k) => <View key={s.key} style={{ width: k === i ? 16 : 6, height: 6, borderRadius: 3, backgroundColor: k === i ? th.colors.text : th.colors.border }} />)}
          </View>
          <Text variant="caption" muted center style={NO_HYPHENS}>{tr('pw4.t.honest')}</Text>
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
