/**
 * Temps pour moi — suivi par semaine (22/11/2026). Même donnée que les réservations (care_shifts, kind « me_time ») :
 *  · semaine gardée dans l'adresse (« ?week= ») ; MON temps réservé en grand (« 1 h 30 », minutes additionnées
 *    seulement entre créneaux « temps pour moi ») ; « rien de noté » si aucun créneau ;
 *  · mes créneaux de la semaine (heure en colonne fixe) ; un créneau → sa fiche (Tray) : corriger début, fin et note
 *    (valeurs provisoires, Annuler, Enregistrer verrouillé, brouillon gardé), écrit par `useUpdateShift`.
 *  Les créneaux de plus de 14 jours ne sont pas chargés par l'écran : une semaine plus ancienne apparaît vide.
 */
import React, { useState } from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui';
import { formatDate, t as tr } from '@/i18n';
import { useUpdateShift } from '@/lib/data/hooks-family-load';
import { friendlyError } from '@/lib/data/hooks-settings';
import type { CareShift } from '@/lib/domain/familyLoad';
import { hmText, minutesOf, shiftEdit, weekMinutes } from '@/lib/domain/homeTrack';
import { isoDay, shiftDay } from '@/lib/domain/journalTrack';
import { clock, span } from '@/lib/domain/sleepPlanner';
import { spacing } from '@/theme/tokens';
import { HmEmpty, HmFixTray, HmHero, HmRow, HmWeekStepper, useUrlWeek } from './kit';

const range = (s: { starts_at: string; ends_at: string }) => `${clock(new Date(s.starts_at))} – ${clock(new Date(s.ends_at))}`;

export function MeTimeTrack({ shifts, me, thisWeek }: { shifts: readonly CareShift[]; me: string | null; thisWeek: string }) {
  const update = useUpdateShift();
  const [week, setWeek] = useUrlWeek(thisWeek);
  const [openId, setOpenId] = useState<string | null>(null);
  const isMine = (s: { kind: string; user_id: string }) => s.kind === 'me_time' && s.user_id === me;
  const minutes = weekMinutes(shifts, week, isMine);
  const end = shiftDay(week, 7);
  const list = shifts.filter((s) => isMine(s) && s.status !== 'cancelled' && isoDay(new Date(s.starts_at)) >= week && isoDay(new Date(s.starts_at)) < end).sort((a, b) => (a.starts_at < b.starts_at ? -1 : 1));
  const opened = openId ? shifts.find((s) => s.id === openId) ?? null : null;
  const now = Date.now();
  const past = list.filter((s) => Date.parse(s.ends_at) <= now).length;
  return (
    <View style={{ gap: spacing.sm }} testID="hm-mt">
      <HmWeekStepper monday={week} onSelect={setWeek} testID="hm-mt-week" />
      <HmHero testID="hm-mt-hero" value={minutes == null ? null : span(minutes)} unit={tr('hm.mt.unit')} emptyLabel={tr('hm.mt.none')}
        split={list.length ? [{ label: tr('hm.mt.coming'), value: String(list.length - past), testID: 'hm-mt-coming' }, { label: tr('hm.mt.past'), value: String(past), testID: 'hm-mt-past' }] : undefined} />
      {list.length ? (
        <View testID="hm-mt-list">
          {list.map((s) => <HmRow key={s.id} time={clock(new Date(s.starts_at))} icon="sun" testID={`hm-mt-row-${s.id}`}
            title={formatDate(s.starts_at, { weekday: 'long', day: 'numeric', month: 'short' })} detail={[range(s), span((Date.parse(s.ends_at) - Date.parse(s.starts_at)) / 60000), s.note].filter(Boolean).join(' · ')}
            onPress={() => setOpenId(s.id)} />)}
        </View>
      ) : <HmEmpty label={tr('hm.mt.noneList')} />}
      {opened ? (
        <HmFixTray open onOpenChange={(v) => { if (!v) setOpenId(null); }} testID="hm-mt-tray"
          title={formatDate(opened.starts_at, { weekday: 'long', day: 'numeric', month: 'long' })} hero={range(opened)}
          lines={[span((Date.parse(opened.ends_at) - Date.parse(opened.starts_at)) / 60000), opened.note]}
          fields={[{ key: 'from', label: tr('hm.fix.from'), kind: 'time' }, { key: 'to', label: tr('hm.fix.to'), kind: 'time' }, { key: 'note', label: tr('hm.fix.note'), kind: 'text', maxLength: 300 }]}
          initial={{ from: hmText(minutesOf(opened.starts_at)), to: hmText(minutesOf(opened.ends_at)), note: opened.note ?? '' }}
          validate={(d) => { const r = shiftEdit(opened.starts_at, d.from, d.to); return 'error' in r ? tr(r.error === 'order' ? 'hm.fix.order' : 'hm.fix.badTime') : null; }}
          onSave={async (d) => {
            const r = shiftEdit(opened.starts_at, d.from, d.to);
            if ('error' in r) return tr(r.error === 'order' ? 'hm.fix.order' : 'hm.fix.badTime');
            try { await update.mutateAsync({ id: opened.id, patch: { ...r, note: d.note.trim() || null } }); return 'ok'; } catch (e) { return friendlyError(e); }
          }} />
      ) : null}
      {list.length ? <Text variant="caption" muted>{tr('hm.mt.hint')}</Text> : null}
    </View>
  );
}
