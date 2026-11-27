/**
 * Widget iOS « Planning » (27/11/2026) : prochain rendez-vous avec compte à rebours qui avance seul, nombre de
 * rendez-vous aujourd'hui et sur 7 jours, et la liste des suivants. Un rendez-vous passé disparaît à son heure
 * (frise d'entrées). Intitulés et lieux masqués en mode discret ; textes marqués sensibles.
 */
import { HStack, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import { containerBackground, font, foregroundStyle, lineLimit, minimumScaleFactor, monospacedDigit, privacySensitive, widgetURL } from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';
import type { PlanningProps } from './model';

const PlanningWidgetView = (props: PlanningProps, env: WidgetEnvironment) => {
  'widget';
  const dark = env.colorScheme === 'dark';
  const full = !env.widgetRenderingMode || env.widgetRenderingMode === 'fullColor';
  const C = { bg: dark ? '#0F1319' : '#F4F7FB', text: dark ? '#EAF0F8' : '#16202E', muted: dark ? '#A3B0C2' : '#4E5C70', accent: full ? (dark ? '#8DB8F2' : '#2558A6') : (dark ? '#EAF0F8' : '#16202E') };
  const fam = env.widgetFamily;
  const l = props.l || {};
  const root = [containerBackground(C.bg, 'widget'), widgetURL(props.url || 'homi://')];
  const rows = props.rows || [];
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

  const first = rows[0];
  const hero = (
    <VStack alignment="leading" spacing={2}>
      {label(l.next)}
      <Text modifiers={[font({ textStyle: 'headline', weight: 'bold' }), foregroundStyle(C.text), lineLimit(2), minimumScaleFactor(0.85), privacySensitive()]}>{first.t}</Text>
      <HStack spacing={4}>
        <Text date={new Date(first.at)} dateStyle="date" modifiers={[font({ textStyle: 'caption', weight: 'semibold' }), foregroundStyle(C.accent), lineLimit(1)]} />
        <Text date={new Date(first.at)} dateStyle="time" modifiers={[font({ textStyle: 'caption', weight: 'semibold' }), foregroundStyle(C.accent), lineLimit(1)]} />
      </HStack>
      <HStack spacing={3}>
        <Text modifiers={[font({ textStyle: 'caption2' }), foregroundStyle(C.muted), lineLimit(1)]}>{l.in}</Text>
        <Text date={new Date(first.at)} dateStyle="relative" modifiers={[font({ textStyle: 'caption2', weight: 'semibold' }), foregroundStyle(C.muted), monospacedDigit(), lineLimit(1)]} />
      </HStack>
      {first.place ? <Text modifiers={[font({ textStyle: 'caption2' }), foregroundStyle(C.muted), lineLimit(1), privacySensitive()]}>{first.place}</Text> : null}
    </VStack>
  );
  const counts = (
    <HStack spacing={10}>
      <Text modifiers={[font({ textStyle: 'caption', weight: 'semibold' }), foregroundStyle(C.accent), monospacedDigit(), lineLimit(1)]}>{`${props.todayN} ${l.today}`}</Text>
      <Text modifiers={[font({ textStyle: 'caption', weight: 'semibold' }), foregroundStyle(C.muted), monospacedDigit(), lineLimit(1)]}>{`${props.week} ${l.week}`}</Text>
    </HStack>
  );
  const row = (r: { t: string; at: number; place: string }, i: number) => (
    <HStack key={String(i)} spacing={8}>
      <VStack alignment="leading" spacing={0}>
        <Text date={new Date(r.at)} dateStyle="date" modifiers={[font({ textStyle: 'caption2', weight: 'bold' }), foregroundStyle(C.accent), lineLimit(1)]} />
        <Text date={new Date(r.at)} dateStyle="time" modifiers={[font({ textStyle: 'caption2' }), foregroundStyle(C.muted), monospacedDigit(), lineLimit(1)]} />
      </VStack>
      <Text modifiers={[font({ textStyle: 'footnote', weight: 'medium' }), foregroundStyle(C.text), lineLimit(1), privacySensitive()]}>{r.t}</Text>
      <Spacer />
    </HStack>
  );

  if (fam === 'accessoryRectangular') {
    return (
      <VStack alignment="leading" spacing={1} modifiers={[widgetURL(props.url || 'homi://')]}>
        <Text modifiers={[font({ textStyle: 'headline' }), lineLimit(1), privacySensitive()]}>{first.t}</Text>
        <Text date={new Date(first.at)} dateStyle="date" modifiers={[lineLimit(1)]} />
        <Text date={new Date(first.at)} dateStyle="time" modifiers={[lineLimit(1)]} />
      </VStack>
    );
  }
  if (fam === 'systemSmall') {
    return (
      <VStack alignment="leading" spacing={4} modifiers={root}>
        {hero}
        <Spacer />
        {counts}
      </VStack>
    );
  }
  if (fam === 'systemMedium') {
    return (
      <HStack alignment="top" spacing={14} modifiers={root}>
        <VStack alignment="leading" spacing={4}>
          {hero}
          <Spacer />
          {counts}
        </VStack>
        <VStack alignment="leading" spacing={6}>
          {rows.slice(1, 3).map(row)}
          <Spacer />
        </VStack>
      </HStack>
    );
  }
  return (
    <VStack alignment="leading" spacing={12} modifiers={root}>
      <Text modifiers={[font({ textStyle: 'caption', weight: 'bold' }), foregroundStyle(C.accent), lineLimit(1)]}>{props.title}</Text>
      {hero}
      {counts}
      <VStack alignment="leading" spacing={8}>{rows.slice(1, 5).map(row)}</VStack>
      <Spacer />
    </VStack>
  );
};

export default createWidget('PlanningWidget', PlanningWidgetView);
