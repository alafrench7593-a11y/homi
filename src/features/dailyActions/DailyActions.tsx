/**
 * « Mes actions du jour » : remplace partout les grandes cases carrées (« Mon sommeil », « Mon humeur », « Repas »,
 * « Rendez-vous »…). Une seule carte horizontale en verre dépoli, des actions en capsules qui défilent, une icône,
 * une dernière information discrète tirée des VRAIES données du profil affiché, un petit « + », « Voir tout ».
 * Quatre raccourcis au maximum, personnalisables par profil ; jamais un outil sans rapport avec le profil.
 */
import React, { useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Button, haptic, Icon, type IconName, Text } from '@/components/ui';
import { Sheet, useToast } from '@/components/Overlays';
import { Tappable } from '@/components/Tappable';
import { ToggleRow } from '@/features/recipes/ToggleRow';
import { TrackIcon } from '@/features/trackCards';
import { useActivePregnancy, useAppointments, useLogs, useMaternalWeights, useMeasurements, useMoods, useOpenSleep, usePeriods, useProfile, useTests } from '@/lib/data/hooks';
import { useTreatments } from '@/lib/data/hooks-needs';
import { useParentSleepLogs } from '@/lib/data/hooks-sleep';
import { SleepError, useSleepActions } from '@/lib/data/hooks-sleepPlanner';
import { friendlyError } from '@/lib/data/hooks-settings';
import { useScope } from '@/lib/data/hooks-scope';
import { usePregnancySymptoms } from '@/lib/data/hooks-care';
import { useFertilityObservations } from '@/lib/data/hooks-fertility';
import { useContraceptionLogs } from '@/lib/data/hooks-cycle3';
import { useRelevanceCtx } from '@/lib/data/hooks-scope';
import { appointmentRelevant } from '@/lib/journeys/relevance';
import { childAge } from '@/lib/domain/child';
import { estimateCycle } from '@/lib/domain/cycle';
import { lastInfo, nextDose, whenLabel, type LastData, type TrackKey } from '@/lib/domain/trackingCards';
import { actionProfile, shownActions, type ActionContext, type ActionKey, type ActionProfile } from '@/lib/domain/dailyActions';
import { pregnancyProgress } from '@/lib/domain/pregnancy';
import { windowToShow } from '@/lib/domain/pregnancyCare';
import { todayISO } from '@/lib/domain/dates';
import { useUiStore } from '@/lib/store';
import type { Bottle, Breastfeed, Child, Diaper, Meal, Observation, Pumping, Sleep } from '@/lib/types';
import { useReduceMotion, useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import { formatDate, t as tr, type TKey } from '@/i18n';

export interface ActionModel { key: ActionKey; info: string; onOpen: () => void; onAdd: () => void; addLabel?: string; active?: boolean }

const TRACK_KEYS = new Set<string>(['bottle', 'breastfeed', 'diaper', 'sleep', 'meal', 'pumping', 'observation', 'growth', 'medication', 'appointment', 'mother_sleep', 'mood', 'weight']);
const ICON: Partial<Record<ActionKey, IconName>> = { period: 'droplet', cycle_symptom: 'activity', contraception: 'shield', ovulation_test: 'check-circle', mucus: 'cloud-drizzle', temperature: 'thermometer', feel: 'feather', echo: 'aperture', checkin: 'edit-3' };
const INK: Record<ActionKey, string> = {
  period: '#C2416E', cycle_symptom: '#B7791F', mood: '#C27A2C', contraception: '#3A78B5', ovulation_test: '#6A52D6', mucus: '#2A8A80', temperature: '#C25145', appointment: '#C25145',
  feel: '#B4507A', mother_sleep: '#4F5EC4', eat: '#3C8C55', weight: '#5B6B7C', echo: '#6A52D6', checkin: '#7A5CE0',
  breastfeed: '#C2416E', bottle: '#D2693C', diaper: '#3A78B5', sleep: '#6A52D6', meal: '#3C8C55', medication: '#5E4CC2', growth: '#2A8A80', pumping: '#A6448A', observation: '#B7791F',
};
const INK_DARK = '#C9B8FF';

export const actionLabel = (k: ActionKey): string => (TRACK_KEYS.has(k) ? tr(`dom.track.label.${k}` as TKey) : tr(`da.label.${k}` as TKey));

function ActionGlyph({ k, color, size = 24 }: { k: ActionKey; color: string; size?: number }) {
  if (k === 'eat') return <TrackIcon k="meal" color={color} size={size} />;
  if (TRACK_KEYS.has(k)) return <TrackIcon k={k as TrackKey} color={color} size={size} />;
  return <Icon name={ICON[k] ?? 'circle'} size={size - 3} color={color} />;
}

// ─── Données réelles par profil ─────────────────────────────────────────────────────────────────

const latest = <T,>(rows: T[] | undefined | null): T | null => (rows && rows.length ? rows[0] : null);
const track = (kind: string, child: string) => () => router.push({ pathname: '/track/[kind]', params: { kind, child } });

function useChildModels(child: Child): Partial<Record<ActionKey, ActionModel>> {
  const toast = useToast();
  const id = child.id;
  const bottles = useLogs<Bottle>('bottle', id, 7).data;
  const feeds = useLogs<Breastfeed>('breastfeed', id, 7).data;
  const diapers = useLogs<Diaper>('diaper', id, 7).data;
  const sleeps = useLogs<Sleep>('sleep', id, 7).data;
  const meals = useLogs<Meal>('meal', id, 7).data;
  const pumpings = useLogs<Pumping>('pumping', id, 7).data;
  const obs = useLogs<Observation>('observation', id, 7).data;
  const measures = useMeasurements(id).data;
  const treatments = useTreatments(id).data;
  const appts = useAppointments({ upcomingOnly: true }).data;
  const openSleep = useOpenSleep(id);
  const act = useSleepActions(child);
  const activeTreatment = (treatments ?? []).find((x) => x.active && (!x.end_date || x.end_date >= todayISO()));
  const data: LastData = {
    bottle: latest(bottles), breastfeed: latest(feeds), diaper: latest(diapers), meal: latest(meals), pumping: latest(pumpings), observation: latest(obs),
    sleep: openSleep ? { started_at: openSleep.started_at, ended_at: null } : latest([...(sleeps ?? [])].filter((s) => s.ended_at).sort((a, b) => b.ended_at!.localeCompare(a.ended_at!))),
    growth: latest([...(measures ?? [])].sort((a, b) => b.measured_on.localeCompare(a.measured_on))),
    medication: activeTreatment ? { name: activeTreatment.name, nextAt: nextDose(activeTreatment.times) } : null,
    appointment: latest((appts ?? []).filter((a) => a.child_id === id)),
  };
  async function toggleSleep() {
    try {
      if (openSleep) { await act.awake(new Date()); toast(tr('trk.cards.wokeUp', { name: child.first_name }), 'success'); }
      else { const h = new Date().getHours(); await act.asleep(new Date(), h >= 19 || h < 7 ? 'night' : 'nap'); toast(tr('trk.cards.asleep', { name: child.first_name }), 'success'); }
    } catch (e) { toast(e instanceof SleepError ? e.message : friendlyError(e), 'error'); }
  }
  const info = (k: TrackKey) => lastInfo(k, data, { name: child.first_name, sex: child.sex });
  return {
    bottle: { key: 'bottle', info: info('bottle'), onOpen: () => router.push(`/bottle/${id}` as never), onAdd: track('bottle', id) },
    breastfeed: { key: 'breastfeed', info: info('breastfeed'), onOpen: track('breastfeed', id), onAdd: track('breastfeed', id) },
    diaper: { key: 'diaper', info: info('diaper'), onOpen: track('diaper', id), onAdd: track('diaper', id) },
    sleep: { key: 'sleep', info: info('sleep'), onOpen: () => router.push(`/sleep/${id}` as never), onAdd: toggleSleep, active: !!openSleep, addLabel: openSleep ? tr('trk.cards.wakesUp', { name: child.first_name }) : tr('trk.cards.fallsAsleep', { name: child.first_name }) },
    meal: { key: 'meal', info: info('meal'), onOpen: track('meal', id), onAdd: track('meal', id) },
    pumping: { key: 'pumping', info: info('pumping'), onOpen: track('pumping', id), onAdd: track('pumping', id) },
    observation: { key: 'observation', info: info('observation'), onOpen: track('observation', id), onAdd: track('observation', id) },
    growth: { key: 'growth', info: info('growth'), onOpen: () => router.push(`/child/${id}/growth`), onAdd: () => router.push(`/child/${id}/growth`) },
    medication: { key: 'medication', info: info('medication'), onOpen: () => router.push(`/child/${id}/needs?tab=treatments` as never), onAdd: () => router.push(`/child/${id}/needs?tab=treatments` as never), addLabel: tr('trk.cards.treatments') },
    appointment: { key: 'appointment', info: info('appointment'), onOpen: () => router.push('/appointments'), onAdd: () => router.push({ pathname: '/appointments', params: { new: 'quick', child: id } } as never), addLabel: tr('trk.cards.addAppointment') },
  };
}

function usePregnancyModels(): Partial<Record<ActionKey, ActionModel>> {
  const pregnancy = useActivePregnancy();
  const sleepLogs = useParentSleepLogs(5).data;
  const moods = useMoods(5).data;
  const weights = useMaternalWeights(pregnancy?.id ?? null).data;
  const appts = useAppointments({ upcomingOnly: true }).data;
  const symptoms = usePregnancySymptoms(5).data;
  const today = todayISO();
  const data: LastData = {
    mother_sleep: latest([...(sleepLogs ?? [])].sort((a, b) => b.log_date.localeCompare(a.log_date))),
    mood: latest(moods),
    weight: latest([...(weights ?? [])].sort((a, b) => b.measured_on.localeCompare(a.measured_on))),
    appointment: latest((appts ?? []).filter((a) => !a.child_id && (!a.pregnancy_id || a.pregnancy_id === pregnancy?.id))),
    meal: null,
  };
  const last = latest(symptoms);
  const w = pregnancy ? windowToShow(pregnancy.due_date, today) : null;
  const week = pregnancy ? pregnancyProgress(pregnancy.due_date).weeksSA : null;
  return {
    feel: { key: 'feel', info: last ? tr('da.info.feel', { what: tr(`care.sym.${last.symptom}` as TKey).toLowerCase(), when: whenLabel(last.logged_at) }) : tr('da.info.feelNone'), onOpen: () => router.push('/pregnancy/feel' as never), onAdd: () => router.push('/pregnancy/feel' as never) },
    mother_sleep: { key: 'mother_sleep', info: lastInfo('mother_sleep', data), onOpen: () => router.push('/me/sleep'), onAdd: () => router.push('/me/sleep') },
    mood: { key: 'mood', info: lastInfo('mood', data), onOpen: () => router.push('/me/mood'), onAdd: () => router.push('/me/mood') },
    eat: { key: 'eat', info: week != null ? tr('da.info.eat', { n: pregnancyProgress(pregnancy!.due_date).trimester }) : tr('da.info.eatNone'), onOpen: () => router.push('/pregnancy/eat' as never), onAdd: () => router.push('/pregnancy/eat' as never), addLabel: tr('da.eat.add') },
    weight: { key: 'weight', info: lastInfo('weight', data), onOpen: () => router.push('/pregnancy/weight'), onAdd: () => router.push('/pregnancy/weight') },
    appointment: { key: 'appointment', info: lastInfo('appointment', data), onOpen: () => router.push({ pathname: '/appointments', params: { for: 'pregnancy' } } as never), onAdd: () => router.push({ pathname: '/appointments', params: { new: 'quick' } } as never), addLabel: tr('trk.cards.addAppointment') },
    echo: {
      key: 'echo',
      info: w ? tr('da.info.echo', { name: tr(`care.cal.${w.key}` as TKey).toLowerCase(), from: formatDate(`${w.from}T12:00:00`, { day: 'numeric', month: 'short' }), to: formatDate(`${w.to}T12:00:00`, { day: 'numeric', month: 'short' }) }) : tr('da.info.echoNone'),
      onOpen: () => router.push('/pregnancy/calendar' as never), onAdd: () => router.push('/pregnancy/calendar' as never), addLabel: tr('da.echo.add'),
    },
  };
}

function useMeModels(scope: string): Partial<Record<ActionKey, ActionModel>> {
  const sleepLogs = useParentSleepLogs(5).data;
  const moods = useMoods(5).data;
  const periods = usePeriods().data;
  const ovu = useTests('ovulation_tests').data;
  const fert = useFertilityObservations(30).data;
  const contra = useContraceptionLogs(30).data;
  const appts = useAppointments({ upcomingOnly: true }).data;
  const ctx = useRelevanceCtx();
  const today = todayISO();
  const est = useMemo(() => estimateCycle((periods ?? []).map((p) => ({ ...p, flow: p.flow ?? null })), today), [periods, today]);
  const data: LastData = {
    mother_sleep: latest([...(sleepLogs ?? [])].sort((a, b) => b.log_date.localeCompare(a.log_date))),
    mood: latest(moods),
    appointment: latest((appts ?? []).filter((a) => appointmentRelevant(a, ctx))),
  };
  const lastPeriod = [...(periods ?? [])].sort((a, b) => b.start_date.localeCompare(a.start_date))[0];
  const lastTemp = (fert ?? []).find((f) => f.bbt_celsius != null);
  const lastMucus = (fert ?? []).find((f) => f.cervical_mucus);
  const lastContra = latest(contra);
  const day = (iso: string) => formatDate(`${iso}T12:00:00`, { day: 'numeric', month: 'short' });
  const home = (add: string) => () => router.push({ pathname: '/', params: { add } } as never);
  const cycleHome = scope === 'ttc' ? '/fertility' : scope === 'avoid' ? '/contraception' : '/cycle';
  return {
    period: { key: 'period', info: est?.nextPeriod ? tr('da.info.periodNext', { date: day(est.nextPeriod) }) : lastPeriod ? tr('da.info.periodLast', { date: day(lastPeriod.start_date) }) : tr('da.info.periodNone'), onOpen: () => router.push(cycleHome as never), onAdd: home('period') },
    cycle_symptom: { key: 'cycle_symptom', info: tr('da.info.symptom'), onOpen: () => router.push('/cycle/symptoms'), onAdd: home('pain') },
    mood: { key: 'mood', info: lastInfo('mood', data), onOpen: () => router.push('/me/mood'), onAdd: () => router.push('/me/mood') },
    contraception: { key: 'contraception', info: lastContra ? tr('da.info.contraLast', { date: day(lastContra.logged_on) }) : tr('da.info.contraNone'), onOpen: () => router.push('/contraception'), onAdd: () => router.push('/contraception/log' as never) },
    ovulation_test: { key: 'ovulation_test', info: latest(ovu) ? tr('da.info.testLast', { date: day(latest(ovu)!.tested_at.slice(0, 10)) }) : tr('da.info.testNone'), onOpen: () => router.push('/fertility'), onAdd: () => router.push('/fertility/test/ovulation' as never) },
    mucus: { key: 'mucus', info: lastMucus ? tr('da.info.obsLast', { date: day(lastMucus.observed_on) }) : tr('da.info.obsNone'), onOpen: () => router.push('/fertility/mucus' as never), onAdd: () => router.push('/fertility/mucus' as never) },
    temperature: { key: 'temperature', info: lastTemp ? tr('da.info.tempLast', { value: String(lastTemp.bbt_celsius).replace('.', ','), date: day(lastTemp.observed_on) }) : tr('da.info.obsNone'), onOpen: () => router.push('/fertility/body' as never), onAdd: () => router.push('/fertility/body' as never) },
    mother_sleep: { key: 'mother_sleep', info: lastInfo('mother_sleep', data), onOpen: () => router.push('/me/sleep'), onAdd: () => router.push('/me/sleep') },
    appointment: { key: 'appointment', info: lastInfo('appointment', data), onOpen: () => router.push('/appointments'), onAdd: () => router.push({ pathname: '/appointments', params: { new: 'quick' } } as never), addLabel: tr('trk.cards.addAppointment') },
    checkin: { key: 'checkin', info: tr('da.info.checkin'), onOpen: () => router.push('/postpartum/checkin'), onAdd: () => router.push('/postpartum/checkin') },
  };
}

// ─── Composant ──────────────────────────────────────────────────────────────────────────────────

/** Carte « Mes actions du jour » du profil affiché (accueil, onglet Suivi). */
export function DailyActions({ child, journey }: { child?: Child | null; journey?: 'baby' | 'child' | null } = {}) {
  const scope = useScope();
  const kid = child ?? ((scope.scope === 'baby' || scope.scope === 'child') ? scope.child : null);
  if (kid) return <ChildDailyActions child={kid} journey={journey ?? (scope.scope === 'baby' ? 'baby' : 'child')} />;
  if (scope.scope === 'pregnancy') return <PregnancyDailyActions />;
  return <MeDailyActions scope={scope.scope} />;
}

export function ChildDailyActions({ child, journey }: { child: Child; journey: 'baby' | 'child' }) {
  const models = useChildModels(child);
  const age = childAge(child.birth_date).months;
  const ctx: ActionContext = { profile: actionProfile(journey, { ageMonths: age, enabled: child.enabled_tracking }, journey), enabled: child.enabled_tracking, ageMonths: journey === 'baby' ? Math.min(age, 23) : age };
  return <ActionsStrip ctx={ctx} models={models} title={tr('da.allFor', { name: child.first_name })} />;
}
export function PregnancyDailyActions() {
  const models = usePregnancyModels();
  const { data: profile } = useProfile();
  return <ActionsStrip ctx={{ profile: 'pregnancy', hideWeight: !!profile?.hide_weight_module }} models={models} title={tr('da.allMine')} />;
}
function MeDailyActions({ scope }: { scope: string }) {
  const models = useMeModels(scope);
  return <ActionsStrip ctx={{ profile: actionProfile(scope) }} models={models} title={tr('da.allMine')} />;
}

const PROFILE_SUB: Record<ActionProfile, TKey> = {
  cycle: 'da.sub.cycle', avoid: 'da.sub.avoid', ttc: 'da.sub.ttc', pregnancy: 'da.sub.pregnancy', newborn: 'da.sub.newborn',
  diversification: 'da.sub.diversification', child: 'da.sub.child', postpartum: 'da.sub.postpartum', none: 'da.sub.none',
};

export function ActionsStrip({ ctx, models, title }: { ctx: ActionContext; models: Partial<Record<ActionKey, ActionModel>>; title: string }) {
  const t = useTheme();
  const dark = t.isDark;
  const favs = useUiStore((s) => s.dailyActionFavorites);
  const setFavs = useUiStore((s) => s.setDailyActionFavorites);
  const hapticsOn = useUiStore((s) => s.hapticsEnabled);
  const setHaptics = useUiStore((s) => s.setHaptics);
  const toast = useToast();
  const { shown, more } = shownActions(ctx, favs?.[ctx.profile]);
  const [all, setAll] = useState(false);
  const [edit, setEdit] = useState(false);
  const [draft, setDraft] = useState<ActionKey[]>([]);
  const list = shown.map((k) => models[k]).filter((m): m is ActionModel => !!m);
  const everything = [...shown, ...more].map((k) => models[k]).filter((m): m is ActionModel => !!m);

  return (
    <View testID="daily-actions" style={{ borderRadius: 28, shadowColor: dark ? '#000' : '#B4507A', shadowOpacity: dark ? 0.3 : 0.12, shadowRadius: 22, shadowOffset: { width: 0, height: 10 }, elevation: 3 }}>
      <View style={{ borderRadius: 28, overflow: 'hidden', borderWidth: 1, borderColor: dark ? 'rgba(255,255,255,0.13)' : 'rgba(255,255,255,0.85)' }}>
        {Platform.OS === 'ios' || Platform.OS === 'web' ? <BlurView intensity={dark ? 26 : 38} tint={dark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} pointerEvents="none" /> : null}
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: dark ? 'rgba(30,24,58,0.55)' : 'rgba(255,250,246,0.58)' }]} />
        <LinearGradient pointerEvents="none" colors={dark ? ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0)'] : ['rgba(255,255,255,0.6)', 'rgba(255,255,255,0)']} start={{ x: 0, y: 0 }} end={{ x: 0.5, y: 0.7 }} style={StyleSheet.absoluteFill} />
        <View style={{ paddingTop: spacing.sm, paddingBottom: spacing.sm, gap: spacing.xs }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, gap: spacing.xs }}>
            <View style={{ flex: 1 }}>
              <Text weight="bold">{tr('da.title')}</Text>
              <Text variant="caption" muted>{tr(PROFILE_SUB[ctx.profile])}</Text>
            </View>
            <Tappable accessibilityRole="button" accessibilityLabel={tr('da.seeAllA11y')} onPress={() => setAll(true)} testID="track-see-all"
              style={{ minHeight: 40, paddingHorizontal: 12, borderRadius: radius.pill, justifyContent: 'center', backgroundColor: dark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.75)' }}>
              <Text variant="small" weight="bold" color={t.colors.primary}>{tr('da.seeAll')}</Text>
            </Tappable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.md, gap: spacing.xs }} testID="track-cards">
            {list.map((m) => <Capsule key={m.key} m={m} />)}
            <Tappable accessibilityRole="button" accessibilityLabel={tr('da.customize')} testID="actions-customize" onPress={() => { setDraft(shown); setEdit(true); }}
              style={{ width: 92, alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 22, borderWidth: 1, borderStyle: 'dashed', borderColor: dark ? 'rgba(255,255,255,0.25)' : 'rgba(43,36,51,0.18)', minHeight: 132 }}>
              <Icon name="sliders" size={18} color={t.colors.textMuted} />
              <Text variant="caption" muted center>{tr('da.customizeShort')}</Text>
            </Tappable>
          </ScrollView>
        </View>
      </View>

      <Sheet visible={all} onClose={() => setAll(false)} title={title}>
        <View style={{ gap: spacing.xs }} testID="track-all">
          {everything.map((m) => <Row key={m.key} m={{ ...m, onOpen: () => { setAll(false); m.onOpen(); }, onAdd: () => { setAll(false); m.onAdd(); } }} />)}
          <Button label={tr('da.allTools')} icon="grid" variant="ghost" onPress={() => { setAll(false); router.push('/tools'); }} />
          <ToggleRow label={tr('trk.cards.haptics')} hint={tr('trk.cards.hapticsHint')} value={hapticsOn} onChange={setHaptics} />
        </View>
      </Sheet>
      <Sheet visible={edit} onClose={() => setEdit(false)} title={tr('da.customizeTitle')}>
        <View style={{ gap: spacing.xs }} testID="actions-customize-sheet">
          <Text variant="small" muted>{tr('da.customizeHint')}</Text>
          {[...shown, ...more].map((k) => {
            const on = draft.includes(k);
            return (
              <Tappable key={k} accessibilityRole="checkbox" accessibilityState={{ checked: on }} testID={`actions-pick-${k}`}
                onPress={() => (on ? setDraft(draft.filter((x) => x !== k)) : draft.length >= 4 ? toast(tr('da.max'), 'info') : setDraft([...draft, k]))}
                style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 48 }}>
                <Icon name={on ? 'check-square' : 'square'} size={20} color={on ? t.colors.primary : t.colors.textMuted} />
                <ActionGlyph k={k} color={dark ? INK_DARK : INK[k]} size={22} />
                <Text weight="bold" style={{ flex: 1 }}>{actionLabel(k)}</Text>
              </Tappable>
            );
          })}
          <Button label={tr('common.save')} full testID="actions-customize-save" onPress={() => { if (!draft.length) return toast(tr('da.min'), 'info'); setFavs(ctx.profile, draft); setEdit(false); }} />
          <Button label={tr('da.reset')} variant="ghost" onPress={() => { setFavs(ctx.profile, null); setEdit(false); }} />
        </View>
      </Sheet>
    </View>
  );
}

