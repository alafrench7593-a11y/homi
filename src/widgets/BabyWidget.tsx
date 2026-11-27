/**
 * Widget iOS « Bébé » (expo-widgets SDK 57) : dernier biberon (quantité, temps écoulé qui avance seul), dernière
 * tétée (côté, durée, chrono si en cours), totaux du jour, prochain biberon prévu et barres des 7 derniers jours
 * (moyenne en pointillés). Contenu calculé par l'app (model.ts → babyEntries) ; prénom masqué en mode discret.
 * Règles du moteur de widget : pas de hook, pas d'état, aucune variable extérieure — tout passe par les props.
 */
import type { ReactNode } from 'react';
import { Chart, HStack, Image, Link, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import { background, containerBackground, cornerRadius, font, foregroundStyle, frame, lineLimit, minimumScaleFactor, monospacedDigit, padding, privacySensitive, resizable, shapes, widgetURL } from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';
import type { BabyProps } from './model';

type P = BabyProps;
type TS = NonNullable<Parameters<typeof font>[0]['textStyle']>;
type FW = NonNullable<Parameters<typeof font>[0]['weight']>;
type FS = Parameters<typeof foregroundStyle>[0];
type DS = 'timer' | 'relative' | 'offset' | 'date' | 'time';

const BabyWidgetView = (props: P, env: WidgetEnvironment) => {
  'widget';
  const dark = env.colorScheme === 'dark';
  const full = !env.widgetRenderingMode || env.widgetRenderingMode === 'fullColor';
  const fam = env.widgetFamily;
  const lock = fam === 'accessoryRectangular';
  const small = fam === 'systemSmall';
  const large = fam === 'systemLarge';
  // Palette locale (le moteur du widget n'a accès à aucun jeton) ; en mode teinté, iOS recolore : tons neutres
  const C = {
    bg: dark ? '#141416' : '#FBF8F3', text: dark ? '#F4EFE8' : '#1F1B1A', muted: dark ? '#B3ABA4' : '#5F5751',
    accent: full ? (dark ? '#8FB3DC' : '#2F5F93') : (dark ? '#F4EFE8' : '#1F1B1A'),
    soft: full ? (dark ? '#3A4D66' : '#C3D3E6') : (dark ? '#6F6A66' : '#B4ADA7'),
    warn: full ? (dark ? '#F2A38C' : '#A7402A') : (dark ? '#F4EFE8' : '#1F1B1A'),
  };
  const l = props.l || ({} as P['l']);
  const url = props.url || 'homi://';
  const root = [containerBackground(C.bg, 'widget'), widgetURL(url)];
  const sec: FS = { type: 'hierarchical', style: 'secondary' };
  // Une ligne par défaut, réduite plutôt que coupée ; k = sensible (masqué quand l'iPhone est verrouillé)
  const tx = (s: string, size: TS, color: FS | null, o: { w?: FW; n?: number; k?: boolean; r?: boolean } = {}) => (
    <Text modifiers={[font({ textStyle: size, weight: o.w || 'regular', design: o.r ? 'rounded' : 'default' }), ...(color ? [foregroundStyle(color)] : []), monospacedDigit(), lineLimit(o.n || 1), minimumScaleFactor(o.n && o.n > 1 ? 0.8 : 0.6), ...(o.k ? [privacySensitive()] : [])]}>{s}</Text>
  );
  // Heure, date ou durée qui avance seule (dessinée par iOS, sans réveiller l'app)
  const td = (at: number, style: DS, size: TS, color: FS | null, o: { w?: FW; k?: boolean } = {}) => (
    <Text date={new Date(at)} dateStyle={style} modifiers={[font({ textStyle: size, weight: o.w || 'regular' }), ...(color ? [foregroundStyle(color)] : []), monospacedDigit(), lineLimit(1), minimumScaleFactor(0.6), ...(o.k ? [privacySensitive()] : [])]} />
  );
  const cap = (s: string) => tx(s, 'caption2', C.muted, { w: 'semibold' });
  const logoEl = props.logo && full ? <Image uiImage={props.logo} modifiers={[resizable(), frame({ width: 18, height: 18 }), cornerRadius(5)]} /> : null;
  const acts = (props.actions || []).slice(0, 2);
  const pillLink = (t: string, u: string, key: string) => (
    <Link key={key} destination={u}><Text modifiers={[font({ textStyle: 'caption', weight: 'semibold' }), foregroundStyle(full ? C.bg : C.text), lineLimit(1), minimumScaleFactor(0.7), padding({ horizontal: 10, vertical: 5 }), background(full ? C.accent : { type: 'hierarchical', style: 'quaternary' }, shapes.capsule())]}>{t}</Text></Link>
  );
  const actionsEl = acts.length && !small && !lock ? <HStack spacing={6}>{acts.map((a, i) => pillLink(a.t, a.u, String(i)))}</HStack> : null;
  const head = (title: string, k: boolean, extra?: string) => (
    <HStack spacing={6}>{logoEl}{tx(title, 'caption', C.accent, { w: 'bold', k })}{extra ? tx(extra, 'caption2', C.muted) : null}<Spacer />{actionsEl}</HStack>
  );
  if (props.s !== 'ok') {
    if (lock) return <VStack alignment="leading" spacing={1} modifiers={[widgetURL(url)]}>{tx(props.title || 'HOMI', 'headline', null, { w: 'semibold' })}{tx(props.msg || '', 'caption', sec, { n: 2 })}</VStack>;
    return (
      <VStack alignment="leading" spacing={8} modifiers={root}>
        {head(props.title || 'HOMI', false)}
        {tx(props.msg || '', 'footnote', C.text, { n: small ? 5 : 3 })}
        <Spacer />
      </VStack>
    );
  }
  // Barres des 7 jours : aujourd'hui en couleur, moyenne en pointillés, jour sous chaque barre
  const bars = (data: { x: string; y: number }[], avg: number, h: number) => (
    <VStack alignment="leading" spacing={3}>
      <Chart type="bar" data={data.map((w, i, a) => ({ x: w.x, y: w.y, color: i === a.length - 1 ? C.accent : C.soft }))} referenceLines={avg > 0 ? [{ x: 'avg', y: avg, color: C.muted }] : []} ruleStyle={{ lineWidth: 1, dashArray: [3, 3] }} barStyle={{ cornerRadius: 4 }} showGrid={false} animate={false} modifiers={[frame({ height: h })]} />
      <HStack spacing={0}>{data.map((w, i, a) => <Text key={String(i)} modifiers={[font({ textStyle: 'caption2', weight: i === a.length - 1 ? 'bold' : 'regular' }), foregroundStyle(i === a.length - 1 ? C.accent : C.muted), lineLimit(1), minimumScaleFactor(0.5), frame({ maxWidth: 9999 })]}>{w.x}</Text>)}</HStack>
    </VStack>
  );
  const name = props.name || props.title;
  const bottleV = props.bottleAt && props.bottleMl ? `${props.bottleMl} ${l.ml}` : '—';
  const feedV = props.feedAt ? (props.feedOngoing ? (props.feedSide || '•') : `${props.feedMin} ${l.min}`) : '—';
  const todayS = `${props.todayCount} · ${props.todayMl} ${l.ml}`;
  const stat = (label: string, value: string, sub: ReactNode) => (
    <VStack alignment="leading" spacing={2}>{cap(label)}{tx(value, 'title2', C.text, { w: 'bold', r: true })}{sub}</VStack>
  );
  const bottleBlock = stat(l.lastBottle, bottleV, props.bottleAt ? td(props.bottleAt, 'relative', 'caption', C.accent, { w: 'semibold' }) : tx(l.none, 'caption', C.muted));
  const feedBlock = stat(props.feedOngoing ? l.ongoing : l.lastFeed, feedV, props.feedAt
    ? (props.feedOngoing ? td(props.feedAt, 'timer', 'caption', C.accent, { w: 'semibold' })
      : <HStack spacing={4}>{props.feedSide ? tx(props.feedSide, 'caption', C.muted) : null}{td(props.feedAt, 'relative', 'caption', C.accent, { w: 'semibold' })}</HStack>)
    : tx(l.none, 'caption', C.muted));
  const todayBlock = stat(l.today, String(props.todayCount), tx(`${props.todayMl} ${l.ml}`, 'caption', C.muted, { w: 'semibold' }));
  const next = props.nextAt ? <HStack spacing={4}>{cap(l.next)}{td(props.nextAt, 'time', 'caption', C.accent, { w: 'bold' })}</HStack> : null;

  if (lock) {
    return (
      <VStack alignment="leading" spacing={1} modifiers={[widgetURL(url)]}>
        {tx(props.bottleAt ? `${l.lastBottle} · ${bottleV}` : props.feedOngoing ? l.ongoing : l.lastFeed, 'headline', null, { w: 'semibold' })}
        {props.bottleAt ? td(props.bottleAt, 'relative', 'body', null) : props.feedAt ? td(props.feedAt, props.feedOngoing ? 'timer' : 'relative', 'body', null) : tx(l.none, 'caption', sec)}
        {tx(`${l.today} · ${todayS}`, 'caption', sec)}
      </VStack>
    );
  }
  if (small) {
    return (
      <VStack alignment="leading" spacing={6} modifiers={root}>
        {head(name, true, props.more)}
        {props.bottleAt || !props.feedAt ? bottleBlock : feedBlock}
        <Spacer />
        {next || tx(`${l.today} · ${todayS}`, 'caption2', C.muted, { w: 'semibold' })}
      </VStack>
    );
  }
  const blocks = <HStack alignment="top" spacing={10}>{bottleBlock}<Spacer />{feedBlock}<Spacer />{todayBlock}</HStack>;
  if (!large) {
    return (
      <VStack alignment="leading" spacing={8} modifiers={root}>
        {head(name, true, props.more)}
        {blocks}
        <Spacer />
        {next}
      </VStack>
    );
  }
  return (
    <VStack alignment="leading" spacing={10} modifiers={root}>
      {head(name, true, props.more)}
      {blocks}
      {next}
      <HStack>{cap(l.week)}<Spacer />{props.avgMl ? tx(`${l.avg} ${props.avgMl} ${l.ml}`, 'caption2', C.muted, { w: 'semibold' }) : null}</HStack>
      {bars(props.week || [], props.avgMl, 110)}
      <Spacer />
    </VStack>
  );
};

export default createWidget('BabyWidget', BabyWidgetView);
