// Pub 30 s — images de contrôle à des instants donnés (TIMES=1.2,3.5 …, ID=Pub30-Vertical|Pub30-Horizontal, SCALE=0.5).
import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';
import path from 'node:path';
import { mkdirSync } from 'node:fs';
const root = path.resolve(import.meta.dirname, '..');
const id = process.env.ID ?? 'Pub30-Vertical';
const out = path.join(root, 'quality-control/pub30', id); mkdirSync(out, { recursive: true });
const serveUrl = await bundle({ entryPoint: path.join(root, 'src/index.ts') });
const comp = await selectComposition({ serveUrl, id, browserExecutable: '/opt/pw-browsers/chromium' });
const times = (process.env.TIMES ?? '1,2.2,3.6,5.5,7.5,9.6,11.9,14.3,15.5,17.5,19.4,22.3,23.9,25.9,27.2,29.5').split(',').map(Number);
for (const t of times) {
  await renderStill({ composition: comp, serveUrl, frame: Math.min(1799, Math.round(t * 60)), output: path.join(out, `t${t.toFixed(1).padStart(4, '0')}.jpg`), imageFormat: 'jpeg', scale: Number(process.env.SCALE ?? 0.5), browserExecutable: '/opt/pw-browsers/chromium' });
}
console.log('ok', times.length);
