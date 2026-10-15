import Constants from 'expo-constants';
import { createDemoBackend } from './demo';
import { createSupabaseBackend } from './supabase';
import type { Backend } from './types';

export * from './types';

const extra = (Constants.expoConfig?.extra ?? {}) as { supabaseUrl?: string; supabaseAnonKey?: string };
const url = process.env.EXPO_PUBLIC_SUPABASE_URL || extra.supabaseUrl;
const anon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || extra.supabaseAnonKey;

/** Instance unique de la couche de données. */
export const backend: Backend = url && anon ? createSupabaseBackend(url, anon) : createDemoBackend();
export const isDemo = backend.mode === 'demo';
