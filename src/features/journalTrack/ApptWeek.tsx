/**
 * Rendez-vous — semaine interactive (22/11/2026). Lit les MÊMES rendez-vous que la liste et l'accueil (table
 * appointments) ; rien n'est recopié :
 *  · « Semaine du 20 au 26 janv. », semaine précédente / suivante ;
 *  · jours Lun → Dim, un point par rendez-vous (couleur = statut : prévu, réalisé, à confirmer) ;
 *  · jour sélectionné gardé dans l'adresse (« ?day=2025-01-22 ») : ouvrir un rendez-vous puis revenir retrouve ce jour ;
 *  · liste du jour « 10 h 30 Pédiatre · Suivi 6 mois » et « Ajouter » (date du jour sélectionné pré-remplie).
 * Un jour sans rendez-vous affiche « Rien de prévu » en pointillé, jamais un zéro.
 */
import React from 'react';
import { View } from 'react-native';
import { Glass, GlassButton } from '@/components/glass';
import { Tappable } from '@/components/Tappable';
import { haptic, Icon, Text } from '@/components/ui';
import { formatDate, t as tr, type TKey } from '@/i18n';
import { clock } from '@/lib/domain/sleepPlanner';
import { apptStatus, apptsByDay, dayDate, isoDay, shiftDay, weekDays, weekRange, type ApptLike, type ApptStatus } from '@/lib/domain/journalTrack';
import { useTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH, radius, spacing } from '@/theme/tokens';

const TABULAR = { fontVariant: ['tabular-nums' as const] };
/** « 10 h 30 », « 16 h 00 » : l'heure d'un rendez-vous garde toujours ses minutes (lecture en colonne). */
const apptClock = (iso: string) => { const c = clock(new Date(iso)); return /^\d+ h$/.test(c) ? `${c} 00` : c; };

/** « Semaine du 20 au 26 janv. » / « du 27 janv. au 2 févr. » / « du 29 déc. 2025 au 4 janv. 2026 ». */
export function weekTitle(day: string): string {
  const r = weekRange(day);
  const end = formatDate(dayDate(r.end), { day: 'numeric', month: 'short', ...(r.sameYear ? {} : { year: 'numeric' }) });
  const start = r.sameMonth ? formatDate(dayDate(r.start), { day: 'numeric' }) : formatDate(dayDate(r.start), { day: 'numeric', month: 'short', ...(r.sameYear ? {} : { year: 'numeric' }) });
  return tr('jt.week.title', { from: start, to: end });
}

