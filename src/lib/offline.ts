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
import { conflictTarget } from './offlineConflicts';

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
  /** Refusée parce que la fonction demande l'abonnement (premium_required) : pas renvoyée automatiquement. */
  premium?: boolean;
}

/** Erreur passagère (réseau, session à rafraîchir, serveur indisponible) : la saisie reste en file, dans l'ordre. */
function isTransient(e: unknown): boolean {
  if (!(e instanceof BackendError)) return false;
  if (e.isNetwork) return true;
  const x = e as BackendError & { status?: number; hint?: string };
  if (x.hint === 'premium_required') return false;
  return x.code === 'jwt_rejected' || x.code === 'timeout' || (typeof x.status === 'number' && x.status >= 500);
}
/** Saisie refusée : message lisible ; « premium_required » reconnu explicitement. */
function refusal(op: PendingOp, e: unknown): PendingOp {
  const x = e as { hint?: string; status?: number; message?: string } | null;
  const premium = !!x && (x.hint === 'premium_required' || x.status === 402);
  return { ...op, premium: premium || undefined, error: premium ? tr('premium.locked') : e instanceof Error ? e.message : tr('l6.offline.unknownError') };
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
  const conflict = op.conflict ?? conflictTarget(op.table, op.row);
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

let loading: Promise<void> | null = null;
export function loadQueue(): Promise<void> {
  loading = (async () => {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      if (raw) {
        const { pending, conflicts } = JSON.parse(raw) as { pending?: PendingOp[]; conflicts?: PendingOp[] };
        // 09/11/2026 : FUSION avec ce qui a été mis en file pendant la lecture (ex. « Pris » depuis une notification
        // au démarrage, hors ligne). Avant, la file relue remplaçait l'état : la nouvelle saisie était perdue.
        const now = useOfflineStore.getState();
        const merge = (stored: PendingOp[] = [], current: PendingOp[]) => [...stored, ...current.filter((c) => !stored.some((s) => s.id === c.id && s.queuedAt === c.queuedAt))];
        useOfflineStore.setState({ pending: merge(pending, now.pending), conflicts: merge(conflicts, now.conflicts) });
        if (now.pending.length || now.conflicts.length) await save();
        if (queueOwner) await adoptQueueOwner(queueOwner); // chargée après la connexion : même filtre
      }
    } catch {
      // file illisible : on n'écrase rien
    }
  })();
  return loading;
}

