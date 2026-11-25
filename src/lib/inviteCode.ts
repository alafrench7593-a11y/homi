/**
 * Invitation du coparent par code à 6 chiffres (26/11/2026). Logique pure et appels serveur ; la validation et la
 * limitation des essais sont faites par le SERVEUR (preview_invite_code, accept_household_invitation).
 */
import { BRAND } from '@/config/brand';

/** Garde les 6 premiers chiffres d'une saisie ou d'un collage (« 123 456 », « Code : 123456 », lien ?code=). */
export function cleanCode(input: string): string {
  const fromLink = /[?&]code=(\d{6})\b/.exec(input)?.[1];
  return (fromLink ?? input.replace(/\D/g, '')).slice(0, 6);
}
export const isFullCode = (c: string) => /^\d{6}$/.test(c);
/** Jeton transmis à accept_household_invitation pour un code court. */
export const codeToken = (c: string) => `c6:${c}`;
export const isCodeToken = (t: string | null | undefined) => !!t && /^c6:\d{6}$/.test(t);
export const appStoreLink = () => `https://apps.apple.com/app/id${BRAND.appStoreId}`;
/** Lien qui ouvre directement l'écran « Rejoindre » si HOMI est installé (le code y est prérempli). */
export const joinDeepLink = (c: string) => `${BRAND.scheme}://join?code=${c}`;
/** « 123 456 » pour l'affichage. */
export const spaced = (c: string) => (c.length === 6 ? `${c.slice(0, 3)} ${c.slice(3)}` : c);

export interface InvitePreview { inviter: string | null; expires_at: string; role: string }
