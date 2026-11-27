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
// www est l'hôte réellement servi (l'apex redirige vers www) : la canonique doit être l'URL finale, sans redirection
const OFFICIAL = 'https://www.homifamille.com';
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
// polices : WOFF2 sous-ensemble latin pré-générés (pyftsubset, 84 Ko → 27 Ko), versionnés dans web/site/fonts
cpSync(path.join(site, 'fonts'), path.join(dist, 'site/fonts'), { recursive: true });
cpSync(path.join(site, 'og.png'), path.join(dist, 'og.png'));
// icônes du site : nouvelle identité « noir sur blanc » (assets/brand/homi-logo-noir-sur-blanc-1024.png), générées par
// scripts/web/site-icons.py (favicon.ico 16/32/48, icon-32.png, apple-touch-icon.png 180, icon-512.png)
// icônes pré-générées et versionnées (web/site/icons/) : le build Vercel n'a pas Pillow ; à régénérer à la main si le logo change
for (const f of readdirSync(path.join(site, 'icons'))) cpSync(path.join(site, 'icons', f), path.join(dist, f));
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
    { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Accueil', item: `${siteUrl}/` }, { '@type': 'ListItem', position: 2, name: 'Fonctionnalités', item: `${siteUrl}/fonctionnalites` }] },
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
    { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Accueil', item: `${siteUrl}/` }, { '@type': 'ListItem', position: 2, name: 'Contact', item: `${siteUrl}/contact` }] },
    { '@type': 'ContactPage', name: 'Contacter HOMI', url: `${siteUrl}/contact` },
  ] });
  const contact = withChrome(readFileSync(path.join(site, 'contact.html'), 'utf8'))
    .replaceAll('{{SITE_URL}}', siteUrl).replaceAll('{{ROBOTS}}', robotsPublic).replaceAll('{{VERSION}}', version)
    .replace('{{CONTACT_ENDPOINT}}', contactEndpoint).replace('{{JSONLD}}', jsonldContact);
  mkdirSync(path.join(dist, 'contact'), { recursive: true });
  writeFileSync(path.join(dist, 'contact', 'index.html'), contact);
  for (const f of ['contact.css', 'contact.js']) cpSync(path.join(site, f), path.join(dist, 'site', f));
  // /aura : page de l'assistante (contenu factuel, FAQ balisée)
  const faq = [...readFileSync(path.join(site, 'aura.html'), 'utf8').matchAll(/<summary>([^<]+)<\/summary><p>([^<]+)<\/p>/g)]
    .map(([, q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } }));
  const jsonldAura = JSON.stringify({ '@context': 'https://schema.org', '@graph': [
    { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Accueil', item: `${siteUrl}/` }, { '@type': 'ListItem', position: 2, name: 'Aura', item: `${siteUrl}/aura` }] },
    { '@type': 'FAQPage', mainEntity: faq },
  ] }).replace(/</g, '\\u003c');
  const aura = withChrome(readFileSync(path.join(site, 'aura.html'), 'utf8'))
    .replaceAll('{{SITE_URL}}', siteUrl).replaceAll('{{ROBOTS}}', robotsPublic).replaceAll('{{VERSION}}', version).replace('{{JSONLD}}', jsonldAura);
  mkdirSync(path.join(dist, 'aura'), { recursive: true });
  writeFileSync(path.join(dist, 'aura', 'index.html'), aura);
  cpSync(path.join(site, 'aura.css'), path.join(dist, 'site', 'aura.css'));
  const { stages: st, tools: all } = globalThis.homiTools.all();
  const { HUBS: hubsForLlms } = await import(path.join(site, 'hubs.mjs'));
  const { UNIVERS: univForLlms } = await import(path.join(site, 'univers.mjs'));
  const auraFaq = [...readFileSync(path.join(site, 'aura.html'), 'utf8').matchAll(/<summary>([^<]+)<\/summary><p>([^<]+)<\/p>/g)].map(([, q, a]) => [q, a]);
  const byCat = new Map(); for (const t of all) { if (!byCat.has(t.categoryTitle)) byCat.set(t.categoryTitle, []); byCat.get(t.categoryTitle).push(t); }
  writeFileSync(path.join(dist, 'llms.txt'), `# HOMI

> HOMI est une application web pour toute la famille, de la contraception aux 10 ans de l'enfant : cycle et projet bébé,
> grossesse, après la naissance, suivi du bébé (sommeil, biberons, allaitement, couches, croissance, vaccins, dents),
> enfance, et organisation familiale partagée entre parents (relais, tâches, agenda, charge mentale).
> Application française. Contact : homixyz@gmail.com. Instagram : @homi_famille.
> HOMI n'est pas un dispositif médical et ne remplace pas un professionnel de santé ; Aura, l'assistante intégrée, ne pose
> pas de diagnostic et ne calcule aucune dose de médicament. Disponible dans le navigateur ; pas encore sur l'App Store.

## Pages
- [Présentation](${siteUrl}/): ce qu'est HOMI et à qui il s'adresse
${hubsForLlms.map((h) => `- [${h.name}](${siteUrl}/${h.slug}): ${h.desc}`).join('\n')}
${univForLlms.map((x) => `- [${x.kw}](${siteUrl}/${x.slug}): ${x.answer}`).join('\n')}
- [Blog](${siteUrl}/blog): articles pratiques non médicaux (démarches, garde, matériel, éveil, éducation), sources officielles citées
- [Aura, l'assistante](${siteUrl}/aura): retrouve le bon outil, prépare rendez-vous et tâches à confirmer ; pas une professionnelle de santé, aucune dose
- [Toutes les fonctionnalités](${siteUrl}/fonctionnalites): les ${all.length} outils réels, par étape de vie
- [Programme Ambassadeurs](${siteUrl}/ambassadeurs): recommandation rémunérée (30 % de l'encaissé net, 6 mois par abonné, versement dès 30 €)
- [Conditions du programme Ambassadeurs](${siteUrl}/conditions-ambassadeurs)
- [Contact](${siteUrl}/contact)
- [Centre d'aide](${siteUrl}/aide)
- [Confidentialité](${siteUrl}/confidentialite)

## Questions fréquentes
${[...hubsForLlms.flatMap((h) => h.faq), ...univForLlms.flatMap((x) => x.faq), ...auraFaq].map(([q, a]) => `- **${q}** ${a}`).join('\n')}

## Étapes de vie
${st.map((x) => `- ${x.title}`).join('\n')}

## Outils par catégorie
${[...byCat.entries()].map(([c, l]) => `### ${c}\n${l.map((t) => `- ${t.label} : ${t.sub}`).join('\n')}`).join('\n\n')}
`);
}

// 3 sexies) pages piliers (cibles des liens annexes Google) : contenu statique, FAQ et fil d'Ariane balisés
const hubPaths = [];
{
  const { HUBS } = await import(path.join(site, 'hubs.mjs'));
  const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const tpl = withChrome(readFileSync(path.join(site, 'hub.html'), 'utf8')).replaceAll('{{ROBOTS}}', robotsPublic).replaceAll('{{VERSION}}', version).replaceAll('{{SITE_URL}}', siteUrl);
  for (const h of HUBS) {
    const url = `${siteUrl}/${h.slug}`;
    const others = HUBS.filter((o) => o.slug !== h.slug);
    const jsonld = { '@context': 'https://schema.org', '@graph': [
      { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Accueil', item: `${siteUrl}/` }, { '@type': 'ListItem', position: 2, name: h.name, item: url }] },
      { '@type': 'WebPage', name: h.name, url, description: h.desc, isPartOf: { '@type': 'WebSite', name: 'HOMI', url: `${siteUrl}/` } },
      { '@type': 'FAQPage', mainEntity: h.faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
    ] };
    const content = `<section class="chapter" aria-labelledby="t-hub"><div class="wrap aura-hero"><div>`
      + `<nav class="crumbs" aria-label="Fil d’Ariane"><a href="/">Accueil</a> <span aria-hidden="true">›</span> <span>${esc(h.name)}</span></nav>`
      + `<p class="eyebrow">${esc(h.eyebrow)}</p><h1 id="t-hub" class="display lines"><span class="line"><span>${esc(h.h1[0])}</span></span> <span class="line line-soft"><span>${esc(h.h1[1])}</span></span></h1>`
      + `<p class="lead">${esc(h.lead)}</p><div class="cta-row">${h.cta.map(([l, u], i) => `<a class="btn ${i ? 'btn-secondary' : 'btn-primary'} btn-lg" href="${u}">${esc(l)}</a>`).join('')}</div></div>`
      + `<img class="aura-shot" src="/site/screens/${h.shot}.webp" alt="Écran réel de l’application HOMI : ${esc(h.name)}" width="390" height="810" loading="eager" decoding="async"></div></section>`
      + (h.extra || '')
      + `<section class="chapter tight"><div class="wrap"><div class="aura-grid">${h.sections.map(([t, l]) => `<article class="card aura-item"><h2 class="h3">${esc(t)}</h2><ul class="aura-list">${l.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></article>`).join('')}</div></div></section>`
      + `<section class="chapter tight" aria-labelledby="t-faq"><div class="wrap narrow"><h2 id="t-faq" class="h2">Questions fréquentes</h2>${h.faq.map(([q, a]) => `<details class="card aura-faq"><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div></section>`
      + `<nav class="chapter tight" aria-label="Explorer HOMI"><div class="wrap"><h2 class="h2">Explorer HOMI</h2><div class="aura-grid">${[...others.map((o) => [o.name, `/${o.slug}`]), ['Aura', '/aura'], ['Blog', '/blog'], ['Programme ambassadeur', '/ambassadeurs']].map(([n, u]) => `<a class="card aura-item hub-link" href="${u}"><strong>${esc(n)}</strong></a>`).join('')}</div></div></nav>`;
    const html = tpl.replace('{{TITLE}}', () => esc(h.title)).replaceAll('{{DESC}}', () => esc(h.desc)).replaceAll('{{NAME}}', () => esc(h.name)).replaceAll('{{CANONICAL}}', url)
      .replace('{{JSONLD}}', () => JSON.stringify(jsonld).replace(/</g, '\\u003c')).replace('{{CONTENT}}', () => content);
    mkdirSync(path.join(dist, h.slug), { recursive: true });
    writeFileSync(path.join(dist, h.slug, 'index.html'), html);
    hubPaths.push(`/${h.slug}`);
  }
  // pages « univers » : problème réel → réponse HOMI → outils réels du catalogue (aucun outil inventé)
  const { UNIVERS } = await import(path.join(site, 'univers.mjs'));
  const byId = new Map(globalThis.homiTools.all().tools.map((t) => [t.id, t]));
  for (const u of UNIVERS) {
    const tools = u.tools.map((id) => { const t = byId.get(id); if (!t) throw new Error(`univers ${u.slug} : outil inconnu ${id}`); return t; });
    const url = `${siteUrl}/${u.slug}`;
    const jsonld = { '@context': 'https://schema.org', '@graph': [
      { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Accueil', item: `${siteUrl}/` }, { '@type': 'ListItem', position: 2, name: 'Fonctionnalités', item: `${siteUrl}/fonctionnalites` }, { '@type': 'ListItem', position: 3, name: u.name, item: url }] },
      { '@type': 'WebPage', name: u.kw, url, description: u.answer, isPartOf: { '@type': 'WebSite', name: 'HOMI', url: `${siteUrl}/` } },
      { '@type': 'ItemList', name: `Outils HOMI : ${u.name}`, itemListElement: tools.map((t, i) => ({ '@type': 'ListItem', position: i + 1, name: t.label, description: t.sub })) },
      { '@type': 'FAQPage', mainEntity: u.faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
    ] };
    const others = UNIVERS.filter((o) => o.slug !== u.slug);
    const content = `<section class="chapter" aria-labelledby="t-u"><div class="wrap aura-hero"><div>`
      + `<nav class="crumbs" aria-label="Fil d’Ariane"><a href="/">Accueil</a> <span aria-hidden="true">›</span> <a href="/fonctionnalites">Fonctionnalités</a> <span aria-hidden="true">›</span> <span>${esc(u.name)}</span></nav>`
      + `<h1 id="t-u" class="display">${esc(u.kw)}</h1><p class="lead u-problem">${esc(u.problem)}</p><p class="u-answer">${esc(u.answer)}</p>`
      + `<div class="cta-row"><a class="btn btn-primary btn-lg" href="/telecharger">Télécharger HOMI</a><a class="btn btn-secondary btn-lg" href="/tarifs">Voir les tarifs</a></div></div>`
      + `<img class="aura-shot" src="/site/screens/${u.shot}.webp" alt="Écran réel de l’application HOMI (famille fictive)" width="390" height="810" loading="eager" decoding="async"></div></section>`
      + `<section class="chapter tight" aria-labelledby="t-tools"><div class="wrap narrow"><h2 id="t-tools" class="h2">Les outils HOMI pour ${esc(u.name.toLowerCase())}</h2><ul class="u-tools">${tools.map((t) => `<li><strong>${esc(t.label)}</strong><span>${esc(t.sub)}</span></li>`).join('')}</ul>`
      + `<p class="fine">Les outils sont décrits tels qu’ils apparaissent dans l’application. HOMI ne remplace pas un professionnel de santé.</p></div></section>`
      + `<section class="chapter tight" aria-labelledby="t-faq"><div class="wrap narrow"><h2 id="t-faq" class="h2">Questions fréquentes</h2>${u.faq.map(([q, a]) => `<details class="card aura-faq" open><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div></section>`
      + `<nav class="chapter tight" aria-label="Autres univers"><div class="wrap"><h2 class="h2">Autres univers</h2><ul class="u-others">${others.map((o) => `<li><a href="/${o.slug}">${esc(o.name)}</a></li>`).join('')}</ul></div></nav>`;
    const html = tpl.replace('{{TITLE}}', () => esc(`${u.kw} | HOMI`)).replaceAll('{{DESC}}', () => esc(`${u.problem} ${u.answer}`.slice(0, 300))).replaceAll('{{NAME}}', () => esc(u.name)).replaceAll('{{CANONICAL}}', url)
      .replace('{{JSONLD}}', () => JSON.stringify(jsonld).replace(/</g, '\\u003c')).replace('{{CONTENT}}', () => content);
    mkdirSync(path.join(dist, u.slug), { recursive: true });
    writeFileSync(path.join(dist, u.slug, 'index.html'), html);
    hubPaths.push(`/${u.slug}`);
  }
  // outils gratuits (/outils/…) : fonctionnent sans HOMI, calcul local, contenus repris de l'app quand ils existent
  {
    const { OUTILS, DOMAIN_LABELS } = await import(path.join(site, 'outils.mjs'));
    const src = readFileSync(path.join(root, 'src/content/checklists.ts'), 'utf8');
    const a0 = src.indexOf('const CHECKLIST_TEMPLATES_FR: Templates = ') + 'const CHECKLIST_TEMPLATES_FR: Templates = '.length;
    const CL = Function(`return ${src.slice(a0, src.indexOf('\n};', a0) + 2)}`)();
    const vous = (t) => t.replace(/si tu l’as/g, 'si vous l’avez').replace(/\btu\b/g, 'vous').replace(/\bton\b/g, 'votre').replace(/\bta\b/g, 'votre').replace(/\btes\b/g, 'vos');
    cpSync(path.join(site, 'outils.css'), path.join(dist, 'site/outils.css')); cpSync(path.join(site, 'outils.js'), path.join(dist, 'site/outils.js'));
    const withAssets = (h) => h.replace('</head>', `<link rel="stylesheet" href="/site/outils.css?v=${version}">\n</head>`).replace('</body>', `<script src="/site/outils.js?v=${version}" defer></script>\n</body>`);
    for (const o of OUTILS) {
      const url = `${siteUrl}/outils/${o.slug}`;
      let widget = '';
      if (o.kind === 'checklist') {
        widget = `<div class="card tool-box" data-checklist><div class="tool-bar"><strong data-cl-progress aria-live="polite"></strong><button type="button" class="btn btn-secondary btn-sm" data-print>Imprimer</button><button type="button" class="btn btn-secondary btn-sm" data-cl-reset>Tout décocher</button></div>`
          + o.lists.map((k) => { const l = CL[k]; if (!l) throw new Error(`outil ${o.slug} : liste inconnue ${k}`); return `<section class="cl-group"><h2>${esc(l.title)}</h2>${l.items.map((it, i) => `<label><input type="checkbox" id="cl-${k}-${i}"><span>${esc(vous(it))}</span></label>`).join('')}</section>`; }).join('') + `</div>`;
      } else if (o.kind === 'mentalload') {
        const opt = '<option value="">—</option><option value="me">Moi</option><option value="other">L’autre parent</option><option value="both">Les deux</option><option value="none">Personne / pas concerné</option>';
        widget = `<form class="card tool-box" data-mentalload onsubmit="return false"><div class="ml-row ml-head"><span>Domaine</span><span>Qui y pense ?</span><span>Qui le fait ?</span></div>`
          + Object.entries(DOMAIN_LABELS).map(([k, l]) => `<div class="ml-row" data-dom="${k}"><span>${esc(l)}</span><label class="ml-sel"><span>Qui y pense ?</span><select data-k="think" aria-label="${esc(l)} : qui y pense ?">${opt}</select></label><label class="ml-sel"><span>Qui le fait ?</span><select data-k="do" aria-label="${esc(l)} : qui le fait ?">${opt}</select></label></div>`).join('')
          + `</form><div class="card ml-result" data-ml-result hidden aria-live="polite"><h2>Votre part</h2><div class="ml-meter"><span>Penser, anticiper : <b data-ml-think></b></span><div class="ml-track"><i data-ml-bar-think></i></div></div><div class="ml-meter"><span>Faire : <b data-ml-do></b></span><div class="ml-track"><i data-ml-bar-do></i></div></div><p data-ml-msg></p></div>`;
      }
      const jsonld = { '@context': 'https://schema.org', '@graph': [
        { '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Accueil', item: `${siteUrl}/` }, { '@type': 'ListItem', position: 2, name: 'Outils gratuits', item: `${siteUrl}/outils` }, { '@type': 'ListItem', position: 3, name: o.name, item: url }] },
        { '@type': 'WebApplication', name: o.name, url, description: o.desc, applicationCategory: 'LifestyleApplication', operatingSystem: 'Web', isAccessibleForFree: true, offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' } },
        { '@type': 'FAQPage', mainEntity: o.faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
      ] };
      const content = `<section class="chapter tight"><div class="wrap narrow"><nav class="crumbs" aria-label="Fil d’Ariane"><a href="/">Accueil</a> <span aria-hidden="true">›</span> <a href="/outils">Outils gratuits</a> <span aria-hidden="true">›</span> <span>${esc(o.name)}</span></nav>`
        + `<p class="eyebrow">Outil gratuit · sans inscription</p><h1 class="display">${esc(o.h1)}</h1><p class="lead">${esc(o.lead)}</p>${widget}`
        + `<aside class="card post-tool tool-more"><p class="eyebrow">Aller plus loin avec HOMI</p><p>${esc(o.homi[1])}</p><a class="btn btn-primary btn-sm" href="/${o.homi[0]}">Découvrir</a></aside>`
        + `<h2 class="h2" style="margin-top:40px">Questions fréquentes</h2>${o.faq.map(([q, a]) => `<details class="card aura-faq" open><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div></section>`;
      const html = withAssets(tpl.replace('{{TITLE}}', () => esc(o.title)).replaceAll('{{DESC}}', () => esc(o.desc)).replaceAll('{{NAME}}', () => esc(o.name)).replaceAll('{{CANONICAL}}', url)
        .replace('{{JSONLD}}', () => JSON.stringify(jsonld).replace(/</g, '\\u003c')).replace('{{CONTENT}}', () => content));
      mkdirSync(path.join(dist, 'outils', o.slug), { recursive: true });
      writeFileSync(path.join(dist, 'outils', o.slug, 'index.html'), html);
      hubPaths.push(`/outils/${o.slug}`);
    }
    const idx = `<section class="chapter tight"><div class="wrap narrow"><nav class="crumbs" aria-label="Fil d’Ariane"><a href="/">Accueil</a> <span aria-hidden="true">›</span> <span>Outils gratuits</span></nav><h1 class="display">Outils gratuits pour les parents</h1><p class="lead">Utiles tout de suite, sans inscription. Rien de ce que vous saisissez n’est envoyé.</p><ul class="u-tools">${OUTILS.map((o) => `<li><strong><a href="/outils/${o.slug}">${esc(o.name)}</a></strong><span>${esc(o.desc)}</span></li>`).join('')}</ul></div></section>`;
    mkdirSync(path.join(dist, 'outils'), { recursive: true });
    writeFileSync(path.join(dist, 'outils', 'index.html'), withAssets(tpl.replace('{{TITLE}}', 'Outils gratuits pour les parents | HOMI').replaceAll('{{DESC}}', 'Checklist naissance, test de répartition de la charge mentale : des outils gratuits, sans inscription, calcul local.').replaceAll('{{NAME}}', 'Outils gratuits').replaceAll('{{CANONICAL}}', `${siteUrl}/outils`)
      .replace('{{JSONLD}}', () => JSON.stringify({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Accueil', item: `${siteUrl}/` }, { '@type': 'ListItem', position: 2, name: 'Outils gratuits', item: `${siteUrl}/outils` }] })).replace('{{CONTENT}}', () => idx)));
    hubPaths.push('/outils');
  }
  console.log(`pages piliers : ${hubPaths.join(', ')}`);
}

// 3 quinquies) /blog : articles NON médicaux de la bibliothèque (rédaction assistée par IA, sources citées)
const blogPaths = [];
{
  const { build: esb } = await import('esbuild');
  const out = path.join(site, '.build/blog.cjs');
  await esb({ entryPoints: [path.join(site, 'blog-entry.ts')], bundle: true, platform: 'node', format: 'cjs', alias: { '@': path.join(root, 'src') }, outfile: out, logLevel: 'warning' });
  createRequire(import.meta.url)(out);
  const { categories, articles } = globalThis.homiBlog;
  const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const slugify = (t) => String(t).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const TOOL_FOR = { 'droits-demarches': ['application-organisation-familiale', 'Papiers, rendez-vous et échéances de la famille'], 'ecole-garde': ['application-garde-nounou-creche', 'Carnet de liaison nounou, fiche à transmettre, école'], 'materiel': ['scanner-produits-bebe', 'Scanner de produits et alertes de rappel'], 'vie-pratique': ['application-organisation-familiale', 'Agenda, tâches et courses partagés'], 'activites-eveil': ['application-suivi-bebe', 'Étapes du développement et journée de bébé'], 'education': ['application-organisation-familiale', 'Routines du foyer et missions familiales'] };
  const inline = (t) => esc(t).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  const md = (src) => {
    const html = []; let list = null; let para = [];
    const flush = () => { if (para.length) { html.push(`<p>${inline(para.join(' '))}</p>`); para = []; } if (list) { html.push(`</${list}>`); list = null; } };
    for (const raw of src.split('\n')) {
      const line = raw.trim(); let mm;
      if (!line) { flush(); continue; }
      if ((mm = line.match(/^(#{2,3}) (.*)/))) { flush(); const id = mm[1].length === 2 ? ` id="${slugify(mm[2])}"` : ''; html.push(`<h${mm[1].length}${id}>${inline(mm[2])}</h${mm[1].length}>`); continue; }
      if ((mm = line.match(/^(-|\d+\.) (.*)/))) { const t = mm[1] === '-' ? 'ul' : 'ol'; if (para.length) { html.push(`<p>${inline(para.join(' '))}</p>`); para = []; } if (list !== t) { if (list) html.push(`</${list}>`); html.push(`<${t}>`); list = t; } html.push(`<li>${inline(mm[2])}</li>`); continue; }
      if (list) { html.push(`</${list}>`); list = null; }
      para.push(line.replace(/^> /, ''));
    }
    flush(); return html.join('\n');
  };
  const tpl = withChrome(readFileSync(path.join(site, 'blog.html'), 'utf8')).replaceAll('{{ROBOTS}}', robotsPublic).replaceAll('{{VERSION}}', version).replaceAll('{{SITE_URL}}', siteUrl);
  const page = (o) => tpl.replace('{{TITLE}}', () => esc(o.title)).replaceAll('{{DESC}}', () => esc(o.desc)).replaceAll('{{CANONICAL}}', `${siteUrl}${o.path}`)
    .replace('{{JSONLD}}', () => JSON.stringify(o.jsonld).replace(/</g, '\\u003c')).replace('{{CONTENT}}', () => o.content);
  const crumbs = (items) => ({ '@type': 'BreadcrumbList', itemListElement: items.map(([name, p], i) => ({ '@type': 'ListItem', position: i + 1, name, item: `${siteUrl}${p}` })) });
  const nav = (items) => `<nav class="crumbs" aria-label="Fil d’Ariane">${items.map(([n, p], i) => i < items.length - 1 ? `<a href="${p}">${esc(n)}</a>` : `<span>${esc(n)}</span>`).join(' <span aria-hidden="true">›</span> ')}</nav>`;
  mkdirSync(path.join(dist, 'blog'), { recursive: true }); cpSync(path.join(site, 'blog.css'), path.join(dist, 'site/blog.css'));
  const byCat = Object.keys(categories).map((c) => [c, articles.filter((a) => a.category === c).sort((x, y) => x.title.localeCompare(y.title, 'fr'))]);
  const card = (a) => `<li><a class="card" href="/blog/${a.slug}"><strong>${esc(a.title)}</strong><span>${esc(a.summary)}</span></a></li>`;
  writeFileSync(path.join(dist, 'blog', 'index.html'), page({ path: '/blog', title: 'Blog HOMI — démarches, garde, matériel, éveil et vie de famille',
    desc: `${articles.length} articles pratiques pour les parents : congés et démarches, modes de garde, matériel, activités d’éveil, éducation, organisation du foyer. Sources officielles citées.`,
    jsonld: { '@context': 'https://schema.org', '@graph': [crumbs([['Accueil', '/'], ['Blog', '/blog']]), { '@type': 'CollectionPage', name: 'Blog HOMI', url: `${siteUrl}/blog` }] },
    content: `<section class="wrap blog-head">${nav([['Accueil', '/'], ['Blog', '/blog']])}<p class="eyebrow">Blog</p><h1 class="display">Les réponses pratiques<br>de la vie de famille.</h1><p class="lead">Démarches, garde, matériel, éveil : ${articles.length} articles avec leurs sources officielles.</p>`
      + `<label class="blog-search"><span class="sr-only">Rechercher un article</span><input type="search" placeholder="Rechercher un article (ex. congé, crèche, poussette)" data-blog-search autocomplete="off"></label><p class="fine" data-blog-count hidden></p>`
      + `<nav class="blog-toc" aria-label="Rubriques">${byCat.map(([c]) => `<a class="btn btn-secondary btn-sm" href="#${c}">${esc(categories[c])}</a>`).join(' ')}</nav></section>`
      + `<div class="wrap">${byCat.map(([c, l]) => `<section class="blog-cat" id="${c}"><h2>${esc(categories[c])}</h2><ul class="blog-list">${l.map(card).join('')}</ul></section>`).join('')}</div>` }));
  blogPaths.push('/blog');
  for (const [c, l] of byCat) l.forEach((a, i) => {
    const consulted = a.sources.map((s) => s.consulted_on).sort().pop();
    const more = [l[(i + 1) % l.length], l[(i + 2) % l.length], l[(i + 3) % l.length]].filter((x) => x.slug !== a.slug);
    mkdirSync(path.join(dist, 'blog', a.slug), { recursive: true });
    writeFileSync(path.join(dist, 'blog', a.slug, 'index.html'), page({ path: `/blog/${a.slug}`, title: `${a.title} | HOMI`, desc: a.summary,
      jsonld: { '@context': 'https://schema.org', '@graph': [crumbs([['Accueil', '/'], ['Blog', '/blog'], [categories[c], `/blog#${c}`], [a.title, `/blog/${a.slug}`]]),
        { '@type': 'Article', headline: a.title, description: a.summary, inLanguage: 'fr', dateModified: consulted, url: `${siteUrl}/blog/${a.slug}`,
          author: { '@type': 'Organization', name: 'HOMI' }, publisher: { '@type': 'Organization', name: 'HOMI', url: `${siteUrl}/` }, citation: a.sources.map((s) => s.url) }] },
      content: `<article class="wrap narrow post">${nav([['Accueil', '/'], ['Blog', '/blog'], [categories[c], `/blog#${c}`]])}<h1>${esc(a.title)}</h1><p class="summary">${esc(a.summary)}</p>`
        + (() => { const hs = [...a.body_md.matchAll(/^## (.+)$/gm)].map((m) => m[1]); return hs.length > 2 ? `<nav class="post-toc" aria-label="Sommaire"><p>Sommaire</p><ol>${hs.map((h) => `<li><a href="#${slugify(h)}">${esc(h.replace(/\*\*/g, ''))}</a></li>`).join('')}</ol></nav>` : ''; })()
        + `<div class="post-body">${md(a.body_md)}</div>`
        + (TOOL_FOR[c] ? `<aside class="card post-tool"><p class="eyebrow">Dans HOMI</p><p><strong>${esc(TOOL_FOR[c][1])}</strong></p><a class="btn btn-primary btn-sm" href="/${TOOL_FOR[c][0]}">Découvrir l’outil</a></aside>` : '')
        + `<aside class="card post-src"><h2>Sources</h2><ul>${a.sources.map((s) => `<li><a href="${esc(s.url)}" rel="noopener" target="_blank">${esc(s.label)}</a> — consultée le ${esc(s.consulted_on.split('-').reverse().join('/'))}</li>`).join('')}</ul>`
        + `<p class="post-note">Rédaction assistée par une IA (Claude, Anthropic) à partir des sources citées. Règles et montants évoluent : vérifiez toujours auprès de la source officielle.</p></aside>`
        + `<nav class="post-more" aria-label="À lire aussi"><h2>À lire aussi</h2><ul class="blog-list">${more.map(card).join('')}</ul></nav></article>` }));
    blogPaths.push(`/blog/${a.slug}`);
  });
  console.log(`blog : ${articles.length} articles non médicaux`);
}

// IndexNow (Bing, Copilot, ChatGPT Search via l'index Bing, Yandex…) : fichier de clé publique à la racine
{ const k = readFileSync(path.join(site, 'indexnow.txt'), 'utf8').trim(); writeFileSync(path.join(dist, `${k}.txt`), k); }

// kit presse : logos officiels + captures réelles, téléchargeables
mkdirSync(path.join(dist, 'site/presse'), { recursive: true });
for (const f of ['homi-logo-noir-sur-blanc-1024.png', 'homi-icone-blanc-sur-noir-1024.png']) cpSync(path.join(root, 'assets/brand', f), path.join(dist, 'site/presse', f));

// 4) pages légales statiques (déjà publiées dans legal-site/)
const legal = readdirSync(path.join(root, 'legal-site')).filter((d) => statSync(path.join(root, 'legal-site', d)).isDirectory());
for (const d of legal) cpSync(path.join(root, 'legal-site', d), path.join(dist, d), { recursive: true });

// 5) robots.txt et sitemap : seulement les pages publiques
const pub = ['/', ...hubPaths, '/aura', '/fonctionnalites', '/ambassadeurs', '/contact', ...legal.map((d) => `/${d}`), ...blogPaths];
writeFileSync(path.join(dist, 'robots.txt'), production
  ? `User-agent: *\nAllow: /\nDisallow: /app\nDisallow: /auth/\nDisallow: /admin\nDisallow: /ambassadors/dashboard\nDisallow: /r/\nDisallow: /demo\nSitemap: ${siteUrl}/sitemap.xml\n`
  : 'User-agent: *\nDisallow: /\n');
writeFileSync(path.join(dist, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pub.map((p) => `  <url><loc>${siteUrl}${p}</loc></url>`).join('\n')}\n</urlset>\n`);

console.log(`site HOMI prêt dans ${dist} — ${siteUrl} — ${production ? 'production (indexable)' : 'aperçu (noindex)'} — pages légales : ${legal.join(', ')}`);
