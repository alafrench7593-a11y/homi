/**
 * Garde alternée — journée sélectionnée (22/11/2026). Même donnée que le calendrier (custody_plans +
 * custody_exceptions) :
 *  · « chez qui » le jour sélectionné en grand (jour gardé dans l'adresse « ?day= ») ; passation du jour, prochaine
 *    passation ; un jour modifié par une exception le dit ;
 *  · fiche du jour (Tray) : corriger « chez qui » ce jour-là (valeur provisoire, Annuler, Enregistrer verrouillé,
 *    brouillon gardé). Écrit une exception d'un jour (même table que « Ajouter une exception ») ; revenir au rythme
 *    habituel retire l'exception de ce jour. L'application reflète l'accord des parents, elle ne tranche rien.
 */
import React, { useState } from 'react';
import { GlassButton } from '@/components/glass';
import { formatDate, t as tr } from '@/i18n';
import { backend, eq } from '@/lib/backend';
import { useInvalidate } from '@/lib/data/hooks';
import type { CustodyExceptionRow, CustodyPlan } from '@/lib/data/hooks-tools6';
import { friendlyError } from '@/lib/data/hooks-settings';
import { cycleSide, nextHandover, sideOn, type Side } from '@/lib/domain/custody';
import { addDays } from '@/lib/domain/dates';
import { dayDate } from '@/lib/domain/journalTrack';
import { HmFixTray, HmHero } from './kit';

export function CustodyTrack({ plan, day, exceptions, handover, childName }: {
  plan: CustodyPlan; day: string; exceptions: readonly CustodyExceptionRow[]; handover: boolean; childName: string;
}) {
  const inv = useInvalidate();
  const [open, setOpen] = useState(false);
  const label = (s: Side) => (s === 'A' ? plan.label_a : plan.label_b);
  const ex = [...exceptions];
  const side = sideOn(plan, day, ex);
  const usual = cycleSide(plan, day);
  const oneDay = exceptions.find((e) => e.from_on === day && e.to_on === day) ?? null;
  const covering = exceptions.find((e) => e.from_on <= day && e.to_on >= day) ?? null;
  const next = nextHandover(plan, addDays(day, 1), ex);
  const time = plan.handover_time ? plan.handover_time.slice(0, 5) : null;
  const dayLabel = formatDate(dayDate(day), { weekday: 'long', day: 'numeric', month: 'long' });
  const lines = [
    handover ? tr('hm.cu.handover', { time: time ?? tr('cu.noTime') }) : null,
    covering ? tr('hm.cu.exception', { note: covering.note ?? tr('hm.cu.exceptionNoNote') }) : null,
    next ? tr('hm.cu.next', { date: formatDate(next.date, { weekday: 'short', day: 'numeric', month: 'short' }), side: label(next.side) }) : null,
  ];
  return (
    <>
      <HmHero testID="hm-cu-hero" value={label(side)} unit={tr('hm.cu.unit', { name: childName, day: dayLabel })} caption={lines.filter(Boolean).join(' · ') || null}>
        <GlassButton variant="secondary" icon="shuffle" label={tr('hm.cu.fix')} testID="hm-cu-open" onPress={() => setOpen(true)} />
      </HmHero>
      {open ? (
        <HmFixTray open onOpenChange={setOpen} testID="hm-cu-tray" title={dayLabel} hero={label(side)} lines={[tr('hm.cu.usual', { side: label(usual) }), ...lines]}
          editLabel={tr('hm.cu.fix')} editTitle={tr('hm.cu.fixTitle', { day: dayLabel })}
          fields={[{ key: 'side', label: tr('hm.cu.where'), kind: 'choice', options: [plan.label_a, plan.label_b] }, { key: 'note', label: tr('hm.fix.note'), kind: 'text', maxLength: 120 }]}
          initial={{ side: side === 'A' ? '0' : '1', note: oneDay?.note ?? '' }}
          onSave={async (d) => {
            const want: Side = d.side === '0' ? 'A' : 'B';
            const note = d.note.trim() || null;
            try {
              if (oneDay) {
                if (want === usual && !note) await backend.remove('custody_exceptions', [eq('id', oneDay.id)]);
                else await backend.update('custody_exceptions', { side: want, note }, [eq('id', oneDay.id)]);
              } else if (want !== side || note) {
                await backend.insert('custody_exceptions', { household_id: plan.household_id, plan_id: plan.id, from_on: day, to_on: day, side: want, note });
              }
              inv('custody_exceptions');
              return 'ok';
            } catch (e) { return friendlyError(e); }
          }} />
      ) : null}
    </>
  );
}
