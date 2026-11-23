/** Cartes de l'accueil personnalisé. */
import { ProgressBar } from '@/components/Motion';
import { whoopEdge } from '@/components/stage/WhoopSheen';
import { glassEdge } from '@/components/glass/GlassRim';
import React from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { FetusArt } from '@/components/FetusArt';
import { ClockLegend, DayClock, WeeksRing, type ClockEvent } from '@/components/DayClock';
import { Card, haptic, Icon, type IconName, Row, Text } from '@/components/ui';
import { ToolGlyph } from '@/components/ToolGlyph';
import type { ToolTheme } from '@/lib/domain/toolCatalog';
import { useAppointments, useExpectedBabies, useLogs, useOpenSleep, usePeriods, useReminders } from '@/lib/data/hooks';
import { estimateCycle } from '@/lib/domain/cycle';
import { countdownLabel, pregnancyProgress } from '@/lib/domain/pregnancy';
import { isEstimatedDue } from '@/lib/journeys/model';
import { appointmentRelevant, reminderRelevant } from '@/lib/journeys/relevance';
import { useRelevanceCtx } from '@/lib/data/hooks-scope';
import { formatLength, formatWeight, weekInfo } from '@/lib/domain/fetalWeeks';
import { childAge } from '@/lib/domain/child';
import { formatDuration, timeAgo } from '@/lib/domain/dates';
import { summarizeDay, suggestedNextSide } from '@/lib/domain/daily';
import { nextOccurrence } from '@/lib/domain/reminders';
import type { Appointment, Bottle, Breastfeed, Child, Diaper, Pregnancy, Sleep } from '@/lib/types';
import { useTheme } from '@/theme/ThemeProvider';
import { alpha, fonts, radius, spacing } from '@/theme/tokens';
import { LinearGradient } from 'expo-linear-gradient';
import { formatDate, localeTag, t as tr } from '@/i18n';
import { HomeCycleCard } from '@/features/cycle/HomeCycleCard';
import { Tappable } from '@/components/Tappable';
import { useBottleTimer } from '@/lib/data/hooks-bottle';
import { formatClock } from '@/lib/domain/bottleTimer';

const ORB_HUES = ['rose', 'lavande', 'or'] as const;