export async function enqueue(table: string, row: PendingOp['row'], opts: { conflict?: string; merge?: boolean } = {}) {
  // Jamais d'écriture de la file pendant sa lecture au démarrage (sinon l'une écrase l'autre)
  if (loading) await loading;
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
    // Réseau coupé, session à rafraîchir, serveur indisponible : gardée sur le téléphone (jamais perdue)
    if (isTransient(e)) {
      await enqueue(table, row, opts);
      scheduleRetry(); // réseau « présent » mais serveur injoignable : nouvel essai sans attendre un changement de réseau
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
  // Par objet et non par id : une nouvelle saisie au même id (même client_id) arrivée pendant l'envoi est gardée
  const processed = new Set(batch);
  const remaining: PendingOp[] = [];
  const newConflicts: PendingOp[] = [];
  let stalled = false;
  for (const op of batch) {
    if (op.owner != null && op.owner !== queueOwner) { remaining.push(op); continue; } // jamais sous une autre session
    // 09/11/2026 : après une erreur passagère, on n'envoie plus rien de ce passage. Envoyer la suite changeait l'ordre :
    // « Pris » puis « Ignorer » (même prise) pouvait finir en « Pris », l'ancienne réponse repartant en dernier.
    if (stalled) { remaining.push(op); continue; }
    try {
      await send(op);
      sent++;
    } catch (e) {
      if (isTransient(e)) {
        stalled = true;
        remaining.push(e instanceof BackendError && e.isNetwork ? op : { ...op, error: (e as Error).message });
      } else newConflicts.push(refusal(op, e)); // refus définitif (droits, Premium…) : jamais renvoyé en boucle
    }
  }
  // F-01 (QA 02/11/2026, P0) : on FUSIONNE avec l'état courant. Remplacer la file par la copie prise au départ
  // effaçait sans trace les saisies mises en file pendant l'envoi (réseau instable).
  const now = useOfflineStore.getState();
  const arrived = now.pending.filter((op) => !processed.has(op));
  useOfflineStore.setState({ pending: [...remaining, ...arrived], conflicts: [...now.conflicts, ...newConflicts], syncing: false });
  await save();
  // Audit 08 : serveur indisponible (500, délai dépassé) alors que le réseau est là → nouvel essai automatique, espacé.
  // Avant, la saisie attendait un changement de réseau ou un retour au premier plan, parfois des heures.
  if (stalled) scheduleRetry();
  else if (!useOfflineStore.getState().pending.some((o) => o.owner == null || o.owner === queueOwner)) resetRetry();
  // Saisies arrivées pendant l'envoi : nouvel envoi si le réseau est là
  if (arrived.length && useOfflineStore.getState().online) sent += await flushQueue();
  return sent;
}

/**
 * Saisie refusée hors de la file (ex. « Pris » depuis une notification) : gardée dans « à vérifier »
 * (Réglages > Synchronisation) au lieu d'être perdue ; une erreur passagère la met simplement en file.
 */
export async function recordRefused(table: string, row: PendingOp['row'], opts: { conflict?: string; merge?: boolean }, e: unknown) {
  if (isTransient(e)) {
    await enqueue(table, row, opts);
    scheduleRetry();
    return;
  }
  if (loading) await loading;
  const op: PendingOp = { id: String(row.client_id ?? row.id ?? uuidLike()), table, row, queuedAt: new Date().toISOString(), owner: queueOwner, ...opts };
  useOfflineStore.setState((s) => ({ conflicts: [...s.conflicts, refusal(op, e)] }));
  await save();
}

export async function retryConflict(id: string) {
  const op = useOfflineStore.getState().conflicts.find((c) => c.id === id);
  if (!op) return;
  useOfflineStore.setState((s) => ({ conflicts: s.conflicts.filter((c) => c.id !== id), pending: [...s.pending, { ...op, error: undefined, premium: undefined }] }));
  await save();
  await flushQueue();
}

export async function discardConflict(id: string) {
  useOfflineStore.setState((s) => ({ conflicts: s.conflicts.filter((c) => c.id !== id) }));
  await save();
}

let onSyncedCb: ((n: number) => void) | undefined;

/** Délais des nouveaux essais automatiques après une erreur passagère (5 s, 15 s, 30 s, 1 min, 2 min, puis 5 min). */
export const RETRY_DELAYS_MS = [5_000, 15_000, 30_000, 60_000, 120_000, 300_000] as const;
let autoRetry = false;
let retryTimer: ReturnType<typeof setTimeout> | null = null;
let retryAttempt = 0;
function scheduleRetry() {
  if (!autoRetry || retryTimer) return;
  const delay = RETRY_DELAYS_MS[Math.min(retryAttempt, RETRY_DELAYS_MS.length - 1)];
  retryAttempt++;
  retryTimer = setTimeout(() => {
    retryTimer = null;
    // Hors ligne : rien à faire ici, le retour du réseau relance l'envoi
    if (useOfflineStore.getState().online) void flushQueue().then((n) => n && onSyncedCb?.(n));
  }, delay);
}
function resetRetry() {
  retryAttempt = 0;
  if (retryTimer) clearTimeout(retryTimer);
  retryTimer = null;
}

export function startOfflineSync(onSynced?: (n: number) => void) {
  onSyncedCb = onSynced;
  autoRetry = true;
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
    autoRetry = false;
    resetRetry();
    if (onSyncedCb === onSynced) onSyncedCb = undefined;
  };
}

/**
 * L'appareil n'appartient plus à ce foyer (retrait par la propriétaire, départ) : les saisies en attente et les refus
 * gardés pour ce foyer sont effacés du téléphone (le serveur les refuserait ; ils ne doivent plus rester lisibles ici).
 * Renvoie le nombre d'entrées retirées.
 */
export async function purgeQueueForHousehold(householdId: string): Promise<number> {
  if (loading) await loading;
  const { pending, conflicts } = useOfflineStore.getState();
  const keep = (op: PendingOp) => op.row?.household_id !== householdId;
  const removed = pending.filter((o) => !keep(o)).length + conflicts.filter((o) => !keep(o)).length;
  if (!removed) return 0;
  useOfflineStore.setState({ pending: pending.filter(keep), conflicts: conflicts.filter(keep) });
  await save();
  return removed;
}
