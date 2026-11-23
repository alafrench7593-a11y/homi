#!/usr/bin/env node
/**
 * Aperçu web uniquement : Skia (graphiques Victory Native XL) s'appuie sur CanvasKit (WebAssembly). Le fichier
 * `canvaskit.wasm` (8 Mo) est copié dans `public/` à l'installation au lieu d'être versionné (.gitignore).
 * Sans effet sur iOS / Android (Skia natif). Silencieux si le paquet est absent.
 */
const fs = require('fs');
const path = require('path');
try {
  const src = require.resolve('canvaskit-wasm/bin/full/canvaskit.wasm');
  const dir = path.join(__dirname, '..', 'public');
  fs.mkdirSync(dir, { recursive: true });
  fs.copyFileSync(src, path.join(dir, 'canvaskit.wasm'));
} catch {
  // canvaskit-wasm absent : rien à faire
}
