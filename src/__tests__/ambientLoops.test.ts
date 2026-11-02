/**
 * QA E2E (bibliothèque) : une animation contenue dans Animated.loop(...) ne doit pas compter
 * comme une interaction en cours. Sinon InteractionManager ne se libère jamais, et les longues
 * listes rendues par lots restent bloquées à leur premier lot sur le web (12 articles sur 32).
 * Ce test lit le code source : chaque Animated.timing / spring / decay d'une boucle doit porter
 * `isInteraction: false`, chaque pause passer par ambientDelay, et chaque springTo le drapeau `ambient`.
 */
import * as ts from 'typescript';

// Types Node absents du projet (appli Expo) : accès minimal, typé à la main.
type Dirent = { name: string; isDirectory(): boolean };
const fs = require('fs') as { readdirSync(p: string, o: { withFileTypes: true }): Dirent[]; readFileSync(p: string, enc: 'utf8'): string };
const path = require('path') as { join(...p: string[]): string; relative(a: string, b: string): string };
const ROOT = path.join(String(require('path').resolve('src')));

function sourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return e.name === '__tests__' ? [] : sourceFiles(p);
    return /\.(tsx?|jsx?)$/.test(e.name) ? [p] : [];
  });
}

function offenders(file: string): string[] {
  const src = fs.readFileSync(file, 'utf8');
  if (!src.includes('Animated.loop')) return [];
  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const out: string[] = [];
  const at = (n: ts.Node) => `${path.relative(ROOT, file)}:${sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1}`;
  const isAnim = (e: ts.Expression, name: string) =>
    ts.isPropertyAccessExpression(e) && e.expression.getText(sf) === 'Animated' && e.name.text === name;
  function inner(n: ts.Node) {
    if (ts.isCallExpression(n)) {
      if (['timing', 'spring', 'decay'].some((k) => isAnim(n.expression, k))) {
        const o = n.arguments[1];
        const ok = o && ts.isObjectLiteralExpression(o) && o.properties.some((p) => p.name?.getText(sf) === 'isInteraction' && ts.isPropertyAssignment(p) && p.initializer.kind === ts.SyntaxKind.FalseKeyword);
        if (!ok) out.push(`${at(n)} sans isInteraction: false`);
      } else if (isAnim(n.expression, 'delay')) {
        out.push(`${at(n)} Animated.delay (utiliser ambientDelay)`);
      } else if (n.expression.getText(sf) === 'springTo' && n.arguments[4]?.kind !== ts.SyntaxKind.TrueKeyword) {
        out.push(`${at(n)} springTo sans ambient`);
      }
    }
    ts.forEachChild(n, inner);
  }
  function walk(n: ts.Node) {
    if (ts.isCallExpression(n) && isAnim(n.expression, 'loop')) {
      n.arguments.forEach(inner);
      return;
    }
    ts.forEachChild(n, walk);
  }
  walk(sf);
  return out;
}

describe('boucles d\'animation décoratives', () => {
  it('ne bloquent pas InteractionManager', () => {
    const files = sourceFiles(ROOT);
    const withLoops = files.filter((f) => fs.readFileSync(f, 'utf8').includes('Animated.loop'));
    expect(withLoops.length).toBeGreaterThan(10);
    expect(files.flatMap(offenders)).toEqual([]);
  });
});
