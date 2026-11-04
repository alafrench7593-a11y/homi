import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { fetch as expoFetch } from 'expo/fetch';
import { AppState, Platform } from 'react-native';
import { friendlyAuthError } from '../authFlow';
import { t as tr } from '@/i18n';
import { authRedirect, socialSignIn } from './socialAuth';
import { parseSse } from '../../../supabase/functions/_shared/assistant-format';
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

/** A-12 : réaction au jeton refusé par le serveur (installée par createSupabaseBackend). */
let onTokenRejected: (() => void) | null = null;
export const isTokenRejected = (error: { message: string; code?: string }, status?: number) =>
  status === 401 || error.code === 'PGRST301' || error.code === 'PGRST303' || /JWT expired|invalid JWT|JWSError/i.test(error.message);

function wrap(error: { message: string; code?: string; hint?: string } | null, status?: number): never | void {
  if (!error) return;
  // A-12 : jeton refusé (horloge décalée, session révoquée) → rafraîchissement, sinon déconnexion locale ;
  // jamais un compte « vide » affiché comme si de rien n'était.
  if (isTokenRejected(error, status)) {
    onTokenRejected?.();
    throw new BackendError(tr('auth.err.session'), 'jwt_rejected', error.hint, 401);
  }
  const network = /network|fetch failed|Failed to fetch/i.test(error.message);
  throw new BackendError(friendly(error.message, error.code), network ? 'network' : error.code, error.hint, status);
}

/** Messages de la base : jamais de texte technique brut (souvent en anglais). */
export function friendly(msg: string, code?: string): string {
  if (/row-level security|permission denied/i.test(msg)) return tr('l2.sb.forbidden');
  if (/duplicate key/i.test(msg)) return tr('l2.sb.exists');
  if (/network|fetch|load failed/i.test(msg)) return tr('l2.sb.offline');
  if (/violates check constraint|invalid input|out of range|value too long/i.test(msg)) return tr('l2.sb.invalid');
  // Messages écrits par nos propres fonctions SQL (en français) : affichés tels quels
  if (code === 'P0001' || code === '22023' || /[àâçéèêëîïôûùœ’]/i.test(msg)) return msg;
  return tr('l2.sb.generic');
}

