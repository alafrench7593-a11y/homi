/**
 * Brouillon de l'onboarding : sauvegardé à chaque étape (sur l'appareil ET dans le profil),
 * pour reprendre là où on s'était arrêté si l'application est fermée.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ConsentPurpose, Journey } from './types';
import type { ChildDraft, PregnancyDraft } from '@/features/profiles';

export const ONBOARDING_STEPS = ['intro', 'journeys', 'pregnancy', 'children', 'feeding', 'reminders', 'consents'] as const;
export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

/** Réponse à « Votre bébé prend-il le biberon ? » (facultative). */
export type BottleFeeding = 'yes' | 'mixed' | 'no' | null;

export interface OnboardingDraft {
  v: 1;
  step: OnboardingStep;
  name: string;
  journeys: Journey[];
  pregnancy: PregnancyDraft;
  children: ChildDraft[];
  reminders: string[];
  consents: Record<ConsentPurpose, boolean>;
  bottleFeeding: BottleFeeding;
  /** Centres d'intérêt facultatifs (santé, communauté) ; absent des anciens brouillons. */
  interests?: string[];
  /** Horodatage de la dernière sauvegarde (pour choisir la plus récente entre l'appareil et le profil). */
  savedAt?: string;
}

export function serializeDraft(d: OnboardingDraft): string {
  return JSON.stringify(d);
}

export function restoreDraft(raw: string | null | undefined | object): OnboardingDraft | null {
  if (raw == null) return null;
  let d: Partial<OnboardingDraft>;
  try {
    d = (typeof raw === 'string' ? JSON.parse(raw) : raw) as Partial<OnboardingDraft>;
  } catch {
    return null;
  }
  if (!d || d.v !== 1 || !Array.isArray(d.journeys) || !Array.isArray(d.children) || !d.consents) return null;
  const step = (ONBOARDING_STEPS as readonly string[]).includes(d.step as string) ? (d.step as OnboardingStep) : 'journeys';
  const interests = Array.isArray(d.interests) ? d.interests.filter((x): x is string => typeof x === 'string') : [];
  return { ...(d as OnboardingDraft), step, interests };
}

const key = (userId: string) => `toietmoi.onboarding.${userId}`;

export async function saveDraftLocally(userId: string, d: OnboardingDraft): Promise<void> {
  try { await AsyncStorage.setItem(key(userId), serializeDraft(d)); } catch { /* best effort : le profil garde aussi le brouillon */ }
}

export async function loadDraftLocally(userId: string): Promise<OnboardingDraft | null> {
  try { return restoreDraft(await AsyncStorage.getItem(key(userId))); } catch { return null; }
}

export async function clearDraftLocally(userId: string): Promise<void> {
  try { await AsyncStorage.removeItem(key(userId)); } catch { /* rien */ }
}
