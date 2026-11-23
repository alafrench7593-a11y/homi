/**
 * Mini-démos de la « première réussite » — VRAIS composants et vraie logique de HOMI, données d'exemple signalées,
 * rien n'est enregistré, aucun appel réseau ni IA :
 *  - checklist : modèle « Valise de maternité » de l'outil Listes (src/content/checklists.ts) + case de fin de tâche
 *    partagée (`CompletionCheck`) ;
 *  - sleepLog : planificateur de sommeil réel (`planDay`) et frise du journal (`SleepTimeline`) de l'outil Sommeil ;
 *  - routine : pictogrammes et libellés des routines en images (/family/kid-routines) ;
 *  - relay : ce que le co-parent verrait (partagé dans le foyer) et ce qui reste privé (humeur et journal intime :
 *    propriétaire seul ; cycle : partage explicite ; poids : jamais partagé sans choix).
 * Chaque démo appelle `onDone` UNE fois, juste après l'action utile.
 */
import React, { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, Chip, Icon, Text } from '@/components/ui';
import { CompletionCheck, CompletionGlow } from '@/motion';
import { CHECKLIST_TEMPLATES } from '@/content/checklists';
import { SleepTimeline } from '@/features/sleep';
import { planDay, type SleepRecord } from '@/lib/domain/sleepPlanner';
import { formatNumber, formatTime, t as tr, type TKey } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH, radius, spacing } from '@/theme/tokens';
import { DemoCard } from './kit';
import type { DemoResult } from './model';

export interface DemoProps {
  onDone: (r: DemoResult) => void;
  result: DemoResult | null;
  now?: Date;
  /** Écran « résultat » : seulement ce qui vient d'être fait (la démo complète reste sur l'écran précédent) */
  compact?: boolean;
}

const MIN = 60_000;
const nowOf = (now?: Date) => now ?? new Date();

// ------------------------------------------------------------------ checklist naissance (valise de maternité)
export const CHECKLIST_DEMO_COUNT = 5;
export const checklistItems = (): string[] => CHECKLIST_TEMPLATES.maternity_bag.items.slice(0, CHECKLIST_DEMO_COUNT);
export const checklistLabel = (key: string) => checklistItems()[Number(key.split(':')[1] ?? 0)] ?? '';

export function ChecklistDemo({ onDone, result, now, compact }: DemoProps) {
  const all = checklistItems();
  const items = compact ? all.slice(0, 3) : all;
  const [done, setDone] = useState<Set<number>>(() => new Set(result ? [Number(result.itemKey.split(':')[1])] : []));
  function toggle(i: number, next: boolean) {
    const s = new Set(done);
    if (next) s.add(i); else s.delete(i);
    setDone(s);
    if (next && !result) onDone({ kind: 'checklist', itemKey: `maternity_bag:${i}`, at: nowOf(now).toISOString() });
  }
  return (
    <DemoCard title={tr('fw.demo.checklist.title')} testID="fw-demo-checklist" compact={compact}>
      <Text variant="small" muted testID="fw-checklist-progress">{tr('fw.demo.checklist.progress', { done: done.size, total: all.length, count: done.size })}</Text>
      <View style={{ gap: 2 }}>
        {items.map((label, i) => (
          <CompletionGlow key={label} done={done.has(i)} radius={radius.md}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: MIN_TOUCH }}>
              <CompletionCheck done={done.has(i)} onToggle={(n) => toggle(i, n)} label={tr('fw.demo.checklist.check', { item: label })} testID={`fw-check-${i}`} />
              <Text style={{ flex: 1, textDecorationLine: done.has(i) ? 'line-through' : 'none' }} muted={done.has(i)}>{label}</Text>
            </View>
          </CompletionGlow>
        ))}
      </View>
    </DemoCard>
  );
}

// ------------------------------------------------------------------ journal repas et siestes
/** Journée d'exemple : nuit terminée il y a 4 h, biberon il y a 50 min ; la sieste ajoutée finit maintenant (45 min). */
export function sleepDemoRecords(now: Date, withNap: boolean): SleepRecord[] {
  const N = now.getTime();
  const base: SleepRecord[] = [{ id: 'demo-night', child_id: 'demo', kind: 'night', started_at: new Date(N - 15 * 60 * MIN).toISOString(), ended_at: new Date(N - 4 * 60 * MIN).toISOString() }];
  return withNap ? [...base, { id: 'demo-nap', child_id: 'demo', kind: 'nap', started_at: new Date(N - 45 * MIN).toISOString(), ended_at: now.toISOString() }] : base;
}
export const DEMO_BOTTLE = { ml: 150, minutesAgo: 50 };
const napResult = (now?: Date): DemoResult => ({ kind: 'sleepLog', itemKey: 'nap', at: nowOf(now).toISOString() });
const birthSevenMonths = (now: Date) => { const d = new Date(now); d.setMonth(d.getMonth() - 7); return d.toISOString().slice(0, 10); };

