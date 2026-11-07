/**
 * « Donner mon avis » (07/11/2026) : problème, amélioration, idée d'ajout. Ce qui part : le texte, le type,
 * l'écran d'origine, la version et la plateforme. Rien d'autre (aucune donnée de santé jointe).
 */
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { useMutation } from '@tanstack/react-query';
import { backend, eq } from '../backend';
import { useUserId } from '../auth';
import { useInvalidate, useRows } from './hooks';

export const FEEDBACK_KINDS = ['bug', 'improve', 'idea', 'other'] as const;
export type FeedbackKind = (typeof FEEDBACK_KINDS)[number];
export const FEEDBACK_STATUSES = ['new', 'seen', 'planned', 'done', 'declined'] as const;
export type FeedbackStatus = (typeof FEEDBACK_STATUSES)[number];
export interface AppFeedback { id: string; user_id: string; kind: FeedbackKind; body: string; screen: string | null; app_version: string | null; platform: string | null; contact_ok: boolean; status: FeedbackStatus; created_at: string; updated_at?: string }

/** Écran d'origine : chemin seul, sans paramètres (qui pourraient contenir un identifiant). */
export const cleanScreen = (s?: string | null) => (s ? s.split('?')[0].slice(0, 200) : null);

export function useMyFeedback() {
  const uid = useUserId();
  return useRows<AppFeedback>(['app_feedback', uid ?? ''], uid ? { table: 'app_feedback', filters: [eq('user_id', uid)], order: [{ col: 'created_at', asc: false }] } : null);
}
export function useSendFeedback() {
  const uid = useUserId();
  const inv = useInvalidate();
  return useMutation({
    mutationFn: (v: { kind: FeedbackKind; body: string; screen?: string | null; contact_ok: boolean }) => backend.insert('app_feedback', {
      user_id: uid, kind: v.kind, body: v.body.trim().slice(0, 2000), screen: cleanScreen(v.screen), contact_ok: v.contact_ok, status: 'new',
      app_version: (Constants.expoConfig?.version ?? null)?.slice(0, 40) ?? null,
      platform: Platform.OS === 'ios' || Platform.OS === 'android' ? Platform.OS : 'web',
    }),
    onSuccess: () => inv('app_feedback'),
  });
}
export function useDeleteFeedback() {
  const inv = useInvalidate();
  return useMutation({ mutationFn: (id: string) => backend.remove('app_feedback', [eq('id', id)]), onSuccess: () => inv('app_feedback') });
}
/** Équipe (rôle moderator ou admin ; le serveur revérifie) : tous les avis, et changement de statut. */
export function useAllFeedback(enabled: boolean) {
  return useRows<AppFeedback>(['app_feedback', 'all'], enabled ? { table: 'app_feedback', order: [{ col: 'created_at', asc: false }], limit: 500 } : null);
}
export function useSetFeedbackStatus() {
  const inv = useInvalidate();
  return useMutation({ mutationFn: (v: { id: string; status: FeedbackStatus }) => backend.update('app_feedback', { status: v.status }, [eq('id', v.id)]), onSuccess: () => inv('app_feedback') });
}
