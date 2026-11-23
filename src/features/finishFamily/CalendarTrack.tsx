/**
 * Agenda familial — suivi (23/11/2026). Mêmes données que l'agenda (family_events, rendez-vous, tâches, relais) :
 *  · `CalendarHero` : les moments de la période affichée en grand (« rien de prévu » sinon), rendez-vous / tâches /
 *    événements chacun dans sa case ;
 *  · `EventTray` : fiche d'un événement du foyer (« ?event= » dans l'adresse) — titre, heures, lieu corrigés en
 *    valeurs provisoires (Annuler, Enregistrer verrouillé), écrits par `useSaveEvent` ; « Formulaire complet » ouvre
 *    le formulaire de l'agenda (répétition, enfant, notes, suppression). Sans droit d'édition : lecture seule.
 */
import React from 'react';
import { formatDate, t as tr, type TKey } from '@/i18n';
import { useSaveEvent } from '@/lib/data/hooks-family-load';
import { friendlyError } from '@/lib/data/hooks-settings';
import { EVENT_KINDS, type CalendarItem, type FamilyEvent } from '@/lib/domain/calendar';
import { calendarCounts, eventDraftOf, eventFixPatch } from '@/lib/domain/finishFamily';
import { clock } from '@/lib/domain/sleepPlanner';
import { HmFixTray, HmHero } from '@/features/homeTrack/kit';

export function CalendarHero({ items, period }: { items: readonly CalendarItem[]; period: string }) {
  const c = calendarCounts(items);
  return (
    <HmHero testID="ff-cal-hero" value={c.total == null ? null : String(c.total)} unit={tr('ff.cal.unit', { count: c.total ?? 0, period })} emptyLabel={tr('ff.cal.none', { period })}
      split={[
        { label: tr('ff.cal.appts'), value: String(c.appointments), testID: 'ff-cal-appts' },
        { label: tr('ff.cal.tasks'), value: String(c.tasks), testID: 'ff-cal-tasks' },
        { label: tr('ff.cal.events'), value: String(c.events), testID: 'ff-cal-events' },
      ]} />
  );
}

const ERR: Record<'title' | 'badTime' | 'order', TKey> = { title: 'ff.cal.needTitle', badTime: 'hm.fix.badTime', order: 'hm.fix.order' };

export function EventTray({ event, onClose, canEdit, onFullForm, childName }: {
  event: FamilyEvent | null; onClose: () => void; canEdit: boolean; onFullForm: (e: FamilyEvent) => void; childName?: string | null;
}) {
  const save = useSaveEvent();
  if (!event) return null;
  const e = event;
  const hero = e.all_day ? tr('ff.cal.allDay') : `${clock(new Date(e.starts_at))}${e.ends_at ? ` – ${clock(new Date(e.ends_at))}` : ''}`;
  return (
    <HmFixTray open onOpenChange={(v) => { if (!v) onClose(); }} testID="ff-cal-tray" readOnly={!canEdit}
      title={formatDate(e.starts_at, { weekday: 'long', day: 'numeric', month: 'long' })} hero={hero}
      lines={[
        e.title,
        EVENT_KINDS.find((k) => k.value === e.kind)?.label,
        childName ? tr('ff.cal.for', { name: childName }) : null,
        e.location_label ? tr('ff.cal.placeLine', { place: e.location_label }) : null,
        e.notes,
        e.recurrence ? tr('ff.cal.series') : null,
        canEdit ? null : tr('ff.readOnly'),
      ]}
      editLabel={tr('hm.fix.edit')} editTitle={tr('ff.cal.fixTitle')} onFullForm={() => onFullForm(e)}
      fields={[
        { key: 'title', label: tr('ff.cal.title'), kind: 'text', maxLength: 120 },
        ...(e.all_day ? [] : [
          { key: 'from', label: tr('hm.fix.from'), kind: 'time' as const },
          { key: 'to', label: tr('ff.cal.to'), kind: 'time' as const },
        ]),
        { key: 'place', label: tr('ff.cal.place'), kind: 'text', maxLength: 160 },
      ]}
      initial={eventDraftOf(e)}
      validate={(d) => { const r = eventFixPatch(e, { title: d.title ?? '', from: d.from ?? '', to: d.to ?? '', place: d.place ?? '' }); return 'error' in r ? tr(ERR[r.error]) : null; }}
      onSave={async (d) => {
        const r = eventFixPatch(e, { title: d.title ?? '', from: d.from ?? '', to: d.to ?? '', place: d.place ?? '' });
        if ('error' in r) return tr(ERR[r.error]);
        if (!Object.keys(r.patch).length) return 'ok';
        try { await save.mutateAsync({ id: e.id, input: r.patch }); return 'ok'; } catch (err) { return friendlyError(err); }
      }} />
  );
}
