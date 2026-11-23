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

let prefetched = false;
/**
 * Préchargement de la visite (ticket 1) : sur les écrans d'où l'on peut « Découvrir sans compte » (/welcome, /intro,
 * /start), les morceaux de la démonstration (catalogues, articles, recettes : plusieurs Mo) sont téléchargés pendant
 * que la personne lit, une fois la page affichée et au repos. L'appui sur « Découvrir sans compte » n'attend plus ce
 * téléchargement. Échec (hors ligne) : sans conséquence, le chargement normal réessaiera.
 */
export function prefetchDemoContent(): void {
  if (prefetched) return;
  prefetched = true;
  const go = () => { void Promise.all([loadDemoCatalog(), loadEmbeddedRecipesModule()]).catch(() => { prefetched = false; }); };
  const idle = (globalThis as { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => void }).requestIdleCallback;
  setTimeout(() => (idle ? idle(go, { timeout: 2000 }) : go()), 1200);
}
