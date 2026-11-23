/**
 * Catégorie « Santé » — niveau 2 du tracking (en tête de /tools/health) et remontée sur l'accueil (22/11/2026).
 * Lit les MÊMES lignes que les mini-apps (aucune copie) :
 *  · dernière température de l'enfant affiché (48 h) → la fiche de CETTE prise dans « Suivi de santé » ;
 *  · observations du jour (compte réel ; aucune → « rien de noté », jamais 0) ;
 *  · prises de médicament du jour de toute la famille : « 2 / 3 » notées ; prévues sans réponse → « rien de noté ».
 * Aucune interprétation médicale : la valeur est montrée telle que notée, avec son heure.
 */
import React, { useMemo } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Glass } from '@/components/glass';
import { Tappable } from '@/components/Tappable';
import { haptic, Icon, Text, type IconName } from '@/components/ui';
import { t as tr } from '@/i18n';
import { useActiveSubject, useChildren, useLogs } from '@/lib/data/hooks';
import { useNow } from '@/lib/data/hooks-bottle';
import { useDoseLogsSince, useFamilyChildTreatments, useMyTreatments } from '@/lib/data/hooks-myTreatments';
import { agoLabel } from '@/lib/domain/dayTimeline';
import { clock } from '@/lib/domain/sleepPlanner';
import { doseDay, observationsByDay, recentTemperature, tempValue } from '@/lib/domain/healthTrack';
import { dosesFor } from '@/features/needs';
import type { Child, Observation } from '@/lib/types';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, MIN_TOUCH, radius, spacing } from '@/theme/tokens';
import { obsTitle, tempText } from './ObservationLog';
import { TABULAR } from './TimedJournal';

const openObs = (child: Child, id?: string) => router.push({ pathname: '/child/[id]/health-tracking', params: { id: child.id, ...(id ? { obs: id } : {}) } } as never);

export function HealthCategorySummary() {
  const { subject } = useActiveSubject();
  const { data: children } = useChildren();
  const child = subject?.type === 'child' ? (children ?? []).find((c) => c.id === subject.id) ?? null : null;
  return <Summary key={child?.id ?? 'none'} child={child} kids={children ?? []} />;
}

function useTodayDoses(children: readonly Child[], now: Date) {
  const dayStart = useMemo(() => { const d = new Date(now); d.setHours(0, 0, 0, 0); return d; }, [now.toDateString()]); // eslint-disable-line react-hooks/exhaustive-deps
  const mine = useMyTreatments().data ?? [];
  const childT = useFamilyChildTreatments().data ?? [];
  const logs = useDoseLogsSince(dayStart.toISOString());
  return useMemo(() => {
    const rows = [
      ...dosesFor(dayStart, mine, logs.mine ?? []),
      ...children.flatMap((c) => dosesFor(dayStart, childT.filter((x) => x.child_id === c.id), logs.child ?? [])),
    ];
    return doseDay(rows.map((d) => ({ scheduledFor: d.scheduledFor, log: d.log })));
  }, [dayStart, mine, childT, children, logs.mine, logs.child]);
}

function Line({ icon, label, value, sub, onPress, testID }: { icon: IconName; label: string; value: string; sub?: string | null; onPress: () => void; testID: string }) {
  const t = useTheme();
  return (
    <Tappable accessibilityRole="button" testID={testID} accessibilityLabel={`${label}. ${value}${sub ? `. ${sub}` : ''}`} onPress={() => { haptic('selection'); onPress(); }}
      style={({ pressed }) => ({ minHeight: MIN_TOUCH, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, opacity: pressed ? 0.7 : 1 })}>
      <Icon name={icon} size={18} color={t.colors.textMuted} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text variant="caption" muted>{label}</Text>
        <Text weight="bold" style={[{ fontSize: 20, lineHeight: 26, fontFamily: fonts.display }, TABULAR]} testID={`${testID}-value`}>{value}</Text>
        {sub ? <Text variant="caption" muted style={TABULAR}>{sub}</Text> : null}
      </View>
      <Icon name="chevron-right" size={18} color={t.colors.textMuted} />
    </Tappable>
  );
}

