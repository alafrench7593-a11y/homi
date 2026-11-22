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
  markSent: (childId: string, count: number, at?: Date) => void;
}

export const useRelayStore = create<RelayState>()(persist((set) => ({
  byChild: {},
  markSent: (childId, count, at = new Date()) => set((s) => ({ byChild: { ...s.byChild, [childId]: { at: at.toISOString(), count } } })),
}), { name: 'homi.relay', storage: createJSONStorage(() => AsyncStorage) }));
