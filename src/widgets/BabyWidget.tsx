/**
 * Widget iOS « Bébé » (27/11/2026, expo-widgets SDK 57) : dernier biberon (quantité, temps écoulé qui avance seul),
 * dernière tétée (côté, durée), totaux du jour, prochain biberon prévu et graphique des 7 derniers jours.
 * Contenu calculé par l'app (model.ts → babyEntries) à partir des vraies saisies ; prénom masqué en mode discret.
 * Règles du moteur de widget : pas de hook, pas d'état, aucune variable extérieure — tout passe par les props.
 */
import { Chart, HStack, Image, Link, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import { background, containerBackground, cornerRadius, font, foregroundStyle, frame, lineLimit, minimumScaleFactor, monospacedDigit, padding, privacySensitive, resizable, shapes, widgetURL } from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';
import type { BabyProps } from './model';

const BabyWidgetView = (props: BabyProps, env: WidgetEnvironment) => {
  'widget';
  const dark = env.colorScheme === 'dark';
  const full = !env.widgetRenderingMode || env.widgetRenderingMode === 'fullColor';
  const C = { bg: dark ? '#141416' : '#FBF8F3', text: dark ? '#F4EFE8' : '#1F1B1A', muted: dark ? '#B3ABA4' : '#5F5751', accent: full ? (dark ? '#8FB3DC' : '#2F5F93') : (dark ? '#F4EFE8' : '#1F1B1A') };
  const fam = env.widgetFamily;
  const l = props.l || {};
  const acts = (props.actions || []).slice(0, 2);
  const actionsEl = acts.length && fam !== 'systemSmall' && fam !== 'accessoryRectangular' ? <HStack spacing={6}>{acts.map((a, i) => <Link key={String(i)} destination={a.u}><Text modifiers={[font({ textStyle: 'caption', weight: 'semibold' }), foregroundStyle(full ? C.bg : C.text), lineLimit(1), padding({ horizontal: 10, vertical: 5 }), background(full ? C.accent : { type: 'hierarchical', style: 'quaternary' }, shapes.capsule())]}>{a.t}</Text></Link>)}</HStack> : null;
  const logoEl = props.logo && full ? <Image uiImage={props.logo} modifiers={[resizable(), frame({ width: 16, height: 16 }), cornerRadius(4)]} /> : null;
  const brand = <HStack spacing={5}>{logoEl}<Text modifiers={[font({ textStyle: 'caption', weight: 'bold' }), foregroundStyle(C.accent), lineLimit(1)]}>{props.title || 'HOMI'}</Text><Spacer />{actionsEl}</HStack>;
  const root = [containerBackground(C.bg, 'widget'), widgetURL(props.url || 'homi://')];
  const label = (s: string) => <Text modifiers={[font({ textStyle: 'caption2', weight: 'semibold' }), foregroundStyle(C.muted), lineLimit(1)]}>{s}</Text>;
  const big = (s: string) => <Text modifiers={[font({ textStyle: 'title2', weight: 'bold', design: 'rounded' }), foregroundStyle(C.text), monospacedDigit(), lineLimit(1), minimumScaleFactor(0.7)]}>{s}</Text>;
  const ago = (ms: number) => <Text date={new Date(ms)} dateStyle="relative" modifiers={[font({ textStyle: 'caption', weight: 'medium' }), foregroundStyle(C.accent), monospacedDigit(), lineLimit(1), minimumScaleFactor(0.7)]} />;
  const header = (
    <HStack spacing={5}>
      {logoEl}
      <Text modifiers={[font({ textStyle: 'caption', weight: 'bold' }), foregroundStyle(C.accent), lineLimit(1), privacySensitive()]}>{props.name || props.title}</Text>
      {props.more ? <Text modifiers={[font({ textStyle: 'caption2' }), foregroundStyle(C.muted), lineLimit(1)]}>{props.more}</Text> : null}
      <Spacer />
      {actionsEl}
    </HStack>
  );

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

  const bottleBlock = (
    <VStack alignment="leading" spacing={2}>
      {label(l.lastBottle)}
      {props.bottleAt ? big(props.bottleMl ? `${props.bottleMl} ${l.ml}` : '—') : big('—')}
      {props.bottleAt ? ago(props.bottleAt) : <Text modifiers={[font({ textStyle: 'caption' }), foregroundStyle(C.muted)]}>{l.none}</Text>}
    </VStack>
  );
  const feedBlock = (
    <VStack alignment="leading" spacing={2}>
      {label(props.feedOngoing ? l.ongoing : l.lastFeed)}
      {props.feedAt ? big(props.feedOngoing ? (props.feedSide || '•') : `${props.feedMin} ${l.min}`) : big('—')}
      {props.feedAt ? (props.feedOngoing
        ? <Text date={new Date(props.feedAt)} dateStyle="timer" modifiers={[font({ textStyle: 'caption', weight: 'medium' }), foregroundStyle(C.accent), monospacedDigit(), lineLimit(1)]} />
        : <HStack spacing={4}>{props.feedSide ? <Text modifiers={[font({ textStyle: 'caption' }), foregroundStyle(C.muted), lineLimit(1)]}>{props.feedSide}</Text> : null}{ago(props.feedAt)}</HStack>)
        : <Text modifiers={[font({ textStyle: 'caption' }), foregroundStyle(C.muted)]}>{l.none}</Text>}
    </VStack>
  );
  const todayLine = (
    <HStack spacing={6}>
      <Text modifiers={[font({ textStyle: 'caption', weight: 'semibold' }), foregroundStyle(C.text), monospacedDigit(), lineLimit(1)]}>{`${l.today} · ${props.todayCount} · ${props.todayMl} ${l.ml}`}</Text>
      <Spacer />
      {props.nextAt ? <HStack spacing={3}><Text modifiers={[font({ textStyle: 'caption2' }), foregroundStyle(C.muted), lineLimit(1)]}>{l.next}</Text><Text date={new Date(props.nextAt)} dateStyle="time" modifiers={[font({ textStyle: 'caption', weight: 'bold' }), foregroundStyle(C.accent), monospacedDigit()]} /></HStack> : null}
    </HStack>
  );

  if (fam === 'accessoryRectangular') {
    return (
      <VStack alignment="leading" spacing={1} modifiers={[widgetURL(props.url || 'homi://')]}>
        <Text modifiers={[font({ textStyle: 'headline' }), lineLimit(1), privacySensitive()]}>{props.bottleAt ? `${l.lastBottle} ${props.bottleMl ? props.bottleMl + ' ' + l.ml : ''}` : l.lastFeed}</Text>
        {props.bottleAt ? <Text date={new Date(props.bottleAt)} dateStyle="relative" modifiers={[monospacedDigit(), lineLimit(1)]} /> : props.feedAt ? <Text date={new Date(props.feedAt)} dateStyle="relative" modifiers={[monospacedDigit(), lineLimit(1)]} /> : <Text>{l.none}</Text>}
        <Text modifiers={[monospacedDigit(), lineLimit(1)]}>{`${l.today} · ${props.todayMl} ${l.ml}`}</Text>
      </VStack>
    );
  }
  if (fam === 'systemSmall') {
    return (
      <VStack alignment="leading" spacing={6} modifiers={root}>
        {header}
        {props.bottleAt || !props.feedAt ? bottleBlock : feedBlock}
        <Spacer />
        <Text modifiers={[font({ textStyle: 'caption2', weight: 'semibold' }), foregroundStyle(C.muted), monospacedDigit(), lineLimit(1), minimumScaleFactor(0.8)]}>{`${l.today} · ${props.todayCount} · ${props.todayMl} ${l.ml}`}</Text>
      </VStack>
    );
  }
  const chart = (h: number) => (
    <Chart type="bar" data={(props.week || []).map((w, i, a) => ({ x: w.x, y: w.y, color: i === a.length - 1 ? C.accent : C.muted }))}
      barStyle={{ cornerRadius: 3 }} showGrid={false} animate={false} modifiers={[frame({ height: h })]} />
  );
  if (fam === 'systemMedium') {
    return (
      <VStack alignment="leading" spacing={6} modifiers={root}>
        {header}
        <HStack alignment="top" spacing={12}>
          {bottleBlock}
          <Spacer />
          {feedBlock}
          <Spacer />
        </HStack>
        <Spacer />
        {todayLine}
      </VStack>
    );
  }
  return (
    <VStack alignment="leading" spacing={10} modifiers={root}>
      {header}
      <HStack alignment="top" spacing={12}>
        {bottleBlock}
        <Spacer />
        {feedBlock}
        <Spacer />
      </HStack>
      {todayLine}
      <VStack alignment="leading" spacing={4}>
        <HStack>
          {label(l.week)}
          <Spacer />
          {props.avgMl ? <Text modifiers={[font({ textStyle: 'caption2' }), foregroundStyle(C.muted), monospacedDigit()]}>{`${l.avg} ${props.avgMl} ${l.ml}`}</Text> : null}
        </HStack>
        {chart(120)}
      </VStack>
      <Spacer />
    </VStack>
  );
};

export default createWidget('BabyWidget', BabyWidgetView);