export function PregnancyHero({ pregnancy }: { pregnancy: Pregnancy }) {
  const t = useTheme();
  const p = pregnancyProgress(pregnancy.due_date);
  const info = weekInfo(p.weeksSA);
  const { data: babies } = useExpectedBabies(pregnancy.id);
  const n = Math.max(1, babies?.length ?? 1);
  const orbSize = n === 1 ? 168 : n === 2 ? 120 : 92;
  const pct = Math.max(2, Math.min(100, Math.round((p.weeksSA / 41) * 100)));
  const tile = { flex: 1, borderRadius: radius.lg, padding: spacing.md, backgroundColor: t.colors.surface, ...glassEdge(t), gap: 2 } as const;
  return (
    <View style={{ gap: spacing.xs }}>
      <Tappable
        accessibilityRole="button"
        accessibilityLabel={tr('u5.home.preg_a11y', { label: p.label, countdown: countdownLabel(p.daysToDue) })}
        onPress={() => { haptic('selection'); router.push('/pregnancy'); }}
        pressScale={0.99}
      >
        <View style={{ borderRadius: radius.xl, overflow: 'hidden', backgroundColor: t.colors.surface, ...glassEdge(t), padding: spacing.md, minHeight: 236 }}>
          <LinearGradient colors={[alpha(t.tokens.decor.c, 0), alpha(t.tokens.decor.c, t.isDark ? 0.16 : 0.24)]} start={{ x: 0.2, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
          <Text variant="caption" weight="bold" muted style={{ letterSpacing: 1.2 }}>{n > 1 ? tr('u5.home.preg_many', { n }) : tr('u5.home.preg')}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginTop: spacing.md }}>
            <Text style={{ fontFamily: fonts.display, fontSize: 92, lineHeight: 90, letterSpacing: -5 }}>{p.weeksSA}</Text>
            <Text variant="heading" color={t.colors.primary} style={{ marginBottom: 12, marginLeft: 4 }}>{tr('u5.home.wa')}{p.extraDays ? tr('u5.home.wa_extra', { n: p.extraDays }) : ''}</Text>
          </View>
          <Text variant="small" muted style={{ maxWidth: '52%' }}>{tr('u5.home.trimester', { trimester: p.trimester, weeks: p.weeksSG })}</Text>
          <View style={{ position: 'absolute', right: -14, top: 34, flexDirection: 'row' }} pointerEvents="none">
            {Array.from({ length: n }, (_, i) => (
              <View key={i} style={{ marginLeft: i ? -orbSize * 0.35 : 0 }}><FetusArt week={p.weeksSA} growth={info.growth} size={orbSize} hue={ORB_HUES[i % 3]} interactive={false} accessibilityLabel={babies?.[i]?.nickname ? tr('u5.home.art_named', { name: babies[i].nickname as string }) : tr('u5.home.art_baby')} /></View>
            ))}
          </View>
          <View style={{ marginTop: 'auto', paddingTop: spacing.md }}>
            <Text variant="caption" muted style={{ alignSelf: 'flex-end', marginBottom: 4 }}>{pct} %</Text>
            <ProgressBar value={pct / 100} color={t.tokens.decor.b} gradient={t.tokens.decor.ring} track={t.material.lines.separator} accessibilityLabel={tr('u5.home.progress_a11y', { pct })} />
          </View>
        </View>
      </Tappable>
      <View style={{ flexDirection: 'row', gap: spacing.xs }}>
        <View style={tile} accessible accessibilityLabel={tr('u5.home.due_a11y', { date: formatDate(pregnancy.due_date), countdown: countdownLabel(p.daysToDue) })}>
          <Text variant="caption" weight="bold" muted style={{ letterSpacing: 1.2 }}>{tr('u5.home.due')}</Text>
          <Text style={{ fontFamily: fonts.display, fontSize: 30, lineHeight: 36, letterSpacing: -1 }}>{p.daysToDue > 0 ? tr('u5.home.d_minus', { n: p.daysToDue }) : tr('u5.home.soon')}</Text>
          <Text variant="small" muted>{formatDate(pregnancy.due_date)}</Text>
          {isEstimatedDue(pregnancy) ? <Text variant="caption" weight="bold" color={t.colors.primary} testID="due-estimated">{tr('pj.due.estimated')}</Text> : null}
        </View>
        <View style={tile} accessible accessibilityLabel={tr('u5.home.size_a11y', { length: formatLength(info.lengthCm), compare: info.compare })}>
          <Text variant="caption" weight="bold" muted style={{ letterSpacing: 1.2 }}>{tr('u5.home.size')}</Text>
          <Text style={{ fontFamily: fonts.display, fontSize: 30, lineHeight: 36, letterSpacing: -1 }}>{info.lengthCm == null ? tr('u5.home.under5mm') : `${info.lengthCm} cm`}</Text>
          <Text variant="small" muted>{formatWeight(info.weightG)} · {info.compare}</Text>
        </View>
      </View>
      <Text variant="caption" muted center>{tr('u5.home.averages')}</Text>
    </View>
  );
}

