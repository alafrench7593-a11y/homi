/**
 * GLISSER-DÉPOSER — réordonner une liste VERTICALE (favoris, raccourcis, profils) : appui long (220 ms), la carte se
 * SOULÈVE (échelle 1,03 + ombre), suit le doigt, les voisines se RANGENT en ressort « panneau », un haptique
 * « sélection » marque chaque changement de rang, et la liste DÉFILE seule quand le doigt approche d'un bord.
 * Reanimated + Gesture Handler, tout sur le fil UI, aucune dépendance supplémentaire.
 *
 *   const scroll = useReorderScroll();
 *   <Animated.ScrollView {...scroll.props}>
 *     <ReorderList data={items} keyOf={(i) => i.id} gap={12} scroll={scroll} onReorder={(keys) => save(keys)}
 *       renderItem={(item, info) => <Row item={item} lifted={info.active} {...info.a11y} />} />
 *   </Animated.ScrollView>
 *
 * Fonctionnement :
 *  - les lignes sont en position absolue dans un conteneur de hauteur connue ; leur place vient de l'ORDRE (valeur
 *    partagée) et des hauteurs mesurées (hauteurs variables acceptées : Dynamic Type, descriptions multi-lignes) —
 *    valider un nouvel ordre ne change donc aucune mise en page (aucun saut d'image) ;
 *  - `onReorder(keys)` est appelé UNE fois, au dépôt, si l'ordre a changé : l'appelant met `data` à jour ;
 *  - le rang visé se calcule sur le fil UI (`reorderOrder`, pur et testé) ; un seul aller-retour vers le fil JS par
 *    changement de rang (haptique), jamais par image ;
 *  - défilement automatique : `useFrameCallback` actif seulement pendant un glisser, vitesse proportionnelle à la
 *    proximité du bord (zone de 72 px, 720 px/s au plus), bornée au contenu ;
 *  - lecteurs d'écran : pas de glisser — actions « monter » / « descendre » (`info.a11y`, `info.moveUp/moveDown`) ;
 *  - 'off' (Réduire les animations, économie d'énergie) : la carte suit toujours le doigt (manipulation directe), mais
 *    sans soulèvement, et les voisines changent de place SANS trajet ; 'minimal' (nuit) : glissement court sans ressort.
 *
 * Règles worklets (trois plantages iOS venaient de là) : aucun paramètre par défaut dans un worklet ; les fonctions du
 * fil JS (`tick`, `onDragStart`, `onDropJs`) sont déclarées dans le composant, jamais dans un worklet ; aucune ref
 * React lue sur le fil UI (la liste défilante passe par `useAnimatedRef`).
 */
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet, View, type AccessibilityActionEvent, type LayoutChangeEvent, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation, measure, ReduceMotion, scrollTo, useAnimatedReaction, useAnimatedRef, useAnimatedScrollHandler, useAnimatedStyle, useDerivedValue,
  useFrameCallback, useSharedValue, withSpring, withTiming, type AnimatedRef, type SharedValue,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { scheduleOnRN } from 'react-native-worklets';
import { useTheme } from '@/theme/ThemeProvider';
import { physicalShadow, radius as R } from '@/theme/tokens';
import { curves, durations, reorder as REORDER, springs } from './curves';
import { motionHaptic } from './haptics';
import { motionSpring, useMotion, type MotionLevel } from './useMotion';

// ------------------------------------------------------------------ logique pure (worklets, testée)
/** Décalage vertical (px) de la ligne `key` pour un ordre et des hauteurs donnés. */
export function reorderOffset(order: string[], heights: Record<string, number>, gap: number, key: string): number {
  'worklet';
  let y = 0;
  for (let i = 0; i < order.length; i++) {
    if (order[i] === key) return y;
    y += (heights[order[i]] ?? 0) + gap;
  }
  return y;
}

/** Hauteur totale de la liste. */
export function reorderTotal(order: string[], heights: Record<string, number>, gap: number): number {
  'worklet';
  let y = 0;
  for (let i = 0; i < order.length; i++) y += (heights[order[i]] ?? 0) + (i > 0 ? gap : 0);
  return y;
}

