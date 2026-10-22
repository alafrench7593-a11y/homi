/**
 * Accueil du profil « Suivre mon cycle » : uniquement le calendrier, les 5 raccourcis favoris, une carte
 * intelligente et le prochain rappel (+ « Ajouter aujourd'hui »). Tout le reste s'ouvre progressivement.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { confirm, Sheet, useToast } from '@/components/Overlays';
import { Skeleton } from '@/components/States';
import { Button, haptic, Icon, Row, Text } from '@/components/ui';
import { Tappable } from '@/components/Tappable';
import { useReminders } from '@/lib/data/hooks';
import { useCyclePreferences, useSaveCyclePreferences } from '@/lib/data/hooks-cycle';
import { useCycleData, useCycleLoading, useDeleteDay, useInsightFeedback, useRunCycleOps } from '@/lib/data/hooks-cycle3';
import { usePremiumAccess } from '@/lib/data/hooks-premium';
import { friendlyError } from '@/lib/data/hooks-settings';
import { useRelevanceCtx } from '@/lib/data/hooks-scope';
import { reminderRelevant } from '@/lib/journeys/relevance';
import { nextOccurrence } from '@/lib/domain/reminders';
import { daysBetween } from '@/lib/domain/dates';
import { cycleDayOn } from '@/lib/domain/cycleV2';
import {
  effectiveFavorites, GOAL_SUGGESTED, MAX_FAVORITES, periodOn, planPeriodSelection, readDay, shortcutCategory,
  type CategoryKey, type Goal, type Shortcut,
} from '@/lib/domain/cycleDaily';
import { todayInsight } from '@/lib/domain/cycleInsights';
import { formatDate, t as tr, type TKey } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH, spacing } from '@/theme/tokens';
import { AddDaySheet, shortcutIcon, summaryText } from './AddDaySheet';
import { CycleCalendar } from './CycleCalendar';
import { InsightView } from './InsightCard';
import { CAL, LockedCard, Pill, useLocked } from './ui';
import { useUiStore } from '@/lib/store';
import { syncCycleWidget, widgetContent } from '@/widgets/syncCycleWidget';
import { BRAND } from '@/config/brand';

const fmt = (iso: string) => formatDate(`${iso}T12:00:00`, { day: 'numeric', month: 'short' });

export function CycleHome({ goal }: { goal: Goal }) {
  const t = useTheme();
  const toast = useToast();
  const loading = useCycleLoading();
  const data = useCycleData();
  const { prefs } = useCyclePreferences();
  const run = useRunCycleOps();
  const feedbackQ = useInsightFeedback();
  const trends = usePremiumAccess('cycle_trends');
  const params = useLocalSearchParams<{ add?: string }>();
  const locked = useLocked('cycle', prefs.lock_mode);
  const intimateLocked = useLocked('intimate', prefs.lock_mode);
  const [add, setAdd] = useState<{ iso: string; cat: CategoryKey | null } | null>(params.add && params.add !== '1' ? { iso: data.today, cat: params.add as CategoryKey } : params.add ? { iso: data.today, cat: null } : null);
  const [day, setDay] = useState<string | null>(null);
  useEffect(() => { if (params.add) setAdd({ iso: data.today, cat: params.add !== '1' ? params.add as CategoryKey : null }); }, [params.add]); // eslint-disable-line react-hooks/exhaustive-deps
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editFav, setEditFav] = useState(false);
  const { data: reminders } = useReminders();
  const ctx = useRelevanceCtx();

  const favorites = effectiveFavorites(goal, prefs.favorites, data.intimate);
  const todayState = useMemo(() => readDay(data.today, data.sources(data.today)), [data]);
  const insight = useMemo(() => todayInsight({
    today: data.today, periods: data.periods, est: data.est, logs: data.logs, todayItems: todayState.pills, todayPain: todayState.painIntensity, goal, premium: trends.premium,
    feedback: Object.fromEntries((feedbackQ.data ?? []).map((f) => [f.insight_key, f.helpful ? 'helpful' : 'not_me'])),
  }), [data, todayState, goal, trends.premium, feedbackQ.data]);
  // Jours où un rappel ponctuel ou hebdomadaire est prévu (les rappels quotidiens chargeraient tout le calendrier)
  const reminderDays = useMemo(() => new Set((reminders ?? []).filter((r) => r.enabled && r.schedule.type !== 'daily' && r.schedule.type !== 'interval' && reminderRelevant(r, ctx))
    .map((r) => nextOccurrence(r.schedule)).filter((d): d is Date => !!d).map((d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)), [reminders, ctx]);
  const nextReminder = (reminders ?? []).filter((r) => r.enabled && reminderRelevant(r, ctx)).map((r) => ({ r, at: nextOccurrence(r.schedule) }))
    .filter((x) => x.at).sort((a, b) => a.at!.getTime() - b.at!.getTime())[0];

  // Widget iOS : discret par défaut, détaillé seulement si choisi (jamais si le cycle est masqué ou verrouillé)
  const widgetDetailed = useUiStore((st) => st.cycleWidgetDetailed);
  useEffect(() => {
    if (loading) return;
    const day = cycleDayOn(data.periods, data.today);
    const until = data.est.nextPeriod ? daysBetween(data.today, data.est.nextPeriod) : null;
    void syncCycleWidget(widgetContent({
      detailed: widgetDetailed, hidden: !!prefs.hide_on_home || prefs.lock_mode === 'cycle', appName: BRAND.name, open: tr('c3.widget.open'),
      cycleDay: day ? tr('c3.home.cycleDay', { day }) : null,
      next: until != null && until > 0 ? tr('c3.home.nextPeriod', { count: until }) : until === 0 ? tr('c3.home.nextPeriodToday') : null,
    }));
  }, [loading, data, widgetDetailed, prefs.hide_on_home, prefs.lock_mode]);

  if (loading) return <Skeleton kind="card" rows={4} />;
  if (prefs.hide_on_home) {
    return (
      <Tappable accessibilityRole="button" testID="c3-hidden" onPress={() => router.push('/cycle?all=1' as never)} style={{ padding: spacing.md, borderRadius: 24, backgroundColor: CAL.bg, gap: 4 }}>
        <Row gap={6}><Icon name="eye-off" size={16} color={CAL.soft} /><Text weight="bold" color={CAL.text}>{tr('cy.title')}</Text></Row>
        <Text variant="small" color={CAL.soft}>{tr('cy.home.hidden')}</Text>
      </Tappable>
    );
  }
  if (locked) return <LockedCard />;

  // Ligne d'état : jour du cycle, prochaines règles, fenêtre fertile (toujours des estimations)
  const cycleDay = cycleDayOn(data.periods, data.today);
  const current = periodOn(data.periods as never, data.today);
  const until = data.est.nextPeriod ? daysBetween(data.today, data.est.nextPeriod) : null;
  const fw = data.est.fertileWindow;
  const facts: { icon: string; text: string; id: string }[] = [];
  if (current) facts.push({ id: 'period', icon: 'droplet', text: tr('c3.home.inPeriod', { day: daysBetween(current.start_date, data.today) + 1 }) });
  else if (cycleDay) facts.push({ id: 'day', icon: 'circle', text: tr('c3.home.cycleDay', { day: cycleDay }) });
  if (!current && until != null) facts.push({ id: 'next', icon: 'calendar', text: until > 0 ? tr('c3.home.nextPeriod', { count: until }) : until === 0 ? tr('c3.home.nextPeriodToday') : tr('c3.home.periodLate', { count: -until }) });
  if (fw && fw.end >= data.today) facts.push({ id: 'fertile', icon: 'sun', text: fw.start <= data.today ? tr('c3.home.fertileNow') : tr('c3.home.fertile', { from: fmt(fw.start), to: fmt(fw.end) }) });
  if (!facts.length) facts.push({ id: 'none', icon: 'info', text: tr('c3.home.noEstimate') });

  async function markPeriod() {
    const days = [...selected].filter((d) => d <= data.today);
    if (days.length < selected.size) toast(tr('c3.cal.futureNo'), 'info');
    if (!days.length) return;
    try {
      await run.mutateAsync(planPeriodSelection(days, data.periods as never));
      haptic('success'); toast(tr('c3.cal.saved'), 'success');
      setSelecting(false); setSelected(new Set());
    } catch (e) { toast(friendlyError(e), 'error'); }
  }

  return (
    <View testID="c3-home" style={{ gap: spacing.md }}>
      <CycleCalendar data={data.calendar} est={data.est} today={data.today} showIntimacy={data.intimate && prefs.show_intimacy_icons !== false && !intimateLocked}
        onDayPress={setDay} selecting={selecting} selected={selected} reminderDays={reminderDays}
        onToggle={(iso) => setSelected((s) => { const n = new Set(s); if (n.has(iso)) n.delete(iso); else n.add(iso); return n; })} />

      {/* Sélection de plusieurs jours de règles */}
      {selecting ? (
        <View testID="c3-select-bar" style={{ gap: spacing.xs }}>
          <Text variant="small" muted>{selected.size ? tr('c3.cal.selected', { count: selected.size }) : tr('c3.cal.multiHint')}</Text>
          <Row gap={spacing.xs}>
            <Button label={tr('c3.cal.markPeriod')} icon="droplet" onPress={markPeriod} disabled={!selected.size} loading={run.isPending} style={{ flex: 1 }} testID="c3-mark-period" />
            <Button label={tr('c3.cal.cancel')} variant="ghost" onPress={() => { setSelecting(false); setSelected(new Set()); }} />
          </Row>
        </View>
      ) : (
        <Tappable accessibilityRole="button" testID="c3-select" onPress={() => { haptic('selection'); setSelecting(true); }} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 36, alignSelf: 'flex-start' }}>
          <Icon name="check-square" size={15} color={t.colors.primary} />
          <Text variant="small" weight="bold" color={t.colors.primary}>{tr('c3.cal.select')}</Text>
        </Tappable>
      )}

      {/* Jour du cycle · prochaines règles · fenêtre fertile */}
      <View testID="c3-facts" style={{ gap: 4 }}>
        {facts.map((f) => (
          <Row key={f.id} gap={8}><Icon name={f.icon as never} size={15} color={t.colors.textMuted} /><Text style={{ flex: 1 }} testID={`c3-fact-${f.id}`}>{f.text}</Text></Row>
        ))}
        <Text variant="caption" muted>{tr('c3.home.estimates')}</Text>
      </View>

      <Button label={tr('c3.home.add')} icon="plus" onPress={() => setAdd({ iso: data.today, cat: null })} full testID="c3-add-today" />

      {/* Mes 5 raccourcis */}
      {!prefs.favorites_set_at ? <FavoritesPicker goal={goal} intimate={data.intimate} inline /> : (
        <View style={{ gap: spacing.xs }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Text variant="small" weight="bold" muted>{tr('c3.home.favorites')}</Text>
            <Tappable accessibilityRole="button" accessibilityLabel={tr('c3.home.editFavorites')} onPress={() => setEditFav(true)} testID="c3-edit-favorites" style={{ minHeight: MIN_TOUCH, minWidth: MIN_TOUCH, alignItems: 'flex-end', justifyContent: 'center' }}>
              <Icon name="sliders" size={16} color={t.colors.primary} />
            </Tappable>
          </Row>
          <View testID="c3-home-favorites" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
            {favorites.map((s) => (
              <Pill key={s} id={s} label={tr(`c3.sc.${s}` as TKey)} icon={shortcutIcon(s) as never} selected={false} category={shortcutCategory(s) === 'reminders' ? 'contraception' : shortcutCategory(s) as CategoryKey}
                testID={`c3-home-fav-${s}`}
                onPress={() => { const c = shortcutCategory(s); if (c === 'reminders') router.push('/contraception/reminders' as never); else setAdd({ iso: data.today, cat: c }); }} />
            ))}
          </View>
        </View>
      )}

      {/* Une seule carte intelligente */}
      <View testID="c3-today-card" style={{ gap: spacing.xs }}>
        <Text variant="small" weight="bold" muted>{tr('c3.home.todayCard')}</Text>
        {todayState.pills.length ? <Text variant="small" testID="c3-today-summary">{tr('c3.add.summary', { list: summaryText(todayState, intimateLocked) })}</Text> : null}
        <InsightView insight={insight} />
      </View>

      {/* Prochain rappel */}
      <Tappable accessibilityRole="button" testID="c3-next-reminder" onPress={() => router.push((nextReminder ? '/settings/reminders' : '/contraception/reminders') as never)}
        style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: MIN_TOUCH }}>
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: t.colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}><Icon name="bell" size={17} /></View>
        <Text style={{ flex: 1 }}>{nextReminder ? tr('c3.home.nextReminder', { title: nextReminder.r.title, when: nextReminder.at!.toLocaleString(undefined, { weekday: 'long', hour: '2-digit', minute: '2-digit' }) }) : tr('c3.home.noReminder')}</Text>
        <Icon name="chevron-right" size={18} color={t.colors.textMuted} />
      </Tappable>

      <Tappable accessibilityRole="button" testID="c3-more" onPress={() => router.push('/cycle?all=1' as never)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 36, alignSelf: 'center' }}>
        <Text variant="small" weight="bold" color={t.colors.primary}>{tr('c3.home.more')}</Text>
        <Icon name="chevron-right" size={14} color={t.colors.primary} />
      </Tappable>

      {add ? <AddDaySheet visible onClose={() => setAdd(null)} iso={add.iso} start={add.cat} goal={goal} /> : null}
      {day ? <DaySheet iso={day} onClose={() => setDay(null)} onEdit={() => { setAdd({ iso: day, cat: null }); setDay(null); }} hideIntimate={intimateLocked} /> : null}
      {editFav ? <Sheet visible onClose={() => setEditFav(false)} title={tr('c3.home.favorites')}><FavoritesPicker goal={goal} intimate={data.intimate} onDone={() => setEditFav(false)} /></Sheet> : null}
    </View>
  );
}

