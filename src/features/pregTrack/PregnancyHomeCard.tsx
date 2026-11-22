/**
 * Grossesse — ce qui remonte à l'accueil et à la catégorie (22/11/2026). Une seule donnée source, jamais recopiée :
 * séances de mouvements (`pregnancy_symptom_logs`/`kick_count`), rendez-vous de la grossesse (`appointments`),
 * ressentis (`pregnancy_symptom_logs`), bilans post-partum (`postpartum_checkins`).
 *
 * `PregnancyHomeCard()` — à insérer dans l'accueil par l'intégrateur (NON inséré ici) : UNE carte, par priorité
 *  1. séance de mouvements en cours (compte et minuteur qui avancent) → la séance ;
 *  2. prochain rendez-vous de la grossesse dans les 14 jours → le calendrier sur ce jour ;
 *  3. dernier ressenti noté (48 h) → le journal sur ce jour ;
 *  4. dernière séance de mouvements (48 h) → sa fiche.
 * Rien de tout cela : la carte ne s'affiche pas (pas de zéro inventé).
 *
 * `PregnancyCategorySummary()` — en tête de /tools/pregnancy : les mêmes lignes, toutes à la fois (heure ou date en
 * colonne, pictogramme, libellé + détail, chevron), et le dernier bilan post-partum s'il y en a.
 */
import React, { useMemo } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Glass } from '@/components/glass';
import { Tappable } from '@/components/Tappable';
import { Icon, Text, type IconName } from '@/components/ui';
import { formatDate, t as tr, type TKey } from '@/i18n';
import { useActivePregnancy, useAppointments } from '@/lib/data/hooks';
import { usePregnancySymptoms } from '@/lib/data/hooks-care';
import { usePostpartumCheckins } from '@/lib/data/hooks-postpartum';
import { stopwatch } from '@/lib/domain/breastSession';
import { isoDay } from '@/lib/domain/journalTrack';
import { answered, daysAhead, kickSeconds, nextAppt, QUICK_SCALES, type KickSession } from '@/lib/domain/pregTrack';
import { clock } from '@/lib/domain/sleepPlanner';
import type { Appointment } from '@/lib/types';
import { useTheme } from '@/theme/ThemeProvider';
import { fonts, MIN_TOUCH, radius, spacing } from '@/theme/tokens';
import { useTicker } from '@/features/breastTrack/SessionBand';
import { TABULAR } from '@/features/quickTrack/EntryTray';
import { kickCount, useKickState } from './KickSession';
import { feelAt } from './FeelJournal';

const RECENT_MS = 48 * 3600_000;
const APPT_DAYS = 14;

type Item = { key: string; icon: IconName; title: string; big: string; detail: string; col: string; live?: boolean; go: () => void; testID: string };

/** « Aujourd'hui », « Demain », « Dans 3 jours ». */
export function whenAhead(iso: string, now: Date): string {
  const d = daysAhead(iso, now);
  return d <= 0 ? tr('pg.h.today') : d === 1 ? tr('pg.h.tomorrow') : tr('pg.h.inDays', { count: d });
}

function usePregnancyItems(): { items: Item[]; live: boolean; ready: boolean } {
  const pregnancy = useActivePregnancy();
  const kicks = useKickState();
  const now = useTicker(!!kicks.live);
  const appts = useAppointments({ upcomingOnly: true }).data;
  const feels = usePregnancySymptoms(5).data;
  return useMemo(() => {
    const out: Item[] = [];
    if (!pregnancy) return { items: out, live: false, ready: true };
    const live = kicks.live;
    if (live) {
      out.push({ key: 'kick-live', icon: 'radio', live: true, title: tr('pg.h.kickLive', { time: clock(new Date(live.start)) }), big: String(live.count),
        detail: tr('pg.k.unitLive', { count: live.count, time: stopwatch(kickSeconds(live, now)) }), col: stopwatch(kickSeconds(live, now)),
        go: () => router.push('/pregnancy/moves' as never), testID: 'preg-home-kick-live' });
    }
    const next = nextAppt(((appts ?? []) as Appointment[]).filter((a) => a.pregnancy_id === pregnancy.id), now);
    if (next && daysAhead(next.starts_at, now) <= APPT_DAYS) {
      out.push({ key: 'appt', icon: 'calendar', title: tr('pg.h.nextAppt'), big: whenAhead(next.starts_at, now),
        detail: `${next.title} · ${formatDate(next.starts_at, { weekday: 'long', day: 'numeric', month: 'long' })}${(next as { time_set?: boolean }).time_set === false ? '' : ` · ${clock(new Date(next.starts_at))}`}`,
        col: (next as { time_set?: boolean }).time_set === false ? formatDate(next.starts_at, { day: 'numeric', month: 'short' }) : clock(new Date(next.starts_at)),
        go: () => router.push({ pathname: '/pregnancy/calendar', params: { day: isoDay(new Date(next.starts_at)) } } as never), testID: 'preg-home-appt' });
    }
    const feel = (feels ?? [])[0];
    if (feel && now.getTime() - Date.parse(feelAt(feel)) < RECENT_MS) {
      out.push({ key: 'feel', icon: 'feather', title: tr('pg.h.lastFeel'), big: tr(`care.sym.${feel.symptom}` as TKey),
        detail: [feel.intensity ? tr(`care.feel.int${feel.intensity}` as TKey) : null, `${formatDate(feelAt(feel), { weekday: 'long' })} ${clock(new Date(feelAt(feel)))}`].filter(Boolean).join(' · '),
        col: clock(new Date(feelAt(feel))), go: () => router.push({ pathname: '/pregnancy/feel', params: { day: isoDay(new Date(feelAt(feel))) } } as never), testID: 'preg-home-feel' });
    }
    const last: KickSession | undefined = kicks.sessions.find((s) => !s.ongoing);
    if (!live && last && now.getTime() - Date.parse(last.end ?? last.start) < RECENT_MS) {
      out.push({ key: 'kick-last', icon: 'radio', title: tr('pg.h.kickLast'), big: String(last.count),
        detail: `${kickCount(last.count)} · ${formatDate(last.start, { weekday: 'long' })} ${clock(new Date(last.start))}`, col: clock(new Date(last.start)),
        go: () => router.push({ pathname: '/pregnancy/moves', params: { session: last.id, day: isoDay(new Date(last.start)) } } as never), testID: 'preg-home-kick-last' });
    }
    return { items: out, live: !!live, ready: !!kicks.q.data };
  }, [pregnancy, kicks, now, appts, feels]);
}

