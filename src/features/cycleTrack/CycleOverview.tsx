/**
 * Vue d'ensemble des suivis du cycle (22/11/2026) — lit les MÊMES tables que chaque mini-app (rien n'est recopié) :
 *  · `CycleWeek` (Mon cycle, Projet bébé, Ma contraception) : la semaine, un jour choisi conservé dans l'adresse, et pour
 *    ce jour la liste des suivis notés (règles, symptômes, douleur, pertes…) ; chaque ligne ouvre SON app sur ce jour ;
 *  · `CycleCategorySummary` (catégorie « Cycle et fertilité ») : même semaine, puis par app le nombre de jours notés —
 *    jamais un total qui additionne des natures différentes ;
 *  · `CycleHomeLast` (accueil, profil cycle) : la dernière saisie et son app. Rien d'intime (rapports, contraception,
 *    PMA) n'apparaît sur l'accueil ; « Masquer sur l'accueil » (confidentialité du cycle) n'y affiche rien.
 */
import React, { useMemo } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Glass } from '@/components/glass';
import { Tappable } from '@/components/Tappable';
import { Icon, Text, type IconName } from '@/components/ui';
import { formatDate, t as tr } from '@/i18n';
import { usePeriods, useTests } from '@/lib/data/hooks';
import { useCyclePreferences } from '@/lib/data/hooks-cycle';
import { useAllSymptomLogs, useBleedingLogs, useCycleJournal, useDischargeLogs } from '@/lib/data/hooks-cycle2';
import { useContraceptionLogs } from '@/lib/data/hooks-cycle3';
import { useFertilityObservations, useIntercourseLogs } from '@/lib/data/hooks-fertility';
import { symptomKeysOf } from '@/lib/domain/cycleV2';
import { categoryDays, categoryTotals, lastItem, localDay, periodDays, type DayItem } from '@/lib/domain/cycleTrack';
import { todayISO } from '@/lib/domain/dates';
import { toolName } from '@/lib/domain/toolCatalog';
import { useTheme } from '@/theme/ThemeProvider';
import { MIN_TOUCH, radius, spacing } from '@/theme/tokens';
import { CycleDayPanel, dayLong, TABULAR, useCycleDay } from './CycleDayPanel';

export type CycleApp = 'period' | 'symptoms' | 'pain' | 'discharge' | 'bleeding' | 'journal' | 'tests' | 'mucus' | 'temperature' | 'intimacy' | 'contraception';
/** Apps jamais montrées sur l'accueil (données intimes) */
const INTIMATE: CycleApp[] = ['intimacy', 'contraception'];

export const APP_META: Record<CycleApp, { tool: string | null; icon: IconName; href: (day: string) => string }> = {
  period: { tool: null, icon: 'droplet', href: (d) => `/cycle/calendar?day=${d}` },
  symptoms: { tool: 'cycle_symptoms', icon: 'activity', href: (d) => `/cycle/symptoms?date=${d}` },
  pain: { tool: 'cycle_pain', icon: 'zap', href: (d) => `/cycle/pain?date=${d}` },
  discharge: { tool: 'cycle_discharge', icon: 'cloud-drizzle', href: (d) => `/cycle/discharge?date=${d}` },
  bleeding: { tool: 'cycle_bleeding', icon: 'alert-triangle', href: (d) => `/cycle/bleeding?date=${d}` },
  journal: { tool: 'cycle_journal', icon: 'edit-3', href: (d) => `/cycle/journal?date=${d}` },
  tests: { tool: 'ttc_tests', icon: 'check-circle', href: (d) => `/fertility/log?date=${d}` },
  mucus: { tool: 'ttc_mucus', icon: 'eye', href: (d) => `/fertility/mucus?date=${d}` },
  temperature: { tool: 'ttc_temperature', icon: 'thermometer', href: () => '/fertility/body' },
  intimacy: { tool: 'ttc_intimacy', icon: 'lock', href: (d) => `/cycle/intimacy?date=${d}` },
  contraception: { tool: 'contraception_journal', icon: 'pen-tool', href: (d) => `/contraception/journal?date=${d}` },
};
export const appName = (a: CycleApp) => (APP_META[a].tool ? toolName(APP_META[a].tool!) : tr('cy.tk.app.period'));

interface Src extends DayItem { detail?: string | null }

