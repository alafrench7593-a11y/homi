/**
 * Transition carte → détail (16/11/2026), en POINT D'INJECTION pour la primitive « morph » du design system.
 *
 *  - `CardSource` (ligne d'agenda, carte focale, ligne de mission) : à l'appui, la ligne s'élève (useCardLift :
 *    échelle 1,03, −4 px, 140 ms `decelerate`) puis ouvre le détail. Elle mémorise sa clé (`lastOpened`) ;
 *  - `DetailScene` (écran détail) : le contenu arrive en 380 ms `decelerate` (opacité 0 → 1, 0,94 → 1, +14 px → 0) —
 *    une transition de scène dans la fourchette 320–450 ms ;
 *  - Retour : l'écran source est resté monté sous la pile (même position de défilement, rien n'est rechargé) ;
 *    la ligne ouverte « se repose » à sa place (élévation 1 → 0 en ressort doux) et reçoit le focus d'accessibilité
 *    (web : focus programmatique) — on retrouve la même ligne, au même endroit.
 * Niveaux (useMotion) : 'off' → navigation immédiate, aucun mouvement ; 'minimal' (nuit) → fondu court, sans élévation.
 *
 * Injection : `registerCardDetailTransition({ CardSource, DetailScene })` (mêmes props) remplace ces deux moitiés
 * par la vraie transition partagée (morph de forme) sans toucher aux écrans.
 */
import React, { useEffect, useRef } from 'react';
import { Platform, Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { useIsFocused } from 'expo-router';
import { motionHaptic, useCardLift, useMotion } from '@/motion';

export const SCENE_MS = 380;

let lastOpened: string | null = null;
/** Clé de la dernière carte ouverte (tests, retour). */
export const lastOpenedCard = () => lastOpened;

export interface CardSourceProps {
  /** Clé stable de la carte (ex. `today:<id>`) : sert à la reconnaître au retour. */
  sourceKey: string;
  onOpen: () => void;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  disabled?: boolean;
  /** La carte occupe la place restante d'une rangée (flex: 1). */
  grow?: boolean;
}

function DefaultCardSource({ sourceKey, onOpen, children, style, testID, accessibilityLabel, accessibilityHint, disabled, grow }: CardSourceProps) {
  const c = useCardLift();
  const focused = useIsFocused();
  const ref = useRef<View>(null);
  const wasAway = useRef(false);
  useEffect(() => {
    if (!focused) { if (lastOpened === sourceKey) wasAway.current = true; return; }
    if (!wasAway.current) return;
    wasAway.current = false;
    // Retour sur l'écran : la ligne se repose à sa place et reprend le focus
    c.settle();
    if (Platform.OS === 'web') (ref.current as unknown as { focus?: (o?: object) => void } | null)?.focus?.({ preventScroll: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focused]);
  return (
    <Pressable ref={ref} style={grow ? { flex: 1, minWidth: 0 } : undefined} accessibilityRole="button" accessibilityLabel={accessibilityLabel} accessibilityHint={accessibilityHint} testID={testID} disabled={disabled}
      onPress={() => {
        lastOpened = sourceKey;
        motionHaptic('light');
        c.open(onOpen);
      }}>
      <Animated.View style={[style, c.style]}>{children}</Animated.View>
    </Pressable>
  );
}

export interface DetailSceneProps { children: React.ReactNode; style?: StyleProp<ViewStyle>; testID?: string }

function DefaultDetailScene({ children, style, testID }: DetailSceneProps) {
  const m = useMotion();
  const p = useSharedValue(m.off ? 1 : 0);
  const move = m.level === 'full';
  useEffect(() => {
    p.value = m.minimal ? m.timing(1, 160, 'standard') : m.timing(1, SCENE_MS, 'decelerate');
    return () => cancelAnimation(p);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const a = useAnimatedStyle(() => ({
    opacity: Math.min(1, p.value * 1.5),
    transform: move ? [{ translateY: (1 - p.value) * 14 }, { scale: 0.94 + 0.06 * p.value }] : [],
  }));
  return <Animated.View testID={testID} style={[style, a]}>{children}</Animated.View>;
}

type Impl = { CardSource: React.ComponentType<CardSourceProps>; DetailScene: React.ComponentType<DetailSceneProps> };
let injected: Partial<Impl> = {};
/** Point d'injection de la primitive carte → détail du design system (`{}` : revenir au défaut). */
export function registerCardDetailTransition(impl: Partial<Impl>) { injected = { ...impl }; }

export function CardSource(p: CardSourceProps) { const C = injected.CardSource ?? DefaultCardSource; return <C {...p} />; }
export function DetailScene(p: DetailSceneProps) { const C = injected.DetailScene ?? DefaultDetailScene; return <C {...p} />; }
