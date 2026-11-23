/**
 * Outil de présentation (hors application) : permet à un script Node de `require()` des modules TypeScript de src/
 * (transpilation à la volée par `typescript`, alias `@/` → src/). Sert aux planches de la direction artistique et à
 * l'export des logos (scripts/da/*). Les modules qui importent React Native ne doivent pas être chargés ainsi.
 */
const fs = require('fs');
const path = require('path');
const Module = require('module');
const ts = require('typescript');

const SRC = path.resolve(__dirname, '..', '..', 'src');
const origResolve = Module._resolveFilename;
Module._resolveFilename = function resolve(request, parent, ...rest) {
  const req = request.startsWith('@/') ? path.join(SRC, request.slice(2)) : request;
  return origResolve.call(this, req, parent, ...rest);
};
for (const ext of ['.ts', '.tsx']) {
  require.extensions[ext] = function load(module, filename) {
    const src = fs.readFileSync(filename, 'utf8');
    const out = ts.transpileModule(src, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.React, esModuleInterop: true },
    });
    module._compile(out.outputText, filename);
  };
}
