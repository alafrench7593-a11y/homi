/**
 * Widget iOS « Tâches de la famille » (27/11/2026) : tâches restantes, tâches faites sur 7 jours (jauge de progression
 * et graphique par jour), tâches en retard, les miennes, et la liste des prochaines tâches (échéance, retard).
 * Lecture seule (pas de case à cocher dans le widget : la synchronisation avec le coparent reste dans l'app).
 * Intitulés masqués en mode discret. Règles du moteur : tout passe par les props.
 */
import { Chart, Gauge, HStack, Image, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import { containerBackground, cornerRadius, font, foregroundStyle, frame, gaugeStyle, lineLimit, minimumScaleFactor, monospacedDigit, privacySensitive, resizable, tint, widgetURL } from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';
import type { TasksProps } from './model';

const TasksWidgetView = (props: TasksProps, env: WidgetEnvironment) => {
  'widget';
  const dark = env.colorScheme === 'dark';
  const full = !env.widgetRenderingMode || env.widgetRenderingMode === 'fullColor';
  const C = { bg: dark ? '#101614' : '#F4F8F5', text: dark ? '#EAF3EE' : '#18241E', muted: dark ? '#A2B5AA' : '#4F6157', accent: full ? (dark ? '#7CCFA3' : '#23704A') : (dark ? '#EAF3EE' : '#18241E'), late: full ? (dark ? '#FF8A80' : '#B3261E') : (dark ? '#EAF3EE' : '#18241E') };
  const fam = env.widgetFamily;
  const l = props.l || {};
  const logoEl = props.logo && full ? <Image uiImage={props.logo} modifiers={[resizable(), frame({ width: 16, height: 16 }), cornerRadius(4)]} /> : null;
  const brand = <HStack spacing={5}>{logoEl}<Text modifiers={[font({ textStyle: 'caption', weight: 'bold' }), foregroundStyle(C.accent), lineLimit(1)]}>{props.title || 'HOMI'}</Text><Spacer /></HStack>;
  const root = [containerBackground(C.bg, 'widget'), widgetURL(props.url || 'homi://')];
  const pct = Math.round((props.pct || 0) * 100);
  const label = (s: string) => <Text modifiers={[font({ textStyle: 'caption2', weight: 'semibold' }), foregroundStyle(C.muted), lineLimit(1)]}>{s}</Text>;

  if (props.s !== 'ok') {
    if (fam === 'accessoryRectangular') return <VStack alignment="leading" modifiers={[widgetURL(props.url || 'homi://')]}><Text modifiers={[font({ textStyle: 'headline' })]}>{props.title || 'HOMI'}</Text><Text modifiers={[lineLimit(2)]}>{props.msg || 'Ouvre HOMI.'}</Text></VStack>;
    return (
      <VStack alignment="leading" spacing={6} modifiers={root}>
        {brand}
        <Text modifiers={[font({ textStyle: 'footnote' }), foregroundStyle(C.text), lineLimit(4)]}>{props.msg || 'Ouvre HOMI pour afficher tes informations ici.'}</Text>
        <Spacer />
      </VStack>
    );
  }

  const ring = (
    <Gauge value={props.pct} min={0} max={1} modifiers={[gaugeStyle('circularCapacity'), tint(C.accent)]}
      currentValueLabel={<Text modifiers={[font({ size: 12, weight: 'bold', design: 'rounded' }), monospacedDigit()]}>{`${pct}%`}</Text>} />
  );
  const counts = (
    <VStack alignment="leading" spacing={1}>
      <Text modifiers={[font({ textStyle: 'title2', weight: 'bold', design: 'rounded' }), foregroundStyle(C.text), monospacedDigit(), lineLimit(1)]}>{String(props.open)}</Text>
      {label(l.open)}
    </VStack>
  );
  const chips = (
    <HStack spacing={10}>
      <Text modifiers={[font({ textStyle: 'caption', weight: 'semibold' }), foregroundStyle(C.accent), monospacedDigit(), lineLimit(1)]}>{`${props.doneWeek} ${l.done}`}</Text>
      {props.late ? <Text modifiers={[font({ textStyle: 'caption', weight: 'semibold' }), foregroundStyle(C.late), monospacedDigit(), lineLimit(1)]}>{`${props.late} ${l.late}`}</Text> : null}
      {props.mine ? <Text modifiers={[font({ textStyle: 'caption', weight: 'semibold' }), foregroundStyle(C.muted), monospacedDigit(), lineLimit(1)]}>{`${props.mine} ${l.mine}`}</Text> : null}
    </HStack>
  );
  const row = (r: { t: string; due: number; late: boolean; mine: boolean }, i: number) => (
    <HStack key={String(i)} spacing={6}>
      <Text modifiers={[font({ textStyle: 'caption', weight: 'bold' }), foregroundStyle(r.late ? C.late : C.accent)]}>{r.mine ? '●' : '○'}</Text>
      <Text modifiers={[font({ textStyle: 'footnote', weight: 'medium' }), foregroundStyle(C.text), lineLimit(1), privacySensitive()]}>{r.t}</Text>
      <Spacer />
      {r.due ? <Text date={new Date(r.due)} dateStyle={r.late ? 'relative' : 'date'} modifiers={[font({ textStyle: 'caption2' }), foregroundStyle(r.late ? C.late : C.muted), monospacedDigit(), lineLimit(1)]} /> : <Text modifiers={[font({ textStyle: 'caption2' }), foregroundStyle(C.muted), lineLimit(1)]}>{l.noDue}</Text>}
    </HStack>
  );
  const rows = props.rows || [];

  if (fam === 'accessoryRectangular') {
    return (
      <VStack alignment="leading" spacing={1} modifiers={[widgetURL(props.url || 'homi://')]}>
        <Text modifiers={[font({ textStyle: 'headline' }), monospacedDigit(), lineLimit(1)]}>{`${props.open} ${l.open}`}</Text>
        {rows[0] ? <Text modifiers={[lineLimit(1), privacySensitive()]}>{rows[0].t}</Text> : null}
        <Text modifiers={[monospacedDigit(), lineLimit(1)]}>{`${props.doneWeek} ${l.done}`}</Text>
      </VStack>
    );
  }
  if (fam === 'systemSmall') {
    return (
      <VStack alignment="leading" spacing={6} modifiers={root}>
        <HStack alignment="top" spacing={8}>{counts}<Spacer />{logoEl}</HStack>
        <Spacer />
        {rows[0] ? <Text modifiers={[font({ textStyle: 'footnote', weight: 'medium' }), foregroundStyle(C.text), lineLimit(2), minimumScaleFactor(0.85), privacySensitive()]}>{rows[0].t}</Text> : null}
        <Text modifiers={[font({ textStyle: 'caption2', weight: 'semibold' }), foregroundStyle(props.late ? C.late : C.accent), monospacedDigit(), lineLimit(1)]}>{props.late ? `${props.late} ${l.late}` : `${props.doneWeek} ${l.done}`}</Text>
      </VStack>
    );
  }
  if (fam === 'systemMedium') {
    return (
      <HStack alignment="top" spacing={14} modifiers={root}>
        <VStack alignment="leading" spacing={6}>
          {brand}
          <HStack spacing={8}>{counts}{ring}</HStack>
          <Spacer />
          {chips}
        </VStack>
        <VStack alignment="leading" spacing={5}>
          {rows.slice(0, 3).map(row)}
          <Spacer />
        </VStack>
      </HStack>
    );
  }
  return (
    <VStack alignment="leading" spacing={10} modifiers={root}>
      {brand}
      <HStack spacing={12}>{counts}<Spacer />{ring}</HStack>
      {chips}
      <VStack alignment="leading" spacing={6}>{rows.slice(0, 5).map(row)}</VStack>
      <Spacer />
      <VStack alignment="leading" spacing={3}>
        {label(l.week)}
        <Chart type="bar" data={(props.week || []).map((w, i, a) => ({ x: w.x, y: w.y, color: i === a.length - 1 ? C.accent : C.muted }))} barStyle={{ cornerRadius: 3 }} showGrid={false} animate={false} modifiers={[frame({ height: 70 })]} />
      </VStack>
    </VStack>
  );
};

export default createWidget('TasksWidget', TasksWidgetView);
