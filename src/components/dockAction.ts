/**
 * Action contextuelle de la barre d'onglets (HOMI, 13/11/2026) : le bouton rond posé À CÔTÉ de la capsule des
 * onglets, sur la même ligne. Par défaut « + » (ajout rapide) ; un écran peut le remplacer le temps qu'il est
 * monté (Communauté → « Publier », accueil d'un enfant → « Ajouter » du cocon).
 * Ainsi un seul bouton flottant par écran, jamais posé sur le contenu.
 *
 * Petit magasin sans dépendance (useSyncExternalStore) : une action par route d'onglet, la dernière enregistrée
 * l'emporte ; `onPress` lit toujours la version la plus récente (pas de fermeture périmée).
 */
import { useEffect, useRef, useSyncExternalStore } from 'react';
import type { IconName } from './ui';

export interface DockAction {
  icon: IconName;
  /** Libellé lu par les lecteurs d'écran (le bouton n'affiche que l'icône). */
  label: string;
  hint?: string;
  testID: string;
  onPress: () => void;
}

type Entry = { id: number; action: DockAction };
let entries: Record<string, Entry[]> = {};
let seq = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };
const snapshot = () => entries;

/** Action enregistrée pour une route d'onglet (la plus récente), ou null → « + » par défaut. */
export function useDockActionFor(route: string): DockAction | null {
  const all = useSyncExternalStore(subscribe, snapshot, snapshot);
  const list = all[route];
  return list?.length ? list[list.length - 1].action : null;
}

/**
 * Remplace le bouton de la barre pour `route` tant que le composant est monté (`action` null : rien).
 * Les champs affichés (icône, libellés, testID) sont relus à chaque changement ; `onPress` via une référence.
 */
export function useDockAction(route: string, action: DockAction | null) {
  const ref = useRef(action);
  ref.current = action;
  const on = !!action;
  const { icon, label, hint, testID } = action ?? ({} as Partial<DockAction>);
  useEffect(() => {
    if (!on) return;
    const id = ++seq;
    const entry: Entry = { id, action: { icon: icon!, label: label!, hint, testID: testID!, onPress: () => ref.current?.onPress() } };
    entries = { ...entries, [route]: [...(entries[route] ?? []), entry] };
    emit();
    return () => {
      entries = { ...entries, [route]: (entries[route] ?? []).filter((e) => e.id !== id) };
      emit();
    };
  }, [route, on, icon, label, hint, testID]);
}
