/**
 * Chargement des contenus et modules lourds (QA E-06) — version web.
 * `import()` dynamique : à l'export web, Metro place ces modules (catalogues de démo, articles FR et EN, recettes,
 * pdf-lib) dans des fichiers JavaScript séparés, téléchargés seulement à la première utilisation, et non plus dans
 * le fichier de démarrage. Mêmes fonctions que lazyContent.ts (iOS / Android, tout embarqué).
 */
export type DemoCatalog = typeof import('./backend/demoCatalog');
export type EmbeddedRecipesModule = typeof import('@/content/recipes');
export type PdfLib = typeof import('pdf-lib');

export function loadDemoCatalog(): Promise<DemoCatalog> {
  return import('./backend/demoCatalog');
}

export function loadEmbeddedRecipesModule(): Promise<EmbeddedRecipesModule> {
  return import('@/content/recipes');
}

export function loadPdfLib(): Promise<PdfLib> {
  return import('pdf-lib');
}
