/**
 * « Le cocon du jour » : accueil d'un profil enfant (bébé ou enfant).
 *  1. Bulles des enfants (dans l'en-tête de l'accueil, voir ProfileSwitcher « bubbles »).
 *  2. Le cocon : grande carte en verre dépoli, photo ou initiales AU CENTRE, prénom, âge exact, état actuel,
 *     ambiance selon le moment (soleil doux, lumière du jour, coucher de soleil, lune et étoiles).
 *     Glisser la carte vers la gauche ou la droite change d'enfant.
 *  3. La frise de la journée : les vrais événements notés, l'heure actuelle ; toucher un événement pour le voir,
 *     le modifier ou le supprimer.
 *  4. Trois informations choisies selon l'âge (jamais un suivi désactivé).
 *  5. Un seul bouton flottant « + Ajouter » (feuille avec 4 favoris personnalisables).
 *  6. « À retenir aujourd'hui » : une seule chose.
 *  7. Un article adapté à l'âge.
 * Toutes les données viennent du profil affiché (clé = identifiant de l'enfant) : rien n'est mélangé.
 */
import { ChildShortcuts } from '@/features/discoveries/ChildShortcuts';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, PanResponder, Platform, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Svg, { Circle, Defs, Ellipse, Path, RadialGradient, Rect, Stop, LinearGradient as SvgLinear } from 'react-native-svg';
import { Button, haptic, Icon, type IconName, Text } from '@/components/ui';
import { confirm, Sheet, useToast } from '@/components/Overlays';
import { Tappable } from '@/components/Tappable';
import { ChildAvatar } from '@/features/childAvatar';
import { TrackIcon } from '@/features/trackCards';
import { useActiveSubject, useAppointments, useInvalidate, useLogs, useOpenSleep, usePremium, useTrackedChildren } from '@/lib/data/hooks';
import { useTreatmentLogs, useTreatments } from '@/lib/data/hooks-needs';
import { useBottleTimer } from '@/lib/data/hooks-bottle';
import { SleepError, useNow, useSleepActions, useSleepPlan } from '@/lib/data/hooks-sleepPlanner';
import { friendlyError } from '@/lib/data/hooks-settings';
import { backend, eq } from '@/lib/backend';
import { childAge } from '@/lib/domain/child';
import { agree, planLines, type SleepPlan } from '@/lib/domain/sleepPlanner';
import { childTrackProfile, nextDose, type TrackKey } from '@/lib/domain/trackingCards';
import { isLocked } from '@/lib/domain/content';
import {
  addActions, buildRibbon, clockOf, cocoonMoment, favoriteActions, infoKeys, infoValue, keepInMind, ribbonRange, spanLabel,
  type AddAction, type CocoonMoment, type InfoKey, type KeepItem, type RibbonEvent, type RibbonKind,
} from '@/lib/domain/cocoon';
import { CHILD_SOURCES, SAFE_SLEEP } from '@/content/childSafety';
import { LOG_TABLE, type Article, type Bottle, type Breastfeed, type Child, type Diaper, type Meal, type Observation, type Sleep } from '@/lib/types';
import { useUiStore } from '@/lib/store';
import { useReduceMotion, useTheme } from '@/theme/ThemeProvider';
import { DOCK_HEIGHT } from '@/components/Dock';
import { fonts, NACRE, NATIVE_DRIVER, radius, spacing } from '@/theme/tokens';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { t as tr, type TKey } from '@/i18n';

type Journey = 'baby' | 'child' | null | undefined;
const BLUR_OK = Platform.OS === 'ios' || Platform.OS === 'web';

// ─── Palette du cocon (teintes douces, jamais de blanc pur) ───────────────────────────────────────

const WASH: Record<CocoonMoment, [string, string, string]> = {
  morning: ['rgba(255,224,204,0.78)', 'rgba(255,212,224,0.58)', 'rgba(255,246,232,0.55)'],
  day: ['rgba(212,230,255,0.62)', 'rgba(228,216,255,0.58)', 'rgba(255,238,210,0.50)'],
  sunset: ['rgba(255,198,160,0.66)', 'rgba(236,164,184,0.56)', 'rgba(196,166,226,0.56)'],
  night: ['rgba(46,38,104,0.78)', 'rgba(78,46,120,0.62)', 'rgba(24,22,66,0.70)'],
};
const DARK_WASH: [string, string, string] = ['rgba(46,38,104,0.70)', 'rgba(78,46,120,0.55)', 'rgba(24,22,66,0.62)'];

const KIND_INK: Record<RibbonKind, string> = {
  sleep: '#7B66E0', wake: '#C98A1E', bottle: '#D2693C', breastfeed: '#C2416E', meal: '#3C8C55', diaper: '#3A78B5',
  medication: '#5E4CC2', appointment: '#C25145', symptom: '#B7791F', note: '#7A6A86',
};
const KIND_INK_DARK: Record<RibbonKind, string> = {
  sleep: '#B9A8FF', wake: '#FFD27A', bottle: '#FFB08A', breastfeed: '#FF9CC0', meal: '#9EDDB2', diaper: '#A8CCFF',
  medication: '#C5B8FF', appointment: '#FFB0A6', symptom: '#FFD08A', note: '#D9CCE6',
};
const TRACK_OF: Partial<Record<RibbonKind, TrackKey>> = {
  sleep: 'sleep', bottle: 'bottle', breastfeed: 'breastfeed', meal: 'meal', diaper: 'diaper', medication: 'medication', appointment: 'appointment', symptom: 'observation',
};
const ICON_OF: Partial<Record<RibbonKind, IconName>> = { wake: 'sun', note: 'edit-3' };

function KindGlyph({ kind, color, size = 18 }: { kind: RibbonKind; color: string; size?: number }) {
  const k = TRACK_OF[kind];
  return k ? <TrackIcon k={k} color={color} size={size} /> : <Icon name={ICON_OF[kind] ?? 'circle'} size={size - 2} color={color} />;
}

/** Surface en verre dépoli propre au cocon : flou, voile coloré, reflet, liseré clair, ombre douce teintée. */
function Glass({ children, wash, style, rounded = 30, testID }: { children: React.ReactNode; wash?: [string, string, string]; style?: object; rounded?: number; testID?: string }) {
  const t = useTheme();
  const dark = t.isDark;
  return (
    <View testID={testID} style={[{ borderRadius: rounded, shadowColor: dark ? '#000' : '#B4507A', shadowOpacity: dark ? 0.3 : 0.13, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 4 }, style]}>
      <View style={{ borderRadius: rounded, overflow: 'hidden', borderWidth: 1, borderColor: dark ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.78)' }}>
        {BLUR_OK ? <BlurView intensity={dark ? 28 : 40} tint={dark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} pointerEvents="none" /> : null}
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: dark ? 'rgba(30,24,58,0.58)' : 'rgba(255,250,246,0.56)' }]} />
        {wash ? <LinearGradient pointerEvents="none" colors={wash} locations={[0, 0.55, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} /> : null}
        <LinearGradient pointerEvents="none" colors={[dark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.55)', 'rgba(255,255,255,0)']} start={{ x: 0, y: 0 }} end={{ x: 0.5, y: 0.6 }} style={StyleSheet.absoluteFill} />
        <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: rounded * 0.7, right: rounded * 0.7, height: 1, backgroundColor: dark ? 'rgba(255,255,255,0.24)' : 'rgba(255,255,255,0.98)' }} />
        {children}
      </View>
    </View>
  );
}

