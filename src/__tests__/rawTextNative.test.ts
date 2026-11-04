/**
 * Garde-fou iPhone / Android : jamais de texte « nu » rendu par {a && <…>} quand `a` peut valoir 0 ou ''.
 *
 * Sur le web, {0 && <X/>} affiche simplement « 0 » ; sur téléphone, React Native refuse un texte posé hors d'un
 * composant <Text> (« Text strings must be rendered within a <Text> component ») et tout l'écran tombe sur
 * « Oups, cet écran a rencontré un problème ». Les tests e2e (Chromium) ne le voient donc jamais.
 * Ce test utilise le vérificateur de types TypeScript : pour chaque {gauche && droite} écrit comme enfant JSX, la
 * partie gauche ne doit pas pouvoir être un nombre ou un texte (écrire `!!valeur &&`, `valeur > 0 &&` ou un ternaire).
 */
import * as ts from 'typescript';

const path = require('path') as { join(...p: string[]): string; relative(a: string, b: string): string; resolve(p: string): string };
const ROOT = path.resolve('.');

jest.setTimeout(240_000);

function risky(t: ts.Type): boolean {
  const parts = t.isUnion() ? t.types : [t];
  return parts.some((p) => {
    const f = p.flags;
    if (f & ts.TypeFlags.NumberLike) return !(p.isNumberLiteral() && p.value !== 0);
    if (f & ts.TypeFlags.StringLike) return !(p.isStringLiteral() && p.value !== '');
    if (f & ts.TypeFlags.BigIntLike) return true;
    return (f & (ts.TypeFlags.Any | ts.TypeFlags.Unknown)) !== 0;
  });
}

function findings(fileNames: string[], options: ts.CompilerOptions): string[] {
  const program = ts.createProgram(fileNames, options);
  const checker = program.getTypeChecker();
  const out: string[] = [];
  for (const sf of program.getSourceFiles()) {
    if (sf.isDeclarationFile || !fileNames.includes(sf.fileName)) continue;
    const check = (b: ts.Expression) => {
      while (ts.isParenthesizedExpression(b)) b = b.expression;
      if (!ts.isBinaryExpression(b) || b.operatorToken.kind !== ts.SyntaxKind.AmpersandAmpersandToken) return;
      check(b.left);
      const t = checker.getTypeAtLocation(b.left);
      if (risky(t)) out.push(`${path.relative(ROOT, sf.fileName)}:${sf.getLineAndCharacterOfPosition(b.getStart(sf)).line + 1} ${b.left.getText(sf).slice(0, 60)} (${checker.typeToString(t)})`);
    };
    const visit = (n: ts.Node) => {
      if (ts.isJsxExpression(n) && n.expression && n.parent && (ts.isJsxElement(n.parent) || ts.isJsxFragment(n.parent))) check(n.expression);
      ts.forEachChild(n, visit);
    };
    visit(sf);
  }
  return out;
}

describe('texte hors <Text> sur téléphone', () => {
  it('le détecteur repère {n && <X/>} avec un nombre ou un texte, et accepte !!n', () => {
    const sys = ts.sys;
    const file = path.join(ROOT, 'src', '__tests__', '__rawtext_sample__.tsx');
    const src = [
      'declare const n: number; declare const s: string | null; declare const ok: boolean; declare const X: () => null;',
      'export const a = <div>{n && <X />}</div>;',
      'export const b = <div>{s && <X />}</div>;',
      'export const c = <div>{!!n && <X />}{ok && <X />}{n > 0 && <X />}{s ? <X /> : null}</div>;',
    ].join('\n');
    const host = ts.createCompilerHost({ jsx: ts.JsxEmit.Preserve, strict: true, noEmit: true });
    const orig = host.getSourceFile;
    host.getSourceFile = (name, lang, ...rest) => (name === file ? ts.createSourceFile(name, src, lang, true, ts.ScriptKind.TSX) : orig(name, lang, ...rest));
    host.fileExists = (name) => name === file || sys.fileExists(name);
    const program = ts.createProgram([file], { jsx: ts.JsxEmit.Preserve, strict: true, noEmit: true }, host);
    const checker = program.getTypeChecker();
    const sf = program.getSourceFile(file)!;
    const hits: number[] = [];
    const visit = (nd: ts.Node) => {
      if (ts.isJsxExpression(nd) && nd.expression && ts.isBinaryExpression(nd.expression) && nd.expression.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken
        && risky(checker.getTypeAtLocation(nd.expression.left))) hits.push(sf.getLineAndCharacterOfPosition(nd.getStart(sf)).line + 1);
      ts.forEachChild(nd, visit);
    };
    visit(sf);
    expect(hits).toEqual([2, 3]);
  });

  it('aucun {valeur && …} pouvant afficher 0 ou un texte vide dans les écrans', () => {
    const cfg = ts.readConfigFile(path.join(ROOT, 'tsconfig.json'), ts.sys.readFile);
    const parsed = ts.parseJsonConfigFileContent(cfg.config, ts.sys, ROOT);
    const files = parsed.fileNames.filter((f) => f.endsWith('.tsx') && f.includes('/src/') && !f.includes('__tests__'));
    expect(files.length).toBeGreaterThan(150);
    expect(findings(files, parsed.options)).toEqual([]);
  });
});
