/**
 * Compile la recherche d'outils de l'application (même catalogue, même moteur) pour la page publique.
 * 1) passe d'enregistrement (Node) : quelles clés de texte le catalogue et la recherche lisent ;
 * 2) passe navigateur : seulement ces textes français → web/site/.build/search.js (léger).
 */
import { build } from 'esbuild';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '../..');
const out = path.join(root, 'web/site/.build');
mkdirSync(out, { recursive: true });

const dictPlugin = (stub) => ({
  name: 'site-dictionaries',
  setup(b) {
    b.onResolve({ filter: /^\.\/dictionaries$/ }, (args) =>
      args.importer.endsWith(path.join('src', 'i18n', 'index.ts')) ? { path: path.join(root, 'web/site/stubs', stub) } : undefined);
  },
});
const common = {
  entryPoints: [path.join(root, 'web/site/search-entry.ts')],
  bundle: true,
  alias: { '@': path.join(root, 'src'), 'expo-localization': path.join(root, 'web/site/stubs/expo-localization.js') },
  logLevel: 'warning',
};

// 1) enregistrement
const recFile = path.join(out, 'record.cjs');
await build({ ...common, platform: 'node', format: 'cjs', outfile: recFile, plugins: [dictPlugin('dictionaries-record.ts')] });
const require = createRequire(import.meta.url);
require(recFile);
const api = globalThis.homiTools;
for (const q of ['Mon bébé prend le sein', 'Où j\'ajoute son poids ?', 'sieste', 'relais', 'biberon', 'fièvre']) api.search(q);
api.categories();
api.stages();
api.all();
const used = {};
for (const k of [...globalThis.__homiUsedKeys].sort()) used[k] = globalThis.__homiDict[k];
writeFileSync(path.join(out, 'fr-used.json'), JSON.stringify(used));

// 2) navigateur
await build({ ...common, platform: 'browser', format: 'iife', minify: true, outfile: path.join(out, 'search.js'), plugins: [dictPlugin('dictionaries-site.ts')] });
console.log(`recherche publique : ${api.count} outils, ${Object.keys(used).length} textes`);
