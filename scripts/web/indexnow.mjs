#!/usr/bin/env node
/** Signale les URL du sitemap en production à IndexNow (Bing et moteurs partenaires). Usage : node scripts/web/indexnow.mjs
 * À lancer après un déploiement qui ajoute ou modifie des pages publiques. Aucune donnée personnelle envoyée. */
import { readFileSync } from 'node:fs';
const host = 'www.homifamille.com';
const key = readFileSync(new URL('../../web/site/indexnow.txt', import.meta.url), 'utf8').trim();
const sm = await (await fetch(`https://${host}/sitemap.xml`)).text();
const urlList = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
const r = await fetch('https://api.indexnow.org/indexnow', { method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host, key, keyLocation: `https://${host}/${key}.txt`, urlList }) });
console.log(`IndexNow : ${urlList.length} URL → HTTP ${r.status}`);
