// Outil de présentation : contraste du symbole nacré sur le centre éclairé de la plaque, par public et apparence
// (logos d'outils « verre dépoli + lumière par public »), comparé à la plaque nue.
require('./ts-require.cjs');
const L = require('../../src/theme/toolLogo.ts');

console.log(`plaque nue ${L.GLASS_CENTER} : ${L.bareContrast().toFixed(2)}:1`);
for (const m of ['light', 'dark', 'night']) {
  console.log(`— ${m}`);
  for (const p of L.LOGO_PUBLICS) console.log(`${p.padEnd(8)} lumière ${L.PUBLIC_LIGHT[p]}  centre ${L.litCenter(p, m)}  symbole/centre ${L.lightContrast(p, m).toFixed(2)}:1`);
}
