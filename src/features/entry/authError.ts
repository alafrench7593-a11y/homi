/**
 * Message d'erreur des écrans d'entrée (connexion, mot de passe oublié, nouveau mot de passe).
 * Réseau coupé → « Pas de connexion internet » (traduit) ; sinon le message du service de connexion, déjà traduit
 * par le client (`friendlyAuthError`) ; à défaut, le message générique de l'écran.
 * (`friendlyErrorMessage` seul écarterait des messages traduits courts comme « Adresse e-mail ou mot de passe incorrect ».)
 */
import { t as tr } from '@/i18n';
import { BackendError } from '@/lib/backend/types';

export function entryErrorMessage(e: unknown, fallback: string): string {
  if (e instanceof BackendError && e.isNetwork) return tr('l5.err.offline');
  if (e instanceof TypeError && /fetch|network/i.test(e.message)) return tr('l5.err.offline');
  return e instanceof Error && e.message ? e.message : fallback;
}
