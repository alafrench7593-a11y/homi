/**
 * Traitements de la maman (07/11/2026) et prises du jour de toute la famille.
 * Même règle que pour les enfants : le nom et la dose sont RECOPIÉS de l'ordonnance ou de la notice ;
 * l'application ne calcule, ne propose ni ne modifie aucune dose. Données strictement personnelles.
 */
import { useMutation } from '@tanstack/react-query';
import { t as tr } from '@/i18n';
import { backend, BackendError, eq, gte, inList } from '../backend';
import { withIdempotentId } from '../idempotency';
import { useHouseholdId, useInvalidate, useRows } from './hooks';
import { syncLocalReminders, cancelDoseFollowUp } from '../notifications';
import { loadDeviceReminders } from './deviceReminders';
import { useUserId } from '../auth';
import { insertOrQueue } from '../offline';
import type { Treatment, TreatmentLog } from './hooks-needs';

export interface MyTreatment extends Omit<Treatment, 'household_id' | 'child_id'> { user_id: string }
export interface MyTreatmentLog extends Omit<TreatmentLog, 'household_id'> { user_id: string }
export type TreatmentRow = Omit<Treatment, 'id' | 'household_id' | 'created_at' | 'child_id'>;

export function useMyTreatments() {
  const uid = useUserId();
  return useRows<MyTreatment>(['my_treatments', uid ?? ''], uid ? { table: 'my_treatments', filters: [eq('user_id', uid)], order: [{ col: 'created_at', asc: true }] } : null);
}
export function useMyTreatmentLogs(treatmentIds: string[], sinceISO: string) {
  return useRows<MyTreatmentLog>(['my_treatment_logs', treatmentIds.join(','), sinceISO], treatmentIds.length ? { table: 'my_treatment_logs', filters: [inList('treatment_id', treatmentIds), gte('scheduled_for', sinceISO)], order: [{ col: 'scheduled_for', asc: true }] } : null);
}
/** Tous les traitements d'enfants que je peux voir (la sécurité du serveur limite aux enfants de mes foyers). */
export function useFamilyChildTreatments() {
  const hid = useHouseholdId();
  return useRows<Treatment>(['child_treatments', 'family', hid ?? ''], hid ? { table: 'child_treatments', filters: [eq('household_id', hid)], order: [{ col: 'created_at', asc: true }] } : null);
}

/** Un rappel par heure de prise ; le texte de la notification sur l'écran verrouillé reste neutre. */
export function myTreatmentReminderRows(t: MyTreatment, userId: string, householdId: string | null) {
  if (t.frequency === 'as_prescribed') return [];
  return t.times.map((hm) => {
    const [hour, minute] = hm.split(':').map(Number);
    const schedule = t.frequency === 'weekly' && t.weekdays.length
      ? { type: 'weekly' as const, weekdays: t.weekdays, hour, minute, from: t.start_date, until: t.end_date }
      : { type: 'daily' as const, hour, minute, from: t.start_date, until: t.end_date };
    return {
      user_id: userId, household_id: householdId, child_id: null, my_treatment_id: t.id, journey_type: null,
      category: 'medication', title: t.name, body: t.dose_text,
      schedule, enabled: t.active, deep_link: `/medications?who=me&dose=${encodeURIComponent(hm)}`,
    };
  });
}

async function resync(userId: string | null) {
  if (!userId) return;
  // Hors connexion après l'enregistrement : la resynchronisation se fera à la prochaine ouverture (pas d'erreur affichée à tort)
  await loadDeviceReminders(userId).then((rows) => syncLocalReminders(rows)).catch(() => undefined);
}