/**
 * Nouvel ordre quand la ligne `key` est tenue avec son bord haut à `top` : elle passe APRÈS chaque voisine dont elle
 * a dépassé le milieu (positions des voisines calculées sans elle : les seuils ne dépendent pas de l'ordre courant,
 * donc aucune oscillation). Renvoie le MÊME tableau si le rang ne change pas.
 */
export function reorderOrder(order: string[], heights: Record<string, number>, gap: number, key: string, top: number): string[] {
  'worklet';
  const from = order.indexOf(key);
  if (from < 0) return order;
  const center = top + (heights[key] ?? 0) / 2;
  let y = 0;
  let to = 0;
  for (let i = 0; i < order.length; i++) {
    const k = order[i];
    if (k === key) continue;
    const h = heights[k] ?? 0;
    if (center > y + h / 2) to++;
    y += h + gap;
  }
  if (to === from) return order;
  const next: string[] = [];
  for (let i = 0; i < order.length; i++) if (order[i] !== key) next.push(order[i]);
  next.splice(to, 0, key);
  return next;
}

/** Vitesse de défilement automatique (px/s, signée) selon la distance du doigt aux bords de la zone visible. */
export function autoScrollSpeed(fingerY: number, top: number, height: number, edge: number, max: number): number {
  'worklet';
  if (height <= 0 || edge <= 0) return 0;
  const fromTop = fingerY - top;
  const fromBottom = top + height - fingerY;
  if (fromTop < edge) return -max * Math.min(1, Math.max(0, 1 - fromTop / edge));
  if (fromBottom < edge) return max * Math.min(1, Math.max(0, 1 - fromBottom / edge));
  return 0;
}

/** Déplace `key` d'un rang (actions d'accessibilité). Renvoie le même tableau si le déplacement est impossible. */
export function moveKey(order: string[], key: string, delta: -1 | 1): string[] {
  const from = order.indexOf(key);
  const to = from + delta;
  if (from < 0 || to < 0 || to >= order.length) return order;
  const next = order.slice();
  next.splice(from, 1);
  next.splice(to, 0, key);
  return next;
}

// ------------------------------------------------------------------ liste défilante
export interface ReorderScroll {
  ref: AnimatedRef<Animated.ScrollView>;
  scrollY: SharedValue<number>;
  contentH: SharedValue<number>;
  /** À étaler sur l'`Animated.ScrollView` qui contient la liste */
  props: {
    ref: AnimatedRef<Animated.ScrollView>;
    onScroll: ReturnType<typeof useAnimatedScrollHandler>;
    onContentSizeChange: (w: number, h: number) => void;
    scrollEventThrottle: number;
  };
}

/** Branche le défilement automatique : `<Animated.ScrollView {...scroll.props}>` puis `<ReorderList scroll={scroll} />`. */
export function useReorderScroll(): ReorderScroll {
  const ref = useAnimatedRef<Animated.ScrollView>();
  const scrollY = useSharedValue(0);
  const contentH = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
    contentH.value = e.contentSize.height;
  });
  const onContentSizeChange = useCallback((_w: number, h: number) => { contentH.value = h; }, [contentH]);
  return useMemo(() => ({ ref, scrollY, contentH, props: { ref, onScroll, onContentSizeChange, scrollEventThrottle: 16 } }), [ref, scrollY, contentH, onScroll, onContentSizeChange]);
}

// ------------------------------------------------------------------ composant
export interface ReorderItemInfo {
  index: number;
  /** vrai pendant que CETTE ligne est tenue (rendu « soulevé » facultatif côté appelant) */
  active: boolean;
  /** À étaler sur l'élément accessible de la ligne : actions « monter » / « descendre » */
  a11y: {
    accessibilityActions: { name: string; label: string }[];
    onAccessibilityAction: (e: AccessibilityActionEvent) => void;
  };
  moveUp: () => void;
  moveDown: () => void;
}

