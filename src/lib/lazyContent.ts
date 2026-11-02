/**
 * Chargement des contenus et modules lourds (QA E-06) — version iOS / Android (et tests).
 * Sur l'appareil, tout reste embarqué dans l'application et disponible hors ligne : simple `require`, aucune
 * requête réseau. La version web (lazyContent.web.ts) les charge en morceaux séparés, à la première utilisation.
 */
export type DemoCatalog = typeof import('./backend/demoCatalog');
export type EmbeddedRecipesModule = typeof import('@/content/recipes');
export type PdfLib = typeof import('pdf-lib');

export function loadDemoCatalog(): Promise<DemoCatalog> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return Promise.resolve(require('./backend/demoCatalog') as DemoCatalog);
}

export function loadEmbeddedRecipesModule(): Promise<EmbeddedRecipesModule> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return Promise.resolve(require('@/content/recipes') as EmbeddedRecipesModule);
}

export function loadPdfLib(): Promise<PdfLib> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return Promise.resolve(require('pdf-lib') as PdfLib);
}
