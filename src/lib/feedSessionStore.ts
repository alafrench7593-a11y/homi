/**
 * Tétée en cours, conservée sur l'appareil (AsyncStorage) : elle survit à un changement d'écran, à la mise en
 * arrière-plan et à la fermeture de l'application, et reprend au retour avec la vraie durée (horodatages).
 * Une session par enfant au plus. Rien n'est envoyé au serveur avant « Enregistrer ».
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { reviveSession, type FeedSession } from './domain/lactation';

interface FeedSessionState {
  sessions: Record<string, FeedSession>;
  setSession: (childId: string, s: FeedSession | null) => void;
}

export const useFeedSessionStore = create<FeedSessionState>()(
  persist(
    (set) => ({
      sessions: {},
      setSession: (childId, s) => set((st) => {
        const next = { ...st.sessions };
        if (s) next[childId] = s; else delete next[childId];
        return { sessions: next };
      }),
    }),
    {
      name: 'toietmoi.feedSession.v1',
      storage: createJSONStorage(() => AsyncStorage),
      // Relecture prudente : une session abîmée est écartée (jamais de durée inventée)
      merge: (persisted, current) => {
        const raw = (persisted as { sessions?: Record<string, unknown> } | undefined)?.sessions ?? {};
        const sessions: Record<string, FeedSession> = {};
        for (const [k, v] of Object.entries(raw)) {
          const s = reviveSession(v);
          if (s && s.childId === k && s.savedAt == null) sessions[k] = s;
        }
        return { ...current, sessions };
      },
    },
  ),
);

/** Session en cours (ou terminée, pas encore enregistrée) pour cet enfant. */
export const useFeedSession = (childId: string | null | undefined) => useFeedSessionStore((s) => (childId ? s.sessions[childId] ?? null : null));
