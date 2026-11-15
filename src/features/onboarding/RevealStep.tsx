/**
 * Temps 7 — Révélation : « Votre foyer est prêt ». Progressive et HONNÊTE : chaque fenêtre de la maison s'allume quand
 * une opération réelle se termine (accords, foyer, grossesse, enfants, parcours, rappels, réponses) et la ligne
 * correspondante se pose dessous. Aucun score, aucune promesse : seulement ce qui vient d'être fait.
 * Réduire les animations : fenêtres et lignes posées sans mouvement.
 */
import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { Banner, Icon, Text } from '@/components/ui';
import { FocalGlow } from '@/features/entry/EntryKit';
import { useMotion } from '@/motion';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';
import { StepTitle } from './kit';

export interface RevealLine { key: string; text: string }

const HOUSE_W = 168;
const HOUSE_H = 150;
/** Ouvertures (x, y, largeur, hauteur) : quatre fenêtres, puis la porte, qui s'allume quand tout est prêt. */
const WINDOWS: [number, number, number, number][] = [[40, 72, 26, 22], [102, 72, 26, 22], [40, 106, 26, 22], [102, 106, 26, 22]];
const DOOR: [number, number, number, number] = [72, 104, 24, 42];

function Window({ lit, x, y, w, h, i, door }: { lit: boolean; x: number; y: number; w: number; h: number; i: number; door?: boolean }) {
  const t = useTheme();
  const m = useMotion();
  const v = useSharedValue(lit ? 1 : 0);
  useEffect(() => { v.value = m.delay(lit ? i * 40 : 0, m.spring(lit ? 1 : 0, 'rebondLeger')); }, [lit]); // eslint-disable-line react-hooks/exhaustive-deps
  const a = useAnimatedStyle(() => ({ opacity: v.value, transform: [{ scale: 0.7 + 0.3 * v.value }] }));
  return (
    <View style={{ position: 'absolute', left: x, top: y, width: w, height: h, borderRadius: door ? 12 : 5, borderBottomLeftRadius: door ? 2 : 5, borderBottomRightRadius: door ? 2 : 5, borderWidth: 1, borderColor: t.material.lines.track }}>
      <Animated.View style={[{ flex: 1, borderRadius: door ? 11 : 4, borderBottomLeftRadius: door ? 1 : 4, borderBottomRightRadius: door ? 1 : 4, backgroundColor: door ? t.colors.primary : t.tokens.halo.color, boxShadow: `0 0 16px ${t.tokens.halo.color}` }, a]} />
    </View>
  );
}

export function RevealStep({ lines, total, done, title, error }: { lines: RevealLine[]; total: number; done: boolean; title: string; error: string | null }) {
  const t = useTheme();
  const m = useMotion();
  const anim = m.level === 'full';
  const lit = done ? WINDOWS.length : Math.floor((lines.length / Math.max(1, total)) * WINDOWS.length);
  return (
    <View style={{ gap: spacing.md, alignItems: 'stretch' }} testID="onb-reveal">
      <View style={{ alignItems: 'center', justifyContent: 'center', height: HOUSE_H + 40 }}
        accessible accessibilityRole="image" accessibilityLabel={done ? title : tr('o2.reveal.working')}>
        <View style={{ position: 'absolute' }}><FocalGlow size={HOUSE_H + 90} /></View>
        <View style={{ width: HOUSE_W, height: HOUSE_H }}>
          <Svg width={HOUSE_W} height={HOUSE_H} viewBox={`0 0 ${HOUSE_W} ${HOUSE_H}`}>
            {/* maison : pignon + corps aux angles adoucis (même silhouette que la marque) */}
            <Path d="M24 62 L84 14 Q86 12.5 88 14 L144 60 Q146 62 146 65 L146 140 Q146 146 140 146 L28 146 Q22 146 22 140 L22 66 Q22 63 24 62 Z"
              fill={t.material.surfaces.matte.fill} stroke={t.colors.primary} strokeWidth={2.5} strokeLinejoin="round" />
          </Svg>
          {WINDOWS.map(([x, y, w, h], i) => <Window key={i} i={i} x={x} y={y} w={w} h={h} lit={i < lit} />)}
          <Window i={WINDOWS.length} x={DOOR[0]} y={DOOR[1]} w={DOOR[2]} h={DOOR[3]} lit={done} door />
        </View>
      </View>
      {done ? (
        <StepTitle center title={title} lead={tr('onb.ready.privacy')} />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs }} accessibilityLiveRegion="polite">
          {!error ? <ActivityIndicator color={t.colors.primary} /> : null}
          <Text weight="bold">{tr('o2.reveal.working')}</Text>
        </View>
      )}
      {error ? <Banner tone="warning">{error}</Banner> : null}
      <View style={{ gap: spacing.xs }} accessibilityRole="list" testID="onb-reveal-lines">
        {lines.map((l) => (
          <Animated.View key={l.key} entering={anim ? FadeInDown.duration(260) : undefined} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs }} accessible accessibilityLabel={l.text}>
            <Icon name="check" size={18} color={t.colors.success} />
            <Text style={{ flex: 1 }}>{l.text}</Text>
          </Animated.View>
        ))}
      </View>
    </View>
  );
}
