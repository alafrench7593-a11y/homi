/**
 * Présentation « HOMI » : en faisant défiler, la même femme traverse son histoire — avant, enceinte,
 * son nouveau-né dans les bras, son bébé assis puis debout, son enfant qui grandit jusqu'à dix ans, main dans la main.
 * L'illustration reste en haut et évolue avec le défilement (poses intermédiaires) ; les textes défilent dessous.
 * « Réduire les animations » : chaque chapitre montre sa propre image fixe.
 */
import React, { useMemo, useState } from 'react';
import { Image, ScrollView, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { Button, Text } from '@/components/ui';
import { FamilyStoryArt } from '@/features/story/FamilyStoryArt';
import { STORY_IMAGES } from '@/features/story/storyImages';
import { STORY_CHAPTERS, storyA11y, storyPoseAt } from '@/lib/domain/familyStory';
import { useReduceMotion, useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';

export default function Story() {
  const t = useTheme();
  const reduce = useReduceMotion();
  const { height: H } = useWindowDimensions();
  const artH = Math.round(Math.min(330, Math.max(220, H * 0.38)));
  const step = Math.round(Math.max(260, H * 0.42));
  const [progress, setProgress] = useState(0);
  const pose = useMemo(() => storyPoseAt(progress), [progress]);
  const current = Math.min(STORY_CHAPTERS.length - 1, Math.round(progress));
  const last = STORY_CHAPTERS.length - 1;

  return (
    <Screen back title={tr('u5.story.title')} subtitle={tr('u5.story.subtitle')} scroll={false}>
      <View style={{ flex: 1 }} testID="story">
        {reduce ? null : (
          <View style={{ height: artH }} testID="story-art">
            <FamilyStoryArt pose={pose} progress={progress} height={artH} label={storyA11y(STORY_CHAPTERS[current].scene)} />
          </View>
        )}
        <ScrollView
          style={{ flex: 1 }}
          scrollEventThrottle={16}
          // Progression arrondie au 1/20 de chapitre : React ne refait le rendu que quand la pose change visiblement
          // (avant : un rendu complet de l'illustration à chaque image de défilement).
          onScroll={(e) => { const v = Math.round(Math.max(0, Math.min(last, e.nativeEvent.contentOffset.y / step)) * 20) / 20; setProgress((p) => (p === v ? p : v)); }}
          contentContainerStyle={{ paddingBottom: reduce ? spacing.xl : H * 0.45 }}
          showsVerticalScrollIndicator={false}
          testID="story-scroll"
        >
          {STORY_CHAPTERS.map((c, i) => (
            <View key={c.key} style={{ minHeight: reduce ? undefined : step, paddingVertical: spacing.md }} testID={`story-ch-${c.key}`}>
              {reduce ? (
                <View accessible accessibilityRole="image" accessibilityLabel={storyA11y(c.scene)} style={{ height: 220 }}>
                  <Image source={STORY_IMAGES[i]} resizeMode="contain" style={{ width: '100%', height: 220 }} accessibilityIgnoresInvertColors />
                </View>
              ) : null}
              {/* Chapitre en cours : numéro en couleur d'accent et titre plein ; les autres restent lisibles (texte atténué, plus d'opacité 0,42 sous 4,5:1) */}
              <Text variant="caption" muted={reduce || i !== current} weight={!reduce && i === current ? 'bold' : undefined} color={!reduce && i === current ? t.colors.primary : undefined}
                style={{ letterSpacing: 1.2, fontVariant: ['tabular-nums'] }}>{`${i + 1} / ${STORY_CHAPTERS.length}`}</Text>
              <Text variant="heading" accessibilityRole="header" muted={!reduce && i !== current} style={{ marginTop: spacing.xxs }}>{c.title}</Text>
              <Text muted style={{ marginTop: spacing.xs, maxWidth: 420 }}>{c.text}</Text>
            </View>
          ))}
          <View style={{ gap: spacing.sm, paddingTop: spacing.md }}>
            <Text muted>{tr('u5.story.home_note')}</Text>
            <Button label={tr('u5.story.back')} icon="home" variant="secondary" onPress={() => router.back()} testID="story-done" />
          </View>
        </ScrollView>
        {/* fondu sous l'illustration : les textes s'effacent en douceur en remontant */}
        {reduce ? null : <LinearGradient pointerEvents="none" colors={[t.colors.background, `${t.colors.background}00`]} style={{ position: 'absolute', left: 0, right: 0, top: artH, height: 28 }} />}
      </View>
    </Screen>
  );
}
