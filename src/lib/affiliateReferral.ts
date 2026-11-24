/**
 * HOMI Ambassadors — code ambassadeur en attente (lien /r/<code> ou saisie), rattaché au compte après connexion.
 * Stockage local uniquement (aucune donnée personnelle), valable 30 jours (= fenêtre d'attribution du serveur).
 * Le serveur reste seul juge : code inconnu, auto-affiliation ou attribution déjà figée → ignoré sans erreur.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

import { AFFILIATE_CODE, normalizeCode, PENDING_KEY as KEY } from './affiliateProgram';
export { AFFILIATE_CODE, normalizeCode };
const TTL_MS = 30 * 24 * 3600 * 1000;

export type Pending = { code: string; source: 'link' | 'code'; campaign: string; feature: string; at: number };
type Rpc = (fn: string, args?: Record<string, unknown>) => Promise<unknown>;

/** Étiquette de campagne ou de fonctionnalité (même règle que le serveur) ; sinon vide. */
export const cleanTag = (v: unknown) => (typeof v === 'string' && /^[a-z0-9-]{1,32}$/i.test(v) ? v.toLowerCase() : '');

/** Dernier code valable gagne (même règle que le serveur avant le premier paiement). */
export async function rememberAffiliateCode(raw: unknown, source: Pending['source'], campaign?: unknown, feature?: unknown, now = Date.now()): Promise<string | null> {
  const code = normalizeCode(raw);
  if (!code) return null;
  try { await AsyncStorage.setItem(KEY, JSON.stringify({ code, source, campaign: cleanTag(campaign), feature: cleanTag(feature), at: now } satisfies Pending)); } catch { /* ignoré */ }
  return code;
}

export async function pendingAffiliateCode(now = Date.now()): Promise<Pending | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const p = raw ? (JSON.parse(raw) as Pending) : null;
    if (!p || !normalizeCode(p.code) || now - p.at > TTL_MS) { if (raw) await AsyncStorage.removeItem(KEY); return null; }
    return p;
  } catch { return null; }
}

/** Clic anonyme agrégé (aucun identifiant) ; échec silencieux. */
export async function recordAffiliateClick(rpc: Rpc, code: string, campaign?: unknown, feature?: unknown): Promise<void> {
  try { await rpc('affiliate_record_click', { p_code: code, p_campaign: cleanTag(campaign), p_feature: cleanTag(feature) }); } catch { /* ignoré */ }
}

/** Après connexion : rattache le code en attente puis l'efface (sauf erreur réseau : on réessaiera). */
export async function attachPendingAffiliate(rpc: Rpc, now = Date.now()): Promise<string | null> {
  const p = await pendingAffiliateCode(now);
  if (!p) return null;
  try {
    const r = await rpc('affiliate_attach', { p_code: p.code, p_source: p.source, p_campaign: p.campaign ?? '', p_feature: p.feature ?? '' });
    await AsyncStorage.removeItem(KEY);
    return typeof r === 'string' ? r : null;
  } catch { return null; }
}
