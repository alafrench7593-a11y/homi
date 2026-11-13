/**
 * Missions familiales (14/11/2026) : logique pure, testée (src/__tests__/missions.test.ts).
 * Une mission est une tâche du foyer (family_tasks) avec un état fin, posé par le SERVEUR
 * (create_mission / mission_respond, 20261114000300_missions.sql). Ce fichier en est le miroir côté application :
 * il sert à afficher les bonnes réponses rapides, jamais à décider d'un droit (le serveur tranche).
 * Pas de score, pas de classement, pas de « vu à » : rien ici ne compare les personnes.
 */
import type { IconName } from '@/components/ui';
import type { TKey } from '@/i18n';
import type { FamilyTask, TaskCategory } from './familyLoad';
import type { DomainKey } from './mentalLoad';

export type MissionState = 'pending' | 'accepted' | 'in_progress' | 'done' | 'declined' | 'postponed' | 'cancelled';
export type MissionAction = 'accept' | 'start' | 'complete' | 'decline' | 'postpone' | 'ask' | 'cancel' | 'reassign' | 'remind';
export const MISSION_STATES: MissionState[] = ['pending', 'accepted', 'in_progress', 'done', 'declined', 'postponed', 'cancelled'];
export const MISSION_ACTIONS: MissionAction[] = ['accept', 'start', 'complete', 'decline', 'postpone', 'ask', 'cancel', 'reassign', 'remind'];

export interface Mission extends FamilyTask {
  mission_state: MissionState;
  child_id: string | null;
  pet_id: string | null;
  shopping_item_id: string | null;
  product_label: string | null;
  document_id: string | null;
  domain_key: string | null;
  all_day: boolean;
  responded_at: string | null;
  last_reminded_at: string | null;
  version?: number;
  client_id?: string | null;
}

export const isMission = (t: Pick<FamilyTask, 'id'> & { mission_state?: string | null }): t is Mission => !!t.mission_state;

/** Miroir EXACT de public._mission_next_state (test SQL « matrice complète » et test Jest identiques). */
const NEXT: Record<MissionAction, Partial<Record<MissionState, MissionState | 'same'>>> = {
  accept: { pending: 'accepted', postponed: 'accepted' },
  start: { pending: 'in_progress', accepted: 'in_progress', postponed: 'in_progress' },
  complete: { pending: 'done', accepted: 'done', in_progress: 'done', postponed: 'done' },
  decline: { pending: 'declined', accepted: 'declined', in_progress: 'declined', postponed: 'declined' },
  postpone: { pending: 'postponed', accepted: 'postponed', in_progress: 'postponed', postponed: 'postponed' },
  ask: { pending: 'same', accepted: 'same', in_progress: 'same', postponed: 'same' },
  cancel: { pending: 'cancelled', accepted: 'cancelled', in_progress: 'cancelled', postponed: 'cancelled', declined: 'cancelled' },
  reassign: { pending: 'pending', declined: 'pending' },
  remind: { pending: 'same', accepted: 'same', postponed: 'same' },
};

/** État suivant ; null = transition interdite. */
export function nextState(state: MissionState, action: MissionAction): MissionState | null {
  const n = NEXT[action][state];
  return n === 'same' ? state : n ?? null;
}

/** Actions réservées à la personne qui a demandé la mission ; les autres au destinataire. */
export const CREATOR_ACTIONS: MissionAction[] = ['cancel', 'reassign', 'remind'];
export const isTerminal = (s: MissionState) => s === 'done' || s === 'cancelled';

/** Rappels : un seul par 24 h (même règle que le serveur), seulement à l'initiative du créateur. */
export const REMIND_EVERY_MS = 24 * 3600_000;
export function canRemind(m: Pick<Mission, 'mission_state' | 'last_reminded_at'>, now = Date.now()): boolean {
  if (!nextState(m.mission_state, 'remind')) return false;
  return !m.last_reminded_at || now - Date.parse(m.last_reminded_at) >= REMIND_EVERY_MS;
}

