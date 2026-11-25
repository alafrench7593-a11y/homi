// Planche de contrôle : 3 images par scène (début +0,8 s, milieu, fin −0,8 s), rendues depuis l'Animatic.
import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';
import path from 'node:path';
import { mkdirSync } from 'node:fs';
const root = path.resolve(import.meta.dirname, '..');
const out = path.join(root, 'quality-control/frames'); mkdirSync(out, { recursive: true });
const serveUrl = await bundle({ entryPoint: path.join(root, 'src/index.ts') });
const comp = await selectComposition({ serveUrl, id: 'Animatic', browserExecutable: '/opt/pw-browsers/chromium' });
import { readFileSync } from 'node:fs';
// minutage relu dans src/data/script.ts (source unique) : « id: 's01', … from: 0, to: 12 »
const src = readFileSync(path.join(root, 'src/data/script.ts'), 'utf8');
const scenes = [...src.matchAll(/id: '(s\d+)', title: '[^']*', from: ([\d.]+), to: ([\d.]+)/g)].map((m) => ({ id: m[1], from: +m[2], to: +m[3] }))
  .filter((s) => !process.env.ONLY || process.env.ONLY.split(',').includes(s.id));
for (const s of scenes) {
  for (const [tag, t] of [['a', s.from + 0.8], ['b', (s.from + s.to) / 2], ['c', s.to - 0.8]]) {
    const frame = Math.round(t * comp.fps);
    await renderStill({ composition: comp, serveUrl, frame, output: path.join(out, `${s.id}-${tag}.png`), browserExecutable: '/opt/pw-browsers/chromium', imageFormat: 'png' });
  }
  console.log('ok', s.id);
}
