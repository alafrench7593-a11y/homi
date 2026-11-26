// Génère docs/instagram/HOMI_INSTAGRAM_15.md depuis src/insta/data.ts (source unique) : visuel, accroche, légende, SEO, hashtags, CTA, story, reel.
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
const root = path.resolve(import.meta.dirname, '..');
const src = ts.transpileModule(readFileSync(path.join(root, 'src/insta/data.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 } }).outputText;
const { POSTS, GRID } = await import('data:text/javascript;base64,' + Buffer.from(src).toString('base64'));
const nn = (n) => String(n).padStart(2, '0');
const col = { emotion: 'Émotion', produit: 'Produit', education: 'Éducation' };
let md = `# HOMI — Instagram : les 15 premières publications\n\nGénéré depuis \`homi-film/src/insta/data.ts\` (source unique ; modifier là puis relancer \`node scripts/insta-guide.mjs\`).\nVisuels : \`homi-film/renders/instagram/\` (rendus avec \`node scripts/insta-render.mjs\`).\n\n`;
md += `## Ordre de publication et grille\n\nPublier de 01 à 15. Sur le profil (la plus récente en haut à gauche), les colonnes deviennent : 1 = émotion, 2 = produit, 3 = éducation.\n\n| Ligne | Colonne 1 · Émotion | Colonne 2 · Produit | Colonne 3 · Éducation |\n|---|---|---|---|\n`;
for (let r = 0; r < 5; r++) md += `| ${r + 1} | ${GRID.slice(r * 3, r * 3 + 3).map((n) => { const p = POSTS.find((x) => x.n === n); return `${nn(n)} · ${p.sujet}`; }).join(' | ')} |\n`;
md += `\n## Problématiques des parents → fonctionnalités réelles\n\n| # | Ce que vivent les parents | Ce que fait HOMI |\n|---|---|---|\n`;
for (const p of POSTS) md += `| ${nn(p.n)} | ${p.probleme} | ${p.fonction} |\n`;
for (const p of POSTS) {
  md += `\n---\n\n## ${nn(p.n)} · ${p.sujet} (${col[p.kind]})\n\n`;
  md += `**Visuel** : \`HOMI-Post-${nn(p.n)}.png\`${p.slides ? ` + carrousel \`HOMI-Carrousel-${nn(p.n)}-1…${p.slides.length + 2}.png\`` : ''}\n\n`;
  md += `**Accroche** : ${p.accroche}\n\n**Légende**\n\n${p.legende}\n\n${p.cta}\n\n${p.hashtags.join(' ')}\n\n`;
  md += `**Mots-clés SEO** (à placer dans le texte alternatif et la première ligne) : ${p.seo.join(', ')}\n\n**Appel à l’action** : ${p.cta}\n\n`;
  md += `**Story** : \`HOMI-Story-${nn(p.n)}.png\` — « ${p.story.haut} ${p.story.bas} » + autocollant lien vers le profil.\n\n`;
  if (p.reel) md += `**Reel (15 s)** : \`HOMI-Reel-${nn(p.n)}.mp4\` · couverture \`HOMI-CouvertureReel-${nn(p.n)}.png\`\n\nVoix off : « ${p.reel.voix} »\n\n`;
}
md += `\n---\n\n## Stories à la une\n\nAura · Grossesse · Bébé · Couple · Famille · Communauté · Souvenirs · FAQ → \`HOMI-ALaUne-*.png\` (cercle central, Instagram recadre en rond).\n\n## Règles pour les 100 prochaines publications\n\n- Ajouter un objet dans \`POSTS\` (même forme) ; le gabarit est choisi par \`kind\` (emotion, produit, education).\n- Écrans : uniquement des captures réelles (\`public/screens\`, mode démo). Illustrations : \`public/art\`. Jamais de visage généré.\n- Témoignages : toujours fictifs et signalés comme tels ; jamais présentés comme des membres réels.\n- Santé : aucune promesse médicale ; rappeler qu’Aura et la communauté ne remplacent pas un professionnel ; numéros 3114 / 15 / 112 si détresse.\n- Hashtags : 6 à 8 par publication, liés au sujet, pas de hashtags génériques.\n`;
writeFileSync(path.join(root, '../docs/instagram/HOMI_INSTAGRAM_15.md'), md);
console.log('ok', md.length);
