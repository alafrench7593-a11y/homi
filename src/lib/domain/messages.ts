/**
 * Messagerie privée de la communauté (1 à 1, texte seulement) : types et règles pures, partagés par les écrans,
 * le moteur de démonstration et les tests. Les mêmes règles sont appliquées par le serveur
 * (supabase/migrations/20261119000300_messagerie_privee.sql) : rien n'est décidé par le téléphone seul.
 */
export const DM_MAX_LENGTH = 2000;
/** Messages qu'une demandeuse peut envoyer avant que la destinataire accepte. */
export const DM_REQUEST_LIMIT = 3;
export const DM_PER_MINUTE = 20;
export const DM_REQUESTS_PER_DAY = 10;

/** État d'une conversation vu par la personne connectée (un refus n'est jamais annoncé à la demandeuse). */
export type DmStatus = 'open' | 'request_sent' | 'request_received';

export interface DmConversation {
  id: string; status: DmStatus;
  handle: string; pseudonym: string; avatar_path?: string | null; avatar_preset?: string | null;
  last_body: string | null; last_at: string | null; last_mine: boolean | null;
  unread: number; can_send: boolean; request_left: number | null;
}
export interface DmMessage { id: string; body: string; mine: boolean; created_at: string; client_id: string }
export interface DmUnread { messages: number; requests: number }

/** Message en cours d'envoi ou en échec, gardé à l'écran tant que le serveur ne l'a pas confirmé. */
export interface DmOutgoing { client_id: string; body: string; created_at: string; state: 'sending' | 'failed'; error?: string | null }

export function cleanMessage(text: string): string {
  return text.replace(/\r\n?/g, '\n').replace(/\n{4,}/g, '\n\n\n').trim();
}
export type DmDraftError = 'empty' | 'too_long';
export function draftError(text: string): DmDraftError | null {
  const t = cleanMessage(text);
  if (!t) return 'empty';
  return t.length > DM_MAX_LENGTH ? 'too_long' : null;
}

/** Boîte de réception : conversations ouvertes et demandes envoyées d'un côté, demandes reçues de l'autre. */
export function splitInbox(list: DmConversation[]): { conversations: DmConversation[]; requests: DmConversation[] } {
  const byDate = (a: DmConversation, b: DmConversation) => String(b.last_at ?? '').localeCompare(String(a.last_at ?? ''));
  return {
    conversations: list.filter((c) => c.status !== 'request_received').sort(byDate),
    requests: list.filter((c) => c.status === 'request_received').sort(byDate),
  };
}

export type DmRow =
  | { kind: 'day'; key: string; date: string }
  | { kind: 'message'; key: string; message: DmMessage; outgoing?: DmOutgoing; showTime: boolean };

const dayOf = (iso: string) => { const d = new Date(iso); return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`; };

/**
 * Fil d'une conversation : messages confirmés puis messages en attente (sans doublon : un message confirmé remplace
 * son envoi en cours), séparateurs de jour, heure affichée à la fin de chaque série (même auteur, moins de 5 minutes).
 */
export function threadRows(messages: DmMessage[], outgoing: DmOutgoing[]): DmRow[] {
  const confirmed = new Set(messages.map((m) => m.client_id));
  const all: { message: DmMessage; outgoing?: DmOutgoing }[] = [
    ...[...messages].sort((a, b) => a.created_at.localeCompare(b.created_at)).map((message) => ({ message })),
    ...outgoing.filter((o) => !confirmed.has(o.client_id)).map((o) => ({ message: { id: o.client_id, body: o.body, mine: true, created_at: o.created_at, client_id: o.client_id }, outgoing: o })),
  ];
  const rows: DmRow[] = [];
  all.forEach((it, i) => {
    const prev = all[i - 1]?.message; const next = all[i + 1];
    if (!prev || dayOf(prev.created_at) !== dayOf(it.message.created_at)) rows.push({ kind: 'day', key: `day-${dayOf(it.message.created_at)}`, date: it.message.created_at });
    const lastOfRun = !next || next.message.mine !== it.message.mine || !!next.outgoing !== !!it.outgoing
      || Date.parse(next.message.created_at) - Date.parse(it.message.created_at) > 5 * 60_000 || dayOf(next.message.created_at) !== dayOf(it.message.created_at);
    rows.push({ kind: 'message', key: it.message.client_id || it.message.id, message: it.message, outgoing: it.outgoing, showTime: lastOfRun || !!it.outgoing });
  });
  return rows;
}

/** Pastille : « 9+ » au-delà de 9. */
export function badgeLabel(n: number): string | null {
  return n <= 0 ? null : n > 9 ? '9+' : String(n);
}