export function PregnancyHomeCard() {
  const t = useTheme();
  const { items } = usePregnancyItems();
  const it = items[0];
  if (!it) return null;
  return (
    <Tappable accessibilityRole="button" accessibilityLabel={`${it.title}. ${it.big}. ${it.detail}`} testID="home-pregnancy" onPress={it.go}
      style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
      <Glass variant="card" radius={radius.xl} contentStyle={{ padding: spacing.md, gap: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
          <Icon name={it.icon} size={16} color={it.live ? t.colors.primary : t.colors.textMuted} />
          <Text variant="small" weight="medium" style={{ flex: 1 }} numberOfLines={2} testID="home-pregnancy-title">{it.title}</Text>
          <Icon name="chevron-right" size={18} color={t.colors.textMuted} />
        </View>
        <Text testID="home-pregnancy-big" maxFontSizeMultiplier={1.3} numberOfLines={1} adjustsFontSizeToFit
          style={[{ fontSize: 40, lineHeight: 46, letterSpacing: -1, fontFamily: fonts.display, color: t.colors.text }, TABULAR]}>{it.big}</Text>
        <Text weight="bold" style={TABULAR} testID="home-pregnancy-detail">{it.detail}</Text>
      </Glass>
    </Tappable>
  );
}

export function PregnancyCategorySummary() {
  const t = useTheme();
  const pregnancy = useActivePregnancy();
  const { items } = usePregnancyItems();
  const checkins = usePostpartumCheckins(14).data;
  const lastCheckin = checkins?.[0] ?? null;
  const rows: Item[] = [...items];
  if (lastCheckin) {
    rows.push({ key: 'pp', icon: 'check', title: tr('pg.h.lastCheckin'), big: '', col: formatDate(`${lastCheckin.checkin_date}T12:00:00`, { day: 'numeric', month: 'short' }),
      detail: tr('pg.c.answered', { count: answered(lastCheckin), total: QUICK_SCALES.length }),
      go: () => router.push({ pathname: '/postpartum/history', params: { day: lastCheckin.checkin_date } } as never), testID: 'preg-cat-checkin' });
  }
  if (!pregnancy && !rows.length) return null;
  return (
    <Glass variant="card" radius={radius.xl} contentStyle={{ padding: spacing.md, gap: 2 }} testID="pregnancy-category-summary">
      <Text variant="label">{tr('pg.h.catTitle')}</Text>
      {rows.length ? rows.map((r) => (
        <Tappable key={r.key} accessibilityRole="button" testID={r.testID.replace('preg-home', 'preg-cat')} onPress={r.go}
          accessibilityLabel={`${r.title}. ${r.big ? `${r.big}. ` : ''}${r.detail}`}
          style={({ pressed }) => ({ minHeight: MIN_TOUCH, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, opacity: pressed ? 0.6 : 1, paddingVertical: 4 })}>
          <Text weight="bold" style={[{ width: 72 }, TABULAR]}>{r.col}</Text>
          <Icon name={r.icon} size={16} color={r.live ? t.colors.primary : t.colors.textMuted} />
          <View style={{ flex: 1 }}>
            <Text weight="medium">{r.title}</Text>
            <Text variant="caption" muted style={TABULAR}>{r.big && (r.key === 'appt' || r.key === 'feel') ? `${r.big} · ${r.detail}` : r.detail}</Text>
          </View>
          <Icon name="chevron-right" size={16} color={t.colors.textMuted} />
        </Tappable>
      )) : (
        <View testID="preg-cat-none" style={{ minHeight: 48, borderRadius: radius.lg, borderWidth: 1.5, borderStyle: 'dashed', borderColor: t.colors.border, alignItems: 'center', justifyContent: 'center' }}>
          <Text variant="small" muted>{tr('pg.h.nothingSoon')}</Text>
        </View>
      )}
    </Glass>
  );
}
