#!/usr/bin/env node
/**
 * Contrôle rejouable « dépendances et confidentialité » (audit 04, 13/11/2026).
 *
 *   node scripts/homi/privacy-check.mjs                 contrôles rapides (dépôt courant)
 *   node scripts/homi/privacy-check.mjs --history       + tout l'historique git (secrets jamais commités)
 *   node scripts/homi/privacy-check.mjs --dist <dossier> + bundle exporté (npx expo export --platform web)
 *
 * Sortie : une ligne OK / ÉCHEC par contrôle ; code 1 au premier échec. Aucune valeur secrète n'est affichée.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = new URL('../..', import.meta.url).pathname;
const args = process.argv.slice(2);
const failures = [];
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
function check(name, problems) {
  const list = problems.filter(Boolean);
  if (list.length) {
    failures.push(name);
    console.log(`ÉCHEC  ${name}`);
    for (const p of list.slice(0, 15)) console.log(`         - ${p}`);
  } else console.log(`OK     ${name}`);
}
const git = (...a) => execFileSync('git', a, { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 30 });

// Formes des secrets connus (les clés PUBLIQUES — anon Supabase, RevenueCat appl_/goog_ — sont aussi signalées si
// elles apparaissent en clair dans le dépôt : leur place est .env ou les variables EAS).
const SECRET_RE = new RegExp([
  'eyJ[A-Za-z0-9_-]{10,}\\.eyJ[A-Za-z0-9_-]{10,}\\.[A-Za-z0-9_-]{10,}', // JWT (anon / service_role)
  'sbp_[a-f0-9]{30,}', 'sb_secret_[A-Za-z0-9_-]{20,}', // jetons Supabase
  'AIza[0-9A-Za-z_-]{35}', // Google / Gemini
  'sk-(?:ant-[a-z0-9]+-|proj-)[A-Za-z0-9_-]{24,}', 'sk-[A-Za-z0-9]{40,}', // Anthropic / OpenAI
  'sk_(?:live|test)_[A-Za-z0-9]{20,}', // RevenueCat / Stripe secrètes
  'gh[pousr]_[A-Za-z0-9]{30,}', 'github_pat_[A-Za-z0-9_]{30,}',
  're_[A-Za-z0-9]{8,}_[A-Za-z0-9]{16,}', // Resend
  'whsec_[A-Za-z0-9+/=]{20,}',
  'appl_[A-Za-z0-9]{20,}', 'goog_[A-Za-z0-9]{20,}',
  '-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----[A-Za-z0-9+/=\\s]{40}',
  'AKIA[0-9A-Z]{16}', 'xox[bap]-[A-Za-z0-9-]{20,}',
].join('|'));
const FORBIDDEN_FILE = /(^|\/)(\.env(\.(?!example$)[^/]*)?|[^/]*\.(p8|p12|pem|key|jks|keystore|mobileprovision)|credentials\.json|google-services\.json|GoogleService-Info\.plist)$/;

// ------------------------------------------------------------------ 1. secrets dans les fichiers suivis
const tracked = git('ls-files').split('\n').filter(Boolean);
check('Aucun fichier secret suivi par git (.env, .p8, .pem, keystore…)', tracked.filter((f) => FORBIDDEN_FILE.test(f)));
check('Aucune clé ni jeton en clair dans les fichiers suivis', tracked.filter((f) => !/package-lock\.json$|\.(png|jpe?g|gif|webp|ttf|otf|ico|pdf|zip|mp4|mov)$/i.test(f)).map((f) => {
  let s;
  try { s = read(f); } catch { return null; }
  const m = s.match(SECRET_RE);
  return m ? `${f} : forme « ${m[0].slice(0, 6)}… »` : null;
}));

// ------------------------------------------------------------------ 2. historique complet (option)
if (args.includes('--history')) {
  const hist = git('log', '--all', '-p', '--no-color', '--format=COMMIT %h');
  const hits = [];
  let commit = '';
  for (const line of hist.split('\n')) {
    if (line.startsWith('COMMIT ')) { commit = line.slice(7); continue; }
    if (line.startsWith('+') && SECRET_RE.test(line)) hits.push(`commit ${commit} : forme « ${line.match(SECRET_RE)[0].slice(0, 6)}… »`);
  }
  const added = git('log', '--all', '--diff-filter=A', '--name-only', '--format=').split('\n').filter((f) => f && FORBIDDEN_FILE.test(f));
  check('Historique git : aucun secret ni fichier secret jamais commité', [...hits, ...[...new Set(added)].map((f) => `fichier ajouté : ${f}`)]);
}

// ------------------------------------------------------------------ 3. .gitignore / .easignore
const gi = read('.gitignore');
const ei = read('.easignore');
check('.gitignore couvre .env*, clés et certificats', ['.env*', '*.p8', '*.p12', '*.pem', '*.keystore', '*.jks', 'credentials.json'].filter((p) => !gi.split('\n').includes(p)).map((p) => `absent : ${p}`));
check('.easignore exclut clés, certificats et .env secondaires', ['.env.*', '*.p8', '*.p12', '*.pem', '*.key', '*.keystore', '*.jks', 'credentials.json'].filter((p) => !ei.split('\n').includes(p)).map((p) => `absent : ${p}`));

// .env est envoyé à EAS (clés publiques) : il ne doit contenir AUCUN secret serveur rempli
const serverSecrets = read('.env.example').split('\n').map((l) => l.match(/^#?\s*([A-Z][A-Z0-9_]+)=/)?.[1]).filter((n) => n && !n.startsWith('EXPO_PUBLIC_'));
if (existsSync(join(ROOT, '.env'))) {
  const env = Object.fromEntries(read('.env').split('\n').map((l) => l.match(/^\s*([A-Z][A-Z0-9_]*)\s*=\s*(.*)$/)).filter(Boolean).map((m) => [m[1], m[2].replace(/^["']|["']$/g, '').trim()]));
  check('.env (envoyé à EAS) sans secret serveur : à placer dans .env.local ou « supabase secrets set »', serverSecrets.filter((n) => env[n] && !['ALLOWED_ORIGINS', 'GEMINI_MODEL', 'OPENFOODFACTS_USER_AGENT', 'RAPPELCONSO_ENABLED', 'RAPPELCONSO_DATASET', 'REVENUECAT_ENTITLEMENT', 'RESEND_FROM_EMAIL', 'SUPABASE_AUTH_APPLE_CLIENT_ID', 'SUPABASE_AUTH_GOOGLE_CLIENT_ID'].includes(n)).map((n) => `${n} rempli dans .env`));
} else console.log('—      .env absent : contrôle du contenu ignoré');

// ------------------------------------------------------------------ 4. code de l'application
function walk(dir, out = []) {
  for (const e of readdirSync(join(ROOT, dir))) {
    const p = join(dir, e);
    if (statSync(join(ROOT, p)).isDirectory()) { if (e !== 'node_modules' && e !== '__tests__') walk(p, out); } else if (/\.(ts|tsx|js|mjs)$/.test(e)) out.push(p);
  }
  return out;
}
const app = walk('src');
check('Application : seules les variables EXPO_PUBLIC_* sont lues (aucun secret serveur dans le bundle)', app.flatMap((f) =>
  [...read(f).matchAll(/process\.env\.([A-Z0-9_]+)/g)].map((m) => m[1]).filter((n) => !n.startsWith('EXPO_PUBLIC_') && !['NODE_ENV', 'EXPO_OS', 'EXPO_ROUTER_APP_ROOT'].includes(n)).map((n) => `${f} : process.env.${n}`)));
check('Application : aucun console.log/info/debug, console.warn/error seulement en développement', app.flatMap((f) =>
  read(f).split('\n').map((l, i) => (/console\.(log|info|debug)\(/.test(l) || (/console\.(warn|error)\(/.test(l) && !/__DEV__/.test(l)) ? `${f}:${i + 1}` : null)).filter(Boolean)));

// ------------------------------------------------------------------ 5. Sentry : consentement et désactivation du natif
const cr = read('src/lib/crashReporting.ts');
check('Sentry : sendDefaultPii faux, aucun suivi natif non filtré, beforeSend actif', [
  !/sendDefaultPii: false/.test(cr) && 'sendDefaultPii',
  !/enableNativeCrashHandling: false/.test(cr) && 'enableNativeCrashHandling',
  !/enableAppHangTracking: false/.test(cr) && 'enableAppHangTracking',
  !/enableWatchdogTerminationTracking: false/.test(cr) && 'enableWatchdogTerminationTracking',
  !/enableNdk: false/.test(cr) && 'enableNdk',
  !/attachScreenshot: false/.test(cr) && 'attachScreenshot',
  !/beforeSend: \(e\) => scrubEvent\(e\)/.test(cr) && 'beforeSend',
  (cr.match(/Sentry\.init\(/g) ?? []).length !== 1 && 'un seul Sentry.init',
  !/function start\(\)[\s\S]*Sentry\.init/.test(cr) && 'Sentry.init seulement dans start() (après accord)',
]);
check('Sentry : aucun autre module n’appelle le SDK directement', app.filter((f) => !f.endsWith('crashReporting.ts') && /from '@sentry\/react-native'/.test(read(f))));

// ------------------------------------------------------------------ 6. fonctions serveur
const fnDir = 'supabase/functions';
const fns = readdirSync(join(ROOT, fnDir)).filter((d) => existsSync(join(ROOT, fnDir, d, 'index.ts')));
check('Fonctions : corps JSON lus avec une taille bornée (readJsonBody)', fns.map((d) => (/req\.json\(\)/.test(read(`${fnDir}/${d}/index.ts`)) ? `${d}/index.ts : req.json() sans limite` : null)));
const serverFiles = walk(fnDir).filter((f) => !/_test\.ts$|\.test\.ts$|\/_tests\//.test(f));
check('Fonctions : journaux sans contenu (ni message d’erreur, ni corps, ni texte, ni e-mail)', serverFiles.flatMap((f) =>
  read(f).split('\n').map((l, i) => (/console\.(log|info|debug|warn|error)\(/.test(l) && /(e|err|error)\.message|\bbody\b|\.text\b|email|JSON\.stringify|\braw\b|\bmessage\b(?!:)/.test(l.replace(/'[^']*'/g, "''")) ? `${f}:${i + 1}` : null)).filter(Boolean)));

// ------------------------------------------------------------------ 7. autorisations natives
const cfg = read('app.config.ts');
const perms = (cfg.match(/permissions:\s*\[([^\]]*)\]/)?.[1] ?? '').match(/'([A-Z_]+)'/g)?.map((s) => s.slice(1, -1)) ?? [];
check('Android : allowBackup désactivé, autorisations limitées, ni micro ni position en arrière-plan', [
  !/allowBackup: false/.test(cfg) && 'allowBackup: false absent',
  ...perms.filter((p) => !['CAMERA', 'POST_NOTIFICATIONS', 'SCHEDULE_EXACT_ALARM'].includes(p)).map((p) => `autorisation non prévue : ${p}`),
  !/microphonePermission: false/.test(cfg) && 'micro non désactivé',
  !/isAndroidBackgroundLocationEnabled: false/.test(cfg) && 'position en arrière-plan Android',
  !/isIosBackgroundLocationEnabled: false/.test(cfg) && 'position en arrière-plan iOS',
  !/locationAlwaysPermission: false/.test(cfg) && 'position « toujours »',
  !/NSPrivacyTracking: false/.test(cfg) && 'NSPrivacyTracking',
]);

// ------------------------------------------------------------------ 8. bundle web exporté (option)
const di = args.indexOf('--dist');
if (di >= 0) {
  const dist = args[di + 1];
  const files = (function list(d, out = []) { for (const e of readdirSync(d)) { const p = join(d, e); if (statSync(p).isDirectory()) list(p, out); else if (/\.(js|html|json|map)$/.test(e)) out.push(p); } return out; })(dist);
  const values = [];
  for (const f of ['.env', '.env.local']) {
    if (!existsSync(join(ROOT, f))) continue;
    for (const m of read(f).matchAll(/^\s*([A-Z][A-Z0-9_]*)\s*=\s*(.+)$/gm)) if (!m[1].startsWith('EXPO_PUBLIC_') && m[2].trim().length >= 12) values.push([m[1], m[2].trim().replace(/^["']|["']$/g, '')]);
  }
  check(`Bundle web (${files.length} fichiers) : aucune clé secrète ni valeur de secret serveur`, files.flatMap((f) => {
    const s = readFileSync(f, 'utf8');
    const out = [];
    // Clés publiques attendues dans le bundle : RevenueCat (appl_/goog_) et le JWT « anon » de Supabase.
    // Un JWT dont le rôle n'est pas « anon » (service_role) est un secret.
    for (const [hit] of s.matchAll(new RegExp(SECRET_RE.source, 'g'))) {
      if (/^(appl_|goog_)/.test(hit)) continue;
      if (/^eyJ/.test(hit)) {
        let role = '?';
        try { role = JSON.parse(Buffer.from(hit.split('.')[1], 'base64url').toString()).role; } catch { /* illisible */ }
        if (role === 'anon') continue;
        out.push(`${relative(dist, f)} : JWT de rôle « ${role} »`);
      } else out.push(`${relative(dist, f)} : forme « ${hit.slice(0, 6)}… »`);
    }
    for (const [n, v] of values) if (s.includes(v)) out.push(`${relative(dist, f)} : valeur de ${n}`);
    return out;
  }));
}

console.log(failures.length ? `\n${failures.length} contrôle(s) en échec.` : '\nTous les contrôles de confidentialité sont au vert.');
process.exit(failures.length ? 1 : 0);
