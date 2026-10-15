// Recherche d'un produit précis + rappels officiels (toujours gratuits, jamais décomptés du quota).
//
// POST { barcode, context?, confirm? }            → fiche du produit (base interne, puis Open Food / Beauty / Products Facts)
// POST { action: 'search', query }                 → candidats par nom ou EAN (base interne + Open Facts)
// POST { action: 'recalls', barcode?, brand?, name? } → rappels RappelConso pour CE produit (cache product_recalls)
// POST { action: 'recall_watch' }                  → vérifie les rappels des produits de l'historique et des favoris
//
// Variables : OPEN_FACTS_ENABLED=true, OPENFOODFACTS_USER_AGENT="ToiEtMoi/1.0 (contact@…)",
//             RAPPELCONSO_ENABLED (défaut true), RAPPELCONSO_DATASET (défaut rappelconso-v2-gtin-espaces).
// Sans base réelle connectée, la réponse le dit explicitement (`database: 'not_connected'`) : aucun résultat n'est inventé.
import { adminClient, corsHeaders, json, rateLimit, requireUser } from '../_shared/http.ts';
import { assessProduct, type ProductData, type ScanContext } from '../_shared/product-rules.ts';
import { normalizeOpenFacts, normalizeSearch, productUrl, searchUrl, type NormalizedProduct, type OpenFactsKind } from '../_shared/open-facts.ts';
import { matchRecalls, parseRecallRecords, rappelConsoUrl, recallRow, sameGtin } from '../_shared/rappelconso.ts';

// deno-lint-ignore no-explicit-any
type Any = any;

const today = () => new Date().toISOString().slice(0, 10);
const openFactsEnabled = () => Deno.env.get('OPEN_FACTS_ENABLED') === 'true';
const userAgent = () => Deno.env.get('OPENFOODFACTS_USER_AGENT') || Deno.env.get('OPEN_FACTS_USER_AGENT') || 'ToiEtMoi/1.0 (contact@toietmoi.app)';
const recallsEnabled = () => Deno.env.get('RAPPELCONSO_ENABLED') !== 'false';

async function getJson(url: string, timeoutMs = 8000): Promise<unknown | null> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { headers: { 'User-Agent': userAgent(), Accept: 'application/json' }, signal: ctrl.signal });
    if (!res.ok) {
      console.error('lookup_http', new URL(url).host, res.status);
      return null;
    }
    return await res.json();
  } catch (e) {
    console.error('lookup_fetch', new URL(url).host, (e as Error).name);
    return null;
  } finally {
    clearTimeout(t);
  }
}

/** Ligne de la table products → forme normalisée commune. */
function fromLocal(p: Any): Any {
  const ingredients = p.ingredients_text ?? (Array.isArray(p.ingredients) ? p.ingredients.join(', ') : null);
  return {
    id: p.id,
    barcode: p.barcode, name: p.name, brand: p.brand, image_url: p.image_url ?? null, ingredients_text: ingredients,
    allergens: p.declared_allergens ?? [], categories: [], precautions_text: p.precautions_text ?? null, period_after_opening: p.period_after_opening ?? null,
    nutrition: p.nutrition ?? null,
    labels: { rawMilk: p.attributes?.raw_milk ?? null, alcohol: p.attributes?.alcohol ?? null, caffeine: null, sweeteners: null },
    kind: p.category === 'food' || p.category === 'drink' ? 'food' : 'product',
    product_type: p.product_type ?? null,
    data_source: p.data_source, source_url: p.source_url ?? '', data_retrieved_at: String(p.data_retrieved_at).slice(0, 10), last_modified: null,
    collaborative: /collaborati/i.test(String(p.data_source ?? '')), is_demo: p.is_demo === true,
    legacy: p,
  } as Any;
}

async function fromOpenFacts(barcode: string): Promise<NormalizedProduct | null> {
  if (!openFactsEnabled()) return null;
  for (const kind of ['food', 'beauty', 'products'] as OpenFactsKind[]) {
    const out = normalizeOpenFacts(await getJson(productUrl(kind, barcode)), kind, barcode, today());
    if (out) return out;
  }
  return null;
}