export function ChildToday({ child, compact }: { child: Child; compact?: boolean }) {
  const t = useTheme();
  const { data: bottles } = useLogs<Bottle>('bottle', child.id, 2);
  const { data: feeds } = useLogs<Breastfeed>('breastfeed', child.id, 2);
  const { data: diapers } = useLogs<Diaper>('diaper', child.id, 2);
  const { data: sleeps } = useLogs<Sleep>('sleep', child.id, 2);
  const openSleep = useOpenSleep(child.id);
  const s = summarizeDay(new Date(), { bottles, feeds, diapers, sleeps });
  const events: ClockEvent[] = [
    ...(sleeps ?? []).map((x) => ({ kind: 'sleep' as const, start: x.started_at, end: x.ended_at })),
    ...(bottles ?? []).map((x) => ({ kind: 'feed' as const, start: x.at })),
    ...(feeds ?? []).map((x) => ({ kind: 'feed' as const, start: x.started_at })),
    ...(diapers ?? []).map((x) => ({ kind: 'diaper' as const, start: x.at })),
  ];
  const lastDiaper = diapers?.[0];
  const { active: bottleReminder } = useBottleTimer(child.id);
  // Heures (pas de « il y a … ») : l'information principale est le prochain rappel choisi par le parent
  const stats: { label: string; value: string }[] = [
    { label: tr('u5.home.last_meal'), value: s.lastFeedAt ? formatClock(s.lastFeedAt) : '—' },
    bottleReminder && Date.parse(bottleReminder.due_at) > Date.now()
      ? { label: tr('u5.home.next_bottle'), value: formatClock(bottleReminder.due_at) }
      : { label: tr('u5.home.last_change'), value: lastDiaper ? formatClock(lastDiaper.at) : '—' },
    { label: tr('u5.home.sleep_today'), value: formatDuration(s.sleepMinutes) },
  ];

  return (
    <View style={{ backgroundColor: t.colors.surface, borderRadius: radius.xl, ...glassEdge(t), padding: spacing.md, gap: spacing.sm }}>
      <View style={{ alignItems: 'center' }}>
        <DayClock events={events} size={compact ? 220 : 290} label={tr('u5.home.day_of', { name: child.first_name })}>
          {openSleep ? (
            <>
              <Icon name="moon" color={t.colors.lavender} />
              <Text variant="heading" center>{tr('u5.home.asleep')}</Text>
              <Text variant="caption" muted center>{tr('u5.home.since', { time: timeAgo(openSleep.started_at).replace('il y a ', '') })}</Text>
            </>
          ) : (
            <>
              <Text variant="caption" muted center>{childAge(child.birth_date).label}</Text>
              <Text variant="title" center>{child.first_name}</Text>
              <Text variant="caption" muted center>{s.bottleMl ? tr('u5.home.ml_today', { ml: s.bottleMl }) : tr('u5.home.last_24')}</Text>
            </>
          )}
        </DayClock>
      </View>
      <ClockLegend />
      <View style={{ flexDirection: 'row', borderTopWidth: 1, borderTopColor: t.colors.border, paddingTop: spacing.sm }}>
        {stats.map((x, i) => (
          <View key={x.label} style={{ flex: 1, alignItems: 'center', borderLeftWidth: i ? 1 : 0, borderLeftColor: t.colors.border }} accessible accessibilityLabel={`${x.label} : ${x.value}`}>
            <Text variant="heading">{x.value}</Text>
            <Text variant="caption" muted center>{x.label}</Text>
          </View>
        ))}
      </View>
      {openSleep && (
        <Tappable onPress={() => router.push('/night')} accessibilityRole="button" style={{ minHeight: 48, borderRadius: 12, backgroundColor: t.tokens.inverse.fill, ...whoopEdge(t, t.tokens.inverse.fill), alignItems: 'center', justifyContent: 'center' }}>
          <Text weight="medium" color={t.tokens.inverse.text}>{tr('u5.home.open_night')}</Text>
        </Tappable>
      )}
    </View>
  );
}