// ─── Décor du moment ──────────────────────────────────────────────────────────────────────────────

function MomentArt({ moment, dark }: { moment: CocoonMoment; dark: boolean }) {
  const id = React.useId().replace(/:/g, '');
  if (moment === 'night' || dark) {
    const stars: [number, number, number][] = [[30, 34, 1.4], [70, 80, 1], [180, 26, 1.5], [150, 92, 1], [276, 140, 1.2], [110, 30, 0.9], [205, 120, 1.1], [24, 150, 1], [262, 200, 0.9], [40, 230, 0.8]];
    return (
      <Svg width="100%" height="100%" viewBox="0 0 300 400" preserveAspectRatio="xMidYMin slice" pointerEvents="none">
        <Defs>
          <RadialGradient id={`m${id}`} cx="50%" cy="50%" r="50%"><Stop offset="0" stopColor="#FFE9B8" stopOpacity="0.55" /><Stop offset="1" stopColor="#FFE9B8" stopOpacity="0" /></RadialGradient>
        </Defs>
        <Circle cx="246" cy="62" r="60" fill={`url(#m${id})`} />
        <Path d="M252 38a24 24 0 1 0 12 42a19 19 0 1 1-12-42z" fill="#FFF1CF" opacity="0.92" />
        {stars.map(([x, y, r], i) => <Circle key={i} cx={x} cy={y} r={r} fill="#FFF3D9" opacity={0.55 + (i % 3) * 0.15} />)}
      </Svg>
    );
  }
  if (moment === 'sunset') {
    return (
      <Svg width="100%" height="100%" viewBox="0 0 300 400" preserveAspectRatio="xMidYMin slice" pointerEvents="none">
        <Defs>
          <RadialGradient id={`s${id}`} cx="50%" cy="50%" r="50%"><Stop offset="0" stopColor="#FFC08A" stopOpacity="0.9" /><Stop offset="0.5" stopColor="#FF9FB0" stopOpacity="0.35" /><Stop offset="1" stopColor="#FF9FB0" stopOpacity="0" /></RadialGradient>
          <SvgLinear id={`b${id}`} x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor="#FFFFFF" stopOpacity="0" /><Stop offset="1" stopColor="#F3B7C6" stopOpacity="0.35" /></SvgLinear>
        </Defs>
        <Circle cx="40" cy="210" r="170" fill={`url(#s${id})`} />
        <Rect x="0" y="180" width="300" height="220" fill={`url(#b${id})`} />
        <Ellipse cx="210" cy="64" rx="64" ry="9" fill="#FFFFFF" opacity="0.3" />
        <Ellipse cx="250" cy="90" rx="42" ry="6" fill="#FFFFFF" opacity="0.24" />
      </Svg>
    );
  }
  const morning = moment === 'morning';
  return (
    <Svg width="100%" height="100%" viewBox="0 0 300 400" preserveAspectRatio="xMidYMin slice" pointerEvents="none">
      <Defs>
        <RadialGradient id={`d${id}`} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={morning ? '#FFD3B0' : '#FFE7A8'} stopOpacity={morning ? 0.95 : 0.8} />
          <Stop offset="0.45" stopColor={morning ? '#FFC2CF' : '#FFF1CC'} stopOpacity="0.32" />
          <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Circle cx={morning ? 40 : 250} cy={morning ? 140 : 40} r={morning ? 140 : 150} fill={`url(#d${id})`} />
      <Ellipse cx={morning ? 220 : 80} cy="62" rx="70" ry="10" fill="#FFFFFF" opacity="0.45" />
      <Ellipse cx={morning ? 260 : 40} cy="88" rx="44" ry="7" fill="#FFFFFF" opacity="0.34" />
    </Svg>
  );
}

/** Petites particules lumineuses qui flottent lentement (immobiles si « Réduire les animations »). */
function Motes({ dark, count = 7 }: { dark: boolean; count?: number }) {
  const reduce = useReduceMotion();
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduce) return;
    const loop = Animated.loop(Animated.timing(v, { toValue: 1, duration: 9000, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE_DRIVER }));
    loop.start();
    return () => loop.stop();
  }, [reduce, v]);
  const dots = useMemo(() => Array.from({ length: count }, (_, i) => ({ left: `${8 + ((i * 37) % 84)}%`, top: `${12 + ((i * 53) % 70)}%`, size: 3 + (i % 3), amp: 6 + (i % 4) * 3, dir: i % 2 ? 1 : -1 })), [count]);
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {dots.map((d, i) => (
        <Animated.View key={i} style={{
          position: 'absolute', left: d.left as `${number}%`, top: d.top as `${number}%`, width: d.size, height: d.size, borderRadius: d.size,
          backgroundColor: dark ? '#FFF1CF' : '#FFFFFF', opacity: dark ? 0.55 : 0.85,
          shadowColor: dark ? '#FFE3A0' : '#FFFFFF', shadowOpacity: 0.9, shadowRadius: 4,
          transform: [{ translateY: v.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, -d.amp * d.dir, 0] }) }],
        }} />
      ))}
    </View>
  );
}

/** Halo qui respire doucement derrière la photo. */
function BreathingHalo({ size, dark, moment }: { size: number; dark: boolean; moment: CocoonMoment }) {
  const reduce = useReduceMotion();
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduce) return;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(v, { toValue: 1, duration: 3200, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE_DRIVER }),
      Animated.timing(v, { toValue: 0, duration: 3200, easing: Easing.inOut(Easing.sin), useNativeDriver: NATIVE_DRIVER }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [reduce, v]);
  const id = React.useId().replace(/:/g, '');
  const c = dark || moment === 'night' ? '#B9A2FF' : moment === 'sunset' ? '#FFB49A' : moment === 'morning' ? '#FFC7B0' : '#C9B6FF';
  return (
    <Animated.View pointerEvents="none" style={{ position: 'absolute', width: size, height: size, opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.75, 1] }), transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1.05] }) }] }}>
      <Svg width={size} height={size}>
        <Defs><RadialGradient id={`h${id}`} cx="50%" cy="50%" r="50%"><Stop offset="0.45" stopColor={c} stopOpacity="0.75" /><Stop offset="1" stopColor={c} stopOpacity="0" /></RadialGradient></Defs>
        <Circle cx={size / 2} cy={size / 2} r={size / 2} fill={`url(#h${id})`} />
      </Svg>
    </Animated.View>
  );
}

// ─── Sommeil : action principale selon l'état ─────────────────────────────────────────────────────

interface SleepAction { label: string; icon: IconName; testID: string; run: () => Promise<void> }

