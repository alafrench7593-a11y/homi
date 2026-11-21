/**
 * Import des 134 icônes d'outils « verre dépoli » fournies par la propriétaire (21/11/2026) — outil de production des
 * assets, hors application (aucune dépendance ajoutée : PIL de Python pour réduire les plaques).
 *
 *   node scripts/da/tool-glass-import.cjs <dossier-fourni>   (dossier contenant catalogue.json et Motion/)
 *   node scripts/da/tool-glass-import.cjs --symboles         régénère seulement src/brand/toolGlass/symbols.ts depuis
 *                                                            assets/brand/tool-glass/symboles/*.svg (symboles redessinés)
 *
 * Symboles redessinés (« symboles clairs », 21/11/2026) : la plupart des symboles fournis étaient des pictogrammes
 * génériques (grille, carte, étoile, « # »…) qui ne disaient pas la fonction de l'outil. Les nouveaux dessins gardent la
 * construction des fichiers fournis (grille 24, trait rond) ; les ORIGINAUX restent dans
 * assets/brand/tool-glass/symboles-originaux/ (pour revenir en arrière : les recopier dans symboles/ puis --symboles).
 *
 * Écrit :
 *  - assets/brand/tool-glass/catalogue.json        catalogue fourni (id, label, catégorie, mouvement, teinte)
 *  - assets/brand/tool-glass/symboles/<id>.svg     couche symbole fournie (source, viewBox 128, dégradé nacré)
 *  - assets/brand/tool-glass/glass/<cat>.png       plaque de verre de chaque catégorie, réduite à 256 px (app)
 *  - src/brand/toolGlass/symbols.ts                géométrie de chaque symbole (un tracé `d`, grille 24) — les couleurs
 *                                                  (nacre, ombre, reflet) viennent de la palette src/theme/toolLogo.ts
 * Le symbole fourni a toujours la même construction (ombre, trait nacré, filet de lumière autour d'une même
 * géométrie posée en translate(21 21) scale(3.58) dans 128) : seule la géométrie change d'un outil à l'autre.
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const OUT = path.join(ROOT, 'assets', 'brand', 'tool-glass');
const ONLY_SYMBOLS = process.argv[2] === '--symboles';
const SRC = ONLY_SYMBOLS ? OUT : path.resolve(process.argv[2] || '');
if (!fs.existsSync(path.join(SRC, 'catalogue.json'))) throw new Error(`catalogue.json introuvable dans ${SRC}`);

const CAT = {
  Cycle: 'cycle', Santé: 'health', Grossesse: 'pregnancy', 'Foyer et famille': 'family', 'Soins et croissance': 'care', Alimentation: 'feeding',
  Couple: 'couple', 'Compte et réglages': 'account', Sommeil: 'sleep', 'École et activités': 'school', Communauté: 'community',
};
const catalogue = JSON.parse(fs.readFileSync(path.join(SRC, 'catalogue.json'), 'utf8'));
for (const d of ['symboles', 'glass']) fs.mkdirSync(path.join(OUT, d), { recursive: true });
if (!ONLY_SYMBOLS) fs.copyFileSync(path.join(SRC, 'catalogue.json'), path.join(OUT, 'catalogue.json'));

// plaques : une par catégorie, 256 px
const glass = {};
for (const e of catalogue) {
  const cat = CAT[e.category];
  if (!cat) throw new Error(`catégorie inconnue : ${e.category}`);
  if (glass[cat] && glass[cat] !== e.verre) throw new Error(`deux plaques pour ${cat}`);
  glass[cat] = e.verre;
}
for (const [cat, rel] of ONLY_SYMBOLS ? [] : Object.entries(glass)) {
  execFileSync('python3', ['-c', 'import sys; from PIL import Image; Image.open(sys.argv[1]).convert("RGBA").resize((256, 256), Image.LANCZOS).save(sys.argv[2], optimize=True)', path.join(SRC, rel), path.join(OUT, 'glass', `${cat}.png`)]);
}

// symboles : géométrie du groupe nacré → un seul tracé
const n = (v) => +(+v).toFixed(3);
const attr = (tag, k) => { const m = tag.match(new RegExp(`\\s${k}="([^"]*)"`)); return m ? m[1] : null; };
function toPath(tag) {
  // un « m » minuscule en tête est absolu dans son propre élément ; une fois les tracés mis bout à bout il deviendrait
  // relatif au point courant : on le rattache à l'origine (« M0 0 » seul ne dessine rien)
  if (tag.startsWith('<path')) { const d = attr(tag, 'd').trim(); return d.startsWith('m') ? `M0 0${d}` : d; }
  if (tag.startsWith('<circle')) {
    const cx = n(attr(tag, 'cx')); const cy = n(attr(tag, 'cy')); const r = n(attr(tag, 'r'));
    return `M${n(cx - r)} ${cy}a${r} ${r} 0 1 0 ${n(2 * r)} 0a${r} ${r} 0 1 0 ${n(-2 * r)} 0Z`;
  }
  if (tag.startsWith('<rect')) {
    const x = n(attr(tag, 'x') ?? 0); const y = n(attr(tag, 'y') ?? 0); const w = n(attr(tag, 'width')); const h = n(attr(tag, 'height'));
    const r = Math.min(n(attr(tag, 'rx') ?? attr(tag, 'ry') ?? 0), w / 2, h / 2);
    if (!r) return `M${x} ${y}h${w}v${h}h${-w}Z`;
    return `M${n(x + r)} ${y}H${n(x + w - r)}A${r} ${r} 0 0 1 ${n(x + w)} ${n(y + r)}V${n(y + h - r)}A${r} ${r} 0 0 1 ${n(x + w - r)} ${n(y + h)}H${n(x + r)}A${r} ${r} 0 0 1 ${x} ${n(y + h - r)}V${n(y + r)}A${r} ${r} 0 0 1 ${n(x + r)} ${y}Z`;
  }
  throw new Error(`élément non géré : ${tag.slice(0, 40)}`);
}
const symbols = {};
const meta = {};
for (const e of catalogue) {
  const svg = fs.readFileSync(ONLY_SYMBOLS ? path.join(OUT, 'symboles', `${e.id}.svg`) : path.join(SRC, e.symbole), 'utf8');
  if (!ONLY_SYMBOLS) fs.writeFileSync(path.join(OUT, 'symboles', `${e.id}.svg`), svg);
  if (!svg.includes('translate(21 21) scale(3.58)')) throw new Error(`${e.id} : mise en place inattendue`);
  const g = svg.match(/<g stroke="url\(#pearl\)" stroke-width="2\.04">([\s\S]*?)<\/g>/);
  if (!g) throw new Error(`${e.id} : couche nacrée introuvable`);
  const tags = g[1].match(/<(path|circle|rect)\b[^>]*\/?>/g) ?? [];
  symbols[e.id] = tags.map(toPath).join('');
  meta[e.id] = CAT[e.category];
}
// symboles ajoutés par HOMI hors catalogue fourni (entrées de compte), dans la même construction : gardés tels quels
const EXTRA = { account_delete: 'account', sign_out: 'account' };
for (const [id, cat] of Object.entries(EXTRA)) {
  const f = path.join(OUT, 'symboles', `${id}.svg`);
  if (!fs.existsSync(f)) continue;
  const g = fs.readFileSync(f, 'utf8').match(/<g stroke="url\(#pearl\)" stroke-width="2\.04">([\s\S]*?)<\/g>/);
  if (!g) throw new Error(`${id} : couche nacrée introuvable`);
  symbols[id] = (g[1].match(/<(path|circle|rect)\b[^>]*\/?>/g) ?? []).map(toPath).join('');
  meta[id] = cat;
}
const ts = `/**
 * Symboles des 134 outils « verre dépoli » (21/11/2026) — FICHIER GÉNÉRÉ par scripts/da/tool-glass-import.cjs
 * depuis assets/brand/tool-glass/symboles/*.svg : ne pas modifier à la main. Les symboles génériques fournis ont été
 * redessinés pour dire la fonction de l'outil (originaux : assets/brand/tool-glass/symboles-originaux/).
 * Hors catalogue fourni : \`account_delete\` et \`sign_out\` (entrées de compte dessinées par HOMI, même construction).
 * Chaque symbole = un tracé \`d\` sur la grille 24 (trait arrondi 2,04, posé en translate(21 21) scale(3.58) dans une
 * boîte 128 — la même que la plaque). Les couleurs (nacre, ombre, filet de lumière) sont dans src/theme/toolLogo.ts.
 */
export const TOOL_SYMBOLS: Record<string, string> = ${JSON.stringify(symbols, null, 1)};

/** Plaque de verre de chaque outil fourni (catégorie du catalogue). */
export const TOOL_GLASS_CATEGORY: Record<string, string> = ${JSON.stringify(meta, null, 1)};
`;
fs.mkdirSync(path.join(ROOT, 'src', 'brand', 'toolGlass'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'src', 'brand', 'toolGlass', 'symbols.ts'), ts);
const dup = Object.entries(symbols).filter(([id, d]) => Object.entries(symbols).some(([o, d2]) => o !== id && d2 === d));
if (dup.length) throw new Error(`symboles identiques : ${dup.map(([id]) => id).join(', ')}`);
console.log(`${catalogue.length} symboles${ONLY_SYMBOLS ? '' : `, ${Object.keys(glass).length} plaques`} → ${OUT}`);
