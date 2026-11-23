#!/usr/bin/env node
/**
 * HOMI — photos d'illustration des recettes (générées par IA avec ElevenLabs, novembre 2026).
 *
 * 1. Optimisation (facultative, si --src est donné) : chaque PNG source <slug>.png (1280 × 720) devient
 *      assets/recipes/<slug>.webp        960 × 540, WebP qualité 78, sans métadonnées ;
 *      assets/recipes/thumb/<slug>.webp  480 × 270, WebP qualité 72 (vignettes des listes et du planificateur).
 *    --map slug=chemin.png permet d'ajouter une source hors du dossier (photos pilotes).
 *    Une image déjà présente dans assets/recipes/ sans miniature reçoit seulement sa miniature.
 * 2. Tables générées (toujours) à partir des fichiers présents dans assets/recipes/ :
 *      src/lib/recipes/photoSlugs.generated.ts       liste des recettes illustrées (données pures, utilisable en Node) ;
 *      src/content/recipes/photos.generated.ts       require() statiques (images embarquées, fonctionnent hors ligne).
 *
 * Usage : node scripts/homi/recipe-photos.mjs [--src dossier] [--map slug=fichier.png ...] [--quality 78]
 *         node scripts/homi/recipe-photos.mjs           → régénère seulement les deux tables
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
const OUT = path.join(ROOT, 'assets', 'recipes');
const THUMB = path.join(OUT, 'thumb');
const args = process.argv.slice(2);
const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
const quality = Number(opt('--quality') ?? 78);
const src = opt('--src');
const maps = args.flatMap((a, i) => (args[i - 1] === '--map' ? [a] : []));

fs.mkdirSync(THUMB, { recursive: true });

/** Sources : slug → fichier PNG. */
const sources = new Map();
if (src) for (const f of fs.readdirSync(src)) if (f.endsWith('.png')) sources.set(f.slice(0, -4), path.join(src, f));
for (const m of maps) { const [slug, file] = m.split('='); sources.set(slug, path.resolve(file)); }

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
for (const [slug, file] of [...sources].sort()) {
  if (!SLUG.test(slug)) throw new Error(`identifiant de recette invalide : ${slug}`);
  // sharp n'écrit aucune métadonnée (EXIF, XMP, ICC) sans withMetadata() : les fichiers produits en sont dépourvus.
  await sharp(file).resize(960, 540, { fit: 'cover' }).webp({ quality, effort: 6 }).toFile(path.join(OUT, `${slug}.webp`));
  await sharp(file).resize(480, 270, { fit: 'cover' }).webp({ quality: Math.min(quality, 72), effort: 6 }).toFile(path.join(THUMB, `${slug}.webp`));
}

const slugs = fs.readdirSync(OUT).filter((f) => f.endsWith('.webp')).map((f) => f.slice(0, -5)).sort();
for (const slug of slugs) {
  const t = path.join(THUMB, `${slug}.webp`);
  if (!fs.existsSync(t)) await sharp(path.join(OUT, `${slug}.webp`)).resize(480, 270, { fit: 'cover' }).webp({ quality: 72, effort: 6 }).toFile(t);
}

const head = '// FICHIER GÉNÉRÉ par scripts/homi/recipe-photos.mjs — ne pas modifier à la main.\n';
fs.writeFileSync(path.join(ROOT, 'src', 'lib', 'recipes', 'photoSlugs.generated.ts'),
  `${head}/** Recettes de la bibliothèque qui ont une photo d'illustration embarquée (assets/recipes/<slug>.webp). */\n`
  + `export const RECIPE_PHOTO_SLUGS: readonly string[] = [\n${slugs.map((s) => `  '${s}',`).join('\n')}\n];\n`);
fs.writeFileSync(path.join(ROOT, 'src', 'content', 'recipes', 'photos.generated.ts'),
  `${head}/** Fichiers embarqués des photos d'illustration : image principale (960 × 540) et miniature (480 × 270). */\n`
  + `import type { ImageSourcePropType } from 'react-native';\n\n`
  + `export const RECIPE_PHOTO_ASSETS: Record<string, { full: ImageSourcePropType; thumb: ImageSourcePropType }> = {\n`
  + slugs.map((s) => `  '${s}': { full: require('../../../assets/recipes/${s}.webp'), thumb: require('../../../assets/recipes/thumb/${s}.webp') },`).join('\n')
  + '\n};\n');

const size = (dir) => fs.readdirSync(dir).filter((f) => f.endsWith('.webp')).reduce((n, f) => n + fs.statSync(path.join(dir, f)).size, 0);
const main = size(OUT); const thumbs = size(THUMB);
const biggest = slugs.map((s) => [s, fs.statSync(path.join(OUT, `${s}.webp`)).size]).sort((a, b) => b[1] - a[1])[0];
console.log(`${sources.size} image(s) optimisée(s) ; ${slugs.length} recettes illustrées.`);
console.log(`Poids : principales ${(main / 1e6).toFixed(2)} Mo, miniatures ${(thumbs / 1e6).toFixed(2)} Mo, total ${((main + thumbs) / 1e6).toFixed(2)} Mo ; plus lourde ${biggest?.[0]} (${Math.round((biggest?.[1] ?? 0) / 1024)} Ko).`);
