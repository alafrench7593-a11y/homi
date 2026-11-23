/**
 * Garde-fou (plantage au lancement iOS, builds 3 et 4, 17/11/2026) : dans un worklet, un paramètre par défaut qui lit
 * une variable de la fermeture (`function f(p, s = CONFIG.x) { 'worklet'; … }`) est évalué sur le fil UI AVANT que la
 * fermeture soit dépaquetée → ReferenceError non rattrapée → l'application se ferme (SIGABRT). Invisible sur le web
 * et sous Jest : ce test transforme chaque fichier avec le plugin worklets et vérifie le code réellement envoyé au fil UI.
 */
import { transformSync } from '@babel/core';
import * as ts from 'typescript';

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

/**
 * Second garde-fou (plantage iOS « Locally defined function passed to scheduleOnRN ») : une fonction DÉCLARÉE DANS un
 * worklet vit sur le fil UI ; la confier à `scheduleOnRN` (ou à l'ancien `runOnJS`) arrête l'application. La fonction
 * du fil JS doit être déclarée dans le composant, hors du worklet. Analyse de l'arbre syntaxique des sources :
 *  - worklet = fonction dont le corps commence par la directive 'worklet', ou fonction passée directement à un hook
 *    Reanimated (useAnimatedStyle, useDerivedValue, useAnimatedReaction, useAnimatedScrollHandler, useFrameCallback,
 *    useAnimatedProps…) ou à un rappel de geste (.onStart / .onUpdate / .onEnd / .onFinalize…) ;
 *  - fautif = `scheduleOnRN(f, …)` dans un worklet quand `f` est une fonction écrite sur place, ou un nom déclaré
 *    (function, const = () => …) à l'intérieur de ce worklet.
 */
const WORKLET_HOOKS = new Set(['useAnimatedStyle', 'useDerivedValue', 'useAnimatedReaction', 'useAnimatedScrollHandler', 'useFrameCallback', 'useAnimatedProps', 'runOnUI', 'scheduleOnUI']);
const GESTURE_CALLBACKS = /^on(Begin|Start|Update|Change|End|Finalize|Activate|Deactivate|Touches(Down|Move|Up|Cancelled|Cancel))$/;
const TO_JS = new Set(['scheduleOnRN', 'runOnJS']);
type Fn = ts.FunctionDeclaration | ts.FunctionExpression | ts.ArrowFunction;
const isFn = (n: ts.Node): n is Fn => ts.isFunctionDeclaration(n) || ts.isFunctionExpression(n) || ts.isArrowFunction(n);

function isWorklet(fn: Fn): boolean {
  const body = fn.body;
  if (body && ts.isBlock(body)) {
    const first = body.statements[0];
    if (first && ts.isExpressionStatement(first) && ts.isStringLiteral(first.expression) && first.expression.text === 'worklet') return true;
  }
  const call = fn.parent;
  if (call && ts.isCallExpression(call) && call.arguments.includes(fn as ts.Expression)) {
    const callee = call.expression;
    if (ts.isIdentifier(callee) && WORKLET_HOOKS.has(callee.text)) return true;
    if (ts.isPropertyAccessExpression(callee) && GESTURE_CALLBACKS.test(callee.name.text)) return true;
  }
  return false;
}

/** Fonctions locales à un worklet confiées au fil JS (« fichier:ligne nom »). Pur : testé ci-dessous sur des exemples. */
export function localFunctionsSentToJs(source: string, file = 'exemple.tsx'): string[] {
  const sf = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const out: string[] = [];
  const inspect = (worklet: Fn) => {
    const locals = new Set<string>();
    const collect = (n: ts.Node) => {
      if (n !== worklet && ts.isFunctionDeclaration(n) && n.name) locals.add(n.name.text);
      if (ts.isVariableDeclaration(n) && ts.isIdentifier(n.name) && n.initializer && isFn(n.initializer)) locals.add(n.name.text);
      ts.forEachChild(n, collect);
    };
    if (worklet.body) collect(worklet.body);
    const find = (n: ts.Node) => {
      if (ts.isCallExpression(n) && ts.isIdentifier(n.expression) && TO_JS.has(n.expression.text)) {
        const arg = n.arguments[0];
        const line = sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1;
        if (arg && isFn(arg)) out.push(`${file}:${line} fonction écrite sur place`);
        else if (arg && ts.isIdentifier(arg) && locals.has(arg.text)) out.push(`${file}:${line} ${arg.text}`);
      }
      ts.forEachChild(n, find);
    };
    if (worklet.body) find(worklet.body);
  };
  const walk = (n: ts.Node) => {
    // le worklet le plus EXTERNE suffit : ses fonctions imbriquées sont parcourues avec lui
    if (isFn(n) && isWorklet(n)) { inspect(n); return; }
    ts.forEachChild(n, walk);
  };
  walk(sf);
  return [...new Set(out)];
}

describe('aucune fonction locale à un worklet n’est confiée à scheduleOnRN', () => {
  it('le détecteur reconnaît les formes fautives', () => {
    const bad = `
      const close = () => {
        'worklet';
        const unmount = () => setMounted(false);
        y.value = withTiming(0, {}, (f) => { 'worklet'; if (f) scheduleOnRN(unmount); });
      };
      const pan = Gesture.Pan().onEnd(() => { function done() { onClose(); } scheduleOnRN(done); });
      const style = useAnimatedStyle(() => { scheduleOnRN(() => log()); return {}; });
      useAnimatedReaction(() => v.value, (a) => { const tell = function () { say(a); }; runOnJS(tell)(); });
    `;
    expect(localFunctionsSentToJs(bad).map((x) => x.split(' ').slice(1).join(' '))).toEqual(['unmount', 'done', 'fonction écrite sur place', 'tell']);
  });
  it('… et laisse passer les formes correctes (fonction du fil JS déclarée dans le composant)', () => {
    const good = `
      const unmount = () => setMounted(false);
      const tick = useCallback(() => haptic(), []);
      const close = () => {
        'worklet';
        y.value = withTiming(0, {}, (f) => { 'worklet'; if (f) scheduleOnRN(unmount); });
      };
      const pan = Gesture.Pan().onEnd((e) => { 'worklet'; const to = pick(e.velocityY); settle(to); scheduleOnRN(tick); scheduleOnRN(onDrop, order.value); });
      const onPress = () => { const later = () => go(); setTimeout(later, 10); };
    `;
    expect(localFunctionsSentToJs(good)).toEqual([]);
  });
  it('aucune source de l’application n’a cette forme', () => {
    const offenders: string[] = [];
    let scanned = 0;
    for (const file of sources('src')) {
      const src = fs.readFileSync(file, 'utf8');
      if (!/scheduleOnRN|runOnJS/.test(src)) continue;
      scanned++;
      offenders.push(...localFunctionsSentToJs(src, file));
    }
    expect(scanned).toBeGreaterThan(5); // les fichiers concernés sont bien parcourus
    expect(offenders).toEqual([]);
  });
});
