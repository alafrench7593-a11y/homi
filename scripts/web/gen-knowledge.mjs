#!/usr/bin/env node
/** Régénère docs/growth/HOMI-KNOWLEDGE.md depuis le code (catalogue d'outils, intentions Aura, pages du site). Usage : node scripts/web/gen-knowledge.mjs */
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const root = new URL('../../', import.meta.url).pathname;
globalThis.window = globalThis; createRequire(import.meta.url)(root + 'web/site/.build/search.js');
const { tools } = globalThis.homiTools.all();
const byCat = new Map(); for (const t of tools) { if (!byCat.has(t.categoryTitle)) byCat.set(t.categoryTitle, []); byCat.get(t.categoryTitle).push(t); }
const intents = (readFileSync(root + 'src/lib/aura/intents.ts', 'utf8').match(/AURA_INTENT_KINDS = \[([^\]]+)\]/) || [, ''])[1].replace(/'/g, '').split(',').map((s) => s.trim()).filter(Boolean);
const { UNIVERS } = await import(root + 'web/site/univers.mjs'); const { HUBS } = await import(root + 'web/site/hubs.mjs'); const { OUTILS } = await import(root + 'web/site/outils.mjs');
const md = `# HOMI — connaissance produit (générée le ${new Date().toISOString().slice(0, 10)}, ne pas éditer à la main)

Source : code de l'app (catalogue \`homiTools\`, \`src/lib/aura/intents.ts\`) et du site (\`web/site/*.mjs\`). Régénérer : \`node scripts/web/gen-knowledge.mjs\`.
Règle : ne présenter sur le site QUE ce qui figure ici. Le contenu santé de la bibliothèque est « à vérifier » : jamais publié sans relecture professionnelle.

## Outils de l'app (${tools.length})
${[...byCat.entries()].map(([c, l]) => `### ${c} (${l.length})\n${l.map((t) => `- \`${t.id}\` ${t.label} — ${t.sub}`).join('\n')}`).join('\n\n')}

## Aura : actions reconnues sans IA (${intents.length})
${intents.map((i) => `\`${i}\``).join(', ')}
Limites : pas professionnelle de santé, aucun diagnostic, aucune dose ; rien n'est enregistré sans validation.

## Pages du site
- Piliers : ${HUBS.map((h) => `/${h.slug}`).join(', ')}
- Univers (SEO) : ${UNIVERS.map((u) => `/${u.slug}`).join(', ')}
- Outils gratuits : ${OUTILS.map((o) => `/outils/${o.slug}`).join(', ')}
- Aussi : /, /aura, /fonctionnalites, /blog (215 articles non médicaux), /ambassadeurs, /contact, pages légales
`;
writeFileSync(root + 'docs/growth/HOMI-KNOWLEDGE.md', md);
console.log(`HOMI-KNOWLEDGE.md : ${tools.length} outils, ${intents.length} actions Aura`);
