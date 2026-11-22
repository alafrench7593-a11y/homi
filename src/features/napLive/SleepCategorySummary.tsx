/**
 * Catégorie « Sommeil » — niveau 2 du tracking (en tête de /tools/sleep, pour l'enfant affiché). Lit les MÊMES sessions
 * que la mini-app et l'accueil (sleepSummary.ts) :
 *  · période (Jour / 7 jours), conservée dans l'adresse (« ?period=&day= ») : un retour la retrouve ;
 *  · dernière sieste (durée, heures) → la mini-app sur CETTE session ;
 *  · cumul du jour et de la période (jours renseignés seulement) ;
 *  · une barre par jour ; jour sans saisie = bloc hachuré « rien de noté », jamais une barre à zéro ; toucher un jour
 *    affiche ses sessions, chacune ouvre la mini-app sur elle.
 */
import React, { useMemo } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Glass, GlassSegmentedControl } from '@/components/glass';
import { Tappable } from '@/components/Tappable';
import { haptic, Icon, Text } from '@/components/ui';
import { formatDate, t as tr } from '@/i18n';
import { useActiveSubject, useChildren } from '@/lib/data/hooks';
import { useSleepPlan } from '@/lib/data/hooks-sleepPlanner';
import { clock, span } from '@/lib/domain/sleepPlanner';
import { dayKey, lastNap, periodTotal, sessionMinutes, sleepByDay } from '@/lib/domain/sleepSummary';
import type { Child, Sleep } from '@/lib/types';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, MIN_TOUCH, radius, spacing } from '@/theme/tokens';

const TABULAR = { fontVariant: ['tabular-nums' as const] };
type Period = 'day' | 'week';
/** Hauteur de la zone des barres (pt) : hauteurs calculées en points, jamais en pourcentage d'un parent sans hauteur. */
const BAR_H = 84;

export function SleepCategorySummary() {
  const { subject } = useActiveSubject();
  const { data: children } = useChildren();
  const child = subject?.type === 'child' ? (children ?? []).find((c) => c.id === subject.id) ?? null : null;
  if (!child) return null;
  return <Summary key={child.id} child={child} />;
}

