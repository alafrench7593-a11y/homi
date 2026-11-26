// Instagram HOMI — rend toutes les images fixes (publications, carrousels, stories, couvertures, stories à la une) dans renders/instagram/.
// ONLY=Post-02,Story (filtre sur l'identifiant) pour un rendu partiel. Les reels se rendent avec scripts/pub30-render.sh (voir README).
import { bundle } from '@remotion/bundler';
import { getCompositions, renderStill } from '@remotion/renderer';
import path from 'node:path';
import { mkdirSync } from 'node:fs';
const root = path.resolve(import.meta.dirname, '..');
const out = path.join(root, 'renders/instagram'); mkdirSync(out, { recursive: true });
const serveUrl = await bundle({ entryPoint: path.join(root, 'src/index.ts') });
const browserExecutable = '/opt/pw-browsers/chromium';
const only = (process.env.ONLY ?? '').split(',').filter(Boolean);
const comps = (await getCompositions(serveUrl, { browserExecutable })).filter((c) => c.id.startsWith('Insta-') && c.durationInFrames === 1 && (!only.length || only.some((o) => c.id.includes(o))));
for (const c of comps) {
  await renderStill({ composition: c, serveUrl, output: path.join(out, `HOMI-${c.id.replace('Insta-', '')}.png`), imageFormat: 'png', browserExecutable });
}
console.log('ok', comps.length);
