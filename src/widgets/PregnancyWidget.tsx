/**
 * Widget iOS « Grossesse » (27/11/2026) : semaine d'aménorrhée, trimestre, progression jusqu'au terme (jauge et
 * barre), jours restants et prochain rendez-vous. Une entrée par jour : la semaine avance seule à minuit.
 * DISCRET par défaut (ni le mot « grossesse » ni l'intitulé du rendez-vous) ; textes marqués sensibles.
 */
import { Gauge, HStack, Image, Link, ProgressView, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import { background, containerBackground, cornerRadius, font, foregroundStyle, frame, gaugeStyle, lineLimit, minimumScaleFactor, monospacedDigit, padding, privacySensitive, resizable, shapes, tint, widgetURL } from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';
import type { PregnancyProps } from './model';

const PregnancyWidgetView = (props: PregnancyProps, env: WidgetEnvironment) => {
  'widget';
  const dark = env.colorScheme === 'dark';
  const full = !env.widgetRenderingMode || env.widgetRenderingMode === 'fullColor';
  const C = { bg: dark ? '#17140E' : '#FBF7EE', text: dark ? '#F6F0E2' : '#2A2416', muted: dark ? '#C0B496' : '#62583F', accent: full ? (dark ? '#E7C27A' : '#8A6414') : (dark ? '#F6F0E2' : '#2A2416') };
  const fam = env.widgetFamily;
  const l = props.l || {};
  const acts = (props.actions || []).slice(0, 2);
  const actionsEl = acts.length && fam !== 'systemSmall' && fam !== 'accessoryRectangular' ? <HStack spacing={6}>{acts.map((a, i) => <Link key={String(i)} destination={a.u}><Text modifiers={[font({ textStyle: 'caption', weight: 'semibold' }), foregroundStyle(full ? C.bg : C.text), lineLimit(1), padding({ horizontal: 10, vertical: 5 }), background(full ? C.accent : { type: 'hierarchical', style: 'quaternary' }, shapes.capsule())]}>{a.t}</Text></Link>)}</HStack> : null;
  const logoEl = props.logo && full ? <Image uiImage={props.logo} modifiers={[resizable(), frame({ width: 16, height: 16 }), cornerRadius(4)]} /> : null;
  const brand = <HStack spacing={5}>{logoEl}<Text modifiers={[font({ textStyle: 'caption', weight: 'bold' }), foregroundStyle(C.accent), lineLimit(1)]}>{props.title || 'HOMI'}</Text><Spacer />{actionsEl}</HStack>;
  const det = !!props.detailed;
  const root = [containerBackground(C.bg, 'widget'), widgetURL(props.url || 'homi://')];
  const pct = Math.round((props.pct || 0) * 100);
  const weekText = det ? `${l.week} ${props.week}${props.extra ? ` + ${props.extra}` : ''}` : `${l.weekDiscreet} ${props.week}`;
  const dueLabel = det ? l.toDue : l.toDueDiscreet;
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
    <Gauge value={props.pct} min={0} max={1} modifiers={[gaugeStyle('circularCapacity'), tint(C.accent), privacySensitive()]} />
  );
  const week = <Text modifiers={[font({ textStyle: 'headline', weight: 'bold' }), foregroundStyle(C.text), lineLimit(1), minimumScaleFactor(0.8), privacySensitive()]}>{weekText}</Text>;
  const due = (
    <VStack alignment="leading" spacing={1}>
      {label(dueLabel)}
      <Text modifiers={[font({ textStyle: 'title3', weight: 'bold', design: 'rounded' }), foregroundStyle(C.accent), monospacedDigit(), lineLimit(1), privacySensitive()]}>{`${props.toDue} ${l.days}`}</Text>
    </VStack>
  );
  const appt = props.apptAt
    ? (
      <VStack alignment="leading" spacing={1}>
        {label(det ? l.appt : l.apptDiscreet)}
        <HStack spacing={4}>
          {props.apptTitle ? <Text modifiers={[font({ textStyle: 'caption', weight: 'semibold' }), foregroundStyle(C.text), lineLimit(1), privacySensitive()]}>{props.apptTitle}</Text> : null}
          <Text date={new Date(props.apptAt)} dateStyle="date" modifiers={[font({ textStyle: 'caption' }), foregroundStyle(C.muted), lineLimit(1)]} />
          <Text date={new Date(props.apptAt)} dateStyle="time" modifiers={[font({ textStyle: 'caption' }), foregroundStyle(C.muted), lineLimit(1)]} />
        </HStack>
      </VStack>
    ) : null;

  if (fam === 'accessoryRectangular') {
    return (
      <VStack alignment="leading" spacing={1} modifiers={[widgetURL(props.url || 'homi://')]}>
        <Text modifiers={[font({ textStyle: 'headline' }), lineLimit(1), privacySensitive()]}>{weekText}</Text>
        <ProgressView value={props.pct} modifiers={[privacySensitive()]} />
        <Text modifiers={[lineLimit(1), monospacedDigit(), privacySensitive()]}>{`${dueLabel} ${props.toDue} ${l.days}`}</Text>
      </VStack>
    );
  }
  if (fam === 'systemSmall') {
    return (
      <VStack alignment="leading" spacing={6} modifiers={root}>
        <HStack alignment="top">{ring}<Spacer />{logoEl}</HStack>
        {week}
        <Text modifiers={[font({ textStyle: 'caption', weight: 'semibold' }), foregroundStyle(C.accent), monospacedDigit(), lineLimit(1), minimumScaleFactor(0.8), privacySensitive()]}>{`${dueLabel} · ${props.toDue} ${l.days}`}</Text>
        <Spacer />
      </VStack>
    );
  }
  return (
    <VStack alignment="leading" spacing={fam === 'systemLarge' ? 14 : 8} modifiers={root}>
      {brand}
      <HStack alignment="center" spacing={14}>
        {ring}
        <VStack alignment="leading" spacing={2}>
          {week}
          {det ? <Text modifiers={[font({ textStyle: 'caption' }), foregroundStyle(C.muted), lineLimit(1)]}>{`${l.tri} ${props.tri}`}</Text> : null}
        </VStack>
        <Spacer />
        {due}
      </HStack>
      <VStack alignment="leading" spacing={3}>
        <ProgressView value={props.pct} modifiers={[tint(C.accent), privacySensitive()]} />
        <Text modifiers={[font({ textStyle: 'caption2' }), foregroundStyle(C.muted), monospacedDigit()]}>{`${pct} %`}</Text>
      </VStack>
      {fam === 'systemLarge' ? appt : null}
      <Spacer />
    </VStack>
  );
};

export default createWidget('PregnancyWidget', PregnancyWidgetView);
