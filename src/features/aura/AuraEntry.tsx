/**
 * Aura présente au bon endroit (brief du 21/11/2026) :
 *  - `AuraHomeEntry` : rangée sobre de l'accueil, sous « Mes outils » — UNE interaction ouvre Aura ;
 *  - `AuraToolButton` : entrée contextuelle des écrans d'outil (en-tête `Screen`) : ouvre Aura avec le nom de l'outil ;
 *    n'apparaît que pour un outil RÉEL du catalogue (`auraToolContext`) ;
 *  - `AuraIntroHost` : présentation unique (une fois par compte), relançable (réglages d'Aura, Réglages › Aide) ;
 *  - `AuraIntroLens` : la lentille d'Aura et ses trois lumières qui se rapprochent puis se stabilisent (une fois, à
 *    l'ouverture ; immobile avec Réduire les animations ; aucune boucle au repos).
 * Ici, le PERSONNAGE d'Aura est sa lentille (`AuraOrb`) ; le robot compagnon reste dans la conversation.
 */
import React, { useEffect, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { router } from 'expo-router';
import { GlassIconButton, GlassModal } from '@/components/glass';
import { Tappable } from '@/components/Tappable';
import { Button, haptic, Icon, Text } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { useUiStore } from '@/lib/store';
import { useTourProgress, useTourStore } from '@/features/tour/store';
import { auraMotion, useMotion } from '@/motion';
import { useTheme } from '@/theme/ThemeProvider';
import { AURA } from '@/theme/toolLogo';
import { radius, spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';
import { AuraOrb } from './AuraMark';
import { auraToolContext, introChoices, introRoute, shouldShowAuraIntro } from './intro';
import { dictationMode } from './voice';

/** Accueil : « Demander à Aura » (lentille, titre, sous-titre, chevron). */
export function AuraHomeEntry() {
  const t = useTheme();
  return (
    <Tappable accessibilityRole="button" accessibilityLabel={tr('ta.home.a11y')} accessibilityHint={tr('ta.home.askSub')} testID="home-aura"
      onPress={() => { haptic('selection'); router.push('/assistant'); }}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 56, paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
        borderRadius: radius.lg, borderWidth: 1, borderColor: t.colors.border, backgroundColor: pressed ? t.colors.surfaceAlt : t.colors.surface })}>
      <AuraOrb size={34} testID="home-aura-lens" />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text weight="bold">{tr('ta.home.ask')}</Text>
        <Text variant="caption" muted numberOfLines={2}>{tr('ta.home.askSub')}</Text>
      </View>
      <Icon name="chevron-right" size={18} color={t.colors.textMuted} />
    </Tappable>
  );
}

/** En-tête d'un écran d'outil : ouvre Aura sur CET outil (nom affiché, questions d'usage, retour à l'outil). */
export function AuraToolButton({ toolId }: { toolId: string }) {
  const ctx = auraToolContext(toolId);
  if (!ctx) return null;
  const name = tr(ctx.labelKey);
  return (
    <GlassIconButton icon="message-circle" label={tr('ta.ctx.a11y', { tool: name })} size={44} testID="screen-aura"
      renderIcon={(_ink, s) => <AuraOrb size={s + 4} />}
      onPress={() => { haptic('selection'); router.push({ pathname: '/assistant', params: { tool: ctx.id } }); }} />
  );
}

/**
 * Lentille d'introduction : verre sombre d'Aura, trois lumières (corail, ambre, lagon) qui partent du bord, se
 * rapprochent du centre puis se stabilisent ; l'éclat apparaît ensuite. Une seule fois ; Réduire les animations : pose finale.
 */
