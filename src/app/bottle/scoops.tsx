/**
 * Compteur de mesurettes (v3) : à 3 h du matin, on perd le compte. Le parent saisit la règle imprimée sur SA boîte
 * de lait (« 1 mesurette rase pour … ml d'eau ») et la quantité d'eau conseillée par le médecin ou la PMI ;
 * l'écran divise (sans arrondir en silence) puis compte chaque mesurette versée d'un appui sur la grande commande
 * RONDE (point focal), chiffres tabulaires, anneau de progression vers le compte. Aucune quantité n'est proposée
 * par l'application. La règle est mémorisée sur ce téléphone seulement.
 * Mouvement : à chaque appui, le chiffre « tape » (ressort `vif`) et l'arc avance (150 ms) ; Réduire les animations :
 * états finaux immédiats.
 */
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text as RNText, View } from 'react-native';
import Animated, { cancelAnimation, useAnimatedProps, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Screen } from '@/components/Screen';
import { Banner, Field, haptic, Icon, Text } from '@/components/ui';
import { DataTile, SecondaryButton } from '@/components/controls';
import { MatteSurface } from '@/components/surfaces';
import { scoopsFor } from '@/lib/domain/scoops';
import { usePressScale } from '@/motion/PressableScale';
import { useMotion } from '@/motion/useMotion';
import { useTheme } from '@/theme/ThemeProvider';
import { alpha, fonts, radius, spacing, typography } from '@/theme/tokens';
import { formatNumber, t as tr } from '@/i18n';

const RATIO_KEY = 'scoops.mlPerScoop';
const num = (v: string) => Number(v.replace(',', '.').replace(/[^\d.]/g, ''));
const SIZE = 184;
const STROKE = 8;
const R = SIZE / 2 - STROKE;
const CIRC = 2 * Math.PI * R;
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
/** L'arc part du haut (12 h) et tourne dans le sens horaire. */
const RING_START = `rotate(-90 ${SIZE / 2} ${SIZE / 2})`;