function Summary({ child, kids }: { child: Child | null; kids: readonly Child[] }) {
  const now = useNow(60_000);
  const q = useLogs<Observation>('observation', child?.id ?? null, 2);
  const obs = q.data ?? [];
  const doses = useTodayDoses(kids, now);
  const temp = child ? recentTemperature(obs, child.id, now, 48) : null;
  const today = child ? observationsByDay(obs, child.id, now, 1)[0] : null;
  if (!child && !doses.planned) return null;
  return (
    <Glass variant="card" radius={radius.xl} contentStyle={{ padding: spacing.md, gap: 4 }} testID="health-category-summary">
      {child && temp ? (
        <Line testID="health-cat-temp" icon="thermometer" label={tr('ht.obs.lastTemp', { name: child.first_name })} value={tr('ht.obs.tempValue', { value: tempText(tempValue(temp)!) })}
          sub={`${tr('ht.obs.atClock', { time: clock(new Date(temp.at)) })} · ${agoLabel(temp.at, now)}`} onPress={() => openObs(child, temp.id)} />
      ) : null}
      {child && today ? (
        <Line testID="health-cat-obs" icon="activity" label={tr('ht.cat.obsToday', { name: child.first_name })}
          value={today.count != null ? tr('ht.obs.count', { count: today.count }) : tr('ht.none')}
          sub={today.entries[0] ? `${clock(new Date(today.entries[0].at))} · ${obsTitle(today.entries[0])}` : null} onPress={() => openObs(child, today.entries[0]?.id)} />
      ) : null}
      {doses.planned ? (
        <Line testID="health-cat-doses" icon="plus-square" label={tr('ht.dose.heroToday')}
          value={doses.answered != null ? tr('ht.dose.ratio', { taken: doses.taken, planned: doses.planned }) : tr('ht.none')}
          sub={doses.answered != null ? tr('ht.dose.split', { taken: doses.taken, skipped: doses.skipped, open: doses.open }) : tr('ht.dose.plannedOnly', { count: doses.planned })}
          onPress={() => router.push('/medications' as never)} />
      ) : null}
    </Glass>
  );
}

/** Accueil : dernière température de l'enfant affiché (24 h), sinon rien. Toucher → la fiche de cette prise. */
export function HealthHomeCard({ child }: { child: Child }) {
  const t = useTheme();
  const now = useNow(60_000);
  const q = useLogs<Observation>('observation', child.id, 2);
  const temp = recentTemperature(q.data ?? [], child.id, now, 24);
  if (!temp) return null;
  const v = tr('ht.obs.tempValue', { value: tempText(tempValue(temp)!) });
  const title = tr('ht.obs.lastTemp', { name: child.first_name });
  return (
    <Tappable accessibilityRole="button" testID="home-temp" accessibilityLabel={`${title}. ${v}. ${clock(new Date(temp.at))}. ${agoLabel(temp.at, now)}`}
      onPress={() => openObs(child, temp.id)} style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
      <Glass variant="card" radius={radius.xl} contentStyle={{ padding: spacing.md, gap: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
          <Icon name="thermometer" size={16} color={t.colors.textMuted} />
          <Text variant="small" weight="medium" style={{ flex: 1 }} numberOfLines={2}>{title}</Text>
          <Icon name="chevron-right" size={18} color={t.colors.textMuted} />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm, flexWrap: 'wrap' }}>
          <Text testID="home-temp-value" maxFontSizeMultiplier={1.3} style={[{ fontSize: 40, lineHeight: 46, letterSpacing: -1, fontFamily: fonts.display, color: t.colors.text }, TABULAR]}>{v}</Text>
          <Text weight="bold" style={TABULAR}>{tr('ht.obs.atClock', { time: clock(new Date(temp.at)) })}</Text>
        </View>
        <Text variant="small" muted>{agoLabel(temp.at, now)}</Text>
      </Glass>
    </Tappable>
  );
}
