/**
 * Parcours final du site HOMI (navigateur Chromium, 390 × 844, captures + vidéo) :
 *   « / » premier écran (boutons visibles) → corriger la sieste de Léa (1 h 25 → 1 h 10, total −15 min)
 *   → valeur reprise dans le relais → « Mon bébé prend le sein » → carte « Ouvrir Allaitement » → vraie web app
 *   (connexion demandée, outil mémorisé). Ouverture de l'outil une fois connecté : e2e/site_app_retour.py.
 * Usage : node e2e/site_parcours.mjs <url de base> <dossier de sortie>
 */
import { createRequire } from 'node:module';
// Playwright préinstallé (global) ou du projet : résolution CommonJS (NODE_PATH accepté)
const { chromium } = createRequire(import.meta.url)('playwright');
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const base = (process.argv[2] || 'http://localhost:8080').replace(/\/$/, '');
const out = path.resolve(process.argv[3] || 'e2e-out/site');
mkdirSync(out, { recursive: true });
const results = [];
const check = (name, ok, detail = '') => { results.push({ name, ok, detail }); console.log(`${ok ? 'OK ' : 'ÉCHEC'} ${name}${detail ? ' — ' + detail : ''}`); };

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'fr-FR',
  recordVideo: { dir: out, size: { width: 390, height: 844 } },
});
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
// Isolement de la démo : aucune requête vers le backend (Supabase) une fois dans /demo
let inDemo = false;
const backendCalls = [];
page.on('request', (r) => { if (inDemo && /supabase\.co|sb\.fake\.test/.test(r.url())) backendCalls.push(r.method() + ' ' + r.url().replace(/\?.*/, '')); });
const shot = (n) => page.screenshot({ path: path.join(out, `${n}.png`) });

// 1) premier écran
await page.goto(base + '/', { waitUntil: 'networkidle' });
const appBtn = page.locator('[data-cta="hero-app"]');
const inView = async (loc) => { const b = await loc.boundingBox(); return !!b && b.y >= 0 && b.y + b.height <= 844; };
check('premier écran : « Ouvrir HOMI » visible sans défiler', await inView(appBtn));
check('premier écran : « Créer mon compte » visible sans défiler', await inView(page.locator('[data-cta="hero-signup"]')));
check('aucun lien vers la démo sur le site', (await page.locator('a[href*="demo"]').count()) === 0);
check('titre « Sa journée, en un coup d’œil. »', (await page.locator('h1').innerText()).includes('Sa journée, en un coup d’œil.'));
await shot('01-ouverture');
await page.locator('.journal').scrollIntoViewIfNeeded();
await shot('02-journal-lea');
const journalFont = await page.locator('.timeline li').first().evaluate((e) => parseFloat(getComputedStyle(e).fontSize));
check('journal de Léa lisible sur téléphone (≥ 16 px)', journalFont >= 16, `${journalFont}px`);

// 2) correction de la sieste
await page.locator('#sommeil').scrollIntoViewIfNeeded();
await page.waitForTimeout(900);
await page.locator('[data-sleep]').scrollIntoViewIfNeeded();
await shot('03-sommeil-avant');
const btn = page.locator('[data-correct]');
await btn.click();
await btn.click({ force: true, trial: false }).catch(() => undefined); // double appui : sans effet
await page.waitForTimeout(1400);
const nap = await page.locator('[data-sleep] [data-bind="nap"]').innerText();
const total = await page.locator('[data-sleep] [data-bind="total"]').innerText();
const delta = await page.locator('[data-bind="delta"]').innerText();
check('sieste corrigée : 1 h 10', nap === '1 h 10', nap);
check('total des siestes : 1 h 55', total === '1 h 55', total);
check('écart affiché : −15 min', delta.includes('15'), delta);
await shot('04-sommeil-corrige');

// 3) relais
await page.locator('#relais .relay').scrollIntoViewIfNeeded();
await page.waitForTimeout(900);
const relay = await page.locator('#relais .relay').innerText();
check('relais : sieste 1 h 10 reprise', relay.includes('1 h 10') && relay.includes('14 h 20'), relay.split('\n')[2] || '');
check('relais : brouillon à relire', relay.includes('Brouillon à relire'));
await shot('05-relais');

// 4) outils : « Mon bébé prend le sein »
await page.locator('#ask-input').scrollIntoViewIfNeeded();
await page.waitForTimeout(700);
await page.locator('#ask-input').fill('Mon bébé prend le sein');
const card = page.locator('a.result').first();
await card.waitFor({ timeout: 5000 });
const cardText = await card.innerText();
check('carte « Ouvrir Allaitement »', cardText.includes('Ouvrir Allaitement'), cardText.split('\n')[0]);
await card.scrollIntoViewIfNeeded();
await shot('06-outils-recherche');
await page.locator('[data-explore]').scrollIntoViewIfNeeded();
await page.waitForTimeout(600);
await shot('07-explorer');

// 5) un appui → vraie web app : sans session, accueil / connexion, l'adresse de l'outil est mémorisée
await card.click();
await page.waitForURL(/\/(welcome|start|auth)/, { timeout: 60000 }).catch(() => undefined);
await page.waitForTimeout(2000);
check('un appui sans session → connexion à la web app (pas la démo)', /\/(welcome|start|auth)/.test(page.url()) && !/demo/.test(page.url()), page.url().replace(base, ''));
const remembered = await page.evaluate(() => sessionStorage.getItem('homi.returnTo.v1'));
check('outil demandé mémorisé pour après la connexion', !!remembered && remembered.includes('/outil/baby_breastfeed'), remembered || '');
await shot('08-connexion-web-app');
check('aucune erreur JavaScript', errors.length === 0, errors.slice(0, 3).join(' | '));
await ctx.close();
await browser.close();
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} vérifications réussies`);
process.exit(failed.length ? 1 : 0);
