/**
 * Widget iOS « Santé » : prochaine prise de traitement (HEURE seulement, jamais le nom du médicament ; prises du
 * jour faites / prévues), prochain rendez-vous de santé et prochain vaccin dû (dates indicatives du calendrier).
 * Tout est sensible : discret par défaut (intitulés génériques), masqué quand l'iPhone est verrouillé.
 * Contenu calculé par l'app (model.ts → healthEntries).
 * Règles du moteur de widget : pas de hook, pas d'état, aucune variable extérieure — tout passe par les props.
 */
import { Divider, Gauge, HStack, Image, Link, Spacer, Text, VStack, ZStack } from '@expo/ui/swift-ui';
import { background, containerBackground, cornerRadius, font, foregroundStyle, frame, gaugeStyle, lineLimit, minimumScaleFactor, monospacedDigit, padding, privacySensitive, resizable, shapes, tint, widgetURL } from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';
import type { HealthProps } from './model';

type P = HealthProps;
type TS = NonNullable<Parameters<typeof font>[0]['textStyle']>;
type FW = NonNullable<Parameters<typeof font>[0]['weight']>;
type FS = Parameters<typeof foregroundStyle>[0];
type DS = 'timer' | 'relative' | 'offset' | 'date' | 'time';

const HealthWidgetView = (props: P, env: WidgetEnvironment) => {
  'widget';
  const dark = env.colorScheme === 'dark';
  const full = !env.widgetRenderingMode || env.widgetRenderingMode === 'fullColor';
  const fam = env.widgetFamily;
  const lock = fam === 'accessoryRectangular';
  const small = fam === 'systemSmall';
  const large = fam === 'systemLarge';
  // Palette locale (le moteur du widget n'a accès à aucun jeton) ; en mode teinté, iOS recolore : tons neutres
  const C = {
    bg: dark ? '#18110F' : '#FCF6F4', text: dark ? '#F6ECE8' : '#2B1B17', muted: dark ? '#C0A9A2' : '#6B5650',
    accent: full ? (dark ? '#F0A792' : '#A8432B') : (dark ? '#F6ECE8' : '#2B1B17'),
    soft: full ? (dark ? '#5A372D' : '#EDCFC6') : (dark ? '#6F6A66' : '#B4ADA7'),
    warn: full ? (dark ? '#F2A38C' : '#A7402A') : (dark ? '#F6ECE8' : '#2B1B17'),
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
  const name = props.name || props.title;
  const doneAll = props.doseTotal > 0 && props.doseDone >= props.doseTotal;
  const doseSub = props.doseTotal ? `${props.doseDone}/${props.doseTotal} ${l.doses}` : '';
  const dash = tx('—', 'title3', C.muted, { w: 'bold' });
  const doseB = (
    <VStack alignment="leading" spacing={2}>
      {cap(l.dose)}
      {props.doseAt ? td(props.doseAt, 'time', 'title3', C.text, { w: 'bold', k: true }) : doneAll ? tx(l.allDone, 'headline', C.accent, { w: 'bold', k: true }) : dash}
      {doseSub ? tx(doseSub, 'caption', C.muted, { k: true }) : null}
    </VStack>
  );
  const apptB = (
    <VStack alignment="leading" spacing={2}>
      {cap(l.appt)}
      {props.apptAt ? td(props.apptAt, 'date', 'title3', C.text, { w: 'bold', k: true }) : dash}
      {props.apptAt ? <HStack spacing={4}>{td(props.apptAt, 'time', 'caption', C.muted, { k: true })}{det && props.apptT && props.apptT !== l.appt ? tx(props.apptT, 'caption', C.muted, { k: true }) : null}</HStack> : null}
    </VStack>
  );
  const vacB = (
    <VStack alignment="leading" spacing={2}>
      {cap(l.vaccine)}
      {props.vacAt ? td(props.vacAt, 'date', 'title3', props.vacDue ? C.warn : C.text, { w: 'bold', k: true }) : dash}
      {props.vacAt && (props.vacDue || (det && props.vacT && props.vacT !== l.vaccine)) ? tx(props.vacDue ? l.due : props.vacT, 'caption', props.vacDue ? C.warn : C.muted, { w: 'semibold', k: true }) : null}
    </VStack>
  );

  if (lock) {
    return (
      <VStack alignment="leading" spacing={1} modifiers={[widgetURL(url), privacySensitive()]}>
        {props.doseAt ? <HStack spacing={4}>{tx(l.dose, 'headline', null, { w: 'semibold' })}{td(props.doseAt, 'time', 'headline', null, { w: 'semibold' })}</HStack> : tx(name, 'headline', null, { w: 'semibold', k: true })}
        {props.apptAt ? <HStack spacing={4}>{tx(l.appt, 'caption', sec)}{td(props.apptAt, 'date', 'caption', sec)}</HStack> : null}
        {props.vacAt ? <HStack spacing={4}>{tx(l.vaccine, 'caption', sec)}{td(props.vacAt, 'date', 'caption', sec)}</HStack> : null}
      </VStack>
    );
  }
  if (small) {
    const main = props.doseAt || (!props.apptAt && !props.vacAt) ? doseB : props.apptAt ? apptB : vacB;
    return (
      <VStack alignment="leading" spacing={6} modifiers={root}>
        {head(name, true)}
        {main}
        <Spacer />
        {props.vacAt && main !== vacB ? <HStack spacing={4}>{tx(l.vaccine, 'caption2', C.muted, { w: 'semibold' })}{td(props.vacAt, 'date', 'caption2', props.vacDue ? C.warn : C.text, { w: 'semibold', k: true })}</HStack> : null}
      </VStack>
    );
  }
  if (!large) {
    return (
      <VStack alignment="leading" spacing={8} modifiers={root}>
        {head(name, true)}
        <HStack alignment="top" spacing={10}>{doseB}<Spacer />{apptB}<Spacer />{vacB}</HStack>
        <Spacer />
      </VStack>
    );
  }
  return (
    <VStack alignment="leading" spacing={12} modifiers={root}>
      {head(name, true)}
      <HStack alignment="center" spacing={12}>
        {props.doseTotal ? ring(props.doseDone, 0, props.doseTotal, `${props.doseDone}/${props.doseTotal}`, true) : null}
        {doseB}
        <Spacer />
      </HStack>
      <Divider />
      <HStack alignment="top" spacing={12}>{apptB}<Spacer />{vacB}<Spacer /></HStack>
      <Spacer />
    </VStack>
  );
};

export default createWidget('HealthWidget', HealthWidgetView);