function useSleepButtons(child: Child, plan: SleepPlan | null): { actions: SleepAction[]; busy: boolean; go: (a: SleepAction) => void } {
  const toast = useToast();
  const act = useSleepActions(child);
  const [busy, setBusy] = useState(false);
  const h = new Date().getHours();
  const kind: 'nap' | 'night' = plan?.state === 'awake' && plan.nextNap && !plan.nextNap.overdue ? 'nap' : plan?.state === 'awake' && plan.bedtime && !plan.nextNap ? (h >= 16 ? 'night' : 'nap') : h >= 19 || h < 7 ? 'night' : 'nap';
  const name = child.first_name;
  const state = plan?.state ?? 'unknown';
  const sx = child.sex;
  const actions: SleepAction[] = [];
  if (state === 'asleep_nap') actions.push({ label: tr('coc.sleep.wakes'), icon: 'sun', testID: 'sleep-awake', run: async () => { await act.awake(new Date()); toast(tr('coc.sleep.wokeToast', { name, time: clockOf(Date.now()) }), 'success'); } });
  if (state === 'asleep_night') {
    actions.push({ label: tr('coc.sleep.nightWaking'), icon: 'moon', testID: 'sleep-night-waking', run: async () => { await act.nightWaking(new Date()); toast(tr('coc.sleep.nightWakingToast', { time: clockOf(Date.now()) }), 'success'); } });
    actions.push({ label: tr('coc.sleep.morning'), icon: 'sun', testID: 'sleep-awake', run: async () => { await act.awake(new Date()); toast(tr('coc.sleep.wokeToast', { name, time: clockOf(Date.now()) }), 'success'); } });
  }
  if (state === 'night_waking') {
    actions.push({ label: tr('coc.sleep.back'), icon: 'moon', testID: 'sleep-back', run: async () => { await act.backToSleep(new Date()); toast(tr('coc.sleep.backToast', { name, time: clockOf(Date.now()) }), 'success'); } });
    actions.push({ label: tr('coc.sleep.morning'), icon: 'sun', testID: 'sleep-awake', run: async () => { await act.awake(new Date()); toast(tr('coc.sleep.wokeToast', { name, time: clockOf(Date.now()) }), 'success'); } });
  }
  if (state === 'awake' || state === 'unknown' || state === 'stale') {
    actions.push({
      label: tr(agree(sx, 'coc.sleep.fallsAsleep.m', 'coc.sleep.fallsAsleep.f', 'coc.sleep.fallsAsleep.n') as TKey), icon: 'moon', testID: 'sleep-asleep',
      run: async () => { await act.asleep(new Date(), kind); toast(tr(kind === 'night' ? 'coc.sleep.nightToast' : 'coc.sleep.napToast', { name, time: clockOf(Date.now()) }), 'success'); },
    });
  }
  const go = (a: SleepAction) => {
    setBusy(true);
    a.run().then(() => haptic('success')).catch((e) => toast(e instanceof SleepError ? e.message : friendlyError(e), 'error')).finally(() => setBusy(false));
  };
  return { actions, busy, go };
}

/** « Lina est réveillée depuis 1 h 20 », « Lina dort depuis 42 min ». */
function stateSentence(child: Child, plan: SleepPlan | null, now: number): string | null {
  if (!plan) return null;
  const n = child.first_name;
  const w = (k: 'awake') => tr(agree(child.sex, `coc.word.${k}.m`, `coc.word.${k}.f`, `coc.word.${k}.n`) as TKey);
  switch (plan.state) {
    case 'awake': return tr('coc.state.awake', { name: n, word: w('awake'), span: spanLabel(plan.awakeMinutes ?? 0) });
    case 'asleep_nap': return tr('coc.state.nap', { name: n, span: spanLabel((now - (plan.since ?? now)) / 60_000) });
    case 'asleep_night': return tr('coc.state.night', { name: n, time: clockOf(plan.since ?? now) });
    case 'night_waking': return tr('coc.state.nightWaking', { name: n, word: w('awake'), span: spanLabel(plan.awakeMinutes ?? 0) });
    case 'stale': return tr('coc.state.stale', { span: spanLabel(plan.awakeMinutes ?? 0) });
    default: return tr('coc.state.unknown', { name: n });
  }
}

// ─── Le cocon ─────────────────────────────────────────────────────────────────────────────────────

export function Cocoon({ child, journey, now: preview, article }: { child: Child; journey: Journey; now: Date; article?: Article | null }) {
  const id = child.id;
  const now = useNow(60_000);
  const enabled = child.enabled_tracking;
  const age = childAge(child.birth_date);
  const months = journey === 'baby' ? Math.min(age.months, 23) : age.months;
  const profile = childTrackProfile(age.months, { journey, mealsEnabled: enabled.includes('meal') });

  const bottles = useLogs<Bottle>('bottle', id, 2).data;
  const feeds = useLogs<Breastfeed>('breastfeed', id, 2).data;
  const diapers = useLogs<Diaper>('diaper', id, 2).data;
  const sleeps = useLogs<Sleep>('sleep', id, 2).data;
  const meals = useLogs<Meal>('meal', id, 2).data;
  const observations = useLogs<Observation>('observation', id, 2).data;
  const appts = useAppointments({}).data;
  const treatments = useTreatments(id).data;
  const dayStartISO = useMemo(() => new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString(), [now]);
  const treatmentIds = useMemo(() => (treatments ?? []).map((x) => x.id), [treatments]);
  const treatmentLogs = useTreatmentLogs(treatmentIds, dayStartISO).data;
  const { active: bottleReminder } = useBottleTimer(id);
  const premium = usePremium();
  const { plan } = useSleepPlan(enabled.includes('sleep') ? child : null);

  const childAppts = useMemo(() => (appts ?? []).filter((a) => a.child_id === id), [appts, id]);
  const doses = useMemo(() => (treatmentLogs ?? []).filter((l) => l.status === 'taken').map((l) => ({ id: l.id, name: treatments?.find((x) => x.id === l.treatment_id)?.name ?? '', at: l.logged_at ?? l.scheduled_for })), [treatmentLogs, treatments]);
  const events = useMemo(() => buildRibbon({ now, enabled, bottles, feeds, diapers, sleeps, meals, observations, appointments: childAppts, doses }), [now, enabled, bottles, feeds, diapers, sleeps, meals, observations, childAppts, doses]);

  const activeTreatment = (treatments ?? []).find((x) => x.active && (!x.end_date || x.end_date >= now.toISOString().slice(0, 10)));
  const nextCandidates = [
    ...childAppts.filter((a) => Date.parse(a.starts_at) > now.getTime()).map((a) => ({ title: a.title, at: a.starts_at })),
    ...(bottleReminder && Date.parse(bottleReminder.due_at) > now.getTime() ? [{ title: tr('coc.next.bottle'), at: bottleReminder.due_at }] : []),
    ...(activeTreatment ? [{ title: activeTreatment.name, at: nextDose(activeTreatment.times, now) ?? '' }].filter((x) => x.at) : []),
  ].sort((a, b) => a.at.localeCompare(b.at));
  const infos = infoKeys(profile, enabled, months).map((k) => infoValue(k, { now, enabled, bottles, feeds, diapers, meals, sleeps, next: nextCandidates[0] ?? null }));

  const keep = keepInMind({
    now, name: child.first_name, ageMonths: age.months,
    bottleReminderAt: bottleReminder?.due_at ?? null,
    appointments: childAppts,
    nextNapAt: premium && plan?.nextNap && !plan.nextNap.overdue ? plan.nextNap.at : null,
    treatment: activeTreatment ? { name: activeTreatment.name, nextAt: nextDose(activeTreatment.times, now) } : null,
    observations,
    tips: enabled.includes('sleep') || age.months < 12 ? SAFE_SLEEP : [],
    tipSource: CHILD_SOURCES.sleep.publisher,
  });

  return (
    <View style={{ gap: spacing.md }} testID="cocoon">
      <CocoonCard child={child} plan={plan} premium={premium} moment={cocoonMoment(preview)} lastEvent={events.filter((e) => e.start <= now.getTime()).slice(-1)[0] ?? null} />
      <DayRibbon child={child} events={events} now={now} />
      <View style={{ flexDirection: 'row', gap: spacing.xs }} testID="cocoon-infos">
        {infos.map((v) => <InfoCard key={v.key} k={v.key} label={v.label} value={v.value} sub={v.sub} child={child} />)}
      </View>
      <KeepCard item={keep} child={child} />
      <ChildShortcuts child={child} />
      {article ? <ArticleCard article={article} premium={premium} /> : null}
      <View style={{ gap: spacing.xs }}>
        <Button label={tr('coc.allDay')} icon="list" variant="secondary" full onPress={() => router.push('/(tabs)/track')} testID="cocoon-all-day" />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.xs }}>
          <SmallLink icon="smile" label={tr('coc.link.profile', { name: child.first_name })} onPress={() => router.push(`/child/${id}`)} />
          <SmallLink icon="trending-up" label={tr('tool.kid_growth')} onPress={() => router.push(`/child/${id}/growth`)} />
          <SmallLink icon="compass" label={tr('tool.kid_needs')} onPress={() => router.push(`/child/${id}/needs` as never)} testID="home-needs" />
          <SmallLink icon="map-pin" label={tr('out.homeShortcut')} onPress={() => router.push('/outings' as never)} testID="home-nearby" />
        </View>
      </View>
    </View>
  );
}

