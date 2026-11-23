/**
 * 179 — Missions de reconnexion (moments à deux) : logique pure (testée, src/__tests__/calmMoments.test.ts).
 * Bibliothèque écrite à l'avance (5 langues : clés « mom.idea.<clé> ») : de petites idées simples, sans aucune
 * connotation sexuelle, sans culpabilisation, sans « devoir ». Proposées par un parent à l'autre, acceptées ou
 * déclinées sans justification (aucun champ de texte), planifiables dans l'agenda, historique des moments passés.
 */
import type { IconName } from '@/components/ui';

export interface MomentIdea { key: string; minutes: number; icon: IconName; home: boolean }

/** Idées (ordre d'affichage). Une idée = une clé ; le texte est dans les dictionnaires (mom.idea.<clé>.title / .sub). */
export const MOMENT_IDEAS: readonly MomentIdea[] = [
  { key: 'walk_10', minutes: 10, icon: 'sun', home: false },
  { key: 'coffee', minutes: 20, icon: 'coffee', home: true },
  { key: 'photos_month', minutes: 20, icon: 'image', home: true },
  { key: 'cook_together', minutes: 45, icon: 'book-open', home: true },
  { key: 'music', minutes: 15, icon: 'music', home: true },
  { key: 'tea_evening', minutes: 20, icon: 'moon', home: true },
  { key: 'board_game', minutes: 30, icon: 'grid', home: true },
  { key: 'breakfast', minutes: 30, icon: 'sunrise', home: true },
  { key: 'phones_away', minutes: 30, icon: 'smartphone', home: true },
  { key: 'plan_outing', minutes: 15, icon: 'map', home: true },
  { key: 'first_memories', minutes: 15, icon: 'heart', home: true },
  { key: 'bench_outside', minutes: 15, icon: 'wind', home: false },
  { key: 'dessert', minutes: 20, icon: 'gift', home: true },
  { key: 'series_episode', minutes: 40, icon: 'tv', home: true },
];
export const ideaOf = (key: string): MomentIdea | null => MOMENT_IDEAS.find((x) => x.key === key) ?? null;

export type MomentStatus = 'proposed' | 'accepted' | 'declined' | 'done' | 'cancelled';
export type MomentAction = 'accept' | 'decline' | 'plan' | 'done' | 'cancel';

export interface Moment {
  id: string; household_id: string; idea_key: string; from_user: string; to_user: string; status: MomentStatus;
  planned_at: string | null; duration_minutes: number | null; responded_at: string | null; done_at: string | null;
  created_at: string; updated_at: string; _pending?: boolean;
}

/** Ce que la personne peut faire sur un moment (miroir de couple_moment_respond et des politiques). */
export function momentActions(m: Pick<Moment, 'status' | 'from_user' | 'to_user'>, me: string | null): (MomentAction | 'delete')[] {
  if (!me) return [];
  const mine = m.from_user === me;
  const forMe = m.to_user === me;
  const out: (MomentAction | 'delete')[] = [];
  if (m.status === 'proposed' && forMe) out.push('accept', 'decline', 'plan');
  if (m.status === 'accepted' && (mine || forMe)) out.push('plan', 'done');
  if (mine && (m.status === 'proposed' || m.status === 'accepted')) out.push('cancel');
  if (mine) out.push('delete');
  return out;
}

/** Transition attendue (même table que le serveur) ; null = refusée. Rejouer la même réponse ne change rien. */
export function nextMomentStatus(m: Pick<Moment, 'status' | 'from_user' | 'to_user'>, action: MomentAction, me: string): MomentStatus | null {
  if (!momentActions(m, me).includes(action)) {
    const same = { accept: 'accepted', decline: 'declined', done: 'done', cancel: 'cancelled', plan: null }[action];
    return same && same === m.status ? m.status : null;
  }
  switch (action) {
    case 'accept': case 'plan': return 'accepted';
    case 'decline': return 'declined';
    case 'done': return 'done';
    case 'cancel': return 'cancelled';
  }
}

/**
 * Rangement pour l'écran : à répondre (pour moi), à venir (acceptés, planifiés d'abord), en attente de réponse
 * (proposés par moi), passés (faits, plus récents d'abord). Les propositions déclinées ou annulées n'apparaissent
 * que dans « Toutes les propositions », sans être mises en avant.
 */
export function splitMoments(list: Moment[], me: string | null) {
  const when = (m: Moment) => m.planned_at ?? '9999';
  return {
    toAnswer: list.filter((m) => m.status === 'proposed' && m.to_user === me).sort((a, b) => b.created_at.localeCompare(a.created_at)),
    upcoming: list.filter((m) => m.status === 'accepted').sort((a, b) => when(a).localeCompare(when(b)) || b.created_at.localeCompare(a.created_at)),
    waiting: list.filter((m) => m.status === 'proposed' && m.from_user === me).sort((a, b) => b.created_at.localeCompare(a.created_at)),
    past: list.filter((m) => m.status === 'done').sort((a, b) => (b.done_at ?? '').localeCompare(a.done_at ?? '')),
    closed: list.filter((m) => m.status === 'declined' || m.status === 'cancelled').sort((a, b) => b.updated_at.localeCompare(a.updated_at)),
  };
}

/** Idées qui n'ont pas encore été vécues ensemble passent d'abord (le reste garde l'ordre de la bibliothèque). */
export function suggestedIdeas(list: Moment[]): MomentIdea[] {
  const lived = new Set(list.filter((m) => m.status === 'done' || m.status === 'accepted').map((m) => m.idea_key));
  return [...MOMENT_IDEAS.filter((i) => !lived.has(i.key)), ...MOMENT_IDEAS.filter((i) => lived.has(i.key))];
}