export function AuraIntroLens({ size = 112, testID = 'aura-intro-lens' }: { size?: number; testID?: string }) {
  const m = useMotion();
  const k = useSharedValue(m.level === 'full' ? 0 : 1);
  const star = useSharedValue(m.level === 'full' ? 0 : 1);
  useEffect(() => {
    if (m.level !== 'full') { k.value = 1; star.value = 1; return; }
    k.value = withTiming(1, { duration: auraMotion.openMs * 1.6, easing: Easing.bezier(0.2, 0.8, 0.2, 1) });
    star.value = withDelay(auraMotion.openMs, withTiming(1, { duration: 260 }));
    return () => { cancelAnimation(k); cancelAnimation(star); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const far = size * 0.4;
  const near = size * 0.13;
  const dot = size * 0.2;
  const angles = [-90, 30, 150];
  const s0 = useAnimatedStyle(() => { const d = far + (near - far) * k.value; return { opacity: 0.35 + 0.65 * k.value, transform: [{ translateX: Math.cos((angles[0] * Math.PI) / 180) * d }, { translateY: Math.sin((angles[0] * Math.PI) / 180) * d }] }; });
  const s1 = useAnimatedStyle(() => { const d = far + (near - far) * k.value; return { opacity: 0.35 + 0.65 * k.value, transform: [{ translateX: Math.cos((angles[1] * Math.PI) / 180) * d }, { translateY: Math.sin((angles[1] * Math.PI) / 180) * d }] }; });
  const s2 = useAnimatedStyle(() => { const d = far + (near - far) * k.value; return { opacity: 0.35 + 0.65 * k.value, transform: [{ translateX: Math.cos((angles[2] * Math.PI) / 180) * d }, { translateY: Math.sin((angles[2] * Math.PI) / 180) * d }] }; });
  const lens = useAnimatedStyle(() => ({ transform: [{ scale: 0.9 + 0.1 * k.value }] }));
  const starStyle = useAnimatedStyle(() => ({ opacity: star.value, transform: [{ scale: 0.6 + 0.4 * star.value }, { rotate: `${(1 - star.value) * 45}deg` }] }));
  const light = (c: string) => ({ position: 'absolute' as const, width: dot, height: dot, borderRadius: dot / 2, backgroundColor: c, boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: dot * 0.9, spreadDistance: dot * 0.2, color: c }] });
  return (
    <Animated.View testID={testID} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" aria-hidden
      style={[{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden', backgroundColor: AURA.ring, alignItems: 'center', justifyContent: 'center', boxShadow: AURA.shadow }, lens]}>
      <Animated.View style={[light(AURA.hues[0]), s0]} />
      <Animated.View style={[light(AURA.hues[1]), s1]} />
      <Animated.View style={[light(AURA.hues[2]), s2]} />
      <Animated.View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }, starStyle]}>
        <View style={{ width: size * 0.16, height: size * 0.16, borderRadius: size * 0.08, backgroundColor: AURA.core, boxShadow: [{ offsetX: 0, offsetY: 0, blurRadius: size * 0.12, color: AURA.core }] }} />
      </Animated.View>
      {/* arête claire du verre */}
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: size / 2, borderWidth: 1.5, borderColor: AURA.core, opacity: 0.35 }]} />
    </Animated.View>
  );
}

/** Présentation d'Aura (fenêtre de verre) : lentille, message, Parler / Écrire / Plus tard. */
export function AuraIntro({ visible, onDone }: { visible: boolean; onDone: (choice: 'talk' | 'write' | 'later') => void }) {
  const choices = introChoices({ canTalk: dictationMode() !== 'none' });
  // écran bas (320 × 568) : lentille plus petite, tout tient sans défiler
  const short = useWindowDimensions().height < 700;
  return (
    <GlassModal visible={visible} onClose={() => onDone('later')} title={tr('aura.name')} testID="aura-intro">
      <View style={{ alignItems: 'center', gap: short ? spacing.sm : spacing.md }} accessibilityLabel={tr('ta.intro.a11y')}>
        {visible ? <AuraIntroLens size={short ? 64 : 112} /> : null}
        <Text center testID="aura-intro-hello" accessibilityLiveRegion="polite">{tr('ta.intro.hello')}</Text>
        <View style={{ alignSelf: 'stretch', gap: spacing.xs }}>
          {choices.includes('talk') ? <Button label={tr('ta.intro.talk')} icon="mic" full onPress={() => onDone('talk')} testID="aura-intro-talk" /> : null}
          <Button label={tr('ta.intro.write')} icon="edit-3" variant={choices.includes('talk') ? 'secondary' : 'primary'} full onPress={() => onDone('write')} testID="aura-intro-write" />
          <Button label={tr('ta.intro.later')} variant="ghost" full onPress={() => onDone('later')} testID="aura-intro-later" />
        </View>
        <Text variant="caption" muted center>{tr('ta.intro.note')}</Text>
      </View>
    </GlassModal>
  );
}

/**
 * Hôte monté sous les onglets : affiche la présentation la première fois que la personne arrive dans l'application
 * (après 1,2 s, hors visite guidée), ou quand une relance est demandée.
 */
export function AuraIntroHost() {
  const { session } = useAuth();
  const userId = session?.userId ?? null;
  const seen = useUiStore((s) => s.auraIntroSeen);
  const requested = useUiStore((s) => s.auraIntroRequested);
  const markSeen = useUiStore((s) => s.markAuraIntroSeen);
  const clearRequest = useUiStore((s) => s.clearAuraIntroRequest);
  const tour = useTourProgress();
  const tourBusy = useTourStore((s) => s.finished || !!s.hint);
  const busy = tour.status === 'running' || tourBusy;
  const want = shouldShowAuraIntro({ userId, seen, requested, busy });
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!want) { setReady(false); return; }
    const id = setTimeout(() => setReady(true), requested ? 0 : 1200);
    return () => clearTimeout(id);
  }, [want, requested]);
  const done = (choice: 'talk' | 'write' | 'later') => {
    if (userId) markSeen(userId); else clearRequest();
    setReady(false);
    if (choice !== 'later') router.push(introRoute(choice) as never);
  };
  return <AuraIntro visible={want && ready} onDone={done} />;
}
