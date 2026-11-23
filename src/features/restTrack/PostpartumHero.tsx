/**
 * Après la naissance — donnée principale (22/11/2026). Lit les réglages du post-partum (`postpartum_settings` : date
 * de naissance) et les points du jour (`postpartum_checkins`) ; rien n'est recopié :
 *  · « J+12 » en grand (jours depuis la naissance), sinon « Rien de noté » ; points notés sur sept jours (jamais une
 *    moyenne), point du jour noté ou non ;
 *  · fiche (Tray) : corriger la date de naissance — valeur PROVISOIRE, Annuler, Enregistrer verrouillé, brouillon
 *    gardé si l'écriture échoue ; même écriture que l'ancien champ de l'écran (`useSaveSettings`).
 */
import React, { useState } from 'react';
import { GlassButton } from '@/components/glass';
import { formatDate, t as tr } from '@/i18n';
import { useSaveSettings } from '@/lib/data/hooks-postpartum';
import { friendlyError } from '@/lib/data/hooks-settings';
import { frDayToIso, isoToFrDay, shiftDay } from '@/lib/domain/journalTrack';
import { daysSinceBirth, notedDays } from '@/lib/domain/restTrack';
import { HmFixTray, HmHero } from '@/features/homeTrack/kit';

export function PostpartumHero({ delivery, hasSettings, checkins, today }: {
  delivery: string | null | undefined; hasSettings: boolean; checkins: readonly { checkin_date: string }[]; today: string;
}) {
  const save = useSaveSettings();
  const [open, setOpen] = useState(false);
  const since = daysSinceBirth(delivery, today);
  const week = Array.from({ length: 7 }, (_, i) => shiftDay(today, -i));
  const noted = notedDays(checkins, week);
  const todayNoted = checkins.some((c) => c.checkin_date === today);
  const dateLabel = delivery ? formatDate(`${delivery}T12:00:00`, { day: 'numeric', month: 'long', year: 'numeric' }) : null;
  return (
    <>
      <HmHero testID="rs-pp-hero" value={since != null ? tr('rs.pp.day', { n: since }) : null}
        unit={dateLabel ? tr('rs.pp.since', { date: dateLabel }) : null} emptyLabel={tr('rs.pp.noDate')}
        split={[
          { label: tr('rs.pp.today'), value: todayNoted ? tr('rs.pp.noted') : tr('rs.pp.notNoted'), testID: 'rs-pp-today' },
          { label: tr('rs.pp.week'), value: tr('rs.pp.weekValue', { n: noted }), testID: 'rs-pp-week' },
        ]}>
        <GlassButton variant="secondary" icon={delivery ? 'edit-2' : 'calendar'} label={delivery ? tr('rs.pp.fixDate') : tr('rs.pp.addDate')} testID="rs-pp-fix" onPress={() => setOpen(true)} />
      </HmHero>
      {open ? (
        <HmFixTray open onOpenChange={setOpen} testID="rs-pp-tray" title={tr('rs.pp.trayTitle')} hero={since != null ? tr('rs.pp.day', { n: since }) : tr('rs.nothing')}
          lines={[dateLabel ? tr('rs.pp.born', { date: dateLabel }) : tr('rs.pp.noDate'), tr('rs.pp.private')]}
          editLabel={delivery ? undefined : tr('rs.pp.addDate')} editTitle={tr('rs.pp.fixTitle')}
          fields={[{ key: 'date', label: tr('rs.pp.dateLabel'), kind: 'date' }]}
          initial={{ date: delivery ? isoToFrDay(delivery) : '' }}
          validate={(d) => { const iso = frDayToIso(d.date); return iso && iso <= today ? null : tr('rs.pp.badDate'); }}
          onSave={async (d) => {
            const iso = frDayToIso(d.date);
            if (!iso || iso > today) return tr('rs.pp.badDate');
            try { await save.mutateAsync({ existing: hasSettings, patch: { delivery_date: iso } }); return 'ok'; } catch (e) { return friendlyError(e); }
          }} />
      ) : null}
    </>
  );
}
