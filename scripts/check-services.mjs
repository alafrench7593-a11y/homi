#!/usr/bin/env node
/**
 * Vérification RÉELLE des services externes (aucune simulation) : npm run check:services
 * Lit le fichier .env à la racine, appelle chaque service et affiche OK / ÉCHEC avec la raison exacte.
 * À lancer sur un poste ou un serveur qui a accès à Internet.
 */
import fs from 'node:fs';

function loadEnv(file = '.env') {
  const env = { ...process.env };
  if (fs.existsSync(file)) {
    for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !line.trim().startsWith('#')) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
  return env;
}
const E = loadEnv();
const results = [];
const mask = (v) => (v ? `${v.slice(0, 4)}…` : '(vide)');

async function check(name, needs, fn) {
  const missing = needs.filter((k) => !E[k]);
  if (missing.length) { results.push({ name, status: 'CLÉ MANQUANTE', detail: missing.join(', ') }); return; }
  try {
    const detail = await fn();
    results.push({ name, status: 'OK', detail });
  } catch (e) {
    results.push({ name, status: 'ÉCHEC', detail: e instanceof Error ? e.message : String(e) });
  }
}
async function get(url, headers = {}) {
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(15000) });
  const text = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status} sur ${new URL(url).host} : ${text.slice(0, 160)}`);
  try { return JSON.parse(text); } catch { return text; }
}

await check('Supabase (Auth)', ['EXPO_PUBLIC_SUPABASE_URL', 'EXPO_PUBLIC_SUPABASE_ANON_KEY'], async () => {
  await get(`${E.EXPO_PUBLIC_SUPABASE_URL}/auth/v1/health`, { apikey: E.EXPO_PUBLIC_SUPABASE_ANON_KEY });
  return 'service d’authentification joignable';
});
await check('Supabase (base : migrations appliquées)', ['EXPO_PUBLIC_SUPABASE_URL', 'EXPO_PUBLIC_SUPABASE_ANON_KEY'], async () => {
  const rows = await get(`${E.EXPO_PUBLIC_SUPABASE_URL}/rest/v1/emergency_resources?select=number&limit=20`, { apikey: E.EXPO_PUBLIC_SUPABASE_ANON_KEY, Authorization: `Bearer ${E.EXPO_PUBLIC_SUPABASE_ANON_KEY}` });
  if (!Array.isArray(rows) || !rows.length) throw new Error('table emergency_resources vide : migrations ou seed non appliqués (supabase db push)');
  return `${rows.length} numéros d’urgence lus (migrations appliquées)`;
});
await check('Supabase (clé service, serveur uniquement)', ['EXPO_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'], async () => {
  await get(`${E.EXPO_PUBLIC_SUPABASE_URL}/auth/v1/admin/users?per_page=1`, { apikey: E.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${E.SUPABASE_SERVICE_ROLE_KEY}` });
  return 'clé service valide';
});
await check('Gemini API', ['GEMINI_API_KEY'], async () => {
  const model = E.GEMINI_MODEL || 'gemini-3.5-flash-lite';
  const m = await get(`https://generativelanguage.googleapis.com/v1beta/models/${model}`, { 'x-goog-api-key': E.GEMINI_API_KEY });
  return `modèle disponible : ${m.name ?? model}`;
});
const ua = E.OPENFOODFACTS_USER_AGENT;
await check('Open Food Facts', ['OPENFOODFACTS_USER_AGENT'], async () => {
  const p = await get('https://world.openfoodfacts.org/api/v2/product/3017620422003.json?fields=code,product_name,brands', { 'User-Agent': ua });
  if (p.status !== 1) throw new Error('produit de référence introuvable');
  return `produit de référence lu : ${p.product.product_name ?? p.code}`;
});
await check('Open Beauty Facts', ['OPENFOODFACTS_USER_AGENT'], async () => {
  const s = await get('https://world.openbeautyfacts.org/api/v2/search?page_size=1&fields=code,product_name', { 'User-Agent': ua });
  if (!Array.isArray(s.products)) throw new Error('réponse inattendue');
  return `API joignable (${s.count ?? '?'} produits)`;
});
await check('RappelConso (data.economie.gouv.fr)', [], async () => {
  const r = await get('https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/rappelconso-v2-gtin-espaces/records?limit=1');
  const rec = r.results?.[0];
  if (!rec) throw new Error('aucun enregistrement');
  return `jeu de données lu ; champs : ${Object.keys(rec).slice(0, 12).join(', ')}…`;
});
await check('CosIng (table importée)', ['EXPO_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'], async () => {
  const res = await fetch(`${E.EXPO_PUBLIC_SUPABASE_URL}/rest/v1/cosing_ingredients?select=inci_name&limit=1`, { headers: { apikey: E.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${E.SUPABASE_SERVICE_ROLE_KEY}`, Prefer: 'count=exact' } });
  if (!res.ok) throw new Error(`HTTP ${res.status} : table absente ? (supabase db push)`);
  const total = res.headers.get('content-range')?.split('/')[1];
  if (!total || total === '0') throw new Error('table vide : lancez npm run import:cosing -- <fichier CosIng officiel>');
  return `${total} ingrédients CosIng`;
});
await check('Ciqual ANSES (table importée)', ['EXPO_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'], async () => {
  const res = await fetch(`${E.EXPO_PUBLIC_SUPABASE_URL}/rest/v1/ciqual_foods?select=code&limit=1`, { headers: { apikey: E.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${E.SUPABASE_SERVICE_ROLE_KEY}`, Prefer: 'count=exact' } });
  if (!res.ok) throw new Error(`HTTP ${res.status} : table absente ? (supabase db push)`);
  const total = res.headers.get('content-range')?.split('/')[1];
  if (!total || total === '0') throw new Error('table vide : lancez npm run import:ciqual -- <fichier Ciqual officiel>');
  return `${total} aliments Ciqual`;
});
await check('Expo (projet EAS)', ['EXPO_PUBLIC_EAS_PROJECT_ID'], async () => {
  if (!/^[0-9a-f-]{36}$/i.test(E.EXPO_PUBLIC_EAS_PROJECT_ID)) throw new Error('identifiant de projet EAS invalide (UUID attendu)');
  return 'identifiant présent (vérifié au premier enregistrement de jeton push sur un téléphone)';
});
await check('Expo (envoi push, serveur)', ['EXPO_ACCESS_TOKEN'], async () => {
  const res = await fetch('https://exp.host/--/api/v2/push/getReceipts', { method: 'POST', headers: { Authorization: `Bearer ${E.EXPO_ACCESS_TOKEN}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ ids: [] }), signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`HTTP ${res.status} : jeton refusé`);
  return 'jeton accepté par le service push d’Expo';
});
await check('RevenueCat (clé Apple)', ['EXPO_PUBLIC_REVENUECAT_APPLE_KEY'], async () => {
  await get('https://api.revenuecat.com/v1/subscribers/verification-toi-et-moi', { Authorization: `Bearer ${E.EXPO_PUBLIC_REVENUECAT_APPLE_KEY}`, 'X-Platform': 'ios' });
  return 'clé publique acceptée';
});
await check('RevenueCat (clé Google)', ['EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY'], async () => {
  await get('https://api.revenuecat.com/v1/subscribers/verification-toi-et-moi', { Authorization: `Bearer ${E.EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY}`, 'X-Platform': 'android' });
  return 'clé publique acceptée';
});
await check('RevenueCat (webhook)', ['REVENUECAT_WEBHOOK_SECRET'], async () => 'secret présent : à recopier dans RevenueCat › Integrations › Webhooks › Authorization header (Bearer …)');
await check('Resend', ['RESEND_API_KEY', 'RESEND_FROM_EMAIL'], async () => {
  const d = await get('https://api.resend.com/domains', { Authorization: `Bearer ${E.RESEND_API_KEY}` });
  const domain = (E.RESEND_FROM_EMAIL.match(/@([^>\s]+)/) ?? [])[1];
  const found = (d.data ?? []).find((x) => x.name === domain);
  if (!found) throw new Error(`le domaine ${domain} n’est pas ajouté dans Resend › Domains`);
  if (found.status !== 'verified') throw new Error(`le domaine ${domain} n’est pas encore vérifié (statut : ${found.status})`);
  return `domaine ${domain} vérifié`;
});

const w = Math.max(...results.map((r) => r.name.length));
for (const r of results) console.log(`${r.status === 'OK' ? '✅' : r.status === 'CLÉ MANQUANTE' ? '🔑' : '❌'} ${r.name.padEnd(w)}  ${r.status}  ${r.detail}`);
console.log(`\nClés lues : SUPABASE_URL=${mask(E.EXPO_PUBLIC_SUPABASE_URL)} GEMINI=${mask(E.GEMINI_API_KEY)} RESEND=${mask(E.RESEND_API_KEY)}`);
process.exitCode = results.every((r) => r.status === 'OK') ? 0 : 1;
