/**
 * Widget iOS « Mon cycle » (27/11/2026) : jour du cycle (jauge), compte à rebours jusqu'aux prochaines règles,
 * fenêtre fertile estimée, prise du jour de la contraception orale. Une entrée par jour : il avance seul à minuit.
 * DISCRET par défaut (aucun mot lié aux règles ni à la contraception) ; détaillé seulement si la personne le choisit ;
 * « protégé » si le cycle est masqué ou verrouillé dans l'app. Textes marqués sensibles (masqués iPhone verrouillé).
 */
import { Gauge, HStack, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import { containerBackground, font, foregroundStyle, gaugeStyle, lineLimit, minimumScaleFactor, monospacedDigit, privacySensitive, tint, widgetURL } from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';
import type { CycleProps } from './model';

const CycleWidgetView = (props: CycleProps, env: WidgetEnvironment) => {
  'widget';
  const dark = env.colorScheme === 'dark';
  const full = !env.widgetRenderingMode || env.widgetRenderingMode === 'fullColor';
  const C = { bg: dark ? '#17121A' : '#FCF6F7', text: dark ? '#F7EEF1' : '#2A1A20', muted: dark ? '#BFA9B1' : '#6A5359', accent: full ? (dark ? '#F0A3B8' : '#A8435F') : (dark ? '#F7EEF1' : '#2A1A20') };
  const fam = env.widgetFamily;
  const l = props.l || {};
  const det = !!props.detailed;
  const root = [containerBackground(C.bg, 'widget'), widgetURL(props.url || 'homi://')];
  const nextLabel = det ? l.next : l.nextDiscreet;
  const untilText = props.until === 0 ? l.today : props.until > 0 ? `${props.until} ${l.days}` : '—';
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

  const ring = (
    <Gauge value={props.day} min={1} max={props.len} modifiers={[gaugeStyle('circularCapacity'), tint(C.accent), privacySensitive()]}
      currentValueLabel={<Text modifiers={[font({ size: 14, weight: 'bold', design: 'rounded' }), monospacedDigit()]}>{String(props.day)}</Text>} />
  );
  const dayText = <Text modifiers={[font({ textStyle: 'headline', weight: 'bold' }), foregroundStyle(C.text), lineLimit(1), privacySensitive()]}>{`${l.day} ${props.day}`}</Text>;
  const until = (
    <VStack alignment="leading" spacing={1}>
      {label(nextLabel)}
      <Text modifiers={[font({ textStyle: 'title3', weight: 'bold', design: 'rounded' }), foregroundStyle(C.accent), monospacedDigit(), lineLimit(1), minimumScaleFactor(0.7), privacySensitive()]}>{untilText}</Text>
    </VStack>
  );
  const fertile = det && (props.fertile || props.fertileIn > 0)
    ? <Text modifiers={[font({ textStyle: 'caption', weight: 'semibold' }), foregroundStyle(C.text), lineLimit(1), privacySensitive()]}>{props.fertile ? l.fertile : `${l.fertileSoon} ${props.fertileIn} ${l.days}`}</Text>
    : null;
  const pill = props.pill
    ? <HStack spacing={4}><Text modifiers={[font({ textStyle: 'caption', weight: 'semibold' }), foregroundStyle(C.muted), lineLimit(1)]}>{l.pill}</Text><Text modifiers={[font({ textStyle: 'caption', weight: 'bold' }), foregroundStyle(props.pill === 'done' ? C.accent : C.text), lineLimit(1), privacySensitive()]}>{props.pill === 'done' ? l.pillDone : l.pillTodo}</Text></HStack>
    : null;

  if (fam === 'accessoryRectangular') {
    return (
      <VStack alignment="leading" spacing={1} modifiers={[widgetURL(props.url || 'homi://')]}>
        <Text modifiers={[font({ textStyle: 'headline' }), lineLimit(1), privacySensitive()]}>{`${l.day} ${props.day}`}</Text>
        <Text modifiers={[lineLimit(1), privacySensitive()]}>{`${nextLabel} : ${untilText}`}</Text>
        {props.pill ? <Text modifiers={[lineLimit(1), privacySensitive()]}>{`${l.pill} ${props.pill === 'done' ? l.pillDone : l.pillTodo}`}</Text> : null}
      </VStack>
    );
  }
  if (fam === 'systemSmall') {
    return (
      <VStack alignment="leading" spacing={6} modifiers={root}>
        <HStack>{ring}<Spacer /></HStack>
        {dayText}
        <Text modifiers={[font({ textStyle: 'caption', weight: 'semibold' }), foregroundStyle(C.accent), monospacedDigit(), lineLimit(1), minimumScaleFactor(0.8), privacySensitive()]}>{`${nextLabel} · ${untilText}`}</Text>
        <Spacer />
        {pill}
      </VStack>
    );
  }
  return (
    <VStack alignment="leading" spacing={fam === 'systemLarge' ? 14 : 8} modifiers={root}>
      <Text modifiers={[font({ textStyle: 'caption', weight: 'bold' }), foregroundStyle(C.accent), lineLimit(1)]}>{props.title}</Text>
      <HStack alignment="center" spacing={14}>
        {ring}
        <VStack alignment="leading" spacing={2}>
          {dayText}
          <Text modifiers={[font({ textStyle: 'caption' }), foregroundStyle(C.muted), monospacedDigit(), lineLimit(1)]}>{`/ ${props.len}`}</Text>
        </VStack>
        <Spacer />
        {until}
      </HStack>
      {fertile}
      {pill}
      <Spacer />
    </VStack>
  );
};

export default createWidget('CycleWidget', CycleWidgetView);
