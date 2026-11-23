/**
 * Démos SUR MESURE des outils phares : missions, biberon, sommeil, humeur, scanner, cycle, semaine de grossesse,
 * courses et stocks. Même contrat que les aperçus génériques : UN geste (`DemoTarget`), SON résultat
 * (`useDemo().done`), valeurs d'exemple constantes (`CUSTOM_SAMPLE`), aucune donnée du foyer.
 */
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { Icon, type IconName, Text } from '@/components/ui';
import { AnimatedNumber, CompletionCheck, Reveal, useMotion } from '@/motion';
import { formatNumber, t as tr, type TKey } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { alpha, radius, spacing } from '@/theme/tokens';
import { DemoTarget, useDemo } from './DemoPlayer';
import { Capsule, Panel, Swap } from './DemoKinds';
import type { CustomDemo as CustomDemoKey } from './model';
import { CUSTOM_SAMPLE, demoDate, demoTime } from './texts';

const NUM = { fontFamily: 'SpaceGrotesk_500Medium' } as const;

/** Valeur animée 0 → 1 qui suit `done` (immédiate avec Réduire les animations). */
function useDoneProgress(ms = 520, curve: 'decelerate' | 'standard' = 'decelerate') {
  const m = useMotion();
  const { done } = useDemo();
  const p = useSharedValue(done ? 1 : 0);
  useEffect(() => { p.value = m.timing(done ? 1 : 0, ms, curve); }, [done, m, p, ms, curve]);
  return p;
}

// ------------------------------------------------------------------ missions : « Accepter » → « Sam s'en occupe »
function MissionsDemo() {
  const t = useTheme();
  const { done } = useDemo();
  const Avatar = ({ l, c }: { l: string; c: string }) => (
    <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: c, alignItems: 'center', justifyContent: 'center' }}><Text weight="bold" color="#FFFFFF">{l}</Text></View>
  );
  return (
    <Panel style={{ alignSelf: 'stretch', gap: spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <Icon name="send" size={20} color={t.tokens.accent.glow[0]} />
        <Text weight="bold" style={{ flex: 1 }}>{tr('kn.c.missions.title')}</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
        <Avatar l="L" c="#8A4FB8" /><Icon name="arrow-right" size={14} /><Avatar l="S" c="#1F7A72" />
        <Text variant="small" muted style={{ flex: 1 }}>{tr('kn.c.missions.from')}</Text>
      </View>
      <Swap on={done}
        a={<View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm }}>
          <View style={{ paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.pill, backgroundColor: alpha(t.colors.warning, 0.16) }}><Text variant="small" color={t.colors.warning}>{tr('kn.c.missions.pending')}</Text></View>
          <DemoTarget label={tr('kn.c.missions.accept')} round><Capsule label={tr('kn.c.missions.accept')} icon="check" /></DemoTarget>
        </View>}
        b={<View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, minHeight: 40 }}>
          <Icon name="check-circle" size={20} color={t.colors.success} />
          <Text weight="bold" color={t.colors.success}>{tr('kn.c.missions.accepted')}</Text>
        </View>} />
    </Panel>
  );
}

