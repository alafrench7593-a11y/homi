/**
 * Mode EXERCICE de la visite guidée (étape « Enregistrer une action ») : la personne remplit un vrai formulaire,
 * touche « Enregistrer » comme d'habitude, et RIEN n'est écrit — ni dans la vraie base, ni dans la base locale de la
 * démonstration, ni dans la file hors connexion.
 *
 * Mécanique : tant qu'une séance d'exercice est ouverte (`beginPractice`), le relais `backend` (src/lib/backend)
 * remplace chaque écriture (insert, update, remove, rpc qui modifie, envoi de fichier, fonction serveur) par une
 * réponse simulée et la note dans un journal en mémoire (`practiceWrites`, lu par la visite et par les tests) ; la
 * file hors connexion ne met rien en attente et ne renvoie rien pendant ce temps (src/lib/offline.ts). Les LECTURES
 * passent normalement : le formulaire montre les vraies données.
 *
 * La séance n'est ouverte que par un choix explicite (« Essayer sans enregistrer ») et se ferme dès que la personne
 * quitte le formulaire, passe l'étape ou ferme la visite. Hors séance, ce module ne fait rien.
 */
import { uuid } from '@/lib/uuid';

export type PracticeWriteKind = 'insert' | 'update' | 'remove' | 'rpc' | 'upload' | 'storageRemove' | 'invoke' | 'queue';
export interface PracticeWrite { kind: PracticeWriteKind; target: string; at: number }

let sessions = 0;
let log: PracticeWrite[] = [];
const listeners = new Set<(w: PracticeWrite) => void>();
const stateListeners = new Set<(active: boolean) => void>();

/** Vrai pendant une séance d'exercice : aucune écriture ne part. */
export const isPracticeActive = () => sessions > 0;

/** Ouvre une séance ; la fonction rendue la ferme (une seule fois, même appelée plusieurs fois). */
export function beginPractice(): () => void {
  sessions++;
  if (sessions === 1) stateListeners.forEach((l) => l(true));
  let closed = false;
  return () => {
    if (closed) return;
    closed = true;
    sessions = Math.max(0, sessions - 1);
    if (sessions === 0) stateListeners.forEach((l) => l(false));
  };
}

/** Écriture interceptée (journal en mémoire, jamais persisté). */
export function recordPracticeWrite(kind: PracticeWriteKind, target: string) {
  const w = { kind, target, at: Date.now() };
  log = [...log.slice(-49), w];
  listeners.forEach((l) => l(w));
}
export const practiceWrites = (): readonly PracticeWrite[] => log;
export function clearPracticeWrites() { log = []; }
export function onPracticeWrite(cb: (w: PracticeWrite) => void): () => void {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}
export function onPracticeChange(cb: (active: boolean) => void): () => void {
  stateListeners.add(cb);
  return () => { stateListeners.delete(cb); };
}

/**
 * Fonctions serveur qui ne font que LIRE (statut, quota, recherche, profil public…) : elles passent pendant un
 * exercice. Toute autre fonction serveur est considérée comme une écriture et simulée.
 */
const READ_RPC = /^(has_|my_|search_|member_|community_(feed|member|groups_overview)$|dm_(unread|conversation)$|household_member_names$|plan_limit$|child_safety_card$|cosing_lookup$|partner_cycle$|demo_trial_used$|\w+_quota_status$|\w+_status$)/;
export const isReadOnlyRpc = (fn: string) => READ_RPC.test(fn);

type Row = Record<string, unknown>;
/** Réponses simulées : la forme attendue par l'appelant, sans rien écrire. */
export const simulated = {
  insert: (table: string, rows: Row | Row[]) => {
    recordPracticeWrite('insert', table);
    const now = new Date().toISOString();
    return Promise.resolve((Array.isArray(rows) ? rows : [rows]).map((r) => ({ id: uuid(), created_at: now, ...r })));
  },
  update: (table: string, patch: Row) => {
    recordPracticeWrite('update', table);
    return Promise.resolve([{ ...patch }]);
  },
  remove: (table: string) => {
    recordPracticeWrite('remove', table);
    return Promise.resolve();
  },
  rpc: (fn: string) => {
    recordPracticeWrite('rpc', fn);
    return Promise.resolve(null);
  },
};
