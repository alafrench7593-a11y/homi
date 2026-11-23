/**
 * Migration des favoris et des récents d'outils (17/11/2026) — module PUR et léger (aucun texte, aucun composant) :
 * il est chargé par le magasin d'état à la restauration.
 *
 * Avant : clé `thème:adresse` (cassait dès que le thème ou la route d'un outil changeait ; « Repas » en avait une par
 * profil). Maintenant : l'identifiant STABLE de l'outil dans le registre (ou `<outil>.<sous-accès>`).
 * Les favoris restent locaux à l'appareil (aucune synchronisation de compte n'existe pour eux).
 */
import { canonicalToolId } from '@/lib/journeys/tools';
import { legacyKeyToToolId } from './toolLegacy';

/**
 * Ancienne clé `thème:adresse` ou ancien identifiant d'outil → identifiant stable actuel. Ordre conservé, doublons
 * et clés inconnues retirés. Idempotent : une liste déjà migrée ressort identique.
 */
export function migrateToolIds(ids: readonly unknown[] | null | undefined): string[] {
  const out: string[] = [];
  for (const raw of ids ?? []) {
    if (typeof raw !== 'string') continue;
    const id = canonicalToolId(raw) ?? canonicalToolId(legacyKeyToToolId(raw));
    if (id && !out.includes(id)) out.push(id);
  }
  return out;
}
