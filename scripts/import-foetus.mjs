#!/usr/bin/env node
/**
 * Importe les illustrations fœtus (une par semaine d'aménorrhée) dans l'app.
 * Usage : npm run foetus:import -- "/chemin/vers/le/dossier"
 * Les fichiers doivent contenir le numéro de semaine dans leur nom (sa-04.png, SA 12.webp, 23.jpg…).
 * Chaque image est recadrée en carré, réduite à 1024 px et convertie en WebP (≈ 60–120 Ko),
 * puis le manifeste src/assets/foetus/index.ts est régénéré.
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const src = process.argv[2];
if (!src || !fs.existsSync(src)) {
  console.error('Indiquez le dossier contenant les images : npm run foetus:import -- "/chemin/du/dossier"');
  process.exit(1);
}
const out = path.resolve('src/assets/foetus');
fs.mkdirSync(out, { recursive: true });
const SIZE = Number(process.env.FOETUS_SIZE ?? 1024);

const weeks = new Map();
for (const f of fs.readdirSync(src)) {
  if (!/\.(png|jpe?g|webp)$/i.test(f)) continue;
  const m = f.match(/(\d{1,2})/);
  if (!m) continue;
  const w = Number(m[1]);
  if (w < 4 || w > 42) continue;
  weeks.set(w, path.join(src, f));
}
if (!weeks.size) { console.error('Aucune image avec un numéro de semaine (4 à 42) trouvée.'); process.exit(1); }

for (const [w, file] of [...weeks].sort((a, b) => a[0] - b[0])) {
  const dest = path.join(out, `sa-${String(w).padStart(2, '0')}.webp`);
  await sharp(file).resize(SIZE, SIZE, { fit: 'cover' }).webp({ quality: 82 }).toFile(dest);
  console.log(`  ${w} SA → ${path.relative(process.cwd(), dest)} (${Math.round(fs.statSync(dest).size / 1024)} Ko)`);
}

const all = fs.readdirSync(out).map((f) => f.match(/^sa-(\d{2})\.webp$/)).filter(Boolean).map((m) => Number(m[1])).sort((a, b) => a - b);
const body = all.map((w) => `  ${w}: require('./sa-${String(w).padStart(2, '0')}.webp'),`).join('\n');
fs.writeFileSync(path.join(out, 'index.ts'), `/* Généré par scripts/import-foetus.mjs — ne pas modifier à la main. */
import type { ImageSourcePropType } from 'react-native';

/** Illustrations artistiques par semaine d'aménorrhée (ce ne sont pas des échographies). */
export const FOETUS_IMAGES: Partial<Record<number, ImageSourcePropType>> = {
${body}
};
`);
console.log(`\n${all.length} semaine(s) disponibles dans l'app.`);
