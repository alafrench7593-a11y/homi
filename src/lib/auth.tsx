import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useIsRestoring, useQueryClient } from '@tanstack/react-query';
import { backend, initBackendMode, onBackendSwitch, type Session } from './backend';
import { cancelAllLocal } from './notifications';
import { setQueueOwner } from './offline';
import { useUiStore } from './store';

interface AuthState {
  session: Session | null;
  ready: boolean;
}

const AuthContext = createContext<AuthState>({ session: null, ready: false });

/** Cache des écrans enregistré sur l'appareil (PersistQueryClientProvider, src/app/_layout.tsx). */
export const PERSISTED_CACHE_KEY = 'toietmoi.cache.v1';

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
  // Audit 2 : le cache enregistré est relu EN MÊME TEMPS que la session. Effacé avant la fin de cette relecture
  // (session expirée, autre compte), il revenait aussitôt : les données du compte précédent restaient sur l'appareil.
  // La session n'est donc appliquée qu'une fois le cache relu.
  const isRestoring = useIsRestoring();

  useEffect(() => onBackendSwitch((reason) => {
    qc.clear();
    // Reprise de la démonstration à l'ouverture : même « compte » qu'avant, le profil affiché est conservé
    // (QA E2E cocon : il était effacé à chaque rechargement de la démonstration publique).
    if (reason !== 'resume') {
      useUiStore.getState().reset();
      writeLastUser(null); // passage démo ↔ vrai compte : le cache vient d'être vidé
    }
    currentUser.current = undefined;
    setState({ session: null, ready: false });
    setGeneration((g) => g + 1);
  }), [qc]);

  useEffect(() => {
    if (isRestoring) return undefined;
    let mounted = true;
    const apply = (s: Session | null) => {
      const uid = s?.userId ?? null;
      const first = currentUser.current === undefined;
      const currentUserBefore = currentUser.current;
      const changed = currentUser.current !== uid;
      currentUser.current = uid;
      if (changed) {
        // Au démarrage, même compte qu'à la dernière ouverture : on GARDE le cache restauré (consultation
        // hors connexion). Sinon, aucune donnée d'un compte ne doit rester visible pour un autre.
        const sameAsLastTime = first && uid && lastUser.current === uid;
        if (!sameAsLastTime) {
          qc.clear();
          // Copie sur l'appareil effacée tout de suite (sans attendre la prochaine écriture du cache, ~2 s)
          AsyncStorage.removeItem(PERSISTED_CACHE_KEY).catch(() => undefined);
        }
        // A-13 : session expirée ou autre compte → les rappels, le résumé et le planning de sommeil du compte
        // précédent ne doivent plus sonner (la déconnexion volontaire le faisait déjà, pas l'expiration).
        const previous = first ? lastUser.current : currentUserBefore;
        if (!sameAsLastTime && previous) void cancelAllLocal().catch(() => undefined);
        writeLastUser(uid);
        void setQueueOwner(uid); // saisies hors ligne d'un autre compte effacées de ce téléphone
        if (!s) useUiStore.getState().reset();
        // Hors de l'écouteur d'authentification : Supabase interdit d'y attendre un autre appel (blocage)
        else setTimeout(() => { void bootstrapAccount().then(() => qc.invalidateQueries()); }, 0);
      }
      setState({ session: s, ready: true });
    };
    // Écoute branchée APRÈS le choix du backend (reprise de la démonstration) : branchée avant, le vrai backend
    // annonçait aussitôt « aucune session » et chaque lien direct ouvert à froid repartait vers /welcome
    // (audit navigation 13/11/2026, N-10 ; révélé par l'attente de la relecture du cache ci-dessus).
    let off = () => {};
    initBackendMode()
      .then(async () => { lastUser.current = await readLastUser(); })
      .then(() => {
        if (mounted) off = backend.auth.onChange((s) => mounted && apply(s));
        return backend.auth.getSession();
      })
      .then((s) => mounted && apply(s))
      .catch(() => mounted && setState({ session: null, ready: true }));
    return () => {
      mounted = false;
      off();
    };
  }, [qc, generation, isRestoring]);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

export function useUserId(): string {
  const { session } = useAuth();
  return session?.userId ?? '';
}
