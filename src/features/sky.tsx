/**
 * « Le ciel de la famille » : un arc de ciel où le soleil (ou la lune) avance avec l'heure réelle,
 * et où se posent les moments du jour (repas, siestes, changes, rendez-vous, rappels).
 */
import { hourTick } from '@/i18n/formats';
import React, { useMemo } from 'react';
import { ScrollView, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import Svg, { Circle, Defs, G, Line, Path, RadialGradient, Stop, Text as SvgText } from 'react-native-svg';
import { Icon, type IconName, Text } from '@/components/ui';
import { useAppointments, useLogs, useReminders } from '@/lib/data/hooks';
import { formatTime } from '@/lib/domain/dates';
import { nextOccurrence } from '@/lib/domain/reminders';
import type { Bottle, Breastfeed, Diaper, Meal, Sleep } from '@/lib/types';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, radius, spacing, type SkyPhase } from '@/theme/tokens';
import { Tappable } from '@/components/Tappable';
import { t as tr, formatUnit, getLocale } from '@/i18n';
import { categoryColor, type HomiCategory } from './homiColors';

export interface SkyMoment {
  id: string;
  at: Date;
  icon: IconName;
  label: string;
  detail?: string;
  kind: 'feed' | 'sleep' | 'diaper' | 'meal' | 'appointment' | 'reminder';
  href?: string;
  upcoming?: boolean;
}

/** HOMI : couleurs sémantiques partagées (homiColors) — encre sur le ciel clair, lueur sur le ciel sombre. */
const KIND_CAT: Record<SkyMoment['kind'], HomiCategory> = {
  feed: 'breastfeed', meal: 'meal', sleep: 'sleep', diaper: 'diaper', appointment: 'appointment', reminder: 'reminder',
};
const kindColor = (k: SkyMoment['kind'], dark: boolean) => categoryColor(KIND_CAT[k], dark);

/** Rassemble les moments d'aujourd'hui (passés et à venir) pour l'enfant affiché et le foyer. */
export function useSkyMoments(childId?: string): SkyMoment[] {
  const bottles = useLogs<Bottle>('bottle', childId, 1).data ?? [];
  const feeds = useLogs<Breastfeed>('breastfeed', childId, 1).data ?? [];
  const diapers = useLogs<Diaper>('diaper', childId, 1).data ?? [];
  const sleeps = useLogs<Sleep>('sleep', childId, 1).data ?? [];
  const meals = useLogs<Meal>('meal', childId, 1).data ?? [];
  const { data: appts } = useAppointments({ upcomingOnly: true });
  const { data: reminders } = useReminders();
  return useMemo(() => {
    const today = new Date().toDateString();
    const isToday = (d: Date) => d.toDateString() === today;
    const out: SkyMoment[] = [];
    for (const b of bottles) out.push({ id: `b${b.id}`, at: new Date(b.at), icon: 'coffee', label: tr('u2.sky.bottle'), detail: b.consumed_ml != null ? `${b.consumed_ml} ml` : undefined, kind: 'feed' });
    for (const f of feeds) out.push({ id: `f${f.id}`, at: new Date(f.started_at), icon: 'droplet', label: tr('u2.sky.feed'), detail: f.side === 'left' ? tr('u2.sky.left') : f.side === 'right' ? tr('u2.sky.right') : tr('u2.sky.both'), kind: 'feed' });
    for (const d of diapers) out.push({ id: `d${d.id}`, at: new Date(d.at), icon: 'wind', label: tr('u2.sky.change'), detail: [d.wet ? tr('u2.sky.wet') : null, d.stool ? tr('u2.sky.stool') : null].filter(Boolean).join(' + '), kind: 'diaper' });
    for (const s of sleeps) out.push({ id: `s${s.id}`, at: new Date(s.started_at), icon: 'moon', label: s.ended_at ? tr('u2.sky.nap') : tr('u2.sky.sleeping'), detail: s.ended_at ? formatUnit(Math.round((new Date(s.ended_at).getTime() - new Date(s.started_at).getTime()) / 60000), 'minute', 0) : tr('u2.sky.ongoing'), kind: 'sleep' });
    for (const m of meals) out.push({ id: `m${m.id}`, at: new Date(m.at), icon: 'feather', label: tr('u2.sky.meal'), detail: m.description ?? undefined, kind: 'meal' });
    for (const a of appts ?? []) {
      const d = new Date(a.starts_at);
      if (isToday(d)) out.push({ id: `a${a.id}`, at: d, icon: 'calendar', label: a.title, kind: 'appointment', href: '/appointments', upcoming: d > new Date() });
    }
    for (const r of reminders ?? []) {
      if (!r.enabled) continue;
      const d = nextOccurrence(r.schedule);
      if (d && isToday(d)) out.push({ id: `r${r.id}`, at: d, icon: 'bell', label: r.title, kind: 'reminder', href: '/settings/reminders', upcoming: true });
    }
    return out.filter((m) => isToday(m.at)).sort((a, b) => a.at.getTime() - b.at.getTime());
  }, [bottles, feeds, diapers, sleeps, meals, appts, reminders]);
}