export function SleepLogDemo({ onDone, result, now, compact }: DemoProps) {
  const at = useMemo(() => (result ? new Date(result.at) : nowOf(now)), [result, now]);
  const added = !!result;
  const plan = useMemo(() => planDay({ childId: 'demo', birthDate: birthSevenMonths(at), sleeps: sleepDemoRecords(at, added), now: at }), [at, added]);
  const meal = new Date(at.getTime() - DEMO_BOTTLE.minutesAgo * MIN);
  return (
    <DemoCard title={tr('fw.demo.sleepLog.title')} testID="fw-demo-sleepLog" compact={compact}>
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <Tile icon="coffee" label={tr('fw.demo.sleepLog.lastMeal')} value={tr('fw.demo.sleepLog.meal', { ml: formatNumber(DEMO_BOTTLE.ml), time: formatTime(meal) })} testID="fw-last-meal" />
        <Tile icon="moon" label={tr('fw.demo.sleepLog.lastNap')} value={added ? tr('fw.demo.sleepLog.napValue', { time: formatTime(at), minutes: formatNumber(45) }) : tr('fw.demo.sleepLog.none')} highlight={added} testID="fw-last-nap" />
      </View>
      {!compact ? <SleepTimeline plan={plan} showEstimates now={at} /> : null}
      {!added ? (
        <Button label={tr('fw.demo.sleepLog.add')} icon="plus" size="lg" full onPress={() => onDone(napResult(now))} testID="fw-add-nap" />
      ) : null}
    </DemoCard>
  );
}

function Tile({ icon, label, value, highlight, testID }: { icon: React.ComponentProps<typeof Icon>['name']; label: string; value: string; highlight?: boolean; testID?: string }) {
  const th = useTheme();
  return (
    <CompletionGlow done={!!highlight} radius={radius.md} style={{ flex: 1 }}>
      <View testID={testID} accessible accessibilityLabel={`${label} : ${value}`} style={{ flex: 1, borderRadius: radius.md, padding: spacing.sm, gap: 2, backgroundColor: highlight ? th.material.lines.iconWell : th.colors.surfaceAlt }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Icon name={icon} size={14} color={th.colors.primary} />
          <Text variant="caption" weight="bold" muted>{label}</Text>
        </View>
        <Text variant="small" weight="bold">{value}</Text>
      </View>
    </CompletionGlow>
  );
}

// ------------------------------------------------------------------ routine visuelle du matin
export const ROUTINE_BASE = ['weather-sunny', 'toilet', 'food-croissant', 'toothbrush-paste'] as const;
export const ROUTINE_MISSING = ['tshirt-crew', 'shoe-sneaker'] as const;
export const pictoLabel = (icon: string) => tr(`kr.p.${icon.replace(/-/g, '_')}` as TKey);

export function RoutineDemo({ onDone, result, now, compact }: DemoProps) {
  const th = useTheme();
  const [steps, setSteps] = useState<string[]>(() => (result ? [...ROUTINE_BASE, result.itemKey] : [...ROUTINE_BASE]));
  const [checked, setChecked] = useState<Set<string>>(() => new Set(result ? ['weather-sunny', 'toilet', result.itemKey] : ['weather-sunny', 'toilet']));
  const extra = steps.find((s) => !(ROUTINE_BASE as readonly string[]).includes(s));
  function check(icon: string) {
    if (checked.has(icon)) return;
    const s = new Set(checked); s.add(icon); setChecked(s);
    if (icon === extra && !result) onDone({ kind: 'routine', itemKey: icon, at: nowOf(now).toISOString() });
  }
  return (
    <DemoCard title={tr('fw.demo.routine.title')} testID="fw-demo-routine" compact={compact}>
      <Text variant="small" muted>{tr('fw.demo.routine.done', { done: checked.size, total: steps.length, count: checked.size })}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }} accessibilityRole="list">
        {steps.map((icon) => {
          const on = checked.has(icon);
          return (
            <CompletionGlow key={icon} done={on} radius={radius.md}>
              <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: on }} aria-checked={on} accessibilityLabel={tr('fw.demo.routine.checkA11y', { step: pictoLabel(icon) })}
                onPress={() => check(icon)} testID={`fw-step-${icon}`}
                style={{ width: 92, minHeight: 104, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', gap: 4, padding: spacing.xs,
                  borderWidth: 1.5, borderColor: on ? th.colors.success : th.colors.border, backgroundColor: on ? th.material.lines.iconWell : th.colors.surface }}>
                <MaterialCommunityIcons name={icon as never} size={36} color={on ? th.colors.success : th.colors.primary} />
                <Text variant="caption" center numberOfLines={2}>{pictoLabel(icon)}</Text>
                {on ? <Icon name="check-circle" size={14} color={th.colors.success} /> : null}
              </Pressable>
            </CompletionGlow>
          );
        })}
      </View>
      {!extra ? (
        <View style={{ gap: spacing.xs }}>
          <Text variant="label">{tr('fw.demo.routine.add')}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
            {ROUTINE_MISSING.map((icon) => (
              <Chip key={icon} label={pictoLabel(icon)} icon="plus" accessibilityLabel={tr('fw.demo.routine.addA11y', { step: pictoLabel(icon) })}
                onPress={() => setSteps([...steps, icon])} testID={`fw-add-${icon}`} />
            ))}
          </View>
        </View>
      ) : null}
    </DemoCard>
  );
}

