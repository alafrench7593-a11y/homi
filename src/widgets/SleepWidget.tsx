/**
 * Widget iOS « Sommeil » (27/11/2026) : sieste en cours (chrono qui avance seul) ou éveillé depuis, sommeil cumulé
 * du jour, nombre de siestes, durée de la dernière, et heures de sommeil des 7 derniers jours (graphique).
 * Contenu calculé par l'app (model.ts → sleepEntries). Règles du moteur : tout passe par les props.
 */
import { Chart, Gauge, HStack, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import { containerBackground, font, foregroundStyle, frame, gaugeStyle, lineLimit, minimumScaleFactor, monospacedDigit, privacySensitive, tint, widgetURL } from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';
import type { SleepProps } from './model';

const SleepWidgetView = (props: SleepProps, env: WidgetEnvironment) => {
  'widget';
  const dark = env.colorScheme === 'dark';
  const full = !env.widgetRenderingMode || env.widgetRenderingMode === 'fullColor';
  const C = { bg: dark ? '#121320' : '#F6F4FB', text: dark ? '#F1EFFA' : '#1E1B2E', muted: dark ? '#ABA6C4' : '#59546E', accent: full ? (dark ? '#B4A8F0' : '#5A4BB8') : (dark ? '#F1EFFA' : '#1E1B2E') };
  const fam = env.widgetFamily;
  const l = props.l || {};
  const root = [containerBackground(C.bg, 'widget'), widgetURL(props.url || 'homi://')];
  const hm = (min: number) => { const h = Math.floor(min / 60); const m = min % 60; return h ? `${h} ${l.h} ${m < 10 ? '0' : ''}${m}` : `${m} min`; };
  const label = (s: string) => <Text modifiers={[font({ textStyle: 'caption2', weight: 'semibold' }), foregroundStyle(C.muted), lineLimit(1)]}>{s}</Text>;

  if (props.s !== 'ok') {
    if (fam === 'accessoryRectangular') return <VStack alignment="leading" modifiers={[widgetURL(props.url || 'homi://')]}><Text modifiers={[font({ textStyle: 'headline' })]}>{props.title}</Text><Text modifiers={[lineLimit(2)]}>{props.msg}</Text></VStack>;
    return (
      <VStack alignment="leading" spacing={6} modifiers={root}>
        <Text modifiers={[font({ textStyle: 'headline', weight: 'bold' }), foregroundStyle(C.accent)]}>{props.title}</Text>
        <Text modifiers={[font({ textStyle: 'footnote' }), foregroundStyle(C.text), lineLimit(4)]}>{props.msg}</Text>
        <Spacer />
      </VStack>
    );
  }

  const status = (
    <VStack alignment="leading" spacing={2}>
      {label(props.asleep ? l.asleep : l.awake)}
      <Text date={new Date(props.since)} dateStyle="timer" modifiers={[font({ textStyle: 'title', weight: 'bold', design: 'rounded' }), foregroundStyle(C.text), monospacedDigit(), lineLimit(1), minimumScaleFactor(0.6)]} />
    </VStack>
  );
  const header = (
    <HStack spacing={4}>
      <Text modifiers={[font({ textStyle: 'caption', weight: 'bold' }), foregroundStyle(C.accent), lineLimit(1), privacySensitive()]}>{props.name || props.title}</Text>
      {props.more ? <Text modifiers={[font({ textStyle: 'caption2' }), foregroundStyle(C.muted), lineLimit(1)]}>{props.more}</Text> : null}
      <Spacer />
    </HStack>
  );
  // Jauge : sommeil du jour rapporté à la moyenne des 6 jours précédents (repère personnel, pas une norme)
  const ref = props.avgMin > 0 ? props.avgMin : Math.max(props.todayMin, 60);
  const gauge = (
    <Gauge value={Math.min(props.todayMin, ref)} min={0} max={ref} modifiers={[gaugeStyle('circularCapacity'), tint(C.accent)]}
      currentValueLabel={<Text modifiers={[font({ size: 11, weight: 'bold' }), monospacedDigit()]}>{String(Math.round((props.todayMin / 60) * 10) / 10)}</Text>} />
  );

  if (fam === 'accessoryRectangular') {
    return (
      <VStack alignment="leading" spacing={1} modifiers={[widgetURL(props.url || 'homi://')]}>
        <Text modifiers={[font({ textStyle: 'headline' }), lineLimit(1)]}>{props.asleep ? l.asleep : l.awake}</Text>
        <Text date={new Date(props.since)} dateStyle="timer" modifiers={[monospacedDigit(), lineLimit(1)]} />
        <Text modifiers={[monospacedDigit(), lineLimit(1)]}>{`${l.today} ${hm(props.todayMin)}`}</Text>
      </VStack>
    );
  }
  if (fam === 'systemSmall') {
    return (
      <VStack alignment="leading" spacing={6} modifiers={root}>
        {header}
        {status}
        <Spacer />
        <Text modifiers={[font({ textStyle: 'caption2', weight: 'semibold' }), foregroundStyle(C.muted), monospacedDigit(), lineLimit(1), minimumScaleFactor(0.8)]}>{`${l.today} ${hm(props.todayMin)} · ${props.naps} ${l.naps}`}</Text>
      </VStack>
    );
  }
  const stats = (
    <VStack alignment="leading" spacing={4}>
      <HStack spacing={8}>
        {gauge}
        <VStack alignment="leading" spacing={1}>
          {label(l.today)}
          <Text modifiers={[font({ textStyle: 'headline', weight: 'bold' }), foregroundStyle(C.text), monospacedDigit(), lineLimit(1)]}>{hm(props.todayMin)}</Text>
          <Text modifiers={[font({ textStyle: 'caption2' }), foregroundStyle(C.muted), monospacedDigit(), lineLimit(1)]}>{`${props.naps} ${l.naps}${props.lastMin ? ` · ${l.last} ${hm(props.lastMin)}` : ''}`}</Text>
        </VStack>
      </HStack>
    </VStack>
  );
  if (fam === 'systemMedium') {
    return (
      <VStack alignment="leading" spacing={6} modifiers={root}>
        {header}
        <HStack alignment="center" spacing={12}>
          {status}
          <Spacer />
          {stats}
        </HStack>
        <Spacer />
      </VStack>
    );
  }
  return (
    <VStack alignment="leading" spacing={10} modifiers={root}>
      {header}
      <HStack alignment="center" spacing={12}>
        {status}
        <Spacer />
        {stats}
      </HStack>
      <VStack alignment="leading" spacing={4}>
        <HStack>
          {label(l.week)}
          <Spacer />
          {props.avgMin ? <Text modifiers={[font({ textStyle: 'caption2' }), foregroundStyle(C.muted), monospacedDigit()]}>{`${l.avg} ${hm(props.avgMin)}`}</Text> : null}
        </HStack>
        <Chart type="bar" data={(props.week || []).map((w, i, a) => ({ x: w.x, y: w.y, color: i === a.length - 1 ? C.accent : C.muted }))} barStyle={{ cornerRadius: 3 }} showGrid={false} animate={false} modifiers={[frame({ height: 130 })]} />
      </VStack>
      <Spacer />
    </VStack>
  );
};

export default createWidget('SleepWidget', SleepWidgetView);
