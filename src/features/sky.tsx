/**
 * « Le ciel de la famille » : un arc de ciel où le soleil (ou la lune) avance avec l'heure réelle,
 * et où se posent les moments du jour (repas, siestes, changes, rendez-vous, rappels).
 */
import React, { useMemo } from 'react';
import { Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import Svg, { Circle, Defs, G, Line, Path, RadialGradient, Stop, Text as SvgText } from 'react-native-svg';
import { Icon, type IconName, Text } from '@/components/ui';
import { useAppointments, useLogs, useReminders } from '@/lib/data/hooks';
import { formatTime } from '@/lib/domain/dates';
import { nextOccurrence } from '@/lib/domain/reminders';
import type { Bottle, Breastfeed, Diaper, Meal, Sleep } from '@/lib/types';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, radius, SKY_LABEL, spacing, type SkyPhase } from '@/theme/tokens';

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

const KIND_COLOR: Record<SkyMoment['kind'], string> = {
  feed: '#FF5C8A', meal: '#FF7A6B', sleep: '#8E6CF0', diaper: '#F2A93B', appointment: '#F0477D', reminder: '#7A5CE0',
};

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
    for (const b of bottles) out.push({ id: `b${b.id}`, at: new Date(b.at), icon: 'coffee', label: 'Biberon', detail: b.consumed_ml != null ? `${b.consumed_ml} ml` : undefined, kind: 'feed' });
    for (const f of feeds) out.push({ id: `f${f.id}`, at: new Date(f.started_at), icon: 'droplet', label: 'Tétée', detail: f.side === 'left' ? 'gauche' : f.side === 'right' ? 'droite' : 'les deux', kind: 'feed' });
    for (const d of diapers) out.push({ id: `d${d.id}`, at: new Date(d.at), icon: 'wind', label: 'Change', detail: [d.wet ? 'mouillée' : null, d.stool ? 'selles' : null].filter(Boolean).join(' + '), kind: 'diaper' });
    for (const s of sleeps) out.push({ id: `s${s.id}`, at: new Date(s.started_at), icon: 'moon', label: s.ended_at ? 'Sieste' : 'Dort', detail: s.ended_at ? `${Math.round((new Date(s.ended_at).getTime() - new Date(s.started_at).getTime()) / 60000)} min` : 'en cours', kind: 'sleep' });
    for (const m of meals) out.push({ id: `m${m.id}`, at: new Date(m.at), icon: 'feather', label: 'Repas', detail: m.description ?? undefined, kind: 'meal' });
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
  const body = phase === 'night' ? '#F1E6CC' : phase === 'dusk' ? '#E69A7C' : phase === 'dawn' ? '#F2B49B' : '#E8B25A';
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
    <View accessible accessibilityRole="header" accessibilityLabel={`${greeting}. ${SKY_LABEL[phase]}. ${moments.length} moments aujourd’hui.`}>
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
          return <SvgText key={hh} x={q.x} y={h - 6} fontSize={10.5} fill={ink} fillOpacity={0.45} textAnchor="middle" fontFamily={fonts.body}>{`${hh % 24}h`}</SvgText>;
        })}
        {visible.map((m) => {
          const q = pos(hourOf(m.at));
          return (
            <G key={m.id}>
              <Circle cx={q.x} cy={q.y} r={m.upcoming ? 6 : 5} fill={m.upcoming ? 'none' : KIND_COLOR[m.kind]} stroke={KIND_COLOR[m.kind]} strokeWidth={m.upcoming ? 1.6 : 2} strokeOpacity={0.9} />
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
        <Text variant="caption" muted>{SKY_LABEL[phase]} · {formatTime(now)}</Text>
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
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.xs, paddingRight: spacing.lg, alignItems: 'center' }} accessibilityLabel="Fil du jour">
      {moments.map((m, i) => (
        <React.Fragment key={m.id}>
          {i === nowIndex && (
            <View style={{ alignItems: 'center', paddingHorizontal: 4 }} accessibilityLabel="Maintenant">
              <View style={{ width: 2, height: 46, backgroundColor: t.colors.gold, borderRadius: 1 }} />
              <Text variant="caption" color={t.colors.gold}>maintenant</Text>
            </View>
          )}
          <Pressable
            accessibilityRole={m.href ? 'button' : 'text'}
            accessibilityLabel={`${formatTime(m.at)}, ${m.label}${m.detail ? `, ${m.detail}` : ''}${m.upcoming ? ', à venir' : ''}`}
            onPress={m.href ? () => router.push(m.href as never) : undefined}
            style={{ minWidth: 112, paddingVertical: 10, paddingHorizontal: 12, borderRadius: radius.lg, backgroundColor: m.upcoming ? 'transparent' : t.colors.surface, borderWidth: 1, borderStyle: m.upcoming ? 'dashed' : 'solid', borderColor: m.upcoming ? t.colors.textMuted : t.colors.border, gap: 2 }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: KIND_COLOR[m.kind] }} />
              <Text variant="caption" muted>{formatTime(m.at)}</Text>
            </View>
            <Text variant="small" weight="medium" numberOfLines={1}>{m.label}</Text>
            {m.detail ? <Text variant="caption" muted numberOfLines={1}>{m.detail}</Text> : null}
          </Pressable>
        </React.Fragment>
      ))}
    </ScrollView>
  );
}

const UNIVERSE: { icon: IconName; label: string; href: string }[] = [
  { icon: 'moon', label: 'Mode nuit', href: '/night' },
  { icon: 'message-circle', label: 'Assistant', href: '/assistant/chat' },
  { icon: 'calendar', label: 'Rendez-vous', href: '/appointments' },
  { icon: 'check-square', label: 'Listes', href: '/lists' },
  { icon: 'folder', label: 'Documents', href: '/documents' },
  { icon: 'star', label: 'Prénoms', href: '/names' },
  { icon: 'maximize', label: 'Scanner', href: '/scanner' },
  { icon: 'feather', label: 'Repas', href: '/(tabs)/track' },
  { icon: 'circle', label: 'Cycle', href: '/cycle' },
  { icon: 'heart', label: 'Humeur', href: '/me/mood' },
  { icon: 'trending-up', label: 'Croissance', href: '/(tabs)/track' },
  { icon: 'users', label: 'Famille', href: '/settings/family' },
  { icon: 'book-open', label: 'Bibliothèque', href: '/library' },
  { icon: 'message-square', label: 'Entraide', href: '/(tabs)/community' },
  { icon: 'bell', label: 'Rappels', href: '/settings/reminders' },
  { icon: 'life-buoy', label: 'Urgences', href: '/emergency' },
];

export function UniverseGrid() {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: spacing.md }}>
      {UNIVERSE.map((u) => (
        <Pressable key={u.label} accessibilityRole="button" accessibilityLabel={u.label} onPress={() => router.push(u.href as never)} style={{ width: '25%', alignItems: 'center', gap: 6 }}>
          {({ pressed }) => (
            <>
              <View style={{ width: 54, height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: pressed ? t.colors.surfaceAlt : t.colors.surface, borderWidth: 1, borderColor: t.colors.border }}>
                <Icon name={u.icon} size={21} color={u.label === 'Urgences' ? t.colors.heart : t.colors.text} />
              </View>
              <Text variant="caption" center numberOfLines={1}>{u.label}</Text>
            </>
          )}
        </Pressable>
      ))}
    </View>
  );
}
