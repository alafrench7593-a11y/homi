// Liste des routes de src/app (pour le bouton Retour d'un lien direct, D-14). Usage : node scripts/gen-routes.js
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..', 'src', 'app');
const out = new Set();
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { walk(p); continue; }
    if (!/\.tsx$/.test(e.name) || e.name.startsWith('_') || e.name.startsWith('+')) continue;
    if (/\.(web|ios|android|native)\.tsx$/.test(e.name)) continue;
    let r = path.relative(root, p).replace(/\\/g, '/').replace(/\.tsx$/, '');
    r = r.split('/').filter((s) => !/^\(.*\)$/.test(s)).join('/');
    r = r.replace(/(^|\/)index$/, '');
    out.add('/' + r);
  }
})(root);
const list = [...out].sort();
const file = path.join(__dirname, '..', 'src', 'lib', 'routes.generated.ts');
const body = `// Généré par scripts/gen-routes.js — ne pas modifier à la main.\nexport const APP_ROUTES: readonly string[] = ${JSON.stringify(list, null, 2).replace(/"/g, "'")};\n`;
if (process.argv.includes('--check')) {
  const cur = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  if (cur !== body) { console.error('routes.generated.ts n’est pas à jour : node scripts/gen-routes.js'); process.exit(1); }
} else fs.writeFileSync(file, body);
console.log(list.length + ' routes');