/** Fiche d'un jour : ce qui est noté (modifiable, supprimable) et les estimations du jour. */
export function DaySheet({ iso, onClose, onEdit, hideIntimate }: { iso: string; onClose: () => void; onEdit: () => void; hideIntimate: boolean }) {
  const t = useTheme();
  const toast = useToast();
  const data = useCycleData();
  const del = useDeleteDay();
  const s = data.sources(iso);
  const st = readDay(iso, s);
  const cell = { predicted: false, fertile: false, ovulation: false };
  const fw = data.est.fertileWindow;
  if (fw && fw.start <= iso && iso <= fw.end) cell.fertile = true;
  if (data.est.ovulation === iso) cell.ovulation = true;
  const summary = summaryText(st, hideIntimate);
  const hasData = !!summary;
  async function remove() {
    if (!(await confirm(tr('c3.day.delete'), tr('c3.day.deleteConfirm'), tr('common.delete')))) return;
    try { await del.mutateAsync({ iso, s }); haptic('success'); toast(tr('c3.day.deleted'), 'success'); onClose(); } catch (e) { toast(friendlyError(e), 'error'); }
  }
  return (
    <Sheet visible onClose={onClose} title={formatDate(`${iso}T12:00:00`, { weekday: 'long', day: 'numeric', month: 'long' }).replace(/^./, (c) => c.toUpperCase())}>
      <View testID="c3-day" style={{ gap: spacing.sm }}>
        {cell.fertile ? <Row gap={6}><Icon name="sun" size={15} color={t.colors.lavender} /><Text variant="small">{tr('c3.day.fertile')}</Text></Row> : null}
        {cell.ovulation ? <Row gap={6}><Icon name="sun" size={15} color={t.colors.lavender} /><Text variant="small">{tr('c3.day.ovulation')}</Text></Row> : null}
        <Text testID="c3-day-summary">{hasData ? tr('c3.day.notes', { list: summary }) : tr('c3.day.empty')}</Text>
        {hideIntimate && st.pills.some((p) => p.startsWith('sex_')) ? <Text variant="caption" muted>{tr('c3.day.intimateHidden')}</Text> : null}
        <Button label={hasData ? tr('c3.day.edit') : tr('c3.day.add')} icon={hasData ? 'edit-2' : 'plus'} onPress={onEdit} full testID="c3-day-edit" />
        {hasData ? <Button label={tr('c3.day.delete')} icon="trash-2" variant="ghost" onPress={remove} loading={del.isPending} full testID="c3-day-delete" /> : null}
      </View>
    </Sheet>
  );
}

