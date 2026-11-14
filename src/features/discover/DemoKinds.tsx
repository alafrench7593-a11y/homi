/**
 * Aperçus GÉNÉRIQUES par type d'outil (saisie, mesure, minuteur, tâches, journal, scanner, lecture, agenda, rappel,
 * question, aide, réglage), paramétrés par la démo de l'outil (`DemoSpec`, model.ts). Chacun montre UN geste
 * (`DemoTarget`) et SON résultat (`useDemo().done`). Valeurs d'exemple constantes : aucune donnée du foyer.
 */
import React, { useEffect, useMemo } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { MatteSurface } from '@/components/surfaces';
import { Sparkline } from '@/components/controls';
import { Icon, type IconName, Text } from '@/components/ui';
import { AnimatedNumber, CompletionCheck, Reveal, useMotion } from '@/motion';
import { formatDate, formatNumber, t as tr, type TKey } from '@/i18n';
import { clockHM } from '@/i18n/formats';
import { useTheme } from '@/theme/ThemeProvider';
import { alpha, radius, spacing } from '@/theme/tokens';
import { DemoTarget, useDemo } from './DemoPlayer';
import type { DemoSpec } from './model';
import { demoDay, demoTime, formatValue, journalItem, taskItem, unitLabel } from './texts';

// ------------------------------------------------------------------ petites pièces partagées
export function Capsule({ label, icon, tone = 'accent', style }: { label: string; icon?: IconName; tone?: 'accent' | 'glass'; style?: StyleProp<ViewStyle> }) {
  const t = useTheme();
  const accent = tone === 'accent';
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 40, paddingHorizontal: spacing.md, borderRadius: radius.pill,
      backgroundColor: accent ? t.colors.primary : t.material.glass.inset.fill, borderWidth: 1, borderColor: accent ? alpha('#FFFFFF', 0.35) : t.material.glass.inset.edge }, style]}>
      {icon ? <Icon name={icon} size={16} color={accent ? t.colors.primaryText : t.colors.text} /> : null}
      <Text weight="bold" color={accent ? t.colors.primaryText : t.colors.text} maxFontSizeMultiplier={1.3}>{label}</Text>
    </View>
  );
}

