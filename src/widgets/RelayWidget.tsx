/**
 * Widget iOS « Relais » : qui est de garde maintenant (jusqu'à quelle heure, compte à rebours natif), prochain relais
 * (qui, quand), nuits des 7 prochains jours (répartition) et dernier relais transmis. Une entrée à chaque début et fin
 * de garde : il change à l'heure sans ouvrir l'app. Prénoms masqués en mode discret (« Vous » / « Coparent »).
 * Contenu calculé par l'app (model.ts → relayEntries, gardes de nuit care_shifts + dernier relais de l'appareil).
 * Règles du moteur de widget : pas de hook, pas d'état, aucune variable extérieure — tout passe par les props.
 */
import { HStack, Image, Link, ProgressView, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import { background, containerBackground, cornerRadius, font, foregroundStyle, frame, lineLimit, minimumScaleFactor, monospacedDigit, padding, privacySensitive, resizable, shapes, tint, widgetURL } from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';
import type { RelayProps, RelayRow } from './model';

type P = RelayProps;
type TS = NonNullable<Parameters<typeof font>[0]['textStyle']>;
type FW = NonNullable<Parameters<typeof font>[0]['weight']>;
type FS = Parameters<typeof foregroundStyle>[0];
type DS = 'timer' | 'relative' | 'offset' | 'date' | 'time';

const RelayWidgetView = (props: P, env: WidgetEnvironment) => {
  'widget';
  const dark = env.colorScheme === 'dark';
  const full = !env.widgetRenderingMode || env.widgetRenderingMode === 'fullColor';
  const fam = env.widgetFamily;
  const lock = fam === 'accessoryRectangular';
  const small = fam === 'systemSmall';
  const large = fam === 'systemLarge';
  // Palette locale (le moteur du widget n'a accès à aucun jeton) ; en mode teinté, iOS recolore : tons neutres
  const C = {
    bg: dark ? '#0E1517' : '#F3F8F8', text: dark ? '#E8F3F4' : '#132326', muted: dark ? '#9FB6BA' : '#4B6266',
    accent: full ? (dark ? '#7FCAD3' : '#1F6E78') : (dark ? '#E8F3F4' : '#132326'),
    soft: full ? (dark ? '#2F5257' : '#BFDDE1') : (dark ? '#6F6A66' : '#B4ADA7'),
    warn: full ? (dark ? '#F2A38C' : '#A7402A') : (dark ? '#E8F3F4' : '#132326'),
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
  const rows = props.rows || [];
  const nowBlock = props.nowWho ? (
    <VStack alignment="leading" spacing={2}>
      {cap(l.now)}
      {tx(props.nowWho, 'title3', props.nowMine ? C.accent : C.text, { w: 'bold', r: true, k: !props.nowMine })}
      <HStack spacing={4}>{tx(l.until, 'caption2', C.muted)}{td(props.nowEnd, 'time', 'caption', C.text, { w: 'semibold' })}</HStack>
      {td(props.nowEnd, 'timer', 'caption', C.accent, { w: 'semibold' })}
    </VStack>
  ) : (
    <VStack alignment="leading" spacing={2}>{cap(l.now)}{tx(l.nobody, 'headline', C.muted, { w: 'semibold' })}</VStack>
  );
  const nextBlock = props.nextAt ? (
    <VStack alignment="leading" spacing={2}>
      {cap(l.next)}
      {tx(props.nextWho, 'title3', props.nextMine ? C.accent : C.text, { w: 'bold', r: true, k: !props.nextMine })}
      <HStack spacing={4}>{td(props.nextAt, 'date', 'caption', C.muted)}{td(props.nextAt, 'time', 'caption', C.text, { w: 'semibold' })}</HStack>
      {td(props.nextAt, 'relative', 'caption', C.accent, { w: 'semibold' })}
    </VStack>
  ) : null;
  const sent = props.sentAt
    ? <HStack spacing={4}>{tx(l.sent, 'caption2', C.muted)}{td(props.sentAt, 'relative', 'caption2', C.muted, { w: 'semibold' })}{props.sentN ? tx(`· ${props.sentN} ${l.events}`, 'caption2', C.muted) : null}</HStack>
    : null;
  const total = props.mine7 + props.other7;
  const split = total ? (
    <VStack alignment="leading" spacing={3}>
      <HStack>{cap(l.week)}<Spacer />{tx(`${l.mine} ${props.mine7} · ${l.other} ${props.other7}`, 'caption2', C.muted, { w: 'semibold' })}</HStack>
      <ProgressView value={props.mine7 / total} modifiers={[tint(C.accent)]} />
    </VStack>
  ) : null;
  const row = (r: RelayRow, i: number) => (
    <HStack key={String(i)} spacing={6}>
      {tx(r.mine ? '●' : '○', 'caption', C.accent, { w: 'bold' })}
      {tx(r.who, 'footnote', C.text, { w: 'medium', k: !r.mine })}
      <Spacer />
      {td(r.at, 'date', 'caption2', C.muted)}
      {td(r.at, 'time', 'caption2', C.text, { w: 'semibold' })}
    </HStack>
  );

  if (lock) {
    return (
      <VStack alignment="leading" spacing={1} modifiers={[widgetURL(url)]}>
        {tx(`${l.now} : ${props.nowWho || l.nobody}`, 'headline', null, { w: 'semibold', k: !props.nowMine })}
        {props.nowEnd ? td(props.nowEnd, 'timer', 'body', null) : null}
        {props.nextAt ? <HStack spacing={4}>{tx(`${l.next} : ${props.nextWho}`, 'caption', sec, { k: !props.nextMine })}{td(props.nextAt, 'time', 'caption', sec)}</HStack> : null}
      </VStack>
    );
  }
  if (small) {
    return (
      <VStack alignment="leading" spacing={6} modifiers={root}>
        {head(props.title || 'HOMI', false)}
        {props.nowWho || !props.nextAt ? nowBlock : nextBlock}
        <Spacer />
        {props.nowWho && props.nextAt ? <HStack spacing={4}>{tx(l.next, 'caption2', C.muted)}{td(props.nextAt, 'time', 'caption2', C.text, { w: 'semibold' })}</HStack> : sent}
      </VStack>
    );
  }
  const top = <HStack alignment="top" spacing={12}>{nowBlock}<Spacer />{nextBlock}<Spacer /></HStack>;
  if (!large) {
    return (
      <VStack alignment="leading" spacing={8} modifiers={root}>
        {head(props.title || 'HOMI', false)}
        {top}
        <Spacer />
        {sent}
      </VStack>
    );
  }
  return (
    <VStack alignment="leading" spacing={10} modifiers={root}>
      {head(props.title || 'HOMI', false)}
      {top}
      {split}
      <VStack alignment="leading" spacing={6}>{rows.slice(0, 4).map(row)}</VStack>
      <Spacer />
      {sent}
    </VStack>
  );
};

export default createWidget('RelayWidget', RelayWidgetView);
