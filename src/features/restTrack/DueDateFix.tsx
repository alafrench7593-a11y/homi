/**
 * Semaine de grossesse — correction du terme dans une fiche (22/11/2026). La semaine affichée se CALCULE à partir du
 * terme enregistré (`pregnancies.due_date`) : c'est la seule donnée à corriger. Même écriture que « Modifier ma
 * grossesse » (source « date du terme saisie ») ; valeur PROVISOIRE, Annuler, Enregistrer verrouillé, brouillon gardé
 * si l'écriture échoue. Aucune estimation médicale : la semaine suit la date saisie.
 */
import React, { useState } from 'react';
import { router } from 'expo-router';
import { GlassButton } from '@/components/glass';
import { formatDate, t as tr } from '@/i18n';
import { backend, eq } from '@/lib/backend';
import { useInvalidate } from '@/lib/data/hooks';
import { friendlyError } from '@/lib/data/hooks-settings';
import { frDayToIso, isoDay, isoToFrDay, shiftDay } from '@/lib/domain/journalTrack';
import { pregnancyProgress } from '@/lib/domain/pregnancy';
import { HmFixTray } from '@/features/homeTrack/kit';

interface PregLike { id: string; due_date: string; due_date_source?: string | null }

/** Terme plausible : entre aujourd'hui − 4 semaines et aujourd'hui + 44 semaines. */
const dueOk = (iso: string | null) => {
  if (!iso) return false;
  const today = isoDay(new Date());
  return iso >= shiftDay(today, -28) && iso <= shiftDay(today, 308);
};

export function DueDateFix({ pregnancy }: { pregnancy: PregLike }) {
  const inv = useInvalidate();
  const [open, setOpen] = useState(false);
  const p = pregnancyProgress(pregnancy.due_date);
  const due = formatDate(pregnancy.due_date, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  return (
    <>
      <GlassButton variant="secondary" icon="edit-2" label={tr('rs.preg.fix')} testID="rs-preg-fix" onPress={() => setOpen(true)} />
      {open ? (
        <HmFixTray open onOpenChange={setOpen} testID="rs-preg-tray" title={tr('rs.preg.trayTitle')} hero={tr('rs.preg.week', { n: p.weeksSA })}
          lines={[tr('rs.preg.due', { date: due }), tr('rs.preg.computed')]}
          editTitle={tr('rs.preg.fixTitle')}
          onFullForm={() => router.push('/pregnancy/edit')}
          fields={[{ key: 'due', label: tr('rs.preg.dueLabel'), kind: 'date', hint: tr('rs.preg.dueHint') }]}
          initial={{ due: isoToFrDay(pregnancy.due_date.slice(0, 10)) }}
          validate={(d) => (dueOk(frDayToIso(d.due)) ? null : tr('rs.preg.badDue'))}
          onSave={async (d) => {
            const iso = frDayToIso(d.due);
            if (!dueOk(iso)) return tr('rs.preg.badDue');
            try {
              await backend.update('pregnancies', { due_date: iso, lmp_date: null, due_date_source: 'due_date' }, [eq('id', pregnancy.id)]);
              inv('pregnancies');
              return 'ok';
            } catch (e) { return friendlyError(e); }
          }} />
      ) : null}
    </>
  );
}
