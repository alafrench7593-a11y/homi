/** Cartes de l'accueil personnalisé. */
import React from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { FetusArt } from '@/components/FetusArt';
import { StarField } from '@/components/StarField';
import { ClockLegend, DayClock, WeeksRing, type ClockEvent } from '@/components/DayClock';
import { Card, haptic, Icon, type IconName, Row, Text } from '@/components/ui';
import { useAppointments, useExpectedBabies, useLogs, useOpenSleep, useReminders } from '@/lib/data/hooks';
import { countdownLabel, pregnancyProgress } from '@/lib/domain/pregnancy';
import { formatWeight, weekInfo } from '@/lib/domain/fetalWeeks';
import { childAge } from '@/lib/domain/child';
import { formatDuration, timeAgo } from '@/lib/domain/dates';
import { summarizeDay, suggestedNextSide } from '@/lib/domain/daily';
import { nextOccurrence } from '@/lib/domain/reminders';
import type { Appointment, Bottle, Breastfeed, Child, Diaper, Pregnancy, Sleep } from '@/lib/types';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, NACRE, palette, radius, spacing } from '@/theme/tokens';
import { LinearGradient } from 'expo-linear-gradient';

const ORB_HUES = ['rose', 'lavande', 'or'] as const;

export function PregnancyHero({ pregnancy }: { pregnancy: Pregnancy }) {
  const t = useTheme();
  const p = pregnancyProgress(pregnancy.due_date);
  const info = weekInfo(p.weeksSA);
  const { data: babies } = useExpectedBabies(pregnancy.id);
  const n = Math.max(1, babies?.length ?? 1);
  const orbSize = n === 1 ? 168 : n === 2 ? 120 : 92;
  const pct = Math.max(2, Math.min(100, Math.round((p.weeksSA / 41) * 100)));
  const tile = { flex: 1, borderRadius: radius.lg, padding: spacing.md, backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.colors.border, gap: 2 } as const;
  return (
    <View style={{ gap: spacing.xs }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Grossesse : ${p.label}, ${countdownLabel(p.daysToDue)}. Ouvrir l’univers de la grossesse.`}
        onPress={() => { haptic('selection'); router.push('/pregnancy'); }}
        style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.99 : 1 }] })}
      >
        <View style={{ borderRadius: radius.xl, overflow: 'hidden', backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.colors.border, padding: spacing.md, minHeight: 236 }}>
          <LinearGradient colors={t.isDark ? ['rgba(255,255,255,0.02)', 'rgba(255,134,168,0.16)'] : ['rgba(255,255,255,0.55)', 'rgba(255,200,215,0.35)']} start={{ x: 0.2, y: 0 }} end={{ x: 1, y: 1 }} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
          <Text variant="caption" weight="bold" muted style={{ letterSpacing: 1.2 }}>{n > 1 ? `GROSSESSE · ${n} BÉBÉS` : 'GROSSESSE'}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginTop: spacing.md }}>
            <Text style={{ fontFamily: fonts.display, fontSize: 92, lineHeight: 90, letterSpacing: -5 }}>{p.weeksSA}</Text>
            <Text variant="heading" color={t.colors.primary} style={{ marginBottom: 12, marginLeft: 4 }}>SA{p.extraDays ? ` +${p.extraDays} j` : ''}</Text>
          </View>
          <Text variant="small" muted>Trimestre {p.trimester} · {p.weeksSG} semaines de grossesse</Text>
          <View style={{ position: 'absolute', right: -14, top: 34, flexDirection: 'row' }} pointerEvents="none">
            {Array.from({ length: n }, (_, i) => (
              <View key={i} style={{ marginLeft: i ? -orbSize * 0.35 : 0 }}><FetusArt week={p.weeksSA} growth={info.growth} size={orbSize} hue={ORB_HUES[i % 3]} interactive={false} accessibilityLabel={`Illustration artistique ${babies?.[i]?.nickname ? 'de ' + babies[i].nickname : 'du bébé'}, pas une échographie`} /></View>
            ))}
          </View>
          <View style={{ marginTop: 'auto', paddingTop: spacing.md }}>
            <Text variant="caption" muted style={{ alignSelf: 'flex-end', marginBottom: 4 }}>{pct} %</Text>
            <View style={{ height: 8, borderRadius: 4, backgroundColor: t.isDark ? 'rgba(255,255,255,0.10)' : 'rgba(233,88,124,0.12)', overflow: 'hidden' }}>
              <LinearGradient colors={NACRE} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ width: `${pct}%`, height: '100%', borderRadius: 4 }} />
            </View>
          </View>
        </View>
      </Pressable>
      <View style={{ flexDirection: 'row', gap: spacing.xs }}>
        <View style={tile} accessible accessibilityLabel={`Terme le ${new Date(pregnancy.due_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}, ${countdownLabel(p.daysToDue)}`}>
          <Text variant="caption" weight="bold" muted style={{ letterSpacing: 1.2 }}>TERME</Text>
          <Text style={{ fontFamily: fonts.display, fontSize: 30, lineHeight: 36, letterSpacing: -1 }}>{p.daysToDue > 0 ? `J-${p.daysToDue}` : 'Bientôt'}</Text>
          <Text variant="small" muted>{new Date(pregnancy.due_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</Text>
        </View>
        <View style={tile} accessible accessibilityLabel={`Taille moyenne : environ ${info.lengthCm} centimètres, comme ${info.compare}`}>
          <Text variant="caption" weight="bold" muted style={{ letterSpacing: 1.2 }}>TAILLE</Text>
          <Text style={{ fontFamily: fonts.display, fontSize: 30, lineHeight: 36, letterSpacing: -1 }}>{info.lengthCm} cm</Text>
          <Text variant="small" muted numberOfLines={1}>{info.compare}</Text>
        </View>
      </View>
      <Text variant="caption" muted center>Repères moyens · illustration artistique, pas une échographie</Text>
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
  const stats: { label: string; value: string }[] = [
    { label: 'dernier repas', value: s.lastFeedAt ? timeAgo(s.lastFeedAt).replace('il y a ', '') : '—' },
    { label: 'sommeil aujourd’hui', value: formatDuration(s.sleepMinutes) },
    { label: 'dernier change', value: lastDiaper ? timeAgo(lastDiaper.at).replace('il y a ', '') : '—' },
  ];

  return (
    <View style={{ backgroundColor: t.colors.surface, borderRadius: radius.xl, borderWidth: 1, borderColor: t.colors.border, padding: spacing.md, gap: spacing.sm }}>
      <View style={{ alignItems: 'center' }}>
        <DayClock events={events} size={compact ? 220 : 290} label={`Journée de ${child.first_name}`}>
          {openSleep ? (
            <>
              <Icon name="moon" color={palette.lavenderInk} />
              <Text variant="heading" center>dort</Text>
              <Text variant="caption" muted center>depuis {timeAgo(openSleep.started_at).replace('il y a ', '')}</Text>
            </>
          ) : (
            <>
              <Text variant="caption" muted center>{childAge(child.birth_date).label}</Text>
              <Text variant="title" center>{child.first_name}</Text>
              <Text variant="caption" muted center>{s.bottleMl ? `${s.bottleMl} ml aujourd’hui` : 'les 24 dernières heures'}</Text>
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
        <Pressable onPress={() => router.push('/night')} accessibilityRole="button" style={{ minHeight: 48, borderRadius: radius.pill, backgroundColor: palette.night, alignItems: 'center', justifyContent: 'center' }}>
          <Text weight="medium" color={palette.milk}>Ouvrir le mode nuit</Text>
        </Pressable>
      )}
    </View>
  );
}

const QUICK: Record<string, { icon: IconName; label: string; go: (childId?: string) => void }> = {
  bottle: { icon: 'coffee', label: 'Biberon', go: (c) => router.push({ pathname: '/track/[kind]', params: { kind: 'bottle', child: c ?? '' } }) },
  breastfeed: { icon: 'droplet', label: 'Tétée', go: (c) => router.push({ pathname: '/track/[kind]', params: { kind: 'breastfeed', child: c ?? '' } }) },
  diaper: { icon: 'wind', label: 'Couche', go: (c) => router.push({ pathname: '/track/[kind]', params: { kind: 'diaper', child: c ?? '' } }) },
  sleep: { icon: 'moon', label: 'Sommeil', go: () => router.push('/night') },
  meal: { icon: 'feather', label: 'Repas', go: (c) => router.push({ pathname: '/track/[kind]', params: { kind: 'meal', child: c ?? '' } }) },
  observation: { icon: 'thermometer', label: 'Note santé', go: (c) => router.push({ pathname: '/track/[kind]', params: { kind: 'observation', child: c ?? '' } }) },
  question: { icon: 'message-circle', label: 'Question', go: () => router.push('/assistant/chat') },
  mood: { icon: 'heart', label: 'Mon humeur', go: () => router.push('/me/mood') },
  weight: { icon: 'trending-up', label: 'Mon poids', go: () => router.push('/pregnancy/weight') },
  scan: { icon: 'maximize', label: 'Scanner', go: () => router.push('/scanner') },
};
export const QUICK_KEYS = Object.keys(QUICK);
export const quickLabel = (k: string) => QUICK[k]?.label ?? k;

export function QuickActions({ keys, childId, onCustomize }: { keys: string[]; childId?: string; onCustomize: () => void }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      {keys.filter((k) => QUICK[k]).slice(0, 4).map((k) => (
        <Pressable
          key={k}
          accessibilityRole="button"
          accessibilityLabel={`Ajouter : ${QUICK[k].label}`}
          onPress={() => { haptic('light'); QUICK[k].go(childId); }}
          style={{ alignItems: 'center', gap: 6, width: 72 }}
        >
          {({ pressed }) => (
            <>
              <View style={{ width: 58, height: 58, borderRadius: 29, backgroundColor: pressed ? t.colors.surfaceAlt : t.colors.surface, borderWidth: 1, borderColor: t.colors.border, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={QUICK[k].icon} color={t.colors.gold} />
              </View>
              <Text variant="caption" weight="medium" center numberOfLines={1}>{QUICK[k].label}</Text>
            </>
          )}
        </Pressable>
      ))}
      <Pressable accessibilityRole="button" accessibilityLabel="Choisir mes raccourcis" onPress={onCustomize} style={{ alignItems: 'center', gap: 6, width: 72 }}>
        <View style={{ width: 58, height: 58, borderRadius: 29, borderWidth: 1.5, borderStyle: 'dashed', borderColor: t.colors.border, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="sliders" color={t.colors.textMuted} />
        </View>
        <Text variant="caption" muted center>Choisir</Text>
      </Pressable>
    </View>
  );
}

export function UpcomingCard() {
  const t = useTheme();
  const { data: appts } = useAppointments({ upcomingOnly: true });
  const { data: reminders } = useReminders();
  const next: Appointment | undefined = appts?.[0];
  const nextReminder = (reminders ?? [])
    .filter((r) => r.enabled)
    .map((r) => ({ r, at: nextOccurrence(r.schedule) }))
    .filter((x) => x.at)
    .sort((a, b) => a.at!.getTime() - b.at!.getTime())[0];
  if (!next && !nextReminder) return null;
  const row = (icon: IconName, title: string, when: string, onPress: () => void) => (
    <Pressable accessibilityRole="button" accessibilityLabel={`${title}, ${when}`} onPress={onPress} style={({ pressed }) => ({ flexDirection: 'row', gap: spacing.sm, alignItems: 'center', paddingVertical: spacing.sm, opacity: pressed ? 0.7 : 1 })}>
      <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: t.colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}><Icon name={icon} size={18} /></View>
      <View style={{ flex: 1 }}>
        <Text weight="bold">{title}</Text>
        <Text variant="small" muted>{when}</Text>
      </View>
      <Icon name="chevron-right" size={18} color={t.colors.textMuted} />
    </Pressable>
  );
  return (
    <View>
      {next && row('calendar', next.title, new Date(next.starts_at).toLocaleString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }), () => router.push('/appointments'))}
      {nextReminder && row('bell', nextReminder.r.title, `Rappel ${nextReminder.at!.toLocaleString('fr-FR', { weekday: 'long', hour: '2-digit', minute: '2-digit' })}`, () => router.push('/settings/reminders'))}
    </View>
  );
}