export type Viewer = 'recipient' | 'creator' | 'open' | 'observer';
/** Rôle de la personne qui regarde la mission. « open » : mission à prendre (sans destinataire), proposée aux autres. */
export function viewerOf(m: Pick<Mission, 'assignee_id' | 'created_by'>, me: string): Viewer {
  if (m.assignee_id && m.assignee_id === me) return 'recipient';
  if (m.created_by === me) return 'creator';
  if (!m.assignee_id) return 'open';
  return 'observer';
}

/** Réponses rapides proposées, dans l'ordre d'affichage. */
export interface QuickReply { action: MissionAction; label: TKey; icon: IconName; tone: 'primary' | 'secondary' | 'ghost'; needsDate?: boolean; needsNote?: boolean }
export const QUICK_REPLIES: Record<'accept' | 'start' | 'complete' | 'decline' | 'postpone' | 'ask', QuickReply> = {
  accept: { action: 'accept', label: 'mis.reply.accept', icon: 'check', tone: 'primary' },
  start: { action: 'start', label: 'mis.reply.start', icon: 'play', tone: 'secondary' },
  complete: { action: 'complete', label: 'mis.reply.complete', icon: 'check-circle', tone: 'primary' },
  decline: { action: 'decline', label: 'mis.reply.decline', icon: 'x', tone: 'ghost' },
  postpone: { action: 'postpone', label: 'mis.reply.postpone', icon: 'clock', tone: 'ghost', needsDate: true },
  ask: { action: 'ask', label: 'mis.reply.ask', icon: 'help-circle', tone: 'ghost', needsNote: true },
};

export function quickRepliesFor(m: Pick<Mission, 'mission_state' | 'assignee_id' | 'created_by'>, me: string): QuickReply[] {
  const v = viewerOf(m, me);
  const order: (keyof typeof QUICK_REPLIES)[] = m.mission_state === 'pending' || m.mission_state === 'postponed'
    ? ['accept', 'start', 'complete', 'postpone', 'ask', 'decline']
    : ['complete', 'start', 'accept', 'postpone', 'ask', 'decline'];
  if (v === 'open') return (['accept', 'start', 'complete'] as const).filter((a) => nextState(m.mission_state, a)).map((a) => QUICK_REPLIES[a]);
  if (v !== 'recipient') return [];
  return order.filter((a) => nextState(m.mission_state, a)).map((a) => QUICK_REPLIES[a]);
}

export function creatorActionsFor(m: Pick<Mission, 'mission_state' | 'assignee_id' | 'created_by' | 'last_reminded_at'>, me: string, now = Date.now()): MissionAction[] {
  if (m.created_by !== me) return [];
  return (['remind', 'reassign', 'cancel'] as const).filter((a) => (a === 'remind' ? !!m.assignee_id && canRemind(m, now) : !!nextState(m.mission_state, a)));
}

// ---------------------------------------------------------------- libellés d'état (neutres)
export const STATE_LABEL: Record<MissionState, TKey> = {
  pending: 'mis.state.pending', accepted: 'mis.state.accepted', in_progress: 'mis.state.in_progress', done: 'mis.state.done',
  declined: 'mis.state.declined', postponed: 'mis.state.postponed', cancelled: 'mis.state.cancelled',
};
export const STATE_TONE: Record<MissionState, 'accent' | 'calm' | 'done' | 'muted'> = {
  pending: 'accent', accepted: 'calm', in_progress: 'calm', postponed: 'calm', done: 'done', declined: 'muted', cancelled: 'muted',
};

// ---------------------------------------------------------------- responsabilités
/** Les 8 responsabilités HOMI (sous-ensemble des domaines confiables, family_domains). */
export const RESPONSIBILITIES: DomainKey[] = ['shopping', 'meals', 'baby', 'childcare', 'pets', 'home', 'admin', 'health'];

/** Catégorie de mission → domaine de responsabilité (miroir EXACT de public._mission_domain_of). */
export const MISSION_DOMAIN_OF: Partial<Record<TaskCategory, DomainKey>> = {
  shopping: 'shopping', feeding: 'meals', diapers: 'baby', sleep: 'nights', packing: 'childcare', childcare: 'childcare',
  appointments: 'health', health: 'health', housework: 'home', organization: 'home', admin: 'admin', pets: 'pets',
};