export function useSaveMyTreatment() {
  const userId = useUserId();
  const hid = useHouseholdId();
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (v: { id?: string | null; reminders: boolean; row: TreatmentRow }) => {
      let saved: MyTreatment;
      if (v.id) saved = (await backend.update<MyTreatment>('my_treatments', v.row as unknown as Record<string, unknown>, [eq('id', v.id)]))[0];
      else {
        // Audit 08 : traitement créé mais rappels en échec (ou réponse perdue) → « Réessayer » reprend le MÊME traitement
        // (id stable tant que l'enregistrement complet n'a pas abouti) au lieu d'en créer un second.
        const insert = { ...v.row, user_id: userId };
        saved = await withIdempotentId('my_treatments', { insert, reminders: v.reminders }, async (id) => {
          await backend.insert<MyTreatment>('my_treatments', { id, ...insert }, { onConflict: 'id', ignoreDuplicates: true });
          const [row] = await backend.select<MyTreatment>({ table: 'my_treatments', filters: [eq('id', id)], limit: 1 });
          if (!row) throw new BackendError(tr('l2.sb.generic'));
          // Rappels remplacés (jamais deux rappels pour une même prise), DANS l'essai : un échec garde l'id pour le suivant
          await backend.remove('reminders', [eq('my_treatment_id', row.id)]);
          const rem = v.reminders && row.active && userId ? myTreatmentReminderRows(row, userId, hid ?? null) : [];
          if (rem.length) await backend.insert('reminders', rem);
          return row;
        });
        await resync(userId);
        return saved;
      }
      // Rappels remplacés à chaque modification (jamais deux rappels pour une même prise)
      await backend.remove('reminders', [eq('my_treatment_id', saved.id)]);
      const rem = v.reminders && saved.active && userId ? myTreatmentReminderRows(saved, userId, hid ?? null) : [];
      if (rem.length) await backend.insert('reminders', rem);
      await resync(userId);
      return saved;
    },
    onSuccess: () => inv('my_treatments', 'reminders'),
  });
}
export function useDeleteMyTreatment() {
  const userId = useUserId();
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (id: string) => {
      await backend.remove('reminders', [eq('my_treatment_id', id)]); // le serveur le fait aussi (cascade) ; la démo non
      await backend.remove('my_treatments', [eq('id', id)]);
      await resync(userId);
    },
    onSuccess: () => inv('my_treatments', 'my_treatment_logs', 'reminders'),
  });
}
export function useLogMyDose() {
  const userId = useUserId();
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (v: { treatment_id: string; scheduled_for: string; status: MyTreatmentLog['status']; note?: string | null; existingId?: string | null }) => {
      // Hors connexion : gardée sur le téléphone, envoyée au retour du réseau (une réponse par prise)
      const res = await insertOrQueue('my_treatment_logs', { status: v.status, note: v.note ?? null, treatment_id: v.treatment_id, scheduled_for: v.scheduled_for, user_id: userId },
        { conflict: 'treatment_id,scheduled_for', merge: true });
      if (v.status !== 'snoozed') await cancelDoseFollowUp(v.treatment_id, v.scheduled_for).catch(() => undefined);
      return res;
    },
    onSuccess: () => inv('my_treatment_logs'),
  });
}
/** Décocher une prise (« Ma journée », écran Médicaments) : la réponse notée est retirée. */
export function useUnlogDose() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: (v: { table: 'treatment_logs' | 'my_treatment_logs'; id: string }) => backend.remove(v.table, [eq('id', v.id)]),
    onSuccess: () => inv('treatment_logs', 'my_treatment_logs'),
  });
}

/** Prises notées depuis le début de la journée (enfants + moi) : « Ma journée », relances, écran Médicaments. */
export function useDoseLogsSince(sinceISO: string) {
  const uid = useUserId();
  const child = useRows<TreatmentLog>(['treatment_logs', 'since', sinceISO], uid ? { table: 'treatment_logs', filters: [gte('scheduled_for', sinceISO)] } : null);
  const mine = useRows<MyTreatmentLog>(['my_treatment_logs', 'since', uid ?? '', sinceISO], uid ? { table: 'my_treatment_logs', filters: [eq('user_id', uid), gte('scheduled_for', sinceISO)] } : null);
  return { child: child.data, mine: mine.data, loaded: !!child.data && !!mine.data };
}
