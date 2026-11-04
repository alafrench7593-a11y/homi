/**
 * Garde-fou iPhone / Android : aucun outil JavaScript absent du moteur de l'appli (Hermes, React Native) ne doit
 * être appelé sans garde.
 *
 * Origine : sur iPhone, Réglages, Profil et Outils affichaient « Oups, cet écran a rencontré un problème —
 * TypeError: undefined cannot be used as a constructor » (new Intl.ListFormat, absent de Hermes). Les tests e2e
 * tournent dans Chromium, où ces outils existent : ils n'avaient rien vu.
 *
 * Ce test lit le code source (arbre syntaxique TypeScript, fichiers *.web.ts(x) exclus car jamais chargés sur
 * téléphone) et signale :
 *  - Intl.PluralRules / RelativeTimeFormat / ListFormat / DisplayNames / Segmenter / Locale / DurationFormat /
 *    supportedValuesOf : absents de Hermes → passer par src/i18n/intlSafe.ts (ou garde typeof / try) ;
 *  - DateTimeFormat#formatToParts / formatRange, NumberFormat style « unit » ou notation « compact » : absents ou
 *    incomplets sur iPhone → dans un try avec équivalent ;
 *  - window, document, navigator, localStorage, sessionStorage, crypto, IntersectionObserver, ResizeObserver,
 *    structuredClone, TextDecoder utilisés directement : n'existent pas (ou pas tous) en React Native → garde
 *    Platform.OS === 'web' ou typeof ;
 *  - globalThis.<ces noms>.xxx sans « ?. » : même raison ;
 *  - new Blob(...) et URL.createObjectURL : React Native ne sait pas fabriquer un fichier à partir de texte →
 *    réservé au web (Platform.OS === 'web') ;
 *  - dateStyle / timeStyle hors try (pris en charge de façon incomplète selon les versions de Hermes) ;
 *  - Object.groupBy, Map.groupBy, Promise.withResolvers, Array.fromAsync, AbortSignal.timeout / any, méthodes
 *    d'ensembles (union, intersection…) : absents de Hermes.
 * Une garde reconnue : branche `if` / `?:` / `&&` / `||` testant Platform.OS (web) ou `typeof X`, sortie anticipée
 * (`if (Platform.OS !== 'web') return;`) plus haut dans la même fonction, ou bloc try.
 */
import * as ts from 'typescript';

type Dirent = { name: string; isDirectory(): boolean };
const fs = require('fs') as { readdirSync(p: string, o: { withFileTypes: true }): Dirent[]; readFileSync(p: string, enc: 'utf8'): string };
const path = require('path') as { join(...p: string[]): string; relative(a: string, b: string): string; resolve(p: string): string };
// HERMES_SCAN_ROOT : analyser un autre dossier (ex. une ancienne version du code, pour vérifier que le test la refuse)
const ROOT = path.resolve(process.env.HERMES_SCAN_ROOT || 'src');

const INTL_MISSING = ['PluralRules', 'RelativeTimeFormat', 'ListFormat', 'DisplayNames', 'Segmenter', 'Locale', 'DurationFormat', 'supportedValuesOf'];
const GLOBALS = ['window', 'document', 'navigator', 'localStorage', 'sessionStorage', 'crypto', 'IntersectionObserver', 'ResizeObserver', 'structuredClone', 'TextDecoder'];
const STATIC_MISSING: Record<string, string[]> = { Object: ['groupBy'], Map: ['groupBy'], Promise: ['withResolvers'], Array: ['fromAsync'], AbortSignal: ['timeout', 'any'] };
const SET_METHODS = ['union', 'intersection', 'symmetricDifference', 'isSubsetOf', 'isSupersetOf', 'isDisjointFrom'];
const PARTS = ['formatToParts', 'formatRange', 'formatRangeToParts'];

function sourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return e.name === '__tests__' ? [] : sourceFiles(p);
    if (/\.web\.[jt]sx?$/.test(e.name)) return []; // jamais chargé sur téléphone
    return /\.(tsx?|jsx?)$/.test(e.name) && !/\.d\.ts$/.test(e.name) ? [p] : [];
  });
}

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const WEB_POS = /Platform\.OS\s*===?\s*['"]web['"]/;
const WEB_NEG = /Platform\.OS\s*!==?\s*['"]web['"]|Platform\.OS\s*===?\s*['"](ios|android)['"]/;
/** La condition garantit-elle (si vraie) que l'outil existe ? */
function positive(cond: string, ids: string[]): boolean {
  if (WEB_POS.test(cond)) return true;
  return ids.some((id) => {
    const i = esc(id);
    return new RegExp(`typeof\\s+(\\(?\\s*globalThis[^)]*\\)?\\.)?${i}\\b(?![^&|]*===?\\s*['"]undefined)`).test(cond)
      || new RegExp(`['"]${i}['"]\\s+in\\b`).test(cond)
      || new RegExp(`(^|[^!\\w.])(\\w+\\.)*${i}\\b(?!\\s*\\()`).test(cond.replace(/typeof\s+[\w.]+\s*===?\s*['"]undefined['"]/g, ''));
  });
}
/** La condition, si vraie, signale-t-elle que l'outil manque (sortie anticipée / branche else) ? */
function negative(cond: string, ids: string[]): boolean {
  if (WEB_NEG.test(cond)) return true;
  return ids.some((id) => {
    const i = esc(id);
    return new RegExp(`typeof\\s+(\\(?\\s*globalThis[^)]*\\)?\\.)?${i}\\b[^&|]*===?\\s*['"]undefined`).test(cond)
      || new RegExp(`!\\s*(\\w+\\.)*${i}\\b`).test(cond);
  });
}

const exits = (s: ts.Statement): boolean =>
  ts.isReturnStatement(s) || ts.isThrowStatement(s) || (ts.isBlock(s) && s.statements.length > 0 && exits(s.statements[s.statements.length - 1]));

function guarded(node: ts.Node, ids: string[], sf: ts.SourceFile, allowTry: boolean): boolean {
  let child: ts.Node = node;
  for (let n: ts.Node | undefined = node.parent; n; child = n, n = n.parent) {
    if (ts.isTryStatement(n) && n.tryBlock === child && n.catchClause && allowTry) return true; // try … finally ne rattrape rien
    if (ts.isIfStatement(n)) {
      const c = n.expression.getText(sf);
      if (n.thenStatement === child && positive(c, ids)) return true;
      if (n.elseStatement === child && negative(c, ids)) return true;
    }
    if (ts.isConditionalExpression(n)) {
      const c = n.condition.getText(sf);
      if (n.whenTrue === child && positive(c, ids)) return true;
      if (n.whenFalse === child && negative(c, ids)) return true;
    }
    if (ts.isBinaryExpression(n) && n.right === child) {
      const c = n.left.getText(sf);
      if (n.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken && positive(c, ids)) return true;
      if (n.operatorToken.kind === ts.SyntaxKind.BarBarToken && negative(c, ids)) return true;
    }
    if ((ts.isBlock(n) || ts.isSourceFile(n)) && ts.isStatement(child as ts.Statement)) {
      const stmts = (n as ts.Block).statements;
      for (const s of stmts) {
        if (s === child) break;
        if (ts.isIfStatement(s) && !s.elseStatement && exits(s.thenStatement) && negative(s.expression.getText(sf), ids)) return true;
      }
    }
    if (ts.isFunctionLike(n) && !ts.isArrowFunction(n) && !ts.isFunctionExpression(n)) {
      // une fonction nommée peut être appelée d'ailleurs : seules les gardes internes comptent
      return false;
    }
  }
  return false;
}

function inType(n: ts.Node): boolean {
  for (let p = n.parent; p; p = p.parent) if (ts.isTypeNode(p) || ts.isTypeAliasDeclaration(p) || ts.isInterfaceDeclaration(p)) return true;
  return false;
}

function isReference(id: ts.Identifier): boolean {
  const p = id.parent;
  if (!p || inType(id)) return false;
  if (ts.isPropertyAccessExpression(p) && p.name === id) return false;
  if ((ts.isPropertyAssignment(p) || ts.isPropertySignature(p) || ts.isPropertyDeclaration(p) || ts.isMethodDeclaration(p) || ts.isMethodSignature(p)
    || ts.isVariableDeclaration(p) || ts.isParameter(p) || ts.isBindingElement(p) || ts.isFunctionDeclaration(p) || ts.isClassDeclaration(p)
    || ts.isImportSpecifier(p) || ts.isImportClause(p) || ts.isNamespaceImport(p) || ts.isExportSpecifier(p) || ts.isJsxAttribute(p)
    || ts.isGetAccessor(p) || ts.isSetAccessor(p) || ts.isEnumMember(p) || ts.isLabeledStatement(p)) && (p as { name?: ts.Node }).name === id) return false;
  if (ts.isBindingElement(p) && p.propertyName === id) return false; // ({ window: win }) : nom de propriété
  if (ts.isTypeOfExpression(p)) return false; // `typeof window` ne lève jamais
  if (ts.isQualifiedName(p)) return false;
  return true;
}

/** Noms déclarés localement dans le fichier (une variable « document » locale n'est pas le document du navigateur). */
function localNames(sf: ts.SourceFile): Set<string> {
  const out = new Set<string>();
  const visit = (n: ts.Node) => {
    if ((ts.isVariableDeclaration(n) || ts.isParameter(n) || ts.isBindingElement(n) || ts.isFunctionDeclaration(n)) && n.name && ts.isIdentifier(n.name)) out.add(n.name.text);
    if (ts.isImportSpecifier(n) || ts.isNamespaceImport(n)) out.add(n.name.text);
    if (ts.isImportClause(n) && n.name) out.add(n.name.text);
    ts.forEachChild(n, visit);
  };
  visit(sf);
  return out;
}

export function scanSource(file: string, src: string): string[] {
  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, /x$/.test(file) ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const out: string[] = [];
  const locals = localNames(sf);
  const at = (n: ts.Node) => `${file}:${sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1}`;
  const isGlobalThis = (e: ts.Expression): boolean => {
    let x: ts.Expression = e;
    while (ts.isParenthesizedExpression(x) || ts.isAsExpression(x) || ts.isTypeAssertionExpression(x) || ts.isNonNullExpression(x)) x = (x as ts.ParenthesizedExpression).expression;
    return ts.isIdentifier(x) && (x.text === 'globalThis' || x.text === 'global');
  };
  const visit = (n: ts.Node) => {
    // Intl.X absents de Hermes
    if (ts.isPropertyAccessExpression(n) && ts.isIdentifier(n.expression) && n.expression.text === 'Intl' && INTL_MISSING.includes(n.name.text)
      && !(n.parent && ts.isTypeOfExpression(n.parent)) && !guarded(n, [`Intl.${n.name.text}`, n.name.text], sf, true)) {
      out.push(`${at(n)} Intl.${n.name.text} (absent sur iPhone : utiliser src/i18n/intlSafe.ts)`);
    }
    // formatToParts / formatRange
    if (ts.isCallExpression(n) && ts.isPropertyAccessExpression(n.expression) && PARTS.includes(n.expression.name.text)
      && !guarded(n, [n.expression.name.text], sf, true)) {
      out.push(`${at(n)} .${n.expression.name.text}() hors try (incomplet sur iPhone)`);
    }
    // NumberFormat / toLocaleString : style « unit », notation « compact »
    if (ts.isPropertyAssignment(n) && ts.isStringLiteral(n.initializer)
      && ((n.name.getText(sf) === 'style' && n.initializer.text === 'unit') || (n.name.getText(sf) === 'notation' && n.initializer.text !== 'standard'))) {
      const call = n.parent?.parent;
      if (call && (ts.isNewExpression(call) || ts.isCallExpression(call)) && /NumberFormat|toLocaleString/.test(call.expression.getText(sf)) && !guarded(call, [], sf, true)) {
        out.push(`${at(n)} ${n.getText(sf)} hors try (refusé par Intl sur iPhone)`);
      }
    }
    // dateStyle / timeStyle : prise en charge incomplète par l'Intl de Hermes selon les versions → options explicites
    if (ts.isPropertyAssignment(n) && ['dateStyle', 'timeStyle'].includes(n.name.getText(sf)) && !inType(n) && !guarded(n, [], sf, true)) {
      out.push(`${at(n)} ${n.name.getText(sf)} (utiliser day / month / year… explicites)`);
    }
    // Globals du navigateur utilisés directement
    if (ts.isIdentifier(n) && GLOBALS.includes(n.text) && !locals.has(n.text) && isReference(n) && !guarded(n, [n.text], sf, true)) {
      out.push(`${at(n)} ${n.text} sans garde (absent sur iPhone / Android)`);
    }
    // globalThis.X.y sans ?.
    if (ts.isPropertyAccessExpression(n) && isGlobalThis(n.expression) && GLOBALS.includes(n.name.text)) {
      const parent = n.parent;
      const used = parent && ((ts.isPropertyAccessExpression(parent) && parent.expression === n && !parent.questionDotToken) || (ts.isCallExpression(parent) && parent.expression === n && !parent.questionDotToken) || (ts.isNewExpression(parent) && parent.expression === n));
      if (used && !guarded(n, [n.name.text], sf, true)) out.push(`${at(n)} globalThis.${n.name.text} sans « ?. » ni garde`);
    }
    // Blob et URL.createObjectURL : web uniquement
    if (ts.isNewExpression(n) && ts.isIdentifier(n.expression) && n.expression.text === 'Blob' && !guarded(n, ['Blob'], sf, false)) {
      out.push(`${at(n)} new Blob(...) hors web (React Native ne crée pas de fichier à partir de texte)`);
    }
    if (ts.isPropertyAccessExpression(n) && n.name.text === 'createObjectURL' && /(^|\.)URL$/.test(n.expression.getText(sf))
      && !(n.parent && ts.isBinaryExpression(n.parent) && n.parent.left === n) && !guarded(n, ['createObjectURL'], sf, false)
      && !guardedWeb(n, sf)) {
      out.push(`${at(n)} URL.createObjectURL hors web`);
    }
    // Statiques absents de Hermes
    if (ts.isPropertyAccessExpression(n) && ts.isIdentifier(n.expression) && STATIC_MISSING[n.expression.text]?.includes(n.name.text)
      && !(n.parent && ts.isTypeOfExpression(n.parent)) && !guarded(n, [`${n.expression.text}.${n.name.text}`, n.name.text], sf, true)) {
      out.push(`${at(n)} ${n.expression.text}.${n.name.text} (absent sur iPhone)`);
    }
    if (ts.isCallExpression(n) && ts.isPropertyAccessExpression(n.expression) && SET_METHODS.includes(n.expression.name.text) && !guarded(n, [n.expression.name.text], sf, true)) {
      out.push(`${at(n)} .${n.expression.name.text}() (méthode d'ensemble absente sur iPhone)`);
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);
  return out;
}

/** createObjectURL / Blob : seule une garde « web » compte (une garde typeof URL ne suffit pas en React Native). */
function guardedWeb(node: ts.Node, sf: ts.SourceFile): boolean {
  return guarded(node, ['__web_only__'], sf, false);
}

describe('outils JavaScript absents sur iPhone / Android (Hermes)', () => {
  it('le détecteur repère les appels non gardés et accepte les gardes', () => {
    const bad = [
      "export const a = (n: string[]) => new Intl.ListFormat('fr', {}).format(n);",
      "export const b = (d: Date) => new Intl.DateTimeFormat('fr').formatToParts(d);",
      'export const c = () => document.title;',
      "export const d = (x: number) => new Intl.NumberFormat('fr', { style: 'unit', unit: 'kilogram' }).format(x);",
      'export const e = (s: string) => URL.createObjectURL(new Blob([s]));',
      'export const f = (o: object) => structuredClone(o);',
      'export const g = () => crypto.randomUUID();',
      'export const h = (l: number[]) => Object.groupBy(l, (x) => String(x));',
      'export const i = () => new Intl.PluralRules("fr").select(1);',
      "export const j = () => (globalThis as any).localStorage.getItem('k');",
      'export function k(b: Uint8Array) { try { return new TextDecoder().decode(b); } finally { /* rien */ } }',
      "export const m = (d: Date) => d.toLocaleDateString('fr-FR', { dateStyle: 'long' });",
      "export function l(p: { window: number }) { const { window: w } = p; return w + window.innerWidth; }",
    ];
    for (const s of bad) expect(scanSource('x.ts', s)).not.toEqual([]);
    const good = [
      "import { Platform } from 'react-native';\nexport function a() { if (Platform.OS === 'web') { document.title = 'x'; } }",
      "import { Platform } from 'react-native';\nexport function b() { if (Platform.OS !== 'web') return; const u = URL.createObjectURL(new Blob(['x'])); return u; }",
      "export function c(d: Date) { try { return new Intl.DateTimeFormat('fr').formatToParts(d); } catch { return []; } }",
      "export const d = () => typeof document !== 'undefined' && document.documentElement;",
      "export const e = () => (globalThis as any).localStorage?.getItem('k');",
      "export const f = (s: string) => (typeof TextDecoder === 'function' ? new TextDecoder().decode(new Uint8Array()) : s);",
      'export const g = (p: { window?: number }) => p.window;',
    ];
    for (const s of good) expect(scanSource('x.tsx', s)).toEqual([]);
  });

  it('aucun appel non gardé dans src/ (et le code serveur partagé que l’appli importe)', () => {
    const own = sourceFiles(ROOT);
    expect(own.length).toBeGreaterThan(100);
    // supabase/functions/_shared/*.ts importés par l'appli : ils tournent aussi sur le téléphone
    const shared = new Set<string>();
    for (const f of own) {
      for (const m of fs.readFileSync(f, 'utf8').matchAll(/supabase\/functions\/_shared\/([\w-]+)(?:\.ts)?['"]/g)) {
        shared.add(path.join(ROOT, '..', 'supabase', 'functions', '_shared', `${m[1]}.ts`));
      }
    }
    const files = [...own, ...shared];
    const found = files.flatMap((f) => scanSource(path.relative(ROOT, f), fs.readFileSync(f, 'utf8')));
    expect(found).toEqual([]);
  });
});