function Summary({ child }: { child: Child }) {
  const t = useTheme();
  const p = useLocalSearchParams<{ period?: string; day?: string }>();
  const period: Period = p.period === 'day' ? 'day' : 'week';
  const { sleeps, now } = useSleepPlan(child);
  const all = (sleeps ?? []) as Sleep[];
  const days = useMemo(() => sleepByDay(all, child.id, now, period === 'day' ? 1 : 7), [all, child.id, now, period]);
  const today = days[days.length - 1];
  const total = periodTotal(days);
  const last = lastNap(all, child.id);
  const selected = days.find((d) => d.day === p.day) ?? today;
  const max = Math.max(60, ...days.map((d) => d.minutes ?? 0));
  const openSession = (id: string) => router.push({ pathname: '/sleep/[childId]', params: { childId: child.id, nap: id } } as never);
  return (
    <View style={{ gap: spacing.sm, marginBottom: spacing.sm }} testID="sleep-category-summary">
      <GlassSegmentedControl testID="sleep-cat-period" label={tr('nn.cat.periodLabel')} value={period}
        onChange={(v) => router.setParams({ period: v, day: undefined } as never)}
        options={[{ value: 'day' as Period, label: tr('nn.cat.day'), testID: 'sleep-cat-period-day' }, { value: 'week' as Period, label: tr('nn.cat.week'), testID: 'sleep-cat-period-week' }]} />
      {last ? (
        <Tappable accessibilityRole="button" testID="sleep-cat-last" onPress={() => openSession(last.id)}
          accessibilityLabel={`${tr('nn.home.last', { name: child.first_name })} ${span(sessionMinutes(last, now))}`}>
          <Glass variant="card" radius={radius.xl} contentStyle={{ padding: spacing.md, gap: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
              <Text variant="small" weight="medium" style={{ flex: 1 }}>{tr('nn.home.last', { name: child.first_name })}</Text>
              <Icon name="chevron-right" size={18} color={t.colors.textMuted} />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm, flexWrap: 'wrap' }}>
              <Text testID="sleep-cat-last-duration" maxFontSizeMultiplier={1.3} style={[{ fontSize: 40, lineHeight: 46, letterSpacing: -1, fontFamily: fonts.display, color: t.colors.text }, TABULAR]}>{span(sessionMinutes(last, now))}</Text>
              <Text weight="bold" style={TABULAR}>{tr('nn.tray.range', { from: clock(new Date(last.started_at)), to: last.ended_at ? clock(new Date(last.ended_at)) : '…' })}</Text>
            </View>
          </Glass>
        </Tappable>
      ) : null}
      <Glass variant="card" radius={radius.xl} contentStyle={{ padding: spacing.md, gap: spacing.sm }} testID="sleep-cat-totals">
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <View style={{ flex: 1 }}>
            <Text variant="caption" muted>{tr('nn.cat.todayTotal')}</Text>
            <Text weight="bold" style={[{ fontSize: 22 }, TABULAR]} testID="sleep-cat-today">{today.minutes != null ? span(today.minutes) : tr('nn.cat.none')}</Text>
          </View>
          {period === 'week' ? (
            <View style={{ flex: 1 }}>
              <Text variant="caption" muted>{tr('nn.cat.weekTotal')}</Text>
              <Text weight="bold" style={[{ fontSize: 22 }, TABULAR]} testID="sleep-cat-period-total">{total.minutes != null ? span(total.minutes) : tr('nn.cat.none')}</Text>
              <Text variant="caption" muted>{tr('nn.cat.knownDays', { count: total.knownDays })}</Text>
            </View>
          ) : null}
        </View>
        {period === 'week' ? (
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6 }} testID="sleep-cat-bars">
            {days.map((d) => {
              const on = d.day === selected.day;
              const label = formatDate(`${d.day}T12:00:00`, { weekday: 'narrow' });
              return (
                <Tappable key={d.day} style={{ flex: 1, alignItems: 'center', gap: 4, minHeight: MIN_TOUCH }} testID={`sleep-cat-bar-${d.day}`}
                  accessibilityRole="button" accessibilityState={{ selected: on }}
                  accessibilityLabel={`${formatDate(`${d.day}T12:00:00`, { weekday: 'long', day: 'numeric' })} : ${d.minutes != null ? span(d.minutes) : tr('nn.cat.none')}`}
                  onPress={() => { haptic('selection'); router.setParams({ day: d.day } as never); }}>
                  <View style={{ height: BAR_H, width: '100%', justifyContent: 'flex-end' }}>
                    {d.minutes != null ? (
                      <View style={{ height: Math.max(6, Math.round((d.minutes / max) * BAR_H)), borderRadius: 6, backgroundColor: t.colors.text, opacity: on ? 1 : 0.55, borderWidth: on ? 2 : 0, borderColor: t.colors.primary }} />
                    ) : (
                      // Rien de noté : contour pointillé bas, jamais une barre à zéro
                      <View style={{ height: 14, borderRadius: 6, borderWidth: 1.5, borderStyle: 'dashed', borderColor: t.colors.textMuted, opacity: on ? 1 : 0.6 }} />
                    )}
                  </View>
                  <Text variant="caption" muted={!on} weight={on ? 'bold' : undefined}>{label}</Text>
                </Tappable>
              );
            })}
          </View>
        ) : null}
        <View style={{ gap: 2 }} testID="sleep-cat-day-list">
          <Text variant="label">{formatDate(`${selected.day}T12:00:00`, { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
          {selected.sessions.length ? selected.sessions.map((s) => (
            <Tappable key={s.id} accessibilityRole="button" onPress={() => openSession(s.id)} testID="sleep-cat-session"
              style={{ minHeight: MIN_TOUCH, flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Icon name="moon" size={16} color={t.colors.textMuted} />
              <Text style={[{ flex: 1 }, TABULAR]}>{`${clock(new Date(s.started_at))} – ${s.ended_at ? clock(new Date(s.ended_at)) : '…'} · ${span(sessionMinutes(s, now))}`}</Text>
              {s.note ? <Icon name="message-square" size={14} color={t.colors.primary} /> : null}
              <Icon name="chevron-right" size={16} color={t.colors.textMuted} />
            </Tappable>
          )) : <Text variant="small" muted>{tr('nn.cat.noneDay')}</Text>}
        </View>
      </Glass>
    </View>
  );
}

export { dayKey };