/** Toutes les saisies du cycle, par app (jour civil local). Les rapports ne sont lus que si leur suivi est activé. */
export function useCycleSources(opts: { intimate: boolean }): Record<CycleApp, Src[]> {
  const today = todayISO();
  const periodsQ = usePeriods();
  const symQ = useAllSymptomLogs();
  const disQ = useDischargeLogs();
  const blQ = useBleedingLogs();
  const jrQ = useCycleJournal();
  const ovuQ = useTests('ovulation_tests');
  const pregQ = useTests('pregnancy_tests');
  const obsQ = useFertilityObservations(400);
  const sexQ = useIntercourseLogs(400);
  const contraQ = useContraceptionLogs();
  const { prefs } = useCyclePreferences();
  const withSex = opts.intimate && !!prefs.track_intercourse;
  return useMemo(() => {
    const sym = symQ.data ?? [];
    return {
      period: periodDays(periodsQ.data ?? [], today),
      symptoms: sym.filter((l) => symptomKeysOf(l).length || l.mood != null || l.energy != null || l.sleep != null || l.stress != null || l.note)
        .map((l) => ({ id: l.id, day: l.logged_on, detail: symptomKeysOf(l).length ? tr('cy.tk.sym.count', { count: symptomKeysOf(l).length }) : null })),
      pain: sym.filter((l) => l.pain_intensity != null).map((l) => ({ id: `p${l.id}`, day: l.logged_on, detail: `${l.pain_intensity}/10` })),
      discharge: (disQ.data ?? []).map((l) => ({ id: l.id, day: localDay(l.observed_at), at: l.observed_at })),
      bleeding: (blQ.data ?? []).map((b) => ({ id: b.id, day: b.occurred_on })),
      journal: (jrQ.data ?? []).map((e) => ({ id: e.id, day: e.entry_on })),
      tests: [...(ovuQ.data ?? []), ...(pregQ.data ?? [])].map((x) => ({ id: x.id, day: localDay(x.tested_at), at: x.tested_at, detail: tr(`cy.test.r.${x.result}` as 'cy.test.r.positive') })),
      mucus: (obsQ.data ?? []).filter((o) => o.cervical_mucus != null).map((o) => ({ id: `m${o.id}`, day: o.observed_on })),
      temperature: (obsQ.data ?? []).filter((o) => o.bbt_celsius != null).map((o) => ({ id: `t${o.id}`, day: o.observed_on, detail: `${String(o.bbt_celsius).replace('.', ',')} °C` })),
      intimacy: withSex ? (sexQ.data ?? []).map((l) => ({ id: l.id, day: l.occurred_on })) : [],
      contraception: opts.intimate ? (contraQ.data ?? []).filter((c) => c.kind === 'effect').map((c) => ({ id: c.id, day: c.logged_on })) : [],
    };
  }, [periodsQ.data, symQ.data, disQ.data, blQ.data, jrQ.data, ovuQ.data, pregQ.data, obsQ.data, sexQ.data, contraQ.data, withSex, opts.intimate, today]);
}

/** Détail d'une app un jour donné : sa valeur propre (« 6/10 », « 2 symptômes ») ou son nombre de saisies. */
function dayDetail(app: CycleApp, list: Src[]): string {
  const withDetail = list.filter((x) => x.detail);
  if (app === 'period') return tr('cy.tk.app.periodNoted');
  if (withDetail.length === 1 && list.length === 1) return withDetail[0].detail!;
  return tr('cy.tk.notes', { count: list.length });
}

function WeekPanel({ sources, param, testID, label }: { sources: Record<CycleApp, Src[]>; param: string; testID: string; label: string }) {
  const { day, days, setDay, shift, canForward } = useCycleDay(param);
  const cdays = useMemo(() => categoryDays(sources, days), [sources, days]);
  const strip = cdays.map((d) => ({ day: d.day, count: d.apps.length ? d.apps.length : null, value: null }));
  const sel = categoryDays(sources, [day])[0];
  const bubble = (d: { count: number | null }) => (d.count == null ? tr('cy.tk.nothing') : tr('cy.tk.apps', { count: d.count }));
  return (
    <CycleDayPanel testID={testID} label={label} day={day} mode="marks"
      hero={sel.apps.length ? String(sel.apps.length) : null} unit={sel.apps.length ? tr('cy.tk.appsUnit', { count: sel.apps.length }) : null}
      strip={strip} onSelect={setDay} onShift={shift} canForward={canForward} bubbleOf={bubble} describe={bubble}
      rows={sel.apps.map(({ app }) => {
        const a = app as CycleApp;
        const list = sources[a].filter((x) => x.day === day);
        return { id: a, time: null, icon: APP_META[a].icon, title: appName(a), detail: dayDetail(a, list),
          a11y: `${appName(a)}. ${dayDetail(a, list)}. ${tr('cy.tk.openApp')}`, onPress: () => router.push(APP_META[a].href(day) as never) };
      })} />
  );
}

