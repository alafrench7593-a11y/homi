// Recherche d'un produit précis + évaluation transparente + rappels officiels.
// POST { barcode: string, confirm?: boolean, context: { pregnant?, childAgeMonths?, childDeclaredAllergies? } }
// Sources : base interne (dont base FICTIVE de démonstration), puis Open Food Facts /
// Open Beauty Facts si OPEN_FACTS_ENABLED=true, puis rappels officiels.
import { adminClient, corsHeaders, json, rateLimit, requireUser } from '../_shared/http.ts';
import { assessProduct, type ProductData, type ScanContext } from '../_shared/product-rules.ts';

const CATEGORY_FROM_OFF = (tags: string[] = []): ProductData['category'] =>
  tags.some((t) => /beverages|boissons/.test(t)) ? 'drink' : 'food';

async function fromOpenFacts(barcode: string): Promise<ProductData | null> {
  if (Deno.env.get('OPEN_FACTS_ENABLED') !== 'true') return null;
  const ua = Deno.env.get('OPEN_FACTS_USER_AGENT') ?? 'ToiEtMoi/0.1 (contact@exemple.fr)';
  for (const [host, kind] of [['world.openfoodfacts.org', 'food'], ['world.openbeautyfacts.org', 'beauty']] as const) {
    const res = await fetch(`https://${host}/api/v2/product/${barcode}.json`, { headers: { 'User-Agent': ua } });
    if (!res.ok) continue;
    const out = await res.json();
    if (out.status !== 1 || !out.product) continue;
    const p = out.product;
    const ingredientsText: string = p.ingredients_text_fr || p.ingredients_text || '';
    return {
      name: p.product_name_fr || p.product_name || 'Produit sans nom',
      brand: p.brands || null,
      category: kind === 'food' ? CATEGORY_FROM_OFF(p.categories_tags) : 'cream',
      ingredients: ingredientsText ? ingredientsText.split(/,\s*/).map((s: string) => s.trim()).filter(Boolean) : null,
      declared_allergens: Array.isArray(p.allergens_tags) ? p.allergens_tags.map((t: string) => t.replace(/^..:/, '')) : null,
      attributes: { raw_milk: /lait cru/i.test(ingredientsText) || undefined },
      data_source: kind === 'food' ? 'Open Food Facts (base collaborative)' : 'Open Beauty Facts (base collaborative)',
      data_retrieved_at: new Date().toISOString().slice(0, 10),
      is_demo: false,
    };
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const auth = await requireUser(req);
  if (auth instanceof Response) return auth;
  const admin = adminClient();
  if (!(await rateLimit(admin, `scan:${auth.user.id}`, 30, 60))) return json({ error: 'rate_limited' }, 429);

  const body = await req.json().catch(() => ({}));
  const barcode = String(body.barcode ?? '').replace(/\D/g, '');
  if (barcode.length < 8 || barcode.length > 14) return json({ error: 'bad_barcode', message: 'Code-barres non reconnu. Vous pouvez le saisir à la main.' }, 400);
  const ctx: ScanContext = {
    pregnant: body.context?.pregnant === true,
    childAgeMonths: typeof body.context?.childAgeMonths === 'number' ? body.context.childAgeMonths : null,
    childDeclaredAllergies: Array.isArray(body.context?.childDeclaredAllergies) ? body.context.childDeclaredAllergies.slice(0, 20).map(String) : [],
  };

  const { data: local } = await admin.from('products').select('*').eq('barcode', barcode).maybeSingle();
  let product: (ProductData & { id?: string }) | null = local;
  if (!product) product = await fromOpenFacts(barcode);

  const { data: recalls } = await admin
    .from('product_recalls')
    .select('id,title,reason,recommended_action,official_url,source,published_on,lot_numbers,is_demo')
    .or(`barcode.eq.${barcode}${local?.id ? `,product_id.eq.${local.id}` : ''}`)
    .order('published_on', { ascending: false });

  if (!product) {
    return json({ found: false, barcode, recalls: recalls ?? [], message: 'Produit introuvable. Vous pouvez photographier la liste des ingrédients ou le saisir manuellement.' });
  }

  // Analyse détaillée = fonction premium ; les rappels officiels restent toujours gratuits
  const { data: premium } = await auth.client.rpc('has_premium');
  const assessment = assessProduct(product, ctx);

  if (body.confirm === true) {
    await admin.from('product_scans').insert({ user_id: auth.user.id, product_id: local?.id ?? null, barcode, method: 'barcode', confirmed: true });
  }

  return json({
    found: true,
    needs_confirmation: body.confirm !== true,
    product: {
      name: product.name, brand: product.brand, category: product.category,
      ingredients: product.ingredients, declared_allergens: product.declared_allergens,
      data_source: product.data_source, data_retrieved_at: product.data_retrieved_at, is_demo: product.is_demo ?? false,
    },
    recalls: recalls ?? [],
    assessment: premium ? assessment : { ...assessment, findings: assessment.findings.filter((f) => f.level === 'avoid_advised'), limited: true },
  });
});
