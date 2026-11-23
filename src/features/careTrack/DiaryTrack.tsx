/**
 * « Mon journal intime » — suivi (22/11/2026). Mêmes pages que le journal (`mood_checkins` portant un texte, privées) :
 *  · semaine touchable, jour gardé dans l'adresse (`?day=`) : un repère par jour — nombre de pages écrites, anneau
 *    pointillé si rien n'est écrit (jamais 0) ;
 *  · donnée principale : les pages de la semaine (même nature : des pages), la dernière date dessous ;
 *  · pages du jour (heure en colonne, humeur, début du texte, chevron) → fiche (Tray, `?page=`) : « Corriger » le
 *    texte et l'heure — valeurs provisoires, Annuler, Enregistrer verrouillé, brouillon gardé si l'écriture échoue.
 * Aucune analyse ici : la synthèse Aura reste celle, à la demande, de l'écran du journal.
 */
import React, { useMemo } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Text } from '@/components/ui';
import { HmEmpty, HmFixTray, HmHero, HmRow, HmWeek } from '@/features/homeTrack/kit';
import { moodLabel } from '@/features/mood/MoodJournalUI';
import { MOOD_ICON } from '@/features/mood/model';
import { formatDate, t as tr } from '@/i18n';
import { useCareEdit } from '@/lib/data/hooks-careTrack';
import { countsByDay, dayOfStamp, entriesOn, urlDay } from '@/lib/domain/careTrack';
import { todayISO } from '@/lib/domain/dates';
import { DIARY_MAX } from '@/lib/domain/diary';
import { weekDays } from '@/lib/domain/journalTrack';
import { hhmm, proposedTime } from '@/lib/domain/quickTrack';
import { clock } from '@/lib/domain/sleepPlanner';
import type { MoodCheckin } from '@/lib/types';
import { spacing } from '@/theme/tokens';

const excerpt = (s: string | null, n = 70) => { const x = (s ?? '').replace(/\s+/g, ' ').trim(); return x.length > n ? `${x.slice(0, n - 1)}…` : x; };
const at = (m: MoodCheckin) => m.checked_at;

export function DiaryTrack({ pages }: { pages: readonly MoodCheckin[] }) {
  const params = useLocalSearchParams<{ day?: string; page?: string }>();
  const today = todayISO();
  const day = urlDay(params.day, today);
  const week = weekDays(day);
  const marks = useMemo(() => countsByDay(pages, (p) => dayOfStamp(p.checked_at), week), [pages, week.join()]); // eslint-disable-line react-hooks/exhaustive-deps
  const weekCount = Object.values(marks).reduce<number>((s, n) => s + (n ?? 0), 0);
  const list = entriesOn(pages, (p) => dayOfStamp(p.checked_at), at, day);
  const last = pages[0] ?? null;
  const opened = params.page ? pages.find((p) => p.id === params.page) ?? null : null;
  return (
    <View style={{ gap: spacing.sm }} testID="ct-diary">
      <HmHero testID="ct-diary-hero" value={weekCount ? String(weekCount) : null} emptyLabel={tr(week[0] === weekDays(today)[0] ? 'ct.diary.noneWeek' : 'ct.diary.noneThatWeek')}
        unit={weekCount ? tr(week[0] === weekDays(today)[0] ? 'ct.diary.pagesWeek' : 'ct.diary.pagesThatWeek', { count: weekCount }) : null}
        caption={last ? tr('ct.diary.lastOn', { date: formatDate(last.checked_at, { weekday: 'long', day: 'numeric', month: 'long' }), time: clock(new Date(last.checked_at)) }) : null} />
      <HmWeek testID="ct-diary-week" day={day} marks={marks} countLabel={(n) => tr('ct.diary.pages', { count: n })}
        onSelect={(d) => router.setParams({ day: d === today ? undefined : d, page: undefined } as never)} />
      <View testID="ct-diary-day" style={{ gap: 2 }}>
        <Text variant="label" muted accessibilityRole="header">{formatDate(`${day}T12:00:00`, { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
        {list.length ? list.map((p) => (
          <HmRow key={p.id} time={clock(new Date(p.checked_at))} icon={MOOD_ICON[p.mood]} title={excerpt(p.journal)} detail={moodLabel(p.mood)}
            testID={`ct-diary-row-${p.id}`} a11y={`${clock(new Date(p.checked_at))}, ${moodLabel(p.mood)}. ${excerpt(p.journal)}. ${tr('ct.openToFix')}`}
            onPress={() => router.setParams({ page: p.id } as never)} />
        )) : <HmEmpty testID="ct-diary-day-none" label={tr('ct.diary.noneDay')} />}
      </View>
      {opened ? <PageTray page={opened} onClose={() => router.setParams({ page: undefined } as never)} /> : null}
    </View>
  );
}

function PageTray({ page, onClose }: { page: MoodCheckin; onClose: () => void }) {
  const edit = useCareEdit('mood_checkins');
  const d0 = new Date(page.checked_at);
  const check = (d: Record<string, string>) => (!d.text.trim() ? tr('ct.diary.emptyText') : d.text.trim().length > DIARY_MAX ? tr('ct.diary.tooLong') : !proposedTime(page.checked_at, d.time) ? tr('ct.badTime') : null);
  return (
    <HmFixTray open onOpenChange={(v) => { if (!v) onClose(); }} testID="ct-diary-tray"
      title={formatDate(page.checked_at, { weekday: 'long', day: 'numeric', month: 'long' })} hero={clock(d0)}
      lines={[moodLabel(page.mood), excerpt(page.journal, 240)]}
      editLabel={tr('ct.fix')} editTitle={tr('ct.diary.fixTitle')}
      onFullForm={() => router.push({ pathname: '/me/mood/[id]', params: { id: page.id } } as never)}
      fields={[
        { key: 'time', label: tr('ct.time'), kind: 'time' },
        { key: 'text', label: tr('ct.diary.textField'), kind: 'multiline', maxLength: DIARY_MAX },
      ]}
      initial={{ time: hhmm(d0), text: page.journal ?? '' }}
      validate={check}
      onSave={async (d) => {
        const err = check(d);
        if (err) return err;
        const when = proposedTime(page.checked_at, d.time)!;
        const patch: Record<string, unknown> = {};
        if (when.getTime() !== d0.getTime()) patch.checked_at = when.toISOString();
        if (d.text.trim() !== (page.journal ?? '').trim()) patch.journal = d.text.trim();
        const res = await edit(page.id, patch, page as unknown as Record<string, unknown>);
        return res === 'changed' ? tr('ct.changedMeanwhile') : 'ok';
      }} />
  );
}