const QUICK: Record<string, { icon: IconName; label: string; go: (childId?: string) => void }> = {
  cyclecal: { icon: 'grid', get label() { return tr('quick.cyclecal'); }, go: () => router.push('/cycle/calendar') },
  nighthelp: { icon: 'star', get label() { return tr('quick.nighthelp'); }, go: (c) => router.push(c ? `/night/help?child=${c}` : '/night/help') },
  bottle: { icon: 'coffee', get label() { return tr('quick.bottle'); }, go: (c) => router.push({ pathname: '/track/[kind]', params: { kind: 'bottle', child: c ?? '' } }) },
  breastfeed: { icon: 'droplet', get label() { return tr('quick.breastfeed'); }, go: (c) => router.push({ pathname: '/track/[kind]', params: { kind: 'breastfeed', child: c ?? '' } }) },
  diaper: { icon: 'wind', get label() { return tr('quick.diaper'); }, go: (c) => router.push({ pathname: '/track/[kind]', params: { kind: 'diaper', child: c ?? '' } }) },
  sleep: { icon: 'moon', get label() { return tr('quick.sleep'); }, go: (c) => router.push(c ? `/night?child=${c}` : '/night') },
  growth: { icon: 'trending-up', get label() { return tr('pj.q.growth'); }, go: (c) => router.push(c ? `/child/${c}/growth` : '/tools') },
  treatment: { icon: 'clipboard', get label() { return tr('pj.q.treatment'); }, go: (c) => router.push(c ? `/child/${c}/needs?tab=treatments` : '/tools') },
  checkin: { icon: 'edit-3', get label() { return tr('pj.q.checkin'); }, go: () => router.push('/postpartum/checkin') },
  calendar: { icon: 'calendar', get label() { return tr('quick.agenda'); }, go: () => router.push('/calendar') },
  symptom: { icon: 'activity', get label() { return tr('pj.q.symptom'); }, go: () => router.push('/cycle/symptoms') },
  meal: { icon: 'feather', get label() { return tr('quick.meal'); }, go: (c) => router.push({ pathname: '/track/[kind]', params: { kind: 'meal', child: c ?? '' } }) },
  observation: { icon: 'thermometer', get label() { return tr('quick.observation'); }, go: (c) => router.push({ pathname: '/track/[kind]', params: { kind: 'observation', child: c ?? '' } }) },
  question: { icon: 'message-circle', get label() { return tr('quick.question'); }, go: () => router.push('/assistant/chat') },
  mood: { icon: 'heart', get label() { return tr('quick.mood'); }, go: () => router.push('/me/mood') },
  weight: { icon: 'trending-up', get label() { return tr('quick.weight'); }, go: () => router.push('/pregnancy/weight') },
  scan: { icon: 'maximize', get label() { return tr('quick.scan'); }, go: () => router.push('/scanner') },
  period: { icon: 'droplet', get label() { return tr('quick.period'); }, go: () => router.push(useCycleRoute()) },
  test: { icon: 'check-circle', get label() { return tr('quick.test'); }, go: () => router.push('/fertility') },
  pill: { icon: 'shield', get label() { return tr('quick.pill'); }, go: () => router.push('/contraception') },
  mysleep: { icon: 'cloud', get label() { return tr('quick.mysleep'); }, go: () => router.push('/me/sleep') },
  appointment: { icon: 'calendar', get label() { return tr('quick.appointment'); }, go: () => router.push('/appointments') },
  tasks: { icon: 'check-square', get label() { return tr('quick.tasks'); }, go: () => router.push('/family') },
  agenda: { icon: 'calendar', get label() { return tr('quick.agenda'); }, go: () => router.push('/calendar') },
  journal: { icon: 'book-open', get label() { return tr('quick.journal'); }, go: () => router.push('/journal') },
  relay: { icon: 'repeat', get label() { return tr('quick.relay'); }, go: () => router.push('/family') },
  postpartum: { icon: 'sun', get label() { return tr('quick.postpartum'); }, go: () => router.push('/postpartum') },
};
/** Le suivi du cycle s'ouvre dans le parcours choisi (concevoir ou éviter). */
let cycleRoute: '/fertility' | '/contraception' | '/cycle' = '/fertility';
export function setCycleRoute(r: '/fertility' | '/contraception' | '/cycle') { cycleRoute = r; }
function useCycleRoute() { return cycleRoute; }
/** Même langage visuel que « Outils » : chaque raccourci prend la silhouette de sa catégorie. */
const QUICK_THEME: Record<string, ToolTheme> = {
  cyclecal: 'cycle', nighthelp: 'sleep', bottle: 'feeding', breastfeed: 'feeding', meal: 'feeding', diaper: 'diapers', sleep: 'sleep', mysleep: 'sleep', observation: 'health', appointment: 'health',
  growth: 'growth', treatment: 'health', checkin: 'mood', calendar: 'calendar', symptom: 'cycle',
  question: 'resources', mood: 'mood', weight: 'pregnancy', scan: 'scanner', period: 'cycle', test: 'cycle', pill: 'cycle', postpartum: 'cycle',
  tasks: 'tasks', agenda: 'calendar', journal: 'memories', relay: 'relay',
};
export const QUICK_KEYS = Object.keys(QUICK);
export const quickLabel = (k: string) => QUICK[k]?.label ?? k;
export const quickIcon = (k: string): IconName => QUICK[k]?.icon ?? 'circle';

export function QuickActions({ keys, childId, onCustomize }: { keys: string[]; childId?: string; onCustomize?: () => void }) {
  const t = useTheme();
  return (
    <View style={{ gap: 4 }}>
      {/* 4 raccourcis qui se partagent la largeur ; sur un écran très étroit ils passent à la ligne au lieu de couper un libellé */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around', rowGap: 8 }}>
        {keys.filter((k) => QUICK[k]).slice(0, 4).map((k) => (
          <QuickButton key={k} k={k} childId={childId} />
        ))}
      </View>
      {onCustomize ? (
        <Tappable accessibilityRole="button" accessibilityLabel={tr('u5.home.customize_a11y')} onPress={onCustomize} style={{ alignSelf: 'flex-end', flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 36, paddingHorizontal: 6 }}>
          <Icon name="sliders" size={14} color={t.colors.textMuted} />
          <Text variant="caption" muted>{tr('u5.home.customize')}</Text>
        </Tappable>
      ) : null}
    </View>
  );
}

function QuickButton({ k, childId }: { k: string; childId?: string }) {
  const [pressed, setPressed] = React.useState(false);
  const [hovered, setHovered] = React.useState(false);
  const [play, setPlay] = React.useState(0);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={tr('u5.home.add_a11y', { label: QUICK[k].label })}
      onPress={() => { haptic('light'); setPlay((p) => p + 1); QUICK[k].go(childId); }}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onHoverIn={() => { setHovered(true); setPlay((p) => p + 1); }}
      onHoverOut={() => setHovered(false)}
      style={{ alignItems: 'center', gap: 6, flexGrow: 1, flexBasis: 0, minWidth: 66, maxWidth: 120 }}
    >
      <ToolGlyph id={`quick.${k}`} theme={QUICK_THEME[k] ?? 'resources'} icon={QUICK[k].icon} size={58} play={play} pressed={pressed} hovered={hovered} />
      <Text variant="caption" weight="medium" center style={{ alignSelf: 'stretch' }}>{QUICK[k].label}</Text>
    </Pressable>
  );
}

