/**
 * Site HOMI (Vercel) — à lancer APRÈS `expo export --platform web --output-dir <dist>`.
 *
 *   /            page publique statique (web/site) : indexable en production, aucune donnée familiale
 *   /demo        coquille de l'application (titre et aperçu « démo »), indexable en production
 *   /app, …      coquille de l'application (app.html) : noindex, titre générique (rien de familial dans le HTML)
 *   /mentions-legales/, /confidentialite/, /cgu/, /aide/, /suppression-compte/   pages légales statiques (legal-site)
 *
 * Variables : SITE_URL (adresse canonique ; sinon celle de Vercel), VERCEL_ENV (production → indexation permise).
 * Usage : node scripts/web/build-site.mjs [dist]
 */
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, renameSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '../..');
const dist = path.resolve(process.argv[2] || path.join(root, 'dist'));
const site = path.join(root, 'web/site');
if (!existsSync(path.join(dist, 'index.html')) && !existsSync(path.join(dist, 'app.html'))) {
  console.error(`build-site : ${dist} ne contient pas l'export web (expo export).`);
  process.exit(1);
}

const env = process.env;
const production = env.VERCEL_ENV === 'production';
const siteUrl = (env.SITE_URL
  || (production && env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${env.VERCEL_PROJECT_PRODUCTION_URL}` : '')
  || (env.VERCEL_URL ? `https://${env.VERCEL_URL}` : 'http://localhost:8080')).replace(/\/$/, '');
const robotsPublic = production ? 'index, follow' : 'noindex, nofollow';
const version = (env.VERCEL_GIT_COMMIT_SHA || String(Date.now())).slice(0, 10);

// 1) recherche d'outils : même catalogue et même moteur que l'application
execFileSync(process.execPath, [path.join(root, 'scripts/web/bundle-search.mjs')], { stdio: 'inherit' });

// 2) coquille de l'application : index.html → app.html (l'export n'est jamais servi sur « / »)
const shellPath = path.join(dist, 'app.html');
if (existsSync(path.join(dist, 'index.html')) && !readFileSync(path.join(dist, 'index.html'), 'utf8').includes('data-homi-site')) {
  renameSync(path.join(dist, 'index.html'), shellPath);
}
const rawShell = readFileSync(shellPath, 'utf8');
const shell = (title, description, robots, canonical) => rawShell
  .replace('<html lang="en">', '<html lang="fr">')
  .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>\n    <meta name="description" content="${description}" />\n    <meta name="robots" content="${robots}" />${canonical ? `\n    <link rel="canonical" href="${canonical}" />` : ''}\n    <meta property="og:title" content="${title}" />\n    <meta property="og:description" content="${description}" />\n    <meta property="og:image" content="${siteUrl}/og.png" />\n    <meta name="twitter:card" content="summary_large_image" />`)
  .replace('You need to enable JavaScript to run this app.', 'HOMI a besoin de JavaScript pour fonctionner.');
// Pages privées : titre générique, jamais indexées, aperçu de lien sans contenu familial
writeFileSync(shellPath, shell('HOMI', 'Ton espace HOMI.', 'noindex, nofollow', null));
writeFileSync(path.join(dist, 'demo.html'), shell('Démo HOMI — une famille fictive, sans compte', 'Essaie HOMI avec une famille fictive : journal, sommeil, biberons, allaitement, relais. Sans compte, rien n’est enregistré sur nos serveurs.', 'noindex, nofollow', null));

// 3) page publique
const logo = readFileSync(path.join(root, 'assets/brand/homi-logo-mono.svg'), 'utf8').replace('<svg ', '<svg aria-hidden="true" focusable="false" ').replace(/ role="img" aria-label="HOMI"/, '');
const html = readFileSync(path.join(site, 'index.html'), 'utf8')
  .replaceAll('{{LOGO}}', logo).replaceAll('{{SITE_URL}}', siteUrl).replaceAll('{{ROBOTS}}', robotsPublic).replaceAll('{{VERSION}}', version)
  .replace('<html lang="fr">', '<html lang="fr" data-homi-site>');
writeFileSync(path.join(dist, 'index.html'), html);
mkdirSync(path.join(dist, 'site/fonts'), { recursive: true });
for (const f of ['site.css', 'site.js']) cpSync(path.join(site, f), path.join(dist, 'site', f));
cpSync(path.join(site, '.build/search.js'), path.join(dist, 'site/search.js'));
for (const w of ['600SemiBold', '800ExtraBold']) {
  cpSync(path.join(root, `node_modules/@expo-google-fonts/manrope/${w}/Manrope_${w}.ttf`), path.join(dist, `site/fonts/Manrope_${w}.ttf`));
}
cpSync(path.join(site, 'og.png'), path.join(dist, 'og.png'));

// 4) pages légales statiques (déjà publiées dans legal-site/)
const legal = readdirSync(path.join(root, 'legal-site')).filter((d) => statSync(path.join(root, 'legal-site', d)).isDirectory());
for (const d of legal) cpSync(path.join(root, 'legal-site', d), path.join(dist, d), { recursive: true });

// 5) robots.txt et sitemap : seulement les pages publiques
const pub = ['/', ...legal.map((d) => `/${d}/`)];
writeFileSync(path.join(dist, 'robots.txt'), production
  ? `User-agent: *\nAllow: /\nDisallow: /app\nDisallow: /auth/\nSitemap: ${siteUrl}/sitemap.xml\n`
  : 'User-agent: *\nDisallow: /\n');
writeFileSync(path.join(dist, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pub.map((p) => `  <url><loc>${siteUrl}${p}</loc></url>`).join('\n')}\n</urlset>\n`);

console.log(`site HOMI prêt dans ${dist} — ${siteUrl} — ${production ? 'production (indexable)' : 'aperçu (noindex)'} — pages légales : ${legal.join(', ')}`);
