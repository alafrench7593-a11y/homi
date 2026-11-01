/**
 * Accueil › « Au fil de nous » : commence par l'étape du profil affiché, puis fait défiler les autres mini-vidéos (femme seule pour le cycle, ventre selon la
 * semaine de grossesse, enfant selon SON âge, jumeaux et fratrie selon la famille renseignée). Bandeau discret et
 * compact (130 px), au-dessus des cartes utiles qu'il ne masque jamais ; touché, il ouvre la présentation.
 */
import { linkFrame } from '@/components/linkFrame';
import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { t as tr } from '@/i18n';
import { Icon, Text } from '@/components/ui';
import { Tappable } from '@/components/Tappable';
import { useActivePregnancy, useTrackedChildren } from '@/lib/data/hooks';
import { useScope } from '@/lib/data/hooks-scope';
import { childAge } from '@/lib/domain/child';
import { pregnancyProgress } from '@/lib/domain/pregnancy';
import { chapterIndexForScene, sceneFor, storyA11y, storyCaption } from '@/lib/domain/familyStory';
import { backdropPlan } from '@/lib/domain/backdropPlan';
import { useLowPower } from '@/lib/lowPower';
import { STORY_IMAGES } from './storyImages';
import { useReduceMotion, useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { FamilyStoryArt } from './FamilyStoryArt';

export const STORY_STRIP_HEIGHT = 130;
/** Durée d'affichage de chaque mini-vidéo sur l'accueil, puis fondu vers une autre étape. */
export const STORY_ROTATE_MS = 7000;
const FADE_MS = 1200;

/**
 * Fait défiler les mini-vidéos de « Notre histoire » : commence par l'étape du profil, puis enchaîne les autres dans un
 * ordre aléatoire, sans jamais remontrer deux fois de suite la même. Immobile si les animations sont réduites.
 */
export function useRotatingChapter(start: number | null, still: boolean): [number, number, number] | undefined {
  const plan = useMemo(() => {
    if (start == null) return [];
    const rest = backdropPlan(STORY_IMAGES.length, Math.random(), 60).map((x) => x.clip);
    const seq = [start];
    for (const c of rest) if (c !== seq[seq.length - 1]) seq.push(c);
    return seq;
  }, [start]);
  const [step, setStep] = useState(0);
  const [k, setK] = useState(0);
  useEffect(() => { setStep(0); setK(0); }, [plan]);
  useEffect(() => {
    if (still || plan.length < 2) return;
    let fade: ReturnType<typeof setInterval> | undefined;
    const hold = setTimeout(() => {
      const t0 = Date.now();
      fade = setInterval(() => {
        const v = Math.min(1, (Date.now() - t0) / FADE_MS);
        if (v >= 1) { clearInterval(fade); setK(0); setStep((s) => (s + 1) % plan.length); } else setK(v);
      }, 50);
    }, STORY_ROTATE_MS);
    return () => { clearTimeout(hold); if (fade) clearInterval(fade); };
  }, [step, still, plan]);
  if (start == null) return undefined;
  if (still || plan.length < 2) return [start, start, 0];
  return [plan[step], plan[(step + 1) % plan.length], k];
}

export function StoryHomeStrip() {
  const t = useTheme();
  const scope = useScope();
  const pregnancy = useActivePregnancy();
  const { data: children } = useTrackedChildren();
  const child = scope.child;
  const input = useMemo(() => ({ scope: scope.scope, pregnancy, child, children: children ?? [] }), [scope.scope, pregnancy, child, children]);
  const scene = useMemo(() => sceneFor(input), [input]);
  const reduce = useReduceMotion();
  const lowPower = useLowPower();
  const blend = useRotatingChapter(chapterIndexForScene(scene), reduce || lowPower);
  const twinNames = child?.multiple_group ? (children ?? []).filter((c) => c.id !== child.id && c.multiple_group === child.multiple_group).map((c) => c.first_name) : [];
  const caption = storyCaption({
    ...input, childName: child?.first_name, twinNames,
    childAgeLabel: child ? childAge(child.birth_date).label : null,
    weeksLabel: pregnancy && scope.scope === 'pregnancy' ? pregnancyProgress(pregnancy.due_date).label : null,
  });
  return (
    <Tappable accessibilityRole="button" accessibilityLabel={tr('u4.story.strip.a11y', { caption, scene: storyA11y(scene) })} onPress={() => router.push('/story' as never)} testID="home-story"
      style={{ height: STORY_STRIP_HEIGHT, flexDirection: 'row', alignItems: 'flex-end' }}>
      <View style={{ flex: 1, alignSelf: 'center', gap: 4, paddingRight: spacing.xs }}>
        <Text variant="caption" muted style={{ letterSpacing: 1.2, textTransform: 'uppercase' }}>{tr('u4.story.strip.title')}</Text>
        <Text weight="bold" numberOfLines={2} testID="home-story-caption">{caption}</Text>
        <View style={[linkFrame(t.isDark), { marginTop: 4, minHeight: 34, paddingHorizontal: 12 }]}>
          <Text variant="caption" weight="bold" color={t.colors.primary}>{tr('u4.story.strip.cta')}</Text>
          <Icon name="arrow-right" size={13} color={t.colors.primary} />
        </View>
      </View>
      <View style={{ width: '54%' }} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        <FamilyStoryArt scene={scene} blend={blend} height={STORY_STRIP_HEIGHT} label={storyA11y(scene)} testID="home-story-art" />
      </View>
    </Tappable>
  );
}
