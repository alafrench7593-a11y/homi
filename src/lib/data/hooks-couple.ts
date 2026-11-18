/**
 * Couple → « Se comprendre », profil familial, « Mes informations » (19/11/2026).
 * Données : couple_feelings (privé, propriétaire seule), couple_messages (autrice + destinataire, écrits par
 * couple_send), family_member_profiles (rôle choisi, partages), notification_settings (préférences), pregnancies
 * (partage choisi par la personne enceinte : set_pregnancy_sharing). Le serveur décide de tout accès (RLS).
 * Clés de cache « couple_feelings » / « couple_messages » : jamais écrites sur le téléphone (PRIVATE_KEYS, _layout).
 */
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation, useQuery } from '@tanstack/react-query';
import { backend, eq } from '../backend';
import { useUserId } from '../auth';
import { uuid } from '../uuid';
import { useHouseholdId, useInvalidate, useRows } from './hooks';
import { isRealtimeLive } from '../sync';
import { usePeople } from './hooks-family-load';
import { otherAdult, type Feeling, type Grammar, type Situation } from '../domain/understand';
import type { Mission } from '../domain/missions';
import type { TaskCategory } from '../domain/familyLoad';

export interface CoupleFeeling { id: string; user_id: string; feelings: Feeling[]; note: string | null; created_at: string }
export interface CoupleMessage {
  id: string; household_id: string; author_id: string; recipient_id: string; kind: 'share' | 'reply' | 'request' | 'offer';
  situation: Situation | null; body: string; reply_to: string | null; task_id: string | null; created_at: string;
}
export interface FamilyMemberProfile {
  household_id: string; user_id: string; family_label: string | null; share_missions: boolean; share_domains: boolean;
  share_availability: boolean; share_calendar: boolean; share_activities: boolean; updated_at?: string;
}
export const DEFAULT_SHARE: Omit<FamilyMemberProfile, 'household_id' | 'user_id'> = {
  family_label: null, share_missions: true, share_domains: true, share_availability: false, share_calendar: true, share_activities: true,
};

/** L'autre adulte du foyer (prénom, avatar), ou rien s'il n'a pas encore rejoint. */
export function usePartner() {
  const { people } = usePeople();
  return otherAdult(people);
}

// ---------------------------------------------------------------- ressentis (privés)
export function useMyFeelings() {
  const me = useUserId();
  return useRows<CoupleFeeling>(['couple_feelings'], me ? { table: 'couple_feelings', filters: [eq('user_id', me)], order: [{ col: 'created_at', asc: false }], limit: 20 } : null);
}
export function useSaveFeeling() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: (a: { feelings: Feeling[]; note: string | null; client_id?: string }) =>
      backend.insert('couple_feelings', { feelings: a.feelings, note: a.note, client_id: a.client_id ?? uuid() }, { onConflict: 'user_id,client_id', ignoreDuplicates: true }),
    onSuccess: () => inv('couple_feelings'),
  });
}

// ---------------------------------------------------------------- messages entre les deux adultes
export function useCoupleMessages() {
  const me = useUserId();
  const hid = useHouseholdId();
  return useQuery({
    queryKey: [me, 'couple_messages', hid ?? ''],
    enabled: !!me && !!hid,
    // l'autre peut écrire à tout moment : temps réel (sync.ts, couple_messages publiée) et relu au premier plan ;
    // toutes les 30 s seulement si le temps réel n'est pas en direct (réseau instable, serveur indisponible)
    refetchInterval: () => (isRealtimeLive() ? false : 30_000),
    staleTime: 5_000,
    queryFn: () => backend.select<CoupleMessage>({ table: 'couple_messages', filters: [eq('household_id', hid)], order: [{ col: 'created_at' }], limit: 200 }),
  });
}

export interface SendArgs { recipient: string; kind: CoupleMessage['kind']; body: string; situation?: Situation | null; reply_to?: string | null; task_id?: string | null; client_id?: string }
export function useCoupleSend() {
  const inv = useInvalidate();
  const hid = useHouseholdId();
  return useMutation({
    mutationFn: (a: SendArgs) => backend.rpc<CoupleMessage>('couple_send', {
      p_household: hid, p_recipient: a.recipient, p_kind: a.kind, p_body: a.body, p_situation: a.situation ?? null,
      p_reply_to: a.reply_to ?? null, p_task: a.task_id ?? null, p_client_id: a.client_id ?? uuid(),
    }),
    onSuccess: () => inv('couple_messages'),
  });
}
export function useDeleteCoupleMessage() {
  const inv = useInvalidate();
  return useMutation({ mutationFn: (id: string) => backend.remove('couple_messages', [eq('id', id)]), onSuccess: () => inv('couple_messages') });
}