async function checkRecalls(admin: Any, product: { barcode?: string | null; brand?: string | null; name?: string | null }) {
  const status = { checked: false, source: 'RappelConso', error: null as string | null };
  const terms = [product.barcode, product.brand && product.name ? `${product.brand} ${product.name}` : null].filter(Boolean) as string[];
  if (recallsEnabled() && terms.length) {
    const dataset = Deno.env.get('RAPPELCONSO_DATASET') || undefined;
    const records = (await Promise.all(terms.map((t) => getJson(rappelConsoUrl(t, { dataset }))))).flatMap((p) => (p ? parseRecallRecords(p) : []));
    status.checked = true;
    const matches = matchRecalls(records, product);
    if (matches.length) {
      // Cache : l'insertion d'un nouveau rappel déclenche les notifications (historique et favoris)
      await admin.from('product_recalls').upsert(matches.map((m) => recallRow(m.record, product.barcode ?? null)), { onConflict: 'source_key', ignoreDuplicates: true });
    }
  }
  // Lecture du cache (inclut les rappels déjà connus, et ceux de démonstration identifiés comme tels)
  const ors = [product.barcode ? `barcode.eq.${product.barcode}` : null, product.barcode ? `gtins.cs.{${product.barcode}}` : null].filter(Boolean).join(',');
  let cached: Any[] = [];
  if (ors) {
    const { data } = await admin.from('product_recalls')
      .select('id,title,reason,risks,recommended_action,official_url,source,published_on,lot_numbers,is_demo,barcode,gtins,brand,product_name')
      .or(ors).order('published_on', { ascending: false }).limit(20);
    cached = data ?? [];
  }
  const byName = product.brand && product.name ? matchRecalls(
    ((await admin.from('product_recalls').select('id,title,reason,risks,recommended_action,official_url,source,published_on,lot_numbers,is_demo,barcode,gtins,brand,product_name').ilike('brand', product.brand).limit(50)).data ?? [])
      .map((r: Any) => ({ key: r.id, gtins: r.gtins ?? [], title: r.title, brand: r.brand, product_name: r.product_name, reason: r.reason, risks: r.risks, recommended_action: r.recommended_action, official_url: r.official_url, image_url: null, published_on: r.published_on, lot_numbers: r.lot_numbers ?? [], category: null, row: r })),
    { brand: product.brand, name: product.name },
  ) : [];
  const out = new Map<string, Any>();
  for (const r of cached) out.set(r.id, { ...r, match: 'gtin' });
  for (const m of byName) {
    const row = (m.record as Any).row;
    if (!out.has(row.id)) out.set(row.id, { ...row, match: m.match });
  }
  // Un rappel retrouvé par code-barres dont le GTIN diffère n'est pas une correspondance exacte
  const recalls = [...out.values()].map((r) => (r.match === 'gtin' && product.barcode && r.barcode && !sameGtin(r.barcode, product.barcode) && !(r.gtins ?? []).some((g: string) => sameGtin(g, product.barcode!)) ? { ...r, match: 'brand_name' } : r));
  return { recalls, status };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const auth = await requireUser(req);
  if (auth instanceof Response) return auth;
  const admin = adminClient();
  if (!(await rateLimit(admin, `scan:${auth.user.id}`, 40, 60))) return json({ error: 'rate_limited', message: 'Trop de recherches en peu de temps. Réessayez dans une minute.' }, 429);

  const body = await req.json().catch(() => ({}));
  const action = typeof body.action === 'string' ? body.action : 'lookup';
  const database = openFactsEnabled() ? 'open_facts' : 'not_connected';

  // ------------------------------------------------------------ recherche par nom ou EAN
  if (action === 'search') {
    const query = String(body.query ?? '').trim().slice(0, 80);
    if (query.length < 2) return json({ error: 'bad_query', message: 'Saisissez au moins 2 caractères.' }, 400);
    const asCode = query.replace(/\D/g, '');
    const local = /^\d{8,14}$/.test(asCode)
      ? (await admin.from('products').select('*').eq('barcode', asCode).limit(5)).data ?? []
      : (await admin.from('products').select('*').ilike('name', `%${query.replace(/[%_]/g, '')}%`).limit(8)).data ?? [];
    const candidates: Any[] = local.map((p: Any) => fromLocal(p));
    if (openFactsEnabled()) {
      if (/^\d{8,14}$/.test(asCode)) {
        const p = await fromOpenFacts(asCode);
        if (p) candidates.push(p);
      } else {
        const kinds: OpenFactsKind[] = body.kind === 'food' ? ['food'] : body.kind === 'product' ? ['beauty', 'products'] : ['food', 'beauty'];
        for (const k of kinds) candidates.push(...normalizeSearch(await getJson(searchUrl(k, query)), k, today()));
      }
    }
    return json({ candidates: candidates.slice(0, 12).map(({ legacy: _l, ...c }: Any) => c), database });
  }

  // ------------------------------------------------------------ rappels d'un produit précis
  if (action === 'recalls') {
    const barcode = body.barcode ? String(body.barcode).replace(/\D/g, '') : null;
    const { recalls, status } = await checkRecalls(admin, { barcode, brand: body.brand ?? null, name: body.name ?? null });
    return json({ recalls, recall_check: status });
  }

  // ------------------------------------------------------------ surveillance de l'historique et des favoris
  if (action === 'recall_watch') {
    if (!(await rateLimit(admin, `recall_watch:${auth.user.id}`, 4, 3600))) return json({ checked: 0, skipped: 'rate_limited' });
    const { data: scans } = await auth.client.from('product_scans').select('barcode,product_snapshot').not('barcode', 'is', null).order('created_at', { ascending: false }).limit(60);
    const seen = new Set<string>();
    let checked = 0;
    for (const s of scans ?? []) {
      if (!s.barcode || seen.has(s.barcode) || seen.size >= 20) continue;
      seen.add(s.barcode);
      await checkRecalls(admin, { barcode: s.barcode, brand: s.product_snapshot?.brand ?? null, name: s.product_snapshot?.name ?? null });
      checked++;
    }
    // Rappels déjà en cache qui concernent l'historique : notification si elle n'a pas encore été envoyée
    await auth.client.rpc('notify_my_recalls');
    return json({ checked });
  }

  // ------------------------------------------------------------ fiche produit par code-barres
  const barcode = String(body.barcode ?? '').replace(/\D/g, '');
  if (barcode.length < 8 || barcode.length > 14) return json({ error: 'bad_barcode', message: 'Code-barres non reconnu. Vous pouvez le saisir à la main.' }, 400);
  const ctx: ScanContext = {
    pregnant: body.context?.pregnant === true,
    childAgeMonths: typeof body.context?.childAgeMonths === 'number' ? body.context.childAgeMonths : null,
    childDeclaredAllergies: Array.isArray(body.context?.childDeclaredAllergies) ? body.context.childDeclaredAllergies.slice(0, 20).map(String) : [],
  };

  const { data: localRow } = await admin.from('products').select('*').eq('barcode', barcode).maybeSingle();
  const product: Any = localRow ? fromLocal(localRow) : await fromOpenFacts(barcode);
  const { recalls, status } = await checkRecalls(admin, { barcode, brand: product?.brand ?? null, name: product?.name ?? null });

  if (!product) {
    return json({
      found: false, barcode, recalls, recall_check: status, database,
      message: database === 'not_connected'
        ? 'Aucune base de produits n’est connectée : le produit ne peut pas être identifié. Photographiez la liste des ingrédients ou saisissez-la.'
        : 'Produit introuvable. Vous pouvez photographier la liste des ingrédients ou la saisir manuellement.',
    });
  }

  if (body.confirm === true) {
    await admin.from('product_scans').insert({ user_id: auth.user.id, product_id: localRow?.id ?? null, barcode, method: 'barcode', confirmed: true });
  }

  // Évaluation historique (compatibilité) : la nouvelle analyse est faite par les moteurs de règles de l'application
  const { data: premium } = await auth.client.rpc('has_premium');
  const legacy: ProductData = localRow ?? {
    name: product.name ?? 'Produit sans nom', brand: product.brand, category: product.kind === 'food' ? 'food' : 'cream',
    ingredients: product.ingredients_text ? product.ingredients_text.split(/,\s*/) : null, declared_allergens: product.allergens,
    attributes: { raw_milk: product.labels.rawMilk ?? undefined }, data_source: product.data_source, data_retrieved_at: product.data_retrieved_at, is_demo: false,
  };
  const assessment = assessProduct(legacy, ctx);
  const { legacy: _l, ...normalized } = product;
  return json({
    found: true,
    needs_confirmation: body.confirm !== true,
    database: localRow ? (localRow.is_demo ? 'demo' : 'internal') : database,
    product: {
      ...normalized,
      category: legacy.category,
      ingredients: legacy.ingredients, declared_allergens: legacy.declared_allergens,
      is_demo: localRow?.is_demo === true,
    },
    recalls,
    recall_check: status,
    assessment: premium ? assessment : { ...assessment, findings: assessment.findings.filter((f) => f.level === 'avoid_advised'), limited: true },
  });
});
