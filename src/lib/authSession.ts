import { backend } from './backend';

/** Session présente ? Une erreur de lecture compte comme « pas de session » : l'écran passe alors à l'état d'erreur au lieu de rester sur « Activation… ». */
export async function hasSession(): Promise<boolean> {
  try {
    return !!(await backend.auth.getSession());
  } catch {
    return false;
  }
}

/**
 * A-09 : sur le web, le client échange déjà le ?code= au chargement (detectSessionInUrl).
 * Un second échange échouait toujours (vérificateur consommé) : on attend la session à la place.
 */
export async function waitForSession(timeoutMs = 4000, stepMs = 250): Promise<boolean> {
  const end = Date.now() + timeoutMs;
  for (;;) {
    if (await hasSession()) return true;
    if (Date.now() >= end) return false;
    await new Promise((r) => setTimeout(r, stepMs));
  }
}

