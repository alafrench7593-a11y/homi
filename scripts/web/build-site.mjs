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
import { createRequire } from 'node:module';
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
// Adresse officielle : homifamille.com (domaine acheté le 24/11/2026) ; SITE_URL la remplace si besoin
const OFFICIAL = 'https://homifamille.com';
const siteUrl = (env.SITE_URL
  || (production ? OFFICIAL : '')
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
// menu et pied de page communs (web/site/partials) : mêmes liens sur toutes les pages publiques
const partial = (n) => readFileSync(path.join(site, 'partials', n), 'utf8');
let toolCount = 0;
const withChrome = (h) => h.replace('<!--HOMI_MENU-->', partial('menu.html')).replace('<!--HOMI_FOOTER-->', partial('footer.html'))
  .replaceAll('{{LOGO}}', logo).replaceAll('{{TOOL_COUNT}}', String(toolCount || 120));
{
  const req0 = createRequire(import.meta.url);
  globalThis.window = globalThis; globalThis.document = globalThis.document ?? {};
  req0(path.join(site, '.build/search.js'));
  toolCount = globalThis.homiTools.all().tools.length;
}
const html = withChrome(readFileSync(path.join(site, 'index.html'), 'utf8'))
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
// icônes du site : nouvelle identité « noir sur blanc » (assets/brand/homi-logo-noir-sur-blanc-1024.png), générées par
// scripts/web/site-icons.py (favicon.ico 16/32/48, icon-32.png, apple-touch-icon.png 180, icon-512.png)
execFileSync('python3', [path.join(root, 'scripts/web/site-icons.py'), path.join(root, 'assets/brand/homi-logo-noir-sur-blanc-1024.png'), dist], { stdio: 'inherit' });
cpSync(path.join(site, 'screens'), path.join(dist, 'site/screens'), { recursive: true });
mkdirSync(path.join(dist, 'site/illus'), { recursive: true });
for (const n of ['projet-bebe', 'grossesse', 'bebe', 'enfants', 'famille', 'foyer-maison']) cpSync(path.join(root, `assets/illustrations/${n}.webp`), path.join(dist, `site/illus/${n}.webp`));

// 3 bis) programme Ambassadeurs : page statique + simulateur (même module de calcul que l'app), conditions lues en
// direct dans Supabase (vue publique ambassador_terms_public ; clé « anon » publique, aucune donnée personnelle)
{
  const { build: esb } = await import('esbuild');
  await esb({ entryPoints: [path.join(site, 'ambassadeurs-entry.ts')], bundle: true, minify: true, format: 'iife', target: 'es2019',
    alias: { '@': path.join(root, 'src') }, outfile: path.join(dist, 'site/ambassadeurs.js'), logLevel: 'warning' });
  cpSync(path.join(site, 'ambassadeurs.css'), path.join(dist, 'site/ambassadeurs.css'));
  const amb = withChrome(readFileSync(path.join(site, 'ambassadeurs.html'), 'utf8'))
    .replaceAll('{{LOGO}}', logo).replaceAll('{{SITE_URL}}', siteUrl).replaceAll('{{ROBOTS}}', robotsPublic).replaceAll('{{VERSION}}', version)
    .replaceAll('{{SB_URL}}', (env.EXPO_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '')).replaceAll('{{SB_KEY}}', env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '');
  mkdirSync(path.join(dist, 'ambassadeurs'), { recursive: true });
  writeFileSync(path.join(dist, 'ambassadeurs', 'index.html'), amb);
}

// 3 ter) /fonctionnalites/ : TOUS les outils réels (catalogue de l'app, toutes étapes de vie), écrits dans le HTML
// (indexables sans JavaScript) + galerie des captures réelles (web/site/screens, scripts : e2e/captures_site.py)
{
  const req = createRequire(import.meta.url);
  globalThis.window = globalThis; globalThis.document = globalThis.document ?? {};
  req(path.join(site, '.build/search.js'));
  const { stages, tools } = globalThis.homiTools.all();
  const esc = (v) => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  // écran réel associé à un outil (seulement les captures validées)
  const SHOT = { kid_sleep: ['sommeil', 'Sommeil de nuit'], baby_bottle: ['biberon', 'Noter un biberon'], baby_bottle_timer: ['journee-biberons', 'Journée des biberons'],
    baby_breastfeed: ['allaitement', 'Allaitement'], kid_grow: ['developpement', 'Développement'], baby_foods: ['diversification', 'Diversification'],
    journal: ['journal', 'Journal complet'], baby_diaper: ['couches', 'Couches'], family_calendar: ['agenda', 'Agenda familial'],
    family_nights: ['relais-nuit', 'Relais de nuit'], mental_load: ['charge-mentale', 'Charge mentale'], family_tasks: ['taches', 'Organisation familiale'],
    community: ['communaute', 'Communauté'], summary: ['resume', 'Résumés'] };
  const EXTRA = [['accueil', 'Tableau de bord', '/app'], ['croissance', 'Courbes de croissance', null], ['contractions', 'Chronomètre des contractions', null]];
  const byId = new Map(tools.map((t) => [t.id, t]));
  const gallery = [
    ...EXTRA.slice(0, 1).map(([f, label, href]) => ({ f, label, sub: 'Toute la famille sur un seul écran.', href })),
    ...Object.entries(SHOT).filter(([id]) => byId.has(id)).map(([id, [f, label]]) => ({ f, label, sub: byId.get(id).sub, href: `/outil/${id}` })),
    ...EXTRA.slice(1).map(([f, label]) => ({ f, label, sub: f === 'croissance' ? 'Poids, taille et repères OMS en courbes.' : 'Un appui au début, un appui à la fin : durée et intervalle calculés.', href: null })),
  ];
  const galleryHtml = gallery.map((g, i) => `<li><figure><span class="shot"><img src="/site/screens/${g.f}.webp" alt="Écran « ${esc(g.label)} » de l’application HOMI" width="390" height="810" ${i > 2 ? 'loading="lazy" ' : ''}decoding="async"></span><figcaption>${g.href ? `<a href="${g.href}">${esc(g.label)}</a>` : esc(g.label)}<span>${esc(g.sub)}</span></figcaption></figure></li>`).join('');
  const stagesHtml = `<button type="button" data-stage="all" aria-pressed="true">Tout</button>` + stages.map((s) => `<button type="button" data-stage="${s.key}" aria-pressed="false">${esc(s.title)}</button>`).join('');
  const groups = new Map();
  for (const t of tools) { if (!groups.has(t.categoryTitle)) groups.set(t.categoryTitle, []); groups.get(t.categoryTitle).push(t); }
  const catsHtml = [...groups.entries()].map(([title, list], i) => `<section class="feat-cat" aria-labelledby="fc-${i}"><h3 id="fc-${i}">${esc(title)} <span class="muted">· ${list.length}</span></h3><ul class="feat-list" role="list">${
    list.map((t) => `<li class="feat-item" data-id="${esc(t.id)}" data-stages="${t.stages.join(' ')}"><a href="/outil/${esc(t.id)}"><b>${esc(t.label)}</b><span>${esc(t.sub)}</span>${SHOT[t.id] ? '<em class="feat-cam">Écran réel ci-dessus</em>' : ''}</a></li>`).join('')}</ul></section>`).join('\n');
  const jsonld = JSON.stringify({ '@context': 'https://schema.org', '@graph': [
    { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Accueil', item: `${siteUrl}/` }, { '@type': 'ListItem', position: 2, name: 'Fonctionnalités', item: `${siteUrl}/fonctionnalites/` }] },
    { '@type': 'ItemList', name: 'Fonctionnalités de HOMI', numberOfItems: tools.length, itemListElement: tools.map((t, i) => ({ '@type': 'ListItem', position: i + 1, name: t.label, description: t.sub })) },
  ] }).replace(/</g, '\\u003c');
  const feat = withChrome(readFileSync(path.join(site, 'fonctionnalites.html'), 'utf8'))
    .replaceAll('{{LOGO}}', logo).replaceAll('{{SITE_URL}}', siteUrl).replaceAll('{{ROBOTS}}', robotsPublic).replaceAll('{{VERSION}}', version)
    .replaceAll('{{COUNT}}', String(tools.length)).replace('{{GALLERY}}', galleryHtml).replace('{{STAGES}}', stagesHtml)
    .replace('{{CATEGORIES}}', catsHtml).replace('{{JSONLD}}', jsonld);
  mkdirSync(path.join(dist, 'fonctionnalites'), { recursive: true });
  writeFileSync(path.join(dist, 'fonctionnalites', 'index.html'), feat);
  for (const f of ['fonctionnalites.css', 'fonctionnalites.js']) cpSync(path.join(site, f), path.join(dist, 'site', f));
}

// 3 quater) /contact/ (envoi direct seulement si CONTACT_ENDPOINT est configuré ; sinon messagerie pré-remplie) et
// /llms.txt (résumé factuel pour les assistants IA ; aucune garantie de référencement)
{
  const contactEndpoint = (env.CONTACT_ENDPOINT || '').trim();
  const jsonldContact = JSON.stringify({ '@context': 'https://schema.org', '@graph': [
    { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Accueil', item: `${siteUrl}/` }, { '@type': 'ListItem', position: 2, name: 'Contact', item: `${siteUrl}/contact/` }] },
    { '@type': 'ContactPage', name: 'Contacter HOMI', url: `${siteUrl}/contact/` },
  ] });
  const contact = withChrome(readFileSync(path.join(site, 'contact.html'), 'utf8'))
    .replaceAll('{{SITE_URL}}', siteUrl).replaceAll('{{ROBOTS}}', robotsPublic).replaceAll('{{VERSION}}', version)
    .replace('{{CONTACT_ENDPOINT}}', contactEndpoint).replace('{{JSONLD}}', jsonldContact);
  mkdirSync(path.join(dist, 'contact'), { recursive: true });
  writeFileSync(path.join(dist, 'contact', 'index.html'), contact);
  for (const f of ['contact.css', 'contact.js']) cpSync(path.join(site, f), path.join(dist, 'site', f));
  const { stages: st, tools: all } = globalThis.homiTools.all();
  const byCat = new Map(); for (const t of all) { if (!byCat.has(t.categoryTitle)) byCat.set(t.categoryTitle, []); byCat.get(t.categoryTitle).push(t); }
  writeFileSync(path.join(dist, 'llms.txt'), `# HOMI

> HOMI est une application web pour toute la famille, de la contraception aux 10 ans de l'enfant : cycle et projet bébé,
> grossesse, après la naissance, suivi du bébé (sommeil, biberons, allaitement, couches, croissance, vaccins, dents),
> enfance, et organisation familiale partagée entre parents (relais, tâches, agenda, charge mentale).
> Éditeur : David PRINCIVIL, entrepreneur individuel (France). Contact : homixyz@gmail.com. Instagram : @homi_famille.
> HOMI n'est pas un dispositif médical et ne remplace pas un professionnel de santé ; Aura, l'assistante intégrée, ne pose
> pas de diagnostic et ne calcule aucune dose de médicament. Disponible dans le navigateur ; pas encore sur l'App Store.

## Pages
- [Présentation](${siteUrl}/): ce qu'est HOMI et à qui il s'adresse
- [Toutes les fonctionnalités](${siteUrl}/fonctionnalites/): les ${all.length} outils réels, par étape de vie
- [Programme Ambassadeurs](${siteUrl}/ambassadeurs/): recommandation rémunérée (30 % de l'encaissé net, 6 mois par abonné, versement dès 30 €)
- [Conditions du programme Ambassadeurs](${siteUrl}/conditions-ambassadeurs/)
- [Contact](${siteUrl}/contact/)
- [Centre d'aide](${siteUrl}/aide/)
- [Confidentialité](${siteUrl}/confidentialite/)

## Étapes de vie
${st.map((x) => `- ${x.title}`).join('\n')}

## Outils par catégorie
${[...byCat.entries()].map(([c, l]) => `### ${c}\n${l.map((t) => `- ${t.label} : ${t.sub}`).join('\n')}`).join('\n\n')}
`);
}

// 4) pages légales statiques (déjà publiées dans legal-site/)
const legal = readdirSync(path.join(root, 'legal-site')).filter((d) => statSync(path.join(root, 'legal-site', d)).isDirectory());
for (const d of legal) cpSync(path.join(root, 'legal-site', d), path.join(dist, d), { recursive: true });

// 5) robots.txt et sitemap : seulement les pages publiques
const pub = ['/', '/fonctionnalites', '/ambassadeurs', '/contact', ...legal.map((d) => `/${d}`)];
writeFileSync(path.join(dist, 'robots.txt'), production
  ? `User-agent: *\nAllow: /\nDisallow: /app\nDisallow: /auth/\nDisallow: /admin\nDisallow: /ambassadors/dashboard\nDisallow: /r/\nDisallow: /demo\nSitemap: ${siteUrl}/sitemap.xml\n`
  : 'User-agent: *\nDisallow: /\n');
writeFileSync(path.join(dist, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pub.map((p) => `  <url><loc>${siteUrl}${p}</loc></url>`).join('\n')}\n</urlset>\n`);

console.log(`site HOMI prêt dans ${dist} — ${siteUrl} — ${production ? 'production (indexable)' : 'aperçu (noindex)'} — pages légales : ${legal.join(', ')}`);
