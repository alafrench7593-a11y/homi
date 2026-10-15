/**
 * File d'attente hors connexion pour le suivi quotidien.
 * - Chaque entrée porte un `client_id` : la synchronisation est idempotente
 *   (renvoyer deux fois la même entrée ne crée pas de doublon).
 * - Une entrée refusée par le serveur (droits retirés, donnée invalide…)
 *   n'est JAMAIS supprimée silencieusement : elle passe dans « conflits »,
 *   visibles et récupérables dans Réglages > Synchronisation.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { create } from 'zustand';
import { backend, BackendError } from './backend';

export interface PendingOp {
  id: string;
  table: string;
  row: Record<string, unknown> & { client_id: string };
  queuedAt: string;
  error?: string;
}

const KEY = 'toietmoi.offline.v1';

interface OfflineState {
  online: boolean;
  pending: PendingOp[];
  conflicts: PendingOp[];
  syncing: boolean;
  setOnline: (v: boolean) => void;
}

export const useOfflineStore = create<OfflineState>((set) => ({
  online: true,
  pending: [],
  conflicts: [],
  syncing: false,
  setOnline: (online) => set({ online }),
}));

async function save() {
  const { pending, conflicts } = useOfflineStore.getState();
  await AsyncStorage.setItem(KEY, JSON.stringify({ pending, conflicts }));
}

export async function loadQueue() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) {
      const { pending, conflicts } = JSON.parse(raw);
      useOfflineStore.setState({ pending: pending ?? [], conflicts: conflicts ?? [] });
    }
  } catch {
    // file illisible : on n'écrase rien
  }
}

export async function enqueue(table: string, row: PendingOp['row']) {
  useOfflineStore.setState((s) => ({ pending: [...s.pending, { id: row.client_id, table, row, queuedAt: new Date().toISOString() }] }));
  await save();
}

/** Insère immédiatement si possible ; sinon met en file. Renvoie 'sent' | 'queued'. */
export async function insertOrQueue(table: string, row: PendingOp['row']): Promise<'sent' | 'queued'> {
  if (backend.mode === 'demo') {
    await backend.insert(table, row, { onConflict: 'client_id', ignoreDuplicates: true });
    return 'sent';
  }
  if (!useOfflineStore.getState().online) {
    await enqueue(table, row);
    return 'queued';
  }
  try {
    await backend.insert(table, row, { onConflict: 'client_id', ignoreDuplicates: true });
    return 'sent';
  } catch (e) {
    if (e instanceof BackendError && e.isNetwork) {
      await enqueue(table, row);
      return 'queued';
    }
    throw e;
  }
}

export async function flushQueue(): Promise<number> {
  const st = useOfflineStore.getState();
  if (st.syncing || !st.pending.length || backend.mode === 'demo') return 0;
  useOfflineStore.setState({ syncing: true });
  let sent = 0;
  const remaining: PendingOp[] = [];
  const conflicts: PendingOp[] = [...st.conflicts];
  for (const op of st.pending) {
    try {
      await backend.insert(op.table, op.row, { onConflict: 'client_id', ignoreDuplicates: true });
      sent++;
    } catch (e) {
      if (e instanceof BackendError && e.isNetwork) remaining.push(op);
      else conflicts.push({ ...op, error: e instanceof Error ? e.message : 'Erreur inconnue' });
    }
  }
  useOfflineStore.setState({ pending: remaining, conflicts, syncing: false });
  await save();
  return sent;
}

export async function retryConflict(id: string) {
  const op = useOfflineStore.getState().conflicts.find((c) => c.id === id);
  if (!op) return;
  useOfflineStore.setState((s) => ({ conflicts: s.conflicts.filter((c) => c.id !== id), pending: [...s.pending, { ...op, error: undefined }] }));
  await save();
  await flushQueue();
}

export async function discardConflict(id: string) {
  useOfflineStore.setState((s) => ({ conflicts: s.conflicts.filter((c) => c.id !== id) }));
  await save();
}

export function startOfflineSync(onSynced?: (n: number) => void) {
  loadQueue().then(() => flushQueue().then((n) => n && onSynced?.(n)));
  return NetInfo.addEventListener((state) => {
    const online = state.isConnected !== false && state.isInternetReachable !== false;
    const was = useOfflineStore.getState().online;
    useOfflineStore.getState().setOnline(online);
    if (online && !was) flushQueue().then((n) => n && onSynced?.(n));
  });
}
