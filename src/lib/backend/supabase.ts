import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';
import { secureSessionStorage } from './secureStorage';
import { BackendError, type Backend, type Filter, type Query, type Session } from './types';

type AnyBuilder = any; // eslint-disable-line @typescript-eslint/no-explicit-any

function applyFilters(b: AnyBuilder, filters: Filter[] = []): AnyBuilder {
  for (const f of filters) {
    switch (f.op) {
      case 'eq': b = b.eq(f.col, f.value); break;
      case 'neq': b = b.neq(f.col, f.value); break;
      case 'in': b = b.in(f.col, f.value as unknown[]); break;
      case 'gte': b = b.gte(f.col, f.value); break;
      case 'lte': b = b.lte(f.col, f.value); break;
      case 'gt': b = b.gt(f.col, f.value); break;
      case 'lt': b = b.lt(f.col, f.value); break;
      case 'is': b = b.is(f.col, f.value as null); break;
      case 'ilike': b = b.ilike(f.col, f.value as string); break;
      case 'contains': b = b.contains(f.col, f.value as unknown[]); break;
    }
  }
  return b;
}

function wrap(error: { message: string; code?: string; hint?: string } | null, status?: number): never | void {
  if (!error) return;
  const network = /network|fetch failed|Failed to fetch/i.test(error.message);
  throw new BackendError(friendly(error.message), network ? 'network' : error.code, error.hint, status);
}

function friendly(msg: string): string {
  if (/row-level security|permission denied/i.test(msg)) return 'Vous n’avez pas l’autorisation de faire cette action.';
  if (/Invalid login credentials/i.test(msg)) return 'Adresse e-mail ou mot de passe incorrect.';
  if (/Email not confirmed/i.test(msg)) return 'Confirmez d’abord votre adresse e-mail grâce au lien reçu.';
  if (/User already registered/i.test(msg)) return 'Un compte existe déjà avec cette adresse.';
  if (/Password should/i.test(msg)) return 'Le mot de passe ne respecte pas les règles de sécurité.';
  if (/duplicate key/i.test(msg)) return 'Cet élément existe déjà.';
  if (/network|fetch/i.test(msg)) return 'Pas de connexion internet pour le moment.';
  return msg;
}

export function createSupabaseBackend(url: string, anonKey: string): Backend {
  const client: SupabaseClient = createClient(url, anonKey, {
    auth: {
      storage: secureSessionStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: Platform.OS === 'web',
      flowType: 'pkce',
    },
  });

  // Rafraîchit le jeton seulement quand l'application est au premier plan
  if (Platform.OS !== 'web') {
    AppState.addEventListener('change', (state) => {
      if (state === 'active') client.auth.startAutoRefresh();
      else client.auth.stopAutoRefresh();
    });
  }

  const toSession = (s: { user: { id: string; email?: string | null } } | null): Session | null =>
    s ? { userId: s.user.id, email: s.user.email ?? null } : null;

  return {
    mode: 'supabase',
    auth: {
      async getSession() {
        const { data } = await client.auth.getSession();
        return toSession(data.session);
      },
      onChange(cb) {
        const { data } = client.auth.onAuthStateChange((_e, s) => cb(toSession(s)));
        return () => data.subscription.unsubscribe();
      },
      async signUp(email, password) {
        const { data, error } = await client.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: Platform.OS === 'web' ? undefined : 'toietmoi://auth/callback' },
        });
        wrap(error);
        return { needsConfirmation: !data.session };
      },
      async signIn(email, password) {
        const { error } = await client.auth.signInWithPassword({ email, password });
        wrap(error);
      },
      async signOut(allDevices) {
        const { error } = await client.auth.signOut({ scope: allDevices ? 'global' : 'local' });
        wrap(error);
      },
      async resetPassword(email) {
        const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo: 'toietmoi://auth/reset' });
        wrap(error);
      },
      async updatePassword(password) {
        const { error } = await client.auth.updateUser({ password });
        wrap(error);
      },
    },
    storage: {
      async upload(bucket, path, file) {
        const res = await fetch(file.uri);
        const body = await res.arrayBuffer();
        const { error } = await client.storage.from(bucket).upload(path, body, { contentType: file.mimeType, upsert: false });
        wrap(error);
      },
      async signedUrl(bucket, path, expires) {
        const { data, error } = await client.storage.from(bucket).createSignedUrl(path, expires);
        wrap(error);
        return data!.signedUrl;
      },
      async remove(bucket, paths) {
        const { error } = await client.storage.from(bucket).remove(paths);
        wrap(error);
      },
    },
    async select<T>(q: Query) {
      let b: AnyBuilder = client.from(q.table).select('*');
      b = applyFilters(b, q.filters);
      for (const o of q.order ?? []) b = b.order(o.col, { ascending: o.asc ?? true });
      if (q.limit) b = b.limit(q.limit);
      const { data, error, status } = await b;
      wrap(error, status);
      return (data ?? []) as T[];
    },
    async insert<T>(table: string, rows: Record<string, unknown> | Record<string, unknown>[], opts?: { onConflict?: string; ignoreDuplicates?: boolean }) {
      const b: AnyBuilder = opts?.onConflict
        ? client.from(table).upsert(rows, { onConflict: opts.onConflict, ignoreDuplicates: opts.ignoreDuplicates ?? false })
        : client.from(table).insert(rows);
      const { data, error, status } = await b.select();
      wrap(error, status);
      return (data ?? []) as T[];
    },
    async update<T>(table: string, patch: Record<string, unknown>, filters: Filter[]) {
      const { data, error, status } = await applyFilters(client.from(table).update(patch), filters).select();
      wrap(error, status);
      return (data ?? []) as T[];
    },
    async remove(table, filters) {
      const { error, status } = await applyFilters(client.from(table).delete(), filters);
      wrap(error, status);
    },
    async rpc<T>(fn: string, args?: Record<string, unknown>) {
      const { data, error, status } = await client.rpc(fn, args ?? {});
      wrap(error, status);
      return data as T;
    },
    async invoke<T>(fn: string, body: unknown) {
      const { data, error } = await client.functions.invoke(fn, { body: body as Record<string, unknown> });
      if (error) {
        // Les erreurs métier (quota, consentement…) renvoient un JSON explicite
        const ctx = (error as { context?: Response }).context;
        let payload: { message?: string; error?: string } | null = null;
        try {
          payload = ctx ? await ctx.json() : null;
        } catch {
          payload = null;
        }
        throw new BackendError(payload?.message ?? 'Le service est momentanément indisponible.', payload?.error ?? 'function_error', payload?.error === 'quota_reached' ? 'premium_required' : undefined, ctx?.status);
      }
      return data as T;
    },
  };
}
