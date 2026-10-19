/**
 * Exécution des opérations de parcours produites par src/lib/journeys/model.ts (logique pure).
 * Les contraintes d'unicité et la coupure des rappels sont aussi garanties côté serveur (index + déclencheur SQL).
 */
import { useCallback, useState } from 'react';
import { backend, eq } from '../backend';
import { useInvalidate } from '../data/hooks';
import { useUserId } from '../auth';
import type { Reminder } from '../types';
import { syncLocalReminders } from '../notifications';
import type { Op } from './model';

export async function runOps(ops: Op[]): Promise<void> {
  for (const op of ops) {
    switch (op.kind) {
      case 'insert': {
        const many = op.row.__many as Record<string, unknown>[] | undefined;
        if (many) { if (many.length) await backend.insert(op.table, many); }
        // Ligne avec identifiant fixé (grossesse, enfant) : un nouvel essai après un échec ne crée jamais de doublon
        else if (op.row.id) await backend.insert(op.table, op.row, { onConflict: 'id', ignoreDuplicates: true });
        else await backend.insert(op.table, op.row);
        break;
      }
      case 'update': await backend.update(op.table, op.patch, [eq('id', op.id)]); break;
      case 'delete': await backend.remove(op.table, [eq('id', op.id)]); break;
      case 'deleteWhere': await backend.remove(op.table, [eq(op.col, op.value)]); break;
      case 'rpc': await backend.rpc(op.name, op.args ?? {}); break;
    }
  }
}

export const JOURNEY_KEYS = ['user_journeys', 'profiles', 'profile', 'pregnancies', 'expected_babies', 'children', 'reminders', 'maternal_weights', 'cycle', 'periods', 'postpartum', 'checklists', 'appointments'];

/** Exécute un plan puis recalcule l'accueil, les outils et les notifications locales. */
export function useRunJourneyOps() {
  const invalidate = useInvalidate();
  const userId = useUserId();
  const [busy, setBusy] = useState(false);
  const run = useCallback(async (ops: Op[]) => {
    setBusy(true);
    try {
      await runOps(ops);
      await invalidate(...JOURNEY_KEYS);
      try {
        const reminders = userId ? await backend.select<Reminder>({ table: 'reminders', filters: [eq('user_id', userId)] }) : [];
        await syncLocalReminders(reminders);
      } catch { /* notifications locales indisponibles (web) : le serveur a déjà coupé les rappels */ }
    } finally { setBusy(false); }
  }, [invalidate, userId]);
  return { run, busy };
}
