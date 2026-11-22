/**
 * Échéances préparées d'avance — suivi (22/11/2026). Même donnée que la liste (family_prep + repères calculés) :
 *  · la prochaine échéance pas encore traitée en grand (« 12 jours », titre et date dessous), « à préparer /
 *    préparé / pas cette fois » ; tout est traité : « rien à préparer » en pointillé ;
 *  · une échéance traitée → sa fiche (Tray) : corriger son statut (préparé, pas cette fois, ou la rouvrir) en valeur
 *    provisoire, Annuler, Enregistrer verrouillé. Rouvrir ne supprime pas les tâches déjà créées (dit dans la fiche).
 */
import React, { useState } from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui';
import { formatDate, t as tr } from '@/i18n';
import { backend, eq } from '@/lib/backend';
import { useInvalidate } from '@/lib/data/hooks';
import type { FamilyPrep } from '@/lib/data/hooks-mental';
import { friendlyError } from '@/lib/data/hooks-settings';
import { daysUntil } from '@/lib/domain/homeTrack';
import { prepDue, type PrepItem } from '@/lib/domain/mentalLoad';
import { spacing } from '@/theme/tokens';
import { HmFixTray, HmHero, HmRow } from './kit';

const STATUS = ['prepared', 'skipped', 'open'] as const;

export function PrepTrack({ items, done, today, title, hid }: { items: readonly PrepItem[]; done: readonly FamilyPrep[]; today: string; title: (it: PrepItem) => string; hid: string | null }) {
  const inv = useInvalidate();
  const [openKey, setOpenKey] = useState<string | null>(null);
  const rowOf = (it: PrepItem) => done.find((d) => d.key === it.key && d.occurs_on === it.occursOn) ?? null;
  const pending = items.filter((it) => !rowOf(it));
  const next = [...pending].sort((a, b) => (a.occursOn < b.occursOn ? -1 : 1))[0] ?? null;
  const handled = items.filter((it) => rowOf(it));
  const opened = openKey ? items.find((it) => `${it.key}-${it.occursOn}` === openKey) ?? null : null;
  const openedRow = opened ? rowOf(opened) : null;
  const statusLabel = (s: (typeof STATUS)[number]) => tr(s === 'prepared' ? 'cm.prep.isPrepared' : s === 'skipped' ? 'cm.prep.isSkipped' : 'hm.prep.reopen');
  if (!items.length) return null;
  return (
    <View style={{ gap: spacing.sm }} testID="hm-prep">
      <HmHero testID="hm-prep-hero" value={next ? String(Math.max(0, daysUntil(today, next.occursOn))) : null} emptyLabel={tr('hm.prep.none')}
        unit={next ? tr('hm.prep.unit', { count: Math.max(0, daysUntil(today, next.occursOn)), title: title(next), date: formatDate(next.occursOn, { day: 'numeric', month: 'long' }) }) : null}
        split={[
          { label: tr('hm.prep.toDo'), value: String(pending.filter((it) => prepDue(it, today)).length), testID: 'hm-prep-todo' },
          { label: tr('hm.prep.prepared'), value: String(done.filter((d) => d.status === 'prepared' && items.some((it) => it.key === d.key && it.occursOn === d.occurs_on)).length), testID: 'hm-prep-done' },
          { label: tr('hm.prep.skipped'), value: String(done.filter((d) => d.status === 'skipped' && items.some((it) => it.key === d.key && it.occursOn === d.occurs_on)).length), testID: 'hm-prep-skipped' },
        ]} />
      {handled.length ? (
        <View testID="hm-prep-handled">
          <Text variant="label" muted>{tr('hm.prep.handled')}</Text>
          {handled.map((it) => (
            <HmRow key={`${it.key}-${it.occursOn}`} time={formatDate(it.occursOn, { day: 'numeric', month: 'short' })} icon={rowOf(it)!.status === 'prepared' ? 'check-circle' : 'skip-forward'}
              title={title(it)} detail={statusLabel(rowOf(it)!.status)} testID={`hm-prep-row-${it.key}`} onPress={() => setOpenKey(`${it.key}-${it.occursOn}`)} />
          ))}
        </View>
      ) : null}
      {opened && openedRow ? (
        <HmFixTray open onOpenChange={(v) => { if (!v) setOpenKey(null); }} testID="hm-prep-tray"
          title={title(opened)} hero={statusLabel(openedRow.status)} lines={[formatDate(opened.occursOn, { weekday: 'long', day: 'numeric', month: 'long' }), tr('hm.prep.tasksKept')]}
          editLabel={tr('hm.prep.fix')}
          fields={[{ key: 'status', label: tr('hm.prep.status'), kind: 'choice', options: STATUS.map(statusLabel) }]}
          initial={{ status: String(STATUS.indexOf(openedRow.status)) }}
          onSave={async (d) => {
            if (!hid) return tr('hm.err.noHousehold');
            const s = STATUS[Number(d.status)] ?? 'open';
            try {
              if (s === 'open') await backend.remove('family_prep', [eq('id', openedRow.id)]);
              else await backend.update('family_prep', { status: s }, [eq('id', openedRow.id)]);
              inv('family_prep');
              return 'ok';
            } catch (e) { return friendlyError(e); }
          }} />
      ) : null}
    </View>
  );
}