/** Erreur d'authentification : toujours traduite. */
function wrapAuth(error: { message: string; code?: string; status?: number; name?: string } | null): void {
  if (!error) return;
  const network = error.name === 'AuthRetryableFetchError' || /fetch/i.test(error.message);
  const code = error.code ?? (error.name === 'AuthPKCECodeVerifierMissingError' ? 'pkce_verifier_missing' : undefined);
  throw new BackendError(friendlyAuthError(error), network ? 'network' : code, undefined, error.status);
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

  let recovering = false;
  onTokenRejected = () => {
    if (recovering) return;
    recovering = true;
    void (async () => {
      try {
        const { error } = await client.auth.refreshSession();
        if (error && !/fetch|network/i.test(error.message)) await client.auth.signOut({ scope: 'local' });
      } catch { /* hors ligne : nouvel essai au prochain refus */ }
      finally { setTimeout(() => { recovering = false; }, 5000); }
    })();
  };

  // Rafraîchit le jeton seulement quand l'application est au premier plan
  if (Platform.OS !== 'web') {
    AppState.addEventListener('change', (state) => {
      if (state === 'active') client.auth.startAutoRefresh();
      else client.auth.stopAutoRefresh();
    });
  }

  const toSession = (s: { user: { id: string; email?: string | null } } | null): Session | null =>
    s ? { userId: s.user.id, email: s.user.email ?? null } : null;

  const api: Backend = {
    mode: 'supabase',
    subscribeChanges(specs, onChange, onStatus) {
      // Un seul canal par appel ; chaque table est filtrée (foyer ou personne) et la RLS s'applique côté serveur
      const name = `sync-${Math.random().toString(36).slice(2, 10)}`;
      let ch = client.channel(name);
      for (const sp of specs) {
        ch = ch.on('postgres_changes' as never, { event: '*', schema: 'public', table: sp.table, ...(sp.filter ? { filter: sp.filter } : {}) } as never, () => onChange(sp.table));
      }
      ch.subscribe((status: string) => onStatus?.(status === 'SUBSCRIBED' ? 'live' : 'offline'));
      return () => { void client.removeChannel(ch); };
    },
    auth: {
      async getSession() {
        const { data } = await client.auth.getSession();
        return toSession(data.session);
      },
      onChange(cb) {
        const { data } = client.auth.onAuthStateChange((_e, s) => cb(toSession(s)));
        return () => data.subscription.unsubscribe();
      },
      async signUp(email, password, meta) {
        const { data, error } = await client.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: authRedirect('/auth/callback'), data: meta ?? {} },
        });
        wrapAuth(error);
        // Adresse déjà inscrite : Supabase répond sans erreur mais sans identité (anti-énumération)
        if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
          throw new BackendError(friendlyAuthError({ code: 'user_already_exists' }), 'user_already_exists');
        }
        return { needsConfirmation: !data.session };
      },
      async resendConfirmation(email) {
        const { error } = await client.auth.resend({ type: 'signup', email, options: { emailRedirectTo: authRedirect('/auth/callback') } });
        wrapAuth(error);
      },
      async signInWithProvider(provider) {
        await socialSignIn(client, provider);
      },
      async signIn(email, password) {
        const { error } = await client.auth.signInWithPassword({ email, password });
        wrapAuth(error);
      },
      async signOut(allDevices) {
        const { error } = await client.auth.signOut({ scope: allDevices ? 'global' : 'local' });
        // Même si le serveur est injoignable, la session locale est supprimée
        if (error) await client.auth.signOut({ scope: 'local' }).catch(() => undefined);
      },
      async resetPassword(email) {
        const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo: authRedirect('/auth/reset') });
        wrapAuth(error);
      },
      async updatePassword(password) {
        const { error } = await client.auth.updateUser({ password });
        wrapAuth(error);
      },
      async exchangeCode(code) {
        const { error } = await client.auth.exchangeCodeForSession(code);
        wrapAuth(error);
      },
    },
    storage: {
      async upload(bucket, path, file) {
        const body = file.bytes ?? (await (await fetch(file.uri)).arrayBuffer());
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
      let b: AnyBuilder = client.from(q.table).select(q.columns ?? '*');
      b = applyFilters(b, q.filters);
      for (const o of q.order ?? []) b = b.order(o.col, { ascending: o.asc ?? true });
      if (q.limit) b = b.limit(q.limit);
      const { data, error, status } = await b;
      wrap(error, status);
      return (data ?? []) as T[];
    },
    async insert<T>(table: string, rows: Record<string, unknown> | Record<string, unknown>[], opts?: { onConflict?: string; ignoreDuplicates?: boolean; returning?: string }) {
      const b: AnyBuilder = opts?.onConflict
        ? client.from(table).upsert(rows, { onConflict: opts.onConflict, ignoreDuplicates: opts.ignoreDuplicates ?? false })
        : client.from(table).insert(rows);
      const { data, error, status } = await b.select(opts?.returning ?? '*');
      wrap(error, status);
      return (data ?? []) as T[];
    },
    async update<T>(table: string, patch: Record<string, unknown>, filters: Filter[], opts?: { returning?: string }) {
      const { data, error, status } = await applyFilters(client.from(table).update(patch), filters).select(opts?.returning ?? '*');
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
        throw new BackendError(payload?.message ?? tr('l2.sb.unavailable'), payload?.error ?? 'function_error', payload?.error === 'quota_reached' ? 'premium_required' : undefined, ctx?.status);
      }
      return data as T;
    },
    async invokeStream<T>(fn: string, body: Record<string, unknown>, onEvent: (event: string, data: unknown) => void, opts?: { signal?: AbortSignal; timeoutMs?: number }) {
      const { data: sess } = await client.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) throw new BackendError('Connexion requise.', '42501', undefined, 401);
      // Arrêt demandé par la personne, ou délai dépassé : la lecture du flux est interrompue proprement
      const ac = new AbortController();
      let timedOut = false;
      const timer = setTimeout(() => { timedOut = true; ac.abort(); }, opts?.timeoutMs ?? 90_000);
      const onAbort = () => ac.abort();
      opts?.signal?.addEventListener('abort', onAbort);
      const stopped = () => (timedOut ? new BackendError(tr('l2.sb.slow'), 'timeout') : new BackendError(tr('l2.sb.stopped'), 'aborted'));
      try {
      // Web : fetch natif (flux lisible). iOS / Android : expo/fetch, qui expose aussi un flux lisible.
      const doFetch = (Platform.OS === 'web' ? globalThis.fetch : (expoFetch as unknown as typeof globalThis.fetch)) ?? globalThis.fetch;
      let res: Response;
      try {
        res = await doFetch(`${url.replace(/\/$/, '')}/functions/v1/${fn}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, apikey: anonKey, 'Content-Type': 'application/json', Accept: 'text/event-stream' },
          body: JSON.stringify({ ...body, stream: true }),
          signal: ac.signal,
        });
      } catch {
        if (ac.signal.aborted) throw stopped();
        // Plateforme sans fetch en flux : réponse complète, sans diffusion
        return api.invoke<T>(fn, { ...body, stream: false });
      }
      const type = res.headers.get('content-type') ?? '';
      if (!type.includes('text/event-stream')) {
        let payload: { message?: string; error?: string } | null = null;
        try {
          payload = await res.json();
        } catch {
          payload = null;
        }
        if (!res.ok) {
          throw new BackendError(payload?.message ?? tr('l2.sb.unavailable'), payload?.error ?? 'function_error', payload?.error === 'quota_reached' ? 'premium_required' : undefined, res.status);
        }
        return payload as T;
      }
      let final: T | null = null;
      let failure: { message?: string; error?: string } | null = null;
      const handle = (text: string, flush = false) => {
        const parsed = parseSse(flush ? text + '\n\n' : text);
        for (const ev of parsed.events) {
          let data: unknown = null;
          try {
            data = JSON.parse(ev.data);
          } catch {
            continue;
          }
          if (ev.event === 'done') final = data as T;
          else if (ev.event === 'error') failure = data as { message?: string; error?: string };
          else onEvent(ev.event, data);
        }
        return parsed.rest;
      };
      const stream = res.body as ReadableStream<Uint8Array> | null;
      if (stream && typeof stream.getReader === 'function' && typeof TextDecoder === 'function') {
        const reader = stream.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        for (;;) {
          if (ac.signal.aborted) { void reader.cancel().catch(() => undefined); throw stopped(); }
          const { value, done } = await reader.read().catch((e) => { if (ac.signal.aborted) throw stopped(); throw e; });
          if (done) break;
          buffer = handle(buffer + decoder.decode(value, { stream: true }));
        }
        handle(buffer + decoder.decode(), true);
      } else {
        // Pas de flux lisible : on lit tout d'un coup (affichage non progressif)
        handle(await res.text(), true);
      }
      if (failure) throw new BackendError((failure as { message?: string }).message ?? tr('l2.sb.assistantDown'), (failure as { error?: string }).error ?? 'function_error', undefined, 503);
      if (!final) throw new BackendError(tr('l2.sb.interrupted'), 'stream_interrupted');
      return final;
      } finally {
        clearTimeout(timer);
        opts?.signal?.removeEventListener('abort', onAbort);
      }
    },
  };
  return api;
}
