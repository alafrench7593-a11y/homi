import { FEATURES } from '@/config/features';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createDemoBackend } from './demo';
import { createSupabaseBackend } from './supabase';
import { BackendError, type Backend } from './types';
import { isPracticeActive, isReadOnlyRpc, recordPracticeWrite, simulated } from '@/lib/practice';
import { t as tr } from '@/i18n';

export * from './types';

const extra = (Constants.expoConfig?.extra ?? {}) as { supabaseUrl?: string; supabaseAnonKey?: string };
const url = process.env.EXPO_PUBLIC_SUPABASE_URL || extra.supabaseUrl;
const anon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || extra.supabaseAnonKey;

/** Vrai backend (Supabase) s'il est configuré. */
const real: Backend | null = url && anon ? createSupabaseBackend(url, anon) : null;
let demo: Backend | null = null;
// La démonstration pose ses questions d'assistant à la fonction « assistant-demo » (sans compte, limitée)
const getDemo = () => (demo ??= createDemoBackend({ strictPremium: FEATURES.demoStrictPremium && !(Platform.OS === 'web' && FEATURES.webDemoOpen), remoteAssistant: url && anon ? { url: url.replace(/\/$/, ''), anonKey: anon } : undefined }));

/**
 * Web, adresse /demo (site public) sans session réelle dans ce navigateur : l'app DÉMARRE sur le moteur local de
 * démonstration, avant toute requête. Sans cela, les premiers écrans lisaient le vrai backend (contenus publics)
 * le temps de basculer. Une session réelle enregistrée garde le vrai backend : /demo propose alors un choix explicite.
 */
const DEMO_FLAG_KEY = 'toietmoi.demo-without-account.v1';
function startsOnPublicDemo(): boolean {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return false;
  try {
    // Démo déjà choisie dans ce navigateur (actualisation d'un écran de la démo) : même moteur dès la première image
    if (window.localStorage.getItem(DEMO_FLAG_KEY) === '1') return true;
    if (!/^\/demo\/?$/.test(window.location.pathname)) return false;
    for (let i = 0; i < window.localStorage.length; i++) {
      if (/^sb-.*-auth-token$/.test(window.localStorage.key(i) ?? '')) return false;
    }
    return true;
  } catch { return false; }
}

let active: Backend = real && !startsOnPublicDemo() ? real : getDemo();

/** Vrai si la démonstration est active (sans clés, ou choisie « sans compte »). Liaison vivante. */
export let isDemo = active.mode === 'demo';
/** Supabase est configuré : la démonstration est alors un choix, que l'on peut quitter. */
export const hasRealBackend = !!real;
/** Adresse publique du projet (sans secret) : sert à construire le lien d'abonnement d'agenda. */
export const backendUrl: string | null = url ? url.replace(/\/$/, '') : null;

const DEMO_FLAG = DEMO_FLAG_KEY;
const switchListeners = new Set<(reason: BackendSwitchReason) => void>();

/**
 * Instance unique de la couche de données. C'est un relais vers le backend actif :
 * la démonstration sans compte n'écrit JAMAIS dans la vraie base (données sur l'appareil uniquement).
 */
export const backend: Backend = new Proxy({} as Backend, {
  get(_t, prop: string) {
    // Visite guidée, mode exercice (src/lib/practice.ts) : aucune écriture ne part, les lectures passent
    if (isPracticeActive()) {
      const shielded = practiceShield(prop);
      if (shielded) return shielded;
    }
    const v = (active as unknown as Record<string, unknown>)[prop];
    return typeof v === 'function' ? (v as (...a: unknown[]) => unknown).bind(active) : v;
  },
});

/** Remplacement d'une méthode d'écriture pendant un exercice (null : la méthode passe telle quelle). */
function practiceShield(prop: string): unknown {
  switch (prop) {
    case 'insert': return (table: string, rows: Record<string, unknown> | Record<string, unknown>[]) => simulated.insert(table, rows);
    case 'update': return (table: string, patch: Record<string, unknown>) => simulated.update(table, patch);
    case 'remove': return (table: string) => simulated.remove(table);
    case 'rpc': return (fn: string, args?: Record<string, unknown>) => (isReadOnlyRpc(fn) ? active.rpc(fn, args) : simulated.rpc(fn));
    case 'invoke': case 'invokeStream':
      return (fn: string) => { recordPracticeWrite('invoke', fn); return Promise.reject(new BackendError(tr('tour.practice.blocked'), 'practice')); };
    case 'storage': return {
      ...active.storage,
      upload: (bucket: string) => { recordPracticeWrite('upload', bucket); return Promise.resolve(); },
      remove: (bucket: string) => { recordPracticeWrite('storageRemove', bucket); return Promise.resolve(); },
    };
    default: return null;
  }
}

/**
 * `resume` : reprise, à l'ouverture, de la démonstration choisie lors d'une visite précédente.
 * Ce n'est pas un changement de compte : le profil affiché (choisi dans la démonstration) est conservé.
 * `switch` : l'utilisatrice entre dans la démonstration ou la quitte.
 */
export type BackendSwitchReason = 'resume' | 'switch';

function setActive(b: Backend, reason: BackendSwitchReason = 'switch') {
  active = b;
  isDemo = b.mode === 'demo';
  switchListeners.forEach((l) => l(reason));
}

/** À l'ouverture : reprend la démonstration si elle avait été choisie. */
export async function initBackendMode(): Promise<void> {
  if (!real) return;
  try {
    if ((await AsyncStorage.getItem(DEMO_FLAG)) === '1' && active !== getDemo()) setActive(getDemo(), 'resume');
  } catch { /* rien : on reste sur le vrai backend */ }
}

export async function enterDemoMode(): Promise<void> {
  if (real) await AsyncStorage.setItem(DEMO_FLAG, '1').catch(() => undefined);
  setActive(getDemo());
}

export async function exitDemoMode(): Promise<void> {
  if (!real) return;
  await AsyncStorage.removeItem(DEMO_FLAG).catch(() => undefined);
  setActive(real);
}

export function onBackendSwitch(cb: (reason: BackendSwitchReason) => void): () => void {
  switchListeners.add(cb);
  return () => switchListeners.delete(cb);
}