const skyLabel = (p: SkyPhase) => tr(`u2.sky.phase_${p}` as never);

// L'arc couvre 6 h → 22 h le jour, 20 h → 8 h la nuit
const SPAN: Record<'day' | 'night', [number, number]> = { day: [6, 22], night: [20, 32] };

export function SkyArc({ phase, moments, greeting, subtitle, now = new Date() }: { phase: SkyPhase; moments: SkyMoment[]; greeting: string; subtitle?: string; now?: Date }) {
  const t = useTheme();
  const { width: screen } = useWindowDimensions();
  const w = Math.min(screen, 520) - spacing.lg * 2;
  const h = 190;
  const mode = phase === 'night' ? 'night' : 'day';
  const [start, end] = SPAN[mode];
  const hourOf = (d: Date) => {
    let x = d.getHours() + d.getMinutes() / 60;
    if (mode === 'night' && x < 12) x += 24;
    return x;
  };
  const pos = (hour: number) => {
    const p = Math.max(0, Math.min(1, (hour - start) / (end - start)));
    const a = Math.PI * (1 - p);
    return { x: w / 2 + Math.cos(a) * (w / 2 - 18), y: h - 22 - Math.sin(a) * (h - 46), p };
  };
  const nowPos = pos(hourOf(now));
  const ink = t.colors.text;
  // astre : lune perle la nuit, champagne au crépuscule et à l'aube, champagne doré le jour
  const body = phase === 'night' ? '#F6EFE4' : phase === 'dusk' ? '#E9CFA4' : phase === 'dawn' ? '#F6ECDA' : '#E9CFA4';
  const arcPath = (from: number, to: number) => {
    const steps = 40;
    let d = '';
    for (let i = 0; i <= steps; i++) {
      const q = pos(from + ((to - from) * i) / steps);
      d += `${i ? 'L' : 'M'}${q.x.toFixed(1)} ${q.y.toFixed(1)} `;
    }
    return d;
  };
  const visible = moments.filter((m) => { const x = hourOf(m.at); return x >= start && x <= end; });

  return (
    <View accessible accessibilityRole="header" accessibilityLabel={`${greeting}. ${skyLabel(phase)}. ${tr('u2.sky.moments_today', { count: moments.length })}`}>
      <Svg width={w} height={h}>
        <Defs>
          <RadialGradient id="sunglow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={body} stopOpacity={0.55} />
            <Stop offset="100%" stopColor={body} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Path d={arcPath(start, end)} stroke={ink} strokeOpacity={0.16} strokeWidth={1.2} strokeDasharray="2 6" fill="none" />
        <Path d={arcPath(start, Math.min(end, hourOf(now)))} stroke={t.colors.gold} strokeWidth={2} fill="none" strokeLinecap="round" />
        <Line x1={0} x2={w} y1={h - 22} y2={h - 22} stroke={ink} strokeOpacity={0.18} />
        {(mode === 'day' ? [6, 12, 18, 22] : [20, 24, 28, 32]).map((hh) => {
          const q = pos(hh);
          return <SvgText key={hh} x={q.x} y={h - 6} fontSize={10.5} fill={ink} fillOpacity={0.45} textAnchor="middle" fontFamily={fonts.body}>{hourTick(hh % 24)}</SvgText>;
        })}
        {visible.map((m) => {
          const q = pos(hourOf(m.at));
          return (
            <G key={m.id}>
              <Circle cx={q.x} cy={q.y} r={m.upcoming ? 6 : 5} fill={m.upcoming ? 'none' : kindColor(m.kind, t.isDark)} stroke={kindColor(m.kind, t.isDark)} strokeWidth={m.upcoming ? 1.6 : 2} strokeOpacity={0.9} />
            </G>
          );
        })}
        <Circle cx={nowPos.x} cy={nowPos.y} r={30} fill="url(#sunglow)" />
        {phase === 'night' ? (
          <G>
            <Circle cx={nowPos.x} cy={nowPos.y} r={11} fill={body} />
            <Circle cx={nowPos.x + 5} cy={nowPos.y - 4} r={10} fill={t.colors.background} />
          </G>
        ) : (
          <Circle cx={nowPos.x} cy={nowPos.y} r={11} fill={body} />
        )}
      </Svg>
      <View style={{ position: 'absolute', left: 0, right: 0, top: 70, alignItems: 'center' }} pointerEvents="none">
        <Text variant="caption" muted>{skyLabel(phase)} · {formatTime(now)}</Text>
        <Text variant="title" center>{greeting}</Text>
        {subtitle ? <Text variant="small" muted center>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

/** Fil du jour : ce qui s'est passé et ce qui arrive, dans l'ordre. */
export function DayThread({ moments, empty }: { moments: SkyMoment[]; empty: string }) {
  const t = useTheme();
  const now = Date.now();
  if (!moments.length) return <Text variant="small" muted>{empty}</Text>;
  const nowIndex = moments.findIndex((m) => m.at.getTime() > now);
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.xs, paddingRight: spacing.lg, alignItems: 'center' }} accessibilityLabel={tr('u2.sky.day_thread')}>
      {moments.map((m, i) => (
        <React.Fragment key={m.id}>
          {i === nowIndex && (
            <View style={{ alignItems: 'center', paddingHorizontal: 4 }} accessibilityLabel={tr('u2.sky.now_cap')}>
              <View style={{ width: 2, height: 46, backgroundColor: t.colors.gold, borderRadius: 1 }} />
              <Text variant="caption" color={t.colors.gold}>{tr('u2.sky.now')}</Text>
            </View>
          )}
          <Tappable
            accessibilityRole={m.href ? 'button' : 'text'}
            accessibilityLabel={`${formatTime(m.at)}, ${m.label}${m.detail ? `, ${m.detail}` : ''}${m.upcoming ? `, ${tr('u2.sky.upcoming')}` : ''}`}
            onPress={m.href ? () => router.push(m.href as never) : undefined}
            style={{ minWidth: 112, paddingVertical: 10, paddingHorizontal: 12, borderRadius: radius.lg, backgroundColor: m.upcoming ? 'transparent' : t.colors.surface, borderWidth: 1, borderStyle: m.upcoming ? 'dashed' : 'solid', borderColor: m.upcoming ? t.colors.textMuted : t.colors.border, gap: 2 }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: kindColor(m.kind, t.isDark) }} />
              <Text variant="caption" muted>{formatTime(m.at)}</Text>
            </View>
            <Text variant="small" weight="medium">{m.label}</Text>
            {m.detail ? <Text variant="caption" muted>{m.detail}</Text> : null}
          </Tappable>
        </React.Fragment>
      ))}
    </ScrollView>
  );
}

