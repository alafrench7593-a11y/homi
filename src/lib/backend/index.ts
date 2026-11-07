import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createDemoBackend } from './demo';
import { createSupabaseBackend } from './supabase';
import type { Backend } from './types';

export * from './types';

const extra = (Constants.expoConfig?.extra ?? {}) as { supabaseUrl?: string; supabaseAnonKey?: string };
const url = process.env.EXPO_PUBLIC_SUPABASE_URL || extra.supabaseUrl;
const anon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || extra.supabaseAnonKey;

/** Vrai backend (Supabase) s'il est configuré. */
const real: Backend | null = url && anon ? createSupabaseBackend(url, anon) : null;
let demo: Backend | null = null;
// La démonstration pose ses questions d'assistant à la fonction « assistant-demo » (sans compte, limitée)
const getDemo = () => (demo ??= createDemoBackend({ remoteAssistant: url && anon ? { url: url.replace(/\/$/, ''), anonKey: anon } : undefined }));

let active: Backend = real ?? getDemo();

/** Vrai si la démonstration est active (sans clés, ou choisie « sans compte »). Liaison vivante. */
export let isDemo = active.mode === 'demo';
/** Supabase est configuré : la démonstration est alors un choix, que l'on peut quitter. */
export const hasRealBackend = !!real;
/** Adresse publique du projet (sans secret) : sert à construire le lien d'abonnement d'agenda. */
export const backendUrl: string | null = url ? url.replace(/\/$/, '') : null;

const DEMO_FLAG = 'toietmoi.demo-without-account.v1';
const switchListeners = new Set<(reason: BackendSwitchReason) => void>();

/**
 * Instance unique de la couche de données. C'est un relais vers le backend actif :
 * la démonstration sans compte n'écrit JAMAIS dans la vraie base (données sur l'appareil uniquement).
 */
export const backend: Backend = new Proxy({} as Backend, {
  get(_t, prop: string) {
    const v = (active as unknown as Record<string, unknown>)[prop];
    return typeof v === 'function' ? (v as (...a: unknown[]) => unknown).bind(active) : v;
  },
});

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
