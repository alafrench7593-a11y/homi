/**
 * Compteur de mesurettes : à 3 h du matin, on perd le compte. Le parent saisit la règle imprimée sur SA boîte
 * de lait (« 1 mesurette rase pour … ml d'eau ») et la quantité d'eau conseillée par le médecin ou la PMI ;
 * l'écran divise (sans arrondir en silence) puis compte chaque mesurette versée d'un appui sur un grand bouton.
 * Aucune quantité n'est proposée par l'application. La règle est mémorisée sur ce téléphone seulement.
 */
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Screen } from '@/components/Screen';
import { Tappable } from '@/components/Tappable';
import { Banner, Button, Card, Field, haptic, Text } from '@/components/ui';
import { scoopsFor } from '@/lib/domain/scoops';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { t as tr } from '@/i18n';

const RATIO_KEY = 'scoops.mlPerScoop';
const num = (v: string) => Number(v.replace(',', '.').replace(/[^\d.]/g, ''));

export default function ScoopCounter() {
  const t = useTheme();
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

  function add() {
    const next = count + 1;
    setCount(next);
    haptic(target != null && next === target ? 'success' : target != null && next > target ? 'warning' : 'light');
  }

  return (
    <Screen back title={tr('tool.bottle_scoops')} subtitle={tr('tool.bottle_scoops.sub')}>
      <Text muted>{tr('sc.intro')}</Text>
      <Card>
        <Field label={tr('sc.ratio')} value={ratio} onChangeText={saveRatio} keyboardType="decimal-pad" suffix="ml" hint={tr('sc.ratioHint')} testID="sc-ratio" />
        <Field label={tr('sc.water')} value={water} onChangeText={(v) => { setWater(v); setCount(0); }} keyboardType="number-pad" suffix="ml" hint={tr('sc.waterHint')} testID="sc-water" />
      </Card>
      {plan ? (
        plan.exact ? (
          <Card tone="soft" testID="sc-result">
            <Text variant="title" center>{tr('sc.result', { count: plan.scoops })}</Text>
            <Text center muted>{tr('sc.resultD', { water: num(water), ratio: num(ratio) })}</Text>
          </Card>
        ) : (
          <Banner tone="warning" icon="alert-triangle" title={tr('sc.notExact')}>
            {tr('sc.notExactD', { lower: plan.lower, lowerMl: plan.lowerMl, upper: plan.upper, upperMl: plan.upperMl })}
          </Banner>
        )
      ) : null}

      <Tappable accessibilityRole="button" accessibilityLabel={tr('sc.tapA11y', { count })} testID="sc-tap" onPress={add}
        style={({ pressed }) => ({ minHeight: 180, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', gap: 4,
          backgroundColor: reached ? t.colors.accentSoft : t.colors.surface, borderWidth: reached ? 2 : 1, borderColor: reached ? t.colors.success : t.colors.border, opacity: pressed ? 0.85 : 1 })}>
        <Text style={{ fontSize: 64, lineHeight: 72 }} weight="bold" testID="sc-count">{count}{target != null ? ` / ${target}` : ''}</Text>
        <Text weight="bold" center style={{ paddingHorizontal: spacing.md }}>{reached ? (count > target! ? tr('sc.over') : tr('sc.done')) : tr('sc.tap')}</Text>
      </Tappable>
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <View style={{ flex: 1 }}><Button label={tr('sc.minus')} icon="minus" size="sm" variant="secondary" onPress={() => setCount((c) => Math.max(0, c - 1))} disabled={!count} /></View>
        <View style={{ flex: 1 }}><Button label={tr('sc.reset')} icon="rotate-ccw" size="sm" variant="secondary" onPress={() => setCount(0)} disabled={!count} testID="sc-reset" /></View>
      </View>
      <Banner tone="info" icon="info">{tr('sc.rules')}</Banner>
      <Text variant="small" muted>{tr('sc.ask')}</Text>
    </Screen>
  );
}
