/**
 * Politique de confidentialité affichée dans Réglages › Confidentialité.
 * Une seule source de texte : la politique de src/content/legal.ts (PRIVACY), aussi affichée
 * à l'inscription. Texte à faire relire par un juriste / DPO avant publication.
 */
import { PRIVACY } from '@/content/legal';

// Même version que celle enregistrée à l'inscription (LEGAL_VERSIONS.privacy, src/lib/authFlow.ts)
export const PRIVACY_POLICY_VERSION = '2026-10';

export const PRIVACY_POLICY: { title: string; body: string }[] = PRIVACY.sections;