export default function ScoopCounter() {
  const t = useTheme();
  const m = useMotion();
  const [ratio, setRatio] = useState('');
  const [water, setWater] = useState('');
  const [count, setCount] = useState(0);
  useEffect(() => {
    AsyncStorage.getItem(RATIO_KEY).then((v) => { if (v) setRatio(v); }).catch(() => undefined);
  }, []);
  const saveRatio = (v: string) => {
    setRatio(v);
    AsyncStorage.setItem(RATIO_KEY, v).catch(() => undefined);
  };
  const plan = scoopsFor(num(water), num(ratio));
  const target = plan?.exact ? plan.scoops : null;
  const reached = target != null && count >= target;
  const over = target != null && count > target;
  const ringColor = over ? t.tokens.status.warning : reached ? t.tokens.status.success : t.colors.primary;

  // progression vers le compte (réelle : nombre de mesurettes touchées / compte calculé)
  const progress = useSharedValue(0);
  const tap = useSharedValue(1);
  useEffect(() => {
    const to = target ? Math.min(1, count / target) : 0;
    progress.value = m.timing(to, 150, 'standard');
  }, [count, target]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => { cancelAnimation(progress); cancelAnimation(tap); }, [progress, tap]);
  const arc = useAnimatedProps(() => ({ strokeDashoffset: CIRC * (1 - progress.value) }));
  const numberStyle = useAnimatedStyle(() => ({ transform: [{ scale: tap.value }] }));
  const p = usePressScale({ scale: 0.96, haptic: 'none' });

  function add() {
    const next = count + 1;
    setCount(next);
    haptic(target != null && next === target ? 'success' : target != null && next > target ? 'warning' : 'light');
    if (!m.off) { tap.value = 1.1; tap.value = m.spring(1, 'vif'); }
  }

  const status = reached ? (over ? tr('sc.over') : tr('sc.done')) : tr('sc.tap');
  return (
    <Screen back title={tr('tool.bottle_scoops')} subtitle={tr('tool.bottle_scoops.sub')}>
      <Text muted>{tr('sc.intro')}</Text>
      <MatteSurface radius={radius.lg} padded={spacing.md} contentStyle={{ gap: spacing.sm }}>
        <Field label={tr('sc.ratio')} value={ratio} onChangeText={saveRatio} keyboardType="decimal-pad" suffix="ml" hint={tr('sc.ratioHint')} testID="sc-ratio" />
        <Field label={tr('sc.water')} value={water} onChangeText={(v) => { setWater(v); setCount(0); }} keyboardType="number-pad" suffix="ml" hint={tr('sc.waterHint')} testID="sc-water" />
      </MatteSurface>
      {plan ? (
        plan.exact ? (
          <DataTile testID="sc-result" icon="hash" tint="success" label={tr('sc.tile')} value={formatNumber(plan.scoops)} unit={tr('sc.unit', { count: plan.scoops })}
            context={tr('sc.resultD', { water: num(water), ratio: num(ratio) })} />
        ) : (
          <Banner tone="warning" icon="alert-triangle" title={tr('sc.notExact')}>
            {tr('sc.notExactD', { lower: plan.lower, lowerMl: plan.lowerMl, upper: plan.upper, upperMl: plan.upperMl })}
          </Banner>
        )
      ) : null}

      {/* commande ronde : une mesurette versée = un appui */}
      <View style={{ alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xs }}>
        <Pressable accessibilityRole="button" accessibilityLabel={tr('sc.tapA11y', { count })} testID="sc-tap" onPress={add} onPressIn={p.onPressIn} onPressOut={p.onPressOut}
          style={{ width: SIZE, height: SIZE }}>
          <Animated.View style={[{ flex: 1 }, p.style]}>
            <View style={[StyleSheet.absoluteFill, { borderRadius: SIZE / 2, backgroundColor: t.material.surfaces.matte.fill, borderWidth: 1, borderColor: reached ? ringColor : t.material.surfaces.matte.edge,
              boxShadow: t.name === 'night' ? undefined : [{ offsetX: 0, offsetY: 10, blurRadius: 30, spreadDistance: -6, color: alpha(t.tokens.accent.glow[0], t.isDark ? 0.4 : 0.3) }] }]} />
            <Svg width={SIZE} height={SIZE} style={StyleSheet.absoluteFill} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              <Circle cx={SIZE / 2} cy={SIZE / 2} r={R} stroke={t.material.lines.track} strokeWidth={STROKE} fill="none" />
              {target ? (
                <AnimatedCircle cx={SIZE / 2} cy={SIZE / 2} r={R} stroke={ringColor} strokeWidth={STROKE} fill="none" strokeLinecap="round"
                  strokeDasharray={`${CIRC} ${CIRC}`} animatedProps={arc} transform={RING_START} />
              ) : null}
            </Svg>
            <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', gap: 2 }]}>
              <Animated.View style={numberStyle}>
                <RNText testID="sc-count" maxFontSizeMultiplier={1.2} numberOfLines={1} adjustsFontSizeToFit
                  style={{ color: t.colors.text, fontFamily: fonts.displayItalic, fontSize: 56, lineHeight: 64, letterSpacing: -1.5, fontVariant: ['tabular-nums'], maxWidth: SIZE - 40, textAlign: 'center' }}>
                  {count}{target != null ? ` / ${target}` : ''}
                </RNText>
              </Animated.View>
              <Icon name={reached ? (over ? 'alert-triangle' : 'check') : 'plus'} size={20} color={reached ? ringColor : t.colors.primary} />
            </View>
          </Animated.View>
        </Pressable>
        <RNText accessibilityLiveRegion="polite" testID="sc-status" maxFontSizeMultiplier={1.5}
          style={{ textAlign: 'center', color: over ? t.tokens.status.warning : reached ? t.tokens.status.success : t.colors.text, fontFamily: fonts.bodyBold, fontSize: typography.bodyM.fontSize, lineHeight: typography.bodyM.lineHeight, paddingHorizontal: spacing.md }}>
          {status}
        </RNText>
      </View>
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <View style={{ flex: 1 }}><SecondaryButton label={tr('sc.minus')} icon="minus" size="sm" onPress={() => setCount((c) => Math.max(0, c - 1))} disabled={!count} testID="sc-minus" /></View>
        <View style={{ flex: 1 }}><SecondaryButton label={tr('sc.reset')} icon="rotate-ccw" size="sm" onPress={() => setCount(0)} disabled={!count} testID="sc-reset" /></View>
      </View>
      <Banner tone="info" icon="info">{tr('sc.rules')}</Banner>
      <Text variant="small" muted>{tr('sc.ask')}</Text>
    </Screen>
  );
}