/** `label` = clé de traduction. */
const UNIVERSE: { icon: IconName; label: string; href: string }[] = [
  { icon: 'moon', label: 'u2.sky.u_night_mode', href: '/night' },
  { icon: 'message-circle', label: 'u2.sky.u_assistant', href: '/assistant/chat' },
  { icon: 'calendar', label: 'u2.sky.u_appointments', href: '/appointments' },
  { icon: 'check-square', label: 'u2.sky.u_lists', href: '/lists' },
  { icon: 'folder', label: 'u2.sky.u_documents', href: '/documents' },
  { icon: 'star', label: 'u2.sky.u_names', href: '/names' },
  { icon: 'maximize', label: 'u2.sky.u_scanner', href: '/scanner' },
  { icon: 'feather', label: 'u2.sky.u_meals', href: '/(tabs)/track' },
  { icon: 'circle', label: 'u2.sky.u_cycle', href: '/cycle' },
  { icon: 'heart', label: 'u2.sky.u_mood', href: '/me/mood' },
  { icon: 'trending-up', label: 'u2.sky.u_growth', href: '/(tabs)/track' },
  { icon: 'users', label: 'u2.sky.u_family', href: '/settings/family' },
  { icon: 'book-open', label: 'u2.sky.u_library', href: '/library' },
  { icon: 'message-square', label: 'u2.sky.u_community', href: '/(tabs)/community' },
  { icon: 'bell', label: 'u2.sky.u_reminders', href: '/settings/reminders' },
  { icon: 'life-buoy', label: 'u2.sky.u_emergency', href: '/emergency' },
];

export function UniverseGrid() {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: spacing.md }}>
      {UNIVERSE.map((u) => (
        <Tappable key={u.label} accessibilityRole="button" accessibilityLabel={tr(u.label as never)} onPress={() => router.push(u.href as never)} style={{ width: '25%', alignItems: 'center', gap: 6 }}>
          {({ pressed }) => (
            <>
              <View style={{ width: 54, height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: pressed ? t.colors.surfaceAlt : t.colors.surface, borderWidth: 1, borderColor: t.colors.border }}>
                <Icon name={u.icon} size={21} color={u.href === '/emergency' ? t.colors.heart : t.colors.text} />
              </View>
              <Text variant="caption" center>{tr(u.label as never)}</Text>
            </>
          )}
        </Tappable>
      ))}
    </View>
  );
}
