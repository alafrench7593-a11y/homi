/**
 * Message d'erreur affichable dans la langue de l'application, jamais de texte technique brut.
 */
import { t as tr, getLocale } from '@/i18n';
import { BackendError } from './backend/types';

/** Un message est considéré comme rédigé pour l'utilisatrice s'il est en français. */
const looksFrench = (m: string) => /[àâçéèêëîïôûùüœ’«»]|\b(le|la|les|des|une?|pas|est|vous|votre|ce|cette|pour|avec)\b/i.test(m);
/** Hors français : une phrase complète (majuscule, ponctuation finale) sans jargon technique est un message de l'application. */
const looksUserFacing = (m: string) =>
  /^[A-Z][^\n]{3,200}[.!?]$/.test(m) && !/[àâçéèêëîïôûùüœ«»]/i.test(m) && !/\b(error|exception|undefined|null|fetch|jwt|sql|column|relation|violates|stack|token|http|json|rpc)\b/i.test(m);
const readable = (m: string) => (getLocale() === 'fr' ? looksFrench(m) : looksUserFacing(m));

export function friendlyErrorMessage(e: unknown, fallback = tr('l5.err.generic')): string {
  if (e instanceof BackendError) {
    if (e.isNetwork) return tr('l5.err.offline');
    if (/indisponible en mode démonstration/i.test(e.message)) {
      return getLocale() === 'fr' ? `${e.message.replace(/ : .*$/, '')}. Cette fonction nécessite la connexion à Supabase.` : tr('l5.err.demoOnly');
    }
    if (e.code === '42501') return tr('l5.err.forbidden');
    if (e.message && readable(e.message)) return e.message;
    return fallback;
  }
  if (e instanceof Error && e.message && readable(e.message)) return e.message;
  if (e instanceof TypeError && /fetch|network/i.test(e.message)) return tr('l5.err.offline');
  return fallback;
}
