/**
 * Widget iOS « Planning » : prochain rendez-vous (intitulé, date, heure, compte à rebours qui avance seul, lieu),
 * nombre aujourd'hui et sur 7 jours, rendez-vous suivants. Un rendez-vous passé disparaît à son heure.
 * Intitulés et lieux masqués en mode discret. Contenu calculé par l'app (model.ts → planningEntries).
 * Règles du moteur de widget : pas de hook, pas d'état, aucune variable extérieure — tout passe par les props.
 */
import { HStack, Image, Link, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import { background, containerBackground, cornerRadius, font, foregroundStyle, frame, lineLimit, minimumScaleFactor, monospacedDigit, padding, privacySensitive, resizable, shapes, widgetURL } from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';
import type { PlanningProps, ApptRow } from './model';

type P = PlanningProps;
type TS = NonNullable<Parameters<typeof font>[0]['textStyle']>;
type FW = NonNullable<Parameters<typeof font>[0]['weight']>;
type FS = Parameters<typeof foregroundStyle>[0];
type DS = 'timer' | 'relative' | 'offset' | 'date' | 'time';

const PlanningWidgetView = (props: P, env: WidgetEnvironment) => {
  'widget';
  const dark = env.colorScheme === 'dark';
  const full = !env.widgetRenderingMode || env.widgetRenderingMode === 'fullColor';
  const fam = env.widgetFamily;
  const lock = fam === 'accessoryRectangular';
  const small = fam === 'systemSmall';
  const large = fam === 'systemLarge';
  // Palette locale (le moteur du widget n'a accès à aucun jeton) ; en mode teinté, iOS recolore : tons neutres
  const C = {
    bg: dark ? '#0F1319' : '#F4F7FB', text: dark ? '#EAF0F8' : '#16202E', muted: dark ? '#A3B0C2' : '#4E5C70',
    accent: full ? (dark ? '#8DB8F2' : '#2558A6') : (dark ? '#EAF0F8' : '#16202E'),
    soft: full ? (dark ? '#2C4466' : '#C2D3EC') : (dark ? '#6F6A66' : '#B4ADA7'),
    warn: full ? (dark ? '#F2A38C' : '#A7402A') : (dark ? '#EAF0F8' : '#16202E'),
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
  const first: ApptRow = rows[0] || { t: props.title || '', at: Date.now(), place: '' };
  const hero = (n: number) => (
    <VStack alignment="leading" spacing={2}>
      {cap(l.next)}
      {tx(first.t, 'headline', C.text, { w: 'bold', n, k: true })}
      <HStack spacing={4}>{td(first.at, 'date', 'caption', C.accent, { w: 'semibold' })}{td(first.at, 'time', 'caption', C.accent, { w: 'semibold' })}</HStack>
      <HStack spacing={3}>{tx(l.in, 'caption2', C.muted)}{td(first.at, 'relative', 'caption2', C.muted, { w: 'semibold' })}</HStack>
      {first.place ? tx(first.place, 'caption2', C.muted, { k: true }) : null}
    </VStack>
  );
  const counts = (
    <HStack spacing={10}>
      {tx(`${props.todayN} ${l.today}`, 'caption', C.accent, { w: 'semibold' })}
      {tx(`${props.week} ${l.week}`, 'caption', C.muted, { w: 'semibold' })}
    </HStack>
  );
  const row = (r: ApptRow, i: number) => (
    <HStack key={String(i)} spacing={8}>
      <VStack alignment="leading" spacing={0}>{td(r.at, 'date', 'caption2', C.accent, { w: 'bold' })}{td(r.at, 'time', 'caption2', C.muted)}</VStack>
      {tx(r.t, 'footnote', C.text, { w: 'medium', k: true })}
      <Spacer />
    </HStack>
  );

  if (lock) {
    return (
      <VStack alignment="leading" spacing={1} modifiers={[widgetURL(url)]}>
        {tx(first.t, 'headline', null, { w: 'semibold', k: true })}
        <HStack spacing={4}>{td(first.at, 'date', 'caption', null)}{td(first.at, 'time', 'caption', null)}</HStack>
        {td(first.at, 'relative', 'caption', sec)}
      </VStack>
    );
  }
  if (small) {
    return (
      <VStack alignment="leading" spacing={4} modifiers={root}>
        <HStack>{logoEl}<Spacer /></HStack>
        {hero(2)}
        <Spacer />
        {counts}
      </VStack>
    );
  }
  if (!large) {
    return (
      <VStack alignment="leading" spacing={6} modifiers={root}>
        {head(props.title || 'HOMI', false)}
        <HStack alignment="top" spacing={14}>
          {hero(2)}
          <VStack alignment="leading" spacing={6}>{rows.slice(1, 3).map(row)}<Spacer /></VStack>
        </HStack>
        <Spacer />
        {counts}
      </VStack>
    );
  }
  return (
    <VStack alignment="leading" spacing={12} modifiers={root}>
      {head(props.title || 'HOMI', false)}
      {hero(2)}
      {counts}
      <VStack alignment="leading" spacing={8}>{rows.slice(1, 5).map(row)}</VStack>
      <Spacer />
    </VStack>
  );
};

export default createWidget('PlanningWidget', PlanningWidgetView);
