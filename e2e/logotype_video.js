/**
 * Vidéo (webm) du logo HOMI v5 « encre » animé : première ouverture → « Découvrir HOMI » : le corps « M » monte,
 * les deux têtes se posent, « HOMI » se révèle, le point du i se pose, puis le symbole s'ouvre en panneau de verre.
 * Appelé par e2e/logotype.py ; seul :
 *   NODE_PATH=$(npm root -g) NAV_URL=http://127.0.0.1:8995 node e2e/logotype_video.js [sombre]
 * Sortie : $E2E_VIDEO (défaut /tmp/logo5/shots/3-animation-logo.webm).
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { chromium } = require('playwright');

const B = process.env.NAV_URL || 'http://127.0.0.1:8995';
const OUT = process.env.E2E_VIDEO || '/tmp/logo5/shots/3-animation-logo.webm';
const dark = process.argv.includes('sombre');

(async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'homi-logo-video-'));
  const browser = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: 'fr-FR', reducedMotion: 'no-preference',
    recordVideo: { dir, size: { width: 390, height: 844 } },
  });
  const theme = dark ? 'dark' : 'light';
  await ctx.addInitScript(`localStorage.setItem('toietmoi.ui', JSON.stringify({state:{cinematicSeen:false,introSeen:true,themePreference:'${theme}',paletteName:'auto'},version:0}))`);
  const pg = await ctx.newPage();
  await pg.goto(`${B}/`);
  await pg.waitForSelector('[data-testid="discover-logo"]', { timeout: 15000 });
  await pg.waitForTimeout(4000);
  const video = pg.video();
  await ctx.close();
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.renameSync(await video.path(), OUT);
  await browser.close();
  console.log(JSON.stringify({ video: OUT, octets: fs.statSync(OUT).size }));
})().catch((e) => { console.error(e); process.exit(1); });
