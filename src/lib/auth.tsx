import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { backend, initBackendMode, onBackendSwitch, type Session } from './backend';
import { useUiStore } from './store';

interface AuthState {
  session: Session | null;
  ready: boolean;
}

const AuthContext = createContext<AuthState>({ session: null, ready: false });

/**
 * Rattrapage à chaque connexion : crée le profil ou le foyer s'ils manquent (ensure_my_account).
 * Sans réseau, l'appel échoue silencieusement et sera refait à la prochaine ouverture.
 */
async function bootstrapAccount(): Promise<void> {
  try {
    await backend.rpc('ensure_my_account');
  } catch {
    /* hors ligne ou backend plus ancien : l'onboarding le refera */
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ session: null, ready: false });
  const [generation, setGeneration] = useState(0); // change quand on passe en démonstration ou qu'on la quitte
  const qc = useQueryClient();
  const currentUser = useRef<string | null | undefined>(undefined);

  useEffect(() => onBackendSwitch(() => {
    qc.clear();
    useUiStore.getState().reset();
    currentUser.current = undefined;
    setState({ session: null, ready: false });
    setGeneration((g) => g + 1);
  }), [qc]);

  useEffect(() => {
    let mounted = true;
    const apply = (s: Session | null) => {
      const changed = currentUser.current !== (s?.userId ?? null);
      currentUser.current = s?.userId ?? null;
      if (changed) {
        qc.clear(); // aucune donnée d'un compte ne doit rester visible pour un autre
        if (!s) useUiStore.getState().reset();
        // Hors de l'écouteur d'authentification : Supabase interdit d'y attendre un autre appel (blocage)
        else setTimeout(() => { void bootstrapAccount().then(() => qc.invalidateQueries()); }, 0);
      }
      setState({ session: s, ready: true });
    };
    initBackendMode()
      .then(() => backend.auth.getSession())
      .then((s) => mounted && apply(s))
      .catch(() => mounted && setState({ session: null, ready: true }));
    const off = backend.auth.onChange((s) => mounted && apply(s));
    return () => {
      mounted = false;
      off();
    };
  }, [qc, generation]);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

export function useUserId(): string {
  const { session } = useAuth();
  return session?.userId ?? '';
}
