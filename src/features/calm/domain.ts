/**
 * 172 — Mode embrouille : logique pure (testée, src/__tests__/calmMoments.test.ts).
 * Pendant le mode, les échanges entre les deux adultes se limitent à des DEMANDES PRATIQUES écrites à l'avance :
 * un modèle + une date / heure + un enfant si besoin. Aucune zone de texte libre. Chaque demande est une mission
 * (create_mission, via calm_request_send) : réponses en un geste (« OK, je m'en occupe », « Je ne peux pas », « Fait »).
 * Aucune statistique, aucun compteur, aucun reproche (garde-fou isNeutralText des missions).
 */
import { t as tr, formatDate, type TKey } from '@/i18n';
import type { MissionAction, MissionState } from '@/lib/domain/missions';
import type { IconName } from '@/components/ui';

export type CalmTemplateKey = 'pickup' | 'groceries' | 'appointment' | 'medicine' | 'paper' | 'night_relay';

export interface CalmTemplate {
  key: CalmTemplateKey;
  icon: IconName;
  /** L'enfant est demandé (récupérer un enfant, médicament à donner). */
  child: 'required' | 'optional' | 'none';
  /** L'heure compte (sinon : la date suffit, « dans la journée »). */
  time: boolean;
  /** Heure proposée par défaut (modifiable). */
  defaultTime: string;
}

/** Modèles proposés (ordre d'affichage). Le serveur refuse tout autre modèle. */
export const CALM_TEMPLATES: readonly CalmTemplate[] = [
  { key: 'pickup', icon: 'users', child: 'required', time: true, defaultTime: '16:30' },
  { key: 'groceries', icon: 'shopping-cart', child: 'none', time: false, defaultTime: '18:00' },
  { key: 'appointment', icon: 'calendar', child: 'optional', time: true, defaultTime: '10:00' },
  { key: 'medicine', icon: 'package', child: 'required', time: true, defaultTime: '20:00' },
  { key: 'paper', icon: 'file-text', child: 'optional', time: false, defaultTime: '20:00' },
  { key: 'night_relay', icon: 'moon', child: 'none', time: true, defaultTime: '23:00' },
];

export const templateOf = (key: string): CalmTemplate | null => CALM_TEMPLATES.find((x) => x.key === key) ?? null;

/** Les trois réponses en un geste (et rien d'autre : ni « autre horaire », ni question, ni texte). */
export type CalmReply = 'accept' | 'decline' | 'complete';
export const CALM_REPLIES: readonly CalmReply[] = ['accept', 'decline', 'complete'];

/** Réponses possibles selon l'état de la mission (miroir des transitions de mission_respond). */
export function repliesFor(state: MissionState | null | undefined): CalmReply[] {
  switch (state) {
    case 'pending': case 'postponed': return ['accept', 'decline', 'complete'];
    case 'accepted': case 'in_progress': return ['complete', 'decline'];
    default: return [];
  }
}
export const replyAction = (r: CalmReply): MissionAction => r;

/** Libellé neutre de l'état, vu par l'expéditeur ou le destinataire. */
export function stateLabel(state: MissionState | null | undefined): string {
  switch (state) {
    case 'accepted': case 'in_progress': return tr('calm.state.accepted');
    case 'done': return tr('calm.state.done');
    case 'declined': return tr('calm.state.declined');
    case 'cancelled': return tr('calm.state.cancelled');
    default: return tr('calm.state.pending');
  }
}

export interface CalmDraft { template: CalmTemplateKey | null; date: string; time: string; childId: string | null }

/** Date (AAAA-MM-JJ) et heure (HH:MM) locales → instant ISO ; null si illisible. */
export function draftDueAt(date: string, time: string | null): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const hm = time && /^([01]\d|2[0-3]):[0-5]\d$/.test(time) ? time : '12:00';
  const [y, m, d] = date.split('-').map(Number);
  const [h, mi] = hm.split(':').map(Number);
  const at = new Date(y, m - 1, d, h, mi, 0, 0);
  return Number.isNaN(at.getTime()) ? null : at.toISOString();
}

/** Erreur lisible (clé de traduction) ou null. Le passé est refusé (une demande pratique est à venir). */
export function validateDraft(d: CalmDraft, now: Date = new Date()): TKey | null {
  const tpl = d.template ? templateOf(d.template) : null;
  if (!tpl) return 'calm.err.template';
  if (tpl.child === 'required' && !d.childId) return 'calm.err.child';
  if (tpl.time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(d.time)) return 'calm.err.time';
  const at = draftDueAt(d.date, tpl.time ? d.time : null);
  if (!at) return 'calm.err.date';
  const endOfDay = new Date(at); endOfDay.setHours(23, 59, 59, 999);
  if ((tpl.time ? Date.parse(at) : endOfDay.getTime()) < now.getTime() - 60_000) return 'calm.err.past';
  return null;
}

/**
 * Titre de la mission (une ligne, ≤ 120 caractères) : le modèle, l'enfant, le moment. C'est le seul texte transmis ;
 * l'écran du destinataire l'affiche à partir du modèle, dans SA langue.
 */
export function calmTitle(key: CalmTemplateKey, o: { childName?: string | null; dueAt?: string | null; withTime?: boolean }): string {
  const name = o.childName?.trim() || tr('calm.child.theChild');
  const when = o.dueAt ? (o.withTime === false ? formatDate(o.dueAt, { weekday: 'long', day: 'numeric', month: 'long' })
    : formatDate(o.dueAt, { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })) : '';
  const base = tr(`calm.tpl.${key}.title` as TKey, { name });
  return (when ? tr('calm.titleWhen', { what: base, when }) : base).replace(/[\r\n]+/g, ' ').slice(0, 120);
}

export interface CalmRequestRow {
  id: string; household_id: string; task_id: string; template_key: CalmTemplateKey; child_id: string | null;
  from_user: string; to_user: string; due_at: string | null; created_at: string;
}

export interface CalmItem extends CalmRequestRow { state: MissionState | null; direction: 'received' | 'sent' }

/** Demandes reçues / envoyées, ouvertes d'abord (par échéance), puis l'historique (plus récent d'abord). */
export function splitRequests(rows: CalmRequestRow[], states: Record<string, MissionState | null>, me: string | null) {
  const items: CalmItem[] = rows.map((r) => ({ ...r, state: states[r.task_id] ?? null, direction: r.to_user === me ? 'received' : 'sent' }));
  const open = (x: CalmItem) => !['done', 'declined', 'cancelled'].includes(String(x.state ?? 'pending'));
  const byDue = (a: CalmItem, b: CalmItem) => (a.due_at ?? a.created_at).localeCompare(b.due_at ?? b.created_at);
  return {
    received: items.filter((x) => x.direction === 'received' && open(x)).sort(byDue),
    sent: items.filter((x) => x.direction === 'sent' && open(x)).sort(byDue),
    history: items.filter((x) => !open(x)).sort((a, b) => b.created_at.localeCompare(a.created_at)),
  };
}
