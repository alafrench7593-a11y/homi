/** Cycle v2 : pertes, saignements inhabituels, journal, symptômes par date. Données strictement personnelles. */
import { backend, eq } from '@/lib/backend';
import { useUserId } from '@/lib/auth';
import { insertOrQueue } from '@/lib/offline';
import { useRows } from './hooks';
import type { SymptomLog } from './hooks-me';

export interface DischargeLog {
  id: string; user_id: string; observed_at: string; amount: string | null; color: string | null; textures: string[]; odor: string | null; symptoms: string[];
  recent_sex: boolean | null; contraception: boolean | null; pregnancy: string | null; intimate_product: boolean | null; antibiotics: boolean | null; note: string | null;
}
export interface BleedingLog { id: string; user_id: string; occurred_on: string; kind: string; amount: string | null; pain: boolean | null; pregnancy: string | null; note: string | null }
export interface JournalEntry { id: string; user_id: string; entry_on: string; body: string; mood: number | null; updated_at?: string }

export function useDischargeLogs(limit = 200) {
  const userId = useUserId();
  return useRows<DischargeLog>(['discharge_logs'], userId ? { table: 'discharge_logs', filters: [eq('user_id', userId)], order: [{ col: 'observed_at', asc: false }], limit } : null);
}
export function useBleedingLogs() {
  const userId = useUserId();
  return useRows<BleedingLog>(['bleeding_logs'], userId ? { table: 'bleeding_logs', filters: [eq('user_id', userId)], order: [{ col: 'occurred_on', asc: false }], limit: 200 } : null);
}
export function useCycleJournal() {
  const userId = useUserId();
  return useRows<JournalEntry>(['cycle_journal'], userId ? { table: 'cycle_journal', filters: [eq('user_id', userId)], order: [{ col: 'entry_on', asc: false }], limit: 400 } : null);
}
export function useAllSymptomLogs() {
  const userId = useUserId();
  return useRows<SymptomLog>(['symptom_logs', 'all'], userId ? { table: 'symptom_logs', filters: [eq('user_id', userId)], order: [{ col: 'logged_on', asc: false }], limit: 1000 } : null);
}

/** Création (fonctionne hors connexion : envoi différé) ou mise à jour d'une ligne personnelle. */
export async function saveOwn(table: string, row: Record<string, unknown>, id?: string | null) {
  if (id) return backend.update(table, row, [eq('id', id)]);
  return insertOrQueue(table, row);
}
export const removeOwn = (table: string, id: string) => backend.remove(table, [eq('id', id)]);
