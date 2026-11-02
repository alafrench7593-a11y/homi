/**
 * Remplaçant d'expo-localization pour les scripts Node des tests (draft_rows.ts, dump_recipes.ts, lancés par tsx).
 * Le vrai module importe react-native, qu'esbuild ne sait pas transformer hors de Metro. Aucune langue de téléphone :
 * @/i18n reste sur la langue source (français), comme la démo ouverte avec locale='fr-FR'.
 * Branché uniquement par e2e/tsconfig.scripts.json ; l'appli et Jest ne l'utilisent jamais.
 */
export function getLocales(): { languageTag: string; languageCode: string | null; regionCode: string | null }[] {
  return [];
}