// ------------------------------------------------------------------ relais à deux
const SHARED: TKey[] = ['fw.demo.relay.s.calendar', 'fw.demo.relay.s.tasks', 'fw.demo.relay.s.kids', 'fw.demo.relay.s.shopping'];
const PRIVATE: TKey[] = ['fw.demo.relay.p.mood', 'fw.demo.relay.p.cycle', 'fw.demo.relay.p.weight'];

export function RelayDemo({ onDone, result, now, compact }: DemoProps) {
  const th = useTheme();
  const sent = !!result;
  return (
    <DemoCard title={tr('fw.demo.relay.title')} testID="fw-demo-relay" compact={compact}>
      {/* Ce que le co-parent peut consulter : aussi dans l'aperçu du paywall (compact) */}
      <View style={{ gap: 6 }} accessibilityRole="list" accessibilityLabel={tr('fw.demo.relay.shared')} testID="fw-relay-shared">
        <Text variant="label">{tr('fw.demo.relay.shared')}</Text>
        {SHARED.map((k) => (
          <View key={k} style={{ flexDirection: 'row', gap: spacing.xs, alignItems: 'center' }} accessible accessibilityLabel={tr(k)}>
            <Icon name="eye" size={15} color={th.colors.primary} /><Text variant="small" style={{ flex: 1 }}>{tr(k)}</Text>
          </View>
        ))}
      </View>
      {!compact ? (
      <View style={{ gap: 6 }} accessibilityRole="list" accessibilityLabel={tr('fw.demo.relay.private')} testID="fw-relay-private">
        <Text variant="label">{tr('fw.demo.relay.private')}</Text>
        {PRIVATE.map((k) => (
          <View key={k} style={{ flexDirection: 'row', gap: spacing.xs, alignItems: 'center' }} accessible accessibilityLabel={tr(k)}>
            <Icon name="lock" size={15} color={th.colors.textMuted} /><Text variant="small" muted style={{ flex: 1 }}>{tr(k)}</Text>
          </View>
        ))}
      </View>
      ) : null}
      {sent ? (
        <CompletionGlow done radius={radius.md}>
          <View testID="fw-relay-sent" style={{ borderRadius: radius.md, padding: spacing.sm, backgroundColor: th.material.lines.iconWell, flexDirection: 'row', gap: spacing.xs }}>
            <Icon name="send" size={16} color={th.colors.primary} />
            <Text variant="small" style={{ flex: 1 }}>{tr('fw.demo.relay.sent', { task: tr('fw.demo.relay.task'), time: formatTime(result.at) })}</Text>
          </View>
        </CompletionGlow>
      ) : (
        <View style={{ gap: spacing.xs }}>
          <Text variant="small">{tr('fw.demo.relay.mission')}</Text>
          <Button label={tr('fw.demo.relay.send')} icon="send" size="lg" full onPress={() => onDone({ kind: 'relay', itemKey: 'mission', at: nowOf(now).toISOString() })} testID="fw-relay-send" />
        </View>
      )}
    </DemoCard>
  );
}

export const DEMOS = { checklist: ChecklistDemo, sleepLog: SleepLogDemo, routine: RoutineDemo, relay: RelayDemo } as const;

/** Phrase du résultat, juste après l'action. */
export function resultText(r: DemoResult): string {
  const time = formatTime(r.at);
  switch (r.kind) {
    case 'checklist': return tr('fw.result.checklist', { time, item: checklistLabel(r.itemKey) });
    case 'sleepLog': return tr('fw.result.sleepLog', { time });
    case 'routine': return tr('fw.result.routine', { time, item: pictoLabel(r.itemKey) });
    case 'relay': return tr('fw.result.relay', { time });
  }
}
