/**
 * Interrupteur serveur de l'IA (réglage `ai.enabled` de public.credit_settings, 20261126000100_credits_ia.sql).
 * Couper l'IA sans nouvelle version de l'application :
 *   update public.credit_settings set value = 'false', updated_at = now() where key = 'ai.enabled';
 * Toutes les fonctions qui appellent Gemini le consultent : l'IA coupée se comporte comme une IA non configurée
 * (l'application affiche déjà ce cas ; les outils classiques ne dépendent jamais de l'IA).
 * Lecture mise en cache 30 s par instance ; en cas d'erreur de lecture : IA laissée ouverte (le secret
 * ASSISTANT_ENABLED, la clé GEMINI_API_KEY et la réserve de crédits restent des verrous indépendants).
 */
import { geminiConfig, type GeminiConfig } from './gemini.ts';

interface RpcClient {
  rpc(fn: string, args?: Record<string, unknown>): PromiseLike<{ data: unknown; error: unknown }>;
}

const TTL_MS = 30_000;
let cache: { at: number; open: boolean } | null = null;

export async function aiSwitchOpen(admin: RpcClient, now: number = Date.now()): Promise<boolean> {
  if (cache && now - cache.at < TTL_MS) return cache.open;
  let open = true;
  try {
    const { data, error } = await admin.rpc('_ai_enabled');
    if (!error) open = data !== false;
  } catch {
    open = true;
  }
  cache = { at: now, open };
  return open;
}

/** Configuration Gemini si l'IA est configurée ET ouverte ; sinon null (même réponse qu'une IA non configurée). */
export async function enabledGeminiConfig(admin: RpcClient): Promise<GeminiConfig | null> {
  const cfg = geminiConfig();
  if (!cfg) return null;
  return (await aiSwitchOpen(admin)) ? cfg : null;
}

/** Pour les tests. */
export const __resetAiSwitch = () => { cache = null; };
