/**
 * Synchronisation entre appareils et entre membres du foyer :
 *  1. temps réel (Supabase Realtime, droits RLS appliqués par le serveur) → invalidation ciblée du cache ;
 *  2. retour au premier plan de l'application et retour du réseau → les données périmées sont relues ;
 *  3. les saisies hors connexion partent à la reconnexion (src/lib/offline.ts).
 * Rien n'est simulé : une carte ne change que lorsque la donnée a réellement changé côté serveur.
 */
import { useEffect, useState } from 'react';
import { AppState, Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { focusManager, onlineManager, useQueryClient } from '@tanstack/react-query';
import { backend, type ChangeSpec } from '@/lib/backend';

/** Tables partagées dans le foyer (filtrées par foyer) et tables personnelles (filtrées par personne). */
export const HOUSEHOLD_TABLES = [
  'bottles', 'breastfeeds', 'pumpings', 'diapers', 'sleeps', 'meals', 'child_observations', 'child_measurements',
  'bottle_timers', 'appointments', 'family_tasks', 'care_shifts', 'care_requests', 'family_events', 'checklist_items',
  'milk_stash',
] as const;
export const PERSONAL_TABLES = ['notifications'] as const;

export function changeSpecs(householdId: string, userId: string): ChangeSpec[] {
  return [
    ...HOUSEHOLD_TABLES.map((table) => ({ table, filter: `household_id=eq.${householdId}` })),
    ...PERSONAL_TABLES.map((table) => ({ table, filter: `user_id=eq.${userId}` })),
  ];
}

/** Regroupe les rafales (un planning de 7 nuits = une seule relecture). */
export function batcher(flush: (tables: string[]) => void, delayMs = 400) {
  let pending = new Set<string>();
  let timer: ReturnType<typeof setTimeout> | null = null;
  return {
    push(table: string) {
      pending.add(table);
      if (timer) return;
      timer = setTimeout(() => { const t = [...pending]; pending = new Set(); timer = null; flush(t); }, delayMs);
    },
    cancel() { if (timer) clearTimeout(timer); timer = null; pending = new Set(); },
  };
}

let wired = false;
/** Premier plan et réseau : sur téléphone, React Query ne le sait pas tout seul. */
export function wireFocusAndOnline() {
  if (wired) return;
  wired = true;
  if (Platform.OS !== 'web') {
    focusManager.setEventListener((handleFocus) => {
      const sub = AppState.addEventListener('change', (s) => handleFocus(s === 'active'));
      return () => sub.remove();
    });
  }
  onlineManager.setEventListener((setOnline) => NetInfo.addEventListener((st) => setOnline(st.isConnected !== false)));
}

/** Abonnement temps réel du foyer ; renvoie l'état (« en direct » ou non) pour l'affichage discret. */
export function useRealtimeSync(householdId: string | null | undefined, userId: string | null | undefined) {
  const qc = useQueryClient();
  const [live, setLive] = useState(false);
  useEffect(() => {
    if (!householdId || !userId || !backend.subscribeChanges) { setLive(false); return; }
    const b = batcher((tables) => {
      void qc.invalidateQueries({ predicate: (q) => tables.some((t) => q.queryKey.includes(t)) });
    });
    const stop = backend.subscribeChanges(changeSpecs(householdId, userId), (t) => b.push(t), (s) => setLive(s === 'live'));
    return () => { b.cancel(); stop(); setLive(false); };
  }, [householdId, userId, qc]);
  return live;
}
