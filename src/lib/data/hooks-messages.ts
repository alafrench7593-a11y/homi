/**
 * Messagerie privée de la communauté : boîte de réception, conversation, envoi (avec nouvel essai), demandes de
 * message, non-lus, signalement. Tout passe par les fonctions serveur dm_* (droits, blocage, débit) ; le moteur de
 * démonstration applique les mêmes règles. Les clés de cache contiennent « dm_participants » : c'est la table écoutée
 * en temps réel (src/lib/sync.ts), une ligne modifiée relit la boîte et la conversation ouverte.
 * Le texte d'un message n'est jamais journalisé ni envoyé à un service de suivi d'erreurs.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { backend } from '../backend';
import { useAuth } from '../auth';
import { uuid } from '../uuid';
import { friendlyErrorMessage } from '../errors';
import { cleanMessage, type DmConversation, type DmMessage, type DmOutgoing, type DmUnread } from '../domain/messages';
import type { ReportReason } from '../types';
import { useInvalidate } from './hooks';
import { t as tr } from '@/i18n';

const KEY = 'dm_participants';
/** Sans temps réel (démonstration, coupure) : relecture régulière tant que l'écran est ouvert. */
const POLL_MS = 20_000;

function useDmQuery<T>(key: unknown[], fn: string, args: Record<string, unknown> = {}, opts: { enabled?: boolean; poll?: boolean } = {}) {
  const { session } = useAuth();
  return useQuery({
    queryKey: [session?.userId, KEY, ...key],
    queryFn: () => backend.rpc<T>(fn, args),
    enabled: !!session && (opts.enabled ?? true),
    staleTime: 5_000,
    refetchInterval: opts.poll ? POLL_MS : false,
  });
}

export function useInbox() {
  return useDmQuery<DmConversation[]>(['inbox'], 'dm_inbox', {}, { poll: true });
}
export function useDmUnread(enabled = true) {
  const q = useDmQuery<DmUnread>(['unread'], 'dm_unread', {}, { enabled, poll: true });
  const total = (q.data?.messages ?? 0) + (q.data?.requests ?? 0);
  return { ...q, total };
}
export function useConversation(id: string | null | undefined) {
  return useDmQuery<DmConversation | null>(['conversation', id ?? ''], 'dm_conversation', { p_conversation: id }, { enabled: !!id, poll: true });
}
export function useConversationMessages(id: string | null | undefined) {
  return useDmQuery<DmMessage[]>(['messages', id ?? ''], 'dm_messages_list', { p_conversation: id, p_before: null, p_limit: 100 }, { enabled: !!id, poll: true });
}

/** Bouton « Écrire » d'un profil : trouve ou crée la conversation, renvoie son identifiant. */
export function useOpenConversation() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: (handle: string) => backend.rpc<string>('dm_open', { p_handle: handle }),
    onSuccess: () => inv(KEY),
  });
}
export function useRespondRequest() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: (p: { id: string; accept: boolean }) => backend.rpc('dm_respond', { p_conversation: p.id, p_accept: p.accept }),
    onSuccess: () => inv(KEY, 'notifications'),
  });
}
export function useReportConversation() {
  return useMutation({
    mutationFn: (r: { id: string; reason: ReportReason; details?: string | null }) => backend.rpc('dm_report', { p_conversation: r.id, p_reason: r.reason, p_details: r.details ?? null }),
  });
}

/** Marque la conversation comme lue à l'ouverture et à chaque nouveau message reçu. */
export function useMarkRead(id: string | null | undefined, unread: number, lastId: string | null) {
  const inv = useInvalidate();
  const { session } = useAuth();
  useEffect(() => {
    if (!session || !id || unread <= 0) return;
    let live = true;
    void backend.rpc('dm_mark_read', { p_conversation: id }).then(() => { if (live) inv(KEY, 'notifications'); }).catch(() => undefined);
    return () => { live = false; };
  }, [session, id, unread, lastId]); // eslint-disable-line react-hooks/exhaustive-deps
}

/**
 * Envoi d'un message : il s'affiche tout de suite (« envoi… »), passe à « envoyé » quand le serveur l'a confirmé, ou
 * reste à l'écran en « échec » avec « Renvoyer ». Chaque message porte un identifiant fixé sur le téléphone : un
 * nouvel essai après une coupure ne crée jamais de doublon (le serveur renvoie le message déjà enregistré).
 */
export function useSendMessage(conversationId: string | null | undefined) {
  const inv = useInvalidate();
  const [outgoing, setOutgoing] = useState<DmOutgoing[]>([]);
  const mounted = useRef(true);
  const latest = useRef<DmOutgoing[]>([]);
  latest.current = outgoing;
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);

  const push = useCallback(async (o: DmOutgoing) => {
    if (!conversationId) return;
    try {
      await backend.rpc<DmMessage>('dm_send', { p_conversation: conversationId, p_body: o.body, p_client_id: o.client_id });
      inv(KEY);
    } catch (e) {
      if (mounted.current) setOutgoing((list) => list.map((x) => (x.client_id === o.client_id ? { ...x, state: 'failed', error: friendlyErrorMessage(e, tr('dm.err.sendFailed')) } : x)));
      inv(KEY);
    }
  }, [conversationId, inv]);

  const send = useCallback((text: string) => {
    const body = cleanMessage(text);
    if (!body || !conversationId) return false;
    const o: DmOutgoing = { client_id: uuid(), body, created_at: new Date().toISOString(), state: 'sending' };
    setOutgoing((list) => [...list, o]);
    void push(o);
    return true;
  }, [conversationId, push]);

  const retry = useCallback((clientId: string) => {
    const failed = latest.current.find((x) => x.client_id === clientId);
    if (!failed) return;
    const again: DmOutgoing = { ...failed, state: 'sending', error: null };
    setOutgoing((list) => list.map((x) => (x.client_id === clientId ? again : x)));
    void push(again);
  }, [push]);

  const discard = useCallback((clientId: string) => setOutgoing((list) => list.filter((x) => x.client_id !== clientId)), []);

  return { outgoing, send, retry, discard };
}

/**
 * Temps réel de la messagerie : un canal à part (jamais mêlé à la synchronisation du foyer, qui ne doit pas tomber
 * si la publication de dm_participants manque), filtré sur la personne. Seule la ligne « participante » (non-lus,
 * date du dernier message) est diffusée, jamais le texte : à chaque changement, la boîte et la conversation sont
 * relues par les fonctions dm_*. Sans temps réel (démonstration, coupure), la relecture régulière prend le relais.
 */
export function useDmRealtime(enabled = true) {
  const { session } = useAuth();
  const inv = useInvalidate();
  const userId = session?.userId;
  useEffect(() => {
    if (!enabled || !userId || !backend.subscribeChanges) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const stop = backend.subscribeChanges([{ table: KEY, filter: `user_id=eq.${userId}` }], () => {
      if (timer) return;
      timer = setTimeout(() => { timer = null; inv(KEY); }, 300);
    });
    return () => { if (timer) clearTimeout(timer); stop(); };
  }, [enabled, userId]); // eslint-disable-line react-hooks/exhaustive-deps
}