export function Panel({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <MatteSurface radius={radius.lg} padded={spacing.md} shadow={false} style={style}>{children}</MatteSurface>;
}

/** Fondu enchaîné entre deux états (état initial / résultat) — immédiat avec Réduire les animations. */
export function Swap({ on, a, b, style }: { on: boolean; a: React.ReactNode; b: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const m = useMotion();
  const v = useSharedValue(on ? 1 : 0);
  useEffect(() => { v.value = m.timing(on ? 1 : 0, 240, 'standard'); }, [on, m, v]);
  const sa = useAnimatedStyle(() => ({ opacity: 1 - v.value }));
  const sb = useAnimatedStyle(() => ({ opacity: v.value }));
  // l'état affiché est dans le flux (il donne la hauteur) ; l'autre, superposé, s'efface
  const abs = { position: 'absolute' as const, left: 0, right: 0, top: 0 };
  return (
    <View style={style}>
      <Animated.View style={[on ? abs : null, sa]} pointerEvents={on ? 'none' : 'auto'} accessibilityElementsHidden={on} importantForAccessibility={on ? 'no-hide-descendants' : 'auto'}>{a}</Animated.View>
      <Animated.View style={[on ? null : abs, sb]} pointerEvents={on ? 'auto' : 'none'} accessibilityElementsHidden={!on} importantForAccessibility={on ? 'auto' : 'no-hide-descendants'}>{b}</Animated.View>
    </View>
  );
}

const nowHM = () => { const d = new Date(); return clockHM(d.getHours(), d.getMinutes()); };

// ------------------------------------------------------------------ saisie : toucher « +120 ml » → la tuile passe de A à B
function EntryDemo({ d, label }: { d: Extract<DemoSpec, { kind: 'entry' }>; label: string }) {
  const t = useTheme();
  const { done } = useDemo();
  const chip = d.chip ?? { value: d.to - d.from, unit: d.unit };
  const chipText = `+${formatValue(chip.value, chip.unit, d.chip ? 0 : d.decimals)}`;
  const v = done ? d.to : d.from;
  return (
    <View style={{ gap: spacing.md, alignItems: 'center' }}>
      <Panel style={{ alignSelf: 'stretch' }}>
        <Text variant="small" muted>{label} · {tr('kn.today')}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
          <AnimatedNumber value={v} from={d.from} decimals={d.decimals ?? 0} style={{ fontSize: 40, lineHeight: 46, color: t.colors.text, fontFamily: 'SpaceGrotesk_500Medium' }} testID="demo-value" />
          <Text muted>{unitLabel(d.unit, v)}</Text>
        </View>
      </Panel>
      <DemoTarget label={chipText} round><Capsule label={chipText} icon="plus" /></DemoTarget>
    </View>
  );
}

// ------------------------------------------------------------------ mesure : « Ajouter une mesure » → la courbe se prolonge
function MeasureDemo({ d, label }: { d: Extract<DemoSpec, { kind: 'measure' }>; label: string }) {
  const t = useTheme();
  const { done } = useDemo();
  const last = d.series[d.series.length - 1];
  const series = done ? [...d.series, d.next] : d.series;
  return (
    <View style={{ gap: spacing.md, alignItems: 'center' }}>
      <Panel style={{ alignSelf: 'stretch' }}>
        <Text variant="small" muted>{label}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: spacing.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
            <AnimatedNumber value={done ? d.next : last} from={last} decimals={d.decimals ?? 0} style={{ fontSize: 36, lineHeight: 42, color: t.colors.text, fontFamily: 'SpaceGrotesk_500Medium' }} testID="demo-value" />
            {d.unit === 'pct' ? <Text muted>%</Text> : <Text muted>{unitLabel(d.unit, done ? d.next : last)}</Text>}
          </View>
          <Sparkline series={series} color={t.tokens.accent.glow[0]} width={120} height={34} />
        </View>
      </Panel>
      <DemoTarget label={tr('kn.k.measure.add')} round><Capsule label={tr('kn.k.measure.add')} icon="plus" /></DemoTarget>
    </View>
  );
}

// ------------------------------------------------------------------ minuteur : « Démarrer » → durée enregistrée
function TimerDemo({ d }: { d: Extract<DemoSpec, { kind: 'timer' }> }) {
  const t = useTheme();
  const m = useMotion();
  const { done } = useDemo();
  const turn = useSharedValue(0);
  useEffect(() => { turn.value = done ? m.timing(1, 900, 'decelerate') : 0; }, [done, m, turn]);
  const hand = useAnimatedStyle(() => ({ transform: [{ rotate: `${turn.value * 300}deg` }] }));
  return (
    <View style={{ gap: spacing.md, alignItems: 'center' }}>
      <View style={{ width: 112, height: 112, borderRadius: 56, borderWidth: 2, borderColor: alpha(t.tokens.accent.glow[0], 0.6), alignItems: 'center', justifyContent: 'center' }}>
        <Animated.View pointerEvents="none" style={[{ position: 'absolute', width: 112, height: 112, alignItems: 'center' }, hand]}>
          <View style={{ width: 4, height: 44, marginTop: 10, borderRadius: 2, backgroundColor: t.tokens.accent.glow[0] }} />
        </Animated.View>
        <AnimatedNumber value={done ? d.minutes : 0} from={0} suffix=" min" style={{ fontSize: 22, color: t.colors.text, fontFamily: 'SpaceGrotesk_500Medium' }} testID="demo-value" />
      </View>
      <Swap on={done}
        a={<DemoTarget label={tr('kn.k.timer.start')} round><Capsule label={tr('kn.k.timer.start')} icon="play" /></DemoTarget>}
        b={<View style={{ alignItems: 'center' }}><Capsule tone="glass" icon="check" label={tr('kn.k.timer.saved')} /></View>} />
    </View>
  );
}

// ------------------------------------------------------------------ tâches : cocher → « 1 sur 3, fait par Sam »
function TasksDemo({ d }: { d: Extract<DemoSpec, { kind: 'tasks' }> }) {
  const { done, apply } = useDemo();
  const items = [taskItem(d.set, 1), taskItem(d.set, 2), taskItem(d.set, 3)];
  return (
    <Panel style={{ alignSelf: 'stretch', gap: spacing.sm }}>
      {items.map((it, i) => (
        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 40 }}>
          {i === 0 ? (
            <DemoTarget label={it} pressable={false} round>
              <CompletionCheck done={done} onToggle={() => apply()} label={tr('kn.k.tasks.gesture', { item: it })} testID="demo-target" />
            </DemoTarget>
          ) : <CompletionCheck done={false} onToggle={() => undefined} label={it} disabled />}
          <View style={{ flex: 1 }}>
            <Text style={i === 0 && done ? { textDecorationLine: 'line-through' } : undefined}>{it}</Text>
            {i === 0 ? <Reveal visible={done}><Text variant="small" muted>{tr('kn.k.tasks.done')}</Text></Reveal> : null}
          </View>
        </View>
      ))}
      <Text variant="small" muted testID="demo-value">{formatNumber(done ? 1 : 0)} / {formatNumber(3)}</Text>
    </Panel>
  );
}