interface Shared {
  order: SharedValue<string[]>;
  heights: SharedValue<Record<string, number>>;
  activeKey: SharedValue<string | null>;
  dragTop: SharedValue<number>;
  lift: SharedValue<number>;
  settled: SharedValue<boolean>;
}

const SPRING = { ...springs.panneau, reduceMotion: ReduceMotion.Never };
const SHORT = { duration: durations.fast, easing: curves.standard, reduceMotion: ReduceMotion.Never };
const SEP = '\u0001';
const NO_SELECT = (Platform.OS === 'web' ? { userSelect: 'none', cursor: 'grab' } : null) as unknown as ViewStyle;

const ReorderRow = memo(function ReorderRow({ itemKey, sv, gap, level, disabled, liftRadius, shadow, begin, move, drop, onMeasure, children }: {
  itemKey: string;
  sv: Shared;
  gap: number;
  level: MotionLevel;
  disabled: boolean;
  liftRadius: number;
  shadow: ViewStyle['boxShadow'];
  begin: (key: string, absoluteY: number) => void;
  move: (translationY: number, absoluteY: number) => void;
  drop: () => void;
  onMeasure: (key: string, height: number) => void;
  children: React.ReactNode;
}) {
  const { order, heights, activeKey, dragTop, lift, settled } = sv;
  // Place de la ligne : la cible suit l'ordre ; `pos` la rejoint en ressort (une animation par changement de rang,
  // pas une par image). La ligne tenue lit `dragTop` ; au dépôt, `pos` est déjà sur sa case.
  const target = useDerivedValue(() => reorderOffset(order.value, heights.value, gap, itemKey));
  const pos = useSharedValue(0);
  useAnimatedReaction(() => target.value, (to, prev) => {
    if (to === prev) return;
    if (prev === null || !settled.value || level === 'off') pos.value = to;
    else pos.value = level === 'full' ? withSpring(to, SPRING) : withTiming(to, SHORT);
  });
  const style = useAnimatedStyle(() => {
    const held = activeKey.value === itemKey;
    return {
      zIndex: held ? 10 : 0,
      transform: [{ translateY: held ? dragTop.value : pos.value }, { scale: held ? 1 + lift.value * (REORDER.liftScale - 1) : 1 }],
    };
  });
  const shadowStyle = useAnimatedStyle(() => ({ opacity: activeKey.value === itemKey ? lift.value : 0 }));
  const pan = useMemo(() => Gesture.Pan()
    .enabled(!disabled)
    .activateAfterLongPress(REORDER.longPressMs)
    .onStart((e) => {
      'worklet';
      begin(itemKey, e.absoluteY);
    })
    .onUpdate((e) => {
      'worklet';
      move(e.translationY, e.absoluteY);
    })
    .onFinalize(() => {
      'worklet';
      drop();
    }), [disabled, itemKey, begin, move, drop]);
  const onLayout = useCallback((e: LayoutChangeEvent) => onMeasure(itemKey, e.nativeEvent.layout.height), [itemKey, onMeasure]);
  return (
    <GestureDetector gesture={pan}>
      <Animated.View onLayout={onLayout} testID={`reorder-row-${itemKey}`} style={[styles.row, NO_SELECT, style]}>
        {shadow ? <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: liftRadius, boxShadow: shadow }, shadowStyle]} /> : null}
        {children}
      </Animated.View>
    </GestureDetector>
  );
});