/** Prochain rendez-vous ou rappel du profil affiché. `single` (mode simple) : seulement le plus proche des deux. */
export function UpcomingCard({ single = false }: { single?: boolean } = {}) {
  const t = useTheme();
  const { data: appts } = useAppointments({ upcomingOnly: true });
  const { data: reminders } = useReminders();
  const ctx = useRelevanceCtx();
  // Uniquement ce qui concerne le profil affiché (jamais un rendez-vous de grossesse sur le profil d'un bébé) ;
  // ceux d'aujourd'hui sont déjà dans « Aujourd'hui dans le foyer » en tête de l'accueil (pas de doublon)
  const endOfToday = new Date(); endOfToday.setHours(24, 0, 0, 0);
  const next: Appointment | undefined = (appts ?? []).find((a) => appointmentRelevant(a, ctx) && Date.parse(a.starts_at) >= endOfToday.getTime());
  const nextReminder = (reminders ?? [])
    .filter((r) => r.enabled && reminderRelevant(r, ctx))
    .map((r) => ({ r, at: nextOccurrence(r.schedule) }))
    .filter((x) => x.at)
    .sort((a, b) => a.at!.getTime() - b.at!.getTime())[0];
  const row = (icon: IconName, title: string, when: string, onPress: () => void, testID?: string) => (
    <Tappable accessibilityRole="button" accessibilityLabel={`${title}, ${when}`} onPress={onPress} testID={testID} style={({ pressed }) => ({ flexDirection: 'row', gap: spacing.sm, alignItems: 'center', paddingVertical: spacing.sm, opacity: pressed ? 0.7 : 1 })}>
      <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: t.colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}><Icon name={icon} size={18} /></View>
      <View style={{ flex: 1 }}>
        <Text weight="bold">{title}</Text>
        <Text variant="small" muted>{when}</Text>
      </View>
      <Icon name="chevron-right" size={18} color={t.colors.textMuted} />
    </Tappable>
  );
  return (
    <View>
      {next && (!single || !nextReminder || Date.parse(next.starts_at) <= nextReminder.at!.getTime()) && row('calendar', next.title, new Date(next.starts_at).toLocaleString(localeTag(), { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }), () => router.push('/appointments'))}
      {nextReminder && (!single || !next || nextReminder.at!.getTime() < Date.parse(next.starts_at)) && row('bell', nextReminder.r.title, tr('u5.home.reminder_at', { when: nextReminder.at!.toLocaleString(localeTag(), { weekday: 'long', hour: '2-digit', minute: '2-digit' }) }), () => router.push('/settings/reminders'))}
      {/* Résumé du jour : rendez-vous, sieste estimée, biberon, réponses, nouveautés (sans notification si on ne l'a pas choisie) */}
      {row('sun', tr('u5.home.summary'), new Date().getHours() >= 17 ? tr('u5.home.day_brief') : tr('u5.home.what_matters'), () => router.push('/today' as never), 'home-today')}
    </View>
  );
}

/** Carte principale des parcours cycle : « concevoir », « éviter une grossesse » ou simple suivi. */
/** Carte du cycle de l'accueil (personnalisable) : voir src/features/cycle/HomeCycleCard.tsx. */
export function CycleCard({ mode }: { mode: 'ttc' | 'avoid' | 'cycle' }) {
  return <HomeCycleCard mode={mode} />;
}

// Accueil personnalisable : modules et configurations par situation dans src/features/homeToday/homeLayout.ts (17/11/2026).