// ------------------------------------------------------------------ journal : toucher une option → ligne du jour
function JournalDemo({ d }: { d: Extract<DemoSpec, { kind: 'journal' }> }) {
  const t = useTheme();
  const { done } = useDemo();
  const items = [journalItem(d.set, 1), journalItem(d.set, 2), journalItem(d.set, 3)];
  return (
    <View style={{ gap: spacing.md, alignSelf: 'stretch' }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.xs }}>
        {items.map((it, i) => (i === 0
          ? <DemoTarget key={i} label={it} round><Capsule label={it} tone={done ? 'accent' : 'glass'} icon={done ? 'check' : undefined} /></DemoTarget>
          : <Capsule key={i} label={it} tone="glass" />))}
      </View>
      <Panel style={{ minHeight: 64, justifyContent: 'center' }}>
        <Swap on={done}
          a={<Text muted center>{tr('kn.today')} · —</Text>}
          b={<View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: t.tokens.accent.glow[0] }} />
            <Text variant="small" muted>{tr('kn.today')} · {nowHM()}</Text>
            <Text weight="bold" style={{ flex: 1 }}>{items[0]}</Text>
          </View>} />
      </Panel>
    </View>
  );
}

// ------------------------------------------------------------------ scanner : « Scanner » → verdict et raison
function ScanDemo({ d }: { d: Extract<DemoSpec, { kind: 'scan' }> }) {
  const t = useTheme();
  const m = useMotion();
  const { done } = useDemo();
  const sweep = useSharedValue(0);
  useEffect(() => { sweep.value = done ? m.timing(1, 520, 'standard') : 0; }, [done, m, sweep]);
  const laser = useAnimatedStyle(() => ({ opacity: sweep.value > 0 && sweep.value < 1 ? 1 : 0, transform: [{ translateY: 8 + sweep.value * 72 }] }));
  const ok = d.verdict === 'ok';
  const tone = ok ? t.colors.success : t.colors.warning;
  return (
    <View style={{ gap: spacing.sm, alignSelf: 'stretch', alignItems: 'center' }}>
      <View style={{ width: 180, height: 96, borderRadius: radius.md, borderWidth: 2, borderColor: alpha(t.tokens.accent.glow[0], 0.55), alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <View style={{ flexDirection: 'row', gap: 3, height: 48, alignItems: 'stretch' }}>
          {[3, 1, 2, 1, 3, 2, 1, 1, 3, 1, 2, 3, 1, 2].map((w, i) => <View key={i} style={{ width: w, backgroundColor: t.colors.text, opacity: 0.75 }} />)}
        </View>
        <Animated.View pointerEvents="none" style={[{ position: 'absolute', top: 0, left: 8, right: 8, height: 2, backgroundColor: t.tokens.accent.glow[0] }, laser]} />
      </View>
      <Swap on={done} style={{ alignSelf: 'stretch' }}
        a={<View style={{ alignItems: 'center' }}><DemoTarget label={tr('kn.k.scan.btn')} round><Capsule label={tr('kn.k.scan.btn')} icon="maximize" /></DemoTarget></View>}
        b={<Panel style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Icon name={ok ? 'check-circle' : 'alert-triangle'} size={24} color={tone} />
          <View style={{ flex: 1 }}>
            <Text weight="bold">{tr(`kn.k.scan.${d.set}.${d.verdict}` as TKey)}</Text>
            <Text variant="small" muted>{tr(`kn.k.scan.v.${d.set}.${d.verdict}` as TKey)}</Text>
          </View>
        </Panel>} />
    </View>
  );
}

// ------------------------------------------------------------------ lecture / vidéo : toucher une fiche → elle s'ouvre
function ReadDemo({ d, label }: { d: Extract<DemoSpec, { kind: 'read' }>; label: string }) {
  const t = useTheme();
  const m = useMotion();
  const { done } = useDemo();
  const bar = useSharedValue(0);
  useEffect(() => { bar.value = done && d.video ? m.timing(0.35, 900, 'decelerate') : 0; }, [done, d.video, m, bar]);
  const progress = useAnimatedStyle(() => ({ transform: [{ scaleX: bar.value }] }));
  if (d.video) {
    return (
      <View style={{ gap: spacing.sm, alignSelf: 'stretch' }}>
        <DemoTarget label={tr('kn.k.read.vgesture')}>
          <View style={{ alignSelf: 'stretch', width: 260, height: 132, borderRadius: radius.md, backgroundColor: alpha(t.tokens.accent.glow[0], t.isDark ? 0.16 : 0.2), alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            <Icon name={done ? 'pause' : 'play'} size={34} color={t.colors.text} />
            <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 4, backgroundColor: alpha(t.colors.text, 0.15) }}>
              <Animated.View style={[{ height: 4, width: 260, backgroundColor: t.tokens.accent.glow[0], transformOrigin: 'left' }, progress]} />
            </View>
          </View>
        </DemoTarget>
        <Reveal visible={done}><Text variant="small" muted center>{label} · {tr('kn.k.read.vresult')}</Text></Reveal>
      </View>
    );
  }
  const cards: TKey[] = ['kn.k.read.c1', 'kn.k.read.c2', 'kn.k.read.c3'];
  return (
    <View style={{ gap: spacing.xs, alignSelf: 'stretch' }}>
      {cards.map((k, i) => {
        const row = (
          <Panel style={{ alignSelf: 'stretch', paddingVertical: spacing.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Icon name={i === 0 ? 'book-open' : i === 1 ? 'help-circle' : 'phone'} size={18} color={t.tokens.accent.glow[0]} />
              <Text weight="bold" style={{ flex: 1 }}>{tr(k)}</Text>
              <Text variant="small" muted>{tr('kn.k.read.min', { n: 2 + i })}</Text>
            </View>
            {i === 0 ? <Reveal visible={done}><Text variant="small" muted style={{ marginTop: 4 }}>{tr('kn.k.read.excerpt')}</Text></Reveal> : null}
          </Panel>
        );
        return i === 0 ? <DemoTarget key={k} label={tr(k)} style={{ alignSelf: 'stretch', alignItems: 'stretch' }}>{row}</DemoTarget> : <View key={k}>{row}</View>;
      })}
    </View>
  );
}

// ------------------------------------------------------------------ agenda : toucher un jour → l'évènement s'ajoute
function PlanDemo({ d }: { d: Extract<DemoSpec, { kind: 'plan' }> }) {
  const t = useTheme();
  const { done } = useDemo();
  const start = Math.max(0, d.inDays - 3);
  const days = useMemo(() => Array.from({ length: 5 }, (_, i) => {
    const n = new Date(); const x = new Date(n.getFullYear(), n.getMonth(), n.getDate() + start + i, 12);
    return { off: start + i, num: x.getDate(), wd: formatDate(x, { weekday: 'short' }) };
  }), [start]);
  const event = tr(`kn.k.plan.${d.set}` as TKey);
  return (
    <View style={{ gap: spacing.md, alignSelf: 'stretch' }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {days.map((x) => {
          const target = x.off === d.inDays;
          const cell = (
            <View style={{ width: 46, height: 58, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center',
              backgroundColor: target && done ? t.colors.primary : t.material.glass.inset.fill, borderWidth: 1, borderColor: t.material.glass.inset.edge }}>
              <Text variant="caption" color={target && done ? t.colors.primaryText : t.colors.textMuted}>{x.wd}</Text>
              <Text weight="bold" color={target && done ? t.colors.primaryText : t.colors.text}>{formatNumber(x.num)}</Text>
            </View>
          );
          return target ? <DemoTarget key={x.off} label={demoDay(d.inDays)}>{cell}</DemoTarget> : <View key={x.off}>{cell}</View>;
        })}
      </View>
      <Panel style={{ minHeight: 60, justifyContent: 'center' }}>
        <Swap on={done}
          a={<Text muted center>{demoDay(d.inDays)}</Text>}
          b={<View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <View style={{ width: 4, alignSelf: 'stretch', borderRadius: 2, backgroundColor: t.tokens.accent.glow[0] }} />
            <View style={{ flex: 1 }}>
              <Text weight="bold">{event}</Text>
              <Text variant="small" muted>{demoDay(d.inDays)} · {demoTime(d.time)}</Text>
            </View>
          </View>} />
      </Panel>
    </View>
  );
}

// ------------------------------------------------------------------ interrupteur partagé (rappel, réglage)
function DemoSwitch({ on }: { on: boolean }) {
  const t = useTheme();
  const m = useMotion();
  const x = useSharedValue(on ? 1 : 0);
  useEffect(() => { x.value = m.spring(on ? 1 : 0, 'vif'); }, [on, m, x]);
  const knob = useAnimatedStyle(() => ({ transform: [{ translateX: x.value * 22 }] }));
  return (
    <View style={{ width: 52, height: 30, borderRadius: 15, padding: 3, backgroundColor: on ? t.colors.primary : alpha(t.colors.text, 0.18) }}>
      <Animated.View style={[{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#FFFFFF' }, knob]} />
    </View>
  );
}

function RemindDemo({ d }: { d: Extract<DemoSpec, { kind: 'remind' }> }) {
  const t = useTheme();
  const m = useMotion();
  const { done } = useDemo();
  const ring = useSharedValue(0);
  useEffect(() => { ring.value = done ? m.timing(1, 600, 'standard') : 0; }, [done, m, ring]);
  const bell = useAnimatedStyle(() => ({ transform: [{ rotate: `${Math.sin(ring.value * Math.PI * 4) * 14 * (1 - ring.value)}deg` }] }));
  return (
    <Panel style={{ alignSelf: 'stretch', gap: spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <Animated.View style={bell}><Icon name="bell" size={22} color={done ? t.tokens.accent.glow[0] : t.colors.textMuted} /></Animated.View>
        <View style={{ flex: 1 }}>
          <Text weight="bold">{tr('kn.k.remind.row')}</Text>
          <Text variant="small" muted>{demoTime(d.time)}</Text>
        </View>
        <DemoTarget label={tr('kn.k.remind.gesture')} round><DemoSwitch on={done} /></DemoTarget>
      </View>
      <Reveal visible={done}><Text variant="small" muted>{tr('kn.k.remind.result', { time: demoTime(d.time) })}</Text></Reveal>
    </Panel>
  );
}

function SettingDemo({ d, label }: { d: Extract<DemoSpec, { kind: 'setting' }>; label: string }) {
  const { done } = useDemo();
  if (d.set === 'date') {
    const n = new Date();
    const fmt = (k: number) => formatDate(new Date(n.getFullYear(), n.getMonth(), n.getDate() + k, 12), { day: 'numeric', month: 'short' });
    return (
      <View style={{ gap: spacing.md, alignSelf: 'stretch', alignItems: 'center' }}>
        <Panel style={{ alignSelf: 'stretch' }}>
          <Text variant="small" muted>{tr('kn.k.setting.dateRow')}</Text>
          <Swap on={done} a={<Text variant="heading">{fmt(120)}</Text>} b={<Text variant="heading">{fmt(127)}</Text>} />
        </Panel>
        <DemoTarget label={tr('kn.k.setting.dateGesture')} round><Capsule label={fmt(127)} icon="calendar" tone={done ? 'accent' : 'glass'} /></DemoTarget>
      </View>
    );
  }
  return (
    <Panel style={{ alignSelf: 'stretch' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <View style={{ flex: 1 }}>
          <Text weight="bold">{label}</Text>
          <Swap on={done} a={<Text variant="small" muted>{tr('kn.k.setting.off')}</Text>} b={<Text variant="small" muted>{tr('kn.k.setting.on')}</Text>} />
        </View>
        <DemoTarget label={tr('kn.k.setting.gesture')} round><DemoSwitch on={done} /></DemoTarget>
      </View>
    </Panel>
  );
}

// ------------------------------------------------------------------ question : toucher la question → réponse sourcée
function Bubble({ text, mine, who }: { text: string; mine?: boolean; who?: string }) {
  const t = useTheme();
  return (
    <View style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '86%', padding: spacing.sm, borderRadius: radius.md,
      backgroundColor: mine ? t.colors.primary : t.material.glass.inset.fill, borderWidth: mine ? 0 : 1, borderColor: t.material.glass.inset.edge }}>
      {who ? <Text variant="caption" muted>{who}</Text> : null}
      <Text variant="small" color={mine ? t.colors.primaryText : t.colors.text}>{text}</Text>
    </View>
  );
}
function AskDemo({ d }: { d: Extract<DemoSpec, { kind: 'ask' }> }) {
  const { done } = useDemo();
  const q = tr(`kn.k.ask.${d.set}.q` as TKey);
  const a = tr(`kn.k.ask.${d.set}.a` as TKey);
  const community = d.set === 'community';
  return (
    <View style={{ gap: spacing.sm, alignSelf: 'stretch' }}>
      <Swap on={done}
        a={community
          ? <Panel style={{ gap: spacing.sm }}><Text>{q}</Text><View style={{ alignItems: 'flex-end' }}><DemoTarget label={tr('kn.k.ask.publish')} round><Capsule label={tr('kn.k.ask.publish')} icon="send" /></DemoTarget></View></Panel>
          : <View style={{ alignItems: 'center' }}><DemoTarget label={q} round><Capsule label={q} tone="glass" icon="message-circle" /></DemoTarget></View>}
        b={<View style={{ gap: spacing.sm }}>
          <Bubble text={q} mine />
          <Bubble text={a} who={community ? tr('kn.k.ask.community.who') : undefined} />
        </View>} />
    </View>
  );
}

// ------------------------------------------------------------------ aide : « J'ai besoin d'aide » → numéros et gestes
function HelpDemo() {
  const t = useTheme();
  const { done } = useDemo();
  const lines: [IconName, TKey][] = [['phone', 'kn.k.help.l1'], ['heart', 'kn.k.help.l2'], ['users', 'kn.k.help.l3']];
  return (
    <View style={{ gap: spacing.sm, alignSelf: 'stretch' }}>
      <View style={{ alignItems: 'center' }}>
        <DemoTarget label={tr('kn.k.help.btn')} round><Capsule label={tr('kn.k.help.btn')} icon="life-buoy" /></DemoTarget>
      </View>
      {lines.map(([icon, k]) => (
        <Reveal key={k} visible={done}>
          <Panel style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm }}>
            <Icon name={icon} size={18} color={t.colors.danger} />
            <Text style={{ flex: 1 }}>{tr(k)}</Text>
          </Panel>
        </Reveal>
      ))}
    </View>
  );
}

/** Aperçu générique d'un outil (type ≠ sur mesure). */
export function GenericDemo({ demo, label }: { demo: Exclude<DemoSpec, { kind: 'custom' }>; label: string }) {
  switch (demo.kind) {
    case 'entry': return <EntryDemo d={demo} label={label} />;
    case 'measure': return <MeasureDemo d={demo} label={label} />;
    case 'timer': return <TimerDemo d={demo} />;
    case 'tasks': return <TasksDemo d={demo} />;
    case 'journal': return <JournalDemo d={demo} />;
    case 'scan': return <ScanDemo d={demo} />;
    case 'read': return <ReadDemo d={demo} label={label} />;
    case 'plan': return <PlanDemo d={demo} />;
    case 'remind': return <RemindDemo d={demo} />;
    case 'ask': return <AskDemo d={demo} />;
    case 'help': return <HelpDemo />;
    case 'setting': return <SettingDemo d={demo} label={label} />;
  }
}
