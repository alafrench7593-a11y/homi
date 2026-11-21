/**
 * LISTES VIVANTES — une entrée ajoutée apparaît À SA PLACE, une entrée supprimée se replie et les voisines referment
 * l'espace (Reanimated, animations de mise en page sur le fil UI).
 *
 *   <MotionList style={{ gap: 8 }}>{entries.map((e) => <MotionItem key={e.id}><EntryRow … /></MotionItem>)}</MotionList>
 *
 * Règles (docs/DA_LIQUID_GLASS.md § 11) :
 *  - JAMAIS au montage : les entrées présentes au premier affichage de la liste (ou à l'arrivée des données, `ready`)
 *    sont posées sans animation ; seule une entrée montée APRÈS joue l'apparition ;
 *  - quitter l'écran ne rejoue rien (`LayoutAnimationConfig skipExiting` sur la vue de la liste) : seule une
 *    suppression réelle se replie ;
 *  - longue liste (> `LIST_MOTION.layoutMax` entrées) : seul l'élément touché s'anime (pas de glissement des voisines) ;
 *  - 'off' (Réduire les animations, économie d'énergie) : changement immédiat ; 'minimal' (nuit) : fondu court.
 * Rien ne tourne au repos : une animation de mise en page n'existe que pendant le changement.
 * `MotionList` est une vraie `View` (mêmes props) : elle remplace le conteneur de la liste sans changer la mise en page.
 */
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { View, type ViewProps } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut, LayoutAnimationConfig, LinearTransition } from 'react-native-reanimated';
import { durations } from './curves';
import { useMotion, type MotionLevel } from './useMotion';

export const LIST_MOTION = {
  /** décalage d'arrivée (px) : l'entrée descend à sa place */
  enterFrom: -8,
  enterMs: 260,
  exitMs: 180,
  /** au-delà, les voisines ne glissent plus (seul l'élément touché s'anime) */
  layoutMax: 40,
} as const;

/** Animations d'une entrée selon le niveau de mouvement (pur, testé). */
export function listItemMotion(level: MotionLevel, o: { animateIn: boolean; count: number }) {
  if (level === 'off') return { entering: undefined, exiting: undefined, layout: undefined };
  if (level === 'minimal') {
    return { entering: o.animateIn ? FadeIn.duration(durations.fast) : undefined, exiting: FadeOut.duration(durations.fast), layout: undefined };
  }
  return {
    entering: o.animateIn ? FadeInDown.duration(LIST_MOTION.enterMs).withInitialValues({ opacity: 0, transform: [{ translateY: LIST_MOTION.enterFrom }] }) : undefined,
    exiting: FadeOut.duration(LIST_MOTION.exitMs),
    layout: o.count <= LIST_MOTION.layoutMax ? LinearTransition.springify().damping(26).stiffness(260) : undefined,
  };
}

type Ctx = { settled: React.MutableRefObject<boolean>; count: number };
const ListCtx = createContext<Ctx | null>(null);

export function MotionList({ children, style, gap, ready = true, ...rest }: ViewProps & {
  children?: React.ReactNode;
  gap?: number;
  /** false tant que les données ne sont pas arrivées : rien ne s'anime avant le premier affichage réel */
  ready?: boolean;
}) {
  const settled = useRef(false);
  useEffect(() => { if (ready) settled.current = true; }, [ready]);
  const count = React.Children.count(children);
  return (
    <LayoutAnimationConfig skipExiting>
      <View {...rest} style={[gap != null ? { gap } : null, style]}>
        <ListCtx.Provider value={{ settled, count }}>{children}</ListCtx.Provider>
      </View>
    </LayoutAnimationConfig>
  );
}

export function MotionItem({ children, style, testID }: { children?: React.ReactNode; style?: ViewProps['style']; testID?: string }) {
  const m = useMotion();
  const ctx = useContext(ListCtx);
  // Décidé au montage, une fois : l'entrée est-elle arrivée après le premier affichage de sa liste ?
  const [animateIn] = useState(() => !!ctx?.settled.current);
  const a = listItemMotion(m.level, { animateIn, count: ctx?.count ?? 0 });
  return (
    <Animated.View testID={testID} style={style} entering={a.entering} exiting={a.exiting} layout={a.layout}>
      {children}
    </Animated.View>
  );
}
