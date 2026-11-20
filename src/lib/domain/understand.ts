/**
 * Couple → « Se comprendre » (19/11/2026) : logique pure, testée (understand.test.ts, understandGuards.test.ts).
 * Aider un parent à dire ce qu'il ressent, sans culpabilisation. Les formulations sont écrites à l'avance dans les
 * 5 langues (src/i18n/<langue>/couple2.ts) : aucune IA, aucun appel réseau. RIEN n'est envoyé sans un appui explicite
 * suivi d'une confirmation. Jamais de compteur, de score, de relance ni de contrepartie.
 */
import type { TKey } from '@/i18n';

export const FEELINGS = ['tired', 'rest', 'overwhelmed', 'tenderness', 'talk', 'me_time', 'lonely', 'stressed', 'together'] as const;
export type Feeling = (typeof FEELINGS)[number];

/** Accord grammatical choisi par la personne (gardé sur son téléphone) ; sans choix : formulation épicène. */
export type Grammar = 'f' | 'm' | 'n';
export const feelingKey = (f: Feeling, g: Grammar | null | undefined): TKey => `und.f.${f}.${g ?? 'n'}` as TKey;

/** Ressentis de détresse : une ligne sobre renvoie vers un professionnel de santé et les ressources d'aide. */
export const DISTRESS: Feeling[] = ['tired', 'overwhelmed', 'lonely', 'stressed'];
export const showsHelp = (feelings: readonly Feeling[]) => feelings.some((f) => DISTRESS.includes(f));
/** Après un partage de fatigue ou de besoin de repos : proposer (jamais imposer) d'organiser un moment de repos. */
export const REST_FEELINGS: Feeling[] = ['tired', 'rest', 'overwhelmed', 'me_time'];

/** « desire » (30/11/2026, outil 175) : dire une envie de proximité sans rien attendre en retour. */
export const SITUATIONS = ['fatigue', 'mental_load', 'tenderness', 'desire', 'time', 'postpartum', 'fear', 'no_sex_now'] as const;
export type Situation = (typeof SITUATIONS)[number];
export const REST_SITUATIONS: Situation[] = ['fatigue', 'time', 'mental_load'];
export const offersRest = (o: { feelings?: readonly Feeling[]; situation?: Situation | null }) =>
  (!!o.situation && REST_SITUATIONS.includes(o.situation)) || (o.feelings ?? []).some((f) => REST_FEELINGS.includes(f));

export const VARIANTS = ['base', 'short', 'soft', 'direct'] as const;
export type Variant = (typeof VARIANTS)[number];
export const situationTitle = (s: Situation): TKey => `und.s.${s}` as TKey;
export const situationText = (s: Situation, v: Variant): TKey => `und.t.${s}.${v}` as TKey;

/** Message préparé à partir des ressentis cochés et du mot libre (la personne le relit et le modifie avant tout envoi). */
export function feelingsMessage(lines: string[], note: string): string {
  const head = lines.map((l) => `${l}.`).join(' ');
  const extra = note.trim();
  return [head, extra].filter(Boolean).join('\n\n');
}

/** Réponses proposées au destinataire. */
export const REPLIES: TKey[] = ['und.reply.r1', 'und.reply.r2', 'und.reply.r3', 'und.reply.r4'];

// ---------------------------------------------------------------- demandes de coup de main (sur confirmation)
export interface RestRequest {
  key: 'bedtime' | 'dinner' | 'bath' | 'night' | 'morning' | 'groceries';
  icon: 'moon' | 'coffee' | 'droplet' | 'star' | 'sunrise' | 'shopping-cart';
  category: 'childcare' | 'feeding' | 'sleep' | 'shopping';
  /** Échéance : aujourd'hui à HH:MM, demain à HH:MM, ou aucune. */
  due: { day: 0 | 1; time: string } | null;
}
export const REST_REQUESTS: RestRequest[] = [
  { key: 'bedtime', icon: 'moon', category: 'childcare', due: { day: 0, time: '20:00' } },
  { key: 'dinner', icon: 'coffee', category: 'feeding', due: { day: 0, time: '19:00' } },
  { key: 'bath', icon: 'droplet', category: 'childcare', due: { day: 0, time: '18:30' } },
  { key: 'night', icon: 'star', category: 'sleep', due: { day: 0, time: '23:00' } },
  { key: 'morning', icon: 'sunrise', category: 'childcare', due: { day: 1, time: '07:30' } },
  { key: 'groceries', icon: 'shopping-cart', category: 'shopping', due: null },
];
export const requestLabel = (r: RestRequest): TKey => `und.req.${r.key}` as TKey;
export const requestAsk = (r: RestRequest): TKey => `und.req.${r.key}.ask` as TKey;
export const requestMission = (r: RestRequest): TKey => `und.req.${r.key}.mission` as TKey;

/** Échéance locale d'une demande (ISO), à partir de « maintenant ». */
export function requestDue(r: RestRequest, now = new Date()): string | null {
  if (!r.due) return null;
  const [h, m] = r.due.time.split(':').map(Number);
  const d = new Date(now);
  d.setDate(d.getDate() + r.due.day);
  d.setHours(h, m, 0, 0);
  // déjà passée aujourd'hui (ex. 23 h 30) : on ne demande jamais pour un moment écoulé
  if (d.getTime() < now.getTime()) d.setDate(d.getDate() + 1);
  return d.toISOString();
}

/** Responsabilités qu'un parent peut proposer de prendre (domaines du foyer). */
export const OFFER_DOMAINS = ['nights', 'meals', 'shopping', 'laundry', 'childcare', 'home', 'admin', 'baby'] as const;

/** L'autre adulte du foyer (propriétaire ou co-parent), jamais la nounou ; nul s'il n'a pas encore rejoint. */
export function otherAdult<P extends { id: string; role: string; isMe: boolean }>(people: P[]): P | null {
  return people.find((p) => !p.isMe && (p.role === 'owner' || p.role === 'coparent')) ?? null;
}

/** Message reçu non lu : arrivé après la dernière ouverture de la conversation (aucun « vu » n'est envoyé à l'autre). */
export function unreadCount(messages: { author_id: string; created_at: string }[], me: string, seenAt: string | null): number {
  return messages.filter((m) => m.author_id !== me && (!seenAt || m.created_at > seenAt)).length;
}
