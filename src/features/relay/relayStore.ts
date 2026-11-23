/**
 * Relais parent : dernière transmission PAR ENFANT, sur cet appareil (date + nombre d'événements transmis). Sert de
 * point de départ au brouillon suivant et rend explicite le statut d'un relais déjà envoyé. Aucune table serveur
 * n'existe pour les relais : la transmission passe par le partage du système (Messages, WhatsApp…).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface RelaySent { at: string; count: number }
interface RelayState {
  byChild: Record<string, RelaySent>;
  /** Mot libre du parent, par enfant : gardé quand le brouillon est actualisé, effacé une fois le relais transmis */
  notes: Record<string, string>;
  markSent: (childId: string, count: number, at?: Date) => void;
  setNote: (childId: string, text: string) => void;
}

export const useRelayStore = create<RelayState>()(persist((set) => ({
  byChild: {},
  notes: {},
  markSent: (childId, count, at = new Date()) => set((s) => {
    const notes = { ...(s.notes ?? {}) }; delete notes[childId];
    return { byChild: { ...s.byChild, [childId]: { at: at.toISOString(), count } }, notes };
  }),
  setNote: (childId, text) => set((s) => ({ notes: { ...(s.notes ?? {}), [childId]: text } })),
}), { name: 'homi.relay', storage: createJSONStorage(() => AsyncStorage) }));
