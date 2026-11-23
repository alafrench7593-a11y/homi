/**
 * Séances de comptage des mouvements du bébé (22/11/2026) : lecture et écritures dans la table EXISTANTE
 * `pregnancy_symptom_logs` (symptôme `kick_count`, voir src/lib/domain/pregTrack.ts). Même chemin d'écriture que
 * « Comment je me sens » (backend + invalidation `pregnancy_symptom_logs`). Données strictement personnelles.
 */
import { useMutation } from '@tanstack/react-query';
import { backend, eq, inList } from '../backend';
import { useUserId } from '../auth';
import { uuid } from '../uuid';
import { useInvalidate, useRows } from './hooks';
import { countPlan, KICK, type KickRow, type KickSession } from '../domain/pregTrack';

/** Lignes `kick_count` de la personne (séances et mouvements), les plus récentes d'abord. */
export function useKickRows(limit = 600) {
  const uid = useUserId();
  return useRows<KickRow>(['pregnancy_symptom_logs', 'kicks', uid ?? ''], uid ? {
    table: 'pregnancy_symptom_logs', filters: [eq('user_id', uid), eq('symptom', KICK)], order: [{ col: 'logged_at', asc: false }], limit,
  } : null);
}

const base = (p: { pregnancyId: string | null; week: number | null }) => ({ symptom: KICK, pregnancy_id: p.pregnancyId, week_sa: p.week, intensity: null });

export type KickOp =
  | { op: 'start'; pregnancyId: string | null; week: number | null; at: Date }
  | { op: 'tap'; session: KickSession; at: Date }
  | { op: 'undo'; session: KickSession }
  | { op: 'end'; session: KickSession; at: Date }
  | { op: 'correct'; session: KickSession; start: Date; end: Date | null; count: number; note: string | null }
  | { op: 'delete'; session: KickSession };

/**
 * Une seule mutation pour toutes les écritures d'une séance (l'écran verrouille le double appui ; un identifiant
 * posé sur l'appareil évite tout doublon si l'envoi est rejoué).
 */
export function useKickWrite() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async (o: KickOp) => {
      const T = 'pregnancy_symptom_logs';
      if (o.op === 'start') {
        const iso = o.at.toISOString();
        await backend.insert(T, { id: uuid(), ...base(o), frequency: 'continuous', started_at: iso, logged_at: iso, note: null });
        return;
      }
      const s = o.session;
      const link = { pregnancy_id: s.header.pregnancy_id ?? null, week: s.header.week_sa ?? null };
      if (o.op === 'tap') {
        await backend.insert(T, { id: uuid(), ...base({ pregnancyId: link.pregnancy_id, week: link.week }), frequency: 'once', started_at: s.start, logged_at: o.at.toISOString(), note: null });
        return;
      }
      if (o.op === 'undo') {
        const last = s.taps[s.taps.length - 1];
        if (last) await backend.remove(T, [eq('id', last.id)]);
        return;
      }
      if (o.op === 'end') {
        await backend.update(T, { frequency: 'several', logged_at: o.at.toISOString() }, [eq('id', s.id)]);
        return;
      }
      if (o.op === 'delete') {
        const ids = [s.id, ...s.taps.map((x) => x.id)];
        await backend.remove(T, [inList('id', ids)]);
        return;
      }
      // correction : en-tête (début, fin, note), lien des mouvements si le début change, puis le compte
      const startIso = o.start.toISOString();
      const moved = Date.parse(startIso) !== Date.parse(s.start);
      await backend.update(T, {
        started_at: startIso, note: o.note,
        ...(o.end ? { frequency: 'several', logged_at: o.end.toISOString() } : { logged_at: startIso }),
      }, [eq('id', s.id)]);
      const plan = countPlan(s.taps, o.count);
      const kept = s.taps.filter((x) => !plan.remove.includes(x.id));
      if (moved && kept.length) await backend.update(T, { started_at: startIso }, [inList('id', kept.map((x) => x.id))]);
      if (plan.remove.length) await backend.remove(T, [inList('id', plan.remove)]);
      if (plan.add) {
        const at = (o.end ?? new Date()).toISOString();
        await backend.insert(T, Array.from({ length: plan.add }, () => ({ id: uuid(), ...base({ pregnancyId: link.pregnancy_id, week: link.week }), frequency: 'once', started_at: startIso, logged_at: at, note: null })));
      }
    },
    // même après un échec partiel : l'écran relit la donnée réelle
    onSettled: () => inv('pregnancy_symptom_logs'),
  });
}
