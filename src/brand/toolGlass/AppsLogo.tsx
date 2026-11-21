/**
 * Logo de « Mes apps » (consigne de la propriétaire, 21/11/2026) : une grille de 4 petites tuiles d'app arrondies en
 * verre dépoli (2 × 2). Chaque tuile porte un symbole nacré et une lumière de public différente — rose, bleu, menthe,
 * ambre — comme les logos d'outils (verre dépoli + symbole qui s'allume). Couleurs : APPS_LOGO (src/theme/toolLogo.ts).
 *
 * Lisible de 24 à 32 px (tuiles pleines, arêtes d'1 px, symbole réduit à un point nacré) comme en grand (en-tête).
 * À l'appui (`pulse` change) : les 4 tuiles s'allument en CASCADE (70 ms d'écart), puis reviennent au repos.
 * Réduire les animations : aucune cascade, logo statique. Décoratif pour les lecteurs d'écran (le libellé est à côté).
 */
import React, { useEffect, useId } from 'react';
import { View } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, type SharedValue } from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg';
import { useMotion } from '@/motion';
import { APPS_LOGO } from '@/theme/toolLogo';

/** Position (fraction de la taille) de chaque tuile : haut gauche, haut droite, bas gauche, bas droite. */
const TILES = [[0, 0], [1, 0], [0, 1], [1, 1]] as const;
const GAP = 0.1;
const TILE = (1 - GAP) / 2;

function TileLight({ i, size, uid, v }: { i: number; size: number; uid: string; v: SharedValue<number> }) {
  const style = useAnimatedStyle(() => ({ opacity: v.value }));
  const [cx, cy] = TILES[i];
  const s = TILE * size;
  return (
    <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: cx * (TILE + GAP) * size, top: cy * (TILE + GAP) * size, width: s, height: s }, style]}>
      <Svg width={s} height={s} viewBox="0 0 10 10">
        <Defs>
          <RadialGradient id={`${uid}l${i}`} cx="0.5" cy="0.55" r="0.5">
            <Stop offset="0" stopColor={APPS_LOGO.lights[i]} stopOpacity={1} />
            <Stop offset="0.7" stopColor={APPS_LOGO.lights[i]} stopOpacity={0.75} />
            <Stop offset="1" stopColor={APPS_LOGO.lights[i]} stopOpacity={0.3} />
          </RadialGradient>
        </Defs>
        <Rect x={0} y={0} width={10} height={10} rx={2.8} fill={`url(#${uid}l${i})`} />
      </Svg>
    </Animated.View>
  );
}

export function AppsLogo({ size = 28, pulse = 0, testID = 'apps-logo' }: { size?: number; pulse?: number; testID?: string }) {
  const uid = `al${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const m = useMotion();
  const v0 = useSharedValue<number>(APPS_LOGO.rest);
  const v1 = useSharedValue<number>(APPS_LOGO.rest);
  const v2 = useSharedValue<number>(APPS_LOGO.rest);
  const v3 = useSharedValue<number>(APPS_LOGO.rest);
  const vs = [v0, v1, v2, v3];
  useEffect(() => {
    if (!pulse || m.level !== 'full') return undefined;
    vs.forEach((v, i) => {
      v.value = m.delay(i * APPS_LOGO.step, m.timing(APPS_LOGO.lit, 140));
    });
    const id = setTimeout(() => { vs.forEach((v) => { v.value = m.timing(APPS_LOGO.rest, 420); }); }, 140 + 3 * APPS_LOGO.step + 160);
    return () => { clearTimeout(id); vs.forEach((v) => cancelAnimation(v)); };
  }, [pulse]); // eslint-disable-line react-hooks/exhaustive-deps
  const s = TILE * 10;
  const edge = size <= 32 ? 0.35 : 0.22;
  return (
    <View testID={testID} style={{ width: size, height: size }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width={size} height={size} viewBox="0 0 10 10">
        <Defs>
          <LinearGradient id={`${uid}p`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={APPS_LOGO.plateTop} />
            <Stop offset="1" stopColor={APPS_LOGO.plateBottom} />
          </LinearGradient>
        </Defs>
        {TILES.map(([cx, cy], i) => (
          <Rect key={i} x={cx * (TILE + GAP) * 10} y={cy * (TILE + GAP) * 10} width={s} height={s} rx={s * 0.3} fill={`url(#${uid}p)`}
            stroke={APPS_LOGO.edge} strokeOpacity={0.7} strokeWidth={edge} />
        ))}
      </Svg>
      {vs.map((v, i) => <TileLight key={i} i={i} size={size} uid={uid} v={v} />)}
      {/* symbole nacré de chaque tuile, AU-DESSUS de la lumière : il s'allume de la couleur sans la laisser déborder */}
      <Svg width={size} height={size} viewBox="0 0 10 10" style={{ position: 'absolute', left: 0, top: 0 }} pointerEvents="none">
        {TILES.map(([cx, cy], i) => (
          <Circle key={i} cx={cx * (TILE + GAP) * 10 + s / 2} cy={cy * (TILE + GAP) * 10 + s / 2} r={s * 0.2} fill={APPS_LOGO.pearl} fillOpacity={0.92} />
        ))}
      </Svg>
    </View>
  );
}
