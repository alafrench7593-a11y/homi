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
const getDemo = () => (demo ??= createDemoBackend());

let active: Backend = real ?? getDemo();

/** Vrai si la démonstration est active (sans clés, ou choisie « sans compte »). Liaison vivante. */
export let isDemo = active.mode === 'demo';
/** Supabase est configuré : la démonstration est alors un choix, que l'on peut quitter. */
export const hasRealBackend = !!real;

const DEMO_FLAG = 'toietmoi.demo-without-account.v1';
const switchListeners = new Set<() => void>();

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

function setActive(b: Backend) {
  active = b;
  isDemo = b.mode === 'demo';
  switchListeners.forEach((l) => l());
}

/** À l'ouverture : reprend la démonstration si elle avait été choisie. */
export async function initBackendMode(): Promise<void> {
  if (!real) return;
  try {
    if ((await AsyncStorage.getItem(DEMO_FLAG)) === '1' && active !== getDemo()) setActive(getDemo());
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

export function onBackendSwitch(cb: () => void): () => void {
  switchListeners.add(cb);
  return () => switchListeners.delete(cb);
}