function Capsule({ m }: { m: ActionModel }) {
  const t = useTheme();
  const dark = t.isDark;
  const reduce = useReduceMotion();
  const ink = dark ? INK_DARK : INK[m.key];
  return (
    <View testID={`track-card-${m.key}`} style={{ width: 128 }}>
      <Pressable accessibilityRole="button" accessibilityLabel={`${actionLabel(m.key)}. ${m.info}`} accessibilityHint={tr('trk.cards.openHint')}
        onPress={() => { haptic('selection'); m.onOpen(); }}
        style={({ pressed }) => ({ minHeight: 132, borderRadius: 22, padding: 10, gap: 6, backgroundColor: dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.72)', borderWidth: 1, borderColor: dark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.95)', transform: [{ scale: pressed && !reduce ? 0.97 : 1 }] })}>
        <View style={{ width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: dark ? 'rgba(201,184,255,0.14)' : `${INK[m.key]}1A` }}>
          <ActionGlyph k={m.key} color={ink} size={24} />
        </View>
        <Text variant="small" weight="bold" numberOfLines={2}>{actionLabel(m.key)}</Text>
        <Text variant="caption" muted numberOfLines={3} testID={`track-info-${m.key}`}>{m.info}</Text>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={m.addLabel ?? tr('trk.cards.add', { label: actionLabel(m.key) })} hitSlop={10} testID={`track-add-${m.key}`}
        onPress={() => { haptic('light'); m.onAdd(); }}
        style={({ pressed }) => ({ position: 'absolute', top: 8, right: 8, width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: t.colors.primary, opacity: pressed ? 0.85 : 1, shadowColor: dark ? '#000000' : '#6B3F2E', shadowOpacity: 0.2, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } })}>
        <Icon name={m.active ? 'sun' : 'plus'} size={16} color={t.colors.primaryText} />
      </Pressable>
    </View>
  );
}

function Row({ m }: { m: ActionModel }) {
  const t = useTheme();
  const ink = t.isDark ? INK_DARK : INK[m.key];
  return (
    <View testID={`track-card-${m.key}`} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 56 }}>
      <Pressable accessibilityRole="button" accessibilityLabel={`${actionLabel(m.key)}. ${m.info}`} onPress={m.onOpen} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <View style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: t.isDark ? 'rgba(201,184,255,0.14)' : `${INK[m.key]}1A` }}><ActionGlyph k={m.key} color={ink} size={22} /></View>
        <View style={{ flex: 1 }}>
          <Text weight="bold">{actionLabel(m.key)}</Text>
          <Text variant="caption" muted numberOfLines={2}>{m.info}</Text>
        </View>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={m.addLabel ?? tr('trk.cards.add', { label: actionLabel(m.key) })} hitSlop={8} onPress={m.onAdd}
        style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: t.colors.primary }}>
        <Icon name={m.active ? 'sun' : 'plus'} size={18} color={t.colors.primaryText} />
      </Pressable>
    </View>
  );
}
