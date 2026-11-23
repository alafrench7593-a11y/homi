/**
 * Missions familiales — fait, jour par jour (22/11/2026). Lit les MÊMES missions que la liste (`useMissions` :
 * tâches du foyer avec un état de mission) ; rien n'est recopié :
 *  · missions faites le jour choisi en grand (jour gardé dans l'adresse « ?day= »), « Rien de noté » sinon (jamais 0) ;
 *    restant (actives) / fait (semaine) dessous ;
 *  · semaine touchable : un repère par jour (nombre de missions faites) ;
 *  · liste : heure de réalisation en colonne fixe, mission, qui l'a faite ; toucher ouvre la mission (son historique
 *    horodaté). Une mission terminée ne se corrige pas : le serveur refuse toute transition depuis « faite ».
 * Aucun total par personne, aucun classement.
 */
import React, { useMemo } from 'react';
import { router } from 'expo-router';
import { Card } from '@/components/ui';
import { formatDate, t as tr } from '@/i18n';
import { countByDay } from '@/lib/domain/homeTrack';
import { dayDate, isoDay, weekDays } from '@/lib/domain/journalTrack';
import { missionHref, type Mission } from '@/lib/domain/missions';
import { missionsSplit } from '@/lib/domain/restTrack';
import { clock } from '@/lib/domain/sleepPlanner';
import { HmEmpty, HmHero, HmRow, HmWeek, useUrlDay } from '@/features/homeTrack/kit';

export function MissionsDays({ all, labelOf }: { all: Mission[]; labelOf: (id: string | null | undefined) => string }) {
  const [day, setDay] = useUrlDay();
  const s = useMemo(() => missionsSplit(all, day), [all, day]);
  const week = weekDays(day);
  const marks = useMemo(() => countByDay(s.done, week, (m) => (m.done_at ? isoDay(new Date(m.done_at)) : null)), [s.done, week.join()]); // eslint-disable-line react-hooks/exhaustive-deps
  const weekDone = week.reduce((n, d) => n + (marks[d] ?? 0), 0);
  const dayLabel = formatDate(dayDate(day), { weekday: 'long', day: 'numeric', month: 'long' });
  return (
    <>
      <HmHero testID="rs-mis-hero" value={s.doneOn.length ? String(s.doneOn.length) : null} unit={tr('rs.mis.unit', { count: s.doneOn.length, day: dayLabel })}
        emptyLabel={tr('rs.mis.none', { day: dayLabel })}
        split={[
          { label: tr('rs.mis.left'), value: String(s.remaining.length), testID: 'rs-mis-left' },
          { label: tr('rs.mis.weekDone'), value: String(weekDone), testID: 'rs-mis-week' },
        ]} />
      <HmWeek testID="rs-mis-week-strip" day={day} onSelect={setDay} marks={marks} countLabel={(n) => tr('rs.mis.count', { count: n })} />
      {s.doneOn.length ? (
        <Card testID="rs-mis-list">
          {s.doneOn.map((m) => (
            <HmRow key={m.id} testID={`rs-mis-${m.id}`} time={clock(new Date(m.done_at!))} icon="check-circle" title={m.title}
              detail={tr('rs.mis.by', { who: labelOf(m.done_by ?? m.assignee_id) })} onPress={() => router.push(missionHref(m.id) as never)} />
          ))}
        </Card>
      ) : <HmEmpty testID="rs-mis-empty" label={tr('rs.mis.none', { day: dayLabel })} />}
    </>
  );
}
