/**
 * File d'attente hors connexion pour toutes les saisies (suivi bébé, règles, symptômes, humeur…).
 * - Chaque entrée porte un `client_id` (tables de suivi) ou un `id` généré sur l'appareil :
 *   la synchronisation est idempotente
 *   (renvoyer deux fois la même entrée ne crée pas de doublon).
 * - Une entrée refusée par le serveur (droits retirés, donnée invalide…)
 *   n'est JAMAIS supprimée silencieusement : elle passe dans « conflits »,
 *   visibles et récupérables dans Réglages > Synchronisation.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { AppState } from 'react-native';
import { create } from 'zustand';
import { backend, BackendError } from './backend';
import { t as tr } from '@/i18n';

export interface PendingOp {
  id: string;
  table: string;
  row: Record<string, unknown>;
  queuedAt: string;
  error?: string;
  /** Colonne(s) d'unicité utilisée(s) pour l'envoi (par défaut client_id, sinon id). */
  conflict?: string;
  /** Vrai : la saisie remplace l'existante (ex. une observation par jour). */
  merge?: boolean;
  /** Compte qui a fait la saisie : jamais envoyée ni montrée sous un autre compte. */
  owner?: string | null;
}

function uuidLike(): string {
  const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (c?.randomUUID) return c.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (ch) => {
    const r = (Math.random() * 16) | 0;
    return (ch === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

async function send(op: Pick<PendingOp, 'table' | 'row' | 'conflict' | 'merge'>) {
  const conflict = op.conflict ?? ('client_id' in op.row ? 'client_id' : 'id');
  await backend.insert(op.table, op.row, { onConflict: conflict, ignoreDuplicates: !op.merge });
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

/** Compte connecté sur ce téléphone (null : personne). */
let queueOwner: string | null = null;

/**
 * Appelé à chaque changement de session. Si un AUTRE compte se connecte, les saisies en attente
 * du compte précédent sont effacées de ce téléphone : elles ne sont ni envoyées sous la mauvaise
 * session, ni affichées à quelqu'un d'autre (téléphone partagé, coparent).
 */
export async function setQueueOwner(userId: string | null) {
  await adoptQueueOwner(userId);
  // La session arrive APRÈS le chargement de la file au démarrage : on envoie ici ce qui attendait
  if (userId) void flushQueue().then((n) => n && onSyncedCb?.(n));
}

async function adoptQueueOwner(userId: string | null) {
  queueOwner = userId;
  if (!userId) return;
  const { pending, conflicts } = useOfflineStore.getState();
  const mine = (op: PendingOp) => op.owner == null || op.owner === userId;
  if (pending.every(mine) && conflicts.every(mine)) {
    // anciennes saisies sans compte noté : rattachées au compte connecté (elles ont été faites avant la mise à jour)
    if (pending.some((o) => o.owner == null) || conflicts.some((o) => o.owner == null)) {
      useOfflineStore.setState({ pending: pending.map((o) => ({ ...o, owner: o.owner ?? userId })), conflicts: conflicts.map((o) => ({ ...o, owner: o.owner ?? userId })) });
      await save();
    }
    return;
  }
  useOfflineStore.setState({ pending: pending.filter(mine), conflicts: conflicts.filter(mine) });
  await save();
}

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
      if (queueOwner) await adoptQueueOwner(queueOwner); // chargée après la connexion : même filtre
    }
  } catch {
    // file illisible : on n'écrase rien
  }
}

export async function enqueue(table: string, row: PendingOp['row'], opts: { conflict?: string; merge?: boolean } = {}) {
  const id = String(row.client_id ?? row.id ?? uuidLike());
  useOfflineStore.setState((s) => ({ pending: [...s.pending, { id, table, row, queuedAt: new Date().toISOString(), owner: queueOwner, ...opts }] }));
  await save();
}

/**
 * Enregistre tout de suite si possible ; sinon met en file (sans perte), envoi au retour du réseau.
 * Une ligne sans `client_id` reçoit un `id` généré sur l'appareil (envoi répété sans doublon).
 * Renvoie 'sent' | 'queued'.
 */
export async function insertOrQueue(table: string, input: Record<string, unknown>, opts: { conflict?: string; merge?: boolean } = {}): Promise<'sent' | 'queued'> {
  const row = 'client_id' in input || 'id' in input || opts.conflict ? input : { id: uuidLike(), ...input };
  const op = { table, row, ...opts };
  if (backend.mode === 'demo') {
    await send(op);
    return 'sent';
  }
  if (!useOfflineStore.getState().online) {
    await enqueue(table, row, opts);
    return 'queued';
  }
  try {
    await send(op);
    return 'sent';
  } catch (e) {
    if (e instanceof BackendError && e.isNetwork) {
      await enqueue(table, row, opts);
      return 'queued';
    }
    throw e;
  }
}

export async function flushQueue(): Promise<number> {
  const st = useOfflineStore.getState();
  if (st.syncing || !st.pending.length || backend.mode === 'demo' || !queueOwner) return 0;
  useOfflineStore.setState({ syncing: true });
  let sent = 0;
  const batch = st.pending;
  const processed = new Set(batch.map((op) => op.id));
  const remaining: PendingOp[] = [];
  const newConflicts: PendingOp[] = [];
  for (const op of batch) {
    if (op.owner != null && op.owner !== queueOwner) { remaining.push(op); continue; } // jamais sous une autre session
    try {
      await send(op);
      sent++;
    } catch (e) {
      if (e instanceof BackendError && e.isNetwork) remaining.push(op);
      else newConflicts.push({ ...op, error: e instanceof Error ? e.message : tr('l6.offline.unknownError') });
    }
  }
  // F-01 (QA 02/11/2026, P0) : on FUSIONNE avec l'état courant. Remplacer la file par la copie prise au départ
  // effaçait sans trace les saisies mises en file pendant l'envoi (réseau instable).
  const now = useOfflineStore.getState();
  const arrived = now.pending.filter((op) => !processed.has(op.id));
  useOfflineStore.setState({ pending: [...remaining, ...arrived], conflicts: [...now.conflicts, ...newConflicts], syncing: false });
  await save();
  // Saisies arrivées pendant l'envoi : nouvel envoi si le réseau est là
  if (arrived.length && useOfflineStore.getState().online) sent += await flushQueue();
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

let onSyncedCb: ((n: number) => void) | undefined;

export function startOfflineSync(onSynced?: (n: number) => void) {
  onSyncedCb = onSynced;
  loadQueue().then(() => flushQueue().then((n) => n && onSynced?.(n)));
  const offNet = NetInfo.addEventListener((state) => {
    const online = state.isConnected !== false && state.isInternetReachable !== false;
    const was = useOfflineStore.getState().online;
    useOfflineStore.getState().setOnline(online);
    if (online && !was) flushQueue().then((n) => n && onSynced?.(n));
  });
  // Retour de l'appli au premier plan : on retente l'envoi de ce qui attend encore
  const appSub = AppState.addEventListener('change', (st) => {
    if (st === 'active' && useOfflineStore.getState().online) flushQueue().then((n) => n && onSynced?.(n));
  });
  return () => {
    offNet();
    appSub.remove();
    if (onSyncedCb === onSynced) onSyncedCb = undefined;
  };
}
