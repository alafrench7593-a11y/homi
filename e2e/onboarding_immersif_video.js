/**
 * Vidéo (webm) du parcours d'accueil v2 en 8 temps, démonstration sans compte, 390×844 (clair par défaut).
 *   python3 e2e/spa_server.py /tmp/onb/web 8931 &
 *   NODE_PATH=$(npm root -g) NAV_URL=http://127.0.0.1:8931 PW_CHROMIUM=/opt/pw-browsers/chromium node e2e/onboarding_immersif_video.js [sombre]
 * Sortie : $ONB_SHOTS (défaut /tmp/onb/shots)/parcours-onboarding-390x844-<clair|sombre>.webm
 * (Le module Python de Playwright de cet environnement n'a pas le bon ffmpeg : la vidéo passe par Node.)
 */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const B = process.env.NAV_URL || 'http://127.0.0.1:8931';
const OUT = process.env.ONB_SHOTS || '/tmp/onb/shots';
const dark = process.argv.includes('sombre');
const tid = (pg, id) => pg.locator(`[data-testid="${id}"]`).first();

async function drag(pg, dx) {
  const box = await pg.locator('[data-testid^="onb-card-"]').first().boundingBox();
  const x = box.x + box.width / 2; const y = box.y + box.height / 2;
  await pg.mouse.move(x, y); await pg.mouse.down();
  for (let i = 1; i <= 18; i++) { await pg.mouse.move(x + (dx * i) / 18, y + (5 * i) / 18); await pg.waitForTimeout(22); }
  await pg.mouse.up(); await pg.waitForTimeout(900);
}

(async () => {
  const dir = path.join(OUT, 'video-tmp');
  fs.mkdirSync(dir, { recursive: true });
  const browser = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: 'fr-FR', colorScheme: dark ? 'dark' : 'light',
    reducedMotion: 'no-preference', recordVideo: { dir, size: { width: 390, height: 844 } },
  });
  await ctx.addInitScript("localStorage.getItem('toietmoi.ui') || localStorage.setItem('toietmoi.ui', JSON.stringify({state:{cinematicSeen:true,introSeen:true},version:0}))");
  const pg = await ctx.newPage();
  await pg.route('http://sb.fake.test/**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
  await pg.goto(`${B}/welcome`); await pg.waitForTimeout(2500);
  await pg.getByRole('button', { name: 'Découvrir sans compte' }).click(); await pg.waitForTimeout(4500);
  await pg.goto(`${B}/onboarding`);
  await tid(pg, 'onb-start').waitFor({ state: 'visible', timeout: 20000 });
  await pg.waitForTimeout(2600);
  await tid(pg, 'onb-start').click(); await pg.waitForTimeout(900);
  for (const s of ['onb-sit-baby', 'onb-sit-cycle']) { await tid(pg, s).click(); await pg.waitForTimeout(450); }
  await tid(pg, 'onb-goal-avoid').click(); await pg.waitForTimeout(900);
  await tid(pg, 'onb-next').click(); await pg.waitForTimeout(900);
  for (const s of ['onb-need-sleep', 'onb-need-mental_load']) { await tid(pg, s).click(); await pg.waitForTimeout(600); }
  await pg.waitForTimeout(700);
  await tid(pg, 'onb-next').click(); await pg.waitForTimeout(900);
  await tid(pg, 'onb-sharing-couple').click(); await pg.waitForTimeout(500);
  await tid(pg, 'onb-helper-daycare').click(); await pg.waitForTimeout(500);
  await pg.getByLabel(/^Votre prénom/).first().pressSequentially('Camille', { delay: 60 }); await pg.waitForTimeout(700);
  await tid(pg, 'onb-next').click(); await pg.waitForTimeout(900);
  await pg.getByLabel(/^Prénom ou surnom/).first().pressSequentially('Lina', { delay: 60 });
  await pg.getByLabel(/^Date de naissance/).first().fill('12/03/2026'); await pg.waitForTimeout(700);
  await tid(pg, 'onb-next').click(); await pg.waitForTimeout(1200);
  await drag(pg, -180); await drag(pg, 180); await drag(pg, -180);
  if (await pg.locator('[data-testid="onb-assign-right"]').count()) { await tid(pg, 'onb-assign-right').click(); await pg.waitForTimeout(900); }
  await pg.waitForTimeout(800);
  await tid(pg, 'onb-next').click(); await pg.waitForTimeout(3200);
  await tid(pg, 'onb-next').click(); await pg.waitForTimeout(2200);
  const rem = pg.locator('[data-testid^="onb-rem-"]');
  if (await rem.count()) { await rem.first().click(); await pg.waitForTimeout(500); }
  await pg.mouse.wheel(0, 400); await pg.waitForTimeout(900);
  await tid(pg, 'onb-next').click(); await pg.waitForTimeout(1200);
  for (const label of ['J’ai 18 ans ou plus', 'J’accepte les conditions d’utilisation et la politique de confidentialité']) {
    const box = pg.getByRole('checkbox', { name: label });
    if (await box.count()) { await box.first().click(); await pg.waitForTimeout(300); }
  }
  await tid(pg, 'onb-finish').click();
  await tid(pg, 'onb-reveal-next').waitFor({ state: 'visible', timeout: 20000 }); await pg.waitForTimeout(2200);
  await tid(pg, 'onb-reveal-next').click(); await pg.waitForTimeout(2600);
  await tid(pg, 'onb-premium-skip').click(); await pg.waitForTimeout(2500);
  const video = pg.video();
  await ctx.close(); await browser.close();
  const target = path.join(OUT, `parcours-onboarding-390x844-${dark ? 'sombre' : 'clair'}.webm`);
  fs.renameSync(await video.path(), target);
  fs.rmSync(dir, { recursive: true, force: true });
  console.log(target);
})().catch((e) => { console.error(e); process.exit(1); });
