/**
 * Widget iOS « Mon cycle » : jour du cycle (jauge, numéro au centre), compte à rebours jusqu'au prochain repère,
 * fenêtre fertile estimée, prise du jour de la contraception orale. Une entrée par jour : il avance seul à minuit.
 * DISCRET par défaut (aucun mot lié aux règles ni à la contraception) ; détaillé seulement si la personne le choisit ;
 * « protégé » si le cycle est masqué ou verrouillé dans l'app. Textes marqués sensibles (masqués iPhone verrouillé).
 * Règles du moteur de widget : pas de hook, pas d'état, aucune variable extérieure — tout passe par les props.
 */
import { Gauge, HStack, Image, Link, ProgressView, Spacer, Text, VStack, ZStack } from '@expo/ui/swift-ui';
import { background, containerBackground, cornerRadius, font, foregroundStyle, frame, gaugeStyle, lineLimit, minimumScaleFactor, monospacedDigit, padding, privacySensitive, resizable, shapes, tint, widgetURL } from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';
import type { CycleProps } from './model';

type P = CycleProps;
type TS = NonNullable<Parameters<typeof font>[0]['textStyle']>;
type FW = NonNullable<Parameters<typeof font>[0]['weight']>;
type FS = Parameters<typeof foregroundStyle>[0];
type DS = 'timer' | 'relative' | 'offset' | 'date' | 'time';

const CycleWidgetView = (props: P, env: WidgetEnvironment) => {
  'widget';
  const dark = env.colorScheme === 'dark';
  const full = !env.widgetRenderingMode || env.widgetRenderingMode === 'fullColor';
  const fam = env.widgetFamily;
  const lock = fam === 'accessoryRectangular';
  const small = fam === 'systemSmall';
  const large = fam === 'systemLarge';
  // Palette locale (le moteur du widget n'a accès à aucun jeton) ; en mode teinté, iOS recolore : tons neutres
  const C = {
    bg: dark ? '#17121A' : '#FCF6F7', text: dark ? '#F7EEF1' : '#2A1A20', muted: dark ? '#BFA9B1' : '#6A5359',
    accent: full ? (dark ? '#F0A3B8' : '#A8435F') : (dark ? '#F7EEF1' : '#2A1A20'),
    soft: full ? (dark ? '#5A3442' : '#EBC3CE') : (dark ? '#6F6A66' : '#B4ADA7'),
    warn: full ? (dark ? '#F2A38C' : '#A7402A') : (dark ? '#F7EEF1' : '#2A1A20'),
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
  const nextLabel = det ? l.next : l.nextDiscreet;
  const untilText = props.until === 0 ? l.today : props.until > 0 ? `${props.until} ${l.days}` : '—';
  const gauge = ring(props.day, 1, props.len, String(props.day), true);
  const dayText = tx(`${l.day} ${props.day}`, 'headline', C.text, { w: 'bold', k: true });
  const until = <VStack alignment="leading" spacing={1}>{cap(nextLabel)}{tx(untilText, 'title3', C.accent, { w: 'bold', r: true, k: true })}</VStack>;
  const fertile = det && (props.fertile || props.fertileIn > 0)
    ? tx(props.fertile ? l.fertile : `${l.fertileSoon} ${props.fertileIn} ${l.days}`, 'caption', C.text, { w: 'semibold', k: true }) : null;
  const pill = props.pill
    ? <HStack spacing={4}>{tx(l.pill, 'caption', C.muted, { w: 'semibold' })}{tx(props.pill === 'done' ? l.pillDone : l.pillTodo, 'caption', props.pill === 'done' ? C.accent : C.text, { w: 'bold', k: true })}</HStack>
    : null;

  if (lock) {
    return (
      <VStack alignment="leading" spacing={1} modifiers={[widgetURL(url)]}>
        {tx(`${l.day} ${props.day}`, 'headline', null, { w: 'semibold', k: true })}
        {tx(`${nextLabel} : ${untilText}`, 'caption', null, { k: true })}
        {props.pill ? tx(`${l.pill} ${props.pill === 'done' ? l.pillDone : l.pillTodo}`, 'caption', sec, { k: true }) : null}
      </VStack>
    );
  }
  if (small) {
    return (
      <VStack alignment="leading" spacing={6} modifiers={root}>
        <HStack alignment="top">{gauge}<Spacer />{logoEl}</HStack>
        {dayText}
        {tx(`${nextLabel} · ${untilText}`, 'caption', C.accent, { w: 'semibold', k: true })}
        <Spacer />
        {pill}
      </VStack>
    );
  }
  return (
    <VStack alignment="leading" spacing={large ? 12 : 8} modifiers={root}>
      {head(props.title || 'HOMI', false)}
      <HStack alignment="center" spacing={12}>
        {gauge}
        <VStack alignment="leading" spacing={2}>{dayText}{tx(`/ ${props.len}`, 'caption', C.muted)}</VStack>
        <Spacer />
        {until}
      </HStack>
      {large ? <ProgressView value={Math.min(1, props.day / Math.max(1, props.len))} modifiers={[tint(C.accent), privacySensitive()]} /> : null}
      {fertile}
      {pill}
      <Spacer />
    </VStack>
  );
};

export default createWidget('CycleWidget', CycleWidgetView);