/**
 * Destinataire proposé par défaut : la personne qui porte le domaine (si ce n'est pas moi). Personne sinon :
 * la mission reste « à prendre » ; HOMI ne fait pas organiser le travail de l'autre.
 */
export function defaultRecipient(category: TaskCategory, domains: { key: string; owner_id: string | null }[], me: string, members: string[]): string | null {
  const key = MISSION_DOMAIN_OF[category];
  const owner = key ? domains.find((d) => d.key === key)?.owner_id ?? null : null;
  return owner && owner !== me && members.includes(owner) ? owner : null;
}

// ---------------------------------------------------------------- tri des missions
export function receivedMissions<T extends Mission>(all: T[], me: string): T[] {
  return all.filter((m) => m.assignee_id === me || (!m.assignee_id && m.created_by !== me && !isTerminal(m.mission_state)));
}
export function sentMissions<T extends Mission>(all: T[], me: string): T[] {
  return all.filter((m) => m.created_by === me);
}
const RANK: Record<MissionState, number> = { pending: 0, postponed: 1, in_progress: 2, accepted: 3, declined: 4, done: 5, cancelled: 6 };
/** À traiter d'abord, puis par échéance ; terminées et annulées à la fin (les plus récentes d'abord). */
export function sortMissions<T extends Mission>(list: T[]): T[] {
  return [...list].sort((a, b) => RANK[a.mission_state] - RANK[b.mission_state]
    || (isTerminal(a.mission_state) ? (b.updated_at ?? b.created_at).localeCompare(a.updated_at ?? a.created_at) : (a.due_at ?? '9').localeCompare(b.due_at ?? '9'))
    || a.created_at.localeCompare(b.created_at));
}

// ---------------------------------------------------------------- modèles pré-remplis (formulation NEUTRE)
export interface MissionTemplate {
  key: string;
  title: TKey;
  category: TaskCategory;
  icon: IconName;
  /** Produit associé (ajouté à la liste de courses à l'acceptation). */
  product?: TKey;
  /** Heure proposée (HH:MM), modifiable. */
  time?: string;
  recurrence?: { type: 'daily' | 'weekly' | 'monthly'; every?: number };
  child?: boolean;
  pet?: boolean;
}
export const MISSION_TEMPLATES: MissionTemplate[] = [
  { key: 'diapers', title: 'mis.tpl.diapers', category: 'shopping', icon: 'shopping-bag', product: 'mis.tpl.diapers.product', time: '18:00' },
  { key: 'milk', title: 'mis.tpl.milk', category: 'shopping', icon: 'shopping-cart', product: 'mis.tpl.milk.product', time: '18:00' },
  { key: 'groceries', title: 'mis.tpl.groceries', category: 'shopping', icon: 'shopping-cart' },
  { key: 'nursery_bag', title: 'mis.tpl.nurseryBag', category: 'packing', icon: 'briefcase', time: '08:00', child: true },
  { key: 'pickup', title: 'mis.tpl.pickup', category: 'childcare', icon: 'users', time: '17:30', child: true },
  { key: 'dog_walk', title: 'mis.tpl.dogWalk', category: 'pets', icon: 'sun', time: '19:00', recurrence: { type: 'daily' }, pet: true },
  { key: 'kibble', title: 'mis.tpl.kibble', category: 'pets', icon: 'shopping-bag', product: 'mis.tpl.kibble.product', pet: true },
  { key: 'laundry', title: 'mis.tpl.laundry', category: 'housework', icon: 'wind' },
  { key: 'bins', title: 'mis.tpl.bins', category: 'housework', icon: 'trash-2', time: '20:00', recurrence: { type: 'weekly' } },
  { key: 'document', title: 'mis.tpl.document', category: 'admin', icon: 'file-text' },
  { key: 'appointment', title: 'mis.tpl.appointment', category: 'health', icon: 'calendar' },
];

/**
 * Garde-fou de ton : aucun reproche, aucune injonction, aucune urgence fabriquée.
 * (« Acheter du lait avant 18 h », jamais « Tu as encore oublié… ».) Vérifié sur les 5 langues par les tests.
 */
