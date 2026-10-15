/** Cartes de l'accueil personnalisé. */
import React from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { FetusOrb } from '@/components/FetusOrb';
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
import { palette, radius, spacing } from '@/theme/tokens';

const ORB_HUES = ['rose', 'lavande', 'or'] as const;

export function PregnancyHero({ pregnancy }: { pregnancy: Pregnancy }) {
  const p = pregnancyProgress(pregnancy.due_date);
  const info = weekInfo(p.weeksSA);
  const { data: babies } = useExpectedBabies(pregnancy.id);
  const n = Math.max(1, babies?.length ?? 1);
  const orbSize = n === 1 ? 200 : n === 2 ? 150 : 112;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Grossesse : ${p.label}, ${countdownLabel(p.daysToDue)}. Ouvrir l’univers de la grossesse.`}
      onPress={() => { haptic('selection'); router.push('/pregnancy'); }}
      style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.99 : 1 }] })}
    >
      <View style={{ borderRadius: radius.xl, overflow: 'hidden', backgroundColor: '#121633', borderWidth: 1, borderColor: 'rgba(216,188,133,0.28)', paddingVertical: spacing.lg, paddingHorizontal: spacing.md }}>
        <StarField density={26} />
        <View style={{ alignItems: 'center' }}>
          <WeeksRing week={p.weeksSA} size={280}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {Array.from({ length: n }, (_, i) => (
                <View key={i} style={{ marginLeft: i ? -orbSize * 0.28 : 0 }}><FetusOrb growth={info.growth} size={orbSize} hue={ORB_HUES[i % 3]} interactive={false} accessibilityLabel={`Illustration artistique ${babies?.[i]?.nickname ? 'de ' + babies[i].nickname : 'du bébé'}`} /></View>
              ))}
            </View>
          </WeeksRing>
        </View>
        <View style={{ marginTop: spacing.xs, gap: 6 }}>
          <View>
            <Text variant="hero" color={palette.milk}>{p.weeksSA}<Text variant="heading" color={palette.gold}> SA{p.extraDays ? ` + ${p.extraDays} j` : ''}</Text></Text>
            <Text variant="small" color="rgba(251,248,244,0.7)">{p.weeksSG} semaines de grossesse, trimestre {p.trimester}</Text>
          </View>
          <Text color={palette.gold}>Terme le {new Date(pregnancy.due_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}, {countdownLabel(p.daysToDue)}</Text>
        </View>
        <View style={{ marginTop: spacing.md, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: 'rgba(200,163,94,0.35)' }}>
          <Text color={palette.milk}>{n > 1 ? 'Chacun' : 'Il ou elle'} a à peu près la taille d’{info.compare.replace(/^une? /, (m) => m)}.</Text>
          <Text variant="caption" color="rgba(251,248,244,0.6)">Repères moyens ({info.lengthCm} cm, {formatWeight(info.weightG)}). Illustration artistique, pas une échographie.</Text>
        </View>
      </View>
    </Pressable>
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