function SmallLink({ icon, label, onPress, testID }: { icon: IconName; label: string; onPress: () => void; testID?: string }) {
  const t = useTheme();
  return (
    <Tappable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} testID={testID}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44, paddingHorizontal: spacing.sm, borderRadius: radius.pill, opacity: pressed ? 0.7 : 1 })}>
      <Icon name={icon} size={15} color={t.colors.textMuted} />
      <Text variant="caption" weight="bold" muted>{label}</Text>
    </Tappable>
  );
}

function CocoonCard({ child, plan, premium, moment, lastEvent }: { child: Child; plan: SleepPlan | null; premium: boolean; moment: CocoonMoment; lastEvent: RibbonEvent | null }) {
  const t = useTheme();
  const dark = t.isDark;
  const reduce = useReduceMotion();
  const { data: children } = useTrackedChildren();
  const { setSubject } = useActiveSubject();
  const sleepOn = child.enabled_tracking.includes('sleep');
  const openSleep = useOpenSleep(sleepOn ? child.id : null);
  const nowMs = Date.now();
  const age = childAge(child.birth_date);
  const state = sleepOn ? stateSentence(child, plan, nowMs) : lastEvent ? tr('coc.state.last', { what: lastEvent.title.toLowerCase(), time: clockOf(lastEvent.start) }) : tr('coc.state.fresh');
  const lines = plan ? planLines(plan, child.first_name, child.sex) : [];
  const next = lines.find((l) => l.key === 'nap' || l.key === 'bedtime' || l.key === 'wake');
  const { actions, busy, go } = useSleepButtons(child, plan);
  const night = plan?.state === 'asleep_night' || plan?.state === 'night_waking' || new Date().getHours() >= 20 || new Date().getHours() < 6;

  // Glisser pour changer d'enfant
  const x = useRef(new Animated.Value(0)).current;
  const list = children ?? [];
  const idx = list.findIndex((c) => c.id === child.id);
  const switchTo = (dir: 1 | -1) => {
    const target = list[(idx + dir + list.length) % list.length];
    if (!target || target.id === child.id) { Animated.spring(x, { toValue: 0, useNativeDriver: NATIVE_DRIVER }).start(); return; }
    haptic('selection');
    if (reduce) { x.setValue(0); setSubject({ type: 'child', id: target.id }); return; }
    Animated.timing(x, { toValue: -dir * 340, duration: 160, useNativeDriver: NATIVE_DRIVER }).start(() => { x.setValue(dir * 120); setSubject({ type: 'child', id: target.id }); Animated.spring(x, { toValue: 0, tension: 160, friction: 20, useNativeDriver: NATIVE_DRIVER }).start(); });
  };
  const pan = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 14 && Math.abs(g.dx) > Math.abs(g.dy) * 1.6,
    onPanResponderMove: (_, g) => x.setValue(g.dx * 0.6),
    onPanResponderRelease: (_, g) => { if (g.dx < -70) switchRef.current(1); else if (g.dx > 70) switchRef.current(-1); else Animated.spring(x, { toValue: 0, useNativeDriver: NATIVE_DRIVER }).start(); },
    onPanResponderTerminate: () => Animated.spring(x, { toValue: 0, useNativeDriver: NATIVE_DRIVER }).start(),
  })).current;
  const switchRef = useRef(switchTo);
  switchRef.current = switchTo;

  const ink = t.colors.text;
  return (
    <Animated.View {...pan.panHandlers} style={{ transform: [{ translateX: x }], opacity: x.interpolate({ inputRange: [-340, 0, 340], outputRange: [0.2, 1, 0.2] }) }} testID="cocoon-card"
      accessibilityActions={list.length > 1 ? [{ name: 'increment', label: tr('coc.a11y.nextChild') }, { name: 'decrement', label: tr('coc.a11y.prevChild') }] : undefined}
      onAccessibilityAction={(e) => switchTo(e.nativeEvent.actionName === 'increment' ? 1 : -1)}>
      <Glass wash={dark ? DARK_WASH : WASH[moment]} rounded={36}>
        <View pointerEvents="none" style={[StyleSheet.absoluteFill]}><MomentArt moment={moment} dark={dark} /></View>
        <Motes dark={dark || moment === 'night'} />
        <View style={{ alignItems: 'center', paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.md, gap: 4 }}>
          <Pressable accessibilityRole="button" accessibilityLabel={tr('coc.a11y.openProfile', { name: child.first_name })} onPress={() => router.push(`/child/${child.id}`)} style={{ width: 132, height: 132, alignItems: 'center', justifyContent: 'center' }} testID="cocoon-avatar">
            <BreathingHalo size={132} dark={dark} moment={moment} />
            <View style={{ borderRadius: 50, borderWidth: 3, borderColor: dark ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.95)', shadowColor: dark ? '#000' : '#B4507A', shadowOpacity: 0.22, shadowRadius: 14, shadowOffset: { width: 0, height: 6 } }}>
              <ChildAvatar child={child} size={88} />
            </View>
          </Pressable>
          <Text accessibilityRole="header" style={{ fontFamily: fonts.display, fontSize: 32, lineHeight: 38, letterSpacing: -0.8, color: ink, textAlign: 'center' }} testID="cocoon-name">{child.first_name}</Text>
          <Text variant="small" muted center testID="cocoon-age">{age.label}</Text>
          {state ? (
            <View testID="sleep-now" style={{ marginTop: spacing.xs, alignItems: 'center', gap: 2 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: dark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.62)' }}>
                <Icon name={openSleep ? 'moon' : 'sun'} size={15} color={dark ? '#FFE3A0' : '#B26A2E'} />
                <Text weight="bold" center testID="sleep-now-state" accessibilityLiveRegion="polite">{state}</Text>
              </View>
              {sleepOn && next ? (premium
                ? <Text variant="small" center muted testID="sleep-now-next">{tr('coc.estimate', { text: next.text })}</Text>
                : <Text variant="caption" center muted>{tr('coc.premiumNext')}</Text>) : null}
            </View>
          ) : null}
          {sleepOn ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.xs, marginTop: spacing.sm }} testID="sleep-record">
              {actions.map((a, i) => (
                <Tappable key={a.testID} testID={a.testID} accessibilityRole="button" accessibilityLabel={`${a.label}, ${child.first_name}`} disabled={busy} onPress={() => go(a)}
                  style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 48, paddingHorizontal: 18, borderRadius: radius.pill, opacity: busy ? 0.6 : pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.98 : 1 }],
                    backgroundColor: i === 0 ? (dark ? 'rgba(185,162,255,0.42)' : 'rgba(123,102,224,0.92)') : (dark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.72)') })}>
                  <Icon name={a.icon} size={17} color={i === 0 ? '#FFFFFF' : t.colors.text} />
                  <Text weight="bold" color={i === 0 ? '#FFFFFF' : undefined}>{a.label}</Text>
                </Tappable>
              ))}
            </View>
          ) : null}
          {sleepOn ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
              <SmallLink icon="moon" label={tr('coc.sleep.planning')} onPress={() => router.push(`/sleep/${child.id}` as never)} testID="sleep-open" />
              {night ? <SmallLink icon="star" label={tr('coc.sleep.tonight')} onPress={() => router.push({ pathname: '/sleep/tonight', params: { child: child.id } } as never)} testID="sleep-now-tonight" /> : null}
              {openSleep ? <SmallLink icon="eye-off" label={tr('coc.sleep.nightMode')} onPress={() => router.push('/night')} testID="cocoon-night-mode" /> : null}
            </View>
          ) : null}
          {list.length > 1 ? (
            <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              {list.map((c) => <View key={c.id} style={{ width: c.id === child.id ? 16 : 6, height: 6, borderRadius: 3, backgroundColor: c.id === child.id ? (dark ? '#FFFFFF' : t.colors.text) : (dark ? 'rgba(255,255,255,0.35)' : 'rgba(43,36,51,0.22)') }} />)}
            </View>
          ) : null}
        </View>
      </Glass>
    </Animated.View>
  );
}

