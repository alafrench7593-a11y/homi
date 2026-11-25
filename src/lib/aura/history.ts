/**
 * Historique des conversations Aura (25/11/2026, retour iPhone « garder l'historique ») — SUR L'APPAREIL, par compte.
 *  - clé `homi.aura.history.<userId>` : effacée à la déconnexion et à la suppression du compte (accountReset) ;
 *  - jamais partagé avec le coparent ; aucun envoi au serveur ;
 *  - les réponses en cours ou en erreur ne sont pas gardées ; une action proposée revient en lecture seule
 *    (elle n'est jamais ré-enregistrée sans un nouvel appui sur « Refaire »).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface StoredMsg { id: string; role: 'user' | 'aura'; text?: string; reply?: { kind: string; [k: string]: unknown } }
export interface StoredConversation { id: string; title: string; updatedAt: string; msgs: StoredMsg[] }

export const MAX_CONVERSATIONS = 50;
export const MAX_MESSAGES = 120;
const key = (userId: string) => `homi.aura.history.${userId}`;

/** Garde ce qui peut être relu sans risque (pas d'attente, pas d'erreur ; actions marquées « déjà proposées »). */
export function storable(msgs: readonly StoredMsg[]): StoredMsg[] {
  return msgs
    .filter((m) => m.role === 'user' ? !!m.text : !!m.reply && m.reply.kind !== 'pending' && m.reply.kind !== 'error')
    .map((m) => (m.reply?.kind === 'intent' ? { ...m, reply: { ...m.reply, restored: true } } : m))
    .slice(-MAX_MESSAGES);
}

/** Titre automatique : la première question, raccourcie. */
export function titleOf(msgs: readonly StoredMsg[]): string {
  const first = msgs.find((m) => m.role === 'user' && m.text)?.text ?? '';
  const t = first.replace(/\s+/g, ' ').trim();
  return t.length > 60 ? `${t.slice(0, 57)}…` : t;
}

export async function loadConversations(userId: string): Promise<StoredConversation[]> {
  try {
    const raw = await AsyncStorage.getItem(key(userId));
    const list = raw ? (JSON.parse(raw) as StoredConversation[]) : [];
    return Array.isArray(list) ? list.filter((c) => c && typeof c.id === 'string' && Array.isArray(c.msgs)) : [];
  } catch { return []; }
}

async function write(userId: string, list: StoredConversation[]) {
  await AsyncStorage.setItem(key(userId), JSON.stringify(list.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, MAX_CONVERSATIONS)));
}

export async function saveConversation(userId: string, id: string, msgs: readonly StoredMsg[], now = new Date()): Promise<void> {
  const kept = storable(msgs);
  if (!kept.some((m) => m.role === 'user')) return;
  const list = await loadConversations(userId);
  const prev = list.find((c) => c.id === id);
  const conv: StoredConversation = { id, title: prev?.title || titleOf(kept), updatedAt: now.toISOString(), msgs: kept };
  await write(userId, [conv, ...list.filter((c) => c.id !== id)]);
}

export async function renameConversation(userId: string, id: string, title: string): Promise<void> {
  const list = await loadConversations(userId);
  const t = title.replace(/\s+/g, ' ').trim().slice(0, 80);
  if (!t) return;
  await write(userId, list.map((c) => (c.id === id ? { ...c, title: t } : c)));
}

export async function deleteConversation(userId: string, id: string): Promise<void> {
  await write(userId, (await loadConversations(userId)).filter((c) => c.id !== id));
}

export async function clearConversations(userId: string): Promise<void> {
  await AsyncStorage.removeItem(key(userId));
}

/** Recherche sans accents ni majuscules dans les titres et les messages. */
export function searchConversations(list: readonly StoredConversation[], query: string): StoredConversation[] {
  const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const q = fold(query.trim());
  if (!q) return [...list];
  return list.filter((c) => fold(c.title).includes(q) || c.msgs.some((m) => fold(m.text ?? String((m.reply as { answer?: string } | undefined)?.answer ?? '')).includes(q)));
}
