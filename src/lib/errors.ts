/**
 * Message d'erreur affichable : toujours en français, jamais de texte technique brut.
 */
import { BackendError } from './backend/types';

const GENERIC = 'Une erreur est survenue. Réessayez dans un instant.';
/** Un message est considéré comme rédigé pour l'utilisatrice s'il est en français. */
const looksFrench = (m: string) => /[àâçéèêëîïôûùüœ’«»]|\b(le|la|les|des|une?|pas|est|vous|votre|ce|cette|pour|avec)\b/i.test(m);

export function friendlyErrorMessage(e: unknown, fallback = GENERIC): string {
  if (e instanceof BackendError) {
    if (e.isNetwork) return 'Pas de connexion internet. Réessayez une fois en ligne.';
    if (/indisponible en mode démonstration/i.test(e.message)) return `${e.message.replace(/ : .*$/, '')}. Cette fonction nécessite la connexion à Supabase.`;
    if (e.code === '42501') return 'Cette action est réservée au propriétaire du foyer ou à l’équipe de modération.';
    if (e.message && looksFrench(e.message)) return e.message;
    return fallback;
  }
  if (e instanceof Error && e.message && looksFrench(e.message)) return e.message;
  if (e instanceof TypeError && /fetch|network/i.test(e.message)) return 'Pas de connexion internet. Réessayez une fois en ligne.';
  return fallback;
}
