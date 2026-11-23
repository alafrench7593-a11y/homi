/**
 * « Je décroche » — suivi (23/11/2026). Même table que l'écran (offduty_periods), 5 semaines chargées :
 *  · semaine gardée dans l'adresse (« ?week= ») ; MES heures de pause de la semaine en grand (« rien de noté » sinon),
 *    mes pauses et celles des autres chacune dans sa case ;
 *  · liste datée : jour et heure de début en colonne fixe, durée, relais ;
 *  · une pause → sa fiche (« ?pause= ») ; MA pause en cours se corrige (nouvelle fin : valeur provisoire, Annuler,
 *    Enregistrer verrouillé) et mes rappels mis en pause reprennent à la nouvelle fin. Les autres pauses se lisent.
 */
import { MotionItem, MotionList } from '@/motion/ListMotion';
import React from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui';
import { formatDate, t as tr } from '@/i18n';
import { useOffDutyHistory, useUpdateOffDutyEnd, type OffDuty } from '@/lib/data/hooks-mental';
import { friendlyError } from '@/lib/data/hooks-settings';
import { offDutyEditable, offDutyEndEdit, offDutyWeek } from '@/lib/domain/finishFamily';
import { hmText, minutesOf, mondayOfDay } from '@/lib/domain/homeTrack';
import { isoDay } from '@/lib/domain/journalTrack';
import { clock, span } from '@/lib/domain/sleepPlanner';
import { spacing } from '@/theme/tokens';
import { HmEmpty, HmFixTray, HmHero, HmRow, HmWeekStepper, useUrlWeek } from '@/features/homeTrack/kit';
import { useOpenParam } from './shared';

const range = (p: OffDuty) => `${clock(new Date(p.starts_at))} – ${clock(new Date(p.ends_at))}`;
const length = (p: OffDuty, now: number) => span((Math.min(Date.parse(p.ends_at), now) - Date.parse(p.starts_at)) / 60000);

export function OffDutyWeek({ me, labelOf, relayName, now }: {
  me: string | null; labelOf: (id: string | null | undefined) => string;
  /** Relais d'une pause (personne du foyer ou contact du cercle d'aide) */
  relayName: (p: OffDuty) => string;
  now: Date;
}) {
  const periods = useOffDutyHistory().data ?? [];
  const update = useUpdateOffDutyEnd();
  const [week, setWeek] = useUrlWeek(mondayOfDay(isoDay(now)));
  const [pauseId, setPause] = useOpenParam('pause');
  const w = offDutyWeek(periods, week, me, now);
  const opened = pauseId ? periods.find((p) => p.id === pauseId) ?? null : null;
  const editable = opened ? offDutyEditable(opened, me, now) : false;
  const t = now.getTime();
  return (
    <View style={{ gap: spacing.sm }} testID="ff-off">
      <HmWeekStepper monday={week} onSelect={setWeek} testID="ff-off-week" />
      <HmHero testID="ff-off-hero" value={w.minutes == null ? null : span(w.minutes)} unit={tr('ff.off.unit')} emptyLabel={tr('ff.off.none')}
        split={w.list.length ? [{ label: tr('ff.off.mine'), value: String(w.mine), testID: 'ff-off-mine' }, { label: tr('ff.off.others'), value: String(w.list.length - w.mine), testID: 'ff-off-others' }] : undefined} />
      {w.list.length ? (
        <MotionList testID="ff-off-list">
          {w.list.map((p) => (
            <MotionItem key={p.id}>
              <HmRow time={formatDate(p.starts_at, { weekday: 'short', day: 'numeric' })} icon="moon" testID={`ff-off-row-${p.id}`}
                title={p.user_id === me ? tr('ff.off.myPause') : tr('ff.off.who', { person: labelOf(p.user_id) })}
                detail={[range(p), length(p, t), Date.parse(p.ends_at) > t ? tr('ff.off.ongoing') : null].filter(Boolean).join(' · ')}
                onPress={() => setPause(p.id)} />
            </MotionItem>
          ))}
        </MotionList>
      ) : <HmEmpty testID="ff-off-empty" label={tr('ff.off.empty')} />}
      {opened ? (
        <HmFixTray open onOpenChange={(v) => { if (!v) setPause(null); }} testID="ff-off-tray" readOnly={!editable}
          title={formatDate(opened.starts_at, { weekday: 'long', day: 'numeric', month: 'long' })} hero={range(opened)}
          lines={[
            opened.user_id === me ? tr('ff.off.myPause') : tr('ff.off.who', { person: labelOf(opened.user_id) }),
            length(opened, t),
            tr('hm.off.relay', { person: relayName(opened) }),
            editable ? null : Date.parse(opened.ends_at) > t ? tr('ff.off.notYours') : tr('ff.off.over'),
          ]}
          editLabel={tr('ff.off.fix')} editTitle={tr('ff.off.fixTitle')}
          fields={[{ key: 'end', label: tr('ff.off.end'), kind: 'time', hint: tr('ff.off.endHint') }]}
          initial={{ end: hmText(minutesOf(opened.ends_at)) }}
          validate={(d) => { const r = offDutyEndEdit(opened, d.end ?? '', new Date()); return 'error' in r ? tr(r.error === 'tooLong' ? 'ff.off.tooLong' : 'hm.fix.badTime') : null; }}
          onSave={async (d) => {
            const r = offDutyEndEdit(opened, d.end ?? '', new Date());
            if ('error' in r) return tr(r.error === 'tooLong' ? 'ff.off.tooLong' : 'hm.fix.badTime');
            try { await update.mutateAsync({ id: opened.id, oldEnds: opened.ends_at, ends_at: r.ends_at }); return 'ok'; } catch (e) { return friendlyError(e); }
          }} />
      ) : null}
    </View>
  );
}
