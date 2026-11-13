/**
 * Humeur → journal (refonte v3, 13/11/2026) — logique pure, sans React (testée : `moodJournal.test.tsx`).
 *  - Les bilans (`mood_checkins`) sont privés par construction (politique « propriétaire uniquement ») : rien ici ne
 *    lit ni n'écrit d'autres données que celles de la personne connectée.
 *  - Aucune note, aucun score, aucune moyenne : la synthèse se limite à des COMPTES réels et à la suite des humeurs
 *    réellement notées (micrographique seulement avec ≥ 2 valeurs réelles, jamais de valeur inventée).
 */
import type { Feather } from '@expo/vector-icons';
import type React from 'react';
import type { MoodCheckin } from '@/lib/types';

export type Mood = MoodCheckin['mood'];
export const MOODS: readonly Mood[] = [1, 2, 3, 4, 5];
export const MOOD_KEYS = ['1', '2', '3', '4', '5'] as const;
export type MoodKey = (typeof MOOD_KEYS)[number];

/** Icône (météo intérieure) de chaque humeur — le libellé reste toujours affiché à côté (jamais l'icône seule). */
export const MOOD_ICON: Record<Mood, React.ComponentProps<typeof Feather>['name']> = { 1: 'cloud-rain', 2: 'cloud', 3: 'cloud-drizzle', 4: 'sun', 5: 'star' };

export const toMoodKey = (m: Mood | null | undefined): MoodKey | null => (m ? (String(m) as MoodKey) : null);
export const fromMoodKey = (k: string): Mood | null => {
  const n = Number(k);
  return n >= 1 && n <= 5 && Number.isInteger(n) ? (n as Mood) : null;
};

/** Ressentis proposés (valeurs enregistrées en français, affichage traduit par l'écran). */
export const FEELINGS = ['Fatigue', 'Inquiétude', 'Tristesse', 'Solitude', 'Irritabilité', 'Débordement', 'Désespoir', 'Calme', 'Joie', 'Fierté', 'Soutien', 'Tendresse'] as const;
export const HEAVY_FEELINGS = ['Désespoir'];
export const FEELING_KEYS: Record<string, string> = { Fatigue: 'tired', Inquiétude: 'worry', Tristesse: 'sadness', Solitude: 'lonely', Irritabilité: 'irritable', Débordement: 'overwhelmed', Désespoir: 'despair', Calme: 'calm', Joie: 'joy', Fierté: 'pride', Soutien: 'supported', Tendresse: 'tenderness' };

export type SupportLevel = 'urgent' | 'soft' | null;
/** Relais d'aide : pensées de se faire du mal ou ressenti très lourd → urgent ; humeur « très difficile » → doux. */
export function supportLevel(mood: Mood | null, feelings: readonly string[], safety: boolean): SupportLevel {
  if (safety || feelings.some((f) => HEAVY_FEELINGS.includes(f))) return 'urgent';
  if (mood === 1) return 'soft';
  return null;
}

export const NOTE_MAX = 6000;
export type CheckinError = 'mood' | 'long';
export function validateCheckin(mood: Mood | null, note: string): CheckinError | null {
  if (!mood) return 'mood';
  if (note.trim().length > NOTE_MAX) return 'long';
  return null;
}

/** Résultat RÉEL d'un enregistrement : envoyé, gardé sur le téléphone (hors ligne), ou échec. */
export type SaveOutcome = { kind: 'sent' | 'queued'; mood: Mood; at: string; support: SupportLevel; id?: string } | { kind: 'error'; message: string };

const DAY = 86400_000;
const localDay = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

export interface WeekSummary {
  /** Bilans des 7 derniers jours (aujourd'hui compris) */
  count: number;
  /** Jours distincts avec au moins un bilan */
  days: number;
  /** Pages de journal (bilans avec un texte) sur la même période */
  pages: number;
  /** Humeur du jour (dernier bilan de chaque jour) des 7 jours, du plus ancien à aujourd'hui ; null = rien de noté */
  series: (Mood | null)[];
  /** Nombre de valeurs réelles dans `series` (micrographique seulement si ≥ 2) */
  real: number;
  /** Un bilan existe déjà aujourd'hui */
  today: boolean;
}

export function weekSummary(moods: readonly MoodCheckin[] | undefined, now: Date = new Date()): WeekSummary {
  const start = new Date(now); start.setHours(0, 0, 0, 0); start.setTime(start.getTime() - 6 * DAY);
  const inWeek = (moods ?? []).filter((m) => { const t = new Date(m.checked_at).getTime(); return t >= start.getTime() && t <= now.getTime() + DAY; });
  const days7 = Array.from({ length: 7 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d; });
  const series = days7.map((d) => {
    const k = localDay(d);
    const sameDay = inWeek.filter((m) => localDay(new Date(m.checked_at)) === k).sort((a, b) => b.checked_at.localeCompare(a.checked_at));
    return sameDay[0]?.mood ?? null;
  });
  return {
    count: inWeek.length,
    days: series.filter((v) => v !== null).length,
    pages: inWeek.filter((m) => !!m.journal?.trim()).length,
    series,
    real: series.filter((v) => v !== null).length,
    today: series[6] !== null,
  };
}

/** Extrait d'une note pour une ligne d'historique (sans couper un mot si possible). */
export function excerpt(text: string | null | undefined, max = 110): string {
  const s = (text ?? '').replace(/\s+/g, ' ').trim();
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const sp = cut.lastIndexOf(' ');
  return `${(sp > max * 0.6 ? cut.slice(0, sp) : cut).trimEnd()}…`;
}

/** Identifiant de transition carte → détail d'un bilan (même clé côté liste et côté détail). */
export const entryMorphId = (id: string) => `mood-entry-${id}`;
