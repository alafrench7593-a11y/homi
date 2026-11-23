/**
 * Correction d'une mesure depuis sa fiche (courbes : croissance, poids de grossesse) — 22/11/2026.
 * Mise à jour de la ligne d'ORIGINE (même table, même identifiant : aucune copie), puis invalidation de la table :
 * l'écran, sa catégorie et l'accueil relisent la même donnée. (Température : useSaveObservation, chemin du formulaire.)
 */
import { useMutation } from '@tanstack/react-query';
import { backend, eq } from '@/lib/backend';
import { useInvalidate } from './hooks';

type MeasureTable = 'child_measurements' | 'maternal_weights';

export function useCorrectMeasure(table: MeasureTable) {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Record<string, number | string | null> }) => backend.update(table, patch, [eq('id', id)]),
    onSuccess: () => inv(table),
  });
}