/** Semaine du cycle (écran d'accueil d'un parcours cycle). */
export function CycleWeek({ testID = 'ck-week' }: { testID?: string }) {
  const sources = useCycleSources({ intimate: true });
  return <WeekPanel sources={sources} param="day" testID={testID} label={tr('cy.tk.week.label')} />;
}

/** Catégorie « Cycle et fertilité » : semaine + jours notés par app sur les 7 jours affichés. */
export function CycleCategorySummary() {
  const t = useTheme();
  const sources = useCycleSources({ intimate: true });
  const { days } = useCycleDay('day');
  const totals = useMemo(() => categoryTotals(sources, days), [sources, days]);
  const any = Object.values(sources).some((l) => l.length);
  if (!any) return null;
  return (
    <View style={{ gap: spacing.sm }} testID="ck-cat">
      <WeekPanel sources={sources} param="day" testID="ck-cat-week" label={tr('cy.tk.cat.label')} />
      <Glass variant="card" radius={radius.xl} contentStyle={{ padding: spacing.md, gap: 2 }} testID="ck-cat-totals">
        <Text variant="label">{tr('cy.tk.cat.totals')}</Text>
        {totals.length ? totals.map((x) => {
          const a = x.app as CycleApp;
          return (
            <Tappable key={a} accessibilityRole="button" testID={`ck-cat-total-${a}`} onPress={() => router.push(APP_META[a].href(days[days.length - 1]) as never)}
              accessibilityLabel={`${appName(a)} : ${tr('cy.tk.cat.daysNoted', { count: x.days })}. ${tr('cy.tk.openApp')}`}
              style={({ pressed }) => ({ minHeight: MIN_TOUCH, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, opacity: pressed ? 0.6 : 1 })}>
              <Icon name={APP_META[a].icon} size={16} color={t.colors.text} />
              <Text style={{ flex: 1 }}>{appName(a)}</Text>
              <Text weight="bold" style={TABULAR}>{tr('cy.tk.cat.daysNoted', { count: x.days })}</Text>
              <Icon name="chevron-right" size={16} color={t.colors.textMuted} />
            </Tappable>
          );
        }) : <Text variant="small" muted>{tr('cy.tk.cat.none')}</Text>}
        <Text variant="caption" muted>{tr('cy.tk.cat.note')}</Text>
      </Glass>
    </View>
  );
}

/** Accueil (profil cycle) : la dernière saisie du cycle et son app — jamais d'intime, rien si « masquer sur l'accueil ». */
export function CycleHomeLast() {
  const t = useTheme();
  const { prefs } = useCyclePreferences();
  const sources = useCycleSources({ intimate: false });
  const last = useMemo(() => {
    let best: { app: CycleApp; item: Src } | null = null;
    for (const a of Object.keys(sources) as CycleApp[]) {
      if (INTIMATE.includes(a) || a === 'period') continue;
      const it = lastItem(sources[a]);
      if (it && (!best || it.day > best.item.day || (it.day === best.item.day && (it.at ?? '') > (best.item.at ?? '')))) best = { app: a, item: it };
    }
    return best;
  }, [sources]);
  if (prefs.hide_on_home || !last) return null;
  const today = todayISO();
  const when = last.item.day === today ? tr('cy.tk.home.today') : formatDate(`${last.item.day}T12:00:00`, { weekday: 'long', day: 'numeric', month: 'long' });
  const value = last.item.detail ?? appName(last.app);
  return (
    <Tappable accessibilityRole="button" testID="ck-home-last" onPress={() => router.push(APP_META[last.app].href(last.item.day) as never)}
      accessibilityLabel={`${tr('cy.tk.home.title')}. ${appName(last.app)}, ${value}, ${when}. ${tr('cy.tk.openApp')}`}
      style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
      <Glass variant="card" radius={radius.xl} contentStyle={{ padding: spacing.md, gap: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
          <View style={{ width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: t.colors.border }}>
            <Icon name={APP_META[last.app].icon} size={15} color={t.colors.text} />
          </View>
          <Text variant="small" weight="medium" style={{ flex: 1 }}>{tr('cy.tk.home.title')}</Text>
          <Icon name="chevron-right" size={18} color={t.colors.textMuted} />
        </View>
        <Text weight="bold" style={[{ fontSize: 26, lineHeight: 32 }, TABULAR]} numberOfLines={1}>{value}</Text>
        <Text variant="small" muted>{`${appName(last.app)} · ${when === tr('cy.tk.home.today') ? when : dayLong(last.item.day)}`}</Text>
      </Glass>
    </Tappable>
  );
}
