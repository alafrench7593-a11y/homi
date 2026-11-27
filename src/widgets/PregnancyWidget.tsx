/**
 * Widget iOS « Grossesse » : semaine (+ jours), trimestre, progression jusqu'au terme (jauge avec le pourcentage au
 * centre et barre), jours restants, prochain rendez-vous de grossesse (date, heure, compte à rebours). Une entrée par
 * jour. DISCRET par défaut ; textes marqués sensibles (masqués quand l'iPhone est verrouillé).
 * Règles du moteur de widget : pas de hook, pas d'état, aucune variable extérieure — tout passe par les props.
 */
import { Gauge, HStack, Image, Link, ProgressView, Spacer, Text, VStack, ZStack } from '@expo/ui/swift-ui';
import { background, containerBackground, cornerRadius, font, foregroundStyle, frame, gaugeStyle, lineLimit, minimumScaleFactor, monospacedDigit, padding, privacySensitive, resizable, shapes, tint, widgetURL } from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';
import type { PregnancyProps } from './model';

type P = PregnancyProps;
type TS = NonNullable<Parameters<typeof font>[0]['textStyle']>;
type FW = NonNullable<Parameters<typeof font>[0]['weight']>;
type FS = Parameters<typeof foregroundStyle>[0];
type DS = 'timer' | 'relative' | 'offset' | 'date' | 'time';

const PregnancyWidgetView = (props: P, env: WidgetEnvironment) => {
  'widget';
  const dark = env.colorScheme === 'dark';
  const full = !env.widgetRenderingMode || env.widgetRenderingMode === 'fullColor';
  const fam = env.widgetFamily;
  const lock = fam === 'accessoryRectangular';
  const small = fam === 'systemSmall';
  const large = fam === 'systemLarge';
  // Palette locale (le moteur du widget n'a accès à aucun jeton) ; en mode teinté, iOS recolore : tons neutres
  const C = {
    bg: dark ? '#17140E' : '#FBF7EE', text: dark ? '#F6F0E2' : '#2A2416', muted: dark ? '#C0B496' : '#62583F',
    accent: full ? (dark ? '#E7C27A' : '#8A6414') : (dark ? '#F6F0E2' : '#2A2416'),
    soft: full ? (dark ? '#4F4227' : '#E8D7AE') : (dark ? '#6F6A66' : '#B4ADA7'),
    warn: full ? (dark ? '#F2A38C' : '#A7402A') : (dark ? '#F6F0E2' : '#2A2416'),
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
  const det = !!props.detailed;
  const pct = Math.round((props.pct || 0) * 100);
  const weekText = det ? `${l.week} ${props.week}${props.extra ? ` + ${props.extra}` : ''}` : `${l.weekDiscreet} ${props.week}`;
  const dueLabel = det ? l.toDue : l.toDueDiscreet;
  const gauge = ring(props.pct || 0, 0, 1, `${pct}%`, true);
  const week = tx(weekText, 'headline', C.text, { w: 'bold', k: true });
  const due = <VStack alignment="leading" spacing={1}>{cap(dueLabel)}{tx(`${props.toDue} ${l.days}`, 'title3', C.accent, { w: 'bold', r: true, k: true })}</VStack>;
  const appt = props.apptAt ? (
    <VStack alignment="leading" spacing={2}>
      {cap(det ? l.appt : l.apptDiscreet)}
      {props.apptTitle ? tx(props.apptTitle, 'footnote', C.text, { w: 'semibold', k: true }) : null}
      <HStack spacing={4}>{td(props.apptAt, 'date', 'caption', C.muted)}{td(props.apptAt, 'time', 'caption', C.muted)}<Spacer />{td(props.apptAt, 'relative', 'caption', C.accent, { w: 'semibold' })}</HStack>
    </VStack>
  ) : null;

  if (lock) {
    return (
      <VStack alignment="leading" spacing={1} modifiers={[widgetURL(url)]}>
        {tx(weekText, 'headline', null, { w: 'semibold', k: true })}
        <ProgressView value={props.pct || 0} modifiers={[privacySensitive()]} />
        {tx(`${dueLabel} ${props.toDue} ${l.days}`, 'caption', sec, { k: true })}
      </VStack>
    );
  }
  if (small) {
    return (
      <VStack alignment="leading" spacing={6} modifiers={root}>
        <HStack alignment="top">{gauge}<Spacer />{logoEl}</HStack>
        {week}
        {tx(`${dueLabel} · ${props.toDue} ${l.days}`, 'caption', C.accent, { w: 'semibold', k: true })}
        <Spacer />
      </VStack>
    );
  }
  return (
    <VStack alignment="leading" spacing={large ? 12 : 8} modifiers={root}>
      {head(props.title || 'HOMI', false)}
      <HStack alignment="center" spacing={12}>
        {gauge}
        <VStack alignment="leading" spacing={2}>{week}{det ? tx(`${l.tri} ${props.tri}`, 'caption', C.muted) : null}</VStack>
        <Spacer />
        {due}
      </HStack>
      <ProgressView value={props.pct || 0} modifiers={[tint(C.accent), privacySensitive()]} />
      {large ? appt : null}
      <Spacer />
    </VStack>
  );
};

export default createWidget('PregnancyWidget', PregnancyWidgetView);