// ------------------------------------------------------------------ biberon : « 120 ml » → la tuile du jour passe de 480 à 600 ml
function BottleDemo() {
  const t = useTheme();
  const { done } = useDemo();
  const s = CUSTOM_SAMPLE.bottle;
  const goal = 750;
  const p = useDoneProgress(700);
  const fill = useAnimatedStyle(() => ({ transform: [{ scaleX: (s.from + s.step * p.value) / goal }] }));
  const total = done ? s.from + s.step : s.from;
  const count = done ? s.countFrom + 1 : s.countFrom;
  return (
    <View style={{ gap: spacing.md, alignSelf: 'stretch', alignItems: 'center' }}>
      <Panel style={{ alignSelf: 'stretch', gap: 6 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text variant="small" muted>{tr('kn.today')}</Text>
          <Text variant="small" muted>{tr('kn.c.bottle.count', { count })}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
          <AnimatedNumber value={total} from={s.from} style={{ fontSize: 42, lineHeight: 48, color: t.colors.text, ...NUM }} testID="demo-value" />
          <Text muted>ml</Text>
        </View>
        <View style={{ height: 6, borderRadius: 3, backgroundColor: alpha(t.colors.text, 0.12), overflow: 'hidden' }}>
          <Animated.View style={[{ height: 6, width: '100%', borderRadius: 3, backgroundColor: t.tokens.accent.glow[0], transformOrigin: 'left' }, fill]} />
        </View>
      </Panel>
      <View style={{ flexDirection: 'row', gap: spacing.xs }}>
        {s.chips.map((c) => (c === s.step
          ? <DemoTarget key={c} label={`${formatNumber(c)} ml`} round><Capsule label={`${formatNumber(c)} ml`} /></DemoTarget>
          : <Capsule key={c} label={`${formatNumber(c)} ml`} tone="glass" />))}
      </View>
    </View>
  );
}

// ------------------------------------------------------------------ sommeil : « Il s'endort » → la nuit commence
function SleepDemo() {
  const t = useTheme();
  const { done } = useDemo();
  const p = useDoneProgress(900);
  const bar = useAnimatedStyle(() => ({ transform: [{ scaleX: 0.04 + 0.4 * p.value }] }));
  const moon = useAnimatedStyle(() => ({ opacity: 0.45 + 0.55 * p.value, transform: [{ scale: 0.9 + 0.1 * p.value }] }));
  const at = demoTime(CUSTOM_SAMPLE.sleep.at);
  return (
    <View style={{ gap: spacing.md, alignSelf: 'stretch', alignItems: 'center' }}>
      <Panel style={{ alignSelf: 'stretch', gap: spacing.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Animated.View style={moon}><Icon name="moon" size={28} color={t.tokens.accent.glow[1]} /></Animated.View>
          <View style={{ flex: 1 }}>
            <Text variant="small" muted>{tr('kn.c.sleep.who')}</Text>
            <Swap on={done} a={<Text weight="bold">{tr('kn.c.sleep.idle')}</Text>} b={<Text weight="bold">{tr('kn.c.sleep.running', { time: at })}</Text>} />
          </View>
        </View>
        <View style={{ height: 10, borderRadius: 5, backgroundColor: alpha(t.colors.text, 0.1), overflow: 'hidden' }}>
          <Animated.View style={[{ height: 10, width: '100%', backgroundColor: alpha(t.tokens.accent.glow[1], 0.8), transformOrigin: 'left' }, bar]} />
        </View>
      </Panel>
      <Swap on={done}
        a={<DemoTarget label={tr('kn.c.sleep.btn')} round><Capsule label={tr('kn.c.sleep.btn')} icon="moon" /></DemoTarget>}
        b={<Capsule tone="glass" icon="check" label={at} />} />
    </View>
  );
}

// ------------------------------------------------------------------ humeur : la lumière rejoint « Serein »
const MOODS: { key: string; icon: IconName }[] = [
  { key: 'calm', icon: 'feather' }, { key: 'happy', icon: 'sun' }, { key: 'tired', icon: 'battery' }, { key: 'tense', icon: 'zap' }, { key: 'sad', icon: 'cloud-drizzle' },
];
function MoodDemo() {
  const t = useTheme();
  const { done } = useDemo();
  const [w, setW] = useState(0);
  const p = useDoneProgress(420);
  const cell = w / MOODS.length;
  // la lumière part du centre (orbe 3) et glisse vers l'orbe choisi (orbe 1)
  const light = useAnimatedStyle(() => ({ opacity: 0.35 + 0.65 * p.value, transform: [{ translateX: cell * (2 - 2 * p.value) + cell / 2 - 32 }] }));
  return (
    <View style={{ gap: spacing.md, alignSelf: 'stretch' }}>
      <Text weight="bold" center>{tr('kn.c.mood.title')}</Text>
      <View onLayout={(e) => setW(e.nativeEvent.layout.width)} style={{ flexDirection: 'row' }}>
        {w ? <Animated.View pointerEvents="none" style={[{ position: 'absolute', top: -6, left: 0, width: 64, height: 64, borderRadius: 32, backgroundColor: alpha(t.tokens.accent.glow[0], t.isDark ? 0.32 : 0.26) }, light]} /> : null}
        {MOODS.map((x, i) => {
          const label = tr(`kn.c.mood.${x.key}` as TKey);
          const orb = (
            <View style={{ alignItems: 'center', gap: 4 }}>
              <View style={{ width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: t.material.glass.inset.fill, borderWidth: i === 0 && done ? 2 : 1, borderColor: i === 0 && done ? t.tokens.accent.glow[0] : t.material.glass.inset.edge }}>
                <Icon name={x.icon} size={20} />
              </View>
              <Text variant="caption" center weight={i === 0 && done ? 'bold' : undefined}>{label}</Text>
            </View>
          );
          return <View key={x.key} style={{ flex: 1, alignItems: 'center' }}>{i === 0 ? <DemoTarget label={label} round>{orb}</DemoTarget> : orb}</View>;
        })}
      </View>
      <Reveal visible={done}><Panel style={{ paddingVertical: spacing.sm }}><Text variant="small">{tr('kn.today')} · <Text variant="small" weight="bold">{tr('kn.c.mood.calm')}</Text></Text></Panel></Reveal>
    </View>
  );
}

// ------------------------------------------------------------------ scanner : code-barres lu → verdict
function ScannerDemo() {
  const t = useTheme();
  const { done } = useDemo();
  const p = useDoneProgress(620, 'standard');
  const laser = useAnimatedStyle(() => ({ opacity: p.value > 0 && p.value < 1 ? 1 : 0, transform: [{ translateY: 10 + 84 * p.value }] }));
  return (
    <View style={{ gap: spacing.sm, alignSelf: 'stretch', alignItems: 'center' }}>
      <View style={{ width: 200, height: 112, borderRadius: radius.lg, backgroundColor: alpha(t.colors.text, t.isDark ? 0.06 : 0.04), alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {/* coins du viseur */}
        {[{ top: 8, left: 8 }, { top: 8, right: 8 }, { bottom: 8, left: 8 }, { bottom: 8, right: 8 }].map((pos, i) => (
          <View key={i} style={[{ position: 'absolute', width: 20, height: 20, borderColor: t.tokens.accent.glow[0] }, pos,
            { borderTopWidth: 'top' in pos ? 3 : 0, borderBottomWidth: 'bottom' in pos ? 3 : 0, borderLeftWidth: 'left' in pos ? 3 : 0, borderRightWidth: 'right' in pos ? 3 : 0 }]} />
        ))}
        <View style={{ flexDirection: 'row', gap: 3, height: 54 }}>
          {[3, 1, 2, 1, 3, 2, 1, 1, 3, 1, 2, 3, 1, 2, 1, 3].map((w, i) => <View key={i} style={{ width: w, backgroundColor: t.colors.text, opacity: 0.8 }} />)}
        </View>
        <Animated.View pointerEvents="none" style={[{ position: 'absolute', top: 0, left: 14, right: 14, height: 2, backgroundColor: t.tokens.accent.glow[0] }, laser]} />
      </View>
      <Swap on={done} style={{ alignSelf: 'stretch' }}
        a={<View style={{ alignItems: 'center' }}><DemoTarget label={tr('kn.k.scan.btn')} round><Capsule label={tr('kn.k.scan.btn')} icon="maximize" /></DemoTarget></View>}
        b={<Panel style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Svg width={40} height={40}><Circle cx={20} cy={20} r={17} stroke={t.colors.success} strokeWidth={4} fill="none" /></Svg>
          <View style={{ flex: 1 }}>
            <Text weight="bold">{tr('kn.c.scanner.product')}</Text>
            <Text variant="small" color={t.colors.success} weight="bold">{tr('kn.c.scanner.verdict')}</Text>
            <Text variant="small" muted>{tr('kn.c.scanner.detail')}</Text>
          </View>
        </Panel>} />
    </View>
  );
}

// ------------------------------------------------------------------ cycle : « Mes règles ont commencé » → jour 1
function CycleDemo() {
  const t = useTheme();
  const { done } = useDemo();
  const s = CUSTOM_SAMPLE.cycle;
  const p = useDoneProgress(700);
  const size = 128;
  const r = 52;
  // le repère tourne du jour 27 au jour 1 (sens horaire, il termine le tour)
  const marker = useAnimatedStyle(() => {
    const from = ((s.dayFrom - 1) / s.length) * 360;
    return { transform: [{ rotate: `${from + (360 - from) * p.value}deg` }] };
  });
  const dots = Array.from({ length: s.length }, (_, i) => {
    const a = (i / s.length) * Math.PI * 2 - Math.PI / 2;
    return { x: size / 2 + r * Math.cos(a), y: size / 2 + r * Math.sin(a), period: i < 5 };
  });
  return (
    <View style={{ gap: spacing.sm, alignSelf: 'stretch', alignItems: 'center' }}>
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={size} height={size} style={{ position: 'absolute' }}>
          {dots.map((d, i) => <Circle key={i} cx={d.x} cy={d.y} r={3} fill={d.period ? t.colors.heart : alpha(t.colors.text, 0.25)} />)}
        </Svg>
        <Animated.View pointerEvents="none" style={[{ position: 'absolute', width: size, height: size, alignItems: 'center' }, marker]}>
          <View style={{ marginTop: size / 2 - r - 7, width: 14, height: 14, borderRadius: 7, backgroundColor: t.tokens.accent.glow[0], borderWidth: 2, borderColor: '#FFFFFF' }} />
        </Animated.View>
        <Swap on={done} a={<Text variant="heading" center>{tr('kn.c.cycle.day', { n: s.dayFrom })}</Text>} b={<Text variant="heading" center>{tr('kn.c.cycle.day', { n: 1 })}</Text>} />
      </View>
      <Swap on={done} style={{ alignSelf: 'stretch' }}
        a={<View style={{ alignItems: 'center' }}><DemoTarget label={tr('kn.c.cycle.btn')} round><Capsule label={tr('kn.c.cycle.btn')} icon="droplet" /></DemoTarget></View>}
        b={<Text variant="small" muted center>{tr('kn.c.cycle.next', { date: demoDate(s.length) })}</Text>} />
    </View>
  );
}

// ------------------------------------------------------------------ grossesse : « Semaine suivante » → 23 → 24
function PregnancyDemo() {
  const t = useTheme();
  const { done } = useDemo();
  const s = CUSTOM_SAMPLE.pregnancy;
  const p = useDoneProgress(700);
  const grow = useAnimatedStyle(() => ({ transform: [{ scale: 0.84 + 0.16 * p.value }] }));
  const w = done ? s.to : s.from;
  return (
    <View style={{ gap: spacing.sm, alignSelf: 'stretch', alignItems: 'center' }}>
      <Animated.View style={[{ width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center', backgroundColor: alpha(t.tokens.accent.glow[1], t.isDark ? 0.22 : 0.26) }, grow]}>
        <Icon name="heart" size={30} color={t.colors.heart} />
      </Animated.View>
      <Swap on={done}
        a={<Text variant="heading" center>{tr('kn.c.preg.week', { n: s.from.week })}</Text>}
        b={<Text variant="heading" center>{tr('kn.c.preg.week', { n: s.to.week })}</Text>} />
      <Text variant="small" muted center testID="demo-value">{tr('kn.c.preg.size', { cm: formatNumber(w.cm), g: formatNumber(w.g) })}</Text>
      {done ? null : <DemoTarget label={tr('kn.c.preg.btn')} round><Capsule label={tr('kn.c.preg.btn')} icon="chevron-right" /></DemoTarget>}
    </View>
  );
}

// ------------------------------------------------------------------ courses : cocher → barré chez tout le foyer
function ShoppingDemo() {
  const { done, apply } = useDemo();
  const items: TKey[] = ['kn.c.shop.i1', 'kn.c.shop.i2', 'kn.c.shop.i3'];
  return (
    <Panel style={{ alignSelf: 'stretch', gap: spacing.sm }}>
      <Text variant="small" muted>{tr('kn.c.shop.list')}</Text>
      {items.map((k, i) => (
        <View key={k} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 40 }}>
          {i === 0
            ? <DemoTarget label={tr(k)} pressable={false} round><CompletionCheck done={done} onToggle={() => apply()} label={tr('kn.c.shop.gesture')} testID="demo-target" /></DemoTarget>
            : <CompletionCheck done={false} onToggle={() => undefined} label={tr(k)} disabled />}
          <View style={{ flex: 1 }}>
            <Text style={i === 0 && done ? { textDecorationLine: 'line-through' } : undefined}>{tr(k)}</Text>
            {i === 0 ? <Reveal visible={done}><Text variant="small" muted>{tr('kn.c.shop.picked')}</Text></Reveal> : null}
          </View>
        </View>
      ))}
    </Panel>
  );
}

// ------------------------------------------------------------------ stocks : dernier paquet → ajouté aux courses
function StocksDemo() {
  const t = useTheme();
  const { done } = useDemo();
  const p = useDoneProgress(520);
  const level = useAnimatedStyle(() => ({ transform: [{ scaleX: 0.25 * (1 - p.value) }] }));
  const left = done ? 0 : CUSTOM_SAMPLE.stocks.from;
  return (
    <View style={{ gap: spacing.sm, alignSelf: 'stretch' }}>
      <Panel style={{ gap: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Icon name="package" size={20} color={t.tokens.accent.glow[0]} />
          <Text weight="bold" style={{ flex: 1 }}>{tr('kn.c.stock.item')}</Text>
        </View>
        <Text variant="small" muted testID="demo-value">{tr('kn.c.stock.left', { count: left })}</Text>
        <View style={{ height: 8, borderRadius: 4, backgroundColor: alpha(t.colors.text, 0.1), overflow: 'hidden' }}>
          <Animated.View style={[{ height: 8, width: '100%', backgroundColor: t.colors.warning, transformOrigin: 'left' }, level]} />
        </View>
      </Panel>
      <Swap on={done}
        a={<View style={{ alignItems: 'center' }}><DemoTarget label={tr('kn.c.stock.use')} round><Capsule label={tr('kn.c.stock.use')} icon="minus" /></DemoTarget></View>}
        b={<Panel style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm }}>
          <Icon name="shopping-cart" size={18} color={t.colors.success} />
          <View style={{ flex: 1 }}>
            <Text weight="bold">{tr('kn.c.stock.item')}</Text>
            <Text variant="small" muted>{tr('kn.c.stock.added')}</Text>
          </View>
        </Panel>} />
    </View>
  );
}

export function CustomDemo({ demo }: { demo: CustomDemoKey }) {
  switch (demo) {
    case 'missions': return <MissionsDemo />;
    case 'bottle': return <BottleDemo />;
    case 'sleep': return <SleepDemo />;
    case 'mood': return <MoodDemo />;
    case 'scanner': return <ScannerDemo />;
    case 'cycle': return <CycleDemo />;
    case 'pregnancy': return <PregnancyDemo />;
    case 'shopping': return <ShoppingDemo />;
    case 'stocks': return <StocksDemo />;
  }
}
