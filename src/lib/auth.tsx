import React, { createContext, useContext, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { backend, type Session } from './backend';
import { useUiStore } from './store';

interface AuthState {
  session: Session | null;
  ready: boolean;
}

const AuthContext = createContext<AuthState>({ session: null, ready: false });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ session: null, ready: false });
  const qc = useQueryClient();

  useEffect(() => {
    let mounted = true;
    backend.auth
      .getSession()
      .then((s) => mounted && setState({ session: s, ready: true }))
      .catch(() => mounted && setState({ session: null, ready: true }));
    const off = backend.auth.onChange((s) => {
      setState((prev) => {
        if (prev.session?.userId !== s?.userId) {
          qc.clear(); // aucune donnée d'un compte ne doit rester visible pour un autre
          if (!s) useUiStore.getState().reset();
        }
        return { session: s, ready: true };
      });
    });
    return () => {
      mounted = false;
      off();
    };
  }, [qc]);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

export function useUserId(): string {
  const { session } = useAuth();
  return session?.userId ?? '';
}