/** « Que souhaites-tu suivre régulièrement ? » : 5 raccourcis au plus, modifiables à tout moment. */
export function FavoritesPicker({ goal, intimate, inline, onDone }: { goal: Goal; intimate: boolean; inline?: boolean; onDone?: () => void }) {
  const t = useTheme();
  const toast = useToast();
  const { prefs } = useCyclePreferences();
  const save = useSaveCyclePreferences();
  const [chosen, setChosen] = useState<string[]>(effectiveFavorites(goal, prefs.favorites, intimate));
  const options = [...new Set([...GOAL_SUGGESTED[goal], 'period', 'pain', 'mood', 'body', 'sleep', 'fertility', 'contraception', 'habits', 'notes', ...(intimate ? ['intercourse', 'intimacy'] : [])])] as Shortcut[];
  async function commit(list: string[]) {
    try { await save.mutateAsync({ favorites: list, favorites_set_at: new Date().toISOString() }); haptic('success'); toast(tr('c3.fav.saved'), 'success'); onDone?.(); } catch (e) { toast(friendlyError(e), 'error'); }
  }
  return (
    <View testID="c3-fav-picker" style={{ gap: spacing.sm, padding: inline ? spacing.md : 0, borderRadius: 20, backgroundColor: inline ? t.colors.surfaceAlt : 'transparent' }}>
      <Text weight="bold" accessibilityRole="header">{tr('c3.fav.question')}</Text>
      <Text variant="small" muted>{tr('c3.fav.hint')} {tr('c3.fav.count', { count: chosen.length })}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
        {options.map((s) => {
          const on = chosen.includes(s);
          const c = shortcutCategory(s);
          return <Pill key={s} id={s} label={tr(`c3.sc.${s}` as TKey)} icon={shortcutIcon(s) as never} selected={on} category={c === 'reminders' ? 'contraception' : c} testID={`c3-pick-${s}`}
            onPress={() => { if (on) setChosen(chosen.filter((x) => x !== s)); else if (chosen.length >= MAX_FAVORITES) toast(tr('c3.fav.max'), 'info'); else setChosen([...chosen, s]); }} />;
        })}
      </View>
      <Button label={tr('c3.fav.save')} icon="check" onPress={() => commit(chosen)} disabled={!chosen.length} loading={save.isPending} full testID="c3-fav-save" />
      {!inline ? <Button label={tr('c3.fav.reset')} variant="ghost" onPress={() => setChosen(effectiveFavorites(goal, null, intimate))} /> : null}
    </View>
  );
}
