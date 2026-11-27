/**
 * Widget iOS « Aura » : la suggestion du moment (prochaine étape décidée par les règles locales d'Aura, sinon une
 * question du thème, qui s'ouvre pré-remplie SANS être envoyée) et les priorités du jour (tâches en retard,
 * rendez-vous du jour, tâches du jour, outils recommandés par le moteur local). Aucun appel IA, aucun crédit.
 * Contenu calculé par l'app (model.ts → auraEntries).
 * Règles du moteur de widget : pas de hook, pas d'état, aucune variable extérieure — tout passe par les props.
 */
import { Divider, HStack, Image, Link, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import { background, containerBackground, cornerRadius, font, foregroundStyle, frame, lineLimit, minimumScaleFactor, monospacedDigit, padding, privacySensitive, resizable, shapes, widgetURL } from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';
import type { AuraProps, AuraRow } from './model';

type P = AuraProps;
type TS = NonNullable<Parameters<typeof font>[0]['textStyle']>;
type FW = NonNullable<Parameters<typeof font>[0]['weight']>;
type FS = Parameters<typeof foregroundStyle>[0];
type DS = 'timer' | 'relative' | 'offset' | 'date' | 'time';

const AuraWidgetView = (props: P, env: WidgetEnvironment) => {
  'widget';
  const dark = env.colorScheme === 'dark';
  const full = !env.widgetRenderingMode || env.widgetRenderingMode === 'fullColor';
  const fam = env.widgetFamily;
  const lock = fam === 'accessoryRectangular';
  const small = fam === 'systemSmall';
  const large = fam === 'systemLarge';
  // Palette locale (le moteur du widget n'a accès à aucun jeton) ; en mode teinté, iOS recolore : tons neutres
  const C = {
    bg: dark ? '#151118' : '#FAF6FB', text: dark ? '#F5EEF7' : '#241B28', muted: dark ? '#B9A9BF' : '#625468',
    accent: full ? (dark ? '#D3A6E6' : '#7A3E8F') : (dark ? '#F5EEF7' : '#241B28'),
    soft: full ? (dark ? '#4E3559' : '#E2CDEA') : (dark ? '#6F6A66' : '#B4ADA7'),
    warn: full ? (dark ? '#F2A38C' : '#A7402A') : (dark ? '#F5EEF7' : '#241B28'),
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
  const sym = (k: string) => (k === 'late' ? 'exclamationmark.circle.fill' : k === 'appt' ? 'calendar' : k === 'task' ? 'checklist' : 'sparkles');
  const icon = (k: string) => <Image systemName={sym(k) as never} modifiers={[font({ textStyle: 'caption', weight: 'semibold' }), foregroundStyle(k === 'late' ? C.warn : C.accent), frame({ width: 16 })]} />;
  const item = (r: AuraRow, i: number, sub: boolean) => (
    <Link key={String(i)} destination={r.u}>
      <HStack spacing={6}>
        {icon(r.k)}
        <VStack alignment="leading" spacing={0}>
          {tx(r.t, 'footnote', C.text, { w: 'semibold', k: r.k === 'appt' })}
          {sub && r.sub ? tx(r.sub, 'caption2', C.muted) : null}
        </VStack>
        <Spacer />
        {r.at ? td(r.at, 'time', 'caption', C.accent, { w: 'semibold' }) : null}
      </HStack>
    </Link>
  );
  const sugg = (n: number) => (props.kind ? (
    <VStack alignment="leading" spacing={3}>
      {cap(props.head)}
      {tx(props.body, n > 2 ? 'headline' : 'subheadline', C.text, { w: 'semibold', n })}
    </VStack>
  ) : null);
  const cta = props.kind && props.cta ? pillLink(props.cta, props.ctaU || url, 'cta') : null;
  const prio = (n: number, sub: boolean) => (
    <VStack alignment="leading" spacing={6}>
      {cap(l.prio)}
      {rows.length ? rows.slice(0, n).map((r, i) => item(r, i, sub)) : tx(l.none, 'caption', C.muted)}
    </VStack>
  );

  if (lock) {
    return (
      <VStack alignment="leading" spacing={1} modifiers={[widgetURL(props.kind ? props.ctaU || url : url)]}>
        {tx(props.kind ? props.head : l.prio, 'caption', sec, { w: 'semibold' })}
        {tx(props.kind ? props.body : rows[0] ? rows[0].t : l.none, 'headline', null, { w: 'semibold', n: 2, k: !props.kind && !!rows[0] && rows[0].k === 'appt' })}
      </VStack>
    );
  }
  if (small) {
    return (
      <VStack alignment="leading" spacing={6} modifiers={[containerBackground(C.bg, 'widget'), widgetURL(props.kind ? props.ctaU || url : url)]}>
        {head(props.title || 'Aura', false)}
        {props.kind ? tx(props.body, 'subheadline', C.text, { w: 'semibold', n: 4 }) : rows[0] ? tx(rows[0].t, 'subheadline', C.text, { w: 'semibold', n: 3, k: rows[0].k === 'appt' }) : null}
        <Spacer />
        {props.kind ? tx(props.cta, 'caption', C.accent, { w: 'bold' }) : tx(`${rows.length} · ${l.prio}`, 'caption2', C.muted, { w: 'semibold' })}
      </VStack>
    );
  }
  if (!large) {
    return (
      <VStack alignment="leading" spacing={8} modifiers={root}>
        {head(props.title || 'Aura', false)}
        <HStack alignment="top" spacing={12}>
          {props.kind ? <VStack alignment="leading" spacing={6}>{sugg(3)}<Spacer />{cta}</VStack> : null}
          {prio(3, false)}
        </HStack>
      </VStack>
    );
  }
  return (
    <VStack alignment="leading" spacing={10} modifiers={root}>
      {head(props.title || 'Aura', false)}
      {sugg(3)}
      {cta ? <HStack>{cta}<Spacer /></HStack> : null}
      {props.kind ? <Divider /> : null}
      {prio(4, true)}
      <Spacer />
    </VStack>
  );
};

export default createWidget('AuraWidget', AuraWidgetView);