// ─── La frise ─────────────────────────────────────────────────────────────────────────────────────

const HOUR_W = 64;
const BUBBLE = 32;

function DayRibbon({ child, events, now }: { child: Child; events: RibbonEvent[]; now: Date }) {
  const t = useTheme();
  const dark = t.isDark;
  const [picked, setPicked] = useState<RibbonEvent | null>(null);
  const scroller = useRef<ScrollView>(null);
  const [viewW, setViewW] = useState(0);
  const range = useMemo(() => ribbonRange(events, now), [events, now]);
  const hours = Math.round((range.to - range.from) / 3600_000);
  const width = hours * HOUR_W;
  const xOf = (ms: number) => ((ms - range.from) / 3600_000) * HOUR_W;
  const nowX = xOf(now.getTime());

  // Placement : les sommeils sur la ligne du bas, les autres en bulles sur deux rangées sans chevauchement
  const points = events.filter((e) => e.kind !== 'sleep');
  const lanes: number[] = [];
  const laneEnd = [-Infinity, -Infinity];
  for (const e of points) {
    const x = xOf(e.start);
    const lane = x - laneEnd[0] >= BUBBLE + 4 ? 0 : x - laneEnd[1] >= BUBBLE + 4 ? 1 : (laneEnd[0] <= laneEnd[1] ? 0 : 1);
    laneEnd[lane] = x;
    lanes.push(lane);
  }

  const scrolled = useRef(false);
  useEffect(() => {
    if (!viewW || scrolled.current) return;
    scrolled.current = true;
    const target = Math.max(0, Math.min(width - viewW, nowX - viewW * 0.65));
    requestAnimationFrame(() => scroller.current?.scrollTo({ x: target, animated: false }));
  }, [viewW, width, nowX]);

  const ink = (k: RibbonKind) => (dark ? KIND_INK_DARK[k] : KIND_INK[k]);
  const H = 132;
  const SLEEP_Y = 84;
  return (
    <Glass testID="cocoon-ribbon" rounded={28}>
      <View style={{ paddingTop: spacing.sm, paddingBottom: spacing.xs }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md }}>
          <Text variant="caption" weight="bold" muted style={{ letterSpacing: 1.1 }}>{tr('coc.ribbon.title').toUpperCase()}</Text>
          <Text variant="caption" muted>{tr('coc.ribbon.count', { count: events.length })}</Text>
        </View>
        <ScrollView ref={scroller} horizontal showsHorizontalScrollIndicator={false} onLayout={(e) => setViewW(e.nativeEvent.layout.width)} contentContainerStyle={{ paddingHorizontal: spacing.md }} accessibilityLabel={tr('coc.ribbon.a11y', { name: child.first_name })}>
          <View style={{ width, height: H }}>
            {/* Graduations */}
            {Array.from({ length: hours + 1 }, (_, i) => {
              const h = new Date(range.from + i * 3600_000).getHours();
              return (
                <View key={i} pointerEvents="none" style={{ position: 'absolute', left: i * HOUR_W, top: 8, bottom: 0, alignItems: 'center', width: 1 }}>
                  <View style={{ flex: 1, width: 1, backgroundColor: dark ? 'rgba(255,255,255,0.07)' : 'rgba(43,36,51,0.06)' }} />
                  {i % 2 === 0 ? <Text variant="caption" muted style={{ position: 'absolute', bottom: 0, width: 40, left: -20, textAlign: 'center', fontSize: 11 }}>{tr('coc.ribbon.hour', { h: String(h) })}</Text> : null}
                </View>
              );
            })}
            {/* Ligne du temps */}
            <View pointerEvents="none" style={{ position: 'absolute', left: 0, width, top: SLEEP_Y + 10, height: 6, borderRadius: 3, backgroundColor: dark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.7)' }} />
            {/* Sommeils */}
            {events.filter((e) => e.kind === 'sleep').map((e) => {
              const x0 = xOf(e.start);
              const w = Math.max(10, xOf(e.end ?? e.start) - x0);
              return (
                <Pressable key={e.id} testID={`ribbon-${e.id}`} accessibilityRole="button" accessibilityLabel={`${e.title}, ${e.detail ?? ''}`} onPress={() => { haptic('selection'); setPicked(e); }} hitSlop={{ top: 12, bottom: 12 }}
                  style={{ position: 'absolute', left: x0, top: SLEEP_Y, width: w, height: 26, borderRadius: 13, overflow: 'hidden' }}>
                  <LinearGradient colors={dark ? ['rgba(185,162,255,0.65)', 'rgba(140,120,240,0.55)'] : ['#B9A8FF', '#8E79EA']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
                  {e.ongoing ? <View style={{ position: 'absolute', right: 3, top: 3, bottom: 3, width: 20, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.35)' }} /> : null}
                  {w > 28 ? <View style={{ position: 'absolute', left: 6, top: 4 }}><KindGlyph kind="sleep" color="#FFFFFF" size={17} /></View> : null}
                </Pressable>
              );
            })}
            {/* Autres événements */}
            {points.map((e, i) => {
              const x = xOf(e.start) - BUBBLE / 2;
              const top = lanes[i] === 0 ? 40 : 6;
              return (
                <Pressable key={e.id} testID={`ribbon-${e.id}`} accessibilityRole="button" accessibilityLabel={`${e.title}, ${e.detail ?? ''}`} onPress={() => { haptic('selection'); setPicked(e); }}
                  style={({ pressed }) => ({ position: 'absolute', left: x, top, width: BUBBLE, height: BUBBLE, borderRadius: BUBBLE / 2, alignItems: 'center', justifyContent: 'center', transform: [{ scale: pressed ? 1.12 : 1 }],
                    backgroundColor: dark ? 'rgba(20,16,44,0.82)' : 'rgba(255,255,255,0.92)', borderWidth: 1.5, borderColor: ink(e.kind),
                    shadowColor: ink(e.kind), shadowOpacity: 0.35, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } })}>
                  <KindGlyph kind={e.kind} color={ink(e.kind)} size={17} />
                </Pressable>
              );
            })}
            {/* Heure actuelle */}
            {nowX >= 0 && nowX <= width ? (
              <View pointerEvents="none" style={{ position: 'absolute', left: nowX - 1, top: 0, bottom: 16, width: 2, borderRadius: 1, backgroundColor: dark ? '#FFD27A' : '#E0607E' }} testID="cocoon-now-line">
                <View style={{ position: 'absolute', top: -2, left: -4, width: 10, height: 10, borderRadius: 5, backgroundColor: dark ? '#FFD27A' : '#E0607E', borderWidth: 2, borderColor: dark ? '#1E1838' : '#FFFFFF' }} />
              </View>
            ) : null}
          </View>
        </ScrollView>
        {!events.length ? <Text variant="small" muted center style={{ paddingHorizontal: spacing.md, marginTop: 2 }}>{tr('coc.ribbon.empty')}</Text> : null}
      </View>
      <EventSheet child={child} event={picked} onClose={() => setPicked(null)} />
    </Glass>
  );
}

function EventSheet({ child, event, onClose }: { child: Child; event: RibbonEvent | null; onClose: () => void }) {
  const toast = useToast();
  const inv = useInvalidate();
  const [busy, setBusy] = useState(false);
  const e = event;
  const editable = !!(e?.table && e.rowId) && !e?.ongoing;
  async function remove() {
    if (!e?.table || !e.rowId) return;
    if (!(await confirm(tr('coc.event.deleteTitle'), tr('coc.event.deleteBody'), tr('coc.event.delete')))) return;
    setBusy(true);
    try {
      await backend.remove(LOG_TABLE[e.table], [eq('id', e.rowId)]);
      inv(LOG_TABLE[e.table]);
      toast(tr('coc.event.deleted'), 'success');
      onClose();
    } catch (err) { toast(friendlyError(err), 'error'); } finally { setBusy(false); }
  }
  const edit = () => { if (!e?.table || !e.rowId) return; onClose(); router.push({ pathname: '/track/[kind]', params: { kind: e.table, id: e.rowId, child: child.id } }); };
  return (
    <Sheet visible={!!e} onClose={onClose} title={e?.title ?? ''}>
      {e ? (
        <View style={{ gap: spacing.sm }} testID="cocoon-event">
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <View style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.7)', borderWidth: 1.5, borderColor: KIND_INK[e.kind] }}><KindGlyph kind={e.kind} color={KIND_INK[e.kind]} size={22} /></View>
            <View style={{ flex: 1 }}>
              <Text weight="bold">{e.detail ?? clockOf(e.start)}</Text>
              <Text variant="caption" muted>{tr('coc.event.for', { name: child.first_name })}</Text>
            </View>
          </View>
          {editable && e.kind !== 'wake' ? (
            <>
              <Button label={tr('coc.event.edit')} icon="edit-3" onPress={edit} testID="cocoon-event-edit" />
              <Button label={tr('coc.event.delete')} icon="trash-2" variant="ghost" onPress={remove} loading={busy} testID="cocoon-event-delete" />
            </>
          ) : null}
          {e.kind === 'wake' && editable ? <Button label={tr('coc.event.editSleep')} icon="edit-3" onPress={edit} testID="cocoon-event-edit" /> : null}
          {e.ongoing ? <Button label={tr('coc.sleep.planning')} icon="moon" onPress={() => { onClose(); router.push(`/sleep/${child.id}` as never); }} /> : null}
          {e.kind === 'appointment' ? <Button label={tr('coc.event.appointments')} icon="calendar" onPress={() => { onClose(); router.push('/appointments'); }} /> : null}
          {e.kind === 'medication' && !e.table ? <Button label={tr('coc.event.treatments')} icon="clipboard" onPress={() => { onClose(); router.push(`/child/${child.id}/needs?tab=treatments` as never); }} /> : null}
        </View>
      ) : null}
    </Sheet>
  );
}

// ─── Trois informations ───────────────────────────────────────────────────────────────────────────

const INFO_ICON: Record<InfoKey, RibbonKind> = { feed: 'bottle', bottle: 'bottle', diaper: 'diaper', meal: 'meal', sleep: 'sleep', next: 'appointment' };

function InfoCard({ k, label, value, sub, child }: { k: InfoKey; label: string; value: string; sub?: string; child: Child }) {
  const t = useTheme();
  const kind = INFO_ICON[k];
  const ink = t.isDark ? KIND_INK_DARK[kind] : KIND_INK[kind];
  const open = () => {
    const id = child.id;
    if (k === 'feed') router.push(child.enabled_tracking.includes('bottle') ? (`/bottle/${id}` as never) : { pathname: '/track/[kind]', params: { kind: 'breastfeed', child: id } });
    else if (k === 'bottle') router.push(`/bottle/${id}` as never);
    else if (k === 'sleep') router.push(`/sleep/${id}` as never);
    else if (k === 'next') router.push('/appointments');
    else router.push({ pathname: '/track/[kind]', params: { kind: k, child: id } });
  };
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${label} : ${value}${sub ? `, ${sub}` : ''}`} onPress={() => { haptic('selection'); open(); }} style={({ pressed }) => ({ flex: 1, transform: [{ scale: pressed ? 0.97 : 1 }] })} testID={`cocoon-info-${k}`}>
      <Glass rounded={24} style={{ flex: 1 }}>
        <View style={{ padding: spacing.sm, gap: 4, minHeight: 112 }}>
          <View style={{ width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: t.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.8)' }}>
            <KindGlyph kind={kind} color={ink} size={17} />
          </View>
          <Text variant="caption" muted numberOfLines={2}>{label}</Text>
          <Text style={{ fontFamily: fonts.display, fontSize: 19, lineHeight: 23, color: t.colors.text }} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
          {sub ? <Text variant="caption" muted numberOfLines={2}>{sub}</Text> : null}
        </View>
      </Glass>
    </Pressable>
  );
}

// ─── À retenir aujourd'hui ────────────────────────────────────────────────────────────────────────

const KEEP_ICON: Record<KeepItem['kind'], IconName> = { bottle: 'bell', appointment: 'calendar', nap: 'moon', treatment: 'clipboard', medication: 'check-circle', tip: 'feather', none: 'sun' };

function KeepCard({ item, child }: { item: KeepItem; child: Child }) {
  const t = useTheme();
  const go = () => {
    const id = child.id;
    switch (item.kind) {
      case 'bottle': router.push(`/bottle/${id}` as never); break;
      case 'appointment': router.push('/appointments'); break;
      case 'nap': router.push(`/sleep/${id}` as never); break;
      case 'treatment': case 'medication': router.push(`/child/${id}/needs?tab=treatments` as never); break;
      default: router.push('/today' as never);
    }
  };
  return (
    <View>
    <Pressable accessibilityRole="button" accessibilityLabel={`${tr('coc.keep.title')} : ${item.title}${item.detail ? `. ${item.detail}` : ''}${item.then ? `. ${item.then}` : ''}`} onPress={go} style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.99 : 1 }] })} testID="cocoon-keep">
      <Glass rounded={28} wash={t.isDark ? undefined : ['rgba(255,236,214,0.55)', 'rgba(255,226,236,0.35)', 'rgba(232,222,255,0.45)']}>
        <View style={{ flexDirection: 'row', gap: spacing.sm, padding: spacing.md, alignItems: 'flex-start' }}>
          <LinearGradient colors={NACRE} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={KEEP_ICON[item.kind]} size={19} color="#FFFFFF" />
          </LinearGradient>
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="caption" weight="bold" muted style={{ letterSpacing: 1.1 }}>{tr('coc.keep.title').toUpperCase()}</Text>
            <Text weight="bold">{item.title}</Text>
            {item.detail ? <Text variant="small" muted>{item.detail}</Text> : null}
            {item.source ? <Text variant="caption" muted>{tr('coc.keep.source', { source: item.source })}</Text> : null}
            {item.then ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }} testID="cocoon-keep-then"><Icon name="calendar" size={13} color={t.colors.textMuted} /><Text variant="caption" muted style={{ flex: 1 }}>{item.then}</Text></View> : null}
          </View>
          <Icon name="chevron-right" size={18} color={t.colors.textMuted} />
        </View>
      </Glass>
    </Pressable>
      <Tappable accessibilityRole="button" accessibilityLabel={tr('coc.keep.digest')} onPress={() => router.push('/today' as never)} testID="home-today" style={{ alignSelf: 'flex-end', minHeight: 40, justifyContent: 'center', paddingHorizontal: spacing.sm }}>
        <Text variant="caption" weight="bold" color={t.colors.primary}>{tr('coc.keep.digest')}</Text>
      </Tappable>
    </View>
  );
}

// ─── Article du jour ──────────────────────────────────────────────────────────────────────────────

type ArtTheme = 'sleep' | 'food' | 'health' | 'growth';
function artTheme(a: Article): ArtTheme {
  const s = `${a.title} ${a.tags.join(' ')}`.toLowerCase();
  if (/sommeil|sieste|nuit|sleep|dort/.test(s)) return 'sleep';
  if (/repas|diversif|biberon|allait|lait|dent|aliment|food|meal|feed/.test(s)) return 'food';
  if (/fièvre|fievre|santé|sante|régurg|regurg|constip|vaccin|health|malad/.test(s)) return 'health';
  return 'growth';
}
const ART: Record<ArtTheme, { c: [string, string, string]; glyph: TrackKey }> = {
  sleep: { c: ['#C9B8FF', '#F5C7DA', '#FFE4C8'], glyph: 'sleep' },
  food: { c: ['#FFD0B0', '#FFE9C2', '#CDEBD3'], glyph: 'meal' },
  health: { c: ['#CFE3FF', '#E6DAFF', '#FFE0E8'], glyph: 'observation' },
  growth: { c: ['#FFD6C4', '#DCD2FF', '#D3ECF0'], glyph: 'growth' },
};

/** Illustration propre à Toi & Moi (formes douces + pictogramme), jamais une image générée. */
function ArticleArt({ theme }: { theme: ArtTheme }) {
  const id = React.useId().replace(/:/g, '');
  const a = ART[theme];
  return (
    <View style={{ width: 92, alignSelf: 'stretch', minHeight: 104, borderRadius: 22, overflow: 'hidden' }} accessibilityElementsHidden importantForAccessibility="no">
      <Svg width="100%" height="100%" viewBox="0 0 92 110" preserveAspectRatio="xMidYMid slice">
        <Defs>
          <SvgLinear id={`g${id}`} x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor={a.c[0]} /><Stop offset="0.55" stopColor={a.c[1]} /><Stop offset="1" stopColor={a.c[2]} /></SvgLinear>
          <RadialGradient id={`r${id}`} cx="50%" cy="50%" r="50%"><Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.85" /><Stop offset="1" stopColor="#FFFFFF" stopOpacity="0" /></RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="92" height="110" fill={`url(#g${id})`} />
        <Circle cx="70" cy="22" r="34" fill={`url(#r${id})`} />
        <Path d="M0 82 C 22 70, 44 92, 92 76 L 92 110 L 0 110 Z" fill="#FFFFFF" opacity="0.35" />
        <Path d="M0 94 C 30 84, 56 104, 92 90 L 92 110 L 0 110 Z" fill="#FFFFFF" opacity="0.30" />
        <Circle cx="46" cy="52" r="22" fill="#FFFFFF" opacity="0.7" />
      </Svg>
      <View style={{ position: 'absolute', left: 0, right: 0, top: 41, alignItems: 'center' }}><TrackIcon k={a.glyph} color="#6A52D6" size={22} /></View>
    </View>
  );
}

/** Temps de lecture estimé (environ 200 mots par minute), au moins 1 minute. */
export const readingMinutes = (body: string) => Math.max(1, Math.round(body.replace(/[#*_>`-]/g, ' ').split(/\s+/).filter(Boolean).length / 200));

/** Carte éditoriale : illustration, titre, temps de lecture, bouton « Lire » (accueil de chaque profil). */
export function ArticleCard({ article, premium }: { article: Article; premium: boolean }) {
  const t = useTheme();
  const open = () => router.push(`/article/${article.slug}`);
  return (
    <Glass rounded={28} testID="cocoon-article">
      <Pressable accessibilityRole="button" accessibilityLabel={tr('home.articleA11y', { title: article.title })} onPress={open} style={{ flexDirection: 'row', gap: spacing.sm, padding: spacing.sm }}>
        <ArticleArt theme={artTheme(article)} />
        <View style={{ flex: 1, gap: 4, paddingVertical: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text variant="caption" weight="bold" muted style={{ letterSpacing: 1.1, flex: 1 }}>{tr('coc.article.title').toUpperCase()}</Text>
            {isLocked(article, premium) ? <Icon name="lock" size={13} color={t.colors.gold} /> : null}
          </View>
          <Text weight="bold" numberOfLines={3}>{article.title}</Text>
          <Text variant="caption" muted testID="article-reading">{tr('home.readingTime', { n: readingMinutes(article.body_md ?? '') })}</Text>
          <Text variant="small" muted numberOfLines={2} intentionalTruncation>{article.summary}</Text>
          <View style={{ flexDirection: 'row', marginTop: 'auto' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 36, paddingHorizontal: 14, borderRadius: radius.pill, backgroundColor: t.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.85)' }}>
              <Text variant="small" weight="bold">{tr('coc.article.read')}</Text>
              <Icon name="arrow-right" size={14} color={t.colors.text} />
            </View>
          </View>
        </View>
      </Pressable>
    </Glass>
  );
}

// ─── « + Ajouter » ────────────────────────────────────────────────────────────────────────────────

const ADD_GLYPH: Record<AddAction, RibbonKind> = { bottle: 'bottle', breastfeed: 'breastfeed', meal: 'meal', diaper: 'diaper', sleep: 'sleep', medication: 'medication', symptom: 'symptom', note: 'note' };

/** Bouton flottant et feuille d'ajout (favoris personnalisables). Rendu par l'accueil, au-dessus de la barre. */
export function CocoonAdd({ child, journey }: { child: Child; journey: Journey }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  // Petit écran : bouton rond (icône seule) pour ne pas masquer le contenu
  const compact = useWindowDimensions().width < 380;
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const chosen = useUiStore((s) => s.cocoonFavorites);
  const setChosen = useUiStore((s) => s.setCocoonFavorites);
  const age = childAge(child.birth_date);
  const months = journey === 'baby' ? Math.min(age.months, 23) : age.months;
  const profile = childTrackProfile(age.months, { journey, mealsEnabled: child.enabled_tracking.includes('meal') });
  const available = addActions(child.enabled_tracking, months);
  const fav = favoriteActions(profile, available, chosen);
  const others = available.filter((k) => !fav.includes(k));
  const { plan } = useSleepPlan(child.enabled_tracking.includes('sleep') ? child : null);
  const sleep = useSleepButtons(child, plan);
  const sleepAction = sleep.actions[sleep.actions.length - 1] ?? null;

  const label = (k: AddAction) => (k === 'sleep' && sleepAction ? sleepAction.label : tr(`coc.add.${k}` as TKey));
  const run = (k: AddAction) => {
    const id = child.id;
    if (editing) {
      const cur = fav.slice();
      if (cur.includes(k)) { if (cur.length <= 1) return; setChosen(cur.filter((x) => x !== k)); }
      else if (cur.length >= 4) toast(tr('coc.add.max'), 'info');
      else setChosen([...cur, k]);
      haptic('selection');
      return;
    }
    setOpen(false);
    haptic('light');
    switch (k) {
      case 'sleep': if (sleepAction) sleep.go(sleepAction); break;
      case 'medication': router.push(`/child/${id}/needs?tab=treatments` as never); break;
      case 'symptom': router.push({ pathname: '/track/[kind]', params: { kind: 'observation', child: id, obs: 'symptom' } }); break;
      case 'note': router.push({ pathname: '/track/[kind]', params: { kind: 'observation', child: id, obs: 'note' } }); break;
      default: router.push({ pathname: '/track/[kind]', params: { kind: k, child: id } });
    }
  };
  const tile = (k: AddAction, big: boolean) => {
    const ink = t.isDark ? KIND_INK_DARK[ADD_GLYPH[k]] : KIND_INK[ADD_GLYPH[k]];
    const isFav = fav.includes(k);
    return (
      <Tappable key={k} testID={`cocoon-add-${k}`} accessibilityRole="button" accessibilityLabel={editing ? tr(isFav ? 'coc.add.unfav' : 'coc.add.fav', { label: label(k) }) : label(k)}
        accessibilityState={editing ? { selected: isFav } : undefined} onPress={() => run(k)}
        style={({ pressed }) => ({ flexBasis: '47%', flexGrow: 1, minHeight: big ? 92 : 72, borderRadius: 22, padding: spacing.sm, gap: 6, alignItems: 'center', justifyContent: 'center',
          backgroundColor: t.isDark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.78)', borderWidth: 1, borderColor: t.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.95)', transform: [{ scale: pressed ? 0.97 : 1 }] })}>
        <View style={{ width: big ? 44 : 36, height: big ? 44 : 36, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: t.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.9)', borderWidth: 1.5, borderColor: ink }}>
          <KindGlyph kind={ADD_GLYPH[k]} color={ink} size={big ? 22 : 18} />
        </View>
        <Text variant={big ? 'body' : 'small'} weight="bold" center numberOfLines={2}>{label(k)}</Text>
        {editing ? <View style={{ position: 'absolute', top: 8, right: 8 }}><Icon name="star" size={16} color={isFav ? t.colors.gold : t.colors.textMuted} /></View> : null}
      </Tappable>
    );
  };
  return (
    <>
      <View pointerEvents="box-none" style={{ position: 'absolute', right: spacing.lg, bottom: Math.max(insets.bottom, 10) + DOCK_HEIGHT + 6 }}>
        <Pressable testID="cocoon-add" accessibilityRole="button" accessibilityLabel={tr('coc.add.a11y', { name: child.first_name })} onPress={() => { haptic('light'); setEditing(false); setOpen(true); }}
          style={({ pressed }) => ({ borderRadius: radius.pill, transform: [{ scale: pressed ? 0.96 : 1 }], shadowColor: '#B4507A', shadowOpacity: 0.35, shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, elevation: 8 })}>
          <LinearGradient colors={NACRE} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 56, minWidth: 56, paddingHorizontal: compact ? 0 : 22, borderRadius: radius.pill, borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)' }}>
            <Icon name="plus" size={compact ? 26 : 22} color="#FFFFFF" />
            {compact ? null : <Text weight="bold" color="#FFFFFF">{tr('coc.add.button')}</Text>}
          </LinearGradient>
        </Pressable>
      </View>
      <Sheet visible={open} onClose={() => setOpen(false)} title={tr('coc.add.title', { name: child.first_name })}>
        <View style={{ gap: spacing.sm }} testID="cocoon-add-sheet">
          <Text variant="caption" weight="bold" muted style={{ letterSpacing: 1.1 }}>{tr(editing ? 'coc.add.editHint' : 'coc.add.favorites').toUpperCase()}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>{fav.map((k) => tile(k, true))}</View>
          {others.length ? (
            <>
              <Text variant="caption" weight="bold" muted style={{ letterSpacing: 1.1, marginTop: spacing.xs }}>{tr('coc.add.others').toUpperCase()}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>{others.map((k) => tile(k, false))}</View>
            </>
          ) : null}
          <Button label={tr(editing ? 'coc.add.done' : 'coc.add.customize')} icon={editing ? 'check' : 'star'} variant="ghost" onPress={() => setEditing(!editing)} testID="cocoon-add-customize" />
        </View>
      </Sheet>
    </>
  );
}
