/**
 * Traitements de l'enfant — prises des 7 derniers jours (22/11/2026). Réutilise le geste de « Médicaments »
 * (`DoseDay` : « 2 / 3 » prises notées, barres par jour, case à cocher en un geste, fiche Tray de correction du statut
 * et de l'heure réelle) avec les MÊMES lignes (`treatments`, `treatment_logs`), limitées à cet enfant ; le jour
 * choisi reste dans l'adresse (`?day=`). Aucune dose n'est proposée, calculée ni modifiée.
 */
import React, { useMemo } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { useToast } from '@/components/Overlays';
import { haptic } from '@/components/ui';
import { DoseDay, type DoseAnswer, type DoseRow } from '@/features/healthTrack/DoseDay';
import { dosesFor } from '@/features/needs';
import { t as tr } from '@/i18n';
import { useNow } from '@/lib/data/hooks-bottle';
import { useLogDose } from '@/lib/data/hooks-needs';
import { useDoseLogsSince, useFamilyChildTreatments, useUnlogDose } from '@/lib/data/hooks-myTreatments';
import { friendlyError } from '@/lib/data/hooks-settings';
import { dayStarts } from '@/lib/domain/healthTrack';
import { dayKey } from '@/lib/domain/quickTrack';
import type { Child } from '@/lib/types';

export function ChildDoseTrack({ child }: { child: Pick<Child, 'id' | 'first_name'> }) {
  const params = useLocalSearchParams<{ day?: string }>();
  const toast = useToast();
  const now = useNow(60_000);
  const starts = useMemo(() => dayStarts(now, 7), [now.toDateString()]); // eslint-disable-line react-hooks/exhaustive-deps
  const all = useFamilyChildTreatments().data ?? [];
  const mine = useMemo(() => all.filter((x) => x.child_id === child.id), [all, child.id]);
  const logs = useDoseLogsSince(starts[0].toISOString());
  const logChild = useLogDose();
  const unlog = useUnlogDose();
  const days = useMemo(() => starts.map((dayStart) => ({
    day: dayKey(dayStart),
    rows: dosesFor(dayStart, mine, logs.child ?? []).map((d): DoseRow => ({
      key: `${child.id}-${d.treatment.id}-${d.scheduledFor}`, time: d.time, who: child.first_name, childId: child.id, name: d.treatment.name,
      dose: d.treatment.dose_text, treatmentId: d.treatment.id, scheduledFor: d.scheduledFor, log: d.log,
    })).sort((a, b) => a.time.localeCompare(b.time)),
  })), [starts, mine, logs.child, child.id, child.first_name]);
  const today = days[days.length - 1];
  const selected = days.find((d) => d.day === params.day) ?? today;
  if (!mine.length) return null;
  // Première réponse (case ou fiche) : même chemin que « Médicaments », file hors connexion comprise
  const answer: DoseAnswer = async (r, at, status) => {
    const res = await logChild.mutateAsync({ treatment_id: r.treatmentId, scheduled_for: r.scheduledFor, status, existingId: r.log?.id, logged_at: (at ?? new Date()).toISOString() });
    if (res === 'queued') toast(tr('u7.track.queued'), 'info');
  };
  async function toggle(r: DoseRow) {
    haptic('success');
    try {
      if (r.log?.status === 'taken') await unlog.mutateAsync({ table: 'treatment_logs', id: r.log.id });
      else await answer(r, undefined, 'taken');
    } catch (e) { toast(friendlyError(e), 'error'); }
  }
  return (
    <DoseDay days={days} selected={selected.day} onSelectDay={(day) => router.setParams({ day } as never)} rows={selected.rows}
      onToggle={(r) => void toggle(r)} onAnswer={answer} isToday={selected.day === today.day} />
  );
}
