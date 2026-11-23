/**
 * Fiche d'un moment de l'enfant (dent, étape, souvenir — table `child_milestones`) dans le Tray, commune aux mini-apps
 * Dents, Fiche de l'enfant et Journal (22/11/2026). Le moment ouvert est gardé dans l'adresse (`?moment=` ou
 * `?tooth=`) : revenir sur l'écran retrouve la fiche fermée au même endroit.
 * « Corriger » : date (jamais future, jamais avant la naissance), libellé (sauf une dent : son nom vient du schéma) et
 * note — valeurs PROVISOIRES, Annuler, Enregistrer verrouillé contre le double appui, brouillon gardé si l'écriture
 * échoue ; la ligne n'est écrite que si elle n'a pas changé depuis l'ouverture (même garde que le formulaire manuel).
 */
import React from 'react';
import { HmFixTray, type HmField } from '@/features/homeTrack/kit';
import { formatDate, t as tr } from '@/i18n';
import { useCareEdit } from '@/lib/data/hooks-careTrack';
import type { Milestone } from '@/lib/data/hooks-family';
import { checkDate } from '@/lib/domain/careTrack';
import { childAge } from '@/lib/domain/child';
import { todayISO } from '@/lib/domain/dates';
import { toFrDate } from '@/lib/validation';

export const longDate = (iso: string) => formatDate(`${iso.slice(0, 10)}T12:00:00`, { day: 'numeric', month: 'long', year: 'numeric' });
export const shortDate = (iso: string) => formatDate(`${iso.slice(0, 10)}T12:00:00`, { day: 'numeric', month: 'short' });

/** Message d'une date refusée (format, future, avant la naissance) ou `null`. */
export function dateError(text: string, opts: { required?: boolean; min?: string | null } = {}): string | null {
  const c = checkDate(text, todayISO(), opts);
  if (c.ok) return null;
  return tr(c.reason === 'future' ? 'ct.date.future' : c.reason === 'before' ? 'ct.date.beforeBirth' : 'ct.date.format');
}

export function MomentTray({ moment, birthDate, onClose, testID = 'ct-moment-tray' }: { moment: Milestone | null; birthDate: string; onClose: () => void; testID?: string }) {
  const edit = useCareEdit('child_milestones');
  if (!moment) return null;
  const tooth = moment.kind === 'tooth';
  const fields: HmField[] = [
    ...(tooth ? [] : [{ key: 'title', label: tr('ct.moment.titleField'), kind: 'text' as const, maxLength: 120 }]),
    { key: 'date', label: tr('ct.moment.dateField'), kind: 'date', hint: tr('ct.moment.dateHint') },
    { key: 'note', label: tr('ct.moment.noteField'), kind: 'multiline', maxLength: 4000 },
  ];
  const age = moment.happened_on && moment.happened_on >= birthDate ? childAge(birthDate, moment.happened_on).label : null;
  return (
    <HmFixTray open onOpenChange={(v) => { if (!v) onClose(); }} testID={testID}
      title={tooth ? tr('ct.teeth.trayTitle', { tooth: moment.title }) : moment.title}
      hero={moment.happened_on ? shortDate(moment.happened_on) : tr('ct.noDate')}
      lines={[moment.happened_on ? longDate(moment.happened_on) : null, age ? tr('ct.moment.ageAt', { age }) : null, moment.note ? tr('ct.note', { note: moment.note }) : null]}
      editLabel={tr('ct.fix')} editTitle={tooth ? tr('ct.teeth.fixTitle') : tr('ct.moment.fixTitle')}
      fields={fields}
      initial={{ title: moment.title, date: moment.happened_on ? toFrDate(moment.happened_on) : '', note: moment.note ?? '' }}
      validate={(d) => (!tooth && !d.title.trim() ? tr('ct.moment.titleRequired') : dateError(d.date, { required: tooth, min: birthDate }))}
      onSave={async (d) => {
        const err = (!tooth && !d.title.trim() ? tr('ct.moment.titleRequired') : null) ?? dateError(d.date, { required: tooth, min: birthDate });
        if (err) return err;
        const c = checkDate(d.date, todayISO(), { min: birthDate });
        const patch: Record<string, unknown> = {};
        const iso = c.ok ? c.iso : null;
        if (iso !== moment.happened_on) patch.happened_on = iso;
        const note = d.note.trim() || null;
        if (note !== moment.note) patch.note = note;
        if (!tooth && d.title.trim() !== moment.title) patch.title = d.title.trim().slice(0, 120);
        const res = await edit(moment.id, patch, moment as unknown as Record<string, unknown>);
        return res === 'changed' ? tr('ct.changedMeanwhile') : 'ok';
      }} />
  );
}