export function ApptWeek<T extends ApptLike & { title: string }>({ list, day, now, onSelectDay, onOpen, onAdd, kindLabel, detail }: {
  list: readonly T[]; day: string; now: Date; onSelectDay: (d: string) => void; onOpen: (a: T) => void; onAdd: (d: string) => void;
  kindLabel: (a: T) => string; detail: (a: T) => string | null;
}) {
  const t = useTheme();
  const days = weekDays(day);
  const by = apptsByDay(list, days);
  const today = isoDay(now);
  const tone: Record<ApptStatus, string> = { planned: t.colors.primary, done: t.colors.success, to_confirm: t.colors.gold };
  const selected = by[day] ?? [];
  const pick = (d: string) => { haptic('selection'); onSelectDay(d); };
  return (
    <Glass variant="card" radius={radius.xl} contentStyle={{ padding: spacing.md, gap: spacing.sm }} testID="jt-week">
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
        <Tappable accessibilityRole="button" accessibilityLabel={tr('jt.week.prev')} testID="jt-week-prev" onPress={() => pick(shiftDay(day, -7))}
          style={{ width: MIN_TOUCH, height: MIN_TOUCH, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="chevron-left" size={22} color={t.colors.text} />
        </Tappable>
        <Text weight="bold" center style={[{ flex: 1 }, TABULAR]} accessibilityRole="header" testID="jt-week-title">{weekTitle(day)}</Text>
        <Tappable accessibilityRole="button" accessibilityLabel={tr('jt.week.next')} testID="jt-week-next" onPress={() => pick(shiftDay(day, 7))}
          style={{ width: MIN_TOUCH, height: MIN_TOUCH, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="chevron-right" size={22} color={t.colors.text} />
        </Tappable>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }} accessibilityRole="tablist">
        {days.map((d) => {
          const appts = by[d];
          const on = d === day;
          const isToday = d === today;
          const date = dayDate(d);
          return (
            <Tappable key={d} accessibilityRole="tab" accessibilityState={{ selected: on }} testID={`jt-day-${d}`}
              accessibilityLabel={`${formatDate(date, { weekday: 'long', day: 'numeric', month: 'long' })}. ${appts.length ? tr('jt.week.count', { count: appts.length }) : tr('jt.week.none')}`}
              onPress={() => pick(d)} style={{ flex: 1, alignItems: 'center', gap: 4, minHeight: MIN_TOUCH, paddingVertical: 4 }}>
              <Text variant="caption" muted={!on} weight={on ? 'bold' : 'regular'}>{formatDate(date, { weekday: 'short' }).replace('.', '')}</Text>
              <View style={{ width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? t.colors.text : 'transparent', borderWidth: isToday && !on ? 1.5 : 0, borderColor: t.colors.text }}>
                <Text weight="bold" color={on ? t.colors.background : t.colors.text} style={TABULAR}>{date.getDate()}</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 3, height: 6 }}>
                {appts.slice(0, 3).map((a) => <View key={a.id} style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: tone[apptStatus(a, now)] }} />)}
              </View>
            </Tappable>
          );
        })}
      </View>
      <Text variant="label" muted testID="jt-day-title">{formatDate(dayDate(day), { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
      {selected.length ? (
        <View style={{ gap: spacing.xs }} testID="jt-day-list">
          {selected.map((a) => {
            const st = apptStatus(a, now);
            const kind = kindLabel(a);
            const sub = detail(a);
            return (
              <Tappable key={a.id} accessibilityRole="button" testID={`jt-appt-${a.id}`} onPress={() => onOpen(a)}
                accessibilityLabel={`${apptClock(a.starts_at)} ${kind === a.title ? a.title : `${kind}, ${a.title}`}. ${tr(`jt.status.${st}` as TKey)}`}
                style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center', minHeight: MIN_TOUCH, paddingVertical: 6 }}>
                <Text weight="bold" style={[{ width: 64 }, TABULAR]}>{apptClock(a.starts_at)}</Text>
                <View style={{ width: 4, alignSelf: 'stretch', borderRadius: 2, backgroundColor: tone[st] }} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text weight="medium" style={st === 'done' ? { opacity: 0.75 } : undefined}>{kind === a.title ? a.title : `${kind} · ${a.title}`}</Text>
                  <Text variant="caption" muted>{[tr(`jt.status.${st}` as TKey), sub].filter(Boolean).join(' · ')}</Text>
                </View>
                <Icon name="chevron-right" size={16} color={t.colors.textMuted} />
              </Tappable>
            );
          })}
        </View>
      ) : (
        <View testID="jt-day-empty" style={{ minHeight: 52, borderRadius: radius.lg, borderWidth: 1.5, borderStyle: 'dashed', borderColor: t.colors.border, alignItems: 'center', justifyContent: 'center' }}>
          <Text variant="small" muted>{tr('jt.week.none')}</Text>
        </View>
      )}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, alignItems: 'center' }}>
        {(['planned', 'done', 'to_confirm'] as const).map((s) => (
          <View key={s} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: tone[s] }} />
            <Text variant="caption" muted>{tr(`jt.status.${s}` as TKey)}</Text>
          </View>
        ))}
      </View>
      <GlassButton variant="primary" full icon="plus" label={tr('jt.week.add')} testID="jt-week-add" onPress={() => onAdd(day)} />
    </Glass>
  );
}
