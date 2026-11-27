/**
 * Widget iOS « Tâches de la famille » : tâches restantes, en retard, pour moi, faites sur 7 jours (jauge avec le
 * pourcentage au centre, barres par jour avec la moyenne), prochaines échéances. Lecture seule : le raccourci ouvre
 * l'app. Intitulés masqués en mode discret. Contenu calculé par l'app (model.ts → tasksEntries).
 * Règles du moteur de widget : pas de hook, pas d'état, aucune variable extérieure — tout passe par les props.
 */
import { Chart, Gauge, HStack, Image, Link, Spacer, Text, VStack, ZStack } from '@expo/ui/swift-ui';
import { background, containerBackground, cornerRadius, font, foregroundStyle, frame, gaugeStyle, lineLimit, minimumScaleFactor, monospacedDigit, padding, privacySensitive, resizable, shapes, tint, widgetURL } from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';
import type { TasksProps, TaskRow } from './model';

type P = TasksProps;
type TS = NonNullable<Parameters<typeof font>[0]['textStyle']>;
type FW = NonNullable<Parameters<typeof font>[0]['weight']>;
type FS = Parameters<typeof foregroundStyle>[0];
type DS = 'timer' | 'relative' | 'offset' | 'date' | 'time';

const TasksWidgetView = (props: P, env: WidgetEnvironment) => {
  'widget';
  const dark = env.colorScheme === 'dark';
  const full = !env.widgetRenderingMode || env.widgetRenderingMode === 'fullColor';
  const fam = env.widgetFamily;
  const lock = fam === 'accessoryRectangular';
  const small = fam === 'systemSmall';
  const large = fam === 'systemLarge';
  // Palette locale (le moteur du widget n'a accès à aucun jeton) ; en mode teinté, iOS recolore : tons neutres
  const C = {
    bg: dark ? '#101614' : '#F4F8F5', text: dark ? '#EAF3EE' : '#18241E', muted: dark ? '#A2B5AA' : '#4F6157',
    accent: full ? (dark ? '#7CCFA3' : '#23704A') : (dark ? '#EAF3EE' : '#18241E'),
    soft: full ? (dark ? '#2E5141' : '#BFDCCB') : (dark ? '#6F6A66' : '#B4ADA7'),
    warn: full ? (dark ? '#F2A38C' : '#A7402A') : (dark ? '#EAF3EE' : '#18241E'),
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
  const rows = props.rows || [];
  const pct = Math.round((props.pct || 0) * 100);
  const gauge = ring(props.pct || 0, 0, 1, `${pct}%`, false);
  const counts = <VStack alignment="leading" spacing={0}>{tx(String(props.open), 'title', C.text, { w: 'bold', r: true })}{cap(l.open)}</VStack>;
  const chipList = [
    tx(`${props.doneWeek} ${l.done}`, 'caption', C.accent, { w: 'semibold' }),
    props.late ? tx(`${props.late} ${l.late}`, 'caption', C.warn, { w: 'semibold' }) : null,
    props.mine ? tx(`${props.mine} ${l.mine}`, 'caption', C.muted, { w: 'semibold' }) : null,
  ];
  const row = (r: TaskRow, i: number) => (
    <HStack key={String(i)} spacing={6}>
      {tx(r.mine ? '●' : '○', 'caption', r.late ? C.warn : C.accent, { w: 'bold' })}
      {tx(r.t, 'footnote', C.text, { w: 'medium', k: true })}
      <Spacer />
      {r.due ? td(r.due, r.late ? 'relative' : 'date', 'caption2', r.late ? C.warn : C.muted, { w: 'semibold' }) : tx(l.noDue, 'caption2', C.muted)}
    </HStack>
  );

  if (lock) {
    return (
      <VStack alignment="leading" spacing={1} modifiers={[widgetURL(url)]}>
        {tx(`${props.open} ${l.open}${props.late ? ` · ${props.late} ${l.late}` : ''}`, 'headline', null, { w: 'semibold' })}
        {rows[0] ? tx(rows[0].t, 'caption', null, { k: true }) : null}
        {tx(`${props.doneWeek} ${l.done}`, 'caption', sec)}
      </VStack>
    );
  }
  if (small) {
    return (
      <VStack alignment="leading" spacing={6} modifiers={root}>
        <HStack alignment="top" spacing={8}>{counts}<Spacer />{logoEl}</HStack>
        <Spacer />
        {rows[0] ? tx(rows[0].t, 'footnote', C.text, { w: 'medium', n: 2, k: true }) : null}
        {tx(props.late ? `${props.late} ${l.late}` : `${props.doneWeek} ${l.done}`, 'caption2', props.late ? C.warn : C.accent, { w: 'semibold' })}
      </VStack>
    );
  }
  if (!large) {
    return (
      <VStack alignment="leading" spacing={8} modifiers={root}>
        {head(props.title || 'HOMI', false)}
        <HStack alignment="top" spacing={12}>
          <VStack alignment="leading" spacing={6}>
            <HStack spacing={8}>{counts}{gauge}</HStack>
            <VStack alignment="leading" spacing={1}>{chipList}</VStack>
          </VStack>
          <VStack alignment="leading" spacing={5}>{rows.slice(0, 3).map(row)}<Spacer /></VStack>
        </HStack>
      </VStack>
    );
  }
  return (
    <VStack alignment="leading" spacing={10} modifiers={root}>
      {head(props.title || 'HOMI', false)}
      <HStack spacing={12}>{counts}<Spacer />{gauge}</HStack>
      <HStack spacing={10}>{chipList}</HStack>
      <VStack alignment="leading" spacing={6}>{rows.slice(0, 5).map(row)}</VStack>
      <Spacer />
      {cap(l.week)}
      {bars(props.week || [], props.doneWeek / 7, 60)}
    </VStack>
  );
};

export default createWidget('TasksWidget', TasksWidgetView);