const BLAME = [
  /\bencore\b/i, /\boubli/i, /\btoujours\b/i, /\bjamais\b/i, /\btu (dois|as|n'?as)\b/i, /\bil faut\b/i, /\burgent/i, /!/,
  /\bagain\b/i, /\bforgot|forget/i, /\balways\b/i, /\bnever\b/i, /\byou (must|should|have to)\b/i,
  /\botra vez\b/i, /\bolvid/i, /\bsiempre\b/i, /\bnunca\b/i, /\bschon wieder\b/i, /\bvergessen\b/i, /\bimmer\b/i, /\bnie\b/i,
  /\bancora una volta\b/i, /\bdimentic/i, /\bsempre\b/i, /\bmai\b/i,
];
export function isNeutralText(text: string): boolean {
  return !BLAME.some((re) => re.test(text));
}

// ---------------------------------------------------------------- notifications (miroir EXACT de public._mission_notification)
export type MissionEventType = 'mission.requested' | 'mission.accepted' | 'mission.declined' | 'mission.postponed' | 'mission.started'
  | 'mission.completed' | 'mission.cancelled' | 'mission.question' | 'mission.reminded';
const NOTIF_PREFIX: Record<Exclude<MissionEventType, 'mission.started'>, string> = {
  'mission.requested': 'Nouvelle mission : ', 'mission.accepted': 'Mission acceptée : ', 'mission.declined': 'Mission non prise : ',
  'mission.postponed': 'Autre moment proposé : ', 'mission.completed': 'Mission terminée : ', 'mission.cancelled': 'Mission annulée : ',
  'mission.question': 'Une précision est demandée : ', 'mission.reminded': 'Petit rappel : ',
};
const NOTIF_BODY: Partial<Record<MissionEventType, string>> = {
  'mission.requested': 'Ouvrez HOMI pour répondre quand vous le pouvez.',
  'mission.declined': 'Vous pouvez la proposer à quelqu’un d’autre.',
  'mission.postponed': 'Ouvrez HOMI pour voir le moment proposé.',
  'mission.question': 'Ouvrez HOMI pour répondre.',
};
/** Texte de la notification serveur (centre de notifications). L'écran verrouillé reste générique par défaut (send-push). */
export function missionNotification(type: MissionEventType, title: string): { title: string; body: string } | null {
  if (type === 'mission.started') return null; // « En cours » : pas de notification (pas de relance)
  return { title: (NOTIF_PREFIX[type] + title).slice(0, 160), body: NOTIF_BODY[type] ?? 'Ouvrez HOMI pour voir le détail.' };
}
/** Qui est prévenu : le destinataire (nouvelle mission, rappel, annulation) ou le créateur (réponses) ; jamais l'auteur du fait. */
export function missionNotifyTarget(type: MissionEventType, m: Pick<Mission, 'assignee_id' | 'created_by'>): 'assignee' | 'creator' | 'household' | null {
  if (type === 'mission.started') return null;
  if (type === 'mission.requested') return m.assignee_id ? 'assignee' : 'household';
  if (type === 'mission.reminded' || type === 'mission.cancelled') return m.assignee_id ? 'assignee' : null;
  return 'creator';
}
/** Événement publié par une action (miroir de mission_respond). */
export const EVENT_OF_ACTION: Record<MissionAction, MissionEventType> = {
  accept: 'mission.accepted', decline: 'mission.declined', postpone: 'mission.postponed', start: 'mission.started', complete: 'mission.completed',
  ask: 'mission.question', cancel: 'mission.cancelled', reassign: 'mission.requested', remind: 'mission.reminded',
};
/** Une mission d'achat crée / coche un article de la liste de courses. */
export const isPurchase = (m: Pick<Mission, 'product_label' | 'category' | 'shopping_item_id'>) => !!m.product_label || m.category === 'shopping' || !!m.shopping_item_id;

/** Lien profond d'une mission (notifications, liens internes). */
export const missionHref = (id: string) => `/family/missions/${id}`;
