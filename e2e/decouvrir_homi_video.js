/**
 * Enregistrement vidéo (webm) de l'ouverture de « Découvrir HOMI » : première ouverture, la maison s'illumine et
 * s'ouvre en panneau de verre, scènes, puis deux changements de chapitre et une démo du catalogue.
 *   python3 e2e/spa_server.py /tmp/discover/dist 19347 &
 *   NODE_PATH=$(npm root -g) NAV_URL=http://127.0.0.1:19347 node e2e/decouvrir_homi_video.js [sombre]
 * Sortie : $E2E_VIDEO (défaut /tmp/discover/video)/decouvrir-homi-<clair|sombre>.webm
 */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const B = process.env.NAV_URL || 'http://127.0.0.1:19347';
const OUT = process.env.E2E_VIDEO || '/tmp/discover/video';
const dark = process.argv.includes('sombre');

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: 'fr-FR', colorScheme: dark ? 'dark' : 'light',
    reducedMotion: 'no-preference', recordVideo: { dir: OUT, size: { width: 390, height: 844 } },
  });
  const pg = await ctx.newPage();
  await pg.goto(`${B}/`);
  await pg.waitForSelector('[data-testid="discover-opening"]', { timeout: 10000 });
  await pg.waitForTimeout(6500);
  for (let i = 0; i < 2; i++) { await pg.click('[data-testid="discover-next"]'); await pg.waitForTimeout(3200); }
  await pg.click('[data-testid="discover-catalog"]');
  await pg.waitForTimeout(1500);
  await pg.click('[data-testid="discover-tile-baby_bottle"]');
  await pg.waitForTimeout(3500);
  await pg.goBack();
  await pg.waitForTimeout(1500);
  const video = pg.video();
  await ctx.close();
  const target = path.join(OUT, `decouvrir-homi-${dark ? 'sombre' : 'clair'}.webm`);
  fs.renameSync(await video.path(), target);
  await browser.close();
  console.log(JSON.stringify({ video: target, octets: fs.statSync(target).size }));
})().catch((e) => { console.error(e); process.exit(1); });
