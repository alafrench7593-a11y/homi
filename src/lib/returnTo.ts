/**
 * Retour à l'écran demandé après connexion (web : lien direct, favori, actualisation sans session).
 * La garde de session note l'adresse avant de renvoyer vers l'accueil ; le lancement (/app) y revient une fois
 * connecté. Sécurité : chemin interne uniquement (jamais « //hôte » ni d'adresse complète), jamais un écran public
 * (connexion, accueil, démo), validité 30 min, onglet courant seulement (sessionStorage), lu une seule fois.
 */
import { Platform } from 'react-native';

const KEY = 'homi.returnTo.v1';
const TTL_MS = 30 * 60 * 1000;
let memory: { path: string; at: number } | null = null;

const NOT_A_TARGET = /^\/(?:$|app\/?$|welcome|auth\/|start|intro|demo|discover|cinematic)/;

/** Chemin interne acceptable comme destination de retour (sinon null). */
export function safeReturnPath(path: unknown): string | null {
  if (typeof path !== 'string' || path.length > 512) return null;
  if (!path.startsWith('/') || path.startsWith('//') || path.includes('\\') || /[\u0000-\u001f]/.test(path)) return null;
  if (NOT_A_TARGET.test(path)) return null;
  return path;
}

function storage(): Storage | null {
  if (Platform.OS !== 'web') return null;
  try { return typeof window !== 'undefined' ? window.sessionStorage : null; } catch { return null; }
}

export function rememberReturnTo(path: string, now = Date.now()): void {
  const safe = safeReturnPath(path);
  if (!safe) return;
  memory = { path: safe, at: now };
  try { storage()?.setItem(KEY, JSON.stringify(memory)); } catch { /* navigation privée : mémoire seulement */ }
}

/** Destination notée (encore valable), sans l'effacer. */
export function peekReturnTo(now = Date.now()): string | null {
  let v = memory;
  try { const raw = storage()?.getItem(KEY); if (raw) v = JSON.parse(raw); } catch { /* ignoré */ }
  if (!v || now - v.at > TTL_MS) return null;
  return safeReturnPath(v.path);
}

export function clearReturnTo(): void {
  memory = null;
  try { storage()?.removeItem(KEY); } catch { /* ignoré */ }
}
