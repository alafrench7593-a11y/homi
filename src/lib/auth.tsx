import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQueryClient } from '@tanstack/react-query';
import { backend, initBackendMode, onBackendSwitch, type Session } from './backend';
import { setQueueOwner } from './offline';
import { useUiStore } from './store';

interface AuthState {
  session: Session | null;
  ready: boolean;
}

const AuthContext = createContext<AuthState>({ session: null, ready: false });

/** Dernier compte connecté sur ce téléphone : le cache hors ligne n'est vidé que si le compte CHANGE. */
const LAST_USER_KEY = 'toietmoi.lastUser';
async function readLastUser(): Promise<string | null | undefined> {
  try { return await AsyncStorage.getItem(LAST_USER_KEY); } catch { return undefined; }
}
function writeLastUser(id: string | null) {
  (id ? AsyncStorage.setItem(LAST_USER_KEY, id) : AsyncStorage.removeItem(LAST_USER_KEY)).catch(() => undefined);
}

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
  const lastUser = useRef<string | null | undefined>(undefined);

  useEffect(() => onBackendSwitch(() => {
    qc.clear();
    useUiStore.getState().reset();
    currentUser.current = undefined;
    writeLastUser(null); // passage démo ↔ vrai compte : le cache vient d'être vidé
    setState({ session: null, ready: false });
    setGeneration((g) => g + 1);
  }), [qc]);

  useEffect(() => {
    let mounted = true;
    const apply = (s: Session | null) => {
      const uid = s?.userId ?? null;
      const first = currentUser.current === undefined;
      const changed = currentUser.current !== uid;
      currentUser.current = uid;
      if (changed) {
        // Au démarrage, même compte qu'à la dernière ouverture : on GARDE le cache restauré (consultation
        // hors connexion). Sinon, aucune donnée d'un compte ne doit rester visible pour un autre.
        if (!(first && uid && lastUser.current === uid)) qc.clear();
        writeLastUser(uid);
        void setQueueOwner(uid); // saisies hors ligne d'un autre compte effacées de ce téléphone
        if (!s) useUiStore.getState().reset();
        // Hors de l'écouteur d'authentification : Supabase interdit d'y attendre un autre appel (blocage)
        else setTimeout(() => { void bootstrapAccount().then(() => qc.invalidateQueries()); }, 0);
      }
      setState({ session: s, ready: true });
    };
    initBackendMode()
      .then(async () => { lastUser.current = await readLastUser(); })
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
