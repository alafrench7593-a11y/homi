/**
 * Politique de confidentialité affichée dans Réglages › Confidentialité.
 * Une seule source de texte : la politique de src/content/legal.ts (PRIVACY), aussi affichée
 * à l'inscription. Texte à faire relire par un juriste / DPO avant publication.
 */
import { PRIVACY } from '@/content/legal';

// Même version que celle enregistrée à l'inscription (LEGAL_VERSIONS.privacy, src/lib/authFlow.ts)
export const PRIVACY_POLICY_VERSION = '2026-10';

// Lu à chaque accès : suit la langue en cours (PRIVACY est déjà bilingue)
export const PRIVACY_POLICY: { title: string; body: string }[] = new Proxy([] as { title: string; body: string }[], {
  get: (_t, prop) => {
    const arr = PRIVACY.sections;
    const v = Reflect.get(arr, prop, arr);
    return typeof v === 'function' ? (v as (...a: unknown[]) => unknown).bind(arr) : v;
  },
  has: (_t, prop) => Reflect.has(PRIVACY.sections, prop),
  ownKeys: () => Reflect.ownKeys(PRIVACY.sections),
  getOwnPropertyDescriptor: (_t, prop) => { const d = Reflect.getOwnPropertyDescriptor(PRIVACY.sections, prop); return d ? { ...d, configurable: true } : undefined; },
});