/** Demande de coup de main : une mission « À accepter » pour l'autre adulte, puis le message qui l'accompagne. */
export function useRestRequest() {
  const inv = useInvalidate();
  const hid = useHouseholdId();
  return useMutation({
    mutationFn: async (a: { recipient: string; title: string; category: TaskCategory; due_at: string | null; ask: string; client_id: string }) => {
      const m = await backend.rpc<Mission>('create_mission', {
        p_household: hid, p_title: a.title, p_assignee: a.recipient, p_category: a.category, p_notes: null, p_due_at: a.due_at, p_all_day: false,
        p_priority: 'normal', p_recurrence: null, p_child_id: null, p_pet_id: null, p_shopping_item_id: null, p_product_label: null,
        p_document_id: null, p_domain_key: null, p_client_id: a.client_id,
      });
      await backend.rpc('couple_send', { p_household: hid, p_recipient: a.recipient, p_kind: 'request', p_body: a.ask, p_situation: null,
        p_reply_to: null, p_task: m.id, p_client_id: a.client_id });
      return m;
    },
    onSuccess: () => inv('couple_messages', 'family_tasks', 'family_task_events', 'notifications'),
  });
}

// ---------------------------------------------------------------- « dernière lecture » (sur ce téléphone seulement)
const SEEN_KEY = 'homi.understand.seen';
export function useSeenAt() {
  const me = useUserId();
  const [seen, setSeen] = useState<string | null>(null);
  useEffect(() => { AsyncStorage.getItem(`${SEEN_KEY}.${me ?? ''}`).then(setSeen).catch(() => undefined); }, [me]);
  const mark = () => { const v = new Date().toISOString(); setSeen(v); void AsyncStorage.setItem(`${SEEN_KEY}.${me ?? ''}`, v).catch(() => undefined); };
  return { seen, mark };
}

// ---------------------------------------------------------------- accord grammatical et brouillons (téléphone)
const GRAMMAR_KEY = 'homi.understand.grammar';
export function useGrammar() {
  const me = useUserId();
  const [g, setG] = useState<Grammar | null>(null);
  useEffect(() => { AsyncStorage.getItem(`${GRAMMAR_KEY}.${me ?? ''}`).then((v) => setG(v === 'f' || v === 'm' || v === 'n' ? v : null)).catch(() => undefined); }, [me]);
  const save = (v: Grammar) => { setG(v); void AsyncStorage.setItem(`${GRAMMAR_KEY}.${me ?? ''}`, v).catch(() => undefined); };
  return { grammar: g, setGrammar: save };
}
const DRAFT_KEY = 'homi.understand.draft';
export async function loadDraft(me: string | null | undefined, key: string): Promise<string | null> {
  return AsyncStorage.getItem(`${DRAFT_KEY}.${me ?? ''}.${key}`).catch(() => null);
}
export async function saveDraft(me: string | null | undefined, key: string, text: string | null): Promise<void> {
  const k = `${DRAFT_KEY}.${me ?? ''}.${key}`;
  await (text ? AsyncStorage.setItem(k, text) : AsyncStorage.removeItem(k)).catch(() => undefined);
}

// ---------------------------------------------------------------- profil familial
export function useFamilyProfiles() {
  const hid = useHouseholdId();
  return useRows<FamilyMemberProfile>(['family_member_profiles', hid ?? ''], hid ? { table: 'family_member_profiles', filters: [eq('household_id', hid)] } : null);
}
export function useMyFamilyProfile() {
  const me = useUserId();
  const q = useFamilyProfiles();
  return { ...q, mine: q.data?.find((p) => p.user_id === me) ?? null };
}
export function useSaveMyFamilyProfile() {
  const inv = useInvalidate();
  const hid = useHouseholdId();
  const me = useUserId();
  return useMutation({
    mutationFn: (patch: Partial<Omit<FamilyMemberProfile, 'household_id' | 'user_id'>>) =>
      backend.insert('family_member_profiles', { household_id: hid, user_id: me, ...patch, updated_at: new Date().toISOString() }, { onConflict: 'household_id,user_id' }),
    onSuccess: () => inv('family_member_profiles'),
  });
}

// ---------------------------------------------------------------- préférences de notification (missions, couple)
export interface CouplePrefs { mission_done: boolean; couple_discreet: boolean }
export function useCouplePrefs() {
  const me = useUserId();
  const q = useRows<CouplePrefs & { user_id: string }>(['notification_settings', 'couple'], me ? { table: 'notification_settings', columns: 'user_id,mission_done,couple_discreet', filters: [eq('user_id', me)] } : null);
  const row = q.data?.[0];
  return { ...q, prefs: { mission_done: row?.mission_done ?? true, couple_discreet: row?.couple_discreet ?? false } };
}
export function useSaveCouplePrefs() {
  const inv = useInvalidate();
  const me = useUserId();
  return useMutation({
    mutationFn: (p: Partial<CouplePrefs>) => backend.insert('notification_settings', { user_id: me, ...p }, { onConflict: 'user_id' }),
    onSuccess: () => inv('notification_settings'),
  });
}

// ---------------------------------------------------------------- grossesse : partage choisi par la personne enceinte
export function useSetPregnancySharing() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: (a: { id: string; basics: boolean; medical: boolean }) => backend.rpc('set_pregnancy_sharing', { p_pregnancy: a.id, p_basics: a.basics, p_medical: a.medical }),
    onSuccess: () => inv('pregnancies', 'appointments', 'notes', 'documents', 'journeys'),
  });
}
