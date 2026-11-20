// Outil de présentation : contraste du glyphe des logos d'outils, par catégorie et apparence.
require('./ts-require.cjs');
const L = require('../../src/theme/toolLogo.ts');

for (const m of ['light', 'dark', 'night']) {
  console.log(m, Object.keys(L.LOGO_HUES).map((c) => `${c}:${L.glyphContrast(c, m).toFixed(2)} ${L.toolLogoSpec(c, m).mid}`).join(' | '));
}