export function ReorderList<T>({ data, keyOf, renderItem, onReorder, gap = 0, scroll, disabled = false, liftRadius = R.lg, moveUpLabel, moveDownLabel, style, testID }: {
  data: readonly T[];
  keyOf: (item: T) => string;
  renderItem: (item: T, info: ReorderItemInfo) => React.ReactNode;
  /** Nouvel ordre des clés, au dépôt (ou après une action d'accessibilité) */
  onReorder: (keys: string[]) => void;
  gap?: number;
  /** Défilement automatique aux bords (`useReorderScroll`) ; sans lui, la liste ne défile pas seule */
  scroll?: ReorderScroll;
  disabled?: boolean;
  /** Rayon de la ligne (pour l'ombre de soulèvement) */
  liftRadius?: number;
  /** Libellés des actions d'accessibilité (ex. « Monter », « Descendre ») */
  moveUpLabel: string;
  moveDownLabel: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  const t = useTheme();
  const m = useMotion();
  const level = m.level;
  const keys = data.map(keyOf);
  const sig = keys.join(SEP);

  const order = useSharedValue<string[]>(keys);
  const heights = useSharedValue<Record<string, number>>({});
  const activeKey = useSharedValue<string | null>(null);
  const dragging = useSharedValue(false);
  const dragTop = useSharedValue(0);
  const startTop = useSharedValue(0);
  const translation = useSharedValue(0);
  const startScroll = useSharedValue(0);
  const fingerY = useSharedValue(0);
  const lift = useSharedValue(0);
  const settled = useSharedValue(false);
  const sv = useMemo<Shared>(() => ({ order, heights, activeKey, dragTop, lift, settled }), [order, heights, activeKey, dragTop, lift, settled]);

  // Liste défilante : celle de l'appelant, sinon des valeurs neutres (les hooks ne sont jamais conditionnels)
  const ownRef = useAnimatedRef<Animated.ScrollView>();
  const ownY = useSharedValue(0);
  const ownH = useSharedValue(0);
  const hasScroll = !!scroll;
  const sRef = scroll?.ref ?? ownRef;
  const sY = scroll?.scrollY ?? ownY;
  const sH = scroll?.contentH ?? ownH;

  const [measured, setMeasured] = useState<Record<string, number>>({});
  const [active, setActive] = useState<string | null>(null);
  const latest = useRef({ keys, onReorder });
  latest.current = { keys, onReorder };

  // L'ordre suit `data` (hors glisser en cours : le dépôt publie l'ordre, l'appelant renvoie `data`)
  useEffect(() => {
    if (!dragging.value) order.value = latest.current.keys;
  }, [sig]); // eslint-disable-line react-hooks/exhaustive-deps

  const onMeasure = useCallback((key: string, h: number) => {
    const height = Math.round(h * 100) / 100;
    setMeasured((cur) => (cur[key] === height ? cur : { ...cur, [key]: height }));
  }, []);
  const known: Record<string, number> = {};
  for (const k of keys) if (measured[k] > 0) known[k] = measured[k];
  const allMeasured = keys.every((k) => known[k] > 0);
  const total = reorderTotal(keys, known, gap);
  const knownSig = keys.map((k) => known[k] ?? 0).join(',');
  useEffect(() => { heights.value = known; }, [knownSig, sig]); // eslint-disable-line react-hooks/exhaustive-deps
  // Première pose sans trajet : les lignes ne « volent » pas vers leur place au montage
  const [shown, setShown] = useState(false);
  useEffect(() => { if (allMeasured) setShown(true); }, [allMeasured]);
  useEffect(() => {
    if (!shown) return;
    const id = requestAnimationFrame(() => { settled.value = true; });
    return () => cancelAnimationFrame(id);
  }, [shown, settled]);

  // ---- fil JS (déclarées ici, jamais dans un worklet)
  const frameRef = useRef<{ setActive: (on: boolean) => void } | null>(null);
  const tick = useCallback(() => motionHaptic('selection'), []);
  const onDragStart = useCallback((key: string) => {
    motionHaptic('light');
    setActive(key);
    frameRef.current?.setActive(true);
  }, []);
  const onDropJs = useCallback((next: string[]) => {
    setActive(null);
    frameRef.current?.setActive(false);
    if (next.join(SEP) !== latest.current.keys.join(SEP)) latest.current.onReorder(next);
  }, []);

  // ---- fil UI
  const place = useCallback(() => {
    'worklet';
    const k = activeKey.value;
    if (k === null || !dragging.value) return;
    const hs = heights.value;
    const ord = order.value;
    const span = reorderTotal(ord, hs, gap) - (hs[k] ?? 0);
    const raw = startTop.value + translation.value + (sY.value - startScroll.value);
    // la carte ne sort pas de la liste (léger dépassement toléré : elle « résiste » aux extrémités)
    const top = Math.min(span + 12, Math.max(-12, raw));
    dragTop.value = top;
    const next = reorderOrder(ord, hs, gap, k, top);
    if (next !== ord) {
      order.value = next;
      scheduleOnRN(tick);
    }
  }, [activeKey, dragging, heights, order, gap, startTop, translation, sY, startScroll, dragTop, tick]);

  const begin = useCallback((key: string, absoluteY: number) => {
    'worklet';
    if (dragging.value) return;
    cancelAnimation(dragTop);
    const top = reorderOffset(order.value, heights.value, gap, key);
    dragging.value = true;
    activeKey.value = key;
    startTop.value = top;
    dragTop.value = top;
    translation.value = 0;
    startScroll.value = sY.value;
    fingerY.value = absoluteY;
    lift.value = motionSpring(level, 1, 'vif', undefined);
    scheduleOnRN(onDragStart, key);
  }, [dragging, dragTop, order, heights, gap, activeKey, startTop, translation, startScroll, sY, fingerY, lift, level, onDragStart]);

  const move = useCallback((translationY: number, absoluteY: number) => {
    'worklet';
    if (!dragging.value) return;
    translation.value = translationY;
    fingerY.value = absoluteY;
    place();
  }, [dragging, translation, fingerY, place]);

  const drop = useCallback(() => {
    'worklet';
    const k = activeKey.value;
    if (k === null || !dragging.value) return;
    dragging.value = false;
    const to = reorderOffset(order.value, heights.value, gap, k);
    lift.value = motionSpring(level, 0, 'doux', undefined);
    dragTop.value = motionSpring(level, to, 'panneau', (finished) => {
      'worklet';
      if (finished && !dragging.value) activeKey.value = null;
    });
    scheduleOnRN(onDropJs, order.value);
  }, [activeKey, dragging, order, heights, gap, lift, level, dragTop, onDropJs]);

  // Défilement automatique : actif seulement pendant un glisser
  const frame = useFrameCallback((f) => {
    'worklet';
    if (!hasScroll || !dragging.value) return;
    const box = measure(sRef);
    if (!box) return;
    const speed = autoScrollSpeed(fingerY.value, box.pageY, box.height, REORDER.edge, REORDER.maxSpeed);
    if (speed === 0) return;
    const dt = Math.min(f.timeSincePreviousFrame ?? 16, 48) / 1000;
    const max = Math.max(0, sH.value - box.height);
    const next = Math.min(max, Math.max(0, sY.value + speed * dt));
    if (next === sY.value) return;
    scrollTo(sRef, 0, next, false);
    sY.value = next;
    place();
  }, false);
  frameRef.current = frame;

  const moveBy = (key: string, delta: -1 | 1) => {
    const next = moveKey(latest.current.keys, key, delta);
    if (next === latest.current.keys) return;
    motionHaptic('selection');
    order.value = next;
    latest.current.onReorder(next);
  };
  const shadow = t.name === 'night' || level === 'off' ? undefined : physicalShadow('high', t.isDark, t.material.shadowInk);

  return (
    <View testID={testID} style={[{ height: total, opacity: shown ? 1 : 0 }, style]}>
      {data.map((item, index) => {
        const key = keys[index];
        const info: ReorderItemInfo = {
          index,
          active: active === key,
          a11y: {
            accessibilityActions: [{ name: 'moveUp', label: moveUpLabel }, { name: 'moveDown', label: moveDownLabel }],
            onAccessibilityAction: (e) => moveBy(key, e.nativeEvent.actionName === 'moveUp' ? -1 : 1),
          },
          moveUp: () => moveBy(key, -1),
          moveDown: () => moveBy(key, 1),
        };
        return (
          <ReorderRow key={key} itemKey={key} sv={sv} gap={gap} level={level} disabled={disabled} liftRadius={liftRadius} shadow={shadow}
            begin={begin} move={move} drop={drop} onMeasure={onMeasure}>
            {renderItem(item, info)}
          </ReorderRow>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { position: 'absolute', top: 0, left: 0, right: 0 },
});
