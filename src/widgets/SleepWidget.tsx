/**
 * Widget iOS « Sommeil » : sieste en cours (chrono qui avance seul) ou éveillé depuis, sommeil du jour rapporté à la
 * moyenne personnelle (jauge en %), nombre de siestes, durée de la dernière et heures des 7 derniers jours
 * (moyenne en pointillés). Contenu calculé par l'app (model.ts → sleepEntries).
 * Règles du moteur de widget : pas de hook, pas d'état, aucune variable extérieure — tout passe par les props.
 */
import { Chart, Gauge, HStack, Image, Link, Spacer, Text, VStack, ZStack } from '@expo/ui/swift-ui';
import { background, containerBackground, cornerRadius, font, foregroundStyle, frame, gaugeStyle, lineLimit, minimumScaleFactor, monospacedDigit, padding, privacySensitive, resizable, shapes, tint, widgetURL } from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';
import type { SleepProps } from './model';

type P = SleepProps;
type TS = NonNullable<Parameters<typeof font>[0]['textStyle']>;
type FW = NonNullable<Parameters<typeof font>[0]['weight']>;
type FS = Parameters<typeof foregroundStyle>[0];
type DS = 'timer' | 'relative' | 'offset' | 'date' | 'time';

const SleepWidgetView = (props: P, env: WidgetEnvironment) => {
  'widget';
  const dark = env.colorScheme === 'dark';
  const full = !env.widgetRenderingMode || env.widgetRenderingMode === 'fullColor';
  const fam = env.widgetFamily;
  const lock = fam === 'accessoryRectangular';
  const small = fam === 'systemSmall';
  const large = fam === 'systemLarge';
  // Palette locale (le moteur du widget n'a accès à aucun jeton) ; en mode teinté, iOS recolore : tons neutres
  const C = {
    bg: dark ? '#121320' : '#F6F4FB', text: dark ? '#F1EFFA' : '#1E1B2E', muted: dark ? '#ABA6C4' : '#59546E',
    accent: full ? (dark ? '#B4A8F0' : '#5A4BB8') : (dark ? '#F1EFFA' : '#1E1B2E'),
    soft: full ? (dark ? '#3F3870' : '#D3CDEF') : (dark ? '#6F6A66' : '#B4ADA7'),
    warn: full ? (dark ? '#F2A38C' : '#A7402A') : (dark ? '#F1EFFA' : '#1E1B2E'),
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
  // Jauge circulaire avec sa valeur au centre (les « étiquettes » de jauge ne sont pas dessinées dans un widget)
  const ring = (v: number, min: number, max: number, label: string, k: boolean) => (
    <ZStack modifiers={k ? [privacySensitive()] : []}>
      <Gauge value={Math.max(min, Math.min(max, v))} min={min} max={max > min ? max : min + 1} modifiers={[gaugeStyle('circularCapacity'), tint(C.accent)]} />
      <Text modifiers={[font({ textStyle: 'caption', weight: 'bold', design: 'rounded' }), foregroundStyle(C.text), monospacedDigit(), lineLimit(1), minimumScaleFactor(0.5), frame({ width: 40 })]}>{label}</Text>
    </ZStack>
  );
  // Barres des 7 jours : aujourd'hui en couleur, moyenne en pointillés, jour sous chaque barre
  const bars = (data: { x: string; y: number }[], avg: number, h: number) => (
    <VStack alignment="leading" spacing={3}>
      <Chart type="bar" data={data.map((w, i, a) => ({ x: w.x, y: w.y, color: i === a.length - 1 ? C.accent : C.soft }))} referenceLines={avg > 0 ? [{ x: 'avg', y: avg, color: C.muted }] : []} ruleStyle={{ lineWidth: 1, dashArray: [3, 3] }} barStyle={{ cornerRadius: 4 }} showGrid={false} animate={false} modifiers={[frame({ height: h })]} />
      <HStack spacing={0}>{data.map((w, i, a) => <Text key={String(i)} modifiers={[font({ textStyle: 'caption2', weight: i === a.length - 1 ? 'bold' : 'regular' }), foregroundStyle(i === a.length - 1 ? C.accent : C.muted), lineLimit(1), minimumScaleFactor(0.5), frame({ maxWidth: 9999 })]}>{w.x}</Text>)}</HStack>
    </VStack>
  );
  const name = props.name || props.title;
  const hm = (min: number) => { const h = Math.floor(min / 60); const m = min % 60; return h ? `${h} ${l.h} ${m < 10 ? '0' : ''}${m}` : `${m} min`; };
  const status = (
    <VStack alignment="leading" spacing={2}>
      {cap(props.asleep ? l.asleep : l.awake)}
      {td(props.since, 'timer', 'title', C.text, { w: 'bold' })}
    </VStack>
  );
  // Repère personnel : sommeil du jour rapporté à la moyenne des 6 jours précédents (pas une norme)
  const pct = props.avgMin > 0 ? Math.round((props.todayMin / props.avgMin) * 100) : 0;
  const gauge = ring(props.todayMin, 0, props.avgMin > 0 ? props.avgMin : Math.max(props.todayMin, 60), pct ? `${pct}%` : hm(props.todayMin), false);
  const today = (
    <VStack alignment="leading" spacing={1}>
      {cap(l.today)}
      {tx(hm(props.todayMin), 'headline', C.text, { w: 'bold' })}
      {tx(`${props.naps} ${l.naps}${props.lastMin ? ` · ${l.last} ${hm(props.lastMin)}` : ''}`, 'caption2', C.muted)}
    </VStack>
  );

  if (lock) {
    return (
      <VStack alignment="leading" spacing={1} modifiers={[widgetURL(url)]}>
        {tx(props.asleep ? l.asleep : l.awake, 'headline', null, { w: 'semibold' })}
        {td(props.since, 'timer', 'body', null)}
        {tx(`${l.today} ${hm(props.todayMin)}`, 'caption', sec)}
      </VStack>
    );
  }
  if (small) {
    return (
      <VStack alignment="leading" spacing={6} modifiers={root}>
        {head(name, true, props.more)}
        {status}
        <Spacer />
        {tx(`${l.today} ${hm(props.todayMin)} · ${props.naps} ${l.naps}`, 'caption2', C.muted, { w: 'semibold' })}
      </VStack>
    );
  }
  const top = <HStack alignment="center" spacing={10}>{status}<Spacer />{gauge}{today}</HStack>;
  if (!large) {
    return (
      <VStack alignment="leading" spacing={8} modifiers={root}>
        {head(name, true, props.more)}
        {top}
        <Spacer />
      </VStack>
    );
  }
  return (
    <VStack alignment="leading" spacing={10} modifiers={root}>
      {head(name, true, props.more)}
      {top}
      <HStack>{cap(l.week)}<Spacer />{props.avgMin ? tx(`${l.avg} ${hm(props.avgMin)}`, 'caption2', C.muted, { w: 'semibold' }) : null}</HStack>
      {bars(props.week || [], props.avgMin / 60, 120)}
      <Spacer />
    </VStack>
  );
};

export default createWidget('SleepWidget', SleepWidgetView);
