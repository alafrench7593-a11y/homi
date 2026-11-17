/**
 * Garde-fou (plantage au lancement iOS, builds 3 et 4, 17/11/2026) : dans un worklet, un paramètre par défaut qui lit
 * une variable de la fermeture (`function f(p, s = CONFIG.x) { 'worklet'; … }`) est évalué sur le fil UI AVANT que la
 * fermeture soit dépaquetée → ReferenceError non rattrapée → l'application se ferme (SIGABRT). Invisible sur le web
 * et sous Jest : ce test transforme chaque fichier avec le plugin worklets et vérifie le code réellement envoyé au fil UI.
 */
import { transformSync } from '@babel/core';

const fs = require('fs') as { readFileSync(p: string, enc: 'utf8'): string; readdirSync(p: string, o: { withFileTypes: true }): { name: string; isDirectory(): boolean }[] };
const path = require('path') as { join(...p: string[]): string; resolve(...p: string[]): string };

function sources(dir: string, out: string[] = []): string[] {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== '__tests__' && e.name !== 'node_modules') sources(p, out); } else if (/\.tsx?$/.test(e.name)) out.push(p);
  }
  return out;
}

it('aucun worklet n’a de paramètre par défaut qui lit sa fermeture', () => {
  const offenders: string[] = [];
  let worklets = 0;
  for (const file of sources('src')) {
    const src = fs.readFileSync(file, 'utf8');
    if (!/worklet|react-native-reanimated/.test(src)) continue;
    const out = transformSync(src, { filename: path.resolve(file), babelrc: false, configFile: false, presets: [['babel-preset-expo', {}]], caller: { name: 'metro', platform: 'ios', bundler: 'metro' } as never });
    const re = /function (\w+)\(([^{]*?)\)\{const\[([^\]]*)\]=this\.__closure;/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(out?.code ?? ''))) {
      worklets++;
      const params = m[2];
      if (!params.includes('=')) continue;
      const hit = m[3].split(',').map((s) => s.trim()).filter(Boolean).filter((c) => new RegExp(`=[^,]*\\b${c.replace(/\$/g, '\\$')}\\b`).test(params));
      if (hit.length) offenders.push(`${file} : ${m[1]}(${params}) lit ${hit.join(', ')}`);
    }
  }
  expect(worklets).toBeGreaterThan(50); // le plugin worklets est bien actif dans cette transformation
  expect(offenders).toEqual([]);
}, 240000);
