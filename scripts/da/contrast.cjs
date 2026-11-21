// Outil de présentation : contraste du glyphe (point le plus sombre) sur la plaque (point le plus clair) et des
// détails sur le glyphe, par catégorie et apparence (logos d'outils « verre sombre »).
require('./ts-require.cjs');
const L = require('../../src/theme/toolLogo.ts');

for (const m of ['light', 'dark', 'night']) {
  console.log(`— ${m}`);
  for (const c of Object.keys(L.LOGO_HUES)) {
    const s = L.toolLogoSpec(c, m);
    console.log(`${c.padEnd(10)} verre ${s.mid} lumière ${s.glow} glyphe ${s.glyph}→${s.glyphTint}  glyphe/plaque ${L.glyphContrast(c, m).toFixed(2)}:1  détail/glyphe ${L.detailContrast(c, m).toFixed(2)}:1`);
  }
}
