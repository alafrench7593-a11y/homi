/**
 * Widget iOS « Mon histoire » : photo souvenir récente de l'album (petite copie ≤ 300 px dans le dossier partagé ;
 * sans photo prête, aucune image — jamais d'image d'exemple), âge exact qui avance seul chaque jour, souvenir de la
 * semaine (même semaine une année précédente, sinon le plus récent des 7 derniers jours). Photo, prénom et textes
 * masqués en mode discret ; marqués sensibles. Contenu calculé par l'app (model.ts → storyEntries).
 * Règles du moteur de widget : pas de hook, pas d'état, aucune variable extérieure — tout passe par les props.
 */
import { HStack, Image, Link, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import { aspectRatio, background, clipped, containerBackground, cornerRadius, font, foregroundStyle, frame, lineLimit, minimumScaleFactor, monospacedDigit, padding, privacySensitive, resizable, shapes, widgetAccentedRenderingMode, widgetURL } from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';
import type { StoryProps } from './model';

type P = StoryProps;
type TS = NonNullable<Parameters<typeof font>[0]['textStyle']>;
type FW = NonNullable<Parameters<typeof font>[0]['weight']>;
type FS = Parameters<typeof foregroundStyle>[0];
type DS = 'timer' | 'relative' | 'offset' | 'date' | 'time';

const StoryWidgetView = (props: P, env: WidgetEnvironment) => {
  'widget';
  const dark = env.colorScheme === 'dark';
  const full = !env.widgetRenderingMode || env.widgetRenderingMode === 'fullColor';
  const fam = env.widgetFamily;
  const lock = fam === 'accessoryRectangular';
  const small = fam === 'systemSmall';
  const large = fam === 'systemLarge';
  // Palette locale (le moteur du widget n'a accès à aucun jeton) ; en mode teinté, iOS recolore : tons neutres
  const C = {
    bg: dark ? '#17120E' : '#FDF7F1', text: dark ? '#F7EEE6' : '#2C2017', muted: dark ? '#C2AE9E' : '#6C5A4C',
    accent: full ? (dark ? '#EDB884' : '#9A5A1E') : (dark ? '#F7EEE6' : '#2C2017'),
    soft: full ? (dark ? '#5A4230' : '#EFD9C3') : (dark ? '#6F6A66' : '#B4ADA7'),
    warn: full ? (dark ? '#F2A38C' : '#A7402A') : (dark ? '#F7EEE6' : '#2C2017'),
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
  const name = props.name || props.title;
  const photo = (w: number, h: number) => (props.photo
    ? <Image uiImage={props.photo} modifiers={[resizable(), aspectRatio({ contentMode: 'fill' }), frame(w ? { width: w, height: h } : { maxWidth: 9999, height: h }), clipped(), cornerRadius(14), privacySensitive(), widgetAccentedRenderingMode('desaturated')]} />
    : null);
  const ageB = <VStack alignment="leading" spacing={1}>{cap(l.age)}{tx(props.age, 'headline', C.text, { w: 'bold', n: 2 })}</VStack>;
  const memB = props.memWhen ? (
    <VStack alignment="leading" spacing={1}>
      {cap(`${l.memory} · ${props.memWhen}`)}
      {props.memT ? tx(props.memT, 'footnote', C.text, { w: 'medium', n: 2, k: true }) : null}
      {props.memAt ? td(props.memAt, 'date', 'caption2', C.muted) : null}
    </VStack>
  ) : null;
  const count = tx(`${props.total} ${l.memories}`, 'caption2', C.muted, { w: 'semibold' });

  if (lock) {
    return (
      <VStack alignment="leading" spacing={1} modifiers={[widgetURL(url)]}>
        {tx(name, 'headline', null, { w: 'semibold', k: true })}
        {tx(props.age, 'caption', null)}
        {props.memWhen ? tx(`${l.memory} · ${props.memWhen}`, 'caption', sec) : null}
      </VStack>
    );
  }
  if (small) {
    return props.photo ? (
      <VStack alignment="leading" spacing={4} modifiers={root}>
        {photo(0, 74)}
        {tx(name, 'caption', C.accent, { w: 'bold', k: true })}
        {tx(props.age, 'caption2', C.text, { w: 'semibold', n: 2 })}
      </VStack>
    ) : (
      <VStack alignment="leading" spacing={6} modifiers={root}>
        {head(name, true)}
        {ageB}
        <Spacer />
        {memB ? tx(`${l.memory} · ${props.memWhen}`, 'caption2', C.accent, { w: 'semibold' }) : count}
      </VStack>
    );
  }
  if (!large) {
    return (
      <HStack alignment="top" spacing={12} modifiers={root}>
        {photo(118, 118)}
        <VStack alignment="leading" spacing={6}>
          {head(name, true)}
          {ageB}
          <Spacer />
          {memB || count}
        </VStack>
      </HStack>
    );
  }
  return (
    <VStack alignment="leading" spacing={10} modifiers={root}>
      {head(name, true)}
      {photo(0, 170)}
      {props.caption ? tx(props.caption, 'caption', C.muted, { n: 2, k: true }) : null}
      {ageB}
      {memB}
      <Spacer />
      {count}
    </VStack>
  );
};

export default createWidget('StoryWidget', StoryWidgetView);
